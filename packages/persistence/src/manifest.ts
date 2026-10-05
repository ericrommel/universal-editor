import { DomainError } from "@uvcp/core";
import { decodeUtf8Fatal, encodeUtf8 } from "./utf8.ts";

const FORMAT_ID = "universal-visual-creation-project";
const SCHEMA_VERSION = 1;

// This cap is only the provisional manifest, not a project-size limit.
const MANIFEST_BYTE_LIMIT = 4096;

// JSON.parse walks arrays by recursion. 4096 bytes holds 2048 brackets, and
// on this host that throws RangeError once depth passes roughly 1600, while
// depth 40 still parses. A flat manifest is depth 1. Deeper than this is
// rejected before the host parser recurses, so the failure stays a
// DomainError on every supported stack size.
const MAX_MANIFEST_NESTING = 64;

const EMPTY = "Manifest is empty.";
const TOO_LARGE = "Manifest exceeds the size limit.";
const INVALID_ENCODING = "Manifest is not UTF-8 text.";
const INVALID_JSON = "Manifest is not valid JSON.";
const DUPLICATE_KEY = "Manifest contains a duplicate key.";
const INVALID_SHAPE = "Manifest shape is not accepted.";
const UNSUPPORTED_FORMAT = "Manifest format is not supported.";
const UNSUPPORTED_SCHEMA_VERSION = "Manifest schema version is not supported.";

export type ProvisionalManifest = {
  readonly formatId: typeof FORMAT_ID;
  readonly schemaVersion: 1;
};

// Node 24's JSON.parse reviver receives this. The ES2024 lib omits it.
type JsonTokenContext = {
  readonly source?: string;
};

export function writeManifest(): Uint8Array {
  // The two constants are the whole document. JSON.stringify would walk a
  // caller-supplied object and cannot express this closed byte contract.
  const text = `{"formatId":"${FORMAT_ID}","schemaVersion":${SCHEMA_VERSION}}`;
  return encodeUtf8(text);
}

export function readManifest(input: Uint8Array): ProvisionalManifest {
  if (!(input instanceof Uint8Array)) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  if (input.byteLength === 0) {
    throw new DomainError("EMPTY", EMPTY);
  }
  // Size is checked before decoding so a large invalid encoding stays TOO_LARGE.
  if (input.byteLength > MANIFEST_BYTE_LIMIT) {
    throw new DomainError("TOO_LARGE", TOO_LARGE);
  }
  // A leading UTF-8 BOM is not JSON whitespace.
  if (hasUtf8Bom(input)) {
    throw new DomainError("INVALID_ENCODING", INVALID_ENCODING);
  }
  let text: string;
  try {
    text = decodeUtf8Fatal(input);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new DomainError("INVALID_ENCODING", INVALID_ENCODING);
    }
    throw error;
  }
  if (nestingExceedsLimit(text)) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  const parsed = parseWithSchemaSource(text);
  return manifestFrom(parsed.value, parsed.schemaSource);
}

function hasUtf8Bom(input: Uint8Array): boolean {
  return (
    input.byteLength >= 3 &&
    input[0] === 0xef &&
    input[1] === 0xbb &&
    input[2] === 0xbf
  );
}

function manifestFrom(
  value: unknown,
  schemaSource: string | undefined,
): ProvisionalManifest {
  if (!isRecord(value)) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  // Unknown keys fail as shape even when a known field would also fail.
  for (const key of Object.keys(value)) {
    if (key !== "formatId" && key !== "schemaVersion") {
      throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
    }
  }
  if (
    !Object.hasOwn(value, "formatId") ||
    !Object.hasOwn(value, "schemaVersion")
  ) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  const formatId = value.formatId;
  if (typeof formatId !== "string") {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  if (formatId !== FORMAT_ID) {
    throw new DomainError("UNSUPPORTED_FORMAT", UNSUPPORTED_FORMAT);
  }
  // A present schemaVersion other than the integer token 1 is a version
  // failure, including strings, booleans, and numbers such as 1.0 or 1e0.
  if (schemaSource !== "1") {
    throw new DomainError(
      "UNSUPPORTED_SCHEMA_VERSION",
      UNSUPPORTED_SCHEMA_VERSION,
    );
  }
  return {
    formatId: FORMAT_ID,
    schemaVersion: 1,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nestingExceedsLimit(text: string): boolean {
  let depth = 0;
  let index = 0;
  while (index < text.length) {
    const char = text.charAt(index);
    if (char === '"') {
      const next = skipQuoted(text, index);
      if (next === null) {
        return false;
      }
      index = next;
      continue;
    }
    if (char === "{" || char === "[") {
      depth += 1;
      if (depth > MAX_MANIFEST_NESTING) {
        return true;
      }
      index += 1;
      continue;
    }
    if ((char === "}" || char === "]") && depth > 0) {
      depth -= 1;
    }
    index += 1;
  }
  return false;
}

function skipQuoted(text: string, index: number): number | null {
  index += 1;
  while (index < text.length) {
    const char = text.charAt(index);
    if (char === "\\") {
      // The next source character is escaped, so a quote here is not the
      // end of the string. Brackets in the string are not structure.
      index += 2;
      continue;
    }
    if (char === '"') {
      return index + 1;
    }
    index += 1;
  }
  return null;
}

function parseWithSchemaSource(text: string): {
  readonly value: unknown;
  readonly schemaSource: string | undefined;
} {
  const sources = new Map<object, string>();
  let value: unknown;
  try {
    value = JSON.parse(text, schemaReviver(sources));
  } catch (error) {
    // The nesting cap is the stable path. This still covers a host that
    // overflows inside the cap, so the engine exception does not escape.
    if (error instanceof SyntaxError || error instanceof RangeError) {
      invalidJson();
    }
    throw error;
  }
  if (isRecord(value)) {
    rejectDuplicateKeys(text, Object.keys(value).length);
  }
  return {
    value,
    schemaSource: schemaSourceOf(value, sources),
  };
}

function schemaReviver(
  sources: Map<object, string>,
): (this: object, key: string, value: unknown) => unknown {
  const reviver = function (
    this: object,
    key: string,
    value: unknown,
    context: JsonTokenContext | undefined,
  ): unknown {
    // Keep every value. Returning undefined would delete the key.
    if (key === "schemaVersion" && typeof context?.source === "string") {
      sources.set(this, context.source);
    }
    return value;
  };
  // Node 24 passes the raw token as a third argument. The ES2024 lib omits it.
  return reviver as (this: object, key: string, value: unknown) => unknown;
}

function schemaSourceOf(
  value: unknown,
  sources: Map<object, string>,
): string | undefined {
  if (typeof value === "object" && value !== null) {
    return sources.get(value);
  }
  return undefined;
}

function rejectDuplicateKeys(text: string, parsedKeyCount: number): void {
  // JSON.parse keeps one property when two keys match, including equal
  // values and different escape spellings. Only a root duplicate can
  // change a manifest this reader would otherwise accept.
  const rawCount = countRootKeys(text);
  if (rawCount > parsedKeyCount) {
    throw new DomainError("DUPLICATE_KEY", DUPLICATE_KEY);
  }
  if (rawCount < parsedKeyCount) {
    duplicateCheckFailed();
  }
}

function countRootKeys(text: string): number {
  let index = skipWhitespace(text, 0);
  if (text.charAt(index) !== "{") {
    duplicateCheckFailed();
  }
  index += 1;
  index = skipWhitespace(text, index);
  if (text.charAt(index) === "}") {
    return 0;
  }
  let count = 0;
  while (index < text.length) {
    index = skipWhitespace(text, index);
    if (text.charAt(index) !== '"') {
      duplicateCheckFailed();
    }
    index = skipJsonString(text, index);
    count += 1;
    index = skipWhitespace(text, index);
    if (text.charAt(index) !== ":") {
      duplicateCheckFailed();
    }
    index += 1;
    index = skipJsonValue(text, index);
    index = skipWhitespace(text, index);
    const next = text.charAt(index);
    if (next === ",") {
      index += 1;
      continue;
    }
    if (next === "}") {
      return count;
    }
    duplicateCheckFailed();
  }
  duplicateCheckFailed();
}

function skipJsonValue(text: string, index: number): number {
  index = skipWhitespace(text, index);
  const char = text.charAt(index);
  if (char === '"') {
    return skipJsonString(text, index);
  }
  if (char === "{" || char === "[") {
    return skipContainer(text, index);
  }
  while (index < text.length) {
    const next = text.charAt(index);
    if (
      next === "," ||
      next === "}" ||
      next === "]" ||
      next === " " ||
      next === "\n" ||
      next === "\r" ||
      next === "\t"
    ) {
      return index;
    }
    index += 1;
  }
  duplicateCheckFailed();
}

function skipContainer(text: string, index: number): number {
  let depth = 1;
  index += 1;
  while (index < text.length && depth > 0) {
    const char = text.charAt(index);
    if (char === '"') {
      index = skipJsonString(text, index);
      continue;
    }
    if (char === "{" || char === "[") {
      depth += 1;
      index += 1;
      continue;
    }
    if (char === "}" || char === "]") {
      depth -= 1;
      index += 1;
      continue;
    }
    index += 1;
  }
  if (depth !== 0) {
    duplicateCheckFailed();
  }
  return index;
}

function skipJsonString(text: string, index: number): number {
  index += 1;
  while (index < text.length) {
    const char = text.charAt(index);
    if (char === "\\") {
      // The next source character is escaped, so a quote here is not
      // the end of the string. The key text itself is not decoded.
      index += 2;
      continue;
    }
    if (char === '"') {
      return index + 1;
    }
    index += 1;
  }
  duplicateCheckFailed();
}

function skipWhitespace(text: string, index: number): number {
  while (
    text.charAt(index) === " " ||
    text.charAt(index) === "\t" ||
    text.charAt(index) === "\n" ||
    text.charAt(index) === "\r"
  ) {
    index += 1;
  }
  return index;
}

function duplicateCheckFailed(): never {
  // A short count would hide a collapsed key. This is a defect in the
  // counter, not malformed JSON, and the message must not include input.
  throw new Error("Manifest duplicate check lost alignment.");
}

function invalidJson(): never {
  throw new DomainError("INVALID_JSON", INVALID_JSON);
}

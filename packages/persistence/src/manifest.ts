import { DomainError } from "@uvcp/core";
import { decodeUtf8Fatal, encodeUtf8 } from "./utf8.ts";

const FORMAT_ID = "universal-visual-creation-project";
const SCHEMA_VERSION = 1;

// This cap is only the provisional manifest, not a project-size limit.
const MANIFEST_BYTE_LIMIT = 4096;

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

type Cursor = {
  text: string;
  index: number;
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

function parseWithSchemaSource(text: string): {
  readonly value: unknown;
  readonly schemaSource: string | undefined;
} {
  const sources = new Map<object, string>();
  let value: unknown;
  try {
    value = JSON.parse(text, schemaReviver(sources));
  } catch (error) {
    if (error instanceof SyntaxError) {
      invalidJson();
    }
    throw error;
  }
  // The host accepted this text. The walk only finds duplicate keys that
  // JSON.parse has already collapsed, including equal values and escapes.
  rejectDuplicateKeys(text);
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

function rejectDuplicateKeys(text: string): void {
  // JSON.parse keeps the last duplicate, including keys that match only
  // after escapes are decoded. It is not the syntax authority: malformed
  // JSON never reaches this walk.
  try {
    const parser: Cursor = { text, index: 0 };
    scanValue(parser);
    skipWhitespace(parser);
    if (parser.index !== text.length) {
      invalidJson();
    }
  } catch (error) {
    if (error instanceof DomainError) {
      throw error;
    }
    // A 4096-byte value can still nest deeply enough to overflow this walk.
    if (error instanceof RangeError) {
      invalidJson();
    }
    throw error;
  }
}

function scanValue(parser: Cursor): void {
  skipWhitespace(parser);
  const char = parser.text.charAt(parser.index);
  if (char === "{") {
    scanObject(parser);
    return;
  }
  if (char === "[") {
    scanArray(parser);
    return;
  }
  if (char === '"') {
    scanString(parser);
    return;
  }
  if (char === "t") {
    scanLiteral(parser, "true");
    return;
  }
  if (char === "f") {
    scanLiteral(parser, "false");
    return;
  }
  if (char === "n") {
    scanLiteral(parser, "null");
    return;
  }
  if (char === "-" || isDigit(char)) {
    scanNumber(parser);
    return;
  }
  invalidJson();
}

function scanObject(parser: Cursor): void {
  expectChar(parser, "{");
  // A Set, not an object: a key named __proto__ must be recorded as itself.
  const keys = new Set<string>();
  skipWhitespace(parser);
  if (parser.text.charAt(parser.index) === "}") {
    parser.index += 1;
    return;
  }
  while (true) {
    skipWhitespace(parser);
    if (parser.text.charAt(parser.index) !== '"') {
      invalidJson();
    }
    const key = scanString(parser);
    skipWhitespace(parser);
    expectChar(parser, ":");
    // The key and colon are known. Do not parse a repeated field's value,
    // even when that value is missing or equal to the first.
    if (keys.has(key)) {
      throw new DomainError("DUPLICATE_KEY", DUPLICATE_KEY);
    }
    keys.add(key);
    scanValue(parser);
    skipWhitespace(parser);
    const next = parser.text.charAt(parser.index);
    if (next === ",") {
      parser.index += 1;
      continue;
    }
    if (next === "}") {
      parser.index += 1;
      return;
    }
    invalidJson();
  }
}

function scanArray(parser: Cursor): void {
  expectChar(parser, "[");
  skipWhitespace(parser);
  if (parser.text.charAt(parser.index) === "]") {
    parser.index += 1;
    return;
  }
  while (true) {
    scanValue(parser);
    skipWhitespace(parser);
    const next = parser.text.charAt(parser.index);
    if (next === ",") {
      parser.index += 1;
      continue;
    }
    if (next === "]") {
      parser.index += 1;
      return;
    }
    invalidJson();
  }
}

function scanLiteral(parser: Cursor, word: string): void {
  if (!parser.text.startsWith(word, parser.index)) {
    invalidJson();
  }
  parser.index += word.length;
}

function scanNumber(parser: Cursor): void {
  if (parser.text.charAt(parser.index) === "-") {
    parser.index += 1;
  }
  const first = parser.text.charAt(parser.index);
  if (first === "0") {
    parser.index += 1;
  } else if (isDigit(first)) {
    while (isDigit(parser.text.charAt(parser.index))) {
      parser.index += 1;
    }
  } else {
    invalidJson();
  }
  if (parser.text.charAt(parser.index) === ".") {
    parser.index += 1;
    if (!isDigit(parser.text.charAt(parser.index))) {
      invalidJson();
    }
    while (isDigit(parser.text.charAt(parser.index))) {
      parser.index += 1;
    }
  }
  const exponent = parser.text.charAt(parser.index);
  if (exponent === "e" || exponent === "E") {
    parser.index += 1;
    const sign = parser.text.charAt(parser.index);
    if (sign === "+" || sign === "-") {
      parser.index += 1;
    }
    if (!isDigit(parser.text.charAt(parser.index))) {
      invalidJson();
    }
    while (isDigit(parser.text.charAt(parser.index))) {
      parser.index += 1;
    }
  }
}

function scanString(parser: Cursor): string {
  expectChar(parser, '"');
  let result = "";
  while (parser.index < parser.text.length) {
    const char = parser.text.charAt(parser.index);
    if (char === '"') {
      parser.index += 1;
      return result;
    }
    if (char === "\\") {
      result += escapedChar(parser);
      continue;
    }
    if (char.charCodeAt(0) <= 0x1f) {
      invalidJson();
    }
    result += char;
    parser.index += 1;
  }
  invalidJson();
}

function escapedChar(parser: Cursor): string {
  parser.index += 1;
  const char = parser.text.charAt(parser.index);
  parser.index += 1;
  if (char === '"' || char === "\\" || char === "/") {
    return char;
  }
  if (char === "b") {
    return "\b";
  }
  if (char === "f") {
    return "\f";
  }
  if (char === "n") {
    return "\n";
  }
  if (char === "r") {
    return "\r";
  }
  if (char === "t") {
    return "\t";
  }
  if (char === "u") {
    const code = hex4(parser.text, parser.index);
    if (code === undefined) {
      invalidJson();
    }
    parser.index += 4;
    return String.fromCharCode(code);
  }
  invalidJson();
}

function hex4(text: string, index: number): number | undefined {
  if (index + 4 > text.length) {
    return undefined;
  }
  let value = 0;
  for (let offset = 0; offset < 4; offset += 1) {
    const digit = hexDigit(text.charAt(index + offset));
    if (digit === undefined) {
      return undefined;
    }
    value = value * 16 + digit;
  }
  return value;
}

function hexDigit(char: string): number | undefined {
  const code = char.charCodeAt(0);
  if (code >= 48 && code <= 57) {
    return code - 48;
  }
  if (code >= 65 && code <= 70) {
    return code - 55;
  }
  if (code >= 97 && code <= 102) {
    return code - 87;
  }
  return undefined;
}

function skipWhitespace(parser: Cursor): void {
  while (true) {
    const char = parser.text.charAt(parser.index);
    if (char !== " " && char !== "\t" && char !== "\n" && char !== "\r") {
      return;
    }
    parser.index += 1;
  }
}

function expectChar(parser: Cursor, expected: string): void {
  if (parser.text.charAt(parser.index) !== expected) {
    invalidJson();
  }
  parser.index += 1;
}

function isDigit(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 48 && code <= 57;
}

function invalidJson(): never {
  throw new DomainError("INVALID_JSON", INVALID_JSON);
}

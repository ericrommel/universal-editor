import { DomainError } from "@uvcp/core";
import { decodeUtf8Fatal, encodeUtf8 } from "./utf8.ts";

const FORMAT_ID = "universal-visual-creation-project";
const SCHEMA_VERSION = 1;

// This cap is only the provisional manifest, not a project-size limit.
const MANIFEST_BYTE_LIMIT = 4096;

// A 4096-byte value can still nest deeper than this process should recurse.
const MAX_JSON_DEPTH = 32;

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

type JsonNumber = {
  readonly kind: "number";
  readonly raw: string;
};

type JsonValue =
  | null
  | boolean
  | string
  | JsonNumber
  | JsonValue[]
  | Map<string, JsonValue>;

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
  return manifestFrom(parseDocument(text));
}

function hasUtf8Bom(input: Uint8Array): boolean {
  return (
    input.byteLength >= 3 &&
    input[0] === 0xef &&
    input[1] === 0xbb &&
    input[2] === 0xbf
  );
}

function manifestFrom(value: JsonValue): ProvisionalManifest {
  if (!(value instanceof Map)) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  // Unknown keys fail as shape even when a known field would also fail.
  for (const key of value.keys()) {
    if (key !== "formatId" && key !== "schemaVersion") {
      throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
    }
  }
  if (!value.has("formatId") || !value.has("schemaVersion")) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  const formatId = value.get("formatId");
  if (typeof formatId !== "string") {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  if (formatId !== FORMAT_ID) {
    throw new DomainError("UNSUPPORTED_FORMAT", UNSUPPORTED_FORMAT);
  }
  // A present schemaVersion other than the integer token 1 is a version
  // failure, including strings, booleans, and numbers such as 1.0 or 1e0.
  if (!isSchemaVersionOne(value.get("schemaVersion"))) {
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

function isSchemaVersionOne(value: JsonValue | undefined): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    value.kind === "number" &&
    value.raw === "1"
  );
}

function parseDocument(text: string): JsonValue {
  // JSON.parse keeps the last duplicate and collapses 1.0 and 1e0 to 1.
  const parser: Cursor = { text, index: 0 };
  const value = parseValue(parser, 0);
  skipWhitespace(parser);
  if (parser.index !== parser.text.length) {
    invalidJson();
  }
  return value;
}

function parseValue(parser: Cursor, depth: number): JsonValue {
  if (depth > MAX_JSON_DEPTH) {
    invalidJson();
  }
  skipWhitespace(parser);
  const char = parser.text.charAt(parser.index);
  if (char === "{") {
    return parseObject(parser, depth);
  }
  if (char === "[") {
    return parseArray(parser, depth);
  }
  if (char === '"') {
    return parseString(parser);
  }
  if (char === "t") {
    return parseLiteral(parser, "true", true);
  }
  if (char === "f") {
    return parseLiteral(parser, "false", false);
  }
  if (char === "n") {
    return parseLiteral(parser, "null", null);
  }
  if (char === "-" || isDigit(char)) {
    return parseNumber(parser);
  }
  invalidJson();
}

function parseObject(parser: Cursor, depth: number): Map<string, JsonValue> {
  expectChar(parser, "{");
  const fields = new Map<string, JsonValue>();
  skipWhitespace(parser);
  if (parser.text.charAt(parser.index) === "}") {
    parser.index += 1;
    return fields;
  }
  while (true) {
    skipWhitespace(parser);
    if (parser.text.charAt(parser.index) !== '"') {
      invalidJson();
    }
    const key = parseString(parser);
    skipWhitespace(parser);
    expectChar(parser, ":");
    // The key is already illegal. Do not read the rest of its value.
    if (fields.has(key)) {
      throw new DomainError("DUPLICATE_KEY", DUPLICATE_KEY);
    }
    fields.set(key, parseValue(parser, depth + 1));
    skipWhitespace(parser);
    const next = parser.text.charAt(parser.index);
    if (next === ",") {
      parser.index += 1;
      continue;
    }
    if (next === "}") {
      parser.index += 1;
      return fields;
    }
    invalidJson();
  }
}

function parseArray(parser: Cursor, depth: number): JsonValue[] {
  expectChar(parser, "[");
  const items: JsonValue[] = [];
  skipWhitespace(parser);
  if (parser.text.charAt(parser.index) === "]") {
    parser.index += 1;
    return items;
  }
  while (true) {
    items.push(parseValue(parser, depth + 1));
    skipWhitespace(parser);
    const next = parser.text.charAt(parser.index);
    if (next === ",") {
      parser.index += 1;
      continue;
    }
    if (next === "]") {
      parser.index += 1;
      return items;
    }
    invalidJson();
  }
}

function parseLiteral(
  parser: Cursor,
  word: string,
  value: boolean | null,
): boolean | null {
  if (!parser.text.startsWith(word, parser.index)) {
    invalidJson();
  }
  parser.index += word.length;
  return value;
}

function parseNumber(parser: Cursor): JsonNumber {
  const start = parser.index;
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
  return {
    kind: "number",
    raw: parser.text.slice(start, parser.index),
  };
}

function parseString(parser: Cursor): string {
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

import assert from "node:assert/strict";
import test from "node:test";
import { DomainError } from "@uvcp/core";
import { checkEntryNames } from "./entry-name.ts";
import { readManifest, writeManifest } from "./manifest.ts";

const SENTINEL = "SENTINEL_INPUT_BYTES_9f3a";
const FORMAT_ID = "universal-visual-creation-project";
const CANONICAL = `{"formatId":"${FORMAT_ID}","schemaVersion":1}`;

test("the writer emits the closed manifest bytes", () => {
  const bytes = writeManifest();
  const again = writeManifest();
  assert.deepEqual(bytes, new TextEncoder().encode(CANONICAL));
  assert.notEqual(bytes, again);
  assert.equal(bytes.byteLength, CANONICAL.length);
  assert.equal(bytes[0], 0x7b);
  assert.equal(bytes[bytes.byteLength - 1], 0x7d);
  assert.equal(bytes.includes(0x20), false);
  assert.equal(bytes.includes(0x0a), false);
  assert.equal(bytes[0] === 0xef, false);
});

test("a manifest round-trip returns a fresh value and no scene", () => {
  const first = readManifest(writeManifest());
  const second = readManifest(writeManifest());
  assert.deepEqual(first, { formatId: FORMAT_ID, schemaVersion: 1 });
  assert.equal(typeof first.schemaVersion, "number");
  assert.notEqual(first, second);
  assert.deepEqual(Object.keys(first).sort(), ["formatId", "schemaVersion"]);
});

test("insignificant whitespace and either key order are accepted", () => {
  const texts = [
    CANONICAL,
    `{\n\t"schemaVersion": 1,\r\n"formatId": "${FORMAT_ID}"\r\n}`,
    `{ "formatId" : "${FORMAT_ID}" , "schemaVersion" : 1 }`,
    `{"\\u0066ormatId":"${FORMAT_ID}","schemaVersion":1}`,
    `{"formatId":"\\u0075niversal-visual-creation-project","schemaVersion":1}`,
  ];
  for (const text of texts) {
    const manifest = readManifest(textBytes(text));
    assert.deepEqual(manifest, { formatId: FORMAT_ID, schemaVersion: 1 });
  }
});

test("duplicate keys are rejected before shape checks", () => {
  const texts = [
    `{"formatId":"${FORMAT_ID}","formatId":"${SENTINEL}","schemaVersion":1}`,
    `{"formatId":"${SENTINEL}","formatId":"${FORMAT_ID}","schemaVersion":1}`,
    `{"formatId":"${FORMAT_ID}","schemaVersion":1,"schemaVersion":1}`,
    `{"formatId":"${FORMAT_ID}","schemaVersion":1,"schema\\u0056ersion":2}`,
    `{"a":1,"\\u0061":2}`,
    `{"__proto__":1,"__proto__":1}`,
  ];
  for (const text of texts) {
    expectManifest(
      textBytes(text),
      "DUPLICATE_KEY",
      "Manifest contains a duplicate key.",
    );
  }
});

test("a nested duplicate is the wrong manifest shape", () => {
  const texts = [
    `{"formatId":{"a":1,"a":2},"schemaVersion":1}`,
    `{"formatId":"${FORMAT_ID}","schemaVersion":1,"nested":{"b":1,"b":2}}`,
    `{"formatId":"${FORMAT_ID}","schemaVersion":1,"list":[{"b":1,"b":2}]}`,
  ];
  for (const text of texts) {
    expectManifest(
      textBytes(text),
      "INVALID_SHAPE",
      "Manifest shape is not accepted.",
    );
  }
});

test("malformed manifests are rejected whole", () => {
  expectManifest(new Uint8Array(0), "EMPTY", "Manifest is empty.");
  expectManifest(
    new Uint8Array(4097),
    "TOO_LARGE",
    "Manifest exceeds the size limit.",
  );
  expectManifest(
    textBytes(`${SENTINEL}${" ".repeat(4097)}`),
    "TOO_LARGE",
    "Manifest exceeds the size limit.",
  );
  expectManifest(
    withBom(CANONICAL),
    "INVALID_ENCODING",
    "Manifest is not UTF-8 text.",
  );
  expectManifest(
    bomThen(new Uint8Array(4094)),
    "TOO_LARGE",
    "Manifest exceeds the size limit.",
  );
  expectManifest(
    new Uint8Array([0xef, 0xbb, 0xbf]),
    "INVALID_ENCODING",
    "Manifest is not UTF-8 text.",
  );
  expectManifest(
    new Uint8Array([0xff]),
    "INVALID_ENCODING",
    "Manifest is not UTF-8 text.",
  );
  expectManifest(
    new Uint8Array([0xc3]),
    "INVALID_ENCODING",
    "Manifest is not UTF-8 text.",
  );
  expectManifest(textBytes(""), "EMPTY", "Manifest is empty.");
  expectManifest(
    textBytes("   \n\t\r"),
    "INVALID_JSON",
    "Manifest is not valid JSON.",
  );
  expectManifest(
    textBytes(`${CANONICAL}[]`),
    "INVALID_JSON",
    "Manifest is not valid JSON.",
  );
  expectManifest(
    textBytes(`${CANONICAL} //`),
    "INVALID_JSON",
    "Manifest is not valid JSON.",
  );
  expectManifest(textBytes("{"), "INVALID_JSON", "Manifest is not valid JSON.");
  expectManifest(
    textBytes(`{"formatId":"${FORMAT_ID}","schemaVersion":1,"schemaVersion":}`),
    "INVALID_JSON",
    "Manifest is not valid JSON.",
  );
  expectManifest(
    textBytes(`{"formatId":"${FORMAT_ID}","schemaVersion":1,}`),
    "INVALID_JSON",
    "Manifest is not valid JSON.",
  );
  expectManifest(
    textBytes(`{"formatId":"${FORMAT_ID}","schemaVersion":01}`),
    "INVALID_JSON",
    "Manifest is not valid JSON.",
  );
  expectManifest(
    textBytes(`{"formatId":"${FORMAT_ID}","schemaVersion":+1}`),
    "INVALID_JSON",
    "Manifest is not valid JSON.",
  );
  expectManifest(
    textBytes(`{"formatId":"${FORMAT_ID}","schemaVersion":1.`),
    "INVALID_JSON",
    "Manifest is not valid JSON.",
  );
  expectManifest(
    textBytes(`{"formatId":"${SENTINEL}\u0001","schemaVersion":1}`),
    "INVALID_JSON",
    "Manifest is not valid JSON.",
  );
  expectManifest(
    textBytes(`{"formatId":"\\u12","schemaVersion":1}`),
    "INVALID_JSON",
    "Manifest is not valid JSON.",
  );
  expectManifest(
    textBytes("\v"),
    "INVALID_JSON",
    "Manifest is not valid JSON.",
  );
});

test("the wrong shape, format, and schema version are distinct", () => {
  expectManifest(
    textBytes("[]"),
    "INVALID_SHAPE",
    "Manifest shape is not accepted.",
  );
  expectManifest(
    textBytes("null"),
    "INVALID_SHAPE",
    "Manifest shape is not accepted.",
  );
  expectManifest(
    textBytes("true"),
    "INVALID_SHAPE",
    "Manifest shape is not accepted.",
  );
  expectManifest(
    textBytes(`"${FORMAT_ID}"`),
    "INVALID_SHAPE",
    "Manifest shape is not accepted.",
  );
  expectManifest(
    textBytes("1"),
    "INVALID_SHAPE",
    "Manifest shape is not accepted.",
  );
  expectManifest(
    textBytes("{}"),
    "INVALID_SHAPE",
    "Manifest shape is not accepted.",
  );
  expectManifest(
    textBytes(`{"formatId":"${FORMAT_ID}"}`),
    "INVALID_SHAPE",
    "Manifest shape is not accepted.",
  );
  expectManifest(
    textBytes('{"schemaVersion":1}'),
    "INVALID_SHAPE",
    "Manifest shape is not accepted.",
  );
  expectManifest(
    textBytes(`{"formatId":1,"schemaVersion":1}`),
    "INVALID_SHAPE",
    "Manifest shape is not accepted.",
  );
  expectManifest(
    textBytes(`{"formatId":"${FORMAT_ID}","schemaVersion":1,"scene":{}}`),
    "INVALID_SHAPE",
    "Manifest shape is not accepted.",
  );
  expectManifest(
    textBytes(`{"formatId":"${SENTINEL}","schemaVersion":2,"extra":true}`),
    "INVALID_SHAPE",
    "Manifest shape is not accepted.",
  );
  expectManifest(
    textBytes(`{"formatId":"${SENTINEL}","schemaVersion":1}`),
    "UNSUPPORTED_FORMAT",
    "Manifest format is not supported.",
  );
  expectManifest(
    textBytes(`{"formatId":"universal-\\"visual","schemaVersion":1}`),
    "UNSUPPORTED_FORMAT",
    "Manifest format is not supported.",
  );
  const versionTokens = [
    "2",
    "0",
    "1.0",
    "1e0",
    "1E+0",
    "-1",
    '"1"',
    "true",
    "null",
    "[]",
    "{}",
  ];
  for (const token of versionTokens) {
    expectManifest(
      textBytes(`{"formatId":"${FORMAT_ID}","schemaVersion":${token}}`),
      "UNSUPPORTED_SCHEMA_VERSION",
      "Manifest schema version is not supported.",
    );
  }
  expectManifest(
    nestedArrays(2),
    "INVALID_SHAPE",
    "Manifest shape is not accepted.",
  );
  expectManifest(
    nestedArrays(40),
    "INVALID_SHAPE",
    "Manifest shape is not accepted.",
  );
});

test("4096 bytes are accepted and 4097 bytes are not parsed", () => {
  const accepted = sizedManifest(4096);
  assert.equal(accepted.byteLength, 4096);
  assert.deepEqual(readManifest(accepted), {
    formatId: FORMAT_ID,
    schemaVersion: 1,
  });
  expectManifest(
    sizedManifest(4097),
    "TOO_LARGE",
    "Manifest exceeds the size limit.",
  );
});

test("an own proto key is rejected and does not change Object.prototype", () => {
  const marker = "uvcpPolluted";
  assert.equal(Object.hasOwn(Object.prototype, marker), false);
  expectManifest(
    textBytes(
      `{"__proto__":{"${marker}":"${SENTINEL}"},"formatId":"${FORMAT_ID}","schemaVersion":1}`,
    ),
    "INVALID_SHAPE",
    "Manifest shape is not accepted.",
  );
  assert.equal(Object.hasOwn(Object.prototype, marker), false);
});

test("a non-byte input is a shape failure and does not echo the value", () => {
  expectManifest(
    SENTINEL as unknown as Uint8Array,
    "INVALID_SHAPE",
    "Manifest shape is not accepted.",
  );
});

test("entry names accept relative NFC paths inside the byte limit", () => {
  checkEntryNames([]);
  checkEntryNames(["a"]);
  checkEntryNames([
    "Assets/hero.png",
    ".hidden",
    "..hidden",
    "caf\u00e9/menu",
    "my file",
    "\u0080",
    "a".repeat(255),
    "\u00e9".repeat(127),
    "k",
  ]);
});

test("hostile entry names are rejected", () => {
  const rejected = [
    "..",
    "../x",
    "foo/../bar",
    "foo/bar/..",
    "/abs",
    "foo/bar/",
    "foo//bar",
    "foo/./bar",
    ".",
    "./foo",
    "foo\\bar",
    "\\..\\windows",
    "C:foo",
    "foo:bar",
    "",
    "e\u0301",
    "\u212a",
    "a".repeat(256),
    "\u00e9".repeat(128),
    "\0",
    "\u007f",
    "\n",
    "\t",
    `../${SENTINEL}`,
  ];
  for (const name of rejected) {
    expectEntry([name], "ENTRY_NAME_REJECTED", "Entry name is not accepted.");
  }
  expectEntry(
    ["caf\u00e9", "cafe\u0301"],
    "ENTRY_NAME_REJECTED",
    "Entry name is not accepted.",
  );
  expectEntry(
    ["../x", "A", "a"],
    "ENTRY_NAME_REJECTED",
    "Entry name is not accepted.",
  );
  expectEntry(
    [1 as unknown as string],
    "ENTRY_NAME_REJECTED",
    "Entry name is not accepted.",
  );
  expectEntry(
    SENTINEL as unknown as readonly string[],
    "ENTRY_NAME_REJECTED",
    "Entry name is not accepted.",
  );
});

test("ASCII case-fold collisions are rejected and Unicode folds are not", () => {
  expectEntry(
    ["Assets/A", "assets/a"],
    "ENTRY_NAME_CONFLICT",
    "Entry names collide.",
  );
  expectEntry(["A", "a"], "ENTRY_NAME_CONFLICT", "Entry names collide.");
  expectEntry(["a", "a"], "ENTRY_NAME_CONFLICT", "Entry names collide.");
  expectEntry(
    ["ok", "Foo/Bar", "foo/bar"],
    "ENTRY_NAME_CONFLICT",
    "Entry names collide.",
  );
  checkEntryNames(["\u0130", "i\u0307"]);
  checkEntryNames(["\u0130", "i"]);
});

function textBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function sizedManifest(length: number): Uint8Array {
  const spaces = length - CANONICAL.length;
  assert.ok(spaces >= 0);
  return textBytes(`{${" ".repeat(spaces)}${CANONICAL.slice(1)}`);
}

function withBom(text: string): Uint8Array {
  return bomThen(textBytes(text));
}

function bomThen(body: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(3 + body.byteLength);
  bytes[0] = 0xef;
  bytes[1] = 0xbb;
  bytes[2] = 0xbf;
  bytes.set(body, 3);
  return bytes;
}

function nestedArrays(depth: number): Uint8Array {
  let text = "0";
  for (let count = 0; count < depth; count += 1) {
    text = `[${text}]`;
  }
  return textBytes(text);
}

function expectManifest(
  bytes: Uint8Array,
  code: string,
  message: string,
): void {
  try {
    readManifest(bytes);
  } catch (error) {
    assertNoEcho(error, code, message);
    return;
  }
  assert.fail(`expected ${code}`);
}

function expectEntry(
  names: readonly string[],
  code: string,
  message: string,
): void {
  try {
    checkEntryNames(names);
  } catch (error) {
    assertNoEcho(error, code, message);
    return;
  }
  assert.fail(`expected ${code}`);
}

function assertNoEcho(error: unknown, code: string, message: string): void {
  assert.ok(error instanceof DomainError);
  assert.equal(error.code, code);
  assert.equal(error.message, message);
  assert.equal(error.message.includes(SENTINEL), false);
  assert.equal(String(error.code).includes(SENTINEL), false);
  assert.equal(JSON.stringify(error).includes(SENTINEL), false);
}

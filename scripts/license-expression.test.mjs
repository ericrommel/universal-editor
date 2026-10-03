import assert from "node:assert/strict";
import test from "node:test";
import { expressionAllowed, licenseText } from "./license-expression.mjs";

test("every disjunct of an OR must be permissive", () => {
  assert.equal(expressionAllowed("MIT"), true);
  assert.equal(expressionAllowed("MIT OR Apache-2.0"), true);
  assert.equal(expressionAllowed("Apache-2.0 OR MIT"), true);
  assert.equal(expressionAllowed("MIT OR GPL-3.0-only"), false);
  assert.equal(expressionAllowed("MIT OR AGPL-3.0-only"), false);
  assert.equal(expressionAllowed("Apache-2.0 OR SSPL-1.0"), false);
  assert.equal(expressionAllowed("ISC OR BUSL-1.1"), false);
  assert.equal(expressionAllowed("MIT OR LGPL-2.1-only"), false);
});

test("every conjunct of an AND must be permissive", () => {
  assert.equal(expressionAllowed("MIT AND Apache-2.0"), true);
  assert.equal(expressionAllowed("MIT AND GPL-3.0-only"), false);
  assert.equal(expressionAllowed("(MIT OR Apache-2.0) AND ISC"), true);
  assert.equal(expressionAllowed("(MIT OR GPL-3.0-only) AND ISC"), false);
});

test("unknown, missing, and exceptions fail closed", () => {
  assert.equal(expressionAllowed(""), false);
  assert.equal(expressionAllowed("NOASSERTION"), false);
  assert.equal(expressionAllowed("UNKNOWN"), false);
  assert.equal(expressionAllowed("MIT WITH LLVM-exception"), false);
  assert.equal(expressionAllowed("MIT+"), false);
  assert.equal(expressionAllowed("UNLICENSED"), false);
  assert.equal(expressionAllowed("Unlicense"), true);
  assert.equal(expressionAllowed("BlueOak-1.0.0"), true);
  assert.equal(licenseText({ license: "MIT" }), "MIT");
  assert.equal(licenseText({ license: { type: "Apache-2.0" } }), "Apache-2.0");
  assert.equal(licenseText({ licenses: [{ type: "MIT" }] }), "");
  assert.equal(licenseText({}), "");
});

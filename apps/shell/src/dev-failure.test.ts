import assert from "node:assert/strict";
import test from "node:test";
import { devFailureDecision } from "./dev-failure.ts";

test("an empty value and 0 let startup succeed", () => {
  assert.equal(devFailureDecision(""), "succeed");
  assert.equal(devFailureDecision("0"), "succeed");
});

test("1 forces failure and every other string is invalid", () => {
  assert.equal(devFailureDecision("1"), "force");
  assert.equal(devFailureDecision("2"), "invalid");
  assert.equal(devFailureDecision(" 1"), "invalid");
  assert.equal(devFailureDecision("1 "), "invalid");
  assert.equal(devFailureDecision("01"), "invalid");
  assert.equal(devFailureDecision("true"), "invalid");
});

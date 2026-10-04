import assert from "node:assert/strict";
import test from "node:test";

test("M0 failure-propagation probe", () => {
  assert.fail("M0 failure-propagation probe: this test must fail");
});

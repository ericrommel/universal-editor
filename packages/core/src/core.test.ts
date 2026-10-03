import assert from "node:assert/strict";
import test from "node:test";
import { DomainError } from "./domain-error.ts";
import {
  canonicalizeFiniteNumber,
  canonicalizeFiniteTriple,
} from "./number.ts";

const SENTINEL = "SENTINEL_INPUT_BYTES_9f3a";

test("finite numbers pass through and -0 becomes 0", () => {
  assert.equal(Object.is(canonicalizeFiniteNumber(0), 0), true);
  assert.equal(Object.is(canonicalizeFiniteNumber(-0), 0), true);
  assert.equal(Object.is(canonicalizeFiniteNumber(-0), -0), false);
  assert.equal(canonicalizeFiniteNumber(1), 1);
  assert.equal(canonicalizeFiniteNumber(-1), -1);
  assert.equal(canonicalizeFiniteNumber(0.5), 0.5);
  assert.equal(
    Object.is(canonicalizeFiniteNumber(Number.MIN_VALUE), Number.MIN_VALUE),
    true,
  );
  assert.equal(
    Object.is(canonicalizeFiniteNumber(Number.MAX_VALUE), Number.MAX_VALUE),
    true,
  );
});

test("non-finite values and non-numbers throw NON_FINITE_NUMBER", () => {
  const rejected: unknown[] = [
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    "1",
    "",
    true,
    null,
    undefined,
    { marker: SENTINEL },
    [],
    Object(1),
    new Number(0),
    1n,
    Symbol("1"),
    () => 1,
  ];
  for (const value of rejected) {
    assertDomainError(
      () => canonicalizeFiniteNumber(value),
      "NON_FINITE_NUMBER",
      "Expected a finite number.",
    );
  }
});

test("a finite triple is a fresh canonical array", () => {
  const input = [1, -0, 2];
  const first = canonicalizeFiniteTriple(input);
  const second = canonicalizeFiniteTriple(input);
  assert.deepEqual(first, [1, 0, 2]);
  assert.equal(Object.is(first[1], 0), true);
  assert.equal(Object.is(first[1], -0), false);
  assert.notEqual(first, second);
  assert.notEqual(first, input);
  input[0] = 9;
  assert.equal(first[0], 1);
});

test("a bad triple throws and is not repaired", () => {
  const rejected: unknown[] = [
    [1, Number.NaN, 3],
    [1, Number.POSITIVE_INFINITY, 3],
    [1, "2", 3],
    [1, 2],
    [1, 2, 3, 4],
    [],
    [1, undefined, 3],
    "1,2,3",
    { 0: 1, 1: 2, 2: 3, length: 3, marker: SENTINEL },
    null,
  ];
  for (const value of rejected) {
    assertDomainError(
      () => canonicalizeFiniteTriple(value),
      "NON_FINITE_NUMBER",
      "Expected a finite number.",
    );
  }
  const sparse: unknown[] = [1, 2, 3];
  delete sparse[1];
  assertDomainError(
    () => canonicalizeFiniteTriple(sparse),
    "NON_FINITE_NUMBER",
    "Expected a finite number.",
  );
});

function assertDomainError(
  run: () => void,
  code: string,
  message: string,
): void {
  try {
    run();
  } catch (error) {
    assert.ok(error instanceof DomainError);
    assert.ok(error instanceof Error);
    assert.equal(error.name, "DomainError");
    assert.equal(error.code, code);
    assert.equal(error.message, message);
    assert.equal(error.message.includes(SENTINEL), false);
    assert.equal(JSON.stringify(error).includes(SENTINEL), false);
    return;
  }
  assert.fail("expected DomainError");
}

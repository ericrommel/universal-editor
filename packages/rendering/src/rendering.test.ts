import assert from "node:assert/strict";
import test from "node:test";
import { renderNull } from "./null-renderer.ts";

test("a fractional device-pixel ratio is recorded on the null snapshot", () => {
  const result = renderNull(8, 4, 1.5);
  const again = renderNull(8, 4, 1.5);
  assert.equal(result.backend, null);
  assert.equal(result.device, "not-requested");
  assert.equal("lost" in result, false);
  assert.deepEqual(result.snapshot, {
    width: 12,
    height: 6,
    devicePixelRatio: 1.5,
    clear: { space: "srgb", red: 0, green: 0, blue: 0, alpha: 1 },
    drawList: [],
  });
  assert.equal("lost" in result.snapshot, false);
  assert.notEqual(result, again);
  assert.notEqual(result.snapshot, again.snapshot);
});

test("an integer ratio uses the same physical-size rule", () => {
  const result = renderNull(3, 5, 2);
  assert.equal(result.snapshot.width, 6);
  assert.equal(result.snapshot.height, 10);
  assert.equal(result.snapshot.devicePixelRatio, 2);
  assert.equal(result.snapshot.drawList.length, 0);
});

test("a null snapshot cannot be mutated into a shared scene", () => {
  const result = renderNull(8, 4, 1.5);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.snapshot), true);
  assert.equal(Object.isFrozen(result.snapshot.clear), true);
  assert.equal(Object.isFrozen(result.snapshot.drawList), true);
  const clear = result.snapshot.clear as { red: number };
  assert.throws(() => {
    clear.red = 1;
  }, TypeError);
  const drawList = result.snapshot.drawList as unknown[];
  assert.throws(() => {
    drawList.push(1);
  }, TypeError);
  const again = renderNull(8, 4, 1.5);
  assert.equal(again.snapshot.clear.red, 0);
  assert.equal(again.snapshot.drawList.length, 0);
  assert.equal(again.snapshot.clear, result.snapshot.clear);
  assert.equal(again.snapshot.drawList, result.snapshot.drawList);
});

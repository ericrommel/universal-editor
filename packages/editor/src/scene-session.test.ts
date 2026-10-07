import assert from "node:assert/strict";
import test from "node:test";
import { assistantMessages } from "@uvcp/ai";
import { applySceneActions, createSceneHandle } from "./scene-session.ts";

test("created objects stay in the scene and can be edited", () => {
  const empty = createSceneHandle();
  assert.deepEqual(empty.facts, []);
  const created = applySceneActions(empty, [
    {
      type: "createRectangle",
      id: "r1",
      width: 2,
      height: 1,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
    {
      type: "createBox",
      id: "b1",
      width: 1,
      height: 2,
      depth: 3,
      position: [4, 0, 0],
      rotation: [0, 0, 0],
    },
  ]);
  assert.equal(created.ok, true);
  if (!created.ok) {
    return;
  }
  assert.equal(created.summary, "Created rectangle r1. Created box b1.");
  const moved = applySceneActions(created.handle, [
    { type: "move", id: "r1", position: [-0, 2, 0] },
    { type: "rotate", id: "b1", rotation: [0, 30, 0] },
    { type: "resize", id: "b1", width: 2, height: 2, depth: 2 },
  ]);
  assert.equal(moved.ok, true);
  if (!moved.ok) {
    return;
  }
  const rectangle = moved.handle.facts.find((fact) => fact.id === "r1");
  const box = moved.handle.facts.find((fact) => fact.id === "b1");
  assert.deepEqual(rectangle?.position, [0, 2, 0]);
  assert.deepEqual(box?.rotation, [0, 30, 0]);
  assert.equal(box?.width, 2);
  assert.equal(box?.depth, 2);
  assert.deepEqual(box?.position, [4, 0, 0]);
});

test("a rejected action leaves the previous scene in place", () => {
  const empty = createSceneHandle();
  const rejected = applySceneActions(empty, [
    {
      type: "createRectangle",
      id: "r1",
      width: 1,
      height: 1,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
    { type: "resize", id: "missing", width: 1, height: 1 },
  ]);
  assert.equal(rejected.ok, false);
  if (rejected.ok) {
    return;
  }
  assert.equal(rejected.handle, empty);
  assert.deepEqual(empty.facts, []);
  assert.match(rejected.message, /Nothing was changed\.$/);
  const zero = applySceneActions(empty, [
    {
      type: "createRectangle",
      id: "r1",
      width: 0,
      height: 1,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
  ]);
  assert.equal(zero.ok, false);
  if (!zero.ok) {
    assert.equal(
      zero.message,
      `Scene extent is not accepted. ${assistantMessages.unchanged}`,
    );
  }
});

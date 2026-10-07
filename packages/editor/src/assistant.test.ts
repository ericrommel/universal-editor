import assert from "node:assert/strict";
import test from "node:test";
import { assistantMessages } from "@uvcp/ai";
import { applyAssistantActions } from "./assistant.ts";
import { createHistory, shapesOf } from "./document.ts";

test("the assistant creates objects the editor can move and undo", () => {
  const created = applyAssistantActions(createHistory(), [
    {
      type: "createRectangle",
      id: "r1",
      x: 40,
      y: 50,
      width: 160,
      height: 100,
      rotation: 0,
    },
    {
      type: "createBox",
      id: "b1",
      x: 220,
      y: 50,
      width: 120,
      height: 80,
      depth: 48,
      rotation: 15,
    },
  ]);
  assert.equal(created.ok, true);
  if (!created.ok) {
    return;
  }
  assert.equal(created.summary, "Created rectangle r1. Created box b1.");
  const moved = applyAssistantActions(created.history, [
    { type: "move", id: "r1", x: 10, y: 12 },
    { type: "rotate", id: "r1", degrees: 30 },
    { type: "resize", id: "b1", width: 90, height: 70, depth: 40 },
  ]);
  assert.equal(moved.ok, true);
  if (!moved.ok) {
    return;
  }
  const shapes = shapesOf(moved.history.present);
  assert.equal(shapes[0]?.x, 10);
  assert.equal(shapes[0]?.rotation, 30);
  assert.equal(shapes[1]?.width, 90);
  assert.equal(shapes[1]?.depth, 40);
  const rejected = applyAssistantActions(moved.history, [
    {
      type: "createRectangle",
      id: "r2",
      x: 0,
      y: 0,
      width: 0,
      height: 10,
      rotation: 0,
    },
  ]);
  assert.equal(rejected.ok, false);
  if (!rejected.ok) {
    assert.equal(rejected.history, moved.history);
    assert.equal(
      rejected.message,
      `Scene extent is not accepted. ${assistantMessages.unchanged}`,
    );
  }
  assert.deepEqual(moved.history.present.scene.rootIds, ["r1", "b1"]);
});

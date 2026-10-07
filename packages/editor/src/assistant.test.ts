import assert from "node:assert/strict";
import test from "node:test";
import { assistantMessages } from "@uvcp/ai";
import { applyAssistantActions } from "./assistant.ts";
import { createHistory, shapesOf, undo } from "./document.ts";

const createdShapes = [
  {
    id: "r1",
    kind: "rectangle",
    x: 40,
    y: 50,
    width: 160,
    height: 100,
    depth: null,
    rotation: 0,
  },
  {
    id: "b1",
    kind: "box",
    x: 220,
    y: 50,
    width: 120,
    height: 80,
    depth: 48,
    rotation: 15,
  },
] as const;

const editedShapes = [
  {
    id: "r1",
    kind: "rectangle",
    x: 10,
    y: 12,
    width: 140,
    height: 90,
    depth: null,
    rotation: 30,
  },
  {
    id: "b1",
    kind: "box",
    x: 300,
    y: 80,
    width: 90,
    height: 70,
    depth: 40,
    rotation: 45,
  },
] as const;

test("assistant edits stay in the editor document until undo", () => {
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
  assert.deepEqual(shapesOf(created.history.present), createdShapes);

  const edited = applyAssistantActions(created.history, [
    { type: "move", id: "r1", x: 10, y: 12 },
    { type: "rotate", id: "r1", degrees: 30 },
    { type: "resize", id: "r1", width: 140, height: 90 },
    { type: "move", id: "b1", x: 300, y: 80 },
    { type: "rotate", id: "b1", degrees: 45 },
    { type: "resize", id: "b1", width: 90, height: 70, depth: 40 },
  ]);
  assert.equal(edited.ok, true);
  if (!edited.ok) {
    return;
  }
  assert.deepEqual(shapesOf(edited.history.present), editedShapes);

  const rejected = applyAssistantActions(edited.history, [
    { type: "move", id: "r1", x: 1, y: 1 },
    { type: "resize", id: "b1", width: 10, height: 10, depth: 10 },
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
    assert.equal(rejected.history, edited.history);
    assert.equal(
      rejected.message,
      `Scene extent is not accepted. ${assistantMessages.unchanged}`,
    );
  }
  assert.deepEqual(shapesOf(rejected.history.present), editedShapes);
  assert.deepEqual(shapesOf(edited.history.present), editedShapes);
  assert.deepEqual(
    shapesOf(undo(edited.history).present),
    shapesOf(created.history.present),
  );
});

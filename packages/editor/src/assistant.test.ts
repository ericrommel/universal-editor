import assert from "node:assert/strict";
import test from "node:test";
import { assistantMessages } from "@uvcp/ai";
import { createScene, insertNode } from "@uvcp/core";
import { applyAssistantActions } from "./assistant.ts";
import {
  commitPresent,
  createHistory,
  shapesOf,
  sheetShapes,
  undo,
} from "./document.ts";

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

function assertSheet(
  actual: readonly { readonly rotation: number }[],
  expected: readonly { readonly rotation: number }[],
): void {
  assert.deepEqual(
    actual.map((shape) => ({ ...shape, rotation: 0 })),
    expected.map((shape) => ({ ...shape, rotation: 0 })),
  );
  for (const [index, shape] of actual.entries()) {
    const wanted = expected[index];
    assert.ok(wanted !== undefined);
    assert.ok(Math.abs(shape.rotation - wanted.rotation) < 1e-9);
  }
}

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
  assertSheet(shapesOf(created.history.present), createdShapes);
  const stored = created.history.present.scene.nodes.b1?.transform.rotation[2];
  assert.ok(stored !== undefined);
  assert.ok(Math.abs(stored - (15 * Math.PI) / 180) < 1e-9);

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
  assertSheet(shapesOf(edited.history.present), editedShapes);

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
  assertSheet(shapesOf(rejected.history.present), editedShapes);
  assertSheet(shapesOf(edited.history.present), editedShapes);
  assert.deepEqual(
    shapesOf(undo(edited.history).present),
    shapesOf(created.history.present),
  );
});

test("assistant edits use the size and position shown on the sheet", () => {
  let scene = createScene();
  scene = insertNode(scene, {
    id: "parent",
    kind: "rectangle",
    parentId: null,
    index: 0,
    width: 10,
    height: 10,
    transform: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [2, 2, 2],
    },
  });
  scene = insertNode(scene, {
    id: "child",
    kind: "rectangle",
    parentId: "parent",
    index: 0,
    width: 4,
    height: 3,
    transform: {
      position: [1, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  });
  const history = commitPresent(createHistory(), {
    scene,
    selectedId: "child",
  });
  const edited = applyAssistantActions(history, [
    { type: "move", id: "child", x: 8, y: 4 },
    { type: "resize", id: "child", width: 10, height: 6 },
  ]);
  assert.equal(edited.ok, true);
  if (!edited.ok) {
    return;
  }
  const child = edited.history.present.scene.nodes.child;
  assert.equal(child?.transform.position[0], 4);
  assert.equal(child?.transform.position[1], 2);
  assert.equal(child?.width, 5);
  assert.equal(child?.height, 3);
  const shown = sheetShapes(edited.history.present).find(
    (shape) => shape.id === "child",
  );
  assert.equal(shown?.x, 8);
  assert.equal(shown?.y, 4);
  assert.equal(shown?.width, 10);
  assert.equal(shown?.height, 6);
});

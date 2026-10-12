import assert from "node:assert/strict";
import test from "node:test";
import { createScene, insertNode } from "@uvcp/core";
import { readScene } from "@uvcp/persistence";
import {
  addShape,
  canDelete,
  canRedo,
  canUndo,
  commitPresent,
  containedPosition,
  createHistory,
  deleteSelected,
  dragPosition,
  editorErrorMessage,
  exportDocument,
  exportReadableDocument,
  moveShape,
  openDocument,
  placeShape,
  redo,
  replacePresent,
  resizedDepth,
  resizedFrame,
  resizeShape,
  rotateShape,
  SCENE_BYTE_LIMIT,
  SCENE_TOO_LARGE,
  selectShape,
  shapeAt,
  shapesOf,
  sheetShapes,
  undo,
} from "./document.ts";

test("new shapes are roots and the saved document has no selection", () => {
  let history = addShape(createHistory(), "rectangle");
  history = addShape(history, "box");
  const shapes = shapesOf(history.present);
  assert.deepEqual(
    shapes.map((shape) => shape.kind),
    ["rectangle", "box"],
  );
  assert.equal(history.present.selectedId, "s2");
  assert.equal(shapes[1]?.depth, 48);
  assert.equal(shapes[0]?.depth, null);
  const bytes = exportDocument(history.present);
  const scene = readScene(bytes);
  assert.equal(Object.hasOwn(scene, "selection"), false);
  assert.deepEqual(scene.rootIds, ["s1", "s2"]);
  const opened = openDocument(createHistory(), bytes.byteLength, () => bytes);
  assert.equal(opened.message, null);
  assert.deepEqual(opened.history.present.scene.rootIds, ["s1", "s2"]);
  assert.equal(opened.history.present.selectedId, null);
});

test("move, resize, delete, and undo restore the scene", () => {
  const created = addShape(createHistory(), "rectangle");
  const moved = commitPresent(
    created,
    moveShape(created.present, "s1", 20, 30),
  );
  assert.equal(shapesOf(moved.present)[0]?.x, 20);
  assert.equal(shapesOf(moved.present)[0]?.y, 30);
  const resized = commitPresent(
    moved,
    resizeShape(moved.present, "s1", 40, 50, null),
  );
  assert.equal(shapesOf(resized.present)[0]?.width, 40);
  const removed = commitPresent(resized, deleteSelected(resized.present));
  assert.deepEqual(removed.present.scene.rootIds, []);
  const restored = undo(removed);
  assert.equal(shapesOf(restored.present)[0]?.width, 40);
  const redone = redo(restored);
  assert.deepEqual(redone.present.scene.rootIds, []);
});

test("a drag commits once and selection is not an edit", () => {
  const created = addShape(createHistory(), "box");
  const selected = replacePresent(created, selectShape(created.present, "s1"));
  assert.equal(selected.past.length, created.past.length);
  const during = replacePresent(
    selected,
    moveShape(selected.present, "s1", 10, 12),
  );
  const committed = commitPresent(
    selected,
    moveShape(selected.present, "s1", 10, 12),
  );
  assert.equal(during.past.length, selected.past.length);
  assert.equal(committed.past.length, selected.past.length + 1);
  assert.equal(undo(committed).present.scene, selected.present.scene);
});

test("hit testing prefers the later shape and a zero extent is rejected", () => {
  let history = addShape(createHistory(), "rectangle");
  history = commitPresent(history, moveShape(history.present, "s1", 0, 0));
  history = addShape(history, "rectangle");
  history = commitPresent(history, moveShape(history.present, "s2", 0, 0));
  const shapes = shapesOf(history.present);
  assert.equal(shapeAt(shapes, 10, 10), "s2");
  assert.equal(shapeAt(shapes, -1, -1), null);
  assert.throws(
    () => resizeShape(history.present, "s2", 0, 10, null),
    (error: unknown) => {
      assert.equal(editorErrorMessage(error), "Scene extent is not accepted.");
      return true;
    },
  );
});

test("drag position is the pointer delta and an oversized file is not read", () => {
  assert.deepEqual(
    dragPosition({ x: 5, y: 6 }, { x: 1, y: 1 }, { x: 4, y: 2 }),
    {
      x: 8,
      y: 7,
    },
  );
  let read = false;
  const opened = openDocument(createHistory(), SCENE_BYTE_LIMIT + 1, () => {
    read = true;
    return new Uint8Array();
  });
  assert.equal(read, false);
  assert.equal(opened.message, SCENE_TOO_LARGE);
  const manifest = new TextEncoder().encode(
    '{"formatId":"universal-visual-creation-project","schemaVersion":1}',
  );
  const rejected = openDocument(
    createHistory(),
    manifest.byteLength,
    () => manifest,
  );
  assert.equal(rejected.message, "Scene document format is not supported.");
  assert.equal(rejected.history.present.scene.rootIds.length, 0);
});

test("a root on the sheet matches the model shape", () => {
  const history = addShape(createHistory(), "box");
  assert.deepEqual(sheetShapes(history.present), shapesOf(history.present));
});

test("the sheet places a child on its parent and a drag stays in parent space", () => {
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
  const sheet = sheetShapes(history.present);
  assert.equal(sheet.find((shape) => shape.id === "parent")?.width, 20);
  assert.equal(sheet.find((shape) => shape.id === "child")?.x, 2);
  assert.equal(
    shapesOf(history.present).find((shape) => shape.id === "child")?.x,
    1,
  );
  const moved = moveShape(history.present, "child", 6, 0);
  assert.equal(moved.scene.nodes.child?.transform.position[0], 3);
  assert.equal(
    sheetShapes({ scene: moved.scene, selectedId: null }).find(
      (shape) => shape.id === "child",
    )?.x,
    6,
  );
});

test("a sheet angle of 90 degrees is stored as a quarter turn", () => {
  const added = addShape(createHistory(), "rectangle");
  const id = added.present.scene.rootIds[0];
  if (id === undefined) {
    throw new Error("missing shape");
  }
  const turned = rotateShape(added.present, id, 90);
  const stored = turned.scene.nodes[id]?.transform.rotation[2];
  assert.ok(stored !== undefined);
  assert.ok(Math.abs(stored - Math.PI / 2) < 1e-9);
  assert.ok(
    Math.abs(
      (shapesOf(turned).find((shape) => shape.id === id)?.rotation ?? 0) - 90,
    ) < 1e-9,
  );
  assert.equal(added.present.scene.nodes[id]?.transform.rotation[2], 0);
});

test("redo restores the selection stored at commit", () => {
  const rectangle = addShape(createHistory(), "rectangle");
  const box = addShape(rectangle, "box");
  const reselected = replacePresent(box, selectShape(box.present, "s1"));
  assert.equal(reselected.past.length, box.past.length);
  assert.equal(reselected.future.length, 0);
  assert.equal(canUndo(reselected), true);
  assert.equal(canRedo(reselected), false);
  const undone = undo(reselected);
  assert.deepEqual(undone.present.scene.rootIds, ["s1"]);
  assert.equal(undone.present.selectedId, "s1");
  assert.equal(canRedo(undone), true);
  const redone = redo(undone);
  assert.deepEqual(redone.present.scene.rootIds, ["s1", "s2"]);
  assert.equal(redone.present.selectedId, "s2");

  const moved = commitPresent(
    rectangle,
    moveShape(rectangle.present, "s1", 80, 90),
  );
  const cleared = replacePresent(moved, selectShape(moved.present, null));
  assert.equal(canDelete(cleared.present), false);
  const restored = redo(undo(cleared));
  assert.equal(shapesOf(restored.present)[0]?.x, 80);
  assert.equal(restored.present.selectedId, "s1");
});

test("a selection change keeps the redo step", () => {
  const created = addShape(createHistory(), "rectangle");
  const moved = commitPresent(
    created,
    moveShape(created.present, "s1", 40, 50),
  );
  const undone = undo(moved);
  const reselected = replacePresent(undone, selectShape(undone.present, "s1"));
  assert.equal(canRedo(reselected), true);
  const redone = redo(reselected);
  assert.equal(shapesOf(redone.present)[0]?.x, 40);
  assert.equal(shapesOf(redone.present)[0]?.y, 50);
});

test("an uncommitted drag is dropped without undoing the last step", () => {
  const created = addShape(createHistory(), "box");
  const preview = replacePresent(
    created,
    moveShape(created.present, "s1", 30, 32),
  );
  assert.equal(canUndo(preview), true);
  assert.equal(canRedo(preview), false);
  const dropped = undo(preview);
  assert.equal(dropped.present.scene, created.present.scene);
  assert.equal(dropped.past.length, created.past.length);
  assert.equal(dropped.future.length, 0);
  assert.equal(shapesOf(undo(dropped).present).length, 0);
});

test("delete removes the selected object and undo brings the scene back", () => {
  let history = addShape(createHistory(), "rectangle");
  history = addShape(history, "box");
  history = replacePresent(history, selectShape(history.present, "s1"));
  assert.equal(canDelete(history.present), true);
  const removed = commitPresent(history, deleteSelected(history.present));
  assert.deepEqual(removed.present.scene.rootIds, ["s2"]);
  assert.equal(canDelete(removed.present), false);
  const restored = undo(removed);
  assert.deepEqual(restored.present.scene.rootIds, ["s1", "s2"]);
  const redone = redo(restored);
  assert.deepEqual(redone.present.scene.rootIds, ["s2"]);
});

test("new shapes land on separate slots and a saved file is indented", () => {
  let history = addShape(createHistory(), "rectangle");
  history = addShape(history, "box");
  const shapes = shapesOf(history.present);
  const first = shapes[0];
  const second = shapes[1];
  if (first === undefined || second === undefined) {
    throw new Error("missing shape");
  }
  assert.ok(
    Math.abs(first.x - second.x) >= first.width ||
      Math.abs(first.y - second.y) >= first.height,
  );
  const canonical = exportDocument(history.present);
  const readable = exportReadableDocument(history.present);
  const text = new TextDecoder().decode(readable);
  assert.equal(text.includes("\n"), true);
  assert.equal(text.endsWith("\n"), true);
  assert.equal(text.includes('  "formatId"'), true);
  assert.deepEqual(readScene(readable), readScene(canonical));
  const opened = openDocument(
    createHistory(),
    readable.byteLength,
    () => readable,
  );
  assert.equal(opened.message, null);
  assert.deepEqual(opened.history.present.scene.rootIds, ["s1", "s2"]);
});

test("handles keep a positive extent and a drag stays on the page", () => {
  const shrunk = resizedFrame(
    { x: 10, y: 20, width: 100, height: 40 },
    "w",
    10,
    0,
  );
  assert.deepEqual(shrunk, { x: 20, y: 20, width: 90, height: 40 });
  const collapsed = resizedFrame(
    { x: 10, y: 20, width: 30, height: 40 },
    "w",
    80,
    0,
  );
  assert.equal(collapsed.width > 0, true);
  assert.equal(resizedDepth(48, 0.45, -0.35), 49);
  const parked = containedPosition({ width: 100, height: 80 }, 2000, -100);
  assert.equal(parked.x, 960 - 24);
  assert.equal(parked.y, 24 - 80);
});

test("placeShape edits the sheet size of a scaled child", () => {
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
    kind: "box",
    parentId: "parent",
    index: 0,
    width: 4,
    height: 3,
    depth: 2,
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
  const placed = placeShape(
    history.present,
    "child",
    { x: 8, y: 4, width: 10, height: 6 },
    4,
  );
  assert.equal(placed.scene.nodes.child?.transform.position[0], 4);
  assert.equal(placed.scene.nodes.child?.transform.position[1], 2);
  assert.equal(placed.scene.nodes.child?.width, 5);
  assert.equal(placed.scene.nodes.child?.height, 3);
  assert.equal(
    placed.scene.nodes.child?.kind === "box" && placed.scene.nodes.child.depth,
    2,
  );
  const unchanged = placeShape(
    placed,
    "child",
    { x: 8, y: 4, width: 10, height: 6 },
    4,
  );
  assert.equal(unchanged.scene, placed.scene);
});

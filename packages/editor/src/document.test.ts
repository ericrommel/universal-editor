import assert from "node:assert/strict";
import test from "node:test";
import { readScene } from "@uvcp/persistence";
import {
  addShape,
  commitPresent,
  createHistory,
  deleteSelected,
  dragPosition,
  editorErrorMessage,
  exportDocument,
  moveShape,
  openDocument,
  redo,
  replacePresent,
  resizeShape,
  SCENE_BYTE_LIMIT,
  SCENE_TOO_LARGE,
  selectShape,
  shapeAt,
  shapesOf,
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

import assert from "node:assert/strict";
import test from "node:test";
import { readScene } from "@uvcp/persistence";
import {
  addShape,
  boxShift,
  commitPresent,
  containedPosition,
  createHistory,
  deleteSelected,
  dragPosition,
  editorErrorMessage,
  exportDocument,
  moveShape,
  openDocument,
  placeShape,
  redo,
  replacePresent,
  resizedDepth,
  resizedFrame,
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

test("a new shape does not cover the previous one", () => {
  let history = addShape(createHistory(), "rectangle");
  history = addShape(history, "rectangle");
  const first = shapesOf(history.present)[0];
  const second = shapesOf(history.present)[1];
  assert.ok(first && second);
  const separated =
    first.x + first.width <= second.x ||
    second.x + second.width <= first.x ||
    first.y + first.height <= second.y ||
    second.y + second.height <= first.y;
  assert.equal(separated, true);
});

test("resize handles keep the opposite edge and stay positive", () => {
  const origin = { x: 10, y: 20, width: 30, height: 40 };
  assert.deepEqual(resizedFrame(origin, "e", 5, 9), {
    x: 10,
    y: 20,
    width: 35,
    height: 40,
  });
  assert.deepEqual(resizedFrame(origin, "n", 0, -4), {
    x: 10,
    y: 16,
    width: 30,
    height: 44,
  });
  const collapsed = resizedFrame(origin, "nw", 100, 100);
  assert.equal(collapsed.width, 0.001);
  assert.equal(collapsed.height, 0.001);
  assert.equal(collapsed.x, 40 - 0.001);
  assert.equal(collapsed.y, 60 - 0.001);
});

test("the depth handle follows the offset face", () => {
  const step = boxShift(1);
  assert.equal(resizedDepth(48, step.dx, step.dy), 49);
  assert.equal(resizedDepth(2, -step.dx * 10, -step.dy * 10), 0.001);
});

test("a drag stays partly on the page", () => {
  assert.deepEqual(containedPosition({ width: 160, height: 100 }, 40, 50), {
    x: 40,
    y: 50,
  });
  assert.deepEqual(containedPosition({ width: 160, height: 100 }, -500, -500), {
    x: 24 - 160,
    y: 24 - 100,
  });
  assert.deepEqual(containedPosition({ width: 10, height: 10 }, 2000, 2000), {
    x: 960 - 10,
    y: 600 - 10,
  });
});

test("placeShape writes one frame and ignores an identical frame", () => {
  const created = addShape(createHistory(), "rectangle");
  const shape = shapesOf(created.present)[0];
  assert.ok(shape);
  const same = placeShape(
    created.present,
    shape.id,
    {
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
    },
    9,
  );
  assert.equal(same, created.present);
  const placed = placeShape(
    created.present,
    shape.id,
    {
      x: shape.x + 10,
      y: shape.y,
      width: shape.width + 5,
      height: shape.height,
    },
    9,
  );
  const next = shapesOf(placed)[0];
  assert.equal(next?.x, shape.x + 10);
  assert.equal(next?.width, shape.width + 5);
  assert.equal(next?.depth, null);
  assert.equal(placed.selectedId, shape.id);
  const box = addShape(createHistory(), "box");
  const deepened = placeShape(
    box.present,
    "s1",
    { x: 3, y: 4, width: 50, height: 60 },
    20,
  );
  assert.equal(shapesOf(deepened)[0]?.depth, 20);
  assert.equal(shapesOf(deepened)[0]?.x, 3);
});

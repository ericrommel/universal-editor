import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  addShape,
  createHistory,
  sheetShapes,
} from "../packages/editor/src/document.ts";
import { importGltfFile } from "../packages/editor/src/gltf-file.ts";

test("the committed cube imports into the open project and stays visible", async () => {
  const bytes = new Uint8Array(
    await readFile("examples/interchange/unit-cube.glb"),
  );
  const history = addShape(createHistory(), "rectangle");
  const imported = await importGltfFile(history, bytes);
  assert.equal(imported.message, "Imported into the project.");
  assert.deepEqual(imported.history.present.scene.rootIds, ["s1", "cube"]);
  const sheet = sheetShapes(imported.history.present);
  const rect = sheet.find((shape) => shape.id === "s1");
  const cube = sheet.find((shape) => shape.id === "cube");
  assert.equal(rect?.width, 160);
  assert.equal(rect?.x, 64);
  assert.ok(cube !== undefined && rect !== undefined);
  assert.ok(cube.width >= 48);
  assert.ok(cube.x >= rect.x + rect.width);
});

test("the committed crate keeps its card on the sheet", async () => {
  const bytes = new Uint8Array(
    await readFile("examples/interchange/crate-and-card.glb"),
  );
  const imported = await importGltfFile(createHistory(), bytes);
  const scene = imported.history.present.scene;
  assert.deepEqual(scene.rootIds, ["crate"]);
  assert.deepEqual(scene.nodes.crate?.childIds, ["card"]);
  const sheet = sheetShapes(imported.history.present);
  const crate = sheet.find((shape) => shape.id === "crate");
  const card = sheet.find((shape) => shape.id === "card");
  assert.ok(crate !== undefined && card !== undefined);
  assert.ok(card.width > crate.width);
  assert.ok(card.width >= 48);
  assert.ok(card.x > crate.x && card.x < crate.x + crate.width);
});

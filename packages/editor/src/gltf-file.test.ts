import assert from "node:assert/strict";
import test from "node:test";
import { createScene, insertNode, type Scene } from "@uvcp/core";
import { exportDocument, importDocument } from "@uvcp/interchange";
import { addShape, createHistory, sheetShapes, undo } from "./document.ts";
import {
  exportGltfFile,
  exportSelectedGltf,
  GLTF_BYTE_LIMIT,
  GLTF_TOO_LARGE,
  importGltfFile,
} from "./gltf-file.ts";

test("glTF import keeps the open project and shows the new shapes", async () => {
  const bytes = await exportDocument("gltf", crateAndCard());
  const history = addShape(createHistory(), "rectangle");
  const imported = await importGltfFile(history, bytes);
  assert.equal(imported.message, "Imported into the project.");
  assert.notEqual(imported.history, history);
  const scene = imported.history.present.scene;
  assert.deepEqual(scene.rootIds, ["s1", "crate"]);
  assert.equal(scene.nodes.s1?.kind, "rectangle");
  assert.deepEqual(scene.nodes.crate?.childIds, ["card"]);
  assert.equal(imported.history.present.selectedId, "crate");
  const sheet = sheetShapes(imported.history.present);
  const rect = sheet.find((shape) => shape.id === "s1");
  const crate = sheet.find((shape) => shape.id === "crate");
  const card = sheet.find((shape) => shape.id === "card");
  assert.equal(rect?.x, 64);
  assert.equal(rect?.width, 160);
  assert.ok(crate !== undefined && card !== undefined && rect !== undefined);
  assert.ok(crate.x >= rect.x + rect.width);
  assert.ok(card.width > crate.width);
  assert.ok(card.width > 100);
  assert.ok(crate.width > 20);
  assert.equal(crate.y, card.y);
  assert.ok(card.x > crate.x && card.x < crate.x + crate.width);
  const rotation = scene.nodes.crate?.transform.rotation[1] ?? 0;
  assert.ok(Math.abs(rotation - Math.PI / 2) < 1e-3);
  const undone = undo(imported.history);
  assert.deepEqual(undone.present.scene.rootIds, ["s1"]);
  assert.equal(undone.present.selectedId, "s1");
});

test("a colliding glTF id is renamed and a mirrored box keeps its sign", async () => {
  const history = addShape(createHistory(), "rectangle");
  const colliding = await importGltfFile(
    history,
    await exportDocument("gltf", mirroredBox("s1")),
  );
  assert.equal(colliding.history.present.scene.nodes.s1?.kind, "rectangle");
  const imported = colliding.history.present.scene.nodes["s1-2"];
  assert.equal(imported?.kind, "box");
  assert.equal(colliding.history.present.selectedId, "s1-2");
  if (imported?.kind === "box") {
    assert.equal(imported.transform.scale[2], -1);
    assert.ok(imported.depth > 0);
  }
  const sheet = sheetShapes(colliding.history.present);
  assert.ok((sheet.find((shape) => shape.id === "s1-2")?.width ?? 0) >= 48);
});

test("export writes the project or only the selection", async () => {
  const imported = await importGltfFile(
    addShape(createHistory(), "rectangle"),
    await exportDocument("gltf", crateAndCard()),
  );
  const present = imported.history.present;
  const project = await exportGltfFile(present);
  assert.equal(project.message, null);
  assert.ok(project.bytes !== null && isGlb(project.bytes));
  const roundTrip = await importDocument("gltf", project.bytes);
  assert.deepEqual(roundTrip.rootIds, ["s1", "crate"]);
  assert.deepEqual(roundTrip.nodes.crate?.childIds, ["card"]);

  const selection = await exportSelectedGltf({
    ...present,
    selectedId: "card",
  });
  assert.equal(selection.message, null);
  assert.ok(selection.bytes !== null && isGlb(selection.bytes));
  const cardOnly = await importDocument("gltf", selection.bytes);
  assert.deepEqual(cardOnly.rootIds, ["card"]);
  assert.equal(cardOnly.nodes.crate, undefined);

  const none = await exportSelectedGltf({ ...present, selectedId: null });
  assert.equal(none.bytes, null);
  assert.equal(none.message, "Select a shape to export.");
});

test("a bad glTF does not replace the open project", async () => {
  const history = addShape(createHistory(), "box");
  const hostile = new TextEncoder().encode(
    JSON.stringify({
      asset: { version: "2.0" },
      buffers: [{ uri: "https://evil.example/secret.bin" }],
    }),
  );
  const rejected = await importGltfFile(history, hostile);
  assert.equal(rejected.history, history);
  assert.equal(rejected.message?.includes("evil"), false);
  assert.equal(rejected.message?.includes("http"), false);
  const empty = await exportGltfFile(createHistory().present);
  assert.ok(empty.bytes !== null);
  const noShapes = await importGltfFile(history, empty.bytes);
  assert.equal(noShapes.history, history);
  assert.equal(noShapes.message, "Interchange document has no shapes.");
  const oversized = await importGltfFile(
    history,
    new Uint8Array(GLTF_BYTE_LIMIT + 1),
  );
  assert.equal(oversized.history, history);
  assert.equal(oversized.message, GLTF_TOO_LARGE);
});

function crateAndCard(): Scene {
  let scene = createScene();
  scene = insertNode(scene, {
    id: "crate",
    kind: "box",
    parentId: null,
    index: 0,
    width: 2,
    height: 1,
    depth: 0.5,
    transform: {
      position: [1, 2, 3],
      rotation: [0, Math.PI / 2, 0],
      scale: [1, 1, 1],
    },
  });
  scene = insertNode(scene, {
    id: "card",
    kind: "rectangle",
    parentId: "crate",
    index: 0,
    width: 4,
    height: 3,
    transform: {
      position: [0.25, 0, 0],
      rotation: [0, 0, 0],
      scale: [2, 2, 2],
    },
  });
  return scene;
}

function mirroredBox(id: string): Scene {
  return insertNode(createScene(), {
    id,
    kind: "box",
    parentId: null,
    index: 0,
    width: 2,
    height: 1,
    depth: 0.5,
    transform: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, -1],
    },
  });
}

function isGlb(bytes: Uint8Array): boolean {
  return (
    bytes[0] === 0x67 &&
    bytes[1] === 0x6c &&
    bytes[2] === 0x54 &&
    bytes[3] === 0x46
  );
}

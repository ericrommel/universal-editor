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
  const hostileGlb = glbFromText(
    '{"__proto__":{"polluted":true},"asset":{"version":"2.0"}}',
  );
  const polluted = await importGltfFile(history, hostileGlb);
  assert.equal(polluted.history, history);
  assert.equal(polluted.message, "Interchange document shape is not accepted.");
  const unnamed = await importGltfFile(
    history,
    mapGlbJson(await exportDocument("gltf", mirroredBox("box")), (json) => {
      const nodes = json.nodes as Array<Record<string, unknown>>;
      delete nodes[0]?.name;
    }),
  );
  assert.equal(unnamed.history, history);
  assert.equal(unnamed.message, "Interchange document is not valid glTF.");
  const duplicated = await importGltfFile(
    history,
    mapGlbJson(await exportDocument("gltf", mirroredBox("box")), (json) => {
      const nodes = json.nodes as Array<Record<string, unknown>>;
      const scenes = json.scenes as Array<{ nodes: number[] }>;
      const first = nodes[0];
      if (first === undefined || scenes[0] === undefined) {
        throw new Error("exported glb has no node");
      }
      nodes.push({ ...first });
      scenes[0].nodes.push(nodes.length - 1);
    }),
  );
  assert.equal(duplicated.history, history);
  assert.equal(duplicated.message, "Interchange document is not valid glTF.");
  const flat = await importGltfFile(
    history,
    await exportDocument(
      "gltf",
      insertNode(createScene(), {
        id: "flat",
        kind: "box",
        parentId: null,
        index: 0,
        width: 2,
        height: 1,
        depth: 0.5,
        transform: {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [0, 1, 1],
        },
      }),
    ),
  );
  assert.equal(flat.history, history);
  assert.equal(flat.message, "Interchange document is not valid glTF.");
  assert.equal(flat.message.includes("flat"), false);
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

function glbFromText(json: string): Uint8Array {
  const text = new TextEncoder().encode(json);
  const padded = text.length + ((4 - (text.length % 4)) % 4);
  const bytes = new Uint8Array(20 + padded);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, bytes.length, true);
  view.setUint32(12, padded, true);
  view.setUint32(16, 0x4e4f534a, true);
  bytes.set(text, 20);
  bytes.fill(0x20, 20 + text.length);
  return bytes;
}

function mapGlbJson(
  bytes: Uint8Array,
  edit: (json: Record<string, unknown>) => void,
): Uint8Array {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const jsonLength = view.getUint32(12, true);
  const parsed: unknown = JSON.parse(
    new TextDecoder().decode(bytes.subarray(20, 20 + jsonLength)),
  );
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("exported glb json");
  }
  edit(parsed);
  let offset = 20 + jsonLength;
  let bin: Uint8Array | null = null;
  while (offset + 8 <= bytes.byteLength) {
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    if (type === 0x004e4942) {
      bin = bytes.subarray(offset + 8, offset + 8 + length);
      break;
    }
    offset += 8 + length;
  }
  const jsonText = new TextEncoder().encode(JSON.stringify(parsed));
  const jsonPad = (4 - (jsonText.length % 4)) % 4;
  const jsonChunk = jsonText.length + jsonPad;
  const binLength = bin?.byteLength ?? 0;
  const binPad = (4 - (binLength % 4)) % 4;
  const binChunk = bin === null ? 0 : 8 + binLength + binPad;
  const packed = new Uint8Array(12 + 8 + jsonChunk + binChunk);
  const out = new DataView(packed.buffer);
  out.setUint32(0, 0x46546c67, true);
  out.setUint32(4, 2, true);
  out.setUint32(8, packed.length, true);
  out.setUint32(12, jsonChunk, true);
  out.setUint32(16, 0x4e4f534a, true);
  packed.set(jsonText, 20);
  packed.fill(0x20, 20 + jsonText.length, 20 + jsonChunk);
  if (bin !== null) {
    const start = 20 + jsonChunk;
    out.setUint32(start, binLength + binPad, true);
    out.setUint32(start + 4, 0x004e4942, true);
    packed.set(bin, start + 8);
  }
  return packed;
}

function isGlb(bytes: Uint8Array): boolean {
  return (
    bytes[0] === 0x67 &&
    bytes[1] === 0x6c &&
    bytes[2] === 0x54 &&
    bytes[3] === 0x46
  );
}

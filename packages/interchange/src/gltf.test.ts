import assert from "node:assert/strict";
import test from "node:test";
import { Document, NodeIO, Primitive } from "@gltf-transform/core";
import { createScene, DomainError, insertNode } from "@uvcp/core";
import { exportDocument, importDocument } from "./index.ts";

test("a box and a rectangle round-trip through glTF", async () => {
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
      scale: [1, 1, -1],
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
      rotation: [0, 0, 0.4],
      scale: [2, 2, 2],
    },
  });

  const bytes = await exportDocument("gltf", scene);
  assert.equal(bytes[0], 0x67);
  assert.equal(bytes[1], 0x6c);
  assert.equal(bytes[2], 0x54);
  assert.equal(bytes[3], 0x46);

  const imported = await importDocument("gltf", bytes);
  assert.deepEqual(imported.rootIds, ["crate"]);
  const crate = imported.nodes.crate;
  const card = imported.nodes.card;
  assert.ok(crate && crate.kind === "box");
  assert.ok(card && card.kind === "rectangle");
  assert.equal(crate.depth, 0.5);
  assert.deepEqual(crate.childIds, ["card"]);
  assert.equal(card.width, 4);
  assert.equal(card.height, 3);
  closeTriple(crate.transform.position, [1, 2, 3]);
  // glTF stores the quaternion as float32, so a right angle comes back within 1e-3 radians.
  closeTriple(crate.transform.rotation, [0, Math.PI / 2, 0], 1e-3);
  closeTriple(crate.transform.scale, [1, 1, -1]);
  closeTriple(card.transform.position, [0.25, 0, 0]);
  closeTriple(card.transform.rotation, [0, 0, 0.4], 1e-3);
  closeTriple(card.transform.scale, [2, 2, 2]);
});

test("an external cube without product extras imports as a box", async () => {
  const bytes = await externalCube();
  const scene = await importDocument("gltf", bytes);
  const cube = scene.nodes.cube;
  assert.deepEqual(scene.rootIds, ["cube"]);
  assert.ok(cube && cube.kind === "box");
  if (cube?.kind !== "box") {
    return;
  }
  assert.equal(cube.width, 1);
  assert.equal(cube.height, 1);
  assert.equal(cube.depth, 1);
  closeTriple(cube.transform.position, [0, 0, 0]);
  closeTriple(cube.transform.rotation, [0, Math.PI / 2, 0], 1e-3);
  closeTriple(cube.transform.scale, [1, 1, 1]);
});

test("a ground quad imports as a rectangle", async () => {
  const bytes = await groundQuad();
  const scene = await importDocument("gltf", bytes);
  const quad = scene.nodes.floor;
  assert.ok(quad && quad.kind === "rectangle");
  if (quad?.kind !== "rectangle") {
    return;
  }
  assert.equal(quad.width, 2);
  assert.equal(quad.height, 4);
});

test("external buffer URIs and hostile keys are rejected", async () => {
  await expectCode(
    utf8(
      JSON.stringify({
        asset: { version: "2.0" },
        buffers: [{ uri: "https://example.invalid/a.bin", byteLength: 4 }],
      }),
    ),
    "UNSUPPORTED_FORMAT",
  );
  await expectCode(
    utf8(
      JSON.stringify({
        asset: { version: "2.0" },
        buffers: [{ uri: "../secret.bin", byteLength: 4 }],
      }),
    ),
    "UNSUPPORTED_FORMAT",
  );
  await expectCode(
    utf8('{"__proto__":{"polluted":true},"asset":{"version":"2.0"}}'),
    "INVALID_SHAPE",
  );
  const huge = new Uint8Array(4 * 1024 * 1024 + 1);
  await expectCode(huge, "TOO_LARGE");
});

test("a triangle fan is not a rectangle or a box", async () => {
  const bytes = await triangle();
  await expectCode(bytes, "UNSUPPORTED_NODE");
});

test("an unknown format id is rejected", async () => {
  await expectCode(new Uint8Array([1, 2, 3]), "UNSUPPORTED_FORMAT", "step");
});

async function externalCube(): Promise<Uint8Array> {
  const document = new Document();
  const buffer = document.createBuffer();
  const half = 0.5;
  const positions = new Float32Array([
    -half,
    -half,
    -half,
    half,
    -half,
    -half,
    half,
    half,
    -half,
    -half,
    half,
    -half,
    -half,
    -half,
    half,
    half,
    -half,
    half,
    half,
    half,
    half,
    -half,
    half,
    half,
  ]);
  const indices = new Uint16Array([
    4, 5, 6, 4, 6, 7, 1, 0, 3, 1, 3, 2, 5, 1, 2, 5, 2, 6, 0, 4, 7, 0, 7, 3, 3,
    7, 6, 3, 6, 2, 0, 1, 5, 0, 5, 4,
  ]);
  const position = document
    .createAccessor()
    .setType("VEC3")
    .setArray(positions)
    .setBuffer(buffer);
  const index = document
    .createAccessor()
    .setType("SCALAR")
    .setArray(indices)
    .setBuffer(buffer);
  const primitive = document
    .createPrimitive()
    .setMode(Primitive.Mode.TRIANGLES)
    .setAttribute("POSITION", position)
    .setIndices(index);
  const mesh = document.createMesh().addPrimitive(primitive);
  const node = document
    .createNode("cube")
    .setMesh(mesh)
    .setRotation([0, Math.sin(Math.PI / 4), 0, Math.cos(Math.PI / 4)]);
  document.createScene().addChild(node);
  return new NodeIO().writeBinary(document);
}

async function groundQuad(): Promise<Uint8Array> {
  const document = new Document();
  const buffer = document.createBuffer();
  const positions = new Float32Array([-1, 0, -2, 1, 0, -2, 1, 0, 2, -1, 0, 2]);
  const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
  const position = document
    .createAccessor()
    .setType("VEC3")
    .setArray(positions)
    .setBuffer(buffer);
  const index = document
    .createAccessor()
    .setType("SCALAR")
    .setArray(indices)
    .setBuffer(buffer);
  const primitive = document
    .createPrimitive()
    .setMode(Primitive.Mode.TRIANGLES)
    .setAttribute("POSITION", position)
    .setIndices(index);
  document
    .createScene()
    .addChild(
      document
        .createNode("floor")
        .setMesh(document.createMesh().addPrimitive(primitive)),
    );
  return new NodeIO().writeBinary(document);
}

async function triangle(): Promise<Uint8Array> {
  const document = new Document();
  const buffer = document.createBuffer();
  const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0.2]);
  const position = document
    .createAccessor()
    .setType("VEC3")
    .setArray(positions)
    .setBuffer(buffer);
  const primitive = document
    .createPrimitive()
    .setMode(Primitive.Mode.TRIANGLES)
    .setAttribute("POSITION", position);
  document
    .createScene()
    .addChild(
      document
        .createNode("wedge")
        .setMesh(document.createMesh().addPrimitive(primitive)),
    );
  return new NodeIO().writeBinary(document);
}

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

async function expectCode(
  bytes: Uint8Array,
  code: string,
  formatId = "gltf",
): Promise<void> {
  await assert.rejects(importDocument(formatId, bytes), (error: unknown) => {
    assert.ok(error instanceof DomainError);
    assert.equal(error.code, code);
    assert.equal(error.message.includes("http"), false);
    assert.equal(error.message.includes("secret"), false);
    assert.equal(error.message.includes("polluted"), false);
    return true;
  });
}

function closeTriple(
  actual: readonly [number, number, number],
  expected: readonly [number, number, number],
  epsilon = 1e-5,
): void {
  for (let index = 0; index < 3; index += 1) {
    assert.ok(
      Math.abs((actual[index] ?? 0) - (expected[index] ?? 0)) < epsilon,
    );
  }
}

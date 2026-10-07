import { Document, WebIO } from "@gltf-transform/core";
import { createScene, insertNode } from "@uvcp/core";
import { exportDocument } from "./index.ts";

export async function crateAndCardBytes(): Promise<Uint8Array> {
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
      scale: [1, 1, 1],
    },
  });
  return exportDocument("gltf", scene);
}

export async function unitCubeBytes(): Promise<Uint8Array> {
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
    .setMode(4)
    .setAttribute("POSITION", position)
    .setIndices(index);
  const node = document
    .createNode("cube")
    .setRotation([0, Math.sin(Math.PI / 4), 0, Math.cos(Math.PI / 4)])
    .setMesh(document.createMesh().addPrimitive(primitive));
  document.createScene().addChild(node);
  return new WebIO().writeBinary(document);
}

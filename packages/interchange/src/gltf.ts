import {
  type Accessor,
  Document,
  type Node as GltfNode,
  type Scene as GltfScene,
  type Material,
  type Mesh,
  NodeIO,
} from "@gltf-transform/core";
import {
  createScene,
  DomainError,
  insertNode,
  type Scene,
  type SceneNode,
} from "@uvcp/core";
import {
  eulerRadiansToQuaternion,
  quaternionToEulerRadians,
  rotateScaledCenter,
} from "./euler.ts";

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_NODES = 1024;
const MAX_VERTICES = 65536;
const MAX_JSON_DEPTH = 32;
const PLANE_EPSILON = 1e-4;
const TRIANGLES = 4;

const TOO_LARGE = "Interchange document exceeds the size limit.";
const INVALID_ENCODING = "Interchange document is not UTF-8 text.";
const INVALID_JSON = "Interchange document is not valid glTF.";
const UNSUPPORTED_FORMAT = "Interchange document format is not supported.";
const INVALID_SHAPE = "Interchange document shape is not accepted.";
const UNSUPPORTED_NODE = "Interchange node is not a rectangle or a box.";

const HOSTILE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

type Vec3 = readonly [number, number, number];

type MeshShape =
  | {
      readonly kind: "rectangle";
      readonly width: number;
      readonly height: number;
      readonly center: Vec3;
    }
  | {
      readonly kind: "box";
      readonly width: number;
      readonly height: number;
      readonly depth: number;
      readonly center: Vec3;
    };

export const gltfFormat = {
  id: "gltf",
  read: importGltf,
  write: exportGltf,
};

export async function importGltf(bytes: Uint8Array): Promise<Scene> {
  if (!(bytes instanceof Uint8Array)) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  if (bytes.byteLength > MAX_BYTES) {
    throw new DomainError("TOO_LARGE", TOO_LARGE);
  }
  const document = await readDocument(bytes);
  const scenes = document.getRoot().listScenes();
  const gltfScene = scenes[0];
  if (scenes.length !== 1 || !gltfScene) {
    throw new DomainError("UNSUPPORTED_FORMAT", UNSUPPORTED_FORMAT);
  }
  return sceneFromGltf(gltfScene);
}

export async function exportGltf(scene: Scene): Promise<Uint8Array> {
  const document = new Document();
  const buffer = document.createBuffer();
  const material = document
    .createMaterial()
    .setMetallicFactor(0)
    .setRoughnessFactor(1);
  const gltfScene = document.createScene();
  for (const rootId of scene.rootIds) {
    gltfScene.addChild(exportNode(document, buffer, material, scene, rootId));
  }
  const io = new NodeIO();
  return io.writeBinary(document);
}

async function readDocument(bytes: Uint8Array): Promise<Document> {
  const io = new NodeIO();
  try {
    if (isGlb(bytes)) {
      return await io.readBinary(bytes);
    }
    if (hasUtf8Bom(bytes)) {
      throw new DomainError("INVALID_ENCODING", INVALID_ENCODING);
    }
    const parsed = parseJson(decodeUtf8(bytes));
    rejectHostileJson(parsed, 0);
    return await io.readJSON({
      json: parsed as never,
      resources: {},
    });
  } catch (error) {
    if (error instanceof DomainError) {
      throw error;
    }
    throw new DomainError("INVALID_JSON", INVALID_JSON);
  }
}

function sceneFromGltf(gltfScene: GltfScene): Scene {
  let scene = createScene();
  let count = 0;
  const add = (gltfNode: GltfNode, parentId: string | null): void => {
    count += 1;
    if (count > MAX_NODES) {
      throw new DomainError("TOO_LARGE", TOO_LARGE);
    }
    const id = gltfNode.getName();
    const shape = shapeOf(gltfNode);
    const translation = tuple3(gltfNode.getTranslation());
    const scale = tuple3(gltfNode.getScale());
    const quaternion = tuple4(gltfNode.getRotation());
    const position = rotateScaledCenter(
      translation,
      quaternion,
      scale,
      shape.center,
    );
    const rotation = quaternionToEulerRadians(quaternion);
    const index =
      parentId === null ? scene.rootIds.length : childCount(scene, parentId);
    const input = {
      id,
      kind: shape.kind,
      parentId,
      index,
      transform: { position, rotation, scale },
      width: shape.width,
      height: shape.height,
      ...(shape.kind === "box" ? { depth: shape.depth } : {}),
    };
    scene = insertNode(scene, input);
    for (const child of gltfNode.listChildren()) {
      add(child, id);
    }
  };
  for (const root of gltfScene.listChildren()) {
    add(root, null);
  }
  return scene;
}

function shapeOf(gltfNode: GltfNode): MeshShape {
  if (gltfNode.getSkin()) {
    throw new DomainError("UNSUPPORTED_NODE", UNSUPPORTED_NODE);
  }
  const mesh = gltfNode.getMesh();
  if (!mesh) {
    throw new DomainError("UNSUPPORTED_NODE", UNSUPPORTED_NODE);
  }
  const primitives = mesh.listPrimitives();
  const primitive = primitives[0];
  if (primitives.length !== 1 || !primitive) {
    throw new DomainError("UNSUPPORTED_NODE", UNSUPPORTED_NODE);
  }
  if (primitive.getMode() !== TRIANGLES) {
    throw new DomainError("UNSUPPORTED_NODE", UNSUPPORTED_NODE);
  }
  if (primitive.listTargets().length > 0) {
    throw new DomainError("UNSUPPORTED_NODE", UNSUPPORTED_NODE);
  }
  const position = primitive.getAttribute("POSITION");
  if (position?.getElementSize() !== 3) {
    throw new DomainError("UNSUPPORTED_NODE", UNSUPPORTED_NODE);
  }
  const count = position.getCount();
  if (count > MAX_VERTICES) {
    throw new DomainError("TOO_LARGE", TOO_LARGE);
  }
  if (count < 3) {
    throw new DomainError("UNSUPPORTED_NODE", UNSUPPORTED_NODE);
  }
  return classifyPositions(position, count);
}

function classifyPositions(position: Accessor, count: number): MeshShape {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;
  const points: Array<[number, number, number]> = [];
  const element = [0, 0, 0];
  for (let index = 0; index < count; index += 1) {
    position.getElement(index, element);
    const x = element[0] ?? Number.NaN;
    const y = element[1] ?? Number.NaN;
    const z = element[2] ?? Number.NaN;
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      throw new DomainError("NON_FINITE_NUMBER", "Expected a finite number.");
    }
    points.push([x, y, z]);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }
  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  const sizeZ = maxZ - minZ;
  const center: Vec3 = [
    (minX + maxX) / 2,
    (minY + maxY) / 2,
    (minZ + maxZ) / 2,
  ];
  const thinX = sizeX <= PLANE_EPSILON;
  const thinY = sizeY <= PLANE_EPSILON;
  const thinZ = sizeZ <= PLANE_EPSILON;
  if (thinX && thinY && thinZ) {
    throw new DomainError("UNSUPPORTED_NODE", UNSUPPORTED_NODE);
  }
  if ((thinX && thinY) || (thinX && thinZ) || (thinY && thinZ)) {
    throw new DomainError("UNSUPPORTED_NODE", UNSUPPORTED_NODE);
  }
  if (thinZ && sizeX > PLANE_EPSILON && sizeY > PLANE_EPSILON) {
    if (
      !coversCorners(points, ["x", "y"], minX, minY, minZ, maxX, maxY, maxZ)
    ) {
      throw new DomainError("UNSUPPORTED_NODE", UNSUPPORTED_NODE);
    }
    return { kind: "rectangle", width: sizeX, height: sizeY, center };
  }
  if (thinY && sizeX > PLANE_EPSILON && sizeZ > PLANE_EPSILON) {
    if (
      !coversCorners(points, ["x", "z"], minX, minY, minZ, maxX, maxY, maxZ)
    ) {
      throw new DomainError("UNSUPPORTED_NODE", UNSUPPORTED_NODE);
    }
    return { kind: "rectangle", width: sizeX, height: sizeZ, center };
  }
  if (thinX && sizeY > PLANE_EPSILON && sizeZ > PLANE_EPSILON) {
    if (
      !coversCorners(points, ["z", "y"], minX, minY, minZ, maxX, maxY, maxZ)
    ) {
      throw new DomainError("UNSUPPORTED_NODE", UNSUPPORTED_NODE);
    }
    return { kind: "rectangle", width: sizeZ, height: sizeY, center };
  }
  if (
    !coversCorners(points, ["x", "y", "z"], minX, minY, minZ, maxX, maxY, maxZ)
  ) {
    throw new DomainError("UNSUPPORTED_NODE", UNSUPPORTED_NODE);
  }
  return {
    kind: "box",
    width: sizeX,
    height: sizeY,
    depth: sizeZ,
    center,
  };
}

function coversCorners(
  points: ReadonlyArray<readonly [number, number, number]>,
  axes: ReadonlyArray<"x" | "y" | "z">,
  minX: number,
  minY: number,
  minZ: number,
  maxX: number,
  maxY: number,
  maxZ: number,
): boolean {
  const bounds = { x: [minX, maxX], y: [minY, maxY], z: [minZ, maxZ] };
  const seen = new Set<number>();
  for (const point of points) {
    let mask = 0;
    for (let bit = 0; bit < axes.length; bit += 1) {
      const axis = axes[bit];
      if (!axis) {
        return false;
      }
      const coord = point[axis === "x" ? 0 : axis === "y" ? 1 : 2];
      const pair = bounds[axis];
      const min = pair[0];
      const max = pair[1];
      if (min === undefined || max === undefined) {
        return false;
      }
      if (Math.abs(coord - max) <= PLANE_EPSILON) {
        mask |= 1 << bit;
      } else if (Math.abs(coord - min) > PLANE_EPSILON) {
        return false;
      }
    }
    seen.add(mask);
  }
  return seen.size === 2 ** axes.length;
}

function exportNode(
  document: Document,
  buffer: ReturnType<Document["createBuffer"]>,
  material: Material,
  scene: Scene,
  id: string,
): GltfNode {
  const node = scene.nodes[id];
  if (!node) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  const rotation = eulerRadiansToQuaternion(node.transform.rotation);
  const gltfNode = document
    .createNode(node.id)
    .setTranslation([
      node.transform.position[0],
      node.transform.position[1],
      node.transform.position[2],
    ])
    .setRotation([rotation[0], rotation[1], rotation[2], rotation[3]])
    .setScale([
      node.transform.scale[0],
      node.transform.scale[1],
      node.transform.scale[2],
    ])
    .setMesh(meshFor(document, buffer, material, node))
    .setExtras({ uvcpKind: node.kind });
  for (const childId of node.childIds) {
    gltfNode.addChild(exportNode(document, buffer, material, scene, childId));
  }
  return gltfNode;
}

function meshFor(
  document: Document,
  buffer: ReturnType<Document["createBuffer"]>,
  material: Material,
  node: SceneNode,
): Mesh {
  if (node.kind === "box") {
    return boxMesh(
      document,
      buffer,
      material,
      node.width,
      node.height,
      node.depth,
    );
  }
  return rectangleMesh(document, buffer, material, node.width, node.height);
}

function boxMesh(
  document: Document,
  buffer: ReturnType<Document["createBuffer"]>,
  material: Material,
  width: number,
  height: number,
  depth: number,
): Mesh {
  const x = width / 2;
  const y = height / 2;
  const z = depth / 2;
  const positions = new Float32Array([
    -x,
    -y,
    -z,
    x,
    -y,
    -z,
    x,
    y,
    -z,
    -x,
    y,
    -z,
    -x,
    -y,
    z,
    x,
    -y,
    z,
    x,
    y,
    z,
    -x,
    y,
    z,
  ]);
  const indices = new Uint16Array([
    4, 5, 6, 4, 6, 7, 1, 0, 3, 1, 3, 2, 5, 1, 2, 5, 2, 6, 0, 4, 7, 0, 7, 3, 3,
    7, 6, 3, 6, 2, 0, 1, 5, 0, 5, 4,
  ]);
  return meshFrom(document, buffer, material, positions, indices);
}

function rectangleMesh(
  document: Document,
  buffer: ReturnType<Document["createBuffer"]>,
  material: Material,
  width: number,
  height: number,
): Mesh {
  const x = width / 2;
  const y = height / 2;
  const positions = new Float32Array([-x, -y, 0, x, -y, 0, x, y, 0, -x, y, 0]);
  const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
  return meshFrom(document, buffer, material, positions, indices);
}

function meshFrom(
  document: Document,
  buffer: ReturnType<Document["createBuffer"]>,
  material: Material,
  positions: Float32Array,
  indices: Uint16Array,
): Mesh {
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
    .setMode(TRIANGLES)
    .setAttribute("POSITION", position)
    .setIndices(index)
    .setMaterial(material);
  return document.createMesh().addPrimitive(primitive);
}

function childCount(scene: Scene, parentId: string): number {
  const parent = scene.nodes[parentId];
  if (!parent) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  return parent.childIds.length;
}

function tuple3(value: ArrayLike<number>): Vec3 {
  return [value[0] ?? 0, value[1] ?? 0, value[2] ?? 0];
}

function tuple4(
  value: ArrayLike<number>,
): readonly [number, number, number, number] {
  return [value[0] ?? 0, value[1] ?? 0, value[2] ?? 0, value[3] ?? 1];
}

function isGlb(bytes: Uint8Array): boolean {
  return (
    bytes.byteLength >= 12 &&
    bytes[0] === 0x67 &&
    bytes[1] === 0x6c &&
    bytes[2] === 0x54 &&
    bytes[3] === 0x46
  );
}

function hasUtf8Bom(bytes: Uint8Array): boolean {
  return bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
}

function decodeUtf8(bytes: Uint8Array): string {
  try {
    return new Utf8Decoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new DomainError("INVALID_ENCODING", INVALID_ENCODING);
  }
}

type Utf8DecoderType = new (
  label: "utf-8",
  options: { readonly fatal: true },
) => { decode(input: Uint8Array): string };

const Utf8Decoder = (globalThis as unknown as { TextDecoder: Utf8DecoderType })
  .TextDecoder;

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text, (key, value: unknown) => {
      if (HOSTILE_KEYS.has(key)) {
        throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
      }
      return value;
    });
  } catch (error) {
    if (error instanceof DomainError) {
      throw error;
    }
    if (error instanceof SyntaxError || error instanceof RangeError) {
      throw new DomainError("INVALID_JSON", INVALID_JSON);
    }
    throw error;
  }
}

function rejectHostileJson(value: unknown, depth: number): void {
  if (depth > MAX_JSON_DEPTH) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      rejectHostileJson(item, depth + 1);
    }
    return;
  }
  if (!isRecord(value)) {
    return;
  }
  for (const key of Object.keys(value)) {
    if (HOSTILE_KEYS.has(key)) {
      throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
    }
    if (key === "uri") {
      rejectUri(value[key]);
    }
    rejectHostileJson(value[key], depth + 1);
  }
}

function rejectUri(value: unknown): void {
  if (typeof value !== "string" || !value.startsWith("data:")) {
    throw new DomainError("UNSUPPORTED_FORMAT", UNSUPPORTED_FORMAT);
  }
  const lower = value.toLowerCase();
  if (lower.includes("javascript") || lower.includes("://")) {
    throw new DomainError("UNSUPPORTED_FORMAT", UNSUPPORTED_FORMAT);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

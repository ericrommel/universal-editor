import {
  createScene,
  DomainError,
  insertNode,
  type Scene,
  type SceneNode,
} from "@uvcp/core";
import {
  GLTF_BYTE_LIMIT,
  GLTF_TOO_LARGE,
  importDocument as readGltf,
  exportDocument as writeGltf,
} from "@uvcp/interchange";
import {
  commitPresent,
  type EditorDocument,
  type EditorHistory,
  SHEET_HEIGHT,
  SHEET_WIDTH,
  type SheetFrame,
  sheetFramesOf,
  sheetShapes,
} from "./document.ts";

export { GLTF_BYTE_LIMIT, GLTF_TOO_LARGE };

const IMPORTED = "Imported into the project.";
const NO_SHAPES = "Interchange document has no shapes.";
const INVALID_GLTF = "Interchange document is not valid glTF.";
const SELECT_TO_EXPORT = "Select a shape to export.";
const EXTENT = "Scene extent is not accepted.";
const SHAPE = "Scene shape is not accepted.";
const ID = "Scene id is not accepted.";

const MIN_SPAN = 48;
const MAX_SPAN = 480;
const TARGET_SPAN = 180;
const SHEET_EDGE = 16;
const PLACE_GAP = 24;
const ID_BYTES_MAX = 64;

export type GltfFileResult = {
  readonly history: EditorHistory;
  readonly message: string | null;
};

export type GltfBytesResult = {
  readonly bytes: Uint8Array | null;
  readonly message: string | null;
};

export async function importGltfFile(
  history: EditorHistory,
  bytes: Uint8Array,
): Promise<GltfFileResult> {
  if (!(bytes instanceof Uint8Array)) {
    return { history, message: INVALID_GLTF };
  }
  if (bytes.byteLength > GLTF_BYTE_LIMIT) {
    return { history, message: GLTF_TOO_LARGE };
  }
  try {
    const incoming = await readGltf("gltf", bytes);
    if (incoming.rootIds.length === 0) {
      return { history, message: NO_SHAPES };
    }
    const anchor = anchorFor(history.present.scene);
    const fitted = placeOnSheet(incoming, anchor.x, anchor.y);
    const merged = mergeScene(history.present.scene, fitted);
    return {
      history: commitPresent(history, {
        scene: merged.scene,
        selectedId: merged.importedRootIds[0] ?? null,
      }),
      message: IMPORTED,
    };
  } catch (error) {
    return { history, message: fileMessage(error) };
  }
}

export async function exportGltfFile(
  document: EditorDocument,
): Promise<GltfBytesResult> {
  try {
    return { bytes: await writeGltf("gltf", document.scene), message: null };
  } catch (error) {
    return { bytes: null, message: fileMessage(error) };
  }
}

export async function exportSelectedGltf(
  document: EditorDocument,
): Promise<GltfBytesResult> {
  if (document.selectedId === null) {
    return { bytes: null, message: SELECT_TO_EXPORT };
  }
  try {
    const scene = sceneFromNode(document.scene, document.selectedId);
    return { bytes: await writeGltf("gltf", scene), message: null };
  } catch (error) {
    return { bytes: null, message: fileMessage(error) };
  }
}

const FIXED_MESSAGES = new Set([
  GLTF_TOO_LARGE,
  "Interchange document is not UTF-8 text.",
  INVALID_GLTF,
  "Interchange document format is not supported.",
  "Interchange document shape is not accepted.",
  "Interchange node is not a rectangle or a box.",
  "Expected a finite number.",
]);

function fileMessage(error: unknown): string {
  if (error instanceof DomainError && FIXED_MESSAGES.has(error.message)) {
    return error.message;
  }
  return INVALID_GLTF;
}

function anchorFor(scene: Scene): { readonly x: number; readonly y: number } {
  if (scene.rootIds.length === 0) {
    return { x: 64, y: 64 };
  }
  let maxX = 0;
  let maxY = 0;
  let minY = SHEET_HEIGHT;
  for (const shape of sheetShapes({ scene, selectedId: null })) {
    maxX = Math.max(maxX, shape.x + shape.width);
    maxY = Math.max(maxY, shape.y + shape.height);
    minY = Math.min(minY, shape.y);
  }
  const x = maxX + PLACE_GAP;
  if (x + TARGET_SPAN <= SHEET_WIDTH - SHEET_EDGE) {
    return { x, y: Math.max(SHEET_EDGE, minY) };
  }
  return { x: 64, y: Math.max(SHEET_EDGE, maxY + PLACE_GAP) };
}

function placeOnSheet(scene: Scene, anchorX: number, anchorY: number): Scene {
  const frames = sheetFramesOf(scene);
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const shape of sheetShapes({ scene, selectedId: null })) {
    minX = Math.min(minX, shape.x);
    minY = Math.min(minY, shape.y);
    maxX = Math.max(maxX, shape.x + shape.width);
    maxY = Math.max(maxY, shape.y + shape.height);
  }
  const span = Math.max(maxX - minX, maxY - minY);
  if (!(span > 0) || !Number.isFinite(span)) {
    throw new DomainError("INVALID_EXTENT", EXTENT);
  }
  const factor = span < MIN_SPAN || span > MAX_SPAN ? TARGET_SPAN / span : 1;
  const fittedWidth = (maxX - minX) * factor;
  const fittedHeight = (maxY - minY) * factor;
  let originX = anchorX;
  let originY = anchorY;
  if (originX + fittedWidth > SHEET_WIDTH - SHEET_EDGE) {
    originX = Math.max(SHEET_EDGE, SHEET_WIDTH - SHEET_EDGE - fittedWidth);
  }
  if (originY + fittedHeight > SHEET_HEIGHT - SHEET_EDGE) {
    originY = Math.max(SHEET_EDGE, SHEET_HEIGHT - SHEET_EDGE - fittedHeight);
  }
  const offsetX = originX - minX * factor;
  const offsetY = originY - minY * factor;
  const worlds = new Map<string, WorldPoint>();
  for (const [id, frame] of frames) {
    if (frame.sx === 0 || frame.sy === 0 || frame.sz === 0) {
      throw new DomainError("INVALID_EXTENT", EXTENT);
    }
    worlds.set(id, {
      x: frame.x * factor + offsetX,
      y: frame.y * factor + offsetY,
      z: frame.z * factor,
    });
  }
  return rewrite(scene, frames, worlds, factor);
}

type WorldPoint = {
  readonly x: number;
  readonly y: number;
  readonly z: number;
};

type PlacedParent = WorldPoint & {
  readonly sx: number;
  readonly sy: number;
  readonly sz: number;
};

function rewrite(
  scene: Scene,
  frames: ReadonlyMap<string, SheetFrame>,
  worlds: ReadonlyMap<string, WorldPoint>,
  factor: number,
): Scene {
  let next = createScene();
  const visit = (
    id: string,
    parentId: string | null,
    parent: PlacedParent | null,
  ): void => {
    const node = scene.nodes[id];
    const frame = frames.get(id);
    const world = worlds.get(id);
    if (node === undefined || frame === undefined || world === undefined) {
      throw new DomainError("INVALID_SHAPE", SHAPE);
    }
    const scaleX = signedUnit(node.transform.scale[0]);
    const scaleY = signedUnit(node.transform.scale[1]);
    const scaleZ = signedUnit(node.transform.scale[2]);
    if (scaleX === 0 || scaleY === 0 || scaleZ === 0) {
      throw new DomainError("INVALID_EXTENT", EXTENT);
    }
    const width = node.width * Math.abs(frame.sx) * factor;
    const height = node.height * Math.abs(frame.sy) * factor;
    const position = localFromWorld(world, parent);
    const index =
      parentId === null
        ? next.rootIds.length
        : (next.nodes[parentId]?.childIds.length ?? 0);
    const transform = {
      position,
      rotation: [
        node.transform.rotation[0],
        node.transform.rotation[1],
        node.transform.rotation[2],
      ],
      scale: [scaleX, scaleY, scaleZ],
    };
    if (node.kind === "box") {
      next = insertNode(next, {
        id: node.id,
        kind: node.kind,
        parentId,
        index,
        transform,
        width,
        height,
        depth: node.depth * Math.abs(frame.sz) * factor,
      });
    } else {
      next = insertNode(next, {
        id: node.id,
        kind: node.kind,
        parentId,
        index,
        transform,
        width,
        height,
      });
    }
    const placedParent = {
      x: world.x,
      y: world.y,
      z: world.z,
      sx: (parent?.sx ?? 1) * scaleX,
      sy: (parent?.sy ?? 1) * scaleY,
      sz: (parent?.sz ?? 1) * scaleZ,
    };
    for (const child of node.childIds) {
      visit(child, node.id, placedParent);
    }
  };
  for (const rootId of scene.rootIds) {
    visit(rootId, null, null);
  }
  return next;
}

function localFromWorld(
  world: WorldPoint,
  parent: PlacedParent | null,
): [number, number, number] {
  if (parent === null) {
    return [world.x, world.y, world.z];
  }
  return [
    (world.x - parent.x) / parent.sx,
    (world.y - parent.y) / parent.sy,
    (world.z - parent.z) / parent.sz,
  ];
}

function signedUnit(value: number): number {
  if (value < 0) {
    return -1;
  }
  if (value > 0) {
    return 1;
  }
  return 0;
}

function mergeScene(
  base: Scene,
  incoming: Scene,
): { readonly scene: Scene; readonly importedRootIds: readonly string[] } {
  const used = new Set(Object.keys(base.nodes));
  const ids = new Map<string, string>();
  for (const id of Object.keys(incoming.nodes)) {
    ids.set(id, unusedId(used, id));
  }
  let scene = base;
  const importedRootIds: string[] = [];
  const visit = (id: string, parentId: string | null): void => {
    const node = incoming.nodes[id];
    const mapped = ids.get(id);
    const mappedParent = parentId === null ? null : ids.get(parentId);
    if (
      node === undefined ||
      mapped === undefined ||
      (parentId !== null && mappedParent === undefined)
    ) {
      throw new DomainError("INVALID_SHAPE", SHAPE);
    }
    scene = insertCopy(scene, node, mapped, mappedParent ?? null);
    for (const child of node.childIds) {
      visit(child, node.id);
    }
  };
  for (const rootId of incoming.rootIds) {
    visit(rootId, null);
    const mapped = ids.get(rootId);
    if (mapped !== undefined) {
      importedRootIds.push(mapped);
    }
  }
  return { scene, importedRootIds };
}

function insertCopy(
  scene: Scene,
  node: SceneNode,
  id: string,
  parentId: string | null,
): Scene {
  const index =
    parentId === null
      ? scene.rootIds.length
      : (scene.nodes[parentId]?.childIds.length ?? 0);
  const transform = {
    position: [
      node.transform.position[0],
      node.transform.position[1],
      node.transform.position[2],
    ],
    rotation: [
      node.transform.rotation[0],
      node.transform.rotation[1],
      node.transform.rotation[2],
    ],
    scale: [
      node.transform.scale[0],
      node.transform.scale[1],
      node.transform.scale[2],
    ],
  };
  if (node.kind === "box") {
    return insertNode(scene, {
      id,
      kind: node.kind,
      parentId,
      index,
      transform,
      width: node.width,
      height: node.height,
      depth: node.depth,
    });
  }
  return insertNode(scene, {
    id,
    kind: node.kind,
    parentId,
    index,
    transform,
    width: node.width,
    height: node.height,
  });
}

function sceneFromNode(scene: Scene, rootId: string): Scene {
  if (!Object.hasOwn(scene.nodes, rootId)) {
    throw new DomainError("UNKNOWN_NODE", "Scene node was not found.");
  }
  let next = createScene();
  const visit = (id: string, parentId: string | null): void => {
    const node = scene.nodes[id];
    if (node === undefined) {
      throw new DomainError("INVALID_SHAPE", SHAPE);
    }
    next = insertCopy(next, node, node.id, parentId);
    for (const child of node.childIds) {
      visit(child, node.id);
    }
  };
  visit(rootId, null);
  return next;
}

function unusedId(used: Set<string>, preferred: string): string {
  if (!used.has(preferred)) {
    used.add(preferred);
    return preferred;
  }
  for (let number = 2; number < 10000; number += 1) {
    const suffix = `-${number}`;
    const id = `${utf8Prefix(preferred, ID_BYTES_MAX - suffix.length)}${suffix}`;
    if (used.has(id) || id.normalize("NFC") !== id) {
      continue;
    }
    const size = utf8Size(id);
    if (size < 1 || size > ID_BYTES_MAX) {
      continue;
    }
    used.add(id);
    return id;
  }
  throw new DomainError("INVALID_ID", ID);
}

function utf8Size(value: string): number {
  let bytes = 0;
  for (const char of value) {
    bytes += utf8Bytes(char.codePointAt(0) ?? 0);
  }
  return bytes;
}

function utf8Prefix(value: string, maxBytes: number): string {
  if (maxBytes <= 0) {
    return "";
  }
  let bytes = 0;
  let end = 0;
  for (const char of value) {
    const size = utf8Bytes(char.codePointAt(0) ?? 0);
    if (bytes + size > maxBytes) {
      break;
    }
    bytes += size;
    end += char.length;
  }
  return value.slice(0, end);
}

function utf8Bytes(code: number): number {
  if (code <= 0x7f) {
    return 1;
  }
  if (code <= 0x7ff) {
    return 2;
  }
  if (code <= 0xffff) {
    return 3;
  }
  return 4;
}

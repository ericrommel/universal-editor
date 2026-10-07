import {
  createScene,
  DomainError,
  deleteNode,
  insertNode,
  replaceExtents,
  replaceTransform,
  type Scene,
  type SceneNode,
} from "@uvcp/core";
import { readScene, writeScene } from "@uvcp/persistence";

export const SCENE_BYTE_LIMIT = 1048576;
export const SCENE_TOO_LARGE = "Scene document exceeds the size limit.";

const HISTORY_LIMIT = 50;
const BOX_DX = 0.45;
const BOX_DY = -0.35;

export type ShapeKind = "rectangle" | "box";

export type EditorDocument = {
  readonly scene: Scene;
  readonly selectedId: string | null;
};

export type EditorHistory = {
  readonly past: readonly EditorDocument[];
  readonly present: EditorDocument;
  readonly future: readonly EditorDocument[];
  // Selection can change without a new step. Undo copies this commit,
  // not the selection chosen afterward.
  readonly anchor: EditorDocument;
};

export type EditorShape = {
  readonly id: string;
  readonly kind: ShapeKind;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly depth: number | null;
  readonly rotation: number;
};

export type Frame = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

export type ResizeHandle = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

export const PAGE_WIDTH = 960;
export const PAGE_HEIGHT = 600;

const PLACEMENT_COLUMNS = 4;
const PLACEMENT_ROWS = 3;
const PLACEMENT_X = 48;
const PLACEMENT_Y = 48;
const PLACEMENT_COLUMN = 200;
const PLACEMENT_ROW = 168;
const MIN_ON_PAGE = 24;
// A handle can drag through zero. The scene rejects that extent, so the
// handle stops on a positive value instead of failing the gesture.
const MIN_HANDLE_EXTENT = 0.001;
const EAST = new Set<ResizeHandle>(["e", "ne", "se"]);
const WEST = new Set<ResizeHandle>(["w", "nw", "sw"]);
const SOUTH = new Set<ResizeHandle>(["s", "se", "sw"]);
const NORTH = new Set<ResizeHandle>(["n", "ne", "nw"]);

export function createHistory(): EditorHistory {
  const present = { scene: createScene(), selectedId: null };
  return { past: [], present, future: [], anchor: present };
}

export function addShape(
  history: EditorHistory,
  kind: ShapeKind,
): EditorHistory {
  const scene = history.present.scene;
  const id = nextId(scene);
  const origin = shapeOrigin(scene.rootIds.length);
  const created = insertNode(scene, {
    id,
    kind,
    parentId: null,
    index: scene.rootIds.length,
    transform: {
      position: [origin.x, origin.y, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    width: kind === "box" ? 120 : 160,
    height: kind === "box" ? 80 : 100,
    ...(kind === "box" ? { depth: 48 } : {}),
  });
  return commit(history, { scene: created, selectedId: id });
}

export function selectShape(
  document: EditorDocument,
  id: string | null,
): EditorDocument {
  if (id !== null && !Object.hasOwn(document.scene.nodes, id)) {
    return { scene: document.scene, selectedId: null };
  }
  return { scene: document.scene, selectedId: id };
}

export function moveShape(
  document: EditorDocument,
  id: string,
  x: number,
  y: number,
): EditorDocument {
  const node = document.scene.nodes[id];
  if (!node) {
    return document;
  }
  const scene = replaceTransform(document.scene, id, {
    position: [x, y, node.transform.position[2]],
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
  });
  return { scene, selectedId: document.selectedId };
}

export function resizeShape(
  document: EditorDocument,
  id: string,
  width: number,
  height: number,
  depth: number | null,
): EditorDocument {
  const node = document.scene.nodes[id];
  if (!node) {
    return document;
  }
  const extents =
    node.kind === "box"
      ? { width, height, depth: depth ?? node.depth }
      : { width, height };
  const scene = replaceExtents(document.scene, id, extents);
  return { scene, selectedId: document.selectedId };
}

export function rotateShape(
  document: EditorDocument,
  id: string,
  degrees: number,
): EditorDocument {
  const node = document.scene.nodes[id];
  if (!node) {
    return document;
  }
  const scene = replaceTransform(document.scene, id, {
    position: [
      node.transform.position[0],
      node.transform.position[1],
      node.transform.position[2],
    ],
    rotation: [node.transform.rotation[0], node.transform.rotation[1], degrees],
    scale: [
      node.transform.scale[0],
      node.transform.scale[1],
      node.transform.scale[2],
    ],
  });
  return { scene, selectedId: document.selectedId };
}

export function deleteSelected(document: EditorDocument): EditorDocument {
  if (document.selectedId === null) {
    return document;
  }
  if (!Object.hasOwn(document.scene.nodes, document.selectedId)) {
    return { scene: document.scene, selectedId: null };
  }
  return {
    scene: deleteNode(document.scene, document.selectedId),
    selectedId: null,
  };
}

export function replacePresent(
  history: EditorHistory,
  present: EditorDocument,
): EditorHistory {
  return {
    past: history.past,
    present,
    future: history.future,
    anchor: history.anchor,
  };
}

export function commitPresent(
  base: EditorHistory,
  present: EditorDocument,
): EditorHistory {
  if (present.scene === base.anchor.scene) {
    return {
      past: base.past,
      present,
      future: base.future,
      anchor: base.anchor,
    };
  }
  return commit(base, present);
}

export function undo(history: EditorHistory): EditorHistory {
  const previous = history.past[history.past.length - 1];
  if (!previous) {
    return history;
  }
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.anchor, ...history.future],
    anchor: previous,
  };
}

export function redo(history: EditorHistory): EditorHistory {
  const next = history.future[0];
  if (!next) {
    return history;
  }
  return {
    past: [...history.past, history.anchor],
    present: next,
    future: history.future.slice(1),
    anchor: next,
  };
}

export function shapesOf(document: EditorDocument): readonly EditorShape[] {
  const shapes: EditorShape[] = [];
  const pending = [...document.scene.rootIds].reverse();
  const seen = new Set<string>();
  while (pending.length > 0) {
    const id = pending.pop();
    if (id === undefined || seen.has(id)) {
      continue;
    }
    seen.add(id);
    const node = document.scene.nodes[id];
    if (!node) {
      continue;
    }
    shapes.push(toShape(node));
    for (let index = node.childIds.length - 1; index >= 0; index -= 1) {
      const child = node.childIds[index];
      if (child !== undefined) {
        pending.push(child);
      }
    }
  }
  return shapes;
}

export function shapeAt(
  shapes: readonly EditorShape[],
  x: number,
  y: number,
): string | null {
  for (let index = shapes.length - 1; index >= 0; index -= 1) {
    const shape = shapes[index];
    if (shape && hits(shape, x, y)) {
      return shape.id;
    }
  }
  return null;
}

export function dragPosition(
  origin: { readonly x: number; readonly y: number },
  start: { readonly x: number; readonly y: number },
  point: { readonly x: number; readonly y: number },
): { readonly x: number; readonly y: number } {
  return {
    x: origin.x + (point.x - start.x),
    y: origin.y + (point.y - start.y),
  };
}

export function containedPosition(
  size: { readonly width: number; readonly height: number },
  x: number,
  y: number,
): { readonly x: number; readonly y: number } {
  return {
    x: clampOnPage(x, size.width, PAGE_WIDTH),
    y: clampOnPage(y, size.height, PAGE_HEIGHT),
  };
}

export function resizedFrame(
  origin: Frame,
  handle: ResizeHandle,
  dx: number,
  dy: number,
): Frame {
  let x = origin.x;
  let y = origin.y;
  let width = origin.width;
  let height = origin.height;
  const right = origin.x + origin.width;
  const bottom = origin.y + origin.height;
  if (EAST.has(handle)) {
    width = origin.width + dx;
  }
  if (WEST.has(handle)) {
    width = origin.width - dx;
    x = origin.x + dx;
  }
  if (SOUTH.has(handle)) {
    height = origin.height + dy;
  }
  if (NORTH.has(handle)) {
    height = origin.height - dy;
    y = origin.y + dy;
  }
  if (!(width > 0)) {
    width = MIN_HANDLE_EXTENT;
    if (WEST.has(handle)) {
      x = right - width;
    }
  }
  if (!(height > 0)) {
    height = MIN_HANDLE_EXTENT;
    if (NORTH.has(handle)) {
      y = bottom - height;
    }
  }
  return { x, y, width, height };
}

export function resizedDepth(depth: number, dx: number, dy: number): number {
  const lengthSquared = BOX_DX * BOX_DX + BOX_DY * BOX_DY;
  const delta = (dx * BOX_DX + dy * BOX_DY) / lengthSquared;
  const next = depth + delta;
  return next > 0 ? next : MIN_HANDLE_EXTENT;
}

export function placeShape(
  document: EditorDocument,
  id: string,
  frame: Frame,
  depth: number | null,
): EditorDocument {
  const node = document.scene.nodes[id];
  if (!node) {
    return document;
  }
  const nextDepth = node.kind === "box" ? (depth ?? node.depth) : null;
  const sizeChanged =
    node.width !== frame.width ||
    node.height !== frame.height ||
    (node.kind === "box" && nextDepth !== node.depth);
  let next = document;
  if (sizeChanged) {
    next = resizeShape(
      next,
      id,
      frame.width,
      frame.height,
      node.kind === "box" ? nextDepth : null,
    );
  }
  const placed = next.scene.nodes[id];
  if (!placed) {
    return next;
  }
  if (
    placed.transform.position[0] !== frame.x ||
    placed.transform.position[1] !== frame.y
  ) {
    next = moveShape(next, id, frame.x, frame.y);
  }
  return next;
}

export function exportDocument(document: EditorDocument): Uint8Array {
  return writeScene(document.scene);
}

export function importDocument(bytes: Uint8Array): EditorDocument {
  return { scene: readScene(bytes), selectedId: null };
}

export function openDocument(
  history: EditorHistory,
  byteLength: number,
  read: () => Uint8Array,
): { readonly history: EditorHistory; readonly message: string | null } {
  if (byteLength > SCENE_BYTE_LIMIT) {
    return { history, message: SCENE_TOO_LARGE };
  }
  try {
    return {
      history: commitPresent(history, importDocument(read())),
      message: null,
    };
  } catch (error) {
    return { history, message: editorErrorMessage(error) };
  }
}

export function editorErrorMessage(error: unknown): string {
  if (error instanceof DomainError) {
    return error.message;
  }
  return "Scene shape is not accepted.";
}

export function boxShift(depth: number): {
  readonly dx: number;
  readonly dy: number;
} {
  return { dx: depth * BOX_DX, dy: depth * BOX_DY };
}

function commit(
  history: EditorHistory,
  present: EditorDocument,
): EditorHistory {
  return {
    past: [...history.past, history.anchor].slice(-HISTORY_LIMIT),
    present,
    future: [],
    anchor: present,
  };
}

function shapeOrigin(index: number): {
  readonly x: number;
  readonly y: number;
} {
  const page = PLACEMENT_COLUMNS * PLACEMENT_ROWS;
  const cycle = Math.floor(index / page);
  const slot = index % page;
  const nudge = (cycle % 4) * 20;
  return {
    x: PLACEMENT_X + (slot % PLACEMENT_COLUMNS) * PLACEMENT_COLUMN + nudge,
    y:
      PLACEMENT_Y +
      Math.floor(slot / PLACEMENT_COLUMNS) * PLACEMENT_ROW +
      nudge,
  };
}

function clampOnPage(origin: number, length: number, page: number): number {
  const keep = Math.min(MIN_ON_PAGE, length);
  const min = keep - length;
  const max = page - keep;
  if (max < min || origin < min) {
    return min;
  }
  if (origin > max) {
    return max;
  }
  return origin;
}

function nextId(scene: Scene): string {
  for (let index = 1; index < 100000; index += 1) {
    const id = `s${index}`;
    if (!Object.hasOwn(scene.nodes, id)) {
      return id;
    }
  }
  throw new DomainError("INVALID_ID", "Scene id is not accepted.");
}

function toShape(node: SceneNode): EditorShape {
  return {
    id: node.id,
    kind: node.kind,
    x: node.transform.position[0],
    y: node.transform.position[1],
    width: node.width,
    height: node.height,
    depth: node.kind === "box" ? node.depth : null,
    rotation: node.transform.rotation[2],
  };
}

function hits(shape: EditorShape, x: number, y: number): boolean {
  const centerX = shape.x + shape.width / 2;
  const centerY = shape.y + shape.height / 2;
  const angle = (shape.rotation * Math.PI) / 180;
  const dx = x - centerX;
  const dy = y - centerY;
  const localX = dx * Math.cos(angle) + dy * Math.sin(angle) + centerX;
  const localY = -dx * Math.sin(angle) + dy * Math.cos(angle) + centerY;
  if (contains(shape.x, shape.y, shape.width, shape.height, localX, localY)) {
    return true;
  }
  if (shape.depth === null) {
    return false;
  }
  const shift = boxShift(shape.depth);
  return contains(
    shape.x + shift.dx,
    shape.y + shift.dy,
    shape.width,
    shape.height,
    localX,
    localY,
  );
}

function contains(
  left: number,
  top: number,
  width: number,
  height: number,
  x: number,
  y: number,
): boolean {
  return x >= left && y >= top && x < left + width && y < top + height;
}

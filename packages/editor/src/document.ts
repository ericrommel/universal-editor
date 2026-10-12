import {
  createScene,
  DomainError,
  deleteNode,
  insertNode,
  reorderNode,
  replaceExtents,
  replaceFill,
  replaceText,
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
const DEGREES_PER_RADIAN = 180 / Math.PI;

// The scene triple is radians, the same unit glTF reads and writes.
// The sheet, the size form, and the assistant speak degrees. Convert
// only through these two functions so a saved scene and an export match.
export function radiansFromDegrees(degrees: number): number {
  return degrees / DEGREES_PER_RADIAN;
}

export function degreesFromRadians(radians: number): number {
  return radians * DEGREES_PER_RADIAN;
}

export const SHEET_WIDTH = 960;
export const SHEET_HEIGHT = 600;

export type ShapeKind = "rectangle" | "box" | "ellipse" | "text";

export type EditorDocument = {
  readonly scene: Scene;
  readonly selectedId: string | null;
};

export type EditorHistory = {
  readonly past: readonly EditorDocument[];
  readonly present: EditorDocument;
  readonly future: readonly EditorDocument[];
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
  readonly fill: string;
  readonly text: string | null;
  readonly fontSize: number | null;
};

export function createHistory(): EditorHistory {
  return {
    past: [],
    present: { scene: createScene(), selectedId: null },
    future: [],
  };
}

export function addShape(
  history: EditorHistory,
  kind: ShapeKind,
): EditorHistory {
  const scene = history.present.scene;
  const id = nextId(scene);
  const offset = scene.rootIds.length * 24;
  const created = insertNode(scene, {
    id,
    kind,
    parentId: null,
    index: scene.rootIds.length,
    transform: {
      position: [64 + offset, 64 + offset, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    ...newExtents(kind),
  });
  return commit(history, { scene: created, selectedId: id });
}

export function paintShape(
  document: EditorDocument,
  id: string,
  fill: unknown,
): EditorDocument {
  if (!Object.hasOwn(document.scene.nodes, id)) {
    return document;
  }
  return {
    scene: replaceFill(document.scene, id, fill),
    selectedId: document.selectedId,
  };
}

export function editText(
  document: EditorDocument,
  id: string,
  text: unknown,
  fontSize: unknown,
): EditorDocument {
  const node = document.scene.nodes[id];
  if (node?.kind !== "text") {
    return document;
  }
  return {
    scene: replaceText(document.scene, id, { text, fontSize }),
    selectedId: document.selectedId,
  };
}

export function orderShape(
  document: EditorDocument,
  id: string,
  direction: "forward" | "backward",
): EditorDocument {
  const place = siblingPlace(document.scene, id);
  if (place === null) {
    return document;
  }
  const next = direction === "forward" ? place.index + 1 : place.index - 1;
  if (next < 0 || next >= place.list.length) {
    return document;
  }
  return {
    scene: reorderNode(document.scene, id, next),
    selectedId: document.selectedId,
  };
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
  const local = localPoint(document.scene, id, x, y);
  if (local === null) {
    return document;
  }
  const scene = replaceTransform(document.scene, id, {
    position: [local.x, local.y, node.transform.position[2]],
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
    rotation: [
      node.transform.rotation[0],
      node.transform.rotation[1],
      radiansFromDegrees(degrees),
    ],
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
  return { past: history.past, present, future: history.future };
}

export function commitPresent(
  base: EditorHistory,
  present: EditorDocument,
): EditorHistory {
  if (present.scene === base.present.scene) {
    return { past: base.past, present, future: base.future };
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
    future: [history.present, ...history.future],
  };
}

export function redo(history: EditorHistory): EditorHistory {
  const next = history.future[0];
  if (!next) {
    return history;
  }
  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(1),
  };
}

export type SheetFrame = {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly sx: number;
  readonly sy: number;
  readonly sz: number;
};

export function sheetFramesOf(scene: Scene): ReadonlyMap<string, SheetFrame> {
  const parents = parentIds(scene);
  const frames = new Map<string, SheetFrame>();
  const pending = [...scene.rootIds].reverse();
  const seen = new Set<string>();
  while (pending.length > 0) {
    const id = pending.pop();
    if (id === undefined || seen.has(id)) {
      continue;
    }
    seen.add(id);
    const node = scene.nodes[id];
    if (!node) {
      continue;
    }
    const parentId = parents.get(id) ?? null;
    const parent = parentId === null ? undefined : frames.get(parentId);
    frames.set(id, frameFor(node, parent));
    for (let index = node.childIds.length - 1; index >= 0; index -= 1) {
      const child = node.childIds[index];
      if (child !== undefined) {
        pending.push(child);
      }
    }
  }
  return frames;
}

export function sheetShapes(document: EditorDocument): readonly EditorShape[] {
  const shapes: EditorShape[] = [];
  for (const [id, frame] of sheetFramesOf(document.scene)) {
    const node = document.scene.nodes[id];
    if (!node) {
      continue;
    }
    shapes.push({
      id: node.id,
      kind: node.kind,
      x: frame.x,
      y: frame.y,
      width: node.width * Math.abs(frame.sx),
      height: node.height * Math.abs(frame.sy),
      depth: node.kind === "box" ? node.depth * Math.abs(frame.sz) : null,
      rotation: degreesFromRadians(node.transform.rotation[2]),
      fill: node.fill,
      text: node.kind === "text" ? node.text : null,
      fontSize: node.kind === "text" ? node.fontSize : null,
    });
  }
  return shapes;
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
    past: [...history.past, history.present].slice(-HISTORY_LIMIT),
    present,
    future: [],
  };
}

function localPoint(
  scene: Scene,
  id: string,
  x: number,
  y: number,
): { readonly x: number; readonly y: number } | null {
  const parentId = parentIdOf(scene, id);
  if (parentId === null) {
    return { x, y };
  }
  const parent = sheetFramesOf(scene).get(parentId);
  if (parent === undefined || parent.sx === 0 || parent.sy === 0) {
    return null;
  }
  return {
    x: (x - parent.x) / parent.sx,
    y: (y - parent.y) / parent.sy,
  };
}

function parentIdOf(scene: Scene, id: string): string | null {
  if (scene.rootIds.includes(id)) {
    return null;
  }
  for (const key of Object.keys(scene.nodes)) {
    const node = scene.nodes[key];
    if (node?.childIds.includes(id)) {
      return node.id;
    }
  }
  return null;
}

function parentIds(scene: Scene): Map<string, string | null> {
  const parents = new Map<string, string | null>();
  for (const id of scene.rootIds) {
    parents.set(id, null);
  }
  for (const key of Object.keys(scene.nodes)) {
    const node = scene.nodes[key];
    if (!node) {
      continue;
    }
    for (const child of node.childIds) {
      parents.set(child, node.id);
    }
  }
  return parents;
}

function frameFor(node: SceneNode, parent: SheetFrame | undefined): SheetFrame {
  const scaleX = node.transform.scale[0];
  const scaleY = node.transform.scale[1];
  const scaleZ = node.transform.scale[2];
  if (parent === undefined) {
    return {
      x: node.transform.position[0],
      y: node.transform.position[1],
      z: node.transform.position[2],
      sx: scaleX,
      sy: scaleY,
      sz: scaleZ,
    };
  }
  return {
    x: parent.x + node.transform.position[0] * parent.sx,
    y: parent.y + node.transform.position[1] * parent.sy,
    z: parent.z + node.transform.position[2] * parent.sz,
    sx: parent.sx * scaleX,
    sy: parent.sy * scaleY,
    sz: parent.sz * scaleZ,
  };
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
    rotation: degreesFromRadians(node.transform.rotation[2]),
    fill: node.fill,
    text: node.kind === "text" ? node.text : null,
    fontSize: node.kind === "text" ? node.fontSize : null,
  };
}

function newExtents(kind: ShapeKind): {
  readonly width: number;
  readonly height: number;
  readonly depth?: number;
  readonly text?: string;
  readonly fontSize?: number;
} {
  if (kind === "box") {
    return { width: 120, height: 80, depth: 48 };
  }
  if (kind === "ellipse") {
    return { width: 140, height: 100 };
  }
  if (kind === "text") {
    return { width: 240, height: 72, text: "Text", fontSize: 32 };
  }
  return { width: 160, height: 100 };
}

function siblingPlace(
  scene: Scene,
  id: string,
): { readonly list: readonly string[]; readonly index: number } | null {
  if (scene.rootIds.includes(id)) {
    return { list: scene.rootIds, index: scene.rootIds.indexOf(id) };
  }
  for (const key of Object.keys(scene.nodes)) {
    const node = scene.nodes[key];
    if (node?.childIds.includes(id)) {
      return { list: node.childIds, index: node.childIds.indexOf(id) };
    }
  }
  return null;
}

function hits(shape: EditorShape, x: number, y: number): boolean {
  const centerX = shape.x + shape.width / 2;
  const centerY = shape.y + shape.height / 2;
  const angle = (shape.rotation * Math.PI) / 180;
  const dx = x - centerX;
  const dy = y - centerY;
  const localX = dx * Math.cos(angle) + dy * Math.sin(angle) + centerX;
  const localY = -dx * Math.sin(angle) + dy * Math.cos(angle) + centerY;
  if (shape.kind === "ellipse") {
    return hitsEllipse(shape, localX, localY);
  }
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

function hitsEllipse(shape: EditorShape, x: number, y: number): boolean {
  const rx = shape.width / 2;
  const ry = shape.height / 2;
  if (!(rx > 0) || !(ry > 0)) {
    return false;
  }
  const nx = (x - (shape.x + rx)) / rx;
  const ny = (y - (shape.y + ry)) / ry;
  return nx * nx + ny * ny <= 1;
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

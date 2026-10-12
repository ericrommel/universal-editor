import { DomainError } from "./domain-error.ts";
import {
  canonicalizeFiniteNumber,
  canonicalizeFiniteTriple,
} from "./number.ts";

const INVALID_SHAPE = "Scene shape is not accepted.";
const INVALID_ID = "Scene id is not accepted.";
const DUPLICATE_ID = "Scene contains a duplicate id.";
const INVALID_HIERARCHY = "Scene hierarchy is not accepted.";
const INVALID_EXTENT = "Scene extent is not accepted.";
const INVALID_FILL = "Scene fill is not accepted.";
const INVALID_TEXT = "Scene text is not accepted.";
const UNKNOWN_NODE = "Scene node was not found.";

const ID_BYTES_MAX = 64;
const TEXT_MAX = 400;
const FONT_SIZE_MAX = 512;
const FILL_PATTERN = /^#[0-9a-fA-F]{6}$/;

export type SceneKind = "rectangle" | "box" | "ellipse" | "text";

// Schema 1 documents have no fill. These are the colors the sheet already used.
export const DEFAULT_FILL: Readonly<Record<SceneKind, string>> = {
  rectangle: "#dbe7ff",
  ellipse: "#d1fae5",
  text: "#1e293b",
  box: "#dbe7ff",
};

export type Triple = readonly [number, number, number];

export type Transform = {
  readonly position: Triple;
  readonly rotation: Triple;
  readonly scale: Triple;
};

export type RectangleNode = {
  readonly id: string;
  readonly kind: "rectangle";
  readonly childIds: readonly string[];
  readonly transform: Transform;
  readonly width: number;
  readonly height: number;
  readonly fill: string;
};

export type EllipseNode = {
  readonly id: string;
  readonly kind: "ellipse";
  readonly childIds: readonly string[];
  readonly transform: Transform;
  readonly width: number;
  readonly height: number;
  readonly fill: string;
};

export type TextNode = {
  readonly id: string;
  readonly kind: "text";
  readonly childIds: readonly string[];
  readonly transform: Transform;
  readonly width: number;
  readonly height: number;
  readonly fill: string;
  readonly text: string;
  readonly fontSize: number;
};

export type BoxNode = {
  readonly id: string;
  readonly kind: "box";
  readonly childIds: readonly string[];
  readonly transform: Transform;
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly fill: string;
};

export type SceneNode = RectangleNode | EllipseNode | TextNode | BoxNode;

export type Scene = {
  readonly rootIds: readonly string[];
  readonly nodes: Readonly<Record<string, SceneNode>>;
};

type InsertShape = {
  readonly id: string;
  readonly kind: SceneKind;
  readonly parentId: string | null;
  readonly index: unknown;
  readonly width: unknown;
  readonly height: unknown;
  readonly depth: unknown;
  readonly fill: unknown;
  readonly hasFill: boolean;
  readonly text: unknown;
  readonly fontSize: unknown;
  readonly position: unknown;
  readonly rotation: unknown;
  readonly scale: unknown;
};

type NodeParts = {
  readonly id: string;
  readonly kind: SceneKind;
  readonly childIds: readonly string[];
  readonly transform: Transform;
  readonly width: number;
  readonly height: number;
  readonly depth: number | undefined;
  readonly fill: string;
  readonly text: string | undefined;
  readonly fontSize: number | undefined;
};

export function createScene(): Scene {
  return publish([], emptyNodes());
}

export function insertNode(scene: Scene, input: unknown): Scene {
  const shape = insertShape(input);
  acceptId(shape.id);
  if (Object.hasOwn(scene.nodes, shape.id)) {
    throw new DomainError("DUPLICATE_ID", DUPLICATE_ID);
  }
  const parent = parentList(scene, shape.parentId);
  const index = indexInRange(shape.index, parent.length);
  const transform = transformFrom(shape.position, shape.rotation, shape.scale);
  const width = canonicalizeFiniteNumber(shape.width);
  const height = canonicalizeFiniteNumber(shape.height);
  const depth =
    shape.kind === "box" ? canonicalizeFiniteNumber(shape.depth) : undefined;
  assertPositive(width);
  assertPositive(height);
  if (depth !== undefined) {
    assertPositive(depth);
  }
  const fill = shape.hasFill
    ? acceptFill(shape.fill)
    : DEFAULT_FILL[shape.kind];
  const text = shape.kind === "text" ? acceptText(shape.text) : undefined;
  const fontSize =
    shape.kind === "text" ? acceptFontSize(shape.fontSize) : undefined;
  const node = freezeNode({
    id: shape.id,
    kind: shape.kind,
    childIds: Object.freeze([]),
    transform,
    width,
    height,
    depth,
    fill,
    text,
    fontSize,
  });
  const rootIds = scene.rootIds.slice();
  const nodes = copyNodes(scene);
  const nextList = parent.slice();
  nextList.splice(index, 0, shape.id);
  const frozenList = Object.freeze(nextList);
  if (shape.parentId === null) {
    nodes[shape.id] = node;
    return publish(frozenList, nodes);
  }
  const parentNode = nodes[shape.parentId];
  if (!parentNode) {
    throw new DomainError("UNKNOWN_NODE", UNKNOWN_NODE);
  }
  nodes[shape.id] = node;
  nodes[shape.parentId] = withChildIds(parentNode, frozenList);
  return publish(rootIds, nodes);
}

export function replaceTransform(
  scene: Scene,
  id: unknown,
  transform: unknown,
): Scene {
  const node = existingNode(scene, id);
  const next = transformFromUnknown(transform);
  const nodes = copyNodes(scene);
  nodes[node.id] = withTransform(node, next);
  return publish(scene.rootIds, nodes);
}

export function replaceExtents(
  scene: Scene,
  id: unknown,
  extents: unknown,
): Scene {
  const node = existingNode(scene, id);
  const fields = extentFields(node.kind, extents);
  const width = canonicalizeFiniteNumber(fields.width);
  const height = canonicalizeFiniteNumber(fields.height);
  const depth =
    node.kind === "box" ? canonicalizeFiniteNumber(fields.depth) : undefined;
  assertPositive(width);
  assertPositive(height);
  if (depth !== undefined) {
    assertPositive(depth);
  }
  const nodes = copyNodes(scene);
  nodes[node.id] = withExtents(node, width, height, depth);
  return publish(scene.rootIds, nodes);
}

export function replaceFill(scene: Scene, id: unknown, fill: unknown): Scene {
  const node = existingNode(scene, id);
  const next = acceptFill(fill);
  if (next === node.fill) {
    return scene;
  }
  const nodes = copyNodes(scene);
  nodes[node.id] = rebuild(node, { fill: next });
  return publish(scene.rootIds, nodes);
}

export function replaceText(scene: Scene, id: unknown, value: unknown): Scene {
  const node = existingNode(scene, id);
  if (node.kind !== "text") {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  if (!isRecord(value)) {
    throw new DomainError("INVALID_TEXT", INVALID_TEXT);
  }
  assertClosed(value, ["text", "fontSize"]);
  const text = acceptText(value.text);
  const fontSize = acceptFontSize(value.fontSize);
  if (text === node.text && fontSize === node.fontSize) {
    return scene;
  }
  const nodes = copyNodes(scene);
  nodes[node.id] = rebuild(node, { text, fontSize });
  return publish(scene.rootIds, nodes);
}

export function reorderNode(scene: Scene, id: unknown, index: unknown): Scene {
  const node = existingNode(scene, id);
  const parentId = parentIdOf(scene, node.id);
  const list =
    parentId === null
      ? scene.rootIds
      : (scene.nodes[parentId]?.childIds ?? emptyIds());
  const current = list.indexOf(node.id);
  if (current < 0) {
    throw new DomainError("INVALID_HIERARCHY", INVALID_HIERARCHY);
  }
  const destination = indexInRange(index, list.length - 1);
  if (destination === current) {
    return scene;
  }
  const next = list.slice();
  next.splice(current, 1);
  next.splice(destination, 0, node.id);
  const frozen = Object.freeze(next);
  if (parentId === null) {
    return publish(frozen, scene.nodes);
  }
  const parent = scene.nodes[parentId];
  if (!parent) {
    throw new DomainError("INVALID_HIERARCHY", INVALID_HIERARCHY);
  }
  const nodes = copyNodes(scene);
  nodes[parentId] = rebuild(parent, { childIds: frozen });
  return publish(scene.rootIds, nodes);
}

export function deleteNode(scene: Scene, id: unknown): Scene {
  const node = existingNode(scene, id);
  const removed = subtreeIds(scene, node.id);
  const nodes = emptyNodes();
  for (const key of Object.keys(scene.nodes)) {
    const current = scene.nodes[key];
    if (current && !removed.has(key)) {
      nodes[key] = current;
    }
  }
  const parentId = parentIdOf(scene, node.id);
  if (parentId === null) {
    return publish(withoutId(scene.rootIds, node.id), nodes);
  }
  const parent = nodes[parentId];
  if (!parent) {
    throw new DomainError("INVALID_HIERARCHY", INVALID_HIERARCHY);
  }
  nodes[parentId] = withChildIds(parent, withoutId(parent.childIds, node.id));
  return publish(scene.rootIds, nodes);
}

function insertShape(input: unknown): InsertShape {
  if (!isRecord(input)) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  const kind = input.kind;
  if (!isKind(kind)) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  const required = [
    "id",
    "kind",
    "parentId",
    "index",
    "transform",
    "width",
    "height",
  ];
  if (kind === "box") {
    required.push("depth");
  }
  if (kind === "text") {
    required.push("text", "fontSize");
  }
  assertFields(input, required, ["fill"]);
  if (typeof input.id !== "string") {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  if (input.parentId !== null && typeof input.parentId !== "string") {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  if (!isRecord(input.transform)) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  assertClosed(input.transform, ["position", "rotation", "scale"]);
  return {
    id: input.id,
    kind,
    parentId: input.parentId,
    index: input.index,
    width: input.width,
    height: input.height,
    depth: kind === "box" ? input.depth : undefined,
    fill: input.fill,
    hasFill: Object.hasOwn(input, "fill"),
    text: kind === "text" ? input.text : undefined,
    fontSize: kind === "text" ? input.fontSize : undefined,
    position: input.transform.position,
    rotation: input.transform.rotation,
    scale: input.transform.scale,
  };
}

function existingNode(scene: Scene, id: unknown): SceneNode {
  if (typeof id !== "string") {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  const node = scene.nodes[id];
  if (!node) {
    throw new DomainError("UNKNOWN_NODE", UNKNOWN_NODE);
  }
  return node;
}

function parentList(scene: Scene, parentId: string | null): readonly string[] {
  if (parentId === null) {
    return scene.rootIds;
  }
  const parent = scene.nodes[parentId];
  if (!parent) {
    throw new DomainError("UNKNOWN_NODE", UNKNOWN_NODE);
  }
  return parent.childIds;
}

function indexInRange(index: unknown, length: number): number {
  if (typeof index !== "number" || !Number.isInteger(index)) {
    throw new DomainError("INVALID_HIERARCHY", INVALID_HIERARCHY);
  }
  const normalized = index === 0 ? 0 : index;
  if (normalized < 0 || normalized > length) {
    throw new DomainError("INVALID_HIERARCHY", INVALID_HIERARCHY);
  }
  return normalized;
}

function assertPositive(value: number): void {
  if (!(value > 0)) {
    throw new DomainError("INVALID_EXTENT", INVALID_EXTENT);
  }
}

function transformFromUnknown(value: unknown): Transform {
  if (!isRecord(value)) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  assertClosed(value, ["position", "rotation", "scale"]);
  return transformFrom(value.position, value.rotation, value.scale);
}

function transformFrom(
  position: unknown,
  rotation: unknown,
  scale: unknown,
): Transform {
  return Object.freeze({
    position: freezeTriple(canonicalizeFiniteTriple(position)),
    rotation: freezeTriple(canonicalizeFiniteTriple(rotation)),
    scale: freezeTriple(canonicalizeFiniteTriple(scale)),
  });
}

function extentFields(
  kind: SceneKind,
  extents: unknown,
): {
  readonly width: unknown;
  readonly height: unknown;
  readonly depth: unknown;
} {
  if (!isRecord(extents)) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  const allowed =
    kind === "box" ? ["width", "height", "depth"] : ["width", "height"];
  assertClosed(extents, allowed);
  return {
    width: extents.width,
    height: extents.height,
    depth: kind === "box" ? extents.depth : undefined,
  };
}

function acceptId(id: string): void {
  // NFC is required, not rewritten. A decomposed lookalike is a different id.
  if (id.normalize("NFC") !== id) {
    throw new DomainError("INVALID_ID", INVALID_ID);
  }
  let bytes = 0;
  for (const char of id) {
    const code = char.codePointAt(0);
    if (code === undefined || code <= 0x1f || code === 0x7f) {
      throw new DomainError("INVALID_ID", INVALID_ID);
    }
    if (code <= 0x7f) {
      bytes += 1;
    } else if (code <= 0x7ff) {
      bytes += 2;
    } else if (code <= 0xffff) {
      bytes += 3;
    } else {
      bytes += 4;
    }
  }
  if (bytes < 1 || bytes > ID_BYTES_MAX) {
    throw new DomainError("INVALID_ID", INVALID_ID);
  }
}

function subtreeIds(scene: Scene, id: string): Set<string> {
  const removed = new Set<string>();
  const pending = [id];
  while (pending.length > 0) {
    const current = pending.pop();
    if (current === undefined || removed.has(current)) {
      continue;
    }
    removed.add(current);
    const node = scene.nodes[current];
    if (!node) {
      continue;
    }
    for (const child of node.childIds) {
      if (!removed.has(child)) {
        pending.push(child);
      }
    }
  }
  return removed;
}

function parentIdOf(scene: Scene, id: string): string | null {
  if (scene.rootIds.includes(id)) {
    return null;
  }
  for (const key of Object.keys(scene.nodes)) {
    const node = scene.nodes[key];
    if (node?.childIds.includes(id)) {
      return key;
    }
  }
  throw new DomainError("INVALID_HIERARCHY", INVALID_HIERARCHY);
}

function withoutId(ids: readonly string[], id: string): readonly string[] {
  const next: string[] = [];
  for (const item of ids) {
    if (item !== id) {
      next.push(item);
    }
  }
  return Object.freeze(next);
}

function withChildIds(node: SceneNode, childIds: readonly string[]): SceneNode {
  return rebuild(node, { childIds });
}

function withTransform(node: SceneNode, transform: Transform): SceneNode {
  return rebuild(node, { transform });
}

function withExtents(
  node: SceneNode,
  width: number,
  height: number,
  depth: number | undefined,
): SceneNode {
  return rebuild(node, {
    width,
    height,
    ...(depth !== undefined ? { depth } : {}),
  });
}

function rebuild(
  node: SceneNode,
  patch: {
    readonly childIds?: readonly string[];
    readonly transform?: Transform;
    readonly width?: number;
    readonly height?: number;
    readonly depth?: number;
    readonly fill?: string;
    readonly text?: string;
    readonly fontSize?: number;
  },
): SceneNode {
  return freezeNode({
    id: node.id,
    kind: node.kind,
    childIds: patch.childIds ?? node.childIds,
    transform: patch.transform ?? node.transform,
    width: patch.width ?? node.width,
    height: patch.height ?? node.height,
    depth: node.kind === "box" ? (patch.depth ?? node.depth) : undefined,
    fill: patch.fill ?? node.fill,
    text: node.kind === "text" ? (patch.text ?? node.text) : undefined,
    fontSize:
      node.kind === "text" ? (patch.fontSize ?? node.fontSize) : undefined,
  });
}

function freezeNode(parts: NodeParts): SceneNode {
  const childIds = Object.isFrozen(parts.childIds)
    ? parts.childIds
    : Object.freeze(parts.childIds.slice());
  const shared = {
    id: parts.id,
    childIds,
    transform: parts.transform,
    width: parts.width,
    height: parts.height,
    fill: parts.fill,
  };
  if (parts.kind === "rectangle" || parts.kind === "ellipse") {
    return Object.freeze({ ...shared, kind: parts.kind });
  }
  if (parts.kind === "text") {
    if (parts.text === undefined || parts.fontSize === undefined) {
      throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
    }
    return Object.freeze({
      ...shared,
      kind: "text",
      text: parts.text,
      fontSize: parts.fontSize,
    });
  }
  if (parts.depth === undefined) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  return Object.freeze({
    ...shared,
    kind: "box",
    depth: parts.depth,
  });
}

export function acceptFill(value: unknown): string {
  if (typeof value !== "string" || !FILL_PATTERN.test(value)) {
    throw new DomainError("INVALID_FILL", INVALID_FILL);
  }
  return value.toLowerCase();
}

export function acceptText(value: unknown): string {
  if (typeof value !== "string") {
    throw new DomainError("INVALID_TEXT", INVALID_TEXT);
  }
  const text = value.normalize("NFC");
  let count = 0;
  for (const char of text) {
    const code = char.codePointAt(0);
    if (code === undefined || code <= 0x1f || code === 0x7f) {
      throw new DomainError("INVALID_TEXT", INVALID_TEXT);
    }
    count += 1;
  }
  if (count > TEXT_MAX) {
    throw new DomainError("INVALID_TEXT", INVALID_TEXT);
  }
  return text;
}

export function acceptFontSize(value: unknown): number {
  const size = canonicalizeFiniteNumber(value);
  if (!(size > 0) || size > FONT_SIZE_MAX) {
    throw new DomainError("INVALID_TEXT", INVALID_TEXT);
  }
  return size;
}

function freezeTriple(value: readonly [number, number, number]): Triple {
  return Object.freeze([value[0], value[1], value[2]]);
}

function publish(
  rootIds: readonly string[],
  nodes: Record<string, SceneNode>,
): Scene {
  return Object.freeze({
    rootIds: Object.freeze(rootIds.slice()),
    nodes: Object.freeze(nodes),
  });
}

function copyNodes(scene: Scene): Record<string, SceneNode> {
  const nodes = emptyNodes();
  for (const id of Object.keys(scene.nodes)) {
    const node = scene.nodes[id];
    if (node) {
      nodes[id] = node;
    }
  }
  return nodes;
}

function emptyNodes(): Record<string, SceneNode> {
  // An id may be the text "__proto__". A normal object would treat that
  // assignment as a prototype change. This record has no prototype setter.
  return Object.create(null) as Record<string, SceneNode>;
}

function assertClosed(
  value: Record<string, unknown>,
  allowed: readonly string[],
): void {
  assertFields(value, allowed, []);
}

function assertFields(
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[],
): void {
  for (const key of Object.keys(value)) {
    if (!required.includes(key) && !optional.includes(key)) {
      throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
    }
  }
  for (const key of required) {
    if (!Object.hasOwn(value, key)) {
      throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
    }
  }
}

function isKind(value: unknown): value is SceneKind {
  return (
    value === "rectangle" ||
    value === "box" ||
    value === "ellipse" ||
    value === "text"
  );
}

function emptyIds(): readonly string[] {
  return Object.freeze([]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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
const UNKNOWN_NODE = "Scene node was not found.";

const ID_BYTES_MAX = 64;

export type SceneKind = "rectangle" | "box";

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
};

export type BoxNode = {
  readonly id: string;
  readonly kind: "box";
  readonly childIds: readonly string[];
  readonly transform: Transform;
  readonly width: number;
  readonly height: number;
  readonly depth: number;
};

export type SceneNode = RectangleNode | BoxNode;

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
  readonly position: unknown;
  readonly rotation: unknown;
  readonly scale: unknown;
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
  const node = freezeNode(
    shape.id,
    shape.kind,
    Object.freeze([]),
    transform,
    width,
    height,
    depth,
  );
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
  if (kind !== "rectangle" && kind !== "box") {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  const allowed =
    kind === "box"
      ? [
          "id",
          "kind",
          "parentId",
          "index",
          "transform",
          "width",
          "height",
          "depth",
        ]
      : ["id", "kind", "parentId", "index", "transform", "width", "height"];
  assertClosed(input, allowed);
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
  return freezeNode(
    node.id,
    node.kind,
    childIds,
    node.transform,
    node.width,
    node.height,
    node.kind === "box" ? node.depth : undefined,
  );
}

function withTransform(node: SceneNode, transform: Transform): SceneNode {
  return freezeNode(
    node.id,
    node.kind,
    node.childIds,
    transform,
    node.width,
    node.height,
    node.kind === "box" ? node.depth : undefined,
  );
}

function withExtents(
  node: SceneNode,
  width: number,
  height: number,
  depth: number | undefined,
): SceneNode {
  return freezeNode(
    node.id,
    node.kind,
    node.childIds,
    node.transform,
    width,
    height,
    depth,
  );
}

function freezeNode(
  id: string,
  kind: SceneKind,
  childIds: readonly string[],
  transform: Transform,
  width: number,
  height: number,
  depth: number | undefined,
): SceneNode {
  const frozenChildren = Object.isFrozen(childIds)
    ? childIds
    : Object.freeze(childIds.slice());
  if (kind === "rectangle") {
    return Object.freeze({
      id,
      kind,
      childIds: frozenChildren,
      transform,
      width,
      height,
    });
  }
  if (depth === undefined) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  return Object.freeze({
    id,
    kind,
    childIds: frozenChildren,
    transform,
    width,
    height,
    depth,
  });
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
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
    }
  }
  for (const key of allowed) {
    if (!Object.hasOwn(value, key)) {
      throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

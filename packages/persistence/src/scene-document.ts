import {
  canonicalizeFiniteNumber,
  canonicalizeFiniteTriple,
  createScene,
  DomainError,
  insertNode,
  type Scene,
  type SceneKind,
  type SceneNode,
  type Triple,
} from "@uvcp/core";
import { decodeUtf8Fatal, encodeUtf8 } from "./utf8.ts";

const FORMAT_ID = "universal-visual-creation-scene";
const SCHEMA_TOKEN = "1";
const BYTE_LIMIT = 1048576;
const ID_BYTES_MAX = 64;

const EMPTY = "Scene document is empty.";
const TOO_LARGE = "Scene document exceeds the size limit.";
const INVALID_ENCODING = "Scene document is not UTF-8 text.";
const INVALID_JSON = "Scene document is not valid JSON.";
const DUPLICATE_KEY = "Scene document contains a duplicate key.";
const INVALID_SHAPE = "Scene shape is not accepted.";
const UNSUPPORTED_FORMAT = "Scene document format is not supported.";
const UNSUPPORTED_SCHEMA_VERSION =
  "Scene document schema version is not supported.";
const INVALID_ID = "Scene id is not accepted.";
const DUPLICATE_ID = "Scene contains a duplicate id.";
const INVALID_HIERARCHY = "Scene hierarchy is not accepted.";
const INVALID_EXTENT = "Scene extent is not accepted.";

// Not a DomainError. A walk that disagrees with JSON.parse must not look like
// a successful read, and the message must not include the document.
const ALIGNMENT = "Scene duplicate check lost alignment.";

type JsonTokenContext = {
  readonly source?: string;
};

type RawNode = {
  readonly id: string;
  readonly kind: SceneKind;
  readonly children: readonly string[];
  readonly position: unknown;
  readonly rotation: unknown;
  readonly scale: unknown;
  readonly width: unknown;
  readonly height: unknown;
  readonly depth: unknown;
};

type CanonicalNode = {
  readonly id: string;
  readonly kind: SceneKind;
  readonly children: readonly string[];
  readonly position: Triple;
  readonly rotation: Triple;
  readonly scale: Triple;
  readonly width: number;
  readonly height: number;
  readonly depth: number | undefined;
};

const INTRINSIC_PROTOTYPES: ReadonlySet<object> = new Set([
  Object.prototype,
  Array.prototype,
  Function.prototype,
  String.prototype,
  Number.prototype,
  Boolean.prototype,
  Symbol.prototype,
  BigInt.prototype,
  Date.prototype,
  RegExp.prototype,
  Error.prototype,
  Promise.prototype,
  Map.prototype,
  Set.prototype,
  WeakMap.prototype,
  WeakSet.prototype,
]);

export function readScene(input: Uint8Array): Scene {
  const text = decodeDocument(input);
  const parsed = parseDocument(text);
  const shape = documentShape(parsed.value, parsed.schemaSource);
  const nodes = canonicalNodes(shape.nodes);
  acceptDocumentIds(shape.roots, nodes);
  const planned = plannedTree(shape.roots, nodes);
  return assemble(planned);
}

export function writeScene(scene: Scene): Uint8Array {
  const text = canonicalText(scene);
  const bytes = encodeUtf8(text);
  if (bytes.byteLength > BYTE_LIMIT) {
    throw new DomainError("TOO_LARGE", TOO_LARGE);
  }
  return bytes;
}

function decodeDocument(input: Uint8Array): string {
  if (!(input instanceof Uint8Array)) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  if (input.byteLength === 0) {
    throw new DomainError("EMPTY", EMPTY);
  }
  if (input.byteLength > BYTE_LIMIT) {
    throw new DomainError("TOO_LARGE", TOO_LARGE);
  }
  if (hasUtf8Bom(input)) {
    throw new DomainError("INVALID_ENCODING", INVALID_ENCODING);
  }
  try {
    return decodeUtf8Fatal(input);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new DomainError("INVALID_ENCODING", INVALID_ENCODING);
    }
    throw error;
  }
}

function parseDocument(text: string): {
  readonly value: unknown;
  readonly schemaSource: string | undefined;
} {
  const parsedCounts: number[] = [];
  const sources = new Map<object, string>();
  let value: unknown;
  try {
    value = JSON.parse(text, schemaReviver(parsedCounts, sources));
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof RangeError) {
      throw new DomainError("INVALID_JSON", INVALID_JSON);
    }
    throw error;
  }
  // The walk is not the manifest reviver. It runs only after parse succeeds.
  rejectDuplicateKeys(text, parsedCounts);
  return {
    value,
    schemaSource: schemaSourceOf(value, sources),
  };
}

function schemaReviver(
  parsedCounts: number[],
  sources: Map<object, string>,
): (this: object, key: string, value: unknown) => unknown {
  const reviver = function (
    this: object,
    key: string,
    value: unknown,
    context: JsonTokenContext | undefined,
  ): unknown {
    if (
      key === "schemaVersion" &&
      typeof context?.source === "string" &&
      !INTRINSIC_PROTOTYPES.has(this)
    ) {
      sources.set(this, context.source);
    }
    if (isRecord(value)) {
      parsedCounts.push(Object.keys(value).length);
    }
    return value;
  };
  return reviver as (this: object, key: string, value: unknown) => unknown;
}

function schemaSourceOf(
  value: unknown,
  sources: Map<object, string>,
): string | undefined {
  if (typeof value === "object" && value !== null) {
    return sources.get(value);
  }
  return undefined;
}

function rejectDuplicateKeys(
  text: string,
  parsedCounts: readonly number[],
): void {
  const rawCounts = rawObjectKeyCounts(text);
  if (rawCounts.length !== parsedCounts.length) {
    duplicateCheckFailed();
  }
  for (let index = 0; index < rawCounts.length; index += 1) {
    const raw = rawCounts[index];
    const parsed = parsedCounts[index];
    if (raw === undefined || parsed === undefined) {
      duplicateCheckFailed();
    }
    if (raw > parsed) {
      throw new DomainError("DUPLICATE_KEY", DUPLICATE_KEY);
    }
    if (raw < parsed) {
      duplicateCheckFailed();
    }
  }
}

function rawObjectKeyCounts(text: string): number[] {
  try {
    const counts: number[] = [];
    // The reviver records objects child-before-parent. This walk uses an
    // explicit stack so a document JSON.parse accepted cannot fail later as
    // a host stack overflow, and so each object's count is recorded in that
    // same order.
    let index = skipWhitespace(text, 0);
    const stack: WalkFrame[] = [];
    index = beginValue(text, index, stack, counts);
    index = walkContainers(text, index, stack, counts);
    index = skipWhitespace(text, index);
    if (index !== text.length || stack.length !== 0) {
      duplicateCheckFailed();
    }
    return counts;
  } catch (error) {
    if (error instanceof DomainError) {
      throw error;
    }
    if (error instanceof Error && error.message === ALIGNMENT) {
      throw error;
    }
    if (error instanceof RangeError) {
      throw new DomainError("INVALID_JSON", INVALID_JSON);
    }
    duplicateCheckFailed();
  }
}

type WalkFrame = {
  readonly kind: "object" | "array";
  count: number;
  phase: "key" | "value" | "after";
};

function beginValue(
  text: string,
  index: number,
  stack: WalkFrame[],
  counts: number[],
): number {
  index = skipWhitespace(text, index);
  const char = text.charAt(index);
  if (char === "{") {
    index += 1;
    index = skipWhitespace(text, index);
    if (text.charAt(index) === "}") {
      counts.push(0);
      return index + 1;
    }
    stack.push({ kind: "object", count: 0, phase: "key" });
    return index;
  }
  if (char === "[") {
    index += 1;
    index = skipWhitespace(text, index);
    if (text.charAt(index) === "]") {
      return index + 1;
    }
    stack.push({ kind: "array", count: 0, phase: "value" });
    return index;
  }
  if (char === '"') {
    return skipJsonString(text, index);
  }
  return skipLiteral(text, index);
}

function walkContainers(
  text: string,
  index: number,
  stack: WalkFrame[],
  counts: number[],
): number {
  while (stack.length > 0) {
    const frame = stack[stack.length - 1];
    if (!frame) {
      duplicateCheckFailed();
    }
    if (frame.kind === "object" && frame.phase === "key") {
      index = skipWhitespace(text, index);
      if (text.charAt(index) !== '"') {
        duplicateCheckFailed();
      }
      index = skipJsonString(text, index);
      frame.count += 1;
      index = skipWhitespace(text, index);
      if (text.charAt(index) !== ":") {
        duplicateCheckFailed();
      }
      index += 1;
      frame.phase = "after";
      index = beginValue(text, index, stack, counts);
      continue;
    }
    if (frame.kind === "array" && frame.phase === "value") {
      frame.phase = "after";
      index = beginValue(text, index, stack, counts);
      continue;
    }
    index = skipWhitespace(text, index);
    const next = text.charAt(index);
    if (next === ",") {
      index += 1;
      frame.phase = frame.kind === "object" ? "key" : "value";
      continue;
    }
    const end = frame.kind === "object" ? "}" : "]";
    if (next !== end) {
      duplicateCheckFailed();
    }
    if (frame.kind === "object") {
      counts.push(frame.count);
    }
    index += 1;
    stack.pop();
  }
  return index;
}

function skipJsonString(text: string, index: number): number {
  index += 1;
  while (index < text.length) {
    const char = text.charAt(index);
    if (char === "\\") {
      index += 2;
      continue;
    }
    if (char === '"') {
      return index + 1;
    }
    index += 1;
  }
  duplicateCheckFailed();
}

function skipLiteral(text: string, index: number): number {
  const start = index;
  while (index < text.length) {
    const char = text.charAt(index);
    if (
      char === "," ||
      char === "}" ||
      char === "]" ||
      char === " " ||
      char === "\n" ||
      char === "\r" ||
      char === "\t"
    ) {
      break;
    }
    index += 1;
  }
  if (index === start) {
    duplicateCheckFailed();
  }
  return index;
}

function skipWhitespace(text: string, index: number): number {
  while (
    text.charAt(index) === " " ||
    text.charAt(index) === "\t" ||
    text.charAt(index) === "\n" ||
    text.charAt(index) === "\r"
  ) {
    index += 1;
  }
  return index;
}

function duplicateCheckFailed(): never {
  throw new Error(ALIGNMENT);
}

function documentShape(
  value: unknown,
  schemaSource: string | undefined,
): { readonly roots: readonly string[]; readonly nodes: readonly RawNode[] } {
  if (!isRecord(value)) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  for (const key of Object.keys(value)) {
    if (
      key !== "formatId" &&
      key !== "schemaVersion" &&
      key !== "roots" &&
      key !== "nodes"
    ) {
      throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
    }
  }
  if (!Object.hasOwn(value, "formatId") || typeof value.formatId !== "string") {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  if (value.formatId !== FORMAT_ID) {
    throw new DomainError("UNSUPPORTED_FORMAT", UNSUPPORTED_FORMAT);
  }
  if (!Object.hasOwn(value, "schemaVersion")) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  if (schemaSource !== SCHEMA_TOKEN) {
    throw new DomainError(
      "UNSUPPORTED_SCHEMA_VERSION",
      UNSUPPORTED_SCHEMA_VERSION,
    );
  }
  if (!Object.hasOwn(value, "roots") || !Array.isArray(value.roots)) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  if (!Object.hasOwn(value, "nodes") || !Array.isArray(value.nodes)) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  const roots: string[] = [];
  for (const root of value.roots) {
    if (typeof root !== "string") {
      throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
    }
    roots.push(root);
  }
  const nodes: RawNode[] = [];
  for (const node of value.nodes) {
    nodes.push(rawNode(node));
  }
  return { roots, nodes };
}

function rawNode(value: unknown): RawNode {
  if (!isRecord(value)) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  const kind = value.kind;
  if (kind !== "rectangle" && kind !== "box") {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  assertClosed(
    value,
    kind === "box"
      ? ["id", "kind", "children", "transform", "width", "height", "depth"]
      : ["id", "kind", "children", "transform", "width", "height"],
  );
  if (typeof value.id !== "string" || !Array.isArray(value.children)) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  if (!isRecord(value.transform)) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  assertClosed(value.transform, ["position", "rotation", "scale"]);
  const children: string[] = [];
  for (const child of value.children) {
    if (typeof child !== "string") {
      throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
    }
    children.push(child);
  }
  return {
    id: value.id,
    kind,
    children,
    position: value.transform.position,
    rotation: value.transform.rotation,
    scale: value.transform.scale,
    width: value.width,
    height: value.height,
    depth: kind === "box" ? value.depth : undefined,
  };
}

function canonicalNodes(nodes: readonly RawNode[]): CanonicalNode[] {
  const canonical: CanonicalNode[] = [];
  for (const node of nodes) {
    canonical.push({
      id: node.id,
      kind: node.kind,
      children: node.children,
      position: canonicalizeFiniteTriple(node.position),
      rotation: canonicalizeFiniteTriple(node.rotation),
      scale: canonicalizeFiniteTriple(node.scale),
      width: canonicalizeFiniteNumber(node.width),
      height: canonicalizeFiniteNumber(node.height),
      depth:
        node.kind === "box" ? canonicalizeFiniteNumber(node.depth) : undefined,
    });
  }
  for (const node of canonical) {
    assertPositive(node.width);
    assertPositive(node.height);
    if (node.depth !== undefined) {
      assertPositive(node.depth);
    }
  }
  return canonical;
}

function acceptDocumentIds(
  roots: readonly string[],
  nodes: readonly CanonicalNode[],
): void {
  for (const node of nodes) {
    acceptId(node.id);
  }
  for (const root of roots) {
    acceptId(root);
  }
  for (const node of nodes) {
    for (const child of node.children) {
      acceptId(child);
    }
  }
}

function plannedTree(
  roots: readonly string[],
  nodes: readonly CanonicalNode[],
): CanonicalNode[] {
  const byId = new Map<string, CanonicalNode>();
  for (const node of nodes) {
    if (byId.has(node.id)) {
      throw new DomainError("DUPLICATE_ID", DUPLICATE_ID);
    }
    byId.set(node.id, node);
  }
  const planned: CanonicalNode[] = [];
  const placed = new Set<string>();
  const stack: { id: string; childIndex: number; entered: boolean }[] = [];
  for (let index = roots.length - 1; index >= 0; index -= 1) {
    const id = roots[index];
    if (id === undefined) {
      throw new DomainError("INVALID_HIERARCHY", INVALID_HIERARCHY);
    }
    stack.push({ id, childIndex: 0, entered: false });
  }
  while (stack.length > 0) {
    const frame = stack[stack.length - 1];
    if (!frame) {
      break;
    }
    if (!frame.entered) {
      if (placed.has(frame.id) || !byId.has(frame.id)) {
        throw new DomainError("INVALID_HIERARCHY", INVALID_HIERARCHY);
      }
      placed.add(frame.id);
      frame.entered = true;
      const node = byId.get(frame.id);
      if (!node) {
        throw new DomainError("INVALID_HIERARCHY", INVALID_HIERARCHY);
      }
      planned.push(node);
    }
    const node = byId.get(frame.id);
    if (!node) {
      throw new DomainError("INVALID_HIERARCHY", INVALID_HIERARCHY);
    }
    if (frame.childIndex < node.children.length) {
      const child = node.children[frame.childIndex];
      frame.childIndex += 1;
      if (child === undefined) {
        throw new DomainError("INVALID_HIERARCHY", INVALID_HIERARCHY);
      }
      stack.push({ id: child, childIndex: 0, entered: false });
      continue;
    }
    stack.pop();
  }
  if (placed.size !== byId.size) {
    throw new DomainError("INVALID_HIERARCHY", INVALID_HIERARCHY);
  }
  return planned;
}

function assemble(nodes: readonly CanonicalNode[]): Scene {
  const childCounts = new Map<string, number>();
  let scene = createScene();
  let rootCount = 0;
  for (const node of nodes) {
    const parentId = parentOf(node.id, nodes);
    const index =
      parentId === null ? rootCount : (childCounts.get(parentId) ?? 0);
    if (parentId === null) {
      rootCount += 1;
    } else {
      childCounts.set(parentId, index + 1);
    }
    scene = insertNode(scene, insertInput(node, parentId, index));
  }
  return scene;
}

function parentOf(id: string, nodes: readonly CanonicalNode[]): string | null {
  for (const node of nodes) {
    if (node.children.includes(id)) {
      return node.id;
    }
  }
  return null;
}

function insertInput(
  node: CanonicalNode,
  parentId: string | null,
  index: number,
): Record<string, unknown> {
  const input: Record<string, unknown> = {
    id: node.id,
    kind: node.kind,
    parentId,
    index,
    transform: {
      position: node.position,
      rotation: node.rotation,
      scale: node.scale,
    },
    width: node.width,
    height: node.height,
  };
  if (node.kind === "box" && node.depth !== undefined) {
    input.depth = node.depth;
  }
  return input;
}

function canonicalText(scene: Scene): string {
  if (!isRecord(scene)) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  assertClosed(scene, ["rootIds", "nodes"]);
  if (!Array.isArray(scene.rootIds) || !isRecord(scene.nodes)) {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  const ordered = orderedNodes(scene as Scene);
  const roots: string[] = [];
  for (const id of scene.rootIds) {
    if (typeof id !== "string") {
      throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
    }
    roots.push(jsonString(id));
  }
  const nodes: string[] = [];
  for (const node of ordered) {
    nodes.push(jsonNode(node));
  }
  return `{"formatId":${jsonString(FORMAT_ID)},"schemaVersion":1,"roots":[${roots.join(",")}],"nodes":[${nodes.join(",")}]}`;
}

function orderedNodes(scene: Scene): SceneNode[] {
  const ordered: SceneNode[] = [];
  const placed = new Set<string>();
  const stack: { id: string; childIndex: number; entered: boolean }[] = [];
  for (let index = scene.rootIds.length - 1; index >= 0; index -= 1) {
    const id = scene.rootIds[index];
    if (id === undefined) {
      throw new DomainError("INVALID_HIERARCHY", INVALID_HIERARCHY);
    }
    stack.push({ id, childIndex: 0, entered: false });
  }
  while (stack.length > 0) {
    const frame = stack[stack.length - 1];
    if (!frame) {
      break;
    }
    const node = scene.nodes[frame.id];
    if (!frame.entered) {
      if (placed.has(frame.id) || !node) {
        throw new DomainError("INVALID_HIERARCHY", INVALID_HIERARCHY);
      }
      placed.add(frame.id);
      frame.entered = true;
      ordered.push(node);
    }
    if (!node) {
      throw new DomainError("INVALID_HIERARCHY", INVALID_HIERARCHY);
    }
    if (frame.childIndex < node.childIds.length) {
      const child = node.childIds[frame.childIndex];
      frame.childIndex += 1;
      if (child === undefined) {
        throw new DomainError("INVALID_HIERARCHY", INVALID_HIERARCHY);
      }
      stack.push({ id: child, childIndex: 0, entered: false });
      continue;
    }
    stack.pop();
  }
  if (placed.size !== Object.keys(scene.nodes).length) {
    throw new DomainError("INVALID_HIERARCHY", INVALID_HIERARCHY);
  }
  return ordered;
}

function jsonNode(node: SceneNode): string {
  const keys = Object.keys(node);
  const allowed =
    node.kind === "box"
      ? ["id", "kind", "childIds", "transform", "width", "height", "depth"]
      : ["id", "kind", "childIds", "transform", "width", "height"];
  if (node.kind !== "rectangle" && node.kind !== "box") {
    throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
  }
  for (const key of keys) {
    if (!allowed.includes(key)) {
      throw new DomainError("INVALID_SHAPE", INVALID_SHAPE);
    }
  }
  const children: string[] = [];
  for (const child of node.childIds) {
    children.push(jsonString(child));
  }
  const transform = `{"position":[${jsonTriple(node.transform.position)}],"rotation":[${jsonTriple(node.transform.rotation)}],"scale":[${jsonTriple(node.transform.scale)}]}`;
  const base = `{"id":${jsonString(node.id)},"kind":${jsonString(node.kind)},"children":[${children.join(",")}],"transform":${transform},"width":${jsonNumber(node.width)},"height":${jsonNumber(node.height)}`;
  if (node.kind === "box") {
    return `${base},"depth":${jsonNumber(node.depth)}}`;
  }
  return `${base}}`;
}

function jsonTriple(value: Triple): string {
  return `${jsonNumber(value[0])},${jsonNumber(value[1])},${jsonNumber(value[2])}`;
}

function jsonString(value: string): string {
  return JSON.stringify(value);
}

function jsonNumber(value: number): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new DomainError("NON_FINITE_NUMBER", "Expected a finite number.");
  }
  return JSON.stringify(value === 0 ? 0 : value);
}

function acceptId(id: string): void {
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

function assertPositive(value: number): void {
  if (!(value > 0)) {
    throw new DomainError("INVALID_EXTENT", INVALID_EXTENT);
  }
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

function hasUtf8Bom(input: Uint8Array): boolean {
  return (
    input.byteLength >= 3 &&
    input[0] === 0xef &&
    input[1] === 0xbb &&
    input[2] === 0xbf
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

import type { EntitlementPort } from "./entitlement.ts";
import { assistantMessages, LIMITS } from "./messages.ts";

export type Triple = readonly [number, number, number];

type FactBase = {
  readonly id: string;
  readonly position: Triple;
  readonly rotation: Triple;
  readonly scale: Triple;
  readonly width: number;
  readonly height: number;
};

export type SceneFact =
  | (FactBase & {
      readonly kind: "rectangle";
      readonly depth: null;
    })
  | (FactBase & {
      readonly kind: "box";
      readonly depth: number;
    });

export type SceneAction =
  | {
      readonly type: "createRectangle";
      readonly id: string;
      readonly width: number;
      readonly height: number;
      readonly position: Triple;
      readonly rotation: Triple;
    }
  | {
      readonly type: "createBox";
      readonly id: string;
      readonly width: number;
      readonly height: number;
      readonly depth: number;
      readonly position: Triple;
      readonly rotation: Triple;
    }
  | {
      readonly type: "move";
      readonly id: string;
      readonly position: Triple;
    }
  | {
      readonly type: "rotate";
      readonly id: string;
      readonly rotation: Triple;
    }
  | {
      readonly type: "resize";
      readonly id: string;
      readonly width: number;
      readonly height: number;
      readonly depth?: number;
    };

export type ActionPlan =
  | { readonly ok: true; readonly actions: readonly SceneAction[] }
  | { readonly ok: false; readonly message: string };

export type ProposedCall = {
  readonly name: string;
  readonly input: unknown;
};

export const basicToolNames = [
  "createRectangle",
  "createBox",
  "move",
  "resize",
  "rotate",
] as const;

const AI_ID = /^[A-Za-z0-9][A-Za-z0-9-]{0,31}$/;
const ZERO: Triple = [0, 0, 0];

const CREATE_RECTANGLE_KEYS = [
  "id",
  "width",
  "height",
  "position",
  "rotation",
] as const;
const CREATE_BOX_KEYS = [
  "id",
  "width",
  "height",
  "depth",
  "position",
  "rotation",
] as const;
const MOVE_KEYS = ["id", "position"] as const;
const ROTATE_KEYS = ["id", "rotation"] as const;
const RESIZE_KEYS = ["id", "width", "height", "depth"] as const;

export function actionsFromCalls(
  calls: readonly ProposedCall[],
  entitlement: EntitlementPort,
): ActionPlan {
  if (calls.length === 0) {
    return fail(assistantMessages.noChange);
  }
  if (calls.length > LIMITS.actions) {
    return fail(assistantMessages.tooMany);
  }
  if (calls.some((call) => call.name === "arrange")) {
    if (entitlement.allows("ai.scene.arrange") === "denied") {
      return fail(assistantMessages.paidArrange);
    }
    return fail(assistantMessages.arrangeUnavailable);
  }
  if (entitlement.allows("ai.scene.basic") === "denied") {
    return fail(assistantMessages.basicDenied);
  }
  const raw: unknown[] = [];
  for (const call of calls) {
    if (!isBasicTool(call.name)) {
      return fail(assistantMessages.unavailable);
    }
    if (!isRecord(call.input)) {
      return fail(assistantMessages.badValue);
    }
    raw.push({ ...call.input, type: call.name });
  }
  return parseActions(raw);
}

export function parseActions(value: unknown): ActionPlan {
  if (!Array.isArray(value)) {
    return fail(assistantMessages.badValue);
  }
  if (value.length === 0) {
    return fail(assistantMessages.noChange);
  }
  if (value.length > LIMITS.actions) {
    return fail(assistantMessages.tooMany);
  }
  const actions: SceneAction[] = [];
  for (const item of value) {
    const action = readAction(item);
    if (typeof action === "string") {
      return fail(action);
    }
    actions.push(action);
  }
  return { ok: true, actions };
}

export function readFacts(value: unknown): readonly SceneFact[] | null {
  if (!Array.isArray(value) || value.length > LIMITS.facts) {
    return null;
  }
  const facts: SceneFact[] = [];
  for (const item of value) {
    const fact = readFact(item);
    if (fact === null) {
      return null;
    }
    facts.push(fact);
  }
  return facts;
}

function readAction(value: unknown): SceneAction | string {
  if (!isRecord(value) || typeof value.type !== "string") {
    return assistantMessages.badValue;
  }
  switch (value.type) {
    case "createRectangle":
      return readCreate(value, "rectangle");
    case "createBox":
      return readCreate(value, "box");
    case "move":
      return readMove(value);
    case "rotate":
      return readRotate(value);
    case "resize":
      return readResize(value);
    case "arrange":
      return assistantMessages.paidArrange;
    default:
      return assistantMessages.unavailable;
  }
}

function readCreate(
  value: Record<string, unknown>,
  kind: "rectangle" | "box",
): SceneAction | string {
  const keys = kind === "box" ? CREATE_BOX_KEYS : CREATE_RECTANGLE_KEYS;
  if (!closed(value, ["type", ...keys])) {
    return assistantMessages.badValue;
  }
  const id = readAiId(value.id);
  const width = readFinite(value.width);
  const height = readFinite(value.height);
  const position = readTriple(value.position, ZERO);
  const rotation = readTriple(value.rotation, ZERO);
  if (id === null) {
    return assistantMessages.badId;
  }
  if (width === null || height === null) {
    return missingOrBad(value.width, value.height);
  }
  if (position === null || rotation === null) {
    return assistantMessages.badValue;
  }
  if (kind === "rectangle") {
    return {
      type: "createRectangle",
      id,
      width,
      height,
      position,
      rotation,
    };
  }
  const depth = readFinite(value.depth);
  if (depth === null) {
    return missingOrBad(value.depth);
  }
  return {
    type: "createBox",
    id,
    width,
    height,
    depth,
    position,
    rotation,
  };
}

function readMove(value: Record<string, unknown>): SceneAction | string {
  if (!closed(value, ["type", ...MOVE_KEYS])) {
    return assistantMessages.badValue;
  }
  const id = readAiId(value.id);
  const position = readTriple(value.position, null);
  if (id === null) {
    return assistantMessages.badId;
  }
  if (position === null) {
    return assistantMessages.badValue;
  }
  return { type: "move", id, position };
}

function readRotate(value: Record<string, unknown>): SceneAction | string {
  if (!closed(value, ["type", ...ROTATE_KEYS])) {
    return assistantMessages.badValue;
  }
  const id = readAiId(value.id);
  const rotation = readTriple(value.rotation, null);
  if (id === null) {
    return assistantMessages.badId;
  }
  if (rotation === null) {
    return assistantMessages.badValue;
  }
  return { type: "rotate", id, rotation };
}

function readResize(value: Record<string, unknown>): SceneAction | string {
  if (!closed(value, ["type", ...RESIZE_KEYS])) {
    return assistantMessages.badValue;
  }
  const id = readAiId(value.id);
  const width = readFinite(value.width);
  const height = readFinite(value.height);
  if (id === null) {
    return assistantMessages.badId;
  }
  if (width === null || height === null) {
    return missingOrBad(value.width, value.height);
  }
  if (!Object.hasOwn(value, "depth")) {
    return { type: "resize", id, width, height };
  }
  const depth = readFinite(value.depth);
  if (depth === null) {
    return assistantMessages.badValue;
  }
  return { type: "resize", id, width, height, depth };
}

function readFact(value: unknown): SceneFact | null {
  if (!isRecord(value)) {
    return null;
  }
  if (value.kind !== "rectangle" && value.kind !== "box") {
    return null;
  }
  const id = readFactId(value.id);
  const position = readTriple(value.position, null);
  const rotation = readTriple(value.rotation, null);
  const scale = readTriple(value.scale, null);
  const width = readFinite(value.width);
  const height = readFinite(value.height);
  if (
    id === null ||
    position === null ||
    rotation === null ||
    scale === null ||
    width === null ||
    height === null
  ) {
    return null;
  }
  if (value.kind === "rectangle") {
    if (value.depth !== null) {
      return null;
    }
    return {
      id,
      kind: "rectangle",
      position,
      rotation,
      scale,
      width,
      height,
      depth: null,
    };
  }
  const depth = readFinite(value.depth);
  if (depth === null) {
    return null;
  }
  return {
    id,
    kind: "box",
    position,
    rotation,
    scale,
    width,
    height,
    depth,
  };
}

function missingOrBad(...values: unknown[]): string {
  if (values.some((value) => value === undefined)) {
    return assistantMessages.missingSize;
  }
  return assistantMessages.badValue;
}

function readAiId(value: unknown): string | null {
  if (typeof value !== "string" || !AI_ID.test(value)) {
    return null;
  }
  return value;
}

function readFactId(value: unknown): string | null {
  if (typeof value !== "string" || value.length < 1 || value.length > 64) {
    return null;
  }
  for (const char of value) {
    const code = char.codePointAt(0);
    if (code === undefined || code <= 0x1f || code === 0x7f) {
      return null;
    }
  }
  return value;
}

function readFinite(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return value;
}

function readTriple(value: unknown, fallback: Triple | null): Triple | null {
  if (value === undefined) {
    return fallback;
  }
  if (!Array.isArray(value) || value.length !== 3) {
    return null;
  }
  const x = readFinite(value[0]);
  const y = readFinite(value[1]);
  const z = readFinite(value[2]);
  if (x === null || y === null || z === null) {
    return null;
  }
  return [x, y, z];
}

function closed(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function isBasicTool(name: string): name is (typeof basicToolNames)[number] {
  return (basicToolNames as readonly string[]).includes(name);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function fail(message: string): ActionPlan {
  return { ok: false, message };
}

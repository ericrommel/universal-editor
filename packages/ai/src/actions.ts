import type { EntitlementPort } from "./entitlement.ts";
import { assistantMessages, LIMITS } from "./messages.ts";

export type SceneFact = {
  readonly id: string;
  readonly kind: "rectangle" | "box";
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly depth: number | null;
  readonly rotation: number;
};

export type SceneAction =
  | {
      readonly type: "createRectangle";
      readonly id: string;
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
      readonly rotation: number;
    }
  | {
      readonly type: "createBox";
      readonly id: string;
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
      readonly depth: number;
      readonly rotation: number;
    }
  | {
      readonly type: "move";
      readonly id: string;
      readonly x: number;
      readonly y: number;
    }
  | {
      readonly type: "resize";
      readonly id: string;
      readonly width: number;
      readonly height: number;
      readonly depth?: number;
    }
  | {
      readonly type: "rotate";
      readonly id: string;
      readonly degrees: number;
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
  if (!Array.isArray(value) || value.length === 0) {
    return fail(
      Array.isArray(value) && value.length === 0
        ? assistantMessages.noChange
        : assistantMessages.badValue,
    );
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
    case "resize":
      return readResize(value);
    case "rotate":
      return readRotate(value);
    default:
      return assistantMessages.unavailable;
  }
}

function readCreate(
  value: Record<string, unknown>,
  kind: "rectangle" | "box",
): SceneAction | string {
  const keys =
    kind === "box"
      ? ["id", "x", "y", "width", "height", "depth", "rotation"]
      : ["id", "x", "y", "width", "height", "rotation"];
  if (!closed(value, ["type", ...keys])) {
    return assistantMessages.badValue;
  }
  const id = readAiId(value.id);
  const width = readFinite(value.width);
  const height = readFinite(value.height);
  const x = readFinite(value.x ?? 0);
  const y = readFinite(value.y ?? 0);
  const rotation = readFinite(value.rotation ?? 0);
  if (id === null) {
    return assistantMessages.badId;
  }
  if (width === null || height === null) {
    return missingOrBad(value.width, value.height);
  }
  if (x === null || y === null || rotation === null) {
    return assistantMessages.badValue;
  }
  if (kind === "rectangle") {
    return { type: "createRectangle", id, x, y, width, height, rotation };
  }
  const depth = readFinite(value.depth);
  if (depth === null) {
    return missingOrBad(value.depth);
  }
  return { type: "createBox", id, x, y, width, height, depth, rotation };
}

function readMove(value: Record<string, unknown>): SceneAction | string {
  if (!closed(value, ["type", "id", "x", "y"])) {
    return assistantMessages.badValue;
  }
  const id = readAiId(value.id);
  const x = readFinite(value.x);
  const y = readFinite(value.y);
  if (id === null) {
    return assistantMessages.badId;
  }
  if (x === null || y === null) {
    return assistantMessages.badValue;
  }
  return { type: "move", id, x, y };
}

function readResize(value: Record<string, unknown>): SceneAction | string {
  if (!closed(value, ["type", "id", "width", "height", "depth"])) {
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

function readRotate(value: Record<string, unknown>): SceneAction | string {
  if (!closed(value, ["type", "id", "degrees"])) {
    return assistantMessages.badValue;
  }
  const id = readAiId(value.id);
  const degrees = readFinite(value.degrees);
  if (id === null) {
    return assistantMessages.badId;
  }
  if (degrees === null) {
    return assistantMessages.badValue;
  }
  return { type: "rotate", id, degrees };
}

function readFact(value: unknown): SceneFact | null {
  if (!isRecord(value)) {
    return null;
  }
  if (value.kind !== "rectangle" && value.kind !== "box") {
    return null;
  }
  const id = readFactId(value.id);
  const x = readFinite(value.x);
  const y = readFinite(value.y);
  const width = readFinite(value.width);
  const height = readFinite(value.height);
  const rotation = readFinite(value.rotation);
  if (
    id === null ||
    x === null ||
    y === null ||
    width === null ||
    height === null ||
    rotation === null
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
      x,
      y,
      width,
      height,
      depth: null,
      rotation,
    };
  }
  const depth = readFinite(value.depth);
  if (depth === null) {
    return null;
  }
  return { id, kind: "box", x, y, width, height, depth, rotation };
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

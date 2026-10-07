import { URL } from "node:url";
import {
  type ActionPlan,
  readFacts,
  type SceneAction,
  type SceneFact,
} from "./actions.ts";
import { detectLocalModels, type LocalModels } from "./local-models.ts";
import { assistantMessages, LIMITS } from "./messages.ts";
import {
  emptyProviderSession,
  type ProviderSession,
  providerView,
  settingsFromChoice,
} from "./provider-settings.ts";

export type AssistantBody = {
  readonly ok: boolean;
  readonly message?: string;
  readonly actions?: readonly SceneAction[];
  readonly configured?: boolean;
  readonly source?: "session" | "environment" | "none";
  readonly mode?: "hosted" | "local" | null;
  readonly provider?: "xai" | "ollama" | "compatible" | null;
  readonly model?: string | null;
  readonly models?: readonly string[];
};

export type AssistantResponse = {
  readonly status: number;
  readonly body: AssistantBody;
};

export type AssistantRun = (input: {
  readonly instruction: string;
  readonly facts: readonly SceneFact[];
}) => Promise<ActionPlan>;

export type AiRouteInput = {
  readonly method: string;
  readonly url: string;
  readonly origin: string | undefined;
  readonly host: string | undefined;
  readonly contentType: string | undefined;
  readonly body: string;
  readonly session?: ProviderSession;
  readonly env?: Readonly<Record<string, string | undefined>>;
  readonly run: AssistantRun;
  readonly detect?: () => Promise<LocalModels>;
};

export async function handleAiRoutes(
  input: AiRouteInput,
): Promise<AssistantResponse | null> {
  const path = pathOf(input.url);
  if (path !== "/api/ai" && !path.startsWith("/api/ai/")) {
    return null;
  }
  if (!originAllowed(input.origin, input.host)) {
    return json(403, { ok: false, message: assistantMessages.wrongOrigin });
  }
  if (input.body.length > LIMITS.bodyBytes) {
    return json(413, { ok: false, message: assistantMessages.tooLarge });
  }
  const session = input.session ?? emptyProviderSession();
  const env = input.env ?? {};
  if (path === "/api/ai/status") {
    if (input.method !== "GET") {
      return json(405, { ok: false, message: assistantMessages.badRequest });
    }
    return json(200, { ok: true, ...providerView(session.current, env) });
  }
  if (path === "/api/ai/setup") {
    return saveSetup(input, session, env);
  }
  if (path === "/api/ai/local") {
    return listLocal(input);
  }
  if (path !== "/api/ai") {
    return json(404, { ok: false, message: assistantMessages.badRequest });
  }
  return handleAssistantRequest(input);
}

export async function handleAssistantRequest(input: {
  readonly method: string;
  readonly url: string;
  readonly origin: string | undefined;
  readonly host: string | undefined;
  readonly contentType: string | undefined;
  readonly body: string;
  readonly run: AssistantRun;
}): Promise<AssistantResponse | null> {
  const path = input.url.split("?", 1)[0] ?? "";
  if (path !== "/api/ai") {
    return null;
  }
  if (input.method !== "POST") {
    return json(405, { ok: false, message: assistantMessages.badRequest });
  }
  if (!originAllowed(input.origin, input.host)) {
    return json(403, { ok: false, message: assistantMessages.wrongOrigin });
  }
  if (!jsonContent(input.contentType)) {
    return json(400, { ok: false, message: assistantMessages.badRequest });
  }
  if (input.body.length > LIMITS.bodyBytes) {
    return json(413, { ok: false, message: assistantMessages.tooLarge });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(input.body);
  } catch {
    return json(400, { ok: false, message: assistantMessages.badRequest });
  }
  if (!isRecord(parsed) || typeof parsed.instruction !== "string") {
    return json(400, { ok: false, message: assistantMessages.badRequest });
  }
  const instruction = parsed.instruction.trim();
  if (instruction.length === 0) {
    return json(200, {
      ok: false,
      message: assistantMessages.emptyInstruction,
    });
  }
  if (instruction.length > LIMITS.instruction) {
    return json(200, {
      ok: false,
      message: assistantMessages.instructionTooLong,
    });
  }
  const facts = readFacts(parsed.facts);
  if (facts === null) {
    return json(400, { ok: false, message: assistantMessages.badRequest });
  }
  const plan = await input.run({ instruction, facts });
  if (!plan.ok) {
    return json(200, { ok: false, message: plan.message });
  }
  return json(200, { ok: true, actions: plan.actions });
}

async function saveSetup(
  input: AiRouteInput,
  session: ProviderSession,
  env: Readonly<Record<string, string | undefined>>,
): Promise<AssistantResponse> {
  if (input.method !== "POST") {
    return json(405, { ok: false, message: assistantMessages.badRequest });
  }
  if (!jsonContent(input.contentType)) {
    return json(400, { ok: false, message: assistantMessages.badRequest });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(input.body);
  } catch {
    return json(400, { ok: false, message: assistantMessages.badRequest });
  }
  const choice = settingsFromChoice(parsed);
  if (!choice.ok) {
    return json(200, { ok: false, message: choice.message });
  }
  session.current = choice.settings;
  return json(200, { ok: true, ...providerView(session.current, env) });
}

async function listLocal(input: AiRouteInput): Promise<AssistantResponse> {
  if (input.method !== "POST") {
    return json(405, { ok: false, message: assistantMessages.badRequest });
  }
  if (!jsonContent(input.contentType)) {
    return json(400, { ok: false, message: assistantMessages.badRequest });
  }
  const found = await (input.detect ?? detectLocalModels)();
  if (!found.ok) {
    return json(200, { ok: false, message: found.message });
  }
  return json(200, { ok: true, models: found.models });
}

function pathOf(url: string): string {
  return url.split("?", 1)[0] ?? "";
}

function originAllowed(
  origin: string | undefined,
  host: string | undefined,
): boolean {
  if (origin === undefined || origin === "") {
    return true;
  }
  if (host === undefined || host === "") {
    return false;
  }
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function jsonContent(value: string | undefined): boolean {
  if (value === undefined) {
    return false;
  }
  const media = value.split(";", 1)[0]?.trim().toLowerCase();
  return media === "application/json";
}

function json(status: number, body: AssistantBody): AssistantResponse {
  return { status, body };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

import { URL } from "node:url";
import { assistantMessages, LIMITS } from "./messages.ts";

export type ProviderSettings =
  | {
      readonly kind: "xai";
      readonly model: string;
      readonly apiKey: string;
      readonly baseURL: "https://api.x.ai/v1";
    }
  | {
      readonly kind: "ollama" | "compatible";
      readonly model: string;
      readonly apiKey: string;
      readonly baseURL: string;
    };

export type ProviderSetup =
  | { readonly ok: true; readonly settings: ProviderSettings }
  | { readonly ok: false; readonly message: string };

const MODEL_NAME = /^[A-Za-z0-9_.:-]{1,128}$/;
const XAI_BASE_URL = "https://api.x.ai/v1" as const;
const DEFAULT_XAI_MODEL = "grok-4.7";
const DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434/v1";

export function providerSettings(
  env: Readonly<Record<string, string | undefined>>,
): ProviderSetup {
  const selected = env.UVCP_AI_PROVIDER ?? "xai";
  if (selected === "xai") {
    return xaiSettings(env);
  }
  if (selected === "ollama") {
    return localSettings(env, DEFAULT_OLLAMA_URL);
  }
  if (selected === "compatible") {
    return localSettings(env, null);
  }
  return fail(assistantMessages.badProvider);
}

export type ProviderSession = {
  current: ProviderSettings | null;
};

export type ProviderView = {
  readonly configured: boolean;
  readonly source: "session" | "environment" | "none";
  readonly mode: "hosted" | "local" | null;
  readonly provider: "xai" | "ollama" | "compatible" | null;
  readonly model: string | null;
};

export function emptyProviderSession(): ProviderSession {
  return { current: null };
}

export function resolveProvider(
  session: ProviderSettings | null,
  env: Readonly<Record<string, string | undefined>>,
): ProviderSetup {
  if (session !== null) {
    return { ok: true, settings: session };
  }
  if (!developerEnv(env)) {
    return fail(assistantMessages.needsSetup);
  }
  return providerSettings(env);
}

export function providerView(
  session: ProviderSettings | null,
  env: Readonly<Record<string, string | undefined>>,
): ProviderView {
  const resolved = resolveProvider(session, env);
  if (!resolved.ok) {
    return {
      configured: false,
      source: "none",
      mode: null,
      provider: null,
      model: null,
    };
  }
  return {
    configured: true,
    source: session === null ? "environment" : "session",
    mode: resolved.settings.kind === "ollama" ? "local" : "hosted",
    provider: resolved.settings.kind,
    model: resolved.settings.model,
  };
}

export function settingsFromChoice(value: unknown): ProviderSetup {
  if (!isRecord(value) || typeof value.provider !== "string") {
    return fail(assistantMessages.badProvider);
  }
  if (value.provider === "xai") {
    return xaiChoice(value);
  }
  if (value.provider === "compatible") {
    return hostedChoice(value);
  }
  if (value.provider === "ollama") {
    return ollamaChoice(value);
  }
  return fail(assistantMessages.badProvider);
}

export function acceptedModelName(value: string): boolean {
  return MODEL_NAME.test(value);
}

export function hostedUrlAllowed(value: string): boolean {
  if (!baseUrlAllowed(value)) {
    return false;
  }
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function baseUrlAllowed(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.username !== "" || url.password !== "") {
    return false;
  }
  if (url.protocol === "https:") {
    return true;
  }
  if (url.protocol !== "http:") {
    return false;
  }
  return (
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "::1" ||
    url.hostname === "[::1]"
  );
}

function xaiSettings(
  env: Readonly<Record<string, string | undefined>>,
): ProviderSetup {
  const apiKey = readKey(env.XAI_API_KEY);
  if (apiKey === null) {
    return fail(
      env.XAI_API_KEY === undefined
        ? assistantMessages.needsSetup
        : assistantMessages.badKey,
    );
  }
  const model = readModel(env.UVCP_AI_MODEL, DEFAULT_XAI_MODEL);
  if (model === null) {
    return fail(assistantMessages.badModel);
  }
  return {
    ok: true,
    settings: { kind: "xai", model, apiKey, baseURL: XAI_BASE_URL },
  };
}

function localSettings(
  env: Readonly<Record<string, string | undefined>>,
  defaultUrl: string | null,
): ProviderSetup {
  if (
    defaultUrl === null &&
    (env.UVCP_AI_MODEL === undefined || env.UVCP_AI_BASE_URL === undefined)
  ) {
    return fail(assistantMessages.missingCompatible);
  }
  const model = readModel(env.UVCP_AI_MODEL, null);
  if (model === null) {
    return fail(
      env.UVCP_AI_MODEL === undefined
        ? assistantMessages.missingLocalModel
        : assistantMessages.badModel,
    );
  }
  const baseURL = env.UVCP_AI_BASE_URL ?? defaultUrl;
  if (baseURL === null) {
    return fail(assistantMessages.missingCompatible);
  }
  if (!baseUrlAllowed(baseURL)) {
    return fail(assistantMessages.badBaseUrl);
  }
  const apiKey = readKey(env.UVCP_AI_API_KEY ?? "local");
  if (apiKey === null) {
    return fail(assistantMessages.badKey);
  }
  const kind = defaultUrl === null ? "compatible" : "ollama";
  return { ok: true, settings: { kind, model, apiKey, baseURL } };
}

function readModel(
  value: string | undefined,
  fallback: string | null,
): string | null {
  const model = value ?? fallback;
  if (model === null || !MODEL_NAME.test(model)) {
    return null;
  }
  return model;
}

function developerEnv(
  env: Readonly<Record<string, string | undefined>>,
): boolean {
  return (
    env.XAI_API_KEY !== undefined ||
    env.UVCP_AI_PROVIDER !== undefined ||
    env.UVCP_AI_BASE_URL !== undefined ||
    env.UVCP_AI_MODEL !== undefined ||
    env.UVCP_AI_API_KEY !== undefined
  );
}

function xaiChoice(value: Record<string, unknown>): ProviderSetup {
  if (!closed(value, ["provider", "model", "apiKey"])) {
    return fail(assistantMessages.badRequest);
  }
  const apiKey = requiredKey(value.apiKey);
  if (!apiKey.ok) {
    return apiKey;
  }
  const model = optionalModel(value.model, DEFAULT_XAI_MODEL);
  if (!model.ok) {
    return model;
  }
  return {
    ok: true,
    settings: {
      kind: "xai",
      model: model.value,
      apiKey: apiKey.value,
      baseURL: XAI_BASE_URL,
    },
  };
}

function hostedChoice(value: Record<string, unknown>): ProviderSetup {
  if (!closed(value, ["provider", "model", "baseUrl", "apiKey"])) {
    return fail(assistantMessages.badRequest);
  }
  if (typeof value.baseUrl !== "string" || value.baseUrl.length === 0) {
    return fail(assistantMessages.needAddress);
  }
  if (!hostedUrlAllowed(value.baseUrl)) {
    return fail(assistantMessages.hostedAddress);
  }
  const model = requiredModel(value.model);
  if (!model.ok) {
    return model;
  }
  const apiKey = requiredKey(value.apiKey);
  if (!apiKey.ok) {
    return apiKey;
  }
  return {
    ok: true,
    settings: {
      kind: "compatible",
      model: model.value,
      apiKey: apiKey.value,
      baseURL: value.baseUrl,
    },
  };
}

function ollamaChoice(value: Record<string, unknown>): ProviderSetup {
  if (!closed(value, ["provider", "model"])) {
    return fail(assistantMessages.badRequest);
  }
  const model = requiredModel(value.model);
  if (!model.ok) {
    return model;
  }
  return {
    ok: true,
    settings: {
      kind: "ollama",
      model: model.value,
      apiKey: "local",
      baseURL: DEFAULT_OLLAMA_URL,
    },
  };
}

type ReadText =
  | { readonly ok: true; readonly value: string }
  | { readonly ok: false; readonly message: string };

function requiredKey(value: unknown): ReadText {
  if (typeof value !== "string" || value.length === 0) {
    return fail(assistantMessages.needKey);
  }
  const apiKey = readKey(value);
  if (apiKey === null) {
    return fail(assistantMessages.badKey);
  }
  return { ok: true, value: apiKey };
}

function requiredModel(value: unknown): ReadText {
  if (typeof value !== "string" || value.length === 0) {
    return fail(assistantMessages.needModel);
  }
  if (!MODEL_NAME.test(value)) {
    return fail(assistantMessages.badModel);
  }
  return { ok: true, value };
}

function optionalModel(value: unknown, fallback: string): ReadText {
  if (value === undefined) {
    return { ok: true, value: fallback };
  }
  return requiredModel(value);
}

function closed(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readKey(value: string | undefined): string | null {
  if (
    value === undefined ||
    value.length === 0 ||
    value.length > LIMITS.keyLength
  ) {
    return null;
  }
  if (/[\r\n]/.test(value)) {
    return null;
  }
  return value;
}

function fail(message: string): {
  readonly ok: false;
  readonly message: string;
} {
  return { ok: false, message };
}

import { URL } from "node:url";
import { assistantMessages, LIMITS } from "./messages.ts";
import { defaultModelFor, isProviderId, type ProviderId } from "./providers.ts";

export type ProviderSettings = {
  readonly kind: ProviderId;
  readonly model: string;
  readonly apiKey: string;
  readonly baseURL: string;
};

export type ProviderSetup =
  | { readonly ok: true; readonly settings: ProviderSettings }
  | { readonly ok: false; readonly message: string };

const MODEL_NAME = /^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,127}$/;
const DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434/v1";
const LOCKED_URL = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1/",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/",
  openrouter: "https://openrouter.ai/api/v1",
  xai: "https://api.x.ai/v1",
} as const;

type LockedKind = keyof typeof LOCKED_URL;

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
  if (isLockedKind(selected) && selected !== "xai") {
    return namedSettings(env, selected);
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
  readonly provider: ProviderId | null;
  readonly model: string | null;
  readonly credential: boolean;
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
      credential: false,
    };
  }
  return {
    configured: true,
    source: session === null ? "environment" : "session",
    mode: resolved.settings.kind === "ollama" ? "local" : "hosted",
    provider: resolved.settings.kind,
    model: resolved.settings.model,
    credential: session !== null && session.kind !== "ollama",
  };
}

export function settingsFromChoice(
  value: unknown,
  previous: ProviderSettings | null = null,
): ProviderSetup {
  if (!isRecord(value) || typeof value.provider !== "string") {
    return fail(assistantMessages.badProvider);
  }
  if (!isProviderId(value.provider)) {
    return fail(assistantMessages.badProvider);
  }
  if (value.provider === "compatible") {
    return hostedChoice(value, previous);
  }
  if (value.provider === "ollama") {
    return ollamaChoice(value);
  }
  if (isLockedKind(value.provider)) {
    return namedChoice(value, value.provider, previous);
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
  const model = readModel(env.UVCP_AI_MODEL, defaultModelFor("xai"));
  if (model === null) {
    return fail(assistantMessages.badModel);
  }
  return {
    ok: true,
    settings: { kind: "xai", model, apiKey, baseURL: LOCKED_URL.xai },
  };
}

function namedSettings(
  env: Readonly<Record<string, string | undefined>>,
  kind: Exclude<LockedKind, "xai">,
): ProviderSetup {
  const apiKey = readKey(env.UVCP_AI_API_KEY);
  if (apiKey === null) {
    return fail(
      env.UVCP_AI_API_KEY === undefined
        ? assistantMessages.needsSetup
        : assistantMessages.badKey,
    );
  }
  const model = readModel(env.UVCP_AI_MODEL, defaultModelFor(kind));
  if (model === null) {
    return fail(assistantMessages.badModel);
  }
  return {
    ok: true,
    settings: { kind, model, apiKey, baseURL: LOCKED_URL[kind] },
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

function namedChoice(
  value: Record<string, unknown>,
  kind: LockedKind,
  previous: ProviderSettings | null,
): ProviderSetup {
  if (!closed(value, ["provider", "model", "apiKey"])) {
    return fail(assistantMessages.badRequest);
  }
  const model = optionalModel(value.model, defaultModelFor(kind));
  if (!model.ok) {
    return model;
  }
  const apiKey = reusedKey(value.apiKey, previous, kind);
  if (!apiKey.ok) {
    return apiKey;
  }
  return {
    ok: true,
    settings: {
      kind,
      model: model.value,
      apiKey: apiKey.value,
      baseURL: LOCKED_URL[kind],
    },
  };
}

function hostedChoice(
  value: Record<string, unknown>,
  previous: ProviderSettings | null,
): ProviderSetup {
  if (!closed(value, ["provider", "model", "baseUrl", "apiKey"])) {
    return fail(assistantMessages.badRequest);
  }
  const address = readHostedAddress(value.baseUrl, previous);
  if (!address.ok) {
    return address;
  }
  const model = requiredModel(value.model);
  if (!model.ok) {
    return model;
  }
  const apiKey = compatibleKey(value.apiKey, previous, address.value);
  if (!apiKey.ok) {
    return apiKey;
  }
  return {
    ok: true,
    settings: {
      kind: "compatible",
      model: model.value,
      apiKey: apiKey.value,
      baseURL: address.value,
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

function readHostedAddress(
  value: unknown,
  previous: ProviderSettings | null,
): ReadText {
  if (value === undefined || value === "") {
    if (previous !== null && previous.kind === "compatible") {
      return { ok: true, value: previous.baseURL };
    }
    return fail(assistantMessages.needAddress);
  }
  if (typeof value !== "string" || !hostedUrlAllowed(value)) {
    return fail(
      typeof value === "string"
        ? assistantMessages.hostedAddress
        : assistantMessages.needAddress,
    );
  }
  return { ok: true, value };
}

function compatibleKey(
  value: unknown,
  previous: ProviderSettings | null,
  baseURL: string,
): ReadText {
  if (
    (value === undefined || value === "") &&
    previous !== null &&
    previous.kind === "compatible" &&
    previous.baseURL === baseURL
  ) {
    return { ok: true, value: previous.apiKey };
  }
  if (value === undefined || value === "") {
    return fail(assistantMessages.needKey);
  }
  return requiredKey(value);
}

type ReadText =
  | { readonly ok: true; readonly value: string }
  | { readonly ok: false; readonly message: string };

function reusedKey(
  value: unknown,
  previous: ProviderSettings | null,
  kind: LockedKind,
): ReadText {
  if (
    (value === undefined || value === "") &&
    previous !== null &&
    previous.kind === kind
  ) {
    return { ok: true, value: previous.apiKey };
  }
  if (value === undefined || value === "") {
    return fail(assistantMessages.needKey);
  }
  return requiredKey(value);
}

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

function optionalModel(value: unknown, fallback: string | null): ReadText {
  if (value === undefined) {
    if (fallback === null || !MODEL_NAME.test(fallback)) {
      return fail(assistantMessages.badModel);
    }
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

function isLockedKind(value: string): value is LockedKind {
  return Object.hasOwn(LOCKED_URL, value);
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

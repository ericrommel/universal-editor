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
        ? assistantMessages.missingXaiKey
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

function fail(message: string): ProviderSetup {
  return { ok: false, message };
}

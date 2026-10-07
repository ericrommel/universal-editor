import { assistantMessages } from "./messages.ts";
import { acceptedModelName } from "./provider-settings.ts";

// Probe only this loopback origin, and do not follow a redirect.
const OLLAMA_ORIGIN = "http://127.0.0.1:11434";
const MODEL_LIMIT = 32;

export type LocalModels =
  | { readonly ok: true; readonly models: readonly string[] }
  | { readonly ok: false; readonly message: string };

type Found = {
  readonly names: readonly string[];
  readonly present: number;
};

export async function detectLocalModels(
  fetchImpl: typeof fetch = fetch,
): Promise<LocalModels> {
  const tags = await probe(fetchImpl, `${OLLAMA_ORIGIN}/api/tags`);
  const fromTags = tags === null ? null : namesFrom(tags, "name", "models");
  if (fromTags !== null) {
    return finish(fromTags);
  }
  const listed = await probe(fetchImpl, `${OLLAMA_ORIGIN}/v1/models`);
  const fromList = listed === null ? null : namesFrom(listed, "id", "data");
  if (fromList !== null) {
    return finish(fromList);
  }
  return { ok: false, message: assistantMessages.localNotRunning };
}

async function probe(
  fetchImpl: typeof fetch,
  url: string,
): Promise<unknown | null> {
  try {
    const response = await fetchImpl(url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(2000),
      headers: { accept: "application/json" },
    });
    if (response.status < 200 || response.status >= 300) {
      return null;
    }
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function namesFrom(
  body: unknown,
  field: "name" | "id",
  list: "models" | "data",
): Found | null {
  if (!isRecord(body) || !Array.isArray(body[list])) {
    return null;
  }
  const items = body[list];
  const names: string[] = [];
  for (const item of items) {
    if (!isRecord(item) || typeof item[field] !== "string") {
      continue;
    }
    const name = item[field];
    if (!acceptedModelName(name) || names.includes(name)) {
      continue;
    }
    names.push(name);
    if (names.length === MODEL_LIMIT) {
      break;
    }
  }
  return { names, present: items.length };
}

function finish(found: Found): LocalModels {
  if (found.names.length > 0) {
    return { ok: true, models: found.names };
  }
  return {
    ok: false,
    message:
      found.present === 0
        ? assistantMessages.localNoModels
        : assistantMessages.localUnusable,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

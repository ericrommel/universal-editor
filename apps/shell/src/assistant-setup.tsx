import {
  assistantMessages,
  assistantProviders,
  isProviderId,
  type ProviderId,
} from "@uvcp/ai";
import { useState } from "react";

export type SavedAssistant = {
  readonly provider: ProviderId;
  readonly model: string;
  readonly credential: boolean;
};

export async function loadAssistantStatus(): Promise<
  | ({ readonly configured: true } & SavedAssistant)
  | { readonly configured: false }
> {
  const response = await fetch("/api/ai/status");
  const body: unknown = await response.json();
  if (
    !isRecord(body) ||
    body.ok !== true ||
    body.configured !== true ||
    typeof body.model !== "string" ||
    body.model.length === 0 ||
    typeof body.provider !== "string" ||
    !isProviderId(body.provider)
  ) {
    return { configured: false };
  }
  return {
    configured: true,
    provider: body.provider,
    model: body.model,
    credential: body.credential === true,
  };
}

export function AssistantSetup({
  saved,
  onConfigured,
  onClose,
}: {
  readonly saved: SavedAssistant | null;
  readonly onConfigured: (choice: SavedAssistant) => void;
  readonly onClose: (() => void) | null;
}) {
  const initial = saved?.provider ?? assistantProviders[0].id;
  const [provider, setProvider] = useState<ProviderId>(initial);
  const [model, setModel] = useState(
    saved?.provider === initial ? saved.model : defaultModel(initial),
  );
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [localModels, setLocalModels] = useState<readonly string[] | null>(
    null,
  );
  const [localModel, setLocalModel] = useState(
    saved?.provider === "ollama" ? saved.model : "",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const entry =
    assistantProviders.find((item) => item.id === provider) ??
    assistantProviders[0];
  const keepSaved =
    saved !== null && saved.provider === provider && saved.credential;
  const keyMissing =
    !entry.local &&
    apiKey.length === 0 &&
    (!keepSaved || (entry.address && baseUrl.length > 0));
  const addressMissing = entry.address && baseUrl.length === 0 && !keepSaved;
  const modelMissing = entry.local
    ? localModel.length === 0
    : model.length === 0;

  function choose(next: string) {
    if (!isProviderId(next)) {
      return;
    }
    const found = assistantProviders.find((item) => item.id === next);
    if (found === undefined) {
      return;
    }
    setProvider(found.id);
    setApiKey("");
    setBaseUrl("");
    setMessage(null);
    if (saved !== null && saved.provider === found.id) {
      setModel(saved.model);
      if (found.local) {
        setLocalModel(saved.model);
      }
      return;
    }
    setModel(found.defaultModel ?? "");
    if (found.local) {
      setLocalModel("");
    }
  }

  async function look() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/ai/local", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      const body: unknown = await response.json();
      if (!isRecord(body) || body.ok !== true || !Array.isArray(body.models)) {
        setLocalModels(null);
        setMessage(messageOf(body) ?? assistantMessages.localNotRunning);
        return;
      }
      const models = body.models.filter(
        (item): item is string => typeof item === "string",
      );
      setLocalModels(models);
      const first = models[0];
      setLocalModel(first ?? "");
      if (models.length === 0) {
        setMessage(assistantMessages.localNoModels);
      }
    } catch {
      setMessage(assistantMessages.reachServer);
    } finally {
      setBusy(false);
    }
  }

  async function save(event: { preventDefault(): void }) {
    event.preventDefault();
    const payload: Record<string, string> = entry.local
      ? { provider: "ollama", model: localModel }
      : { provider: entry.id, model };
    if (!entry.local && entry.address && baseUrl.length > 0) {
      payload.baseUrl = baseUrl;
    }
    if (!entry.local && apiKey.length > 0) {
      payload.apiKey = apiKey;
    }
    const choice = await postSetup(payload, setBusy, setMessage);
    if (choice !== null) {
      setApiKey("");
      onConfigured(choice);
    }
  }

  const knownModels = localModels ?? [];
  const modelOptions =
    localModel.length > 0 && !knownModels.includes(localModel)
      ? [localModel, ...knownModels]
      : knownModels;

  return (
    <section className="uvcp-ai-setup" aria-labelledby="uvcp-ai-setup-title">
      <h2 id="uvcp-ai-setup-title">
        {saved === null ? "Set up the assistant" : "Change provider"}
      </h2>
      {saved === null ? null : <p>Using {saved.model}.</p>}
      <p>
        Choose the provider you already use. The scene editor keeps working
        either way.
      </p>
      <form onSubmit={(event) => void save(event)}>
        <label>
          Provider
          <select
            value={provider}
            disabled={busy}
            onChange={(event) => choose(event.target.value)}
          >
            {assistantProviders.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <p>{entry.hint}</p>
        {entry.local ? (
          <div className="uvcp-ai-actions">
            <button type="button" disabled={busy} onClick={() => void look()}>
              Look for Ollama
            </button>
          </div>
        ) : null}
        {entry.local && modelOptions.length > 0 ? (
          <label>
            Model
            <select
              value={localModel}
              disabled={busy}
              onChange={(event) => setLocalModel(event.target.value)}
            >
              {modelOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {entry.address ? (
          <div>
            {keepSaved && baseUrl.length === 0 ? (
              <p>
                An address is already saved for this session. It is not shown
                again. Enter a new https address only together with a new API
                key.
              </p>
            ) : null}
            <label>
              Address
              <input
                type="url"
                value={baseUrl}
                disabled={busy}
                required={addressMissing}
                autoComplete="off"
                placeholder={
                  keepSaved && baseUrl.length === 0
                    ? "Saved for this session"
                    : ""
                }
                onChange={(event) => setBaseUrl(event.target.value)}
              />
            </label>
          </div>
        ) : null}
        {entry.local ? null : (
          <label>
            Model
            <input
              value={model}
              disabled={busy}
              required={model.length === 0}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setModel(event.target.value)}
            />
          </label>
        )}
        {entry.local ? null : (
          <div>
            {keepSaved && apiKey.length === 0 && baseUrl.length === 0 ? (
              <p>
                A key is already saved for this session. Leave the API key empty
                to keep it.
              </p>
            ) : null}
            <label>
              API key
              <input
                type="password"
                value={apiKey}
                disabled={busy}
                required={keyMissing}
                autoComplete="off"
                spellCheck={false}
                placeholder={
                  keepSaved && apiKey.length === 0 && baseUrl.length === 0
                    ? "Saved for this session"
                    : ""
                }
                onChange={(event) => setApiKey(event.target.value)}
              />
            </label>
            {entry.keyUrl === null ? null : (
              <p>
                <a
                  href={entry.keyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {entry.keyLabel}
                </a>
              </p>
            )}
            <p>
              The key stays in this running session and is not saved in the
              scene.
            </p>
          </div>
        )}
        <div className="uvcp-ai-actions">
          <button
            type="submit"
            disabled={busy || keyMissing || addressMissing || modelMissing}
          >
            {entry.local ? "Use this model" : "Save and use"}
          </button>
          {onClose === null ? null : (
            <button type="button" disabled={busy} onClick={onClose}>
              Cancel
            </button>
          )}
        </div>
      </form>
      {message === null ? null : <p role="status">{message}</p>}
    </section>
  );
}

function defaultModel(id: ProviderId): string {
  const found = assistantProviders.find((item) => item.id === id);
  return found?.defaultModel ?? "";
}

async function postSetup(
  payload: unknown,
  setBusy: (busy: boolean) => void,
  setMessage: (message: string | null) => void,
): Promise<SavedAssistant | null> {
  setBusy(true);
  setMessage(null);
  try {
    const response = await fetch("/api/ai/setup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body: unknown = await response.json();
    if (
      !isRecord(body) ||
      body.ok !== true ||
      typeof body.model !== "string" ||
      body.model.length === 0 ||
      typeof body.provider !== "string" ||
      !isProviderId(body.provider)
    ) {
      setMessage(messageOf(body) ?? assistantMessages.badRequest);
      return null;
    }
    return {
      provider: body.provider,
      model: body.model,
      credential: body.credential === true,
    };
  } catch {
    setMessage(assistantMessages.reachServer);
    return null;
  } finally {
    setBusy(false);
  }
}

function messageOf(value: unknown): string | null {
  if (!isRecord(value) || typeof value.message !== "string") {
    return null;
  }
  return value.message;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

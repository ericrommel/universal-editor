import { assistantMessages } from "@uvcp/ai";
import { useState } from "react";

const XAI_KEYS = "https://console.x.ai/team/default/api-keys";

export async function loadAssistantStatus(): Promise<
  | { readonly configured: true; readonly model: string }
  | { readonly configured: false }
> {
  const response = await fetch("/api/ai/status");
  const body: unknown = await response.json();
  if (
    !isRecord(body) ||
    body.ok !== true ||
    body.configured !== true ||
    typeof body.model !== "string" ||
    body.model.length === 0
  ) {
    return { configured: false };
  }
  return { configured: true, model: body.model };
}

export function AssistantSetup({
  currentModel,
  onConfigured,
  onClose,
}: {
  readonly currentModel: string | null;
  readonly onConfigured: (model: string) => void;
  readonly onClose: (() => void) | null;
}) {
  const [choice, setChoice] = useState<"hosted" | "local">("hosted");
  const [provider, setProvider] = useState<"xai" | "compatible">("xai");
  const [model, setModel] = useState("grok-4.7");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [localModels, setLocalModels] = useState<readonly string[] | null>(
    null,
  );
  const [localModel, setLocalModel] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function saveHosted(event: { preventDefault(): void }) {
    event.preventDefault();
    const payload =
      provider === "xai"
        ? { provider, model, apiKey }
        : { provider, model, apiKey, baseUrl };
    const saved = await postSetup(payload, setBusy, setMessage);
    if (saved !== null) {
      setApiKey("");
      onConfigured(saved);
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

  async function saveLocal(event: { preventDefault(): void }) {
    event.preventDefault();
    const saved = await postSetup(
      { provider: "ollama", model: localModel },
      setBusy,
      setMessage,
    );
    if (saved !== null) {
      onConfigured(saved);
    }
  }

  return (
    <section className="uvcp-ai-setup" aria-labelledby="uvcp-ai-setup-title">
      <h2 id="uvcp-ai-setup-title">Set up the assistant</h2>
      {currentModel === null ? null : <p>Using {currentModel}.</p>}
      <p>
        Choose a hosted provider or a local model. The scene editor keeps
        working either way.
      </p>
      <div className="uvcp-ai-choices">
        <label>
          <input
            type="radio"
            name="assistant-source"
            checked={choice === "hosted"}
            onChange={() => setChoice("hosted")}
          />
          Hosted provider
        </label>
        <label>
          <input
            type="radio"
            name="assistant-source"
            checked={choice === "local"}
            onChange={() => setChoice("local")}
          />
          Local model
        </label>
      </div>
      {choice === "hosted" ? (
        <form onSubmit={(event) => void saveHosted(event)}>
          <label>
            Provider
            <select
              value={provider}
              disabled={busy}
              onChange={(event) => {
                const next =
                  event.target.value === "compatible" ? "compatible" : "xai";
                setProvider(next);
                setModel(next === "xai" ? "grok-4.7" : "");
                setApiKey("");
              }}
            >
              <option value="xai">xAI</option>
              <option value="compatible">Other hosted provider</option>
            </select>
          </label>
          {provider === "xai" ? (
            <p>
              The model and API key are required. The service address stays with
              xAI.{" "}
              <a href={XAI_KEYS} target="_blank" rel="noopener noreferrer">
                Create an xAI API key
              </a>
            </p>
          ) : (
            <div>
              <p>
                Enter the https address, model name, and API key that provider
                requires.
              </p>
              <label>
                Address
                <input
                  type="url"
                  value={baseUrl}
                  disabled={busy}
                  autoComplete="off"
                  onChange={(event) => setBaseUrl(event.target.value)}
                />
              </label>
            </div>
          )}
          <label>
            Model
            <input
              value={model}
              disabled={busy}
              autoComplete="off"
              onChange={(event) => setModel(event.target.value)}
            />
          </label>
          <label>
            API key
            <input
              type="password"
              value={apiKey}
              disabled={busy}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setApiKey(event.target.value)}
            />
          </label>
          <p>
            The key stays in this running session and is not saved in the scene.
          </p>
          <div className="uvcp-ai-actions">
            <button type="submit" disabled={busy}>
              Save and use
            </button>
            {onClose === null ? null : (
              <button type="button" disabled={busy} onClick={onClose}>
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        <form onSubmit={(event) => void saveLocal(event)}>
          <p>
            This looks for Ollama already running on this computer. It does not
            install or configure Ollama.
          </p>
          <div className="uvcp-ai-actions">
            <button type="button" disabled={busy} onClick={() => void look()}>
              Look for Ollama
            </button>
          </div>
          {localModels !== null && localModels.length > 0 ? (
            <label>
              Model
              <select
                value={localModel}
                disabled={busy}
                onChange={(event) => setLocalModel(event.target.value)}
              >
                {localModels.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="uvcp-ai-actions">
            <button type="submit" disabled={busy || localModel.length === 0}>
              Use this model
            </button>
            {onClose === null ? null : (
              <button type="button" disabled={busy} onClick={onClose}>
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
      {message === null ? null : <p role="status">{message}</p>}
    </section>
  );
}

async function postSetup(
  payload: unknown,
  setBusy: (busy: boolean) => void,
  setMessage: (message: string | null) => void,
): Promise<string | null> {
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
      body.model.length === 0
    ) {
      setMessage(messageOf(body) ?? assistantMessages.badRequest);
      return null;
    }
    return body.model;
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

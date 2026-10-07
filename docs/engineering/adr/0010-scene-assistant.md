# ADR-0010 — Scene assistant

**Status:** Accepted on the working line (`master`).

**Date:** 2026-10-06. Updated 2026-10-07 for the provider list.

## Decision

A person describes a create or edit in natural language. The application turns that request into a small allowlist of scene actions and applies them to the same in-memory scene the editor already holds. The result is visible and can be edited again with the same actions.

The allowlist is:

- `createRectangle`
- `createBox`
- `move`
- `resize`
- `rotate`

At most eight actions are applied, and only when every action validates. A failure leaves the previous scene in place. Extents, ids, and transforms still pass through the scene operations in `@uvcp/core`.

The model provider is replaceable. The screen collects the choice and can replace it later in the same running app. Environment variables remain a developer fallback and are used only when the session has no saved choice.

The screen lists OpenAI, Anthropic, Gemini, OpenRouter, xAI, Ollama, and another provider. Each choice asks only for the fields that provider needs. A default model is filled in when the provider has one, and it can be changed. Saving replaces the in-memory session immediately.

A named provider locks its service address. The request cannot supply a different one, and a key stored for one provider is not reused for another. The same provider can change its model without the key being sent again. Another provider keeps a stored https address only when the next save omits it or repeats it exactly. A different address requires a new key. Status and setup responses include a `credential` flag. It is true only when this session already holds a hosted key. They do not return the key or the address.

- `openai` uses chat completions at `https://api.openai.com/v1`. The default model is `gpt-6-astra`. The screen asks for the model and the API key.
- `anthropic` uses chat completions at `https://api.anthropic.com/v1/`. The default model is `claude-sonnet-5-5`. The screen asks for the model and the API key.
- `gemini` uses chat completions at `https://generativelanguage.googleapis.com/v1beta/openai/`. The default model is `gemini-3.8-flash`. The screen asks for the model and the API key.
- `openrouter` uses chat completions at `https://openrouter.ai/api/v1`. The default model is `openrouter/auto`. The screen asks for the model and the API key.
- `xai` uses the Responses API at `https://api.x.ai/v1`. The default model is `grok-4.7`. The screen asks for the model and the API key. A developer can still supply that key as `XAI_API_KEY`. That variable is not used for the other named providers.
- `ollama` is the local runtime. The screen probes `http://127.0.0.1:11434` and lists models that are already installed. The application does not install or configure Ollama. The chat-completions call uses `http://127.0.0.1:11434/v1`. The screen does not ask for an address or a key. A developer can still select it with `UVCP_AI_PROVIDER` and `UVCP_AI_MODEL`.
- `compatible` is another hosted OpenAI-compatible provider. The screen requires an https address, a model name, and an API key. A developer can still set `UVCP_AI_BASE_URL`, `UVCP_AI_MODEL`, and an optional `UVCP_AI_API_KEY`, including a localhost http address.

A developer selects OpenAI, Anthropic, Gemini, or OpenRouter with `UVCP_AI_PROVIDER` and `UVCP_AI_API_KEY`. `UVCP_AI_MODEL` overrides the default model. `UVCP_AI_BASE_URL` does not move a named provider. When `UVCP_AI_PROVIDER` is unset, the developer fallback remains xAI.

A request that the five actions cannot perform is refused with a fixed sentence naming those actions. The model can call `explainLimit` with reason `shape` or `command`. The sentence does not include the request text or the model output. The scene stays as it was.

The OpenAI SDK is the only provider client. xAI uses its Responses API. The other providers publish an OpenAI-compatible chat endpoint, so no second SDK is added. The Vercel AI SDK was not used: its provider package depends on `json-schema@0.4.0`, whose license expression is `AFL-2.1 OR BSD-3-Clause`, and this repository accepts an OR only when every side is allowed.

The browser does not receive a provider key. `apps/shell/assistant-middleware.ts` calls the model from the loopback Vite server and keeps a session choice in that process only. Status and setup responses name the provider and model, not the key or the provider address. The static file build has no key and no provider client.

`EntitlementPort` is the billing seam. `ai.scene.basic` is included. `ai.scene.arrange` is paid and is not implemented. A third-party billing provider would implement `allows(capabilityId)`. This build does not take payment.

`renderNull` is unchanged. The picture is SVG in the shell, painted from editor facts. There is no canvas and no new renderer import.

## Import table

`@uvcp/ai` imports no workspace package. `editor` may import `@uvcp/ai` for parsing and applying actions. `shell` may import `@uvcp/ai`, including the `./provider` subpath from the server middleware. `editor` still does not import the renderer, React, or `platform`. `shell` still does not import `core`.

## Consequences

Basic scene edits work with a configured provider, including a local model. Paid arrangement is refused with a fixed sentence. Provider failures use a fixed sentence and do not include the key, the prompt, or the response body.

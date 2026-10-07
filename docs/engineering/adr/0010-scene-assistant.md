# ADR-0010 — Scene assistant

**Status:** Accepted on the working line (`master`).

**Date:** 2026-10-06

## Decision

A person describes a create or edit in natural language. The application turns that request into a small allowlist of scene actions and applies them to the same in-memory scene the editor already holds. The result is visible and can be edited again with the same actions.

The allowlist is:

- `createRectangle`
- `createBox`
- `move`
- `resize`
- `rotate`

At most eight actions are applied, and only when every action validates. A failure leaves the previous scene in place. Extents, ids, and transforms still pass through the scene operations in `@uvcp/core`.

The model provider is replaceable. The screen collects the choice. Environment variables remain a developer fallback and are used only when the session has no saved choice.

- `xai` is the hosted default. It uses the OpenAI SDK (`openai`) and the Responses API model `grok-4.7` at `https://api.x.ai/v1`. The screen asks for the model and the API key. That key is not sent to a caller-chosen host. A developer can still supply it as `XAI_API_KEY`.
- `ollama` is the local runtime. The screen probes `http://127.0.0.1:11434` and lists models that are already installed. The application does not install or configure Ollama. The chat-completions call uses `http://127.0.0.1:11434/v1`. A developer can still select it with `UVCP_AI_PROVIDER` and `UVCP_AI_MODEL`.
- `compatible` is another hosted OpenAI-compatible provider. The screen requires an https address, a model name, and an API key. A developer can still set `UVCP_AI_BASE_URL`, `UVCP_AI_MODEL`, and an optional `UVCP_AI_API_KEY`, including a localhost http address.

A request that the five actions cannot perform is refused with a fixed sentence naming those actions. The model can call `explainLimit` with reason `shape` or `command`. The sentence does not include the request text or the model output. The scene stays as it was.

The OpenAI SDK is the client named for this API on the xAI quickstart. A hand-written provider protocol is not used. One SDK covers xAI, a local Ollama server, and other OpenAI-compatible hosts. The Vercel AI SDK was not used: its provider package depends on `json-schema@0.4.0`, whose license expression is `AFL-2.1 OR BSD-3-Clause`, and this repository accepts an OR only when every side is allowed.

The browser does not receive a provider key. `apps/shell/assistant-middleware.ts` calls the model from the loopback Vite server and keeps a session choice in that process only. Status and setup responses name the provider and model, not the key or the provider address. The static file build has no key and no provider client.

`EntitlementPort` is the billing seam. `ai.scene.basic` is included. `ai.scene.arrange` is paid and is not implemented. A third-party billing provider would implement `allows(capabilityId)`. This build does not take payment.

`renderNull` is unchanged. The picture is SVG in the shell, painted from editor facts. There is no canvas and no new renderer import.

## Import table

`@uvcp/ai` imports no workspace package. `editor` may import `@uvcp/ai` for parsing and applying actions. `shell` may import `@uvcp/ai`, including the `./provider` subpath from the server middleware. `editor` still does not import the renderer, React, or `platform`. `shell` still does not import `core`.

## Consequences

Basic scene edits work with a configured provider, including a local model. Paid arrangement is refused with a fixed sentence. Provider failures use a fixed sentence and do not include the key, the prompt, or the response body.

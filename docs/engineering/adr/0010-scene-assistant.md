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

The model provider is replaceable:

- `xai` is the default. It uses the OpenAI SDK (`openai`) and the Responses API model `grok-4.7` at `https://api.x.ai/v1`. The API key is `XAI_API_KEY`. That key is not sent to a caller-chosen host.
- `ollama` uses the same SDK's chat-completions API against `http://127.0.0.1:11434/v1` unless `UVCP_AI_BASE_URL` sets another localhost or https address. `UVCP_AI_MODEL` names the local model.
- `compatible` is any other OpenAI-compatible HTTPS endpoint, with `UVCP_AI_BASE_URL`, `UVCP_AI_MODEL`, and an optional `UVCP_AI_API_KEY`.

The OpenAI SDK is the client named for this API on the xAI quickstart. A hand-written provider protocol is not used. One SDK covers xAI, a local Ollama server, and other OpenAI-compatible hosts. The Vercel AI SDK was not used: its provider package depends on `json-schema@0.4.0`, whose license expression is `AFL-2.1 OR BSD-3-Clause`, and this repository accepts an OR only when every side is allowed.

The browser does not receive a provider key. `apps/shell/assistant-middleware.ts` calls the model from the loopback Vite server. The static file build has no key and no provider client.

`EntitlementPort` is the billing seam. `ai.scene.basic` is included. `ai.scene.arrange` is paid and is not implemented. A third-party billing provider would implement `allows(capabilityId)`. This build does not take payment.

`renderNull` is unchanged. The picture is SVG in the shell, painted from editor facts. There is no canvas and no new renderer import.

## Import table

`@uvcp/ai` imports no workspace package. `editor` may import `@uvcp/ai` for parsing and applying actions. `shell` may import `@uvcp/ai`, including the `./provider` subpath from the server middleware. `editor` still does not import the renderer, React, or `platform`. `shell` still does not import `core`.

## Consequences

Basic scene edits work with a configured provider, including a local model. Paid arrangement is refused with a fixed sentence. Provider failures use a fixed sentence and do not include the key, the prompt, or the response body.

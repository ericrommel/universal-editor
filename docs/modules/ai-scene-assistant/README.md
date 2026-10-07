# Scene assistant

The ready screen is the scene editor. A failed startup still shows the foundation screen. Rectangle, Box, drag, size, rotation, undo, and save keep working after the assistant changes the scene.

Type a request and choose Apply. The assistant can:

- create a rectangle or a box
- move an object
- change its width, height, or depth
- change its rotation
- do a few of those together, up to eight actions

Example: "Create a rectangle named r1 and a box named b1 beside it."

The objects remain in the scene. Select one and choose Update to edit its position, rotation, or size without another request.

## Providers

Copy `.env.example` to `.env` in the repository root. `.env` is ignored by git.

- Default: set `XAI_API_KEY`. The model is `grok-4.7`.
- Local: set `UVCP_AI_PROVIDER=ollama` and `UVCP_AI_MODEL` to a tool-calling model served at `http://127.0.0.1:11434/v1`.
- Another OpenAI-compatible provider: set `UVCP_AI_PROVIDER=compatible`, `UVCP_AI_BASE_URL`, `UVCP_AI_MODEL`, and, when that host requires one, `UVCP_AI_API_KEY`.

Run `pnpm dev` and open the loopback URL. The key stays in that server. Plain `https` addresses are allowed for a remote provider. Plain `http` is allowed only for localhost.

`ai.scene.basic` is included. `ai.scene.arrange` is the paid capability id. Nothing in this build calls a payment service. A billing provider implements `EntitlementPort.allows` in `@uvcp/ai`.

## Limits

The assistant does not save a file, delete an object, or run a command outside the five actions. A request that does not validate does not change the scene. The message on screen says what happened.

# Scene assistant

The ready screen is the scene editor. A failed startup still shows the foundation screen. Rectangle, Box, drag, size, rotation, undo, and save keep working after the assistant changes the scene.

Type a request and choose Apply. The assistant can:

- create a rectangle or a box
- move an object
- change its width, height, or depth
- change its rotation
- do a few of those together, up to eight actions

Example: "Create a rectangle named r1 and a box named b1 beside it."

The objects remain in the scene. Drag a shape to move it. Select it and edit Width, Height, Depth, and Rotation, then choose Apply size. Rectangle, Box, Undo, Redo, Save, and Open stay on the screen. Those controls wait while Apply is working.

## Providers

When the assistant is not ready, the screen asks for a hosted provider or a local model. Rectangle, Box, and the rest of the editor stay available.

- Hosted: choose xAI, or another hosted provider. Enter the model and the API key that provider requires. An xAI address is fixed. Another hosted provider needs an https address.
- Local: choose Local model, then look for Ollama. The application lists models from an Ollama app that is already running and lets you pick one. It does not install or configure Ollama.

The key stays in the running app for that session. It is not written into the scene file. After a restart, enter it again. Choose AI setup to change the provider later.

Developers can still put the same choices in a git-ignored `.env`, using `.env.example` as the list. That path is optional. The screen does not ask for it.

`ai.scene.basic` is included. `ai.scene.arrange` is the paid capability id. Nothing in this build calls a payment service. A billing provider implements `EntitlementPort.allows` in `@uvcp/ai`.

## Limits

The assistant does not save a file, delete an object, or run a command outside the five actions. A circle, text, color, or other unsupported request is explained on screen and does not change the scene. A request that does not validate does not change the scene either.

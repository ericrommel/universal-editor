# Working line

`main` is the protected product branch. Do not commit to it and do not merge this work into it.

`master` is the working integration branch. It starts from `main` and already contains the scene model. Feature branches merge into `master` after role review and a green `pnpm verify`.

On this line, engineering, design, quality, and security review and accept each other's work. There is no Product Owner gate. A role records its review on the pull request and ends with **Review complete: APPROVED** when it has no blocking finding on that head. The pull request owner merges into `master` after the required reviews and verify are green.

The scene assistant is the first product capability on this line. Its decision record is [ADR-0010](adr/0010-scene-assistant.md). Behavior and setup are in [the scene assistant note](../modules/ai-scene-assistant/README.md).

Module specifications that still live only on `main`'s preparation branches are not authorization to build those modules here. This line builds the scene assistant against the scene model that is already on `master`.

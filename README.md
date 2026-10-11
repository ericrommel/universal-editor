# Universal Visual Creation Platform

This repository contains the Universal Visual Creation Platform.

Product intent is in [docs/product-overview.md](docs/product-overview.md). Engineering process and architecture are under [docs/engineering](docs/engineering). Module specifications and test plans are under [docs/modules](docs/modules).

`main` is protected. Current product work integrates on `master`. See [docs/engineering/working-line.md](docs/engineering/working-line.md). The scene assistant is [docs/modules/ai-scene-assistant/README.md](docs/modules/ai-scene-assistant/README.md).

Current work status is the GitHub issue and the project board. It is not recorded in this file.

## Try the editor

The page to open is the production build in `apps/shell/dist`, served with the production content security policy. GitHub Pages cannot send that header, so it is not the host. From a checkout: `corepack pnpm install --frozen-lockfile`, `corepack pnpm build`, then `node scripts/serve-static.mjs`. Open `http://127.0.0.1:4173/`. The editor works without an AI provider. Save downloads `scene.json`. The page keeps the project in the tab until you leave or refresh. A public host must send the policy in `apps/shell/public/_headers`.

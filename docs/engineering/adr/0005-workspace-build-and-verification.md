# ADR-0005: Workspace, build, and verification

**Status:** Proposed  
**Date:** 2026-10-02  
**Decider:** Tech Lead  
**Consulted:** Senior DevOps / Platform Engineer, Functional Quality Engineer, Non-Functional Quality Engineer, Senior Application Security Engineer

## Context

Module 0 needs a reproducible install, one verification command, CI that fails when that command fails, and mechanical dependency boundaries (M0-FR-004, M0-FR-005, M0-FR-007, M0-NFR-001, M0-NFR-004, M0-NFR-010). The remote is GitHub: `ericrommel/universal-editor`.

The primary development environment proposed for documentation and local launch is 64-bit Windows x64, pending Product Owner confirmation. Product targets are unchanged.

## Decision

### Workspace

pnpm workspace. Private packages. Scope `@uvcp/*`. TypeScript project references whose `references` match the import table in `docs/engineering/architecture.md`. Vite builds only `apps/shell`.

No Turborepo and no Nx. Module 0 has one ordered verification sequence. A task runner's remote cache would add a token and a cache-poisoning boundary without a measured wait to remove.

### Why pnpm, not npm or Yarn

pnpm's isolated `node_modules` makes a forbidden import fail at resolve time instead of succeeding through hoisting. npm workspaces are a real alternative and a smaller moving set, and hoisting still permits phantom dependencies that hide boundary mistakes. Yarn Berry PnP fights Vite; Yarn Classic is a weaker workspace than current npm. npm is the fallback only if the Product Owner rejects a second package manager. It is not the recommendation.

Pin pnpm 12.8.1 or a later 12.x patch on implementation day. Do not use a release that predates the CVE-2026-50021 integrity fix. CI installs with `pnpm install --frozen-lockfile`. Do not use `pnpm ci` until issue 15276 is confirmed fixed for the pin. Keep `allowBuilds` explicit, `minimumReleaseAge` at the pnpm 12 default, and `blockExoticSubdeps` on.

### Language tooling

`tsc -b` is the type checker. Biome is the formatter and linter. ESLint plus Prettier is the familiar alternative and is two configurations for a repository that does not need a plugin ecosystem. Rejected.

Tests use `node --test` and `node:assert` on TypeScript that Node can strip. Packages that those tests execute set `erasableSyntaxOnly`. JSX is not erasable, so `packages/ui` and the shell entry do not set that flag; Vite bundles them and `tsc -b` still typechecks them. Vitest is the alternative once a DOM component test exists. It is one config flag away from treating jsdom as a headless core run. Not in Module 0.

### Verify

`scripts/verify.mjs` is the only verification entrypoint. It runs boundary check, `tsc -b`, Biome, the license allow-list, `pnpm audit --audit-level=high`, headless tests, the production build, and a loopback HTTP smoke of the preview server. It returns the child exit code. No `|| true`.

The HTTP smoke proves the shell builds and serves. The documented `pnpm dev` launch on Windows is the M0-AC-002 evidence. CI does not open a graphical window and does not use xvfb to claim that it did.

### CI

GitHub Actions. `ubuntu-24.04` and `windows-2025`, both required, `fail-fast: false`. Pin the labels. `ubuntu-latest` moves to Ubuntu 26.04 starting 2026-10-19. No macOS job. `contents: read`. `pull_request`, not `pull_request_target`. Actions pinned to commit SHAs. Artifacts are the verify log and the test report, retained 30 days, and are not an environment dump.

Job timeout 30 minutes. Headless diagnostic spawn timeout 60 seconds. Both are hang guardrails. Timings recorded during implementation are observations, stored as `kind: observation`, and are not thresholds.

Dependabot opens weekly npm and Actions updates. It does not merge them. No second CI system. GitLab CI and Azure Pipelines were rejected because the forge is already GitHub.

### Boundaries

`scripts/check-boundaries.mjs` fails the build when a package manifest or a source import leaves the allowed table. dependency-cruiser and an ESLint boundary plugin are more machinery than seven packages need. A script is enough while imports are direct specifiers. If path aliases or re-exports appear, the script has to see them or it stops being the control.

### Developer commands

`pnpm install`, `pnpm dev`, `pnpm start`, `pnpm build`, `pnpm test`, `pnpm verify`. Document those names, and no undocumented manual step, in the Module 0 setup guide during implementation. The guide's commands are Node scripts so they do not depend on PowerShell `&&`.

## Alternatives

### Linux-only CI

Cheaper, and blind to Windows path and script failures. Rejected because the documented primary environment is Windows.

### Linux, Windows, and macOS now

No Module 0 step signs or links native code. A macOS runner is cost without a criterion. Add `macos-26` when a Mac developer is supported or when signing starts. Do not add the retiring `macos-14` image.

### Playwright in CI

An optional smoke was considered. It is a browser supply-chain download, and it does not launch a future desktop shell. The manual launch plus the headless tests cover Module 0. Rejected for now.

## Consequences

- A clean Windows machine with Git, pinned Node 24, and pinned pnpm can install, verify, and launch. A browser is required for `pnpm dev`.
- The Linux CI job is a coupling check. Documentation must not call it Linux desktop support.
- Formatting drift fails verify. That is intentional once Biome is the formatter.
- Audit failures at high severity fail verify. A waiver needs an owner and an expiry. There is no standing `continue-on-error`.

## Confirmation

Product Owner confirmation 2 accepts Windows as the documented Module 0 environment and accepts this CI matrix. Changing the primary OS changes the setup guide and the required runner before implementation starts.

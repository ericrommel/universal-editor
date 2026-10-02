# Module 0 — DevOps / Platform Record

**Role:** Senior DevOps / Platform Engineer
**Status:** Durable record of the Module 0 platform recommendation. The decision is `docs/engineering/architecture.md`, ADR-0005, and ADR-0007. Not an ADR, not Product Owner approval, and not authorization to implement.
**Date:** 2026-10-02
**Scope:** Install, verification commands, CI, and supply-chain controls for Module 0.

This file does not add workflows, application code, or git configuration. Where it and the architecture disagree, the architecture wins. Operational Module 0 requirements win over the archived specification.

## Adopted for Module 0

### Package manager

pnpm, not npm or Yarn. Isolated `node_modules` makes a forbidden import fail at resolve time instead of succeeding through hoisting. npm is a fallback only if the Product Owner rejects a second package manager. It is not the recommendation. Yarn is not recommended.

Pin pnpm 12.8.1, or a later 12.x that still contains the CVE-2026-50021 integrity fix, in `packageManager` on implementation day. That fix is in pnpm 10.34.1 and 11.4.0. Do not pin an older 10.x or 11.x, and do not float `latest`. Enable that exact pnpm with Corepack. Do not install it with an unpinned `curl` script. Do not add a root `install` lifecycle script.

CI uses `pnpm install --frozen-lockfile`, not `pnpm ci`, until pnpm issue 15276 is confirmed fixed for that pin.

Commit `pnpm-lock.yaml`. Public npm registry only. Keep `allowBuilds` explicit, `minimumReleaseAge` at the pnpm 12 default, and `blockExoticSubdeps` on. `esbuild` may be named in `allowBuilds` only if the Vite install fails without it. Do not allow every lifecycle script.

### Node.js

Node.js 24 LTS. Pin the patch in `.node-version` on implementation day. Do not use Node 26 Current. Node 24 enters Maintenance LTS on 2026-10-20 and remains supported until 2028-04-30. CI reads `.node-version`, not a floating `lts/*` tag.

### Workspace and commands

Private pnpm workspace. Packages stay private. Scope `@uvcp/*`. Nothing is published. TypeScript project references follow the import table in the architecture document. Vite builds only the shell. Biome formats and lints. Tests use `node --test`. No Turborepo, Nx, Vitest, Playwright, or Cypress.

An earlier dependency table in this review was not adopted. `scripts/check-boundaries.mjs` enforces the architecture table inside `pnpm verify`.

| Command | Behavior |
| --- | --- |
| `pnpm install` | Install from the lockfile. CI adds `--frozen-lockfile`. |
| `pnpm dev` | Loopback shell. Documented launch for M0-AC-002. |
| `pnpm start` | Alias of `pnpm dev`. |
| `pnpm build` | Libraries and static shell assets. No installer. |
| `pnpm test` | Headless `node --test`. Must not start Vite or open a window. |
| `pnpm verify` | The single verification entrypoint. |

`pnpm verify` runs, in order, and returns the first non-zero exit: boundary check, `tsc -b`, Biome, license check, `pnpm audit --audit-level=high`, `pnpm test`, `pnpm build`, and a headless preview smoke. The smoke requests `/` from the Vite preview server with Node. HTTP 200 is build evidence, not the graphical launch. No `|| true`. No `continue-on-error` on the verify step.

Document these commands during implementation. Prerequisites are Git, the pinned Node 24, the pinned pnpm, and a current desktop browser. Not prerequisites: Rust, Visual Studio, Xcode, or WebView2.

### CI

GitHub Actions on the existing GitHub remote. One workflow. No second CI system.

Runners, both required, same install and `pnpm verify`:

- `ubuntu-24.04`. Not `ubuntu-latest`. That label moves to Ubuntu 26.04 starting 2026-10-19.
- `windows-2025`. Not `windows-latest`.
- No macOS job in Module 0. Do not use `macos-14`.

`fail-fast: false`.

Triggers: `pull_request`, `push` to `main`, and `workflow_dispatch`. Use `pull_request`, not `pull_request_target`.

Permissions: `contents: read`. No secrets. Actions are pinned to commit SHAs, not floating tags.

Cache the pnpm store from the lockfile. Do not cache `node_modules` across operating systems. Upload the verify log and the test report, retained 30 days. Do not upload an environment dump, certificates, or installers. An upload that uses `if: always()` must not hide a failed verify.

Dependabot opens weekly pull requests for npm and GitHub Actions. It does not merge them.

Branch protection that requires the verify check is an admin setting. Recommend it. Do not enable it as a side effect of adding the workflow.

### Licenses

Do not add a product `LICENSE` that grants rights. Workspace packages stay private.

An `OR` passes only when every disjunct is on the permissive list. An `AND` passes only when every conjunct is on that list. The identifiers are the allow-list in ADR-0007. A copyleft or source-available license needs Product Owner approval of that named dependency. The earlier wording that treated a mixed `OR` as permissive was blocked by SEC-M0-B-008 and is withdrawn.

### Out of Module 0

No Electron, Tauri, Rust, or WebAssembly. No native addon and no second shell.

The shell production build is static files with a relative base. Source and workflows use LF. The only version field is private `0.0.0`. No Changesets, semantic-release, or tag pipeline. No telemetry.

## Deferred

Desktop packaging, signing, and notarization are Deferred. This record does not select a future desktop host.

Also Deferred: installers, stores, stapling, auto-update, Apple or Microsoft credentials, a macOS distribution channel, and a web hosting account. Module 0 does not create those secrets. A macOS runner waits until that work is in scope.

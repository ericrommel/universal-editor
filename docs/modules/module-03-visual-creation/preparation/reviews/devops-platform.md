# Module 3 — DevOps / Platform preparation

**Role:** Senior DevOps / Platform Engineer

**Status:** Preparation for issue #9. This note does not change the pipeline. It does not authorize implementation, select a library, or vendor a font.

**Date:** 2026-10-06

**Scope:** What the current build, CI, license, and dependency controls force on later image and text work.

Architecture sections 11, 16, and 20, and ADR-0005, win if this note disagrees with them. The dependency map wins on which Module 3 package is blocked. This file is not an ADR and not Product Owner approval.

## 1. Status

No workflow, script, lockfile, package manifest, or pnpm config is edited. `.github/workflows/verify.yml` has no path filter, so a docs-only preparation change still runs the full gate on the next pull request. That is expected. It is not a reason to add a job.

`docs/modules/module-00-foundation/evidence/m0-pipeline-baseline.json` starts with `"kind": "observation"`. Those durations are not pass/fail thresholds and are not an image or text budget.

## 2. Gate that later Module 3 work has to keep

ADR-0005 is the gate. The implementation is:

- One workflow, `.github/workflows/verify.yml`. Triggers: `pull_request`, `push` to `main`, and `workflow_dispatch`. Not `pull_request_target`.
- `permissions: contents: read`. No repository secrets. Checkout sets `persist-credentials: false`.
- Runners `ubuntu-24.04` and `windows-2025`, `fail-fast: false`, job timeout 30 minutes. Both jobs run `corepack pnpm install --frozen-lockfile` and then `pnpm verify`.
- Actions are pinned to commit SHAs: checkout `3d3c42e5aac5ba805825da76410c181273ba90b1`, setup-node `820762786026740c76f36085b0efc47a31fe5020`, upload-artifact `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a`. Setup Node reads `.node-version` and sets `package-manager-cache: false`.
- `.github/dependabot.yml` opens weekly npm and GitHub Actions pull requests and does not merge them.
- Node is `24.21.0` in `.node-version` and in root `package.json` `engines`. `packageManager` is `pnpm@12.8.2`. `scripts/verify.mjs` exits if `process.version` is not that Node. `engineStrict` refuses a different Node at install. This note does not change the machine Node or the pin.

`pnpm verify` is `scripts/verify.mjs`. It runs, in order, and returns the first non-zero status: `scripts/check-boundaries.mjs`, `tsc -b`, Biome, `scripts/check-licenses.mjs`, `pnpm audit --audit-level=high`, `pnpm test`, `pnpm build`, `scripts/preview-smoke.mjs`. No `|| true`. The verify step does not use `continue-on-error`.

The smoke is a loopback Node request of the production preview. It is not a graphical launch. `scripts/preview-smoke.mjs` reads every file in the build and fails on a canvas element (`<canvas` followed by whitespace, `>`, or `/`). That match is on built text, including a script, not only `index.html`. The required stylesheet token `--uvcp-canvas` is palette text and is not that element. Adding a canvas is a change to the Module 0 smoke contract, not a DevOps tweak.

Architecture section 20 keeps a later release possible by using one matrix of the same steps. That does not add a macOS runner, a visual-regression job, or a native image toolchain for image and text work. ADR-0005 adds `macos-26` only when a Mac developer is supported or signing starts. Neither is this preparation.

## 3. Rules for a future dependency

Gates only. No decoder, font package, or canvas library is named.

An image decoder, a font package, or a canvas library is a supply-chain change.

1. **License.** `scripts/check-licenses.mjs` reads third-party manifests under `node_modules/.pnpm` and skips workspace packages. `scripts/license-expression.mjs` allows only MIT, MIT-0, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, Zlib, Unlicense, CC0-1.0, and BlueOak-1.0.0. An `OR` passes only when every disjunct is on that list. An `AND` passes only when every conjunct is. `WITH`, a missing license, and a malformed expression fail. Electing the permissive side of an `OR` does not admit copyleft or a source-available license. ADR-0007 requires Product Owner approval of that named dependency. This note does not request it. The script does not review a file dropped into the repository.
2. **Audit.** `pnpm audit --audit-level=high` must pass. ADR-0005 has no standing waiver. A waiver needs an owner and an expiry. Do not add `continue-on-error`.
3. **Install.** CI stays `pnpm install --frozen-lockfile` on the committed lockfile. In `pnpm-workspace.yaml`, `minimumReleaseAge` is 1440 and `blockExoticSubdeps` is true. Do not set either to zero to admit a package. ADR-0007: public registry only, no git dependency, no URL tarball.
4. **Install scripts.** `strictDepBuilds` is true. `allowBuilds` is in `pnpm-workspace.yaml`, not in `apps/shell/package.json`, and names only `esbuild: true`. That `install.js` was read before the entry: it uses the optional platform package pnpm already installed, and its download fallback runs only when that package is missing. Nothing else is pre-approved. A new script stays denied until it is read and a named `allowBuilds` entry is reviewed. No `dangerouslyAllowAllBuilds`.
5. **Native and downloaded binaries.** A native addon, or a package that downloads a binary at install time, is a stronger review than a pure JavaScript parser. The license, audit, lockfile, and script-reading gates still apply. This note does not pick either kind.
6. **Fonts.** Do not vendor a font. A font file is a license constraint. A package would face gate 1; a file in the repo would not be seen by the license script, so it is not a bypass. Architecture section 22 and ADR-0007 forbid a remote font. The smoke requires this production policy, with no font host: `default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`.
7. **Secrets.** CI must not gain a secret, token, or `id-token` permission to fetch stock images or call an external asset service. `contents: read` stays the workflow permission.
8. **Tests.** `pnpm test` stays the Node test runner. No new runner, and no Vitest, Jest, jsdom, Playwright, or Cypress, is added to cover images or text.

`scripts/check-boundaries.mjs` still fails verify if an import leaves the architecture table. Section 10 requires a new ADR before `editor` may call the renderer. That is a boundary change, not a CI change.

## 4. Blocked on Module 1 or Module 2, versus what can be stated now

Stated now, because the controls already exist:

- Later image and text work keeps this verify gate, both runners, and the secret-free workflow.
- A dependency is judged by the license allow-list, a high audit, the frozen lockfile, release age, the exotic-subdependency block, and a reading of any install script before `allowBuilds` grows.
- A canvas element in the production build fails the current smoke.
- A remote font or an external asset fetch is outside the current shell and CI trust boundary.
- The Module 0 baseline timings are observations, not a decode or layout budget.

Not introduced here. The dependency map keeps these closed until the predecessor exists:

- **A real asset in the repo.** Module 0 has no icon, logo, or bundled font. This preparation does not add a sample image, a fixture raster, or a font. Image bytes wait on an approved container (map M3-DEP-M1-02, issue #7). CI does not download one.
- **A viewport build.** The shell has no viewport and no canvas (ADR-0008). A draw path waits on issue #8 and on an ADR that amends the import table (map M3-DEP-M2-02). Building one is not a workflow edit. Scene correctness stays a CPU check of snapshot data (architecture section 15), not a GPU image.
- **A headed browser in CI.** Architecture sections 14 and 15, and ADR-0005, keep the graphical launch manual. Playwright was rejected because it downloads a browser and would not launch a future desktop shell. A headed job is not added while issue #8 has no viewport on the gate.

## 5. Non-goals

- Editing `.github/workflows/verify.yml`, `scripts/verify.mjs`, `scripts/check-licenses.mjs`, `pnpm-workspace.yaml`, root `package.json`, or `.node-version`.
- Growing `allowBuilds`, or choosing an image decoder, a font, or a canvas library.
- A visual-regression job, a baseline PNG, a macOS runner, a native image toolchain, or a new test runner.
- Secrets or network calls for stock images or an external asset service.
- Treating `m0-pipeline-baseline.json` as a threshold.
- Moving issue #9, or authorizing Module 3 implementation.

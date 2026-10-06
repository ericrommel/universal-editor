# Module 4 verification environment

**Status:** Preparation input for issue #72. Not a pipeline change. Not a specification. Implementation is not authorized.
**Role:** Senior DevOps / Platform Engineer
**Date:** 2026-10-06

This preparation does not add a job, a runner, a dependency, or Playwright. It does not run `node scripts/verify.mjs` and records no pass or fail. `.github/workflows/verify.yml` is unchanged because this preparation does not edit it.

Archive section 9.5 is context only. Its identifiers are not operational requirements. This note does not add a stroke, a curve, a scene kind, a viewport, a tool, an undo API, or an ADR.

Issue #72 records the predecessor state this environment has to respect. Module 1 is approved for implementation and is not GREEN. Pull request #50 is that contract; it is open and not merged. Module 2 preparation on main does not approve a viewport or an undo API. Module 3 preparation does not approve a creation tool. Module 4 stays in preparation.

## 1. Existing gate

A later implementation still uses this gate. This preparation does not replace it and does not add a second one.

`package.json` pins Node `24.21.0` in `engines.node` and pnpm `12.8.2` in `packageManager`. `.node-version` is `24.21.0`. `pnpm-workspace.yaml` sets `engineStrict: true`, so install refuses a different Node. `scripts/verify.mjs` exits unless `process.version` is that pin. This note does not change either pin.

`node scripts/verify.mjs` then runs, in order, and returns the first non-zero status:

1. boundary check (`scripts/check-boundaries.mjs`)
2. `tsc -b`
3. Biome (`biome check .`)
4. license check (`scripts/check-licenses.mjs`)
5. `pnpm audit --audit-level=high`
6. `pnpm test`
7. `pnpm build`
8. loopback preview smoke (`scripts/preview-smoke.mjs`)

There is no `|| true`. The smoke is a Node request of the production preview on loopback. It is build evidence. It is not a graphical launch. The check reads every file in the production build and fails if one contains a canvas element. The stylesheet token `--uvcp-canvas` is palette text and is not that element. This preparation does not add a canvas and does not relax that check.

## 2. Workflow file

`.github/workflows/verify.yml` is not edited. It is unchanged because this preparation does not edit it.

The file on this branch already runs `node scripts/verify.mjs` on `ubuntu-24.04` and `windows-2025` (`fail-fast: false`, 30-minute hang guardrail). Triggers are `pull_request`, `push` to `main`, and `workflow_dispatch`. There is no path filter, so a documentation-only pull request still runs both jobs. Permissions are `contents: read`. Checkout sets `persist-credentials: false`. Actions are pinned to commit SHAs. Install is `corepack pnpm install --frozen-lockfile`, using `.node-version`, with `package-manager-cache: false`. The job has no repository secrets. The Linux job is a headless coupling check, not a desktop session, and not evidence that a stroke was drawn.

No second workflow is added. Tests from a later authorized module still enter through `scripts/verify.mjs`. They do not need another job.

## 3. Headed evidence

Headed evidence, if a later module needs it, stays a recorded session and is not added now.

The only session this repository already has is the Module 0 launch, outside CI: `docs/modules/module-00-foundation/evidence/launch/README.md`. The host was 64-bit Windows on x64. The command was `corepack pnpm dev`, which served `http://127.0.0.1:5173/`. The browser was headed Microsoft Edge, a temporary profile, extensions disabled, and no headless flag. Architecture section 14 is the same manual step. One of current Edge or current Chrome is enough, and the record names which one ran. That is not a browser matrix. The preview smoke is not that launch.

This preparation does not record a new session. There is no viewport on main, and Module 2 preparation does not approve one. A browser started by Actions, including under xvfb, would not be that record. CI does not open a graphical window.

## 4. Playwright

Playwright is not added.

Architecture section 14 and ADR-0005 deferred it. It downloads a browser, and a Chromium smoke is not evidence of a desktop webview. Both reasons still apply. That download would also be a dependency this preparation does not take, and it would not be the recorded session in section 3. Cypress stays deferred for the same reason. No Vitest, Jest, jsdom, or happy-dom is added.

## 5. What does not enter

None of the following enter for this preparation:

- A new job. That includes a visual-regression job, a benchmark job, and a GPU job. Architecture section 15 keeps scene correctness a CPU check of the snapshot even when a later module draws. A GPU image is not an oracle. ADR-0005 stores timings as observations, not thresholds. The archived reference multi-stroke scene is not an operational requirement and does not get a fixture pipeline here.
- A new runner. The matrix stays `ubuntu-24.04` and `windows-2025`. No macOS runner. ADR-0005 adds `macos-26` only when a Mac developer is supported or signing starts. Neither is this preparation. GPU runners stay deferred.
- A dependency. No graphics library, no canvas library, no browser driver, and no package script. A later dependency, if an authorized change needs one, still passes the license allow-list and `pnpm audit --audit-level=high` on this same gate. This note does not request a copyleft exception.
- Playwright. Section 4 records that.
- Extra secrets. ADR-0007 requires secret-free jobs, no printed environment, and no secrets on fork pull requests. Signing secrets do not belong on this workflow.
- `pull_request_target`. ADR-0005 and architecture section 16 require `pull_request`.
- `contents: write`, `id-token: write`, or any permission beyond `contents: read`.

## 6. Open questions

Left open. None of them is a reason to change the pipeline now.

1. Whether a later authorized module needs a headed record of a stroke on screen. If it does, that record is a session outside CI. It is not added now, and it is not a job.
2. The reference-workload bullet in the Definition of Ready is unmet for this module. No stroke count, point count, tolerance, or frame time is chosen here. An observation is not a pass or a fail, and it does not need a new job.

## Boundary

This file does not edit `.github/`, `scripts/verify.mjs`, dependencies, tests, or application code. It does not approve the module and does not authorize implementation.

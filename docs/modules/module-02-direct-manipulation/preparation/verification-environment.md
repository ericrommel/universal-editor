# Module 2 verification environment

**Status:** Preparation input for issue #39. Not a workflow change. Not Product Owner approval.
**Role:** Senior DevOps / Platform Engineer
**Date:** 2026-10-06

No. Module 2 preparation does not change the workflow. The secret-free verify gate already runs on every pull request, including a docs-only change, and this preparation needs no other runner, permission, secret, or job.

## 1. Workflow change

**No.**

`.github/workflows/verify.yml` runs `node scripts/verify.mjs` on `ubuntu-24.04` and `windows-2025` (`fail-fast: false`, 30-minute hang guardrail). Triggers are `pull_request`, `push` to `main`, and `workflow_dispatch`. There is no path filter, so a documentation-only pull request still runs both jobs. Permissions are `contents: read`. Checkout sets `persist-credentials: false`. Actions are pinned to commit SHAs. Install is `corepack pnpm install --frozen-lockfile`, using `.node-version`, with `package-manager-cache: false`. The job has no repository secrets.

`scripts/verify.mjs` requires the pinned Node version, then runs the boundary check, `tsc -b`, Biome, the license allow-list, `pnpm audit --audit-level=high`, headless tests, the production build, and the loopback preview smoke. ADR-0005 treats that smoke as proof the shell builds and serves. CI does not open a graphical window and does not use xvfb to claim that it did. The `ubuntu-24.04` job is a headless coupling check, not a desktop session.

Preparation leaves that command, those runners, and those permissions in place. Headless tests added later still enter through `scripts/verify.mjs`. They do not need a second workflow.

## 2. Headed pointer evidence

Keep the Module 0 pattern: a headed session on the primary development environment, outside CI.

Module 0 recorded that session in `docs/modules/module-00-foundation/evidence/launch/README.md`. The host was 64-bit Windows on x64. The command was `corepack pnpm dev`, which served `http://127.0.0.1:5173/`. The browser was headed Microsoft Edge, a temporary profile, extensions disabled, and no headless flag. The Node preview smoke is not that launch. Architecture section 14 is the same manual step. One of current Edge or current Chrome is enough; the record names which one ran. That is not a browser matrix.

Module 2 can keep the pattern. The shell in this repository is still that browser on the developer machine. There is no desktop webview to launch, and the hosted runners are not the primary environment. The headed record is where the pointer and on-screen feedback are visible. The headless suite is where deterministic results belong, including transform values and interaction state that must end on completion or cancellation. A browser started by Actions, including under xvfb, would not be that record.

## 3. Playwright

Keep Playwright deferred.

Architecture section 14 and ADR-0005 deferred it because it downloads a browser, and a Chromium smoke is not evidence of a desktop webview. The manual launch plus the headless tests covered Module 0. Both reasons still apply.

No Module 2 acceptance check needs a browser driver. Results the headless suite can assert, plus what a recorded headed session can show, cover the pointer behavior this preparation can name. The archived text at `docs/archive/product-engineering-specification-v1.0.md` section 9.3 is context, not an authorized specification. Its selection, move, rotate, scale, undo and redo, cancellation, and reopened-transform checks fit that split. Its responsiveness check is issue #41, not a Playwright job. A downloaded Chromium run would be neither the headed Edge record nor a future desktop webview, and it would add a browser download the frozen install does not have. Cypress stays deferred for the same reason.

## 4. What does not enter

None of the following enter for this preparation:

- GPU runners. The architecture defers them. When a module draws, scene correctness stays a CPU check of the snapshot, not a GPU image gate.
- Extra secrets. ADR-0007 requires secret-free jobs, no printed environment, and no secrets on fork pull requests. Signing secrets do not belong on this workflow.
- `pull_request_target`. ADR-0005 and architecture section 16 require `pull_request`.
- `contents: write`, `id-token: write`, or any permission beyond `contents: read`.
- A benchmark job. ADR-0005 stores timings as observations, not thresholds.

A different answer needs a concrete Module 2 need. This preparation does not have one.

## 5. Reference workload

Issue #41 owns the reference workload and is blocked. Do not add a job, a fixture pipeline, or a threshold for it here. Responsiveness under that workload is not shown by a new runner. The existing verify gate remains the regression check for the current headless suite.

## Boundary

This file does not edit `.github/`, dependencies, or application code. It does not approve the module and does not authorize implementation.

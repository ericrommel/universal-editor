# Module 1 preparation — verify workflow

**Update 2026-10-06.** Module 0 is GREEN. The observation below is unchanged. The reconciled specification does not edit `.github/workflows/verify.yml`.

**Role:** Functional Quality Engineer

**Status:** Preparation note for issue #7. This is not a DevOps sign-off and not implementation authorization.

**Date:** 2026-10-06

## Observation

The proposed Module 1 contract does not change the engineering gate.

`.github/workflows/verify.yml` already runs on pull requests, on a push to `main`, and by `workflow_dispatch`. The job matrix is `ubuntu-24.04` and `windows-2025`, with `fail-fast: false`. Node comes from `.node-version`, which is `24.21.0`. Install is `pnpm install --frozen-lockfile`. The verify step is `node scripts/verify.mjs`.

`pnpm test` is `node scripts/run-tests.mjs`. That script discovers `*.test.ts` and `*.test.mjs`. A later scene test needs a file name that matches. It does not need a new script entry or a new workflow job.

The preview smoke line stays `preview smoke: HTTP 200 http://127.0.0.1:5173/`. Log durations are not pass/fail thresholds.

No runner, cache, permission, or install step is added by this preparation. A workflow change would need its own DevOps review. This note does not propose one.

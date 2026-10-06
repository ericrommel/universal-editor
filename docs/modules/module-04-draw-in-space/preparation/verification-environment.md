# Module 4 verification environment

**Status:** Preparation input for issue #10. Not a workflow change. Not implementation authorization.
**Role:** Senior DevOps / Platform Engineer
**Date:** 2026-10-06

No local `pnpm verify` and no GitHub Actions run is claimed for this note. None has been run for this branch yet.

## Gate

`pnpm verify` (`node scripts/verify.mjs`) stays the gate. `package.json` already pins Node `24.21.0` (`engines.node`) and pnpm `12.8.2` (`packageManager`). This note does not propose a new version. `scripts/verify.mjs` requires that pinned Node, then runs, in order:

1. boundaries (`scripts/check-boundaries.mjs`)
2. `tsc -b`
3. Biome (`biome check .`)
4. license check (`scripts/check-licenses.mjs`)
5. `pnpm audit --audit-level=high`
6. `pnpm test`
7. `pnpm build`
8. loopback preview smoke (`scripts/preview-smoke.mjs`)

## CI

`.github/workflows/verify.yml` runs that command on `ubuntu-24.04` and `windows-2025`. Permissions are `contents: read`. Triggers are `pull_request`, `push` to `main`, and `workflow_dispatch`. There is no path filter. A docs-only change still runs the full gate.

## What this preparation does not add

This preparation adds no dependency, no workflow, no Playwright, no canvas, and no package script.

## Boundary

This file does not edit `.github/`, dependencies, workflows, or application code. It does not authorize implementation.

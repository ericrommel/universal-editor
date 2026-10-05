# Module 0 reproducibility note

This note records the environment facts TP-M0-NF-001 asks for. The timings stay in `m0-pipeline-baseline.json`. They are observations, not thresholds. This note is not module acceptance.

## Primary machine

Recorded 2026-10-05 on the machine used for the headed launch and for local verify:

- Edition: Microsoft Windows 11 Pro
- Version: 10.0.26200
- Build: 26200
- Architecture: 64-bit
- Display scale: `AppliedDPI` 120, which is 125%
- Node.js: v24.21.0, matching `.node-version`
- pnpm: 12.8.2, from `packageManager` through Corepack

The cold-store observation in `m0-pipeline-baseline.json` names the host as `windows` and does not store the edition. That file is unchanged. Its commands are the documented install and `node scripts/verify.mjs`, both exit 0, with an empty store. No undocumented project edit is recorded for that run, and none was required for the 2026-10-05 verify on the pins above.

## Display server

`pnpm test` is an explicit `node --test` list. It does not start Vite and it does not open a window. Local verify on this Windows machine exited 0 while a display was available. The Ubuntu job does not install xvfb. Verify run [37235385386](https://github.com/ericrommel/universal-editor/actions/runs/37235385386) succeeded on `ubuntu-24.04` and `windows-2025` for commit `3cfa957`. That Ubuntu pass is not a pass under xvfb.

## Launch

The headed launch is `launch/README.md`. The browser was Microsoft Edge 154.0.4258.53. The preview smoke is a separate Node HTTP check and is not that launch.

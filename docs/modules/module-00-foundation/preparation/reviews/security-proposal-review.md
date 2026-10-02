# Module 0 — Security Review of the Architecture Proposal

**Role:** Senior Application Security Engineer
**Status:** Proposal review, 2026-10-02. Not module approval. Not closure of M0-AC-011. Not a Product Owner decision.
**Scope:** Whether `docs/engineering/architecture.md` and ADR-0004, ADR-0005, and ADR-0007 resolve SEC-M0-B-001 through SEC-M0-B-007 for architecture preparation.

This review does not edit the architecture, the ADRs, the requirements, or the acceptance criteria. No application code is authorized by it.

SEC-M0-B-001 through SEC-M0-B-007 are resolved for architecture preparation by the dispositions below. SEC-M0-B-008 blocked the proposal as first written. That block remains in this file. ADR-0007's license section was read after the amendment. It says the required rule, so this role concurs with the amended rule. That is not a new full concurrence with the architecture, not an implementation review, and not Product Owner approval.

## Documents

Read for the review, with ADR-0007's license section read again after the amendment: `docs/engineering/architecture.md`; ADR-0004; ADR-0005; ADR-0007; the failure switch in ADR-0008; the entry-name rule in ADR-0006; `application-security.md`; specification M0-NFR-009 and M0-AC-011; `development-process.md`, Definition of Ready.

ADR-0007's statement that the findings are closed is the Tech Lead's claim. The dispositions below are the security conclusion.

## Not executed

No shell, exploit, install, or audit was run. The installer was not run. On 2026-10-02 the advisory text and pnpm issue 15276 were read and were not reproduced in this repository. GHSA-q6j5-fjx5-2mc3 affected ranges are pnpm below 10.34.1 and `>= 11.0.0, < 11.4.0`. The CVE text names 10.34.0; this review uses the stricter GitHub pair, 10.34.1 and 11.4.0. pnpm 12.0.0 was published on 2026-08-26, after that fix. On pnpm 12.5.1, issue 15276 shows that `pnpm ci --ignore-scripts` still runs a project `install` script when a `clean` script exists, and that `pnpm install --frozen-lockfile --ignore-scripts` does not. pnpm 11 and 12 default `minimumReleaseAge` to 1440 minutes, `blockExoticSubdeps` to true, and `strictDepBuilds` to true.

## What closed SEC-M0-B-001 through SEC-M0-B-007

**SEC-M0-B-001.** Resolved for architecture preparation. The only Module 0 shell is loopback Vite on `127.0.0.1`, built as static assets with a relative base. No Electron, no Tauri, no `wgpu`, no system webview, and no native window (ADR-0004). Architecture section 22 and ADR-0007 require a dev server bound to `127.0.0.1`, a secure context on loopback, no `file://` and no LAN bind, no remote script, font, stylesheet, or frame, no service worker, the production content security policy `default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`, Vite HMR limited to a same-origin WebSocket in development only, no companion process, and no GPU request.

**SEC-M0-B-002.** Resolved for architecture preparation. Unhardened Electron is not proposed, and neither Electron nor Tauri is added in Module 0. Preconditions if a later module proposes either host are revisitable direction in the threat model. That is not a decision to use either host.

**SEC-M0-B-003.** Resolved for architecture preparation. Filesystem, shell-execute, and application network capabilities are not granted. There is no companion process, no preload, and no Tauri capability. `platform` has no filesystem or network API. Core does not import the shell, React, or filesystem APIs. The dev server is toolchain loopback, not a shell entitlement. A later plugin can be added only when that module's requirements need it and the grant is reviewed. That sentence is not a Module 0 grant.

**SEC-M0-B-004.** Resolved for architecture preparation. CI is secret-free. One workflow, on `pull_request`, `push` to `main`, and `workflow_dispatch`. No `pull_request_target`. `permissions: contents: read` only. Do not grant `write` or `id-token` on this workflow for later. Actions are pinned to commit SHAs. No repository secrets, organization secrets, personal tokens, npm token, signing certificate, or notarization password. No macOS runner and no Apple secret. Fork pull requests must not receive secrets. Artifacts are the verify log and the test report, not an environment dump, an npmrc, a keychain, or a runner environment file. The workflow must not print the environment or the `secrets` context. Signing secrets, when they exist, stay in a protected release workflow on reviewed tags. Short-lived federation is preferred. A secret that reaches a log is treated as compromised.

**SEC-M0-B-005.** Resolved for architecture preparation by a locked install. Commit `pnpm-lock.yaml`. CI uses `pnpm install --frozen-lockfile`, not `pnpm ci`, until issue 15276 is confirmed fixed for the pin. Pin pnpm 12.8.1 or a later 12.x patch that still fails closed when `integrity` is omitted. The affected ranges do not include 12.x. `allowBuilds` stays empty until a named package's script is read. `esbuild` is not pre-approved. `dangerouslyAllowAllBuilds` is forbidden. Do not set `strictDepBuilds` to false. Public npm registry only. No git dependencies and no URL tarballs, because the integrity fix still exempts git-hosted and `file:` tarballs. `blockExoticSubdeps` stays on. `minimumReleaseAge` stays at 1440 minutes. `pnpm audit --audit-level=high` is the one failing gate. OSV-Scanner remains the alternative if the registry check becomes the problem. Revisit the scanner if Rust enters. Do not fail the same job twice. The audit contacts the registry. A waiver needs an owner and an expiry. There is no standing `continue-on-error`. The audit was not run.

**SEC-M0-B-006.** Resolved for architecture preparation by closed diagnostic fields: `event`, `shell` (`browser`), `version`, `step`, and on failure an application error code and message. Events are `startup.beginning`, `startup.ready`, and `startup.failed`. No environment dump, tokens, file contents, WebGPU adapter or limits, or telemetry. Do not log the raw `UVCP_FORCE_INIT_FAILURE` value. The headless script writes those lines to stderr. The variable is confined to `pnpm dev`. Unset or `0` starts normally. `1` fails step `forced-initialization-failure` after the diagnostic sink exists and before ready. Any other value fails as an invalid value, not as success. Tests and the headless script inject a throwing initializer and do not read the variable. The production bundle does not contain the switch. It is not a screen control. The dev server is loopback, so the variable is not an HTTP parameter.

**SEC-M0-B-007.** Resolved for architecture preparation. There is no native GPU fallback. Module 0 does not request a GPU. The renderer is null. There is no WebGPU context, shader, `wgpu`, or Dawn. A later `wgpu` path is not a silent fallback for a missing `navigator.gpu`. It requires a Product Owner decision and a new security review, and it must not put the GPU device in an unsandboxed host without an explicit boundary. None of that is implemented now.

## SEC-M0-B-008

**Historical block, 2026-10-02.** The proposal accepted a dual license when at least one side was permissive, and the worked example treated `MIT OR GPL-3.0-only` as MIT. The same wording also admits AGPL, LGPL, SSPL, and BUSL, including `MIT OR AGPL-3.0-only`, `Apache-2.0 OR SSPL-1.0`, `ISC OR BUSL-1.1`, and `MIT OR LGPL-2.1-only`. The test was "at least one side," not "every side." The `AND` shape was already right. The `OR` shape was not. Electing the permissive side is not a substitute for Product Owner approval of a named copyleft dependency. Authorizing the example would have made that exception standing for the license check. Unknown, missing, and `NOASSERTION` were already rejected. `BlueOak-1.0.0` is permissive and was not this finding. This review granted no copyleft exception.

**Required change.** An `OR` passes only when every disjunct is on the permissive list: MIT, MIT-0, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, Zlib, Unlicense, CC0-1.0, BlueOak-1.0.0. An `AND` passes only when every conjunct is on that list. `MIT OR Apache-2.0` passes. `MIT OR GPL-3.0-only` does not. Unknown, missing, or `NOASSERTION` is not added. Any copyleft or source-available identifier still needs Product Owner approval of that named dependency.

**Amendment.** ADR-0007's license section now says that rule, including that electing the permissive side is not a substitute for Product Owner approval of the named dependency. The amendment matches the required change. This role concurs with the amended rule. The block above stays as the historical record. The finding is closed for architecture preparation by that match. It is not closed for M0-AC-011. It reopens if the license check accepts an expression the amended rule rejects. This is not a new full concurrence with the architecture.

## Notes that stay in force

Adopted into the architecture: do not log the raw `UVCP_FORCE_INIT_FAILURE` value; no root `install` lifecycle script; install the pinned pnpm with Corepack, not an unpinned `curl` script.

Not waived: send the production content security policy on `vite preview` and bind preview to `127.0.0.1`; do not add `unsafe-inline` or `unsafe-eval`; do not document `file://`. Reading the `esbuild` script is the review. Do not set `strictDepBuilds` to false, `minimumReleaseAge` to `0`, or commit `minimumReleaseAgeExclude` without a reviewed reason. ADR-0006 accepts the Unicode case-fold gap only because Module 0 extracts nothing. It remains a review item before the first archive reader.

If a later module proposes Electron or Tauri, start from the precondition list in the threat model. ADR-0007's later-host section does not waive a null-`senderFrame` check, the `file://` ban, the bans on `allowRunningInsecureContent`, experimental features, `enableBlinkFeatures`, and `ELECTRON_DISABLE_SECURITY_WARNINGS`, a non-elevated Tauri host, or the ban on `std::process` and user-directory I/O in Rust. Revisitable direction, not a decision to use either host.

SEC-M0-N-001 through SEC-M0-N-006 stay non-blocking. SEC-M0-N-002 is no longer an open `OR` question. The hole was SEC-M0-B-008. The amended rule is the disposition.

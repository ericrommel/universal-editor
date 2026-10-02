# Module 0 — Security Review of the Architecture Proposal

**Role:** Senior Application Security Engineer
**Status:** Proposal review, 2026-10-02. Not module approval. Not closure of M0-AC-011. Not a Product Owner decision.
**Scope:** Whether `docs/engineering/architecture.md` and ADR-0004, ADR-0005, and ADR-0007 resolve SEC-M0-B-001 through SEC-M0-B-007 for architecture preparation.

This review does not edit the architecture, the ADRs, the requirements, or the acceptance criteria. No application code is authorized by it. The Product Owner still has to authorize implementation. Security does not approve the module.

## Documents read

- `docs/engineering/architecture.md`
- `docs/engineering/adr/0004-module-0-web-shell-and-desktop-direction.md`
- `docs/engineering/adr/0005-workspace-build-and-verification.md`
- `docs/engineering/adr/0007-module-0-trust-boundaries.md`
- `docs/engineering/adr/0006-domain-persistence-and-undo-direction.md` and `docs/engineering/adr/0008-editor-state-and-shell-content.md`, for the failure switch and entry-name rules the proposal actually introduces
- `docs/modules/module-00-foundation/preparation/reviews/application-security.md`, findings SEC-M0-B-001 through SEC-M0-B-007 and the Module 0 controls those findings point at
- `docs/modules/module-00-foundation/specification.md`, M0-NFR-009 and M0-AC-011
- `docs/engineering/development-process.md`, Definition of Ready

ADR-0007 says those seven findings are already closed. That sentence is the Tech Lead's claim. The dispositions below are the security conclusion.

External checks on 2026-10-02, not executed in this repo: [GHSA-q6j5-fjx5-2mc3](https://github.com/advisories/GHSA-q6j5-fjx5-2mc3) affected ranges are pnpm below 10.34.1 and `>= 11.0.0, < 11.4.0`. pnpm 12.0.0 was published on 2026-08-26, after that fix. [pnpm issue 15276](https://github.com/pnpm/pnpm/issues/15276) shows `pnpm ci --ignore-scripts` on 12.5.1 still runs a project `install` script when a `clean` script exists, and `pnpm install --frozen-lockfile --ignore-scripts` does not. pnpm 11 and 12 default `minimumReleaseAge` to 1440 minutes, `blockExoticSubdeps` to true, and `strictDepBuilds` to true. The installer was not run.

## SEC-M0-B-001 — Resolved for architecture preparation

The proposal names one shell and copies its conditions into the decision.

Module 0's only shell is a Vite application on `127.0.0.1`, built as static assets with a relative base. Electron, Tauri, `wgpu`, a system webview, and a native window are not added (ADR-0004). Architecture section 22 and ADR-0007 require all of the following:

- dev server bound to `127.0.0.1`, not all interfaces
- secure context on loopback
- no `file://` shell and no LAN bind
- no remote script, font, or frame, and no stylesheet from another origin (ADR-0007)
- no service worker
- production content security policy `default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`
- Vite HMR limited to a same-origin WebSocket, development only, and not part of the production policy
- no companion process
- no native GPU stack, and no GPU request in Module 0

ADR-0007 records the later Electron and Tauri conditions so this shell's lack of entitlements is not permission to wrap the same page in an unrestricted host. That was the missing disposition. No gap remains that blocks preparation.

## SEC-M0-B-002 — Resolved for architecture preparation

Unhardened Electron is not proposed. ADR-0007 rejects it and does not implement Electron or Tauri.

The recorded Electron preconditions cover the switches that make a renderer into a host: `contextIsolation: true`, Node integration off including worker and subframe variants, `sandbox: true`, `webSecurity` left on, `app.enableSandbox()` before ready, no `--no-sandbox`, no remote content, no generic `ipcRenderer` bridge, prefer no preload, deny every permission and every new window, cancel navigation off the shell origin, do not call `shell.openExternal`, embedded checksums, no unreviewed `ELECTRON_MIRROR`, `ELECTRON_CUSTOM_VERSION`, or `electron_use_remote_checksums`, the fuse end state (`runAsNode`, `nodeOptions`, `nodeCliInspect`, and `grantFileProtocolExtraPrivileges` disabled; `onlyLoadAppFromAsar` and `embeddedAsarIntegrityValidation` enabled; `cookieEncryption` not flipped until macOS signing), and a named owner and cadence before that later module. ADR-0004 says a desktop window in Module 0 would reopen ADR-0007. The architecture also requires a new security review before a desktop viewport host is chosen. These conditions are recorded and are not Module 0 work.

## SEC-M0-B-003 — Resolved for architecture preparation

Filesystem, shell-execute, and application network capabilities are not granted. There is no companion process, no preload, and no Tauri capability. `platform` has no capability and no filesystem or network API. Core does not import the shell, React, or filesystem APIs. The dev server is toolchain loopback, not a shell entitlement.

The later-module sentence that a shell, filesystem, HTTP, opener, or dialog plugin can be added only when that module's requirements need it and the grant is reviewed is not a Module 0 grant. No command list is implemented because there is no host. No gap remains for this module.

## SEC-M0-B-004 — Resolved for architecture preparation

Module 0 CI is secret-free. One GitHub Actions workflow, on `pull_request`, `push` to `main`, and `workflow_dispatch`. `pull_request_target` is forbidden. `permissions: contents: read` only. Actions are pinned to commit SHAs. No repository secrets, organization secrets, personal tokens, npm token, signing certificate, or notarization password. No macOS runner and no Apple secret. Fork pull requests must not receive secrets. Artifacts are the verify log and the test report, not an environment dump. The workflow must not print the environment.

Signing secrets, when they exist, stay in a protected release workflow on reviewed tags, never in this workflow and never on pull requests. Short-lived federation is preferred. A secret that reaches a log is treated as compromised. That is the accepted later path. No gap remains.

## SEC-M0-B-005 — Resolved for architecture preparation

The install is locked and dependency scripts are denied by default.

- Commit `pnpm-lock.yaml`. CI uses `pnpm install --frozen-lockfile`, not `pnpm ci`, until issue 15276 is confirmed fixed for the pin. That avoidance matches the issue: `pnpm ci --ignore-scripts` is not a reliable script gate on pnpm 12.
- Pin pnpm 12.8.1 or a later 12.x patch in `packageManager`. The pin must still fail closed when a remote lockfile resolution omits `integrity` (CVE-2026-50021 / GHSA-q6j5-fjx5-2mc3). Affected ranges are below 10.34.1 and `>= 11.0.0, < 11.4.0`. They do not include 12.x. pnpm 12.0.0 shipped on 2026-08-26, after the fix. Refusing an older 10.x or 11.x line does not reintroduce the vulnerable ranges. The "still contains the fix" sentence is required on implementation day because a later 12.x patch is allowed. This was not executed here.
- `allowBuilds` stays empty until a named package is reviewed. `esbuild` is not pre-approved; it is allowed only if Vite's install fails without it. `dangerouslyAllowAllBuilds` is forbidden. pnpm 12 defaults `strictDepBuilds` to true and has removed the old empty `neverBuiltDependencies` allow-all switch.
- Public npm registry only. No git dependencies and no URL tarballs. `blockExoticSubdeps` stays at its default on. That matters because the integrity fix still exempts git-hosted and `file:` tarballs. `minimumReleaseAge` stays at the pnpm 12 default of 1440 minutes.

`pnpm audit --audit-level=high` is accepted. The preparation review recommended OSV-Scanner and allowed `pnpm audit` at high severity and above for a JavaScript-only repository, with only one of them as a failing gate. Module 0 adds no Rust. ADR-0007 keeps OSV-Scanner as the alternative if the registry check becomes the problem, and it says to revisit the scanner if Rust enters. Do not fail the same job twice for the same advisories. The audit contacts the registry; it is not an offline control. A waiver needs an owner and an expiry. There is no standing `continue-on-error`.

No blocking gap remains on the pin, the frozen install, the script gate, or the scanner choice.

## SEC-M0-B-006 — Resolved for architecture preparation

Diagnostics are a closed field list: `event`, `shell` (`browser`), `version`, `step`, and on failure an application error code and message. Events are `startup.beginning`, `startup.ready`, and `startup.failed`. No environment dump, tokens, file contents, WebGPU adapter or limits, or telemetry. The headless script writes those lines to stderr. That satisfies the finding.

`UVCP_FORCE_INIT_FAILURE` is confined to `pnpm dev`. Unset or `0` starts normally. `1` fails step `forced-initialization-failure` after the diagnostic sink exists and before ready. Any other value fails as an invalid value, not as success. Tests and the headless composition script inject a throwing initializer and do not read the variable. The production static build does not read it, and architecture section 17 says it is not compiled into the production bundle. ADR-0008 rejects shipping the switch. It is not a control on the screen. The dev server is loopback, so the variable is not an HTTP parameter. No gap remains.

## SEC-M0-B-007 — Resolved for architecture preparation

Module 0 does not request a GPU and does not implement a native fallback. The renderer is a null renderer. There is no WebGPU context, shader, `wgpu`, or Dawn. ADR-0004 forbids a native GPU library in this module.

The later `wgpu` alternative is not a silent fallback for a missing `navigator.gpu`. It requires a Product Owner decision and a new security review, and it must not put the GPU device in an unsandboxed host without an explicit boundary. The later Electron path uses WebGL2 inside that Chromium when an adapter is missing, and it forbids unsafe WebGPU flags as a product fix. Tauri's future section forbids a native GPU library in the Rust host as a WebGPU fallback. None of that is implemented now. No gap remains for Module 0.

## New blocking finding

**SEC-M0-B-008 — An OR with one permissive license admits copyleft without Product Owner approval.**

ADR-0007's allow-list accepts a dual license when at least one side is permissive, and the worked example is `MIT OR GPL-3.0-only` used under MIT. The same list then says GPL, AGPL, LGPL, MPL, BUSL, SSPL, and any other copyleft or source-available license require Product Owner approval before the dependency is added. The ADR's confirmation says the recommendation is no copyleft unless the Product Owner changes it, and that authorizing Module 0 authorizes these controls. The architecture's Product Owner list says any copyleft dependency defaults to refuse and is not required to start Module 0.

Those rules do not describe one gate. The example is the rule a license script will encode. `MIT OR GPL-3.0-only` passes. So do `MIT OR AGPL-3.0-only`, `Apache-2.0 OR SSPL-1.0`, `ISC OR BUSL-1.1`, and `MIT OR LGPL-2.1-only`, because the test is "at least one side," not "every side." The `AND` rule is the right shape. The `OR` rule is not.

The preparation control allowed dual licensing only among the permissive list (`MIT OR Apache-2.0`). It did not allow a copyleft alternative to skip the Product Owner. Electing MIT from an SPDX `OR` is a real license mechanic. It is still a copyleft decision, and it is wider than GPL: AGPL and SSPL were called out because a later distribution or network service must not inherit them from a Module 0 allow-list. Authorizing the proposal as written would make that exception standing. WP-0's license check would then enforce it. That is an unresolved baseline control for M0-NFR-009, so architecture preparation is not clear to start.

`BlueOak-1.0.0` is permissive. Adding it to the allow-list is not this finding. Unknown, missing, and `NOASSERTION` stay rejected. Pure copyleft stays a Product Owner decision. This review does not grant any copyleft exception.

Required before this finding closes: an `OR` passes only when every disjunct is on the permissive list. `MIT OR Apache-2.0` passes. `MIT OR GPL-3.0-only` does not, and neither does any expression that includes GPL, AGPL, LGPL, MPL, BUSL, SSPL, or another copyleft or source-available license, until the Product Owner approves that named dependency. Remove the example that treats `MIT OR GPL-3.0-only` as MIT. Do not leave the acceptance in place for the Product Owner to swallow by authorizing the ADR as a bundle.

## Non-blocking notes

- Send the production content security policy on `vite preview` as well as the built assets. Bind preview to `127.0.0.1`. Do not add `unsafe-inline` or `unsafe-eval` for HMR. Do not document `file://` as a way to open the shell.
- ADR-0007's later Electron list omits the web-only CSP, `senderFrame` checks that reject a null frame and do not trust the frame URL, an explicit ban on `file://`, and bans on `allowRunningInsecureContent`, experimental features, `enableBlinkFeatures`, and `ELECTRON_DISABLE_SECURITY_WARNINGS`. The Tauri list omits "host not elevated" and "no `std::process` or user-directory I/O in Rust." Those are not waived. The later viewport review has to apply them. They are not Module 0 implementation.
- Do not write the raw `UVCP_FORCE_INIT_FAILURE` value into the diagnostic message. Do not add a root `install` script. Install the pinned pnpm with Corepack or another version-pinned installer, not an unpinned `curl` script.
- Reading the `esbuild` script is the review. The ADR sentence is not that review. Do not set `strictDepBuilds` to false, `minimumReleaseAge` to `0`, or commit `minimumReleaseAgeExclude` without a reviewed reason.
- ADR-0006's Unicode case-fold gap is acceptable only because Module 0 extracts no archive. It is still in front of the first zip reader.
- SEC-M0-N-001 through SEC-M0-N-006 stay non-blocking, except that SEC-M0-N-002 no longer covers this proposal: a license rule was chosen, and the `OR` hole is SEC-M0-B-008 rather than an open product question with no effect.

BLOCK SEC-M0-B-008

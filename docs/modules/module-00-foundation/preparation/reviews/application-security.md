# Module 0 — Application Security Review

**Role:** Senior Application Security Engineer
**Status:** Preparation record, 2026-10-02. Not implementation approval. Not closure of M0-AC-011. Not a Product Owner decision.
**Scope:** Lightweight threat model for the boundaries Module 0 introduces. AI, plugins, collaboration, and project files are named and deferred. They are not features of this module.

The decisions are `docs/engineering/architecture.md` and ADR-0004, ADR-0005, and ADR-0007. This file is the threat model those decisions are judged against. It does not authorize implementation.

## What was not executed

No shell was run. Electron, Tauri, WebView2, WKWebView, WebKitGTK, and a GPU process were not executed. No exploit was written or run, and no vulnerability was planted. No install, lockfile resolution, or `pnpm audit` was run. The pnpm installer was not run. This condensation did not re-fetch the 2026-10-02 vendor pages and did not repeat that pass's secret scan. That scan found no secret in the repository content that existed then.

## Facts this record still uses

- CVE-2026-50021 / GHSA-q6j5-fjx5-2mc3. GitHub advisory updated 2026-06-26. Use the stricter patched pair, pnpm 10.34.1 and 11.4.0, not the CVE text's 10.34.0. Affected ranges are below 10.34.1 and `>= 11.0.0, < 11.4.0`. A frozen install fail-opens when a lockfile resolution omits `integrity`. pnpm 12.0.0 was published on 2026-08-26, after that fix, so a 12.x pin is outside those ranges. Implementation day still has to confirm the chosen patch contains the fix. That check was not run here.
- pnpm issue 15276, read 2026-10-02. On 12.5.1, `pnpm ci --ignore-scripts` still runs a project `install` script when a `clean` script exists. `pnpm install --frozen-lockfile --ignore-scripts` does not. CI uses the frozen install, not `pnpm ci`, until that is confirmed fixed for the pin.
- pnpm 11 and 12 defaults, read 2026-10-02: `minimumReleaseAge` 1440 minutes, `blockExoticSubdeps` true, `strictDepBuilds` true. Do not set `strictDepBuilds` to false, `minimumReleaseAge` to `0`, or commit `minimumReleaseAgeExclude` without a reviewed reason. Do not set `dangerouslyAllowAllBuilds`. Do not use an empty `neverBuiltDependencies` list to allow every script.
- The integrity fix still exempts git-hosted and `file:` tarballs. `blockExoticSubdeps` stays on. Git dependencies and URL tarballs stay forbidden for that reason.
- Electron sandbox and fuse behavior, and Tauri 2 capabilities, were consulted on 2026-10-02. Fuse notes were the v44.5.1 tree. Tauri 2.12 was published on 2026-09-26 and raised the MSRV to Rust 1.90. Those facts support the revisitable conditions below. They are not a decision to use either host.
- MDN, modified 2026-09-02, marks WebGPU as limited availability and secure-context only. Module 0 does not request a GPU, so the browser-support matrix is not a Module 0 requirement. WebKitGTK 2.54.0 highlights (18 September 2026) did not establish WebGPU. WKWebView parity with Safari 26 was not verified. Neither gap is a reason to add a native GPU stack.

## Boundaries

Module 0 has no accounts, cloud API, plugins, or project format. Assets are the developer machine at the user's integrity level, repository and CI integrity, lockfile integrity, and diagnostic logs. Future signing keys must not exist. GPU adapter identity is a fingerprint. Nothing in Module 0 logs it.

| Boundary | Untrusted side | What may cross it |
| --- | --- | --- |
| Registry to workspace | Package contents and install scripts | Locked install, reviewed script allowlist, permissive license rule |
| CI to repository | Workflow code, third-party Actions, fork pull requests | Secret-free jobs, `contents: read`, Actions pinned by commit, `pull_request` only |
| Shell page to machine | The page and its dependencies | No filesystem, process, or application network API. The dev server is toolchain loopback, not a shell entitlement |
| Core to platform | UI and shell code | Core does not import the shell, React, or filesystem APIs (M0-NFR-002) |
| Logs to people and CI | Any value the process can see | Closed diagnostic fields only |

Toolchain network and filesystem rights belong to the package manager and to CI. They are not copied into the shell so that dev and prod match.

Named and not implemented: project files, imported assets, non-loopback network, AI output, plugins, scripts, collaboration, and marketplace content. No parsers or sandboxes for them. Module 0 adds no generic invoke bridge. That bridge would make each later input a code-execution boundary.

The abuses this record exists to prevent are an install script or a stripped integrity hash, a secret or `pull_request_target` on fork code, an environment dump or the raw failure-switch value in a log, a LAN-bound dev server, a companion process, a native GPU stack when a GPU API is absent, a copyleft or unknown license accepted because one side of an `OR` is permissive, and a remote script, font, stylesheet, or frame in the shell.

## Module 0 controls

Binding for implementation. Not implemented in this preparation. This is the M0-NFR-009 baseline.

### Shell

The only shell is loopback Vite: `127.0.0.1`, static assets, relative base. No Electron, no Tauri, no system webview, no native window, and no companion process.

- Bind the dev server to `127.0.0.1`, not all interfaces. Secure context on loopback. No `file://` shell and no LAN bind. Do not document `file://` as a way to open the shell.
- No remote script, font, stylesheet, or frame. No service worker.
- Production content security policy: `default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`. Do not add `unsafe-inline` or `unsafe-eval`, including for HMR.
- Vite HMR may use a same-origin WebSocket in development only. That exception is not in the production policy.
- Send that production policy on `vite preview` as well as with the built assets, and bind preview to `127.0.0.1`. ADR-0005 requires the preview smoke to be loopback. The preview policy was not waived.
- No camera, microphone, clipboard, notification, protocol-handler, deep-link, auto-update, operating-system URI, or elevated helper. One window. It does not open further windows.
- `platform` has no capability and no filesystem or network API. Core does not import the shell, React, or filesystem APIs.

### Install and CI

- Commit `pnpm-lock.yaml`. Pin pnpm 12.8.1 or a later 12.x patch in `packageManager`. Do not choose a release below 10.34.1 or on the vulnerable 11 line. The pin must still fail closed when `integrity` is omitted. Enable that exact pnpm with Corepack. Do not install it with an unpinned `curl` script. Do not add a root `install` lifecycle script.
- CI uses `pnpm install --frozen-lockfile`, not `pnpm ci`, until issue 15276 is confirmed fixed for the pin.
- `allowBuilds` stays empty until a named package's script is read and reviewed. Naming `esbuild` in an ADR is not that review. `esbuild` is allowed only if Vite's install fails without it.
- Public npm registry only. No git dependencies and no URL tarballs. Leave `minimumReleaseAge` and `blockExoticSubdeps` at the pnpm 12 defaults.
- If pnpm is rejected, the integrity path is `npm ci` with `ignore-scripts=true`, and only named scripts that were read may run. That fallback is not the recommendation (ADR-0005).
- Reject a dependency whose behavior is to download and execute remote code, and reject one that disables certificate checks. A new direct dependency needs a short note: why the standard library is not enough, who maintains it, and which license it carries. Review transitive changes when the lockfile moves, not only when `package.json` does.
- One failing vulnerability gate: `pnpm audit --audit-level=high`. It contacts the registry and is not an offline control. OSV-Scanner is the accepted alternative if that registry check becomes the problem, not a second failing gate for the same advisories. Revisit the scanner if Rust enters. A waiver needs an owner and an expiry. There is no standing `continue-on-error`. Do not use `npm audit fix --force`.
- Dependabot may open pull requests. It does not auto-merge. A later privilege-boundary package (`electron`, `tauri`, `wry`, or a GPU stack) is not an exception to that.
- One GitHub Actions workflow, on `pull_request`, `push` to `main`, and `workflow_dispatch`. `pull_request_target` is forbidden. `permissions: contents: read` only. Do not grant `write` or `id-token` on this workflow for later. Actions are pinned to commit SHAs. No repository secrets, organization secrets, personal tokens, npm token, signing certificate, or notarization password. No macOS runner and no Apple secret. Fork pull requests must not receive secrets. Do not print the environment or the `secrets` context. Artifacts are the verify log and the test report, not an environment dump, and not an npmrc, a keychain, or a runner environment file.
- Signing secrets, when they exist, stay in a protected release workflow on reviewed tags, never in this workflow and never on pull requests. Prefer short-lived federation over a long-lived certificate password. A secret that reaches a log is treated as compromised. Module 0 does not create that release workflow.

### Diagnostics and GPU

- Closed diagnostic fields: `event`, `shell` (`browser`), `version`, `step`, and on failure an application error code and message. Events are `startup.beginning`, `startup.ready`, and `startup.failed`. Nothing else. In particular, no environment dump, tokens, cookies, authorization headers, signing material, file contents, project bytes, home-directory paths, WebGPU adapter or limits, or telemetry. Do not log the raw `UVCP_FORCE_INIT_FAILURE` value. The step id `forced-initialization-failure` is the failure signal. The headless script writes those lines to stderr.
- `UVCP_FORCE_INIT_FAILURE` is confined to `pnpm dev`. Unset or `0` starts normally. `1` fails that step after the diagnostic sink exists and before ready. Any other value fails as an invalid value, not as success. Tests and the headless script inject a throwing initializer and do not read the variable. The production bundle does not contain the switch (architecture section 17, ADR-0008). It is not an HTTP parameter and not a control on the screen.
- No GPU request. The renderer is null. No WebGPU context, shader, `wgpu`, or Dawn. A missing `navigator.gpu` does not start a native GPU stack.

### License rule

The preparation allow-list was MIT, MIT-0, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, Zlib, Unlicense, and CC0-1.0. Dual licensing was allowed only among that list (`MIT OR Apache-2.0`). A copyleft alternative did not skip the Product Owner. Unknown, missing, and `NOASSERTION` were rejected.

The proposal as first written accepted an `OR` when at least one side was permissive. The worked example treated `MIT OR GPL-3.0-only` as MIT. The proposal review blocked that rule (SEC-M0-B-008) because the same wording also admits AGPL, LGPL, SSPL, and BUSL. Electing the permissive side is a real SPDX mechanic. It is not a substitute for Product Owner approval of a named copyleft dependency.

ADR-0007's license section was read for this record. The amended text matches the required change. This role concurs with that amended rule only. That is not a new full concurrence with the architecture, not module approval, and not closure of M0-AC-011.

- Allow only MIT, MIT-0, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, Zlib, Unlicense, CC0-1.0, and BlueOak-1.0.0.
- An `OR` passes only when every disjunct is on that list. `MIT OR Apache-2.0` passes. `MIT OR GPL-3.0-only` does not.
- An `AND` passes only when every conjunct is on that list.
- Unknown, missing, or `NOASSERTION` is not added.
- GPL, AGPL, LGPL, MPL, BUSL, SSPL, and any other copyleft or source-available license require Product Owner approval of that named dependency before it is added, including when a permissive license is the other side of an `OR`.

`BlueOak-1.0.0` is permissive. Adding it was not SEC-M0-B-008. No product `LICENSE` grant is added. Workspace packages stay private. This record grants no copyleft exception.

## Findings

A blocking finding is resolved for architecture preparation only when the architecture and ADRs select the shell and record the conditions. M0-AC-011 stays open until an implementation review shows the built shell matches that record. These findings reopen if implementation contradicts them.

**SEC-M0-B-001 — No shell trust boundary was selected.** Closed for architecture preparation. The only shell is loopback Vite. ADR-0004 and ADR-0007 record the shell conditions above. No Electron or Tauri is added in Module 0.

**SEC-M0-B-002 — Unhardened Electron is rejected.** Closed for architecture preparation because Module 0 contains no Electron. Unhardened Electron stays rejected. Current defaults are not a written control for a later host: one window option can reverse them, and several dangerous fuses ship enabled.

**SEC-M0-B-003 — Broad host entitlements are rejected.** Closed for architecture preparation. No filesystem, shell-execute, or application network capability is granted. There is no companion process, preload, or Tauri capability.

**SEC-M0-B-004 — Module 0 CI must be secret-free.** Closed for architecture preparation by secret-free CI, including no `pull_request_target`. The later signing-secret path above is the only accepted path.

**SEC-M0-B-005 — Installs must be locked, and scripts must be reviewed.** Closed for architecture preparation by the locked install, the 12.x pin outside the CVE-2026-50021 ranges, the empty `allowBuilds` gate, and the refusal of `pnpm ci` until issue 15276 is confirmed fixed. The `esbuild` script is still unread.

**SEC-M0-B-006 — Diagnostics must not dump the environment.** Closed for architecture preparation by the closed diagnostic fields, including not logging the raw `UVCP_FORCE_INIT_FAILURE` value.

**SEC-M0-B-007 — No privileged native GPU fallback.** Closed for architecture preparation. The null renderer does not request a GPU and does not implement a native fallback.

**SEC-M0-B-008 — An `OR` with one permissive license admits copyleft.** The proposal review blocked a rule that accepted `MIT OR GPL-3.0-only` as MIT, because the same wording also admits AGPL, LGPL, SSPL, and BUSL. The historical block is in `security-proposal-review.md`. The ADR-0007 amendment matches the required change and is the architecture-preparation disposition. It is not Product Owner approval of any named copyleft dependency.

### Non-blocking

**SEC-M0-N-001.** Signing, notarization, and update feeds are deferred. They become blocking in the module that distributes or updates binaries. If Electron is later proposed, the fuse end state is decided before packaging. Only the binary edit waits for a package.

**SEC-M0-N-002.** The product license, and any named copyleft exception, remain Product Owner decisions. They block adding that dependency. They do not block this architecture. The `OR` hole is SEC-M0-B-008, not an open question with no rule. Chromium's bundled notices belong to a later Electron distribution review, not to Module 0.

**SEC-M0-N-003.** Commercial security platforms and mandatory CodeQL are not Module 0 controls. Paying for code scanning is a Product Owner decision. It is not recommended for this module.

**SEC-M0-N-004.** An old or uneven system webview is residual risk only if a later module proposes one. Do not close that gap in Module 0 with a private Chromium or a native GPU path.

**SEC-M0-N-005.** Future content boundaries stay named, not designed. No finding requires their controls now.

**SEC-M0-N-006.** This threat model satisfies test-plan section 7 for preparation. It is not evidence that an implementation meets M0-AC-011.

Adopted notes, now architecture text rather than optional advice: do not log the raw `UVCP_FORCE_INIT_FAILURE` value; do not add a root `install` lifecycle script; install the pinned pnpm with Corepack, not an unpinned `curl` script.

## Revisitable direction

Not a decision to use Electron or Tauri. ADR-0004 leaves the desktop host unselected. If a later module proposes one of these hosts, start from the conditions below and open a new security review. ADR-0007's later-host section is shorter. The conditions it omits are not waived.

### If a later module proposes Electron

Reject the proposal if any renderer can run with Node integration, without context isolation, without the sandbox, with `webSecurity` disabled, or under `--no-sandbox`, or if a preload exposes `ipcRenderer` or a generic invoke.

- Every `BrowserWindow`, `WebContentsView`, and `webview` sets `contextIsolation: true`, `nodeIntegration: false`, `nodeIntegrationInWorker: false`, `nodeIntegrationInSubFrames: false`, `sandbox: true`, and leaves `webSecurity` on. Call `app.enableSandbox()` before ready. Do not pass `--no-sandbox` in any script, test, or CI step. Disabling context isolation also disables the sandbox even when sandbox flags are set.
- No remote content. Not `file://`. Bundled local content from a custom scheme or the loopback server only. The Module 0 content security policy applies. No `unsafe-inline` and no `unsafe-eval`.
- Prefer no preload. If one exists, `contextBridge` exposes named functions only. It does not pass `ipcRenderer`, `require`, or a generic `invoke`.
- Every `ipcMain.handle` checks `senderFrame` against the shell origin, rejects a null frame, and does not trust the frame URL. `about:blank`, `blob:`, and sandboxed frames are not identified by URL.
- Deny every permission. Deny new windows. Cancel navigation off the shell origin. Do not call `shell.openExternal`.
- Do not set `allowRunningInsecureContent`, experimental features, `enableBlinkFeatures`, or `ELECTRON_DISABLE_SECURITY_WARNINGS`.
- The `electron` package install is a reviewed script exception and uses embedded checksums. CI does not set `ELECTRON_MIRROR`, `ELECTRON_CUSTOM_VERSION`, or `electron_use_remote_checksums` unless a reviewed mirror is its own decision.
- Fuse end state, recorded before a packaged binary: disable `runAsNode`, `nodeOptions`, `nodeCliInspect`, and `grantFileProtocolExtraPrivileges`; enable `onlyLoadAppFromAsar` and `embeddedAsarIntegrityValidation`. Do not flip `cookieEncryption` until macOS signing exists. Fuse defaults consulted on 2026-10-02 left those four disabled switches enabled. OS signing is what stops a fuse being flipped back. The flip itself is not Module 0 work.
- Name an owner and a cadence for moving to a current Electron stable after a Chromium security release. Chromium fixes reach users only when the application upgrades.
- No unsandboxed native GPU fallback beside Chromium. Unsafe WebGPU flags are not a product fix.

### If a later module proposes Tauri

- No shell, filesystem, HTTP, opener, or dialog plugin unless that module's requirements need it and the grant is reviewed. No grant is made here. `fs:default` is already too wide to copy from a template.
- Set an explicit capability list. Delete capabilities the template added. No `windows: ["*"]`. No `remote.urls`. On Linux and Android, Tauri cannot tell an embedded iframe from the window for remote IPC.
- Configure CSP. No `unsafe-eval` and no remote script hosts. CSP does nothing until it is set. Every capability file is on until the config lists capabilities explicitly.
- Register every command through `AppManifest::commands`, then grant each one. A command passed only to `invoke_handler` is allowed for every window on Tauri 2. That is not default-deny. Zero commands remains the preferred list until a requirement names one.
- The host is not elevated. Rust code is outside the webview ACL. It does not use `std::process`, shell helpers, or user-directory I/O, and it does not gain a network client for later.
- Commit `Cargo.lock`. Run `cargo deny` for licenses, bans, and sources. Advisory exceptions are dated. No permanent `continue-on-error`. `cargo deny` does not replace reading a new crate's `build.rs`.
- If the proposal is Tauri 2.12 or later, pin Rust to at least the 2026-09-26 MSRV, 1.90, or any higher floor that release requires.
- No native GPU library in the Rust host as a WebGPU fallback. Do not assume WKWebView or WebKitGTK implements WebGPU.

A later `wgpu` path is not a silent fallback for a missing `navigator.gpu`. It needs a Product Owner decision and a new security review. It must not put the GPU device in an unsandboxed host without an explicit boundary.

## Residual risk

- ASCII case-fold does not solve every Unicode case collision (ADR-0006). Accepted only because Module 0 extracts nothing. It is a review item before the first real archive reader.
- The `esbuild` script has not been read.
- Generator templates are wider than these conditions. A Tauri template capability or an Electron quick-start flag is not evidence that an entitlement is needed.
- CI secret creep on a pull request would reopen SEC-M0-B-004.
- `pnpm audit` is not an offline control, and the CVE-2026-50021 property has to hold for the patch chosen on implementation day.
- A later desktop wrapper that skips the conditions above would reopen SEC-M0-B-001, SEC-M0-B-002, SEC-M0-B-003, and SEC-M0-B-007.

## Not decided here

The Product Owner decides module authorization, the application license, any named copyleft exception, telemetry, and any paid scanning platform. Recommendations that stand unless the Product Owner changes them: no copyleft, no telemetry, and no commercial security platform for Module 0. This review does not choose a later desktop host.

Deferred until the module that introduces the boundary: code signing, notarization, auto-update, SBOM, project-file parsers, and AI and plugin sandboxes. They are unsafe to fake in Module 0.

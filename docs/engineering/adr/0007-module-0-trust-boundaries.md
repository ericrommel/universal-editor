# ADR-0007: Module 0 trust boundaries

**Status:** Accepted for the binding Module 0 decision. Revisitable and deferred items stay open.  
**Date:** 2026-10-02  
**Decider:** Tech Lead  
**Consulted:** Senior Application Security Engineer, Senior DevOps / Platform Engineer

## Context

M0-NFR-009 requires initial trust boundaries and baseline controls for dependencies, CI secrets, and the platform capabilities Module 0 actually introduces. The security review at `docs/modules/module-00-foundation/preparation/reviews/application-security.md` is the lightweight threat model. This ADR selects one shell and adopts that review's conditions for it. Linking the review without the conditions would leave SEC-M0-B-001 open.

Module 0 has no accounts, project parser, plugin host, AI client, or updater. The assets are the developer machine, the repository, CI integrity, and the privilege boundary later modules will inherit.

## Decision

The Module 0 shell is the conditioned web shell in ADR-0004. No Electron and no Tauri are added. The notes below are a shorter start for a later proposal. They are not a selection of either host, and they are not permission to wrap this page in a desktop shell. The threat model keeps the conditions this list does not repeat, including a null-`senderFrame` check, no Electron `file://` content, no `allowRunningInsecureContent`, no experimental features, no `enableBlinkFeatures`, no `ELECTRON_DISABLE_SECURITY_WARNINGS`, a non-elevated Tauri host, and no `std::process` or user-directory I/O in Rust. Omitting them here does not waive them.

### Boundaries in force

| Boundary | Rule |
| --- | --- |
| Registry to workspace | Lockfile, frozen install, reviewed build scripts, permissive license allow-list |
| CI to repository | Secret-free jobs, read-only token, Actions pinned by commit, `pull_request` only |
| Shell page to machine | Loopback dev server, no filesystem API, no process spawn, no application network client |
| Core to platform | Core does not import the shell, React, or filesystem APIs |
| Logs to humans and CI | Closed diagnostic fields. No environment dump |

Future inputs stay untrusted and unimplemented: project files, imported assets, non-loopback network, AI output, plugins, scripts, collaboration, and marketplace content. Module 0 does not build parsers or sandboxes for them.

### Shell controls

- Bind the dev server to `127.0.0.1`.
- No `file://` shell and no LAN bind.
- No remote script, font, stylesheet, or frame.
- No service worker.
- Production content security policy: `default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`.
- Vite HMR may use a same-origin WebSocket in development only.
- No companion process. Missing WebGPU does not start a native GPU stack. Module 0 does not request a GPU at all.
- Diagnostics follow the field list in the architecture document.

### Dependency controls

- Commit `pnpm-lock.yaml`. CI uses `pnpm install --frozen-lockfile` on the pnpm pin in ADR-0005.
- `allowBuilds` is empty until a named package is reviewed. `esbuild` is the only likely exception, and only if Vite's install fails without it. No `dangerouslyAllowAllBuilds`.
- Public npm registry only. No git dependencies and no URL tarballs.
- Vulnerability check: `pnpm audit --audit-level=high` inside `pnpm verify`. OSV-Scanner is the accepted alternative if the registry check becomes the problem. Do not run both as failing gates for the same advisories.
- Dependabot opens pull requests. It does not auto-merge.

License allow-list for resolved packages, until the Product Owner sets a product license:

- Allow: MIT, MIT-0, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, Zlib, Unlicense, CC0-1.0, BlueOak-1.0.0.
- An `OR` passes only when every disjunct is on that list. `MIT OR Apache-2.0` passes. `MIT OR GPL-3.0-only` does not.
- An `AND` passes only when every conjunct is on that list.
- GPL, AGPL, LGPL, MPL, BUSL, SSPL, and any other copyleft or source-available license require Product Owner approval of that named dependency before it is added, including when a permissive license sits on the other side of an `OR`. Electing the permissive side is not a substitute for that approval.
- Unknown, missing, or `NOASSERTION` is not added.

Do not add a product `LICENSE` file that grants rights. Workspace packages stay private.

### CI secrets

Module 0 builds and tests with no repository secrets, no organization secrets, and no personal tokens. `permissions: contents: read`. Do not print the environment. Fork pull requests must not receive secrets.

Signing secrets, when they exist, belong only in a protected release workflow on reviewed tags. They are not added to this workflow to "test signing." Prefer short-lived federation over a long-lived certificate password. A secret that reaches a log is treated as compromised.

### If a later module proposes Electron

Not a decision to use Electron. A proposal that does should start from these conditions rather than from an unrestricted shell. Unhardened Electron is not an acceptable reading of this ADR.

- `contextIsolation: true`, `nodeIntegration` and its worker and subframe variants `false`, `sandbox: true`, `webSecurity` left on, `app.enableSandbox()` before ready, no `--no-sandbox`.
- No remote content. No generic `ipcRenderer` bridge. Prefer no preload while the shell needs no privileged API.
- Deny every permission request. Deny window opens. Cancel navigation off the shell origin. Do not call `shell.openExternal`.
- The Electron download uses embedded checksums. CI does not set `ELECTRON_MIRROR`, `ELECTRON_CUSTOM_VERSION`, or `electron_use_remote_checksums` unless a reviewed mirror is its own decision.
- Before a packaged binary ships, fuses end as: `runAsNode`, `nodeOptions`, `nodeCliInspect`, and `grantFileProtocolExtraPrivileges` disabled; `onlyLoadAppFromAsar` and `embeddedAsarIntegrityValidation` enabled. Record that end state before packaging. Do not flip `cookieEncryption` until macOS signing exists.
- Name an owner and a cadence for moving to a current Electron stable after a Chromium security release.

### If a later module proposes Tauri

Not a decision to use Tauri. A proposal that does should start from these conditions.

- No shell, filesystem, HTTP, opener, or dialog plugin unless that module's requirements need it and the grant is reviewed.
- Explicit capability list. No `windows: ["*"]`. No `remote.urls`.
- CSP configured. No `unsafe-eval` and no remote script hosts.
- Every command registered with the manifest permission system. A command that is only passed to `invoke_handler` is not default-deny on Tauri 2.
- `Cargo.lock` committed. `cargo deny` for licenses, bans, and sources if Rust enters the repo.
- No native GPU library in the Rust host as a WebGPU fallback.

### Deferred

Code signing, notarization, auto-update, SBOM, project-file parsers, AI and plugin sandboxes, and commercial security platforms. They become blocking in the module that introduces the corresponding boundary. They are unsafe to fake in Module 0.

## Consequences

- SEC-M0-B-001 through SEC-M0-B-007 are closed for architecture preparation by this ADR and ADR-0004. SEC-M0-B-008, from the proposal review, is closed by the rule that every disjunct of an `OR` must be on the permissive list. These findings reopen if implementation contradicts them.
- M0-AC-011 is not satisfied by this document alone. The implementation review still has to show the built shell matches it.
- The smallest practical scanner is `pnpm audit`, not a new platform. That choice is acceptable for this JavaScript-only module and should be revisited if Rust enters the repository.

## Confirmation

The Product Owner accepted these web-shell controls on 2026-10-02. That acceptance does not authorize Electron or Tauri. The Product Owner still decides the product license, any copyleft exception, and any telemetry. This ADR's recommendation is no telemetry and no copyleft. Those defaults stand unless the Product Owner changes them.

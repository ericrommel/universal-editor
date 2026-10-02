# Module 0 — Application Security Review

**Role:** Senior Application Security Engineer
**Status:** Preparation review, 2026-10-02. Not an implementation approval. Not closure of M0-AC-011.
**Scope:** Lightweight threat model for the Module 0 architecture options. No product threat model for AI, plugins, collaboration, or project files beyond naming those boundaries and deferring them.

This review does not select the product stack. It states which security postures are blocked, acceptable, or acceptable only with conditions. GPU and WebGPU product fit belongs to the rendering and Tech Lead recommendation. The security consequence of that fit is in the option review below.

No application code, CI workflow, or ADR is created by this review. Controls below are requirements on the architecture proposal and on the later implementation. They are not implemented here.

---

## Documents read

Operational documents, which win on conflict:

- `AGENTS.md`, Secure Development section
- `docs/product-overview.md`
- `docs/engineering/development-process.md`, sections 5.11 and 17, plus the Definition of Ready security gate in section 7
- `docs/engineering/architecture.md` (intentionally incomplete; no stack is approved)
- `docs/modules/module-00-foundation/specification.md`, including scope, M0-NFR-009, and M0-AC-011
- `docs/modules/module-00-foundation/test-plan.md`, section 7

Context only. The archive does not authorize future modules:

- `docs/archive/product-engineering-specification-v1.0.md`, sections 10 and 17, and the archived Module 0 text for conflict checking

Repository state checked with the documents: there is no application source, no package manifest, no lockfile, and no CI workflow. `docs/engineering/architecture.md` still says the architecture is not yet approved.

External behavior checked on 2026-10-02 is cited in [Evidence](#evidence). Runtime behavior of Electron, Tauri, WebView2, WKWebView, and WebKitGTK was not executed.

---

## Evidence

### What Module 0 actually introduces

Module 0 must provide a minimal shell, a platform-neutral core, explicit boundaries, a package-manager install, local verification, CI, and startup/fatal diagnostics. It must not provide authoring, a production scene graph, AI, cloud, collaboration, marketplace, plugins, scripting, or final distribution (`specification.md` sections 3 and 4).

M0-NFR-009 requires initial trust boundaries and baseline controls for dependencies, CI secrets, and platform capabilities introduced by the module. M0-AC-011 requires those boundaries to be documented and requires no unresolved blocking security finding. Test-plan section 7 requires this lightweight threat model and forbids planting an artificial vulnerability to prove the process. The deliberate failing test in TP-M0-F-003 is a verification-propagation check, not a security exploit.

M0-NFR-002 is also a security boundary: core/domain code must not depend on a desktop shell, a UI framework, or platform filesystem APIs.

The archive's Module 0 text has no M0-NFR-009 equivalent. The operational specification wins. Archive section 10 still correctly describes the later product rule: untrusted files, AI responses, scripts, extensions, and external assets are trust boundaries, and telemetry must be explicit. Archive section 17 leaves the application license and third-party license model undecided. That remains a Product Owner decision.

### Electron, consulted 2026-10-02

Sources:

- [Security](https://www.electronjs.org/docs/latest/tutorial/security), current docs, disclosure link pinned to the `v44.5.1` tree
- [Process Sandboxing](https://www.electronjs.org/docs/latest/tutorial/sandbox)
- [Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [Electron Fuses](https://www.electronjs.org/docs/latest/tutorial/fuses), schema link also pinned to `v44.5.1`
- [Installation](https://www.electronjs.org/docs/latest/tutorial/installation)

Facts used below:

- Electron is not a browser. JavaScript can be given the filesystem and the user shell. The project states that displaying arbitrary untrusted content is a severe risk Electron is not intended to handle.
- `nodeIntegration` defaults off since Electron 5. Enabling it disables the renderer sandbox.
- `contextIsolation` defaults on since Electron 12. It must stay on even when Node integration is off, because otherwise the page can reach Node primitives. Disabling context isolation also disables process sandboxing, including when `sandbox: true` or `app.enableSandbox()` is set.
- Renderer sandboxing defaults on since Electron 20. A sandboxed renderer has no Node environment. Privileged work has to cross IPC to the main process. The preload still has a privileged subset (`contextBridge`, `ipcRenderer`, and a few modules). Leaking that subset to the page is possible unless context isolation stays on. The supported bridge is one narrow function per operation, not a pass-through `ipcRenderer.invoke`.
- IPC handlers must validate `senderFrame` by origin. `about:blank`, `blob:`, and sandboxed frames do not identify the controller by URL, and the frame may be null.
- By default, Electron approves all Chromium permission requests unless `session.setPermissionRequestHandler` is set.
- `webSecurity: false` is non-default and disables the same-origin policy. `allowRunningInsecureContent`, experimental features, and `enableBlinkFeatures` are separate items on the same checklist.
- A restrictive CSP is recommended (`script-src 'self'`). Navigation and window creation must be limited. `shell.openExternal` must not receive an untrusted URL.
- `--no-sandbox` disables the Chromium sandbox for all processes, including utility processes. Electron documents it as testing-only, never production.
- The main process is outside the renderer sandbox. Electron's sandbox note says a compromised or untrusted payload should not be processed there.
- Electron bundles Chromium and Node. It does not push security updates to installed apps. Safe Browsing and Certificate Transparency are absent. The practical patch path is an application upgrade onto a current Electron stable release.
- Package-time fuses, and their defaults in the current fuse document: `runAsNode` enabled, `nodeOptions` enabled, `nodeCliInspect` enabled, `grantFileProtocolExtraPrivileges` enabled, `cookieEncryption` disabled, `embeddedAsarIntegrityValidation` disabled, `onlyLoadAppFromAsar` disabled. `runAsNode` allows `ELECTRON_RUN_AS_NODE`. The file-protocol fuse grants extra privileges that a normal browser does not give `file://`, including service workers and broad child-frame access. Fuses are meaningful only on a packaged binary, and OS code-signing is what stops them being flipped back.
- Installing the `electron` npm package calls `@electron/get`, which downloads a prebuilt binary from GitHub releases during installation. The first development launch can also download it. Checksums are embedded by default. `electron_use_remote_checksums=1` switches verification to the mirror's `SHASUMS256.txt`. `ELECTRON_MIRROR` and `ELECTRON_CUSTOM_VERSION` change where the binary comes from and which version is fetched.

### Tauri 2, consulted 2026-10-02

Sources:

- [Security](https://v2.tauri.app/security/), page last updated 2026-07-22
- [Capabilities](https://v2.tauri.app/security/capabilities/), page last updated 2026-09-03; wording checked against the v2 `capabilities.mdx` source
- [Permissions](https://v2.tauri.app/security/permissions/), page last updated 2026-07-20
- [Capability reference](https://v2.tauri.app/reference/acl/capability/)
- [CSP](https://v2.tauri.app/security/csp/), page last updated 2025-04-07
- [Command scopes](https://v2.tauri.app/security/scope/), page last updated 2026-09-09
- [Tauri 2.12](https://v2.tauri.app/blog/tauri-2-12/), 2026-09-26
- [`@tauri-apps/plugin-shell` 2.4.0](https://www.npmjs.com/package/@tauri-apps/plugin-shell), published 2026-09-26

Facts used below:

- The trust split is Rust core versus frontend code in the system webview. IPC is the bridge. Data that crosses it without access control is a privilege-escalation path.
- Rust code in the core and in plugins is not constrained. Tauri's own wording: it has full access to available system resources. The webview has only what IPC exposes.
- A window or webview that matches no capability has no IPC access. That is default deny for the ACL surface.
- That default does not cover every command. Official capabilities text: every command registered with `tauri::Builder::invoke_handler` is allowed for every window and webview until the command list is passed through `tauri_build::AppManifest::commands`. Only then do those commands become permission-gated. Reading only the overview page will miss this.
- Every file under `src-tauri/capabilities/` is enabled automatically until `tauri.conf.json` sets `app.security.capabilities`. After that explicit list, only the listed capabilities are compiled in.
- Windows in more than one capability merge those permissions. `windows: ["*"]` is a broad match. Window identity is the label, not the title.
- Remote origins do not get the API unless a capability sets `remote.urls`. On Linux and Android, Tauri cannot tell an embedded iframe from the window itself for that feature.
- CSP is applied only when it is set in the Tauri configuration. It is not an implicit default. Tauri can add nonces and hashes for bundled assets at compile time.
- Scopes are enforced by the command implementation. A scope entry that the command ignores does not protect anything. `deny` is supposed to beat `allow`.
- The shell plugin is not core. It is an optional plugin that can spawn processes and open URLs. The filesystem plugin is likewise optional; its broad sets (`fs:default`, recursive application-directory reads) are irrelevant until the plugin is added.
- Tauri does not bundle the webview. The stated security trade-off is patch latency: OS and webview vendors usually ship webview fixes faster than application vendors ship a bundled engine, with acknowledged exceptions. The cost is version skew and unpatched system webviews.
- Tauri 2.12 (2026-09-26) drops official Windows 7 support and raises MSRV to Rust 1.90. That is a floor for any Rust toolchain pin. It is not itself a Module 0 feature requirement.

### WebGPU and webviews, consulted 2026-10-02

Sources:

- [WebGPU Explainer](https://gpuweb.github.io/gpuweb/explainer/), Draft Community Group Report, 23 September 2026, section 2.1
- [MDN WebGPU API](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API), last modified 2026-09-02
- [MDN GPUSupportedLimits](https://developer.mozilla.org/en-US/docs/Web/API/GPUSupportedLimits), last modified 2026-09-28
- [web.dev, "WebGPU is now supported in major browsers"](https://web.dev/blog/webgpu-supported-major-browsers), 25 November 2025
- [Develop secure WebView2 apps](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/security), updated 2026-09-14
- [Distribute your app and the WebView2 Runtime](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution), updated 2026-09-14
- WebKitGTK 2.54.0 release announcement on webkit-gtk, 18 September 2026. The retrieved highlights do not mention WebGPU.

Facts used below:

- WebGPU's security model assumes a browser GPU process. That process is less sandboxed than a content process because drivers need a wider syscall surface, and it is typically shared across origins. Validation of GPU messages has to happen in the GPU process so one content process cannot read another origin's GPU memory. Content-process objects are handles; the allocations live in the GPU process.
- MDN still marks the API as limited availability, not Baseline, and available only in a secure context. `http://localhost` and `https://` qualify. A bare LAN address and a typical `file://` page do not. MDN also notes that browsers deliberately tier reported limits, because exact limits are a fingerprinting surface.
- As of the 25 November 2025 web.dev status: Chromium WebGPU is on by default from Chrome/Edge 113 on Windows (Direct3D 12), macOS, and ChromeOS; Android arrived later and is hardware-gated; Firefox 141 is Windows, Firefox 145 is macOS Tahoe 26 on ARM64; Safari 26 is on for macOS Tahoe 26, iOS 26, iPadOS 26, and visionOS 26. That post still listed Linux, other Firefox platforms, and broader coverage as incomplete. This review does not promote later secondary blogs over MDN's September 2026 "limited availability" classification.
- Electron's WebGPU path is the bundled Chromium, so it follows the Electron Chromium version rather than the system browser. That improves consistency and worsens patch latency, because the GPU sandbox is only as new as the Electron upgrade the app ships.
- Tauri's path is the system webview. WebView2's production backing platform is the WebView2 Runtime, which Microsoft describes as tracking the Edge stable web platform, not an arbitrary installed Edge. A current Evergreen runtime is therefore in the same family as Edge's WebGPU. The minimum runtime that can merely load WebView2 is far older (Runtime 86, 2021) and must not be assumed to expose WebGPU or current renderer fixes. WKWebView parity with Safari 26 was not separately verified. WebKitGTK 2.54.0's published highlights do not establish WebGPU. Absence is not proof that no build has the API; it is enough to forbid assuming it.
- Microsoft's WebView2 guidance: treat web content as untrusted relative to the host, do not expose host objects the page does not need, do not enable web messages the page does not need, and do not run the webview host elevated. Tauri needs its IPC channel, so the host bridge exists; the capability list is what keeps it narrow. The host process should stay at normal user integrity.

### Dependency tooling, consulted 2026-10-02

Sources:

- [pnpm 10 settings](https://pnpm.io/10.x/settings), retrieved 2026-10-02; [pnpm 10.0.0 release notes](https://github.com/pnpm/pnpm/releases/tag/v10.0.0)
- [GHSA-q6j5-fjx5-2mc3](https://github.com/advisories/GHSA-q6j5-fjx5-2mc3) / CVE-2026-50021, GitHub advisory updated 2026-06-26. The CVE description says the fail-open behavior is fixed in pnpm 10.34.0 and 11.4.0. The GitHub advisory's patched versions are 10.34.1 and 11.4.0. Use the stricter pair.
- [OSV-Scanner source scanning](https://google.github.io/osv-scanner/usage/scan-source) and [supported lockfiles](https://google.github.io/osv-scanner/supported-languages-and-lockfiles/), documentation current with the v2.6.0 release on 2026-09-14. Supported inputs include `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, and `Cargo.lock`.
- [cargo-deny](https://github.com/EmbarkStudios/cargo-deny): advisories, bans, licenses, and sources

Facts used below:

- Since pnpm 10, dependency lifecycle scripts do not run unless the package is allowlisted (`onlyBuiltDependencies`, later `allowBuilds`). `strictDepBuilds` defaults to true from pnpm 10.3.0, so unreviewed build scripts fail the install. `dangerouslyAllowAllBuilds` exists and defaults off. An empty `neverBuiltDependencies` list is a documented way to restore the old allow-all behavior. Do not use it.
- CVE-2026-50021: pnpm before the fixed releases skips tarball integrity verification when a lockfile resolution omits `integrity`. `pnpm install --frozen-lockfile` then accepts a substituted registry tarball. The CVE text contrasts this with `npm ci`, which enforces integrity. A frozen lockfile is not an integrity control if the hash can be deleted and the installer fail-opens.
- OSV-Scanner reads lockfiles for both JavaScript and Rust, which matches a repo that may contain either or both. One scanner is enough.
- `cargo-deny` is the proportionate Rust policy tool: license allowlist, source allowlist, crate bans, and RustSec advisories. It does not stop a `build.rs` from running. New crate review is still required.
- npm's advisory database, as counted on the GitHub Advisory Database sidebar on 2026-10-02, had on the order of 108,000 npm malware advisories against a few dozen Rust malware advisories. That is not a probability of compromise. It is evidence that npm lifecycle scripts are a routine malware class and that an allow-all script policy is not proportionate.

---

## Threat model

Module 0 has no accounts, no cloud API, no plugins, and no project format yet. The assets are the developer machine, the repository, CI integrity, and the shape of the privilege boundary that later modules will inherit. A wide IPC bridge or a shell entitlement added "temporarily" in Module 0 becomes the default path for untrusted project data later.

### Boundaries introduced now

```text
Developer / CI operator
        |
        | clone, lockfile, install scripts, workflow YAML
        v
Package registries and toolchains          GitHub Actions runner
(npm or crates.io, Electron binary,        (build and test only;
 Rust toolchain, OS webview if any)         no product secrets)
        |                                      |
        v                                      v
Host process                              CI logs and artifacts
(Electron main / Tauri Rust core /
 none, if the shell is the browser)
        |
        | IPC or none
        v
Shell content
(sandboxed renderer, system webview, or browser tab)
        |
        | in-process only
        v
Platform-neutral core
(no shell, no UI framework, no platform FS)
```

| Boundary | Who is on the untrusted side | What Module 0 may cross it with |
| --- | --- | --- |
| Registry to workspace | Package contents, install scripts, downloaded Electron binaries, crate `build.rs` | A locked install, reviewed script allowlist, checksummed vendor binaries |
| CI runner to repo | Workflow code, third-party Actions, anything a pull request can execute | Secret-free jobs, read-only `GITHUB_TOKEN`, Actions pinned by commit |
| Shell content to host | The shell page, its dependencies, and any future content rendered in that page | No filesystem, shell-execute, or application network API. Narrow IPC only if a desktop host exists |
| Host to operating system | The host process itself, running as the developer | The host stays minimal. No elevated process. No child-process API in Module 0 |
| Core to platform | UI and shell code | Core does not import them (M0-NFR-002) |
| Logger to developer and CI output | Any value the process can see, including the environment | Startup and fatal events only, with the redaction rules below |
| Dev server to network | Other hosts on the LAN, if the server binds widely | Loopback only |

The developer toolchain is not the application. npm, cargo, and the CI runner have network and filesystem rights because they are developer tools. Those rights are not shell entitlements and must not be copied into the running shell "so that dev and prod match."

### Boundaries named and deferred

These are out of Module 0 scope. The architecture must not implement parsers, network clients, or sandbox escape hatches for them. It must also not pretend they are trusted when they arrive.

| Future boundary | Untrusted input | Why it is not a Module 0 control |
| --- | --- | --- |
| Project files | Local files the user opens, including files from other people | No project format is implemented. Persistence stays a boundary stub |
| Imported assets | Images, fonts, geometry, and other uploaded bytes | No import pipeline |
| Network | Update feeds, account services, any origin that is not loopback dev | No product network client |
| AI output | Model text, generated scene data, generated code or materials | No AI feature and no provider |
| Plugins | Third-party code installed inside the product | No plugin host |
| Scripts | User or marketplace scripts | No scripting host |
| Collaboration and marketplace | Other users' content and accounts | Not in the product overview's initial boundaries |

The inheritance rule: Module 0 IPC and entitlements must be small enough that those future inputs can be added as explicit, validated crossings. A generic "invoke anything" bridge makes every later boundary a remote-code-execution boundary.

### Actors

| Actor | Trust in Module 0 |
| --- | --- |
| Human Product Owner | Decides product trade-offs. Not simulated here |
| Module developers | Trusted to commit, not trusted to disable a control to make a build pass |
| Developer running the shell | The shell runs as this user. A shell compromise is a user-level compromise |
| CI runner | Trusted to execute reviewed workflow code. Not a place for production credentials. Fork pull requests are untrusted code |
| Package registries and binary mirrors | Not fully trusted. Lockfiles and checksums exist because registries are a supply-chain boundary |
| System webview vendor | Trusted to patch the OS component, not controlled by this repo |
| Later: file author, asset author, network peer, model provider, plugin author, script author | Deferred with the boundaries above |

### Assets

| Asset | Module 0 exposure |
| --- | --- |
| Developer workstation, at the user's integrity level | The shell and every install script run here |
| Source, review history, and CI results | A malicious dependency or Action can change what "green" means |
| Lockfile integrity | The reproducible build is the build that was reviewed |
| Future signing keys and publish tokens | Must not exist in Module 0 |
| Diagnostic logs | A convenient place to leak the environment |
| GPU adapter identity | A fingerprinting surface if a probe logs it. No end-user project data exists yet |

### Abuse cases

These are architecture abuses, not exploits to build.

1. A dependency lifecycle script or `build.rs` runs on `install` and reads developer credentials or rewrites a tool that later runs in CI.
2. A lockfile edit removes integrity hashes. A frozen pnpm install below the CVE-2026-50021 fix still accepts a replaced tarball.
3. The `electron` package, or `ELECTRON_MIRROR` / `ELECTRON_CUSTOM_VERSION`, fetches a binary from somewhere other than the official release, or is told to trust the mirror's checksum file.
4. The shell page, or a dependency it bundles, gets script execution and calls a generic IPC method. The host performs filesystem or process execution because the bridge does not name operations.
5. An Electron window is created with `nodeIntegration`, without context isolation, or with `--no-sandbox`, often as a dev convenience. Renderer compromise becomes host compromise. Disabling context isolation disables the sandbox even if sandbox flags are also set.
6. Electron's default permission handler approves camera, microphone, notification, or similar requests the shell never needed.
7. A Tauri template capability grants `fs:default` or the shell plugin, or a command added through `invoke_handler` is left allowed for every window because nobody registered it with `AppManifest::commands`.
8. A capability uses `windows: ["*"]` or remote URLs. On Linux, an iframe and the main window are not distinguished for remote IPC.
9. CI is changed to `pull_request_target`, or a third-party Action moves its tag. Fork code runs with a token or with a secret that was added so signing could be tested on pull requests.
10. Startup diagnostics print `process.env` or a panic hook dumps the environment. A developer token that happened to be in the environment lands in CI logs.
11. The dev server binds to all interfaces. Another machine on the network loads the shell, which is not an origin the IPC allowlist expected.
12. `navigator.gpu` is missing, and the host silently starts a native GPU stack in the unsandboxed process so the probe "works."
13. A copyleft or unidentified license enters through a transitive dependency and is discovered only at distribution time.
14. The Module 0 shell loads a remote script, font CDN, or documentation iframe. That origin becomes code running inside the privileged application.

---

## Option review

No option is unconditional. Unhardened Electron is blocked. A native GPU implementation inside the privileged host is blocked for Module 0, whichever shell is chosen. The ranking below is privilege only. It is not a product or rendering recommendation.

### Web-only shell — accept only with conditions

**Decision:** Accept for Module 0 if the conditions below are architecture requirements. This is the smallest trust expansion that can still satisfy a minimal shell, a headless core, CI, and diagnostics.

The browser is the sandbox. There is no Node main process and no Rust host with ambient OS rights. There is no filesystem entitlement and no shell-execute entitlement to grant. Supply-chain scope is the JavaScript lockfile plus CI, not a second native runtime. WebGPU, if a probe exists, uses the browser GPU process described in the explainer rather than a private unsandboxed device.

This does not prove a desktop security model. Product overview section 9 makes desktop first-class. A web-only Module 0 is acceptable only when the architecture says, in writing, that the desktop host is a later boundary and that this shell's lack of entitlements is not permission to wrap the same page in an unrestricted Electron or Tauri host later.

Conditions:

- The shell origin is a secure context: loopback HTTP for development, or HTTPS. Not `file://`, not a LAN IP. MDN's secure-context rule is what makes `navigator.gpu` exist at all.
- Bind the dev server to loopback.
- CSP equivalent to `default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`. No remote scripts, fonts, or frames.
- No service worker and no remote module URL in Module 0.
- Do not add a local companion process "just in case." That is a desktop host and must be reviewed as one.
- Missing WebGPU fails closed. No native fallback.

Residual risk: the browser matrix is uneven. web.dev's November 2025 status and MDN's September 2026 limited-availability mark mean a web shell can be secure and still not have WebGPU on every target. That is a product-coverage fact for the rendering role, not a reason to leave the browser sandbox.

### Tauri 2 — accept only with conditions

**Decision:** Accept as the Module 0 desktop shell if, and only if, the conditions below are written into the architecture before implementation. Prefer this over Electron when a desktop shell is actually required in Module 0, because the frontend does not receive Node and plugin IPC is capability-gated. Do not describe Tauri as default-deny without the command-registration caveat.

What is in its favor:

- Web content starts in the OS webview, not in a process that can `require` Node.
- Plugin commands and manifest-registered commands are allowlisted per window.
- An unmatched window has no ACL access.
- Remote IPC is off unless configured.
- The webview is patched by the OS vendor. Tauri documents that as usually faster than shipping a private Chromium. WebView2's runtime tracks the Edge web platform on a short cadence; that is a real patch-latency advantage on Windows for Chromium-class fixes, provided the machine is on a current Evergreen runtime.
- Rust dependencies have a smaller public malware record than npm, and `cargo-deny` can enforce licenses and sources. This is not a reason to trust `build.rs`.

What keeps it conditional:

- The Rust core is fully privileged. A bug or a wide command in Rust is an unsandboxed user-level bug. Tauri's capabilities page lists malicious or lax Rust, ignored scope checks, system-webview zero-days, and supply chain as outside the ACL's protection.
- `invoke_handler` commands are allowed for all windows until `AppManifest::commands` opts them into permissions. A team that "uses capabilities" and also registers commands the ordinary way has not built default deny.
- CSP does nothing until it is configured.
- Every capability file in the directory is on by default until the config lists capabilities explicitly.
- The shell and filesystem plugins are one template choice away from violating the Module 0 entitlement rule. `fs:default` in the official inline example is already too wide for this module.
- The webview version is the user's, not the repo's. An old WebView2 still loads. WKWebView and WebKitGTK do not give the same WebGPU guarantee as current Chromium. This review did not verify WebGPU inside WKWebView or WebKitGTK.
- Linux/Android iframe confusion makes remote IPC a worse idea, not a feature to enable "for the docs."

Conditions:

- Do not add `tauri-plugin-shell`, `tauri-plugin-fs`, `tauri-plugin-http`, opener, dialog, or any other plugin that reads user files, spawns processes, or opens sockets. Core window permissions, if any, are limited to what the single shell window needs (for example a fixed title). No `windows: ["*"]`.
- Set `app.security.capabilities` to an explicit list. Review the generated template and delete capabilities it added.
- Register every application command through `AppManifest::commands`, then grant each one in that explicit capability. Module 0 should need no application command. Zero commands is the preferred list.
- Set a restrictive CSP in configuration. No `unsafe-eval`. No remote script hosts.
- Do not set `remote.urls`.
- Rust core stays free of `std::process`, shell helpers, and user-directory I/O. Dependency crates do not get a network client "for later."
- Pin Rust to at least the Tauri 2.12 MSRV (1.90) or newer, and commit `Cargo.lock`. `cargo deny` checks licenses, bans, and sources on pull requests. Advisory failures need a dated exception, not a permanent `continue-on-error`.
- The host process is not elevated.
- Missing WebGPU does not start `wgpu` or another native GPU API in the Rust process during Module 0.

Residual risk accepted if those conditions hold: an unsandboxed but small Rust host, plus dependence on the OS webview. That residual risk is smaller than an unsandboxed Node main process beside a bundled Chromium, provided the command allowlist is real.

### Electron — block unless hardened; hardened Electron accepted only with conditions

**Decision:** Block Electron if any renderer can run with Node integration, without context isolation, without the sandbox, with `webSecurity` disabled, or under `--no-sandbox`. Block a preload that exposes `ipcRenderer` or a generic invoke. Block loading remote content into the main process or into a privileged window.

**Decision:** Accept a hardened Electron shell for Module 0 only when every condition below is an architecture precondition, not a follow-up task. Hardened Electron still has the highest residual risk of the three acceptable postures. Choose it only if another role's constraints require a bundled Chromium. Those constraints do not relax the conditions.

What current defaults already provide, and why they are not sufficient by themselves:

- Node integration off, context isolation on, and renderer sandbox on are defaults in any current Electron (5, 12, and 20 respectively). A modern template may therefore look safe on day one.
- The defaults are local flags. One `webPreferences` object reverses them, and reversing context isolation also reverses the sandbox.
- The main process remains a full Node.js runtime with the user's privileges. Preload remains more privileged than the page.
- Session permissions fail open.
- Dangerous fuses default to enabled: `runAsNode`, `nodeOptions`, `nodeCliInspect`, and `grantFileProtocolExtraPrivileges`.
- The framework binary is a second downloaded artifact, via `@electron/get`, with mirror and version environment variables.
- Chromium security fixes reach users only when this application upgrades Electron. Electron's own sandbox document says the project does not guarantee every fix is backported, and that it disables Chrome features that need a central service.

Conditions, all required if this option is selected:

- Every `BrowserWindow`, `WebContentsView`, and `webview` sets `contextIsolation: true`, `nodeIntegration: false`, `nodeIntegrationInWorker: false`, `nodeIntegrationInSubFrames: false`, `sandbox: true`, and leaves `webSecurity` at its default. Call `app.enableSandbox()` before `ready` so a later window cannot opt out. Do not pass `--no-sandbox` in any script, test, or CI step.
- No remote URL in the shell. Bundled local content only, served from a custom scheme or from the loopback dev server. Not `file://`.
- CSP as restrictive as the web-only option.
- Preload, if it exists at all, uses `contextBridge.exposeInMainWorld` with named functions. It does not pass `ipcRenderer`, `require`, or a single `invoke(channel, ...args)` through. Module 0 should need no privileged API. Prefer no preload over a placeholder bridge.
- Every `ipcMain.handle` validates `senderFrame` origin against the shell origin and rejects a null frame. Do not use the frame URL as the check.
- `setPermissionRequestHandler` denies every permission. `setWindowOpenHandler` denies new windows. Navigation off the shell origin is cancelled. `shell.openExternal` is not called.
- `webSecurity`, `allowRunningInsecureContent`, experimental features, and `enableBlinkFeatures` stay off the configuration. `ELECTRON_DISABLE_SECURITY_WARNINGS` is not set.
- The `electron` npm package's install script is an explicit, reviewed exception to the ignored-script policy. It uses the default embedded checksums. CI does not set `ELECTRON_MIRROR`, `ELECTRON_CUSTOM_VERSION`, or `electron_use_remote_checksums` unless a reviewed mirror is itself an architecture decision.
- Before any packaged artifact exists, the ADR records the fuse end state: disable `runAsNode`, `nodeOptions`, `nodeCliInspect`, and `grantFileProtocolExtraPrivileges`; enable `onlyLoadAppFromAsar` together with `embeddedAsarIntegrityValidation`. Do not flip `cookieEncryption` until macOS signing exists; the fuse document says that path depends on keychain access that signing provides. Implementing the flip is a release control, not a Module 0 packaging task, because final distribution is out of scope. Omitting the decision from the ADR is not allowed.
- The architecture names an owner and a cadence for moving to a current Electron stable after a Chromium security release. "We vendor Electron" without an upgrade rule is not an accepted condition.
- Same GPU rule: no unsandboxed native fallback beside Chromium.

If those conditions are met, Module 0 Electron is a local, sandboxed page beside a Node main process that has nothing to do. That is acceptable for a foundation shell. It is a poor place to render untrusted project, plugin, AI, or network content later. The future boundary has to be designed as a separate, non-Node web contents with no bridge, not as more channels on the Module 0 preload. Electron's own preface is the reason: arbitrary untrusted content is outside Electron's intended job.

### WebGPU security consequence

This is not a recommendation to use or avoid WebGPU.

| Placement | Security consequence |
| --- | --- |
| Browser tab or hardened Electron renderer | GPU work runs in the browser GPU process. That process is less sandboxed than the renderer and is shared across origins, but it is still a designed boundary, and message validation is part of the API. Patch speed is the browser's in the web option, and the app vendor's in Electron. |
| Tauri system webview | Same class of boundary only where the OS webview actually implements WebGPU and is kept current. Windows Evergreen WebView2 can track Edge. An old runtime, WKWebView, and WebKitGTK must not be assumed equivalent. The app does not ship the fix. |
| Native GPU API in the Electron main process or the Tauri Rust core | No browser GPU process. Driver and shader-compiler bugs run as the user, in the already privileged host. Blocked for Module 0, including as a fallback when `navigator.gpu` is missing. A later rendering module can propose an isolated GPU process. It is not a Module 0 probe. |

Additional constraints wherever a probe is allowed:

- Secure context only, or the API is simply absent.
- Do not log adapter names, vendor strings, or exact limits. MDN documents tiered limits specifically to reduce fingerprinting.
- Do not run untrusted WGSL. User materials, imported assets, plugins, and AI-generated shaders are deferred boundaries. Module 0 does not need a shader sandbox because it does not accept those inputs. It must not build one speculatively, and it must not run those inputs unsandboxed either.

---

## Required Module 0 controls

These are proportionate to a foundation module. They are the baseline M0-NFR-009 asks for. They are not a security product.

### Platform capability baseline

Default deny for the shell, on every option:

- No user-filesystem read or write.
- No process spawn, shell execute, or `shell.openExternal`.
- No application network entitlement. The dev server, if the toolchain needs one, binds to loopback and is not part of the shipped shell's permissions.
- No camera, microphone, clipboard, notification, protocol-handler, or deep-link entitlement.
- No auto-update, no custom URI registered with the operating system, no elevated helper.
- One shell window. It does not open further windows.
- Core/domain code does not import shell, UI, or platform filesystem APIs.

Template generators are not evidence that an entitlement is needed. Delete generated filesystem and shell permissions.

### Dependencies, lockfiles, and scripts

- One committed lockfile per ecosystem that Module 0 actually uses. `npm ci`, `pnpm install --frozen-lockfile`, or `cargo build --locked` / `cargo test --locked` in CI. A floating install is not reproducible and is not reviewed.
- If pnpm is chosen: version 10.34.1 or newer on the 10 line, or 11.4.0 or newer on the 11 line, so CVE-2026-50021 is not reintroduced. Keep `strictDepBuilds` on. Allow build scripts only through the version's explicit map (`onlyBuiltDependencies` or `allowBuilds`). Do not set `dangerouslyAllowAllBuilds` and do not clear `neverBuiltDependencies` to allow every script.
- If npm is chosen: commit `.npmrc` with `ignore-scripts=true`, then rebuild only named packages whose scripts were reviewed. `npm ci` remains the integrity path.
- The Electron binary download, if Electron is chosen, is the exception described in the option review. No unreviewed mirror.
- New direct dependencies require a short review note in the change: why the standard library or an existing dependency cannot do the job, who maintains the package, and what license it carries. Transitive surprises are reviewed when the lockfile moves, not only when `package.json` does.
- Reject dependencies whose behavior is "download and execute remote code" unless that is the reviewed Electron fetch path. Reject packages that disable certificate checks.
- Do not merge on an audit waiver that has no owner and no expiry.

### Vulnerability and license baseline

Use one vulnerability scanner, not a stack of platforms.

- Recommended: OSV-Scanner against the committed lockfiles in CI. It covers npm lockfiles and `Cargo.lock` in one tool, and the project publishes SLSA-provenanced binaries. Pin the scanner the same way other tools are pinned.
- Acceptable alternative for a JavaScript-only repo: `npm audit` or `pnpm audit` at high severity and above. It contacts the registry, so it is not an offline control. Do not also fail the same job on OSV-Scanner for the same advisories.
- If Rust is present: `cargo deny check bans licenses sources` on pull requests. Run advisories as a failing check with a small, dated exception list. Do not leave `continue-on-error` on that job permanently. `cargo-deny` does not replace reading a new crate's `build.rs`.
- Update strategy: one bot, GitHub Dependabot or an equivalent lightweight updater, weekly, as pull requests. No auto-merge of `electron`, `tauri`, `wry`, or other privilege-boundary packages. No `npm audit fix --force`. The author who merges a lockfile change reviews the diff, not only the direct version bump.
- License policy for dependencies, until the Product Owner sets the product's own license:
  - Allow: MIT, MIT-0, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, Zlib, Unlicense, and CC0-1.0 used as a software license. Dual licensing among those is allowed (`MIT OR Apache-2.0`).
  - Stop and ask the Product Owner before the dependency is added: GPL, AGPL, LGPL, MPL-2.0, BUSL, SSPL, and any other copyleft or source-available license. LGPL matters more if it would be statically linked into a distributed desktop binary. AGPL matters if the product is distributed or later offers a network service. Those are distribution decisions, not something Module 0 should guess.
  - Unknown, missing, or `NOASSERTION`: do not add the dependency. Identifying the license is engineering work. Accepting a known copyleft license is a Product Owner decision. Accepting an unknown license is neither.
- Choosing Electron also chooses Chromium's third-party license inventory inside the bundled binary. That inventory does not have to be negotiated in Module 0. It does have to be listed as a distribution decision before any packaged build is offered to users.

### CI secrets

Module 0 must build, test, lint, and typecheck with no repository secrets, no organization secrets, and no personal access tokens.

- `permissions: contents: read` at workflow scope. Do not grant `write` or `id-token` "for later."
- Pull requests use the `pull_request` event. Do not use `pull_request_target` to check out PR code.
- Pin third-party Actions to a commit SHA. A moving tag is an unreviewed code change.
- Do not echo the environment. Do not print `secrets` context. Do not upload `~/.npmrc`, keychains, or runner environment files as artifacts.
- Fork pull requests must keep GitHub's default: they do not receive secrets. Do not work around that.
- The only automatic credential is `GITHUB_TOKEN`, and it stays read-only.

Rule for signing secrets, when they eventually exist: they appear only in a protected release workflow that runs reviewed tag or release code, never in the Module 0 build and test workflow, and never on pull requests. Prefer short-lived federation (OIDC to a signer) over a long-lived certificate password in the repo. Mask the values. Do not write them to logs, caches, or artifacts. If one is printed, treat it as compromised and rotate it. Module 0 does not create that release workflow.

### Logging

Startup and fatal diagnostics are required (M0-FR-006). They are not an environment dump.

Log: a stable event name, the shell kind, the application version, the OS family, the startup stage, and a fatal error's type plus a message the application itself produced.

Do not log: the process environment, command-line secrets, tokens, cookies, authorization headers, signing material, file contents, project bytes, WebGPU adapter or limit details, or a full home-directory path when a relative stage name is enough. Do not install a crash hook whose default is "serialize the environment." CI logs follow the same rule. Sanitizing after a leak into an artifact is not the control; not emitting the value is the control.

No telemetry and no remote log shipping in Module 0. Introducing either needs Product Owner approval (`AGENTS.md`, Network and External Services).

### Supply-chain controls that belong in Module 0

- Lockfile plus frozen install.
- Ignored or explicitly allowlisted install scripts.
- One advisory scanner and, for Rust, `cargo-deny` policy checks.
- Dependabot or one equivalent updater.
- Actions pinned, token read-only, no secrets.
- Dependency review on pull requests is appropriate if GitHub's dependency-review action is enabled for the repository. It is a small workflow, not a new platform. If it cannot see private-repo data without a paid feature, OSV-Scanner still covers the requirement; do not buy a platform to close that gap.

---

## Deferred controls

Appropriate later, and unsafe to fake now:

| Control | When |
| --- | --- |
| Code signing, Apple notarization, Windows Authenticode | First artifact that leaves the developer machine for someone else. Not Module 0 |
| Electron fuse flip and ASAR integrity | Same packaged artifact. The intended fuse state is recorded now if Electron is chosen |
| Signed auto-update feed and update-manifest pinning | The module that actually updates installed apps. A feed added early is a remote-code boundary |
| Minimum supported WebView2 / OS webview version | First Tauri distribution, if Tauri is chosen. Module 0 can record the issue; it does not ship a runtime installer |
| SBOM attached to a release | First distributable build |
| Project-file and asset parsers, with size limits, path checks, and no native-code execution | The module that opens those bytes |
| AI, plugin, and script sandboxes | The modules that introduce those boundaries |
| Authentication, cloud storage, collaboration | The modules that introduce them |
| Certificate pinning or a private binary mirror | Only if a reviewed network constraint requires it |
| CodeQL or other code scanning | Optional. Useful when the repository's plan already includes it. Not a Module 0 gate, and not a substitute for the privilege boundary. Private-repo code scanning may require a paid GitHub feature; that purchase is a Product Owner decision |
| Heavyweight platforms (commercial SCA suites, artifact firewalls, SIEM, runtime EDR for the app) | Not justified by Module 0. Revisit only if the dependency graph or the distribution model outgrows a lockfile, OSV-Scanner, and `cargo-deny` |

---

## Findings

A blocking finding must be resolved in the architecture before implementation starts. "Resolved" means the architecture and its ADRs select one option and record that option's conditions, not that this preparation note exists. M0-AC-011 stays open until an implementation review confirms the built shell matches that record.

### Blocking

**SEC-M0-B-001 — No shell trust boundary is selected.**
`architecture.md` is still an empty preparation document. Starting implementation with an implicit Electron, Tauri, or browser default would let template entitlements define the boundary. The Tech Lead's proposal must name one option and adopt its conditions from the option review.
Disposition required before development: one option, with its conditions copied into the architecture decision, not merely linked as "see security."

**SEC-M0-B-002 — Unhardened Electron is rejected.**
Any proposal that enables renderer Node integration, disables context isolation, disables the sandbox, disables `webSecurity`, uses `--no-sandbox`, or exposes a generic IPC bridge is not ready. Hardened Electron is eligible only with the full condition list, including permission deny, navigation limits, checksummed binary download, the recorded fuse end state, and an Electron upgrade owner. Current defaults are not a written control, because one window option reverses them and several dangerous fuses ship enabled.

**SEC-M0-B-003 — Broad host entitlements are rejected.**
Filesystem, shell-execute, and application network capabilities are not Module 0 requirements. A Tauri capability that includes `fs`, `shell`, or `http`, an Electron preload that can touch those surfaces, or a web shell with a companion process that can, is blocking. Tauri proposals must also contain the explicit capability list, `AppManifest::commands` for every command (expected to be empty), CSP configured, and no `remote.urls`. Plugin IPC is not default-deny for ordinary `invoke_handler` commands.

**SEC-M0-B-004 — Module 0 CI must be secret-free.**
A proposal whose build or test workflow needs a signing certificate, notarization password, npm token, or other secret is blocking. `pull_request_target` with checked-out pull-request code is blocking. The signing-secret rule in Required Module 0 controls is the only accepted later path.

**SEC-M0-B-005 — Installs must be locked, and scripts must be reviewed.**
A package manager without a committed lockfile and a frozen CI install is blocking. So is an allow-all lifecycle-script setting, pnpm below 10.34.1 / 11.4.0, or an Electron mirror that is not reviewed. Integrity that fail-opens when the hash is absent does not satisfy M0-NFR-001 or M0-NFR-009.

**SEC-M0-B-006 — Diagnostics must not dump the environment.**
A logging design that prints `process.env`, token-bearing configuration, or file contents on startup or on fatal error is blocking, including when the reason is "so CI is easier to debug."

**SEC-M0-B-007 — No privileged native GPU fallback.**
If WebGPU is absent, Module 0 fails that probe closed. Implementing `wgpu`, Vulkan, Metal, or Direct3D inside the Electron main process or the Tauri Rust host to paper over a webview gap is a new unsandboxed boundary and is blocking for this module.

### Non-blocking

**SEC-M0-N-001 — Release signing and update feeds are deferred.**
Not required to start Module 0. They become blocking in the module that distributes binaries or updates them. The Electron fuse end state is not deferred as a decision; only the binary edit is deferred until a package exists.

**SEC-M0-N-002 — Copyleft and the product license are open product decisions.**
They block addition of a copyleft dependency. They do not block architecture work that has not chosen a dependency yet. Chromium's bundled license list is part of any later Electron distribution review.

**SEC-M0-N-003 — Commercial security platforms and mandatory CodeQL are not Module 0 controls.**
OSV-Scanner plus the lockfile policy is the baseline. Code scanning can be added without holding the architecture.

**SEC-M0-N-004 — OS webview minimums are a distribution concern.**
If Tauri is selected, an old WebView2 or an uneven WebKit build remains a residual risk. Record it. Do not solve it with a private Chromium or a native GPU path inside Module 0.

**SEC-M0-N-005 — Future content boundaries are named, not designed.**
Project files, assets, network, AI output, plugins, scripts, collaboration, and marketplace content stay deferred. No finding requires their controls now. A Module 0 bridge that would make them uncontainable is already covered by SEC-M0-B-002 and SEC-M0-B-003.

**SEC-M0-N-006 — This note is not M0-AC-011 evidence of the implementation.**
Test-plan section 7 is satisfied for preparation by this threat model. The acceptance criterion is satisfied only when the implemented architecture has no unresolved blocking finding.

---

## Risks, assumptions, PO decisions, open questions

### Risks

- Template defaults are wider than Module 0. `create-tauri-app` capabilities and Electron quick-start flags will be copied unless the ADR forbids them. Likelihood is high. Impact is a permanent privilege boundary.
- Tauri's overview reads as default deny. The capabilities page gives `invoke_handler` commands to every window until they are manifest-registered. Teams miss the second sentence.
- Electron defaults look aligned with the hardening list and are reversible per window. Fuse defaults (`runAsNode`, file-protocol extra privileges, inspector arguments) are the wrong way around for a shipped binary.
- Bundled Chromium patches only when the app upgrades. A desktop shell without an owner for that upgrade accumulates known renderer and GPU-process bugs.
- System webviews patch faster on average, by Tauri's account, and still leave some users on old runtimes. WebGPU compounds that, because a missing API tempts a native fallback.
- The GPU process is a weaker sandbox than the renderer even in the best option. That is acceptable for first-party Module 0 code. It is not acceptable for untrusted shaders, which are not in this module.
- npm install-script malware is a common advisory class. Rust `build.rs` is the same class of bug with a quieter history. Both need the allowlist or the crate review. A lockfile alone does not stop a script that was already locked.
- CVE-2026-50021 shows a frozen lockfile failing open when integrity metadata is stripped. Pinning pnpm is part of the control, not a nicety.
- CI secret creep is usually a convenience change: "just this once" on a pull request so signing can be tested. The rule has to be in the architecture before the first workflow file.
- Logging the environment at startup is a common diagnostic habit and is incompatible with `AGENTS.md`.
- A web-only Module 0 can be followed by an unrestricted desktop wrapper in a later module if the deferred boundary is only a sentence in this review and never enters the architecture document.

### Assumptions

- Module 0 has no end-user accounts, remote content, project parser, plugin host, or AI client. If a spike adds one, this review no longer covers it.
- Developers are inside the trust boundary of the repository. Registries, fork pull requests, and the shell's web content are not.
- The shell runs at normal user integrity. Module 0 does not need an elevated helper, and one would be a new finding.
- Final distribution is out of scope, so signing controls are specified as rules rather than built.
- Operational Module 0 requirements override the thinner archive Module 0 text.
- External claims were checked against the documents dated in Evidence. Browsers and webviews were not executed. WKWebView WebGPU parity with Safari 26 was not independently verified. WebKitGTK 2.54.0 highlights did not establish WebGPU.
- No secret was found in the repository. There is almost no repository content yet.

### Product Owner decisions

Security does not make these calls:

- Which shell to ship. Security's privilege order is web-only, then Tauri 2 with the conditions, then hardened Electron with the stricter conditions. Product fit, including WebGPU coverage, may justify a lower-ranked option. It does not justify dropping that option's conditions.
- The application's license, and whether GPL, AGPL, LGPL, MPL, or another copyleft dependency is acceptable in a distributed build. Archive section 17 already lists this as open.
- Whether Chromium's bundled third-party notices are acceptable on the day Electron binaries are distributed.
- Any telemetry or remote diagnostics. The recommendation is none. Adding them is a product decision.
- Paying for code scanning or a heavier supply-chain platform. Not recommended for Module 0.

### Open questions

- Is a desktop window part of Module 0, or is the minimal shell allowed to be a local web page? The specification requires a shell in the primary development environment. It does not require every target platform. The answer changes which conditions bind, not whether default deny binds.
- Will Module 0 contain a WebGPU probe? If yes, the secure-context and no-fallback rules bind immediately. If no, they bind at the first probe.
- What is the primary development OS and the CI OS matrix? That decides which webview, if Tauri is chosen, is the one actually tested. An Ubuntu WebKitGTK agent does not demonstrate Windows WebView2 behavior.
- Is the repository public or private? This affects whether GitHub dependency review and code scanning need a paid feature. It does not change the OSV-Scanner recommendation.
- Who owns framework upgrades if the desktop option is Electron or Tauri? Acceptance of those options assumes a named owner. The name is still open.
- Does any Module 0 spike need a loopback server only, or are maintainers expecting hot reload from a non-loopback device? A phone hitting a LAN URL is not a secure context for WebGPU and is not the Module 0 origin. That workflow needs an explicit exception and a new review.

This review should be read again when the Tech Lead's architecture proposal exists, and again when the shell is implemented. Those passes close or reaffirm the blocking findings. They are not a new product threat model.

# ADR-0004: Module 0 web shell

**Status:** Proposed  
**Date:** 2026-10-02  
**Decider:** Tech Lead  
**Consulted:** Senior 3D / Rendering Engineer, Senior Application Security Engineer, Senior DevOps / Platform Engineer, Senior 2D / Editor Engineer

## Context

The product targets Web, Windows, macOS, and Linux. Desktop is first-class and is not only a wrapped website (product overview, section 9). Module 0 must launch a minimal shell in the primary development environment. It must not couple the core project model to one platform (M0-NFR-007). It does not require every target to be implemented, and final distribution is out of scope.

"First-class desktop" in the product overview is about local files, larger projects, hardware acceleration, storage, and device integration where those help. It is not a requirement that Module 0 open a native window before any of those capabilities exist.

The rendering review's platform facts are in ADR-0003. An unhardened desktop shell and a native GPU API inside the Module 0 process are out of scope for this module.

**Binding for Module 0:** loopback Vite shell, relative-base static build, no desktop host.  
**Revisitable:** the host comparison below.  
**Deferred:** which desktop host, if any, presents a later viewport. Distribution channels are also deferred.

## Decision

Module 0's only shell is a Vite application served on `127.0.0.1` and built as static assets with a relative base.

Do not add Electron, Tauri, `wgpu`, a webview, or a native window in Module 0.

The relative base keeps a later host able to load the same files. It does not decide that the later host must reuse this UI package.

### Studied desktop hosts, not a selection

These notes are the 2026-10-02 comparison. They are not an ordered decision.

- Hardened Electron keeps one Chromium canvas for pointer input and graphics. ADR-0007 lists conditions to start from if a later module proposes it. Linux WebGPU coverage follows that Chromium build and is partial.
- A native `wgpu` surface owned outside the UI splits hit testing, focus, IME, and DPI, and it puts a GPU device in a privileged host. A later proposal needs its own security review. Module 0 does not probe it.
- Tauri, or any system webview, as the only GPU viewport on Windows, macOS, and Linux was not assumed. WebKitGTK 2.54 does not announce WebGPU. Windows WebView2 and macOS 26+ WKWebView can host WebGPU with caveats. That is evidence, not a rejection of every later use.

No viewport spike is part of Module 0.

### Release notes, not a Module 0 deliverable

Distribution is deferred. The notes that should not be lost:

- macOS direct distribution uses Developer ID, Hardened Runtime, notarization, and stapling. The Mac App Store is a separate sandboxed channel. New Developer ID certificates need the G2 intermediate; the previous intermediate expires on 2027-02-01 (Apple notice, 2026-10-01). The channel is not chosen.
- Windows signing, when installers exist, wants a certificate that is not stored in the repository.
- Module 0 has no hosting account and no installer.

## Alternatives

### Electron in Module 0

Would prove a bundled Chromium early and would expand the trust boundary to a Node main process before the shell has any privileged work to do. It is not required to launch the foundation screen. Rejected for this module. Not selected for a later module.

### Tauri in Module 0

Smaller binary and a capability system. It adds Rust, a system webview, and an unsandboxed host before Module 0 has a privileged operation to gate. Rejected for this module. Not selected or rejected for a later module.

### Native widgets per platform

Rejected in ADR-0002. Restated here because a desktop shell must not fork the foundation screen.

## Consequences

- M0-AC-002 is a browser launch via `pnpm dev` on the primary development environment, plus the headless preview smoke in CI. It is not a packaged executable.
- Clean setup prerequisites are Git, the pinned Node 24, the pinned pnpm 12, and a current desktop browser. They do not include Rust, Visual Studio, Xcode, or WebView2.
- The static build uses a relative base so a later host is not forced to rewrite asset URLs. That is not a choice of host.
- Calling Module 0 "desktop support" would be false. The desktop path stays open because no host is selected.

## Confirmation

Product Owner confirmation 3 in `docs/engineering/architecture.md` accepts or rejects this shell. Rejecting it and requiring a desktop window in Module 0 is a scope change that must be written down before implementation, because it reopens ADR-0007.

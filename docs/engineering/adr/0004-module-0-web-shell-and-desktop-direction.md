# ADR-0004: Module 0 web shell and desktop direction

**Status:** Proposed  
**Date:** 2026-10-02  
**Decider:** Tech Lead  
**Consulted:** Senior 3D / Rendering Engineer, Senior Application Security Engineer, Senior DevOps / Platform Engineer, Senior 2D / Editor Engineer

## Context

The product targets Web, Windows, macOS, and Linux. Desktop is first-class and is not only a wrapped website (product overview, section 9). Module 0 must launch a minimal shell in the primary development environment. It must not couple the core project model to one platform (M0-NFR-007). It does not require every target to be implemented, and final distribution is out of scope.

"First-class desktop" in the product overview is about local files, larger projects, hardware acceleration, storage, and device integration where those help. It is not a requirement that Module 0 open a native window before any of those capabilities exist.

The rendering review's platform facts are in ADR-0003. The security ranking is: a conditioned web shell, then a conditioned Tauri shell, then a conditioned Electron shell. An unhardened Electron shell is rejected. A native GPU API inside the privileged host is rejected for Module 0.

## Decision

Module 0's only shell is a Vite application served on `127.0.0.1` and built as static assets with a relative base.

Do not add Electron, Tauri, `wgpu`, a webview, or a native window in Module 0.

The UI package is host-neutral. A later desktop host mounts that same package. It does not grow a second chrome implementation inside the web app and then diverge.

### Future desktop viewport, not built now

When a later approved module must present a scene on the desktop:

1. **Preferred:** a hardened Electron host, so the viewport is one Chromium canvas with one pointer path, and WebGPU follows the bundled Chromium rather than the OS webview. The conditions in ADR-0007's Electron section become binding at that time, including an owner for Electron security upgrades and the recorded fuse end state. Linux WebGPU remains limited to the configurations Chromium enables. Unsupported adapters use the WebGL2 fallback inside that same Chromium and report the missing capability. Unsafe WebGPU flags are not a product fix.
2. **Alternative:** a native `wgpu` surface owned outside the UI, with a system webview used only for chrome. This splits hit testing, focus, IME, and DPI. It is acceptable only if the Product Owner rejects bundled Chromium, and only after a security review that does not reuse the Module 0 prohibition blindly and does not put the GPU device in an unsandboxed host without an explicit boundary. Not a Module 0 probe.
3. **Not the assumption:** Tauri, or any system webview, as the only GPU viewport on Windows, macOS, and Linux. Windows WebView2 and macOS 26+ WKWebView can host WebGPU with caveats. Linux WebKitGTK cannot be treated as a production spatial viewport. Choosing this path anyway requires an explicit Product Owner acceptance that Linux is outside the viewport claim.

No spike is required in Module 0, because the shell does not put a viewport in a system webview. A spike becomes required only if a later proposal reverses that and still claims the webview is GPU-capable.

### Release direction, not a Module 0 deliverable

- macOS direct distribution: Developer ID, Hardened Runtime, notarization, stapling. Mac App Store is a separate, sandboxed channel. Decide the channel before signing, not before Module 0.
- Windows: Authenticode via a hardware or cloud signer when installers exist. No certificate in the repository.
- Linux: no notarization equivalent. A system webview version is not a pin.
- Web: the static build. No hosting account in Module 0.

## Alternatives

### Electron in Module 0

Would prove a bundled Chromium early and would expand the trust boundary to a Node main process before the shell has any privileged work to do. The security review accepts hardened Electron only when a bundled engine is actually required. It is not required to launch the foundation screen. Rejected for this module. Retained as the preferred future viewport host.

### Tauri in Module 0

Smaller binary and a capability system. It adds Rust, a system webview, and an unsandboxed host, and it would imply a viewport path this proposal rejects. Rejected for this module. Not the default future viewport.

### Native widgets per platform

Rejected in ADR-0002. Restated here because a desktop shell must not fork the foundation screen.

## Consequences

- M0-AC-002 is a browser launch via `pnpm dev` on the primary development environment, plus the headless preview smoke in CI. It is not a packaged executable.
- Clean setup prerequisites are Git, the pinned Node 24, the pinned pnpm 12, and a current desktop browser. They do not include Rust, Visual Studio, Xcode, or WebView2.
- The static build must stay loadable from a future custom scheme or loopback host without rewriting the UI package.
- Calling Module 0 "desktop support" would be false. The architecture leaves the desktop path open and refuses the webview assumption that would close the Linux GPU path.

## Confirmation

Product Owner confirmation 3 in `docs/engineering/architecture.md` accepts or rejects this shell. Rejecting it and requiring a desktop window in Module 0 is a scope change that must be written down before implementation, because it reopens ADR-0007.

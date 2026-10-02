# ADR-0003: Module 0 render boundary

**Status:** Accepted for the binding Module 0 decision. Revisitable and deferred items stay open.  
**Date:** 2026-10-02  
**Decider:** Tech Lead  
**Consulted:** Senior 3D / Rendering Engineer, Senior Core / Platform Engineer, Senior Application Security Engineer

**Binding for Module 0:** a snapshot value and a null renderer. No GPU backend.  
**Revisitable:** the platform facts below, kept so a later renderer choice has the 2026-10-02 evidence.  
**Deferred:** WebGPU, WebGL2, native `wgpu`, and any product scene graph.

## Context

2D and 3D content share one scene (P-01, P-05). The scene must serialize without the active UI (archive section 4.2, context only). Core tests must not open a window (M0-NFR-003). Module 0 establishes a rendering boundary and does not implement a viewport, materials, cameras, or meshes.

Checked on 2026-10-02, and not executed on a GPU:

- Chromium has shipped WebGPU by default on Windows x64, macOS, and ChromeOS since Chrome 113. Linux coverage is still partial by GPU and driver. Electron 44 bundles Chromium 152, so a desktop Chromium host follows that matrix rather than the system browser.
- Safari 26 and later expose WebGPU on macOS Tahoe 26 and on macOS 27. WKWebView uses the system WebKit. Macs that cannot run Tahoe do not get that API from the system webview.
- WebKitGTK 2.54 (2026-09-16) does not announce WebGPU. Tauri's Linux graphics note (2026-06-15) documents WebGL paths that can succeed on a slow or software renderer and still hide the GPU identity.
- `wgpu` is a real native WebGPU implementation (Vulkan, Metal, D3D12, and a best-effort GL path) and can target browser WebGPU from Wasm. It is not a scene graph.

## Decision

Module 0 ships a snapshot value and a null renderer. The snapshot is plain data with physical pixel size, the device-pixel ratio used to compute it, an sRGB clear color, and an empty draw list. The null renderer records that value and returns backend `null` and device `not-requested`. It does not emit a reserved `lost` status. A headless test covers a fractional device-pixel ratio.

No canvas in the shell. No clear-color probe. No shader. No image diff and no GPU golden test. No graphics API is selected.

The field list above is the Module 0 test double. It is not a promise that a later renderer receives that same object, draws both flat and spatial items from one list, or recovers from device loss by rebuilding caches. Those ideas were discussed and are not decided.

Platform facts checked on 2026-10-02, and not run on a GPU, are in the context section. They explain why Module 0 does not treat a system webview as a finished viewport. They do not choose WebGPU, WebGL2, or `wgpu`.

## Alternatives

### Three.js or Babylon.js as the product renderer

Both can draw. Both normally keep authority in their own scene graph. Not a Module 0 dependency. Whether a later module may use one as a disposable cache is not decided. A spike that compares them is not Module 0 work.

### WebGL2 as the primary design

The widest common path on paper, including today's Linux system webviews. It cannot host compute, and a software GL path can report success without a usable GPU. Not selected. Not rejected for a later module.

### Native wgpu in Module 0

A real native WebGPU path. It also pulls Rust, a window, and an in-process driver into a module whose tests must stay headless. Rejected as a Module 0 dependency (ADR-0007). Not selected or rejected as a later viewport.

## Consequences

- Core does not import the renderer. The null renderer does not import UI, a desktop SDK, Three.js, Babylon.js, or `wgpu`.
- No frame-time budget is set. There is no reference viewport workload.
- Nothing in this ADR selects a later graphics API.

## Confirmation

The Product Owner accepted the Module 0 shell with no viewport on 2026-10-02 and did not choose a rendering engine. The later graphics API does not block this module and is not selected here.

# ADR-0003: Render snapshot and WebGPU direction

**Status:** Proposed  
**Date:** 2026-10-02  
**Decider:** Tech Lead  
**Consulted:** Senior 3D / Rendering Engineer, Senior Core / Platform Engineer, Senior Application Security Engineer

## Context

2D and 3D content share one scene (P-01, P-05). The scene must serialize without the active UI (archive section 4.2, context only). Core tests must not open a window (M0-NFR-003). Module 0 establishes a rendering boundary and does not implement a viewport, materials, cameras, or meshes.

Checked on 2026-10-02, and not executed on a GPU:

- Chromium has shipped WebGPU by default on Windows x64, macOS, and ChromeOS since Chrome 113. Linux coverage is still partial by GPU and driver. Electron 44 bundles Chromium 152, so a desktop Chromium host follows that matrix rather than the system browser.
- Safari 26 and later expose WebGPU on macOS Tahoe 26 and on macOS 27. WKWebView uses the system WebKit. Macs that cannot run Tahoe do not get that API from the system webview.
- WebKitGTK 2.54 (2026-09-16) does not announce WebGPU. Tauri's Linux graphics note (2026-06-15) documents WebGL paths that can succeed on a slow or software renderer and still hide the GPU identity.
- `wgpu` is a real native WebGPU implementation (Vulkan, Metal, D3D12, and a best-effort GL path) and can target browser WebGPU from Wasm. It is not a scene graph.

## Decision

The renderer, when one exists, consumes a platform-neutral **render snapshot**.

- Plain data. No GPU objects and no UI objects.
- Produced after hierarchy and modifier evaluation. The renderer does not evaluate the document.
- One draw list can contain both flat items and spatial items.
- Physical pixel size, the device-pixel ratio used to compute it, and an sRGB clear color.
- Stable ids so a later pick can return an id. The editor maps the id. The renderer does not select, undo, or save.

GPU caches keyed by id are allowed later. Device loss drops the cache and rebuilds from the snapshot. Derived geometry lives in CPU domain data, not only in GPU memory.

The API shape the snapshot is aimed at is WebGPU. WebGL2 is a fallback backend with fewer capabilities, reported as such, not a second product and not the design of the snapshot. Module 0 implements neither backend.

Module 0 ships:

- a snapshot value with physical size, device-pixel ratio, sRGB clear color, and an empty draw list
- a null renderer that records that snapshot and returns backend `null`, device `not-requested`, and does not emit a reserved `lost` status
- a headless test, including a fractional device-pixel ratio

No canvas in the shell. No clear-color probe. No shader. No image diff and no GPU golden test.

## Alternatives

### Three.js or Babylon.js as the product renderer

Both can draw with WebGPU. Both keep authority in their own scene graph. A drag, a material, or a tessellation that lives there becomes a second scene, and persistence and undo have to scrape an engine. Using either as a disposable cache behind the port is possible and is constant pressure in the wrong direction. Rejected as the product renderer. Not a Module 0 dependency. A later labeled spike may compare draw cost and must be deleted afterward. That spike is not Module 0 work.

### WebGL2 as the primary design

The widest common path on paper, including today's Linux system webviews. It cannot host compute, it does not fix a silent software GL path, and it splits shader authoring from a later WebGPU path. Rejected as the primary design. Retained as the fallback.

### Native wgpu in Module 0

The useful Linux GPU path that WebKitGTK does not provide. It also pulls Rust, a window, and an in-process driver into a module whose tests must stay headless, and it puts GPU work in a privileged host. The security review blocks that placement for Module 0 (ADR-0007). Rejected as a Module 0 dependency. Remains the alternative desktop viewport if bundled Chromium is later rejected (ADR-0004), and only with a new security review.

## Consequences

- Core does not import the renderer. The null renderer does not import UI, a desktop SDK, Three.js, Babylon.js, or `wgpu`.
- The first cube and the first 2D primitive, in a later module, are two items in one snapshot from one scene.
- Linux GPU support is not solved by choosing a system webview.
- No frame-time budget is set. There is no reference viewport workload.

## Confirmation

The Product Owner does not need to choose a rendering engine to authorize Module 0. The Product Owner does need to accept that Module 0 will not show a viewport. The later choice between Electron and a native surface is a separate confirmation, recorded in ADR-0004, and it does not block this module.

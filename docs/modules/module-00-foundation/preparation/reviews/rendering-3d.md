# Module 0 — 3D / Rendering Review

**Role:** Senior 3D / Rendering Engineer
**Date:** 2026-10-02
**Result:** Module 0 is a rendering package boundary, a small snapshot value, and a null renderer. No product renderer, graphics API, or desktop GPU host is selected.

## Question for Module 0

What rendering boundary must exist so a later viewport can draw 2D and 3D from one document, without choosing an engine, a GPU API, or a desktop host in this module?

## Findings

Module 0 has no scene, materials, cameras, meshes, or viewport. The boundary can be minimal. A canvas or an engine object would be mistaken for the product renderer and would make a headless test depend on a window.

The seam is plain data. A later renderer should consume a snapshot and should not own hierarchy, undo, persistence, or selection. This module does not define that document. It keeps the rendering package from becoming a second one. Three.js keeps authority in `Scene` / `Object3D`. Babylon.js keeps it in its scene, engine, and asset containers. Their controls mutate those graphs. A disposable-cache use is a later question, not a Module 0 dependency.

These platform facts were checked on 2026-10-02. They are evidence for a later module. They do not select WebGPU, WebGL2, native wgpu, Electron, or a system webview.

- Chromium WebGPU, implemented by Dawn, has been on by default for Mac, Windows x86/x64, and ChromeOS since Chrome 113. Linux is partial: Intel Gen12+ since Chrome 144, and NVIDIA on Wayland with driver 535.183.01 or newer since Chrome 147. Other Linux configurations remain behind `--enable-unsafe-webgpu` plus Vulkan and ANGLE flags. Windows ARM64 remains behind `--enable-unsafe-webgpu`. That flag is not a product fix. This was read from the gpuweb status page on 2026-10-02. Chromium 152 and 154 were not launched. The same page still lists Firefox on Linux as Nightly, not stable.
- Electron 44.5.1, released 2026-09-29, bundles Chromium 152.0.7977.130. Electron 44 requires macOS 13 or later. No Electron 44 note was found that disables WebGPU apart from Chromium. Electron was not launched.
- Safari 26 ships WebGPU on macOS Tahoe 26, iOS 26, iPadOS 26, and visionOS 26. WebKit bug 299237 states that `navigator.gpu` requires macOS Tahoe, iOS 26, visionOS 26, or later. Safari 26 on Sequoia leaves it undefined. WKWebView uses the system WebKit and was not executed, so parity with Safari is an inference. WebKit's WebGPU is not Dawn.
- WebKitGTK 2.54 has no shipped WebGPU as of the 2.54.0 highlights on 2026-09-16. Those notes replace the compositor with Skia and do not mention WebGPU. The 2.54.1 notes of 2026-10-02 do not add it. The gpuweb status page has no GTK or WPE row.
- Tauri on Linux uses WebKitGTK. Its graphics note, updated 2026-06-15, says WebGL2 context creation can succeed on a software or slow path and raise no error, and that WebKitGTK masks the renderer string as "Apple GPU". DMA-BUF and compositing failures are documented, often on NVIDIA. A created WebGL context is not a GPU viewport.
- Published `wgpu` 30.0.1 (2026-08-22) implements the WebGPU API on Vulkan, Metal, D3D12, and a qualified OpenGL path. On wasm it targets browser WebGPU and WebGL2. Native WGSL is translated by Naga. Browser WebGPU passes WGSL through to the browser. It is not a scene graph, and it is not a Module 0 library.

WebView2 uses Microsoft Edge as its rendering engine. Evergreen distribution is a current Chromium; a fixed-version runtime can be older. No 2026 WebView2 process was run. Windows x64 is the expected default-on case only for a current runtime. Windows ARM64 stays on the Chromium flag row above. WebGPU is absent from the published Edge-versus-WebView2 difference list, and that absence is not a support statement.

One surface keeps a later pointer path, hit test, and device-pixel ratio together. A native child surface beside a webview splits focus, IME, DPI, and occlusion. A browser GPU process and an in-process driver are different trust boundaries. Those costs are why no host is selected in this module.

The snapshot fields exist so color and DPI are not implicit. macOS displays are often Display P3, and Safari 26 can present HDR inside a WebGPU canvas. An untagged clear will not match across machines. CSS pixels are not framebuffer pixels at a fractional device-pixel ratio. WebGPU device loss invalidates objects created on that device, so the document must not be those objects. This module does not simulate device loss, HDR, or a backing-store cap.

A GPU image is a poor oracle here. Anti-aliasing, drivers, and color management make pixel diffs flake. A shell screenshot is chrome evidence, not scene evidence. Once a scene exists, correctness is a CPU check of snapshot data. An image is supplementary.

## Recommendations

### Binding for Module 0

- A rendering package boundary. Core does not import it. It may import core only. It does not import UI, editor, platform, a desktop shell, or a GPU library. Editor does not call it in this module.
- A snapshot value: physical pixel size, the device-pixel ratio used to compute that size, an sRGB clear color, and an empty draw list. No GPU objects and no draw-item schema.
- A null renderer that records that value. It does not open a window, load a GPU library, or request an adapter. A headless test, including a fractional device-pixel ratio, checks the four fields.
- No canvas and no on-screen clear. No shader, mesh, camera, light, or material.
- No Three.js, no Babylon.js, no wgpu, and no other GPU library in this module.

### Revisitable direction

- The four fields are the Module 0 test double, not a permanent renderer API. A later module may add drawable items, stable ids, or a lost-device status, or may replace the shape. The package still holds plain data, not a second document.
- When derived geometry exists, keep a CPU copy the snapshot can name, so a lost device can be rebuilt without reading an engine. Revisit that when a viewport module can measure it.
- sRGB is the only clear tag stored now. Wide gamut, HDR, and any backing-store cap stay open. A future shell reads `devicePixelRatio`. Core does not.

### Deferred

- Product graphics API. WebGPU, WebGL2 as a fallback, and native wgpu were compared. None is selected.
- Desktop viewport host. Electron, a system webview (WebView2, WKWebView, or WebKitGTK), and a host-owned wgpu surface were compared. None is selected. No GPU spike in Module 0. A later proposal that calls a webview GPU-capable needs its own labeled probe. That probe is not this module.
- Three.js or Babylon.js as the product renderer or as a disposable cache, including any draw-cost spike.
- CPU picking versus a pick buffer, who tessellates text and strokes, the WGSL subset shared by Dawn, WebKit, and Naga, GPU golden images, frame-time budgets, and export without a visible swapchain.

## Disagreements

- **Module 0 surface.** The editor review asked for one host element, an attach call, and a labeled frame probe that does not choose Canvas2D, WebGL, or WebGPU. The design review forbids a viewport, a canvas grid, and an empty editor frame. This review rejects the probe: a cleared canvas would be cited as the renderer, and the null renderer is the boundary evidence. The editor's second pass agrees that omitting the probe is not a blocking hole. Binding result for this module: no canvas and no attach API. The later handoff is deferred and is not specified here.
- **Later host rank.** Considered, and not adopted: a Chromium host first, native wgpu second, and a system-webview viewport last. The reasons were the Linux WebKitGTK gap and a single canvas for later direct manipulation. Security's privilege order is a conditioned web shell, then conditioned Tauri, then conditioned Electron, and security blocks a native GPU API in the privileged host for Module 0. DevOps would not decide in Module 0. If forced, DevOps leans toward Tauri for a thin shell and still treats Electron as realistic when a pinned engine matters more than binary size. The findings are the evidence. None of these ranks is the product renderer.

## Risks

- A later desktop choice treats one system webview as a GPU viewport on Windows, macOS, and Linux. WebKitGTK 2.54 has no shipped WebGPU, and a Tauri WebGL context can succeed on a slow path. This module does not take that host. The module that presents a scene still owns the risk.
- Electron is treated as WebGPU on every Linux GPU and on Windows ARM64. The Chromium status page still has flag-gated rows. Unsafe WebGPU flags are not the fix.
- The null path grows a canvas, a software rasterizer, or a golden image so the boundary looks occupied. CI then needs a GPU and will flake. The data test is the Module 0 gate. No visual-regression harness is added in reserve.
- CSS pixels or an unspecified color become the future camera. Fractional scaling and Display P3 then disagree by machine, and hit tests mix two coordinate spaces. The snapshot stores physical pixels, the ratio, and an sRGB clear before a window exists.
- The only copy of geometry lives in GPU memory. Device loss, sleep, or removing a GPU drops the document. This module does not implement recovery. The rendering package must not be that only copy.
- `wgpu`, or another native GPU API, is added now as a silent fallback. That pulls Rust and an in-process driver into headless tests. Security blocks that placement for Module 0. Dawn, WebKit, and Naga do not share one WGSL surface. No shader belongs here.
- A bundled Chromium GPU process and an in-process driver differ in sandbox and patch cost. Security and DevOps own that comparison. The later choice stays out of core.

## Verification

The platform facts above were checked on 2026-10-02. No GPU process was run. No Electron, WebView2, WKWebView, WebKitGTK, or wgpu process was started. No adapter was requested and no frame was presented. Frame time, memory, and package size were not measured.

- [gpuweb implementation status](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status), retrieved 2026-10-02.
- [Electron releases](https://releases.electronjs.org/): 44.5.1 on 2026-09-29, Chromium 152.0.7977.130. [Electron 44](https://www.electronjs.org/blog/electron-44-0): macOS 13 or later.
- [WebKit features in Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/), 2025-09-15. [WebKit bug 299237](https://bugs.webkit.org/show_bug.cgi?id=299237), comment 2025-09-21.
- [WebKitGTK 2.54 highlights](https://webkitgtk.org/2026/09/16/webkitgtk-2.54-highlights.html), 2026-09-16. [WebKitGTK 2.54.1](https://webkitgtk.org/2026/10/02/webkitgtk2.54.1-released.html), 2026-10-02, does not mention WebGPU.
- [Tauri Linux graphics issues](https://v2.tauri.app/develop/debug/linux-graphics/), updated 2026-06-15.
- [wgpu README](https://github.com/gfx-rs/wgpu), retrieved 2026-10-02. [wgpu 30.0.1](https://lib.rs/crates/wgpu/versions), 2026-08-22.
- [WebView2 introduction](https://learn.microsoft.com/en-us/microsoft-edge/webview2/) and [Edge versus WebView2 differences](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/browser-features), retrieved 2026-10-02. WebGPU is not in the difference table or the unavailable-platform list.

Not run: Chromium 152 or 154 against the flag-gated Linux and Windows ARM64 rows; `navigator.gpu` inside WKWebView on macOS 26 or 27; a distro WebKitGTK 2.54 build's feature flags.

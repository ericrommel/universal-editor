# Module 0 — 3D / Rendering Review

**Role:** Senior 3D / Rendering Engineer
**Status:** Architecture-preparation input for the Tech Lead. Not an ADR, not an implementation, and not Product Owner approval.
**Date:** 2026-10-02
**Module:** 0 — Engineering Foundation only. No renderer, engine, materials, cameras, or meshes are authorized by this review.

This review recommends the rendering boundary Module 0 should establish, and the desktop GPU consequence the Tech Lead should weigh with security and packaging. It does not implement a spike.

---

## Documents read

Authoritative:

- `AGENTS.md`
- `docs/product-overview.md`
- `docs/engineering/development-process.md`
- `docs/engineering/architecture.md` (intentionally incomplete; topics 3, 4, 5, and 15 are the ones this review answers)
- `docs/modules/module-00-foundation/specification.md`
- `docs/modules/module-00-foundation/test-plan.md`

Context only. The operational Module 0 specification wins on conflict. Nothing here authorizes later modules:

- `docs/archive/product-engineering-specification-v1.0.md` sections 4, 5, 9.1, 9.2, 9.6, 10, 11, and 17

Product constraints that bind the recommendation:

- P-01 / P-05: 2D, 2.5D, and 3D share one scene and object model. They must not become separate editors joined only at the UI.
- P-03: later direct manipulation acts on the visible result, then on the product model. The renderer is not the owner of that manipulation.
- P-04 and archive section 4.3: derived geometry stays attached to editable source data. That relationship is domain state, not a renderer modifier stack.
- P-08 and archive section 4.2: the scene is serializable and independent of the presentation layer and of any one operating system.
- M0-FR-003 and M0-NFR-002: a rendering boundary must exist, and core/domain code must not depend on a desktop shell, a UI framework, or platform GPU APIs.
- M0-NFR-003 and M0-AC-005: core tests run without a graphical window.
- M0-NFR-006: a major technology choice needs a realistic alternative and a reason tied to the product, not familiarity.
- Module 0 scope stops at the boundary. A viewport, scene graph, materials, cameras, and meshes are out of scope. A spike is allowed only as a clearly identified probe and must not become the product renderer.
- Archive section 11: deterministic tests at the lowest practical layer; golden fixtures only when appropriate and reviewed; manual exploratory review remains for visual behavior automation cannot judge. The Module 0 test plan section 9 allows future visual-regression infrastructure as an example and says only infrastructure justified by Module 0 is in scope now.
- Archive section 17 leaves the rendering/GPU abstraction and the desktop strategy open until this preparation work. This review is that rendering input. Packaging and security still have to answer their parts.

---

## Evidence

Facts below were checked against published documents on **2026-10-02**. No Electron, WebView2, WKWebView, WebKitGTK, or wgpu process was launched for this review. Where a behavior was not executed and no vendor sentence states it, the gap is called out.

### Chromium and the current Electron major

- Electron stable on this date is **44.5.1**, released 2026-09-29, with **Chromium 152.0.7977.130** and Node 24.21.0. Supported stable lines are 44, 43, and 42. Electron 45.0.0 is scheduled stable on 2026-10-20 with Chromium 156. Electron 46 is still nightly. Source: [Electron releases](https://www.electronjs.org/releases), retrieved 2026-10-02; [Electron release schedule](https://releases.electronjs.org/schedule), retrieved 2026-10-02.
- Electron 44 requires **macOS 13 (Ventura) or later**. macOS 12 is no longer supported. Source: [Electron 44](https://www.electronjs.org/blog/electron-44-0), 2026-08-25, retrieved 2026-10-02.
- Desktop Chrome stable is ahead of Electron: **154.0.8037.97** for Windows, Mac, and Linux, announced 2026-10-01. Source: [Chrome Releases, 2026-10-01](https://chromereleases.googleblog.com/2026/10/stable-channel-update-for-desktop.html), retrieved 2026-10-02.
- Chromium WebGPU (Dawn) is default on **Windows x86/x64, macOS, and ChromeOS since Chrome 113**. Android coverage is device-specific and is not a Module 0 target. Source: [gpuweb implementation status](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status), page retrieved 2026-10-02. Page metadata reported an edit on **2026-08-13**. Treat the Linux and Windows ARM64 rows as current as of that edit, not as a guarantee that Chromium 152 or 154 changed them.
- Linux WebGPU in Chromium is **partial**, not general:
  - Intel Gen12+ started in Chrome 144 (2026-01-07), using Vulkan for WebGPU while the rest of Chrome stayed on OpenGL. Source: [What's New in WebGPU (Chrome 144)](https://developer.chrome.com/blog/new-in-webgpu-144), 2026-01-07, retrieved 2026-10-02.
  - NVIDIA on Wayland, driver 535.183.01 or newer (Chrome's blog describes this as 2024-05-class drivers), started in Chrome 147. Source: implementation-status wiki above, and [What's New in WebGPU (Chrome 147–148)](https://developer.chrome.com/blog/new-in-webgpu-147-148), 2026-04-22, retrieved 2026-10-02.
  - Other Linux configurations, including the wiki's explicit X11 command line, remain behind `--enable-unsafe-webgpu` plus Vulkan/ANGLE flags. Windows on ARM64 remains behind `--enable-unsafe-webgpu`. Source: implementation-status wiki, retrieved 2026-10-02.
- Shipping a product default of `--enable-unsafe-webgpu` is not an acceptable way to paper over those gaps. The flag name is the project's own signal that the configuration is not the supported default.
- [web.dev's November 25, 2025 post](https://web.dev/blog/webgpu-supported-major-browsers) correctly records the Chrome/Edge 113 milestone and says Linux was still "in progress" at that time. It is **stale for Linux** relative to the Chrome 144/147 notes. Do not use it as the 2026 Linux status.
- This review found no Electron 44 note that disables WebGPU separately from Chromium. Expectation, not a measurement: Electron 44 follows Chromium 152's Dawn defaults. It was not launched here.

### Microsoft Edge WebView2 on Windows

- WebView2 hosts web content with **Microsoft Edge's Chromium engine**. Supported client OS versions are Edge's supported Windows versions. Source: [Introduction to Microsoft Edge WebView2](https://learn.microsoft.com/en-us/microsoft-edge/webview2/), retrieved 2026-10-02.
- WebView2 is multi-process, including a GPU process. Microsoft's performance guidance says hardware acceleration is on by default and should not be disabled except while troubleshooting. Source: [Performance best practices for WebView2 apps](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/performance), retrieved 2026-10-02.
- The WebView2 Runtime moved to a **two-week cadence starting with version 152 (2026-08-28)**, aligned with Edge. Source: [WebView2 Runtime 150.0.4078.44 release notes](https://learn.microsoft.com/en-us/microsoft-edge/webview2/release-notes/runtime/150), retrieved 2026-10-02.
- Edge 154's web platform notes point at WebView2 **Runtime 154.0.4258.31 (2026-09-28)**. Source: [Microsoft Edge 154 web platform release notes](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/release-notes/154), retrieved 2026-10-02. A current evergreen WebView2 is therefore a current Edge/Chromium, not the old fixed runtime from the WebGPU launch year.
- The published [WebView2 versus Edge difference table](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/browser-features), retrieved 2026-10-02, does not list WebGPU among features that are modified or turned off. That is absence from a differences page, not an explicit support statement.
- A 2023 WebView2 Feedback report says `navigator.gpu` works in WebView2 on Windows desktop and fails to produce a device on Xbox. Source: [WebView2Feedback discussion 4138](https://github.com/MicrosoftEdge/WebView2Feedback/discussions/4138), 2023-11-07, retrieved 2026-10-02. This is corroboration that Windows WebView2 was already exposing the API, not a 2026 certification.
- **Not verified:** a 2026 WebView2 process on Windows x64 or Windows ARM64. Windows x64 is expected to follow Edge's default WebGPU-on-D3D12 behavior. Windows ARM64 stays under the Chromium flag limitation above. Enterprise pinned runtimes, GPU blocklists, and remote-desktop/GPU-less sessions can still return no adapter.

### WKWebView and Safari on current macOS

- WebKit shipped WebGPU in **Safari 26.0 for macOS, iOS, iPadOS, and visionOS**. WebKit's wording is that WebGPU supersedes WebGL on those platforms, maps more directly to Metal, and adds compute shaders. Source: [WebKit features in Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/), 2025-09-15, retrieved 2026-10-02.
- The gpuweb status page says WebGPU is **on by default in macOS Tahoe 26, iOS 26, iPadOS 26, and visionOS 26**. Source: implementation-status wiki, retrieved 2026-10-02.
- Safari 26's version number is not sufficient. WebKit's engineer response on bug 299237 is: **`navigator.gpu` requires macOS Tahoe, iOS 26, visionOS 26, or later**. Safari 26 on macOS Sequoia left the feature off. Source: [WebKit bug 299237](https://bugs.webkit.org/show_bug.cgi?id=299237), comment 2025-09-21, retrieved 2026-10-02.
- macOS 27 Golden Gate is reported shipped on **2026-09-14**, with **27.0.1** reported on **2026-09-28**. Reports say it is Apple-silicon only; Intel Macs stay on Tahoe. Sources (press, not an Apple release note opened for this review): [The Verge, 2026-09-14](https://www.theverge.com/tech/994818/apple-macos-27-golden-gate-available-now) and [9to5Mac, 2026-09-28](https://9to5mac.com/2026/09/28/apple-releases-macos-27-0-1-golden-gate-plus-macos-tahoe-26-7-1-and-macos-sequoia-15-8-1/), retrieved 2026-10-02. Tahoe already has system WebGPU, so Intel Macs that can run Tahoe are not automatically excluded from WKWebView WebGPU. Macs that cannot run Tahoe are.
- Safari 27, current as a released WebKit feature set alongside macOS 27, adds WGSL `clip_distances` and fixes several WebGPU limit, shader, and resolve-target bugs. Its WKWebView section adds native hosting APIs. It does **not** say WebGPU is withheld from WKWebView or special to the Safari application. Source: [WebKit features for Safari 27.0](https://webkit.org/blog/18325/webkit-features-for-safari-27-0/), retrieved 2026-10-02.
- Apple's WKWebView documentation describes a WebKit view that renders HTML, CSS, and JavaScript inside the app. It does not offer a supported way to bundle a newer WebKit than the operating system. Source: [WKWebView](https://developer.apple.com/documentation/webkit/wkwebview), retrieved 2026-10-02.
- WebKit's WebGPU is a second implementation, not Dawn. Safari 27's resolved list includes device loss when using render bundles on some GPUs, restored storage-buffer limits, and WGSL validation fixes. The open WebGPU bug list on 2026-10-02 still included canvas-capture and shader-result reports. That is implementation skew, not a claim that current Safari cannot host WebGPU. Sources: [WebKit features for Safari 27.0](https://webkit.org/blog/18325/webkit-features-for-safari-27-0/) and the [open WebGPU bug list](https://bugs.webkit.org/buglist.cgi?component=WebGPU&product=WebKit&resolution=---), retrieved 2026-10-02.
- **Not verified:** `navigator.gpu` inside WKWebView on macOS 26 or 27. The inference is that WKWebView uses the system WebKit, so it gets WebGPU exactly when that OS WebKit does. This review did not find an Apple sentence that separately enables WebGPU for WKWebView, and it did not run a webview.

### WebKitGTK and Tauri on Linux

- Tauri's current v2 graphics note: on Linux, Tauri renders through **WebKitGTK**. Documented failures, most often on NVIDIA, include a blank window, resize crashes, DMA-BUF framebuffer errors, and Wayland protocol errors. Workarounds include disabling the DMA-BUF renderer or disabling accelerated compositing entirely. Source: [Tauri v2, Linux graphics issues](https://v2.tauri.app/develop/debug/linux-graphics/), last updated **2026-06-15**, retrieved 2026-10-02.
- The same page states that **WebGL2 context creation can succeed on a software or slow path with no error**, and that WebKitGTK masks the unmasked renderer string as "Apple GPU", so the page cannot tell which GPU it is on. That is a production-viewport failure mode, not a packaging footnote.
- WebKitGTK **2.54.0** (2026-09-16) replaces the TextureMapper compositor with a Skia compositor and reports real 2D/compositing gains. The highlights do not mention WebGPU. Source: [WebKitGTK 2.54 highlights](https://webkitgtk.org/2026/09/16/webkitgtk-2.54-highlights.html), 2026-09-16, retrieved 2026-10-02.
- WebKit's WebGPU implementation is developed against Metal. The gpuweb status page lists Safari and does not list a GTK or WPE WebGPU port. In October 2023 a WebKitGTK maintainer wrote that WebGPU was not supported on that port and that nobody was working on it ([mailing list archive](https://www.mail-archive.com/webkit-gtk@lists.webkit.org/msg03883.html)). That staffing sentence is **three years old and is not repeated here as a 2026 fact**. What is current is the lack of a shipping announcement in the 2.54 graphics note and the lack of a status-page row.
- GTK/WPE's GPU process for WebGL was enabled in October 2025 and **turned back off by default on 2026-02-05** because it was "not yet ready". Source: [WebKit bug 307065](https://bugs.webkit.org/show_bug.cgi?id=307065) and [commit 306868@main](https://commits.webkit.org/306868@main). The 2.54 highlights do not say this runtime default was restored. **Uncertain:** whether a distro's 2.54 package has since flipped `UseGPUProcessForWebGL` back on. Either way, that flag is WebGL process isolation, not WebGPU.
- Tauri 2's published description still uses WRY: WebView2 on Windows, WKWebView on macOS, WebKitGTK on Linux. Crate metadata shows **2.12.1 on 2026-09-30** and **3.0.0-alpha.4 on 2026-10-01**. Source: [tauri on libraries.io](https://libraries.io/cargo/tauri), retrieved 2026-10-02. Tauri 3 is an alpha and is not a Module 0 foundation. A system webview does not bundle Chromium's GPU stack; Linux GPU behavior is the user's WebKitGTK.

### wgpu as a native path outside the webview

- `wgpu` is a Rust implementation of the WebGPU API. Native backends are **Vulkan, Metal, D3D12, and OpenGL/GLES**. On wasm it targets **browser WebGPU and WebGL2**. It is the WebGPU implementation in Firefox, Servo, and Deno. It is not a scene graph, a windowing toolkit, or an editor. Source: [gfx-rs/wgpu README](https://github.com/gfx-rs/wgpu), trunk retrieved 2026-10-02 (repository activity the same day; README still points release docs at v30).
- Published crate **30.0.1** is dated **2026-08-22**. Source: [lib.rs wgpu versions](https://lib.rs/crates/wgpu/versions), retrieved 2026-10-02. Trunk is ahead of that release. MSRV stated in the README is **Rust 1.87** for the `wgpu` crate and **1.95** to build the repository tests and examples.
- The README states that WebGPU and WGSL are still moving, and that native WGSL goes through Naga while browser WebGPU passes WGSL through to the browser. Native and browser feature sets are therefore not the same thing even inside one library.
- OpenGL/GLES is explicitly best-effort. Metal on macOS and D3D12 on Windows are first-class. Vulkan is first-class on Linux and Windows. That is the useful native Linux path WebKitGTK does not provide.
- Firefox using wgpu does not mean Firefox's platform matrix is wgpu's native matrix. Firefox stable WebGPU is still not the Linux story. Native wgpu-on-Vulkan is a different deployment from Firefox-on-Linux.

### What was not verified

- No GPU process was started. No adapter was requested. No clear color was presented.
- No measurement of frame time, memory, package size, or shader-compile cost.
- No confirmation that Chromium 152/154 changed the 2026-08-13 Linux "other" or Windows ARM64 flag rows.
- No WKWebView test distinguishing Safari.app from an embedded web view on macOS 27.
- No reading of a distro's actual WebKitGTK 2.54 feature flags.

---

## Recommendations

### Decision, short

Lock the **boundary** now. Do not lock a rendering engine, and do not lock Electron versus a native wgpu surface, in Module 0.

1. The product scene stays authoritative. A renderer consumes a platform-neutral **render snapshot**. It does not own a second scene graph.
2. The graphics API the snapshot is shaped for is **WebGPU** (WGSL, explicit resources, compute available later). **WebGL2 is a fallback backend**, not the design center and not a second product.
3. Module 0 depends on a **small Renderer port and a null/headless implementation only**. No Three.js, Babylon.js, wgpu, or Dawn dependency.
4. A GPU clear-color view is **not** production foundation. It is not part of the Module 0 shell.
5. A **Tauri 2 system webview is not an acceptable sole GPU viewport** for Windows, macOS, and Linux together. Windows WebView2 and macOS 26+ WKWebView can host WebGPU with real caveats. Linux WebKitGTK cannot be the product viewport.
6. The two acceptable long-term hosts, to be chosen with security and packaging, are a **Chromium-controlled runtime (Electron)** or a **host-owned wgpu surface with the webview used only as UI chrome**. Rendering prefers the Chromium host for the first real viewport because direct manipulation wants one input and one canvas. That preference is not a Module 0 dependency and is not a license to start either host's renderer now.
7. Prove a system-webview viewport with a **time-boxed spike during Module 0 implementation only if** a proposal still wants the viewport inside WebView2 / WKWebView / WebKitGTK. Otherwise do not spend Module 0 on a GPU probe. Do not write that spike in architecture preparation.

### 1. Where the scene ends and the renderer begins

Archive section 4 and the product overview already define the scene: identity, hierarchy, transforms, visual representation, appearance, animation, modifiers, and enough persistence to reconstruct them. That model is the authority. It must round-trip without a GPU, a canvas, or a window.

The renderer begins at a **render snapshot** (the name is not important; the properties are):

- Plain data. No GPU objects, no UI objects, no handles into Three.js, Babylon, or wgpu.
- Derived for one frame. Hierarchy, visibility, and modifier evaluation have already happened.
- One list that can describe both flat visual items (shape, text, image, stroke) and spatial items (mesh, curve tessellation, later lights and cameras). Screen-space and camera-space are drawing modes on items in that list, not two editors.
- Viewport size in **physical pixels**, plus the device-pixel ratio and CSS size that produced them, so the renderer does not invent a scaling policy.
- A clear color tagged with an explicit color space. Module 0's only legal tag is **sRGB**.
- Stable object ids on drawable items so a later hit test can return an id. The editor maps the id back to the scene. The renderer does not select, transform, undo, or save.

The renderer owns, once a real backend exists:

- device, surface or offscreen target, pipelines, GPU buffer cache, frame submission;
- rebuilding that cache after device loss from the next snapshot;
- optional picking that returns ids.

The renderer does not own:

- parent/child hierarchy, transforms as authority, materials as authority, cameras as authority;
- undo, persistence, tool state, or derived-geometry lifetime;
- a retained scene that can be edited in place.

GPU resource caches keyed by stable ids are allowed later. They are a cache. Dropping them on device loss must recreate the picture from the snapshot alone. If the picture cannot be recreated, the cache has become a second authority.

**Geometry stays testable without a GPU.** Curve-to-tube, extrusion, and other derived meshes from later modules are CPU data produced from source objects, then referenced by the snapshot. They are not the side effect of a Three.js modifier or a compute shader that has no CPU oracle. The renderer draws the tessellation. It does not become the only place the tessellation exists. This is what keeps P-04 and headless core tests compatible with a real viewport later.

**Direct manipulation, later, writes the scene and then the snapshot.** A drag does not mutate renderer state as the source of truth. Module 2 is out of scope here; the boundary has to leave room for it. Hit testing is either math against snapshot bounds/meshes on the CPU, or a pick buffer that returns ids. Both return control to the editor. A renderer-owned gizmo graph does not.

### 2. Technology direction

#### Preferred API shape: WebGPU primary, WebGL2 fallback

Use WebGPU as the API the snapshot is aimed at, on the web and in any Chromium desktop host.

Why this is the product fit, not a trend:

- One explicit GPU model covers the web target and a desktop Chromium target without a second scene graph. Dawn in Chromium and wgpu on the native/wasm side both speak that model. The product binds to the **API shape**, not to Dawn or wgpu as a Module 0 library.
- Compute shaders are part of the model. Module 6 lighting and any later tessellation acceleration can use them. WebGL2 cannot. Choosing WebGL2 as the primary design means a second shader language the moment a WebGPU path exists.
- A single canvas is one coordinate space for later direct manipulation: one device-pixel ratio, one pointer path, one pick target. That matters more to this product than a smaller webview binary.
- The core never imports the API. Tests construct a snapshot and hand it to the null renderer.

WebGL2 remains the **fallback backend** for blocked adapters, GPU-less sessions, and browsers or webviews where WebGPU is absent or still flagged. Fallback rules:

- Same snapshot in, fewer capabilities out. Missing compute or a missing limit is a reported capability, not a silent visual approximation that tests treat as success.
- Features that truly require compute declare that. They do not pretend WebGL2 parity.
- WebGL2 does not define the snapshot. No WebGL enums, no implicit global state, no `THREE.Material` objects in the contract.
- Module 0 implements neither backend.

**Trade-off.** WebGPU coverage is not universal in October 2026. Linux Chromium is still rolling out by vendor. Firefox on Linux is not shipped as stable WebGPU. Safari's implementation is a second codebase with its own bugs. A WebGL2 fallback is mandatory for the web product if the PO wants those clients supported. Maintaining two backends is real later cost. It is still cheaper than letting WebGL2's implicit state become the scene architecture, and cheaper than discovering in Module 1 that the "portable" path was a framework scene graph.

**Rejected as the primary design: WebGL2 everywhere, including WebKitGTK, until WebGPU is boring.** Maximum compatibility on paper, including today's Linux webview. It does not fix WebKitGTK's silent software path, it cannot host compute, and it splits shader authoring from any future native wgpu/WebGPU path. Compatibility is the fallback's job.

#### Realistic alternative: native wgpu behind UI chrome

A Rust host owns a wgpu surface (Vulkan, Metal, or D3D12). The system webview draws chrome only: panels, inspectors, menus. The viewport is not a `<canvas>` inside WebKitGTK or WKWebView.

This fits the product if, and only if, the host obeys the same snapshot:

- wgpu's render pass is not the scene. Firefox's choice of wgpu is evidence the library is a real WebGPU implementation, not evidence it should store parent pointers.
- The web build can later use wgpu compiled to wasm on browser WebGPU, with the library's WebGL2 backend as the fallback. Native Naga and browser WGSL will differ; the shader subset has to be the intersection, and that subset is chosen when shaders exist, not in Module 0.
- Linux Vulkan is the first native path that is actually a GPU strategy on Linux. WebKitGTK is not.
- Derived geometry still comes from the core. wgpu buffer uploads are a cache.

**Trade-offs.**

- Direct manipulation gets harder, not easier. A native child surface under or beside a webview splits hit testing, keyboard focus, IME, accessibility, DPI, and occlusion. Module 2 would pay that cost on day one. A single Chromium canvas does not.
- It forces a Rust GPU component even if the Tech Lead chooses TypeScript for the shell and the core. That is a language-boundary decision, not a rendering detail. The null renderer used by headless tests must not require Rust or a GPU crate.
- Window embedding, swapchain lifetime, and lost-device recovery are a viewport product. Module 0 must not start them.
- wgpu's own README says the native WGSL translator and the browser's WGSL compiler are different. "One library" is not automatically one set of bugs.
- In-process GPU drivers are a different trust boundary from Chromium's GPU process. That trade belongs to the Application Security Engineer. It is not a reason to pretend the native path is free, and it is not a reason to reject it before security reviews it.
- Package size and memory go down relative to bundling Chromium; engineering time moves earlier. For a product whose first hard interaction problem is direct manipulation in one space, rendering does **not** prefer to pay the embedding cost before a Chromium canvas has been rejected on security or packaging grounds.

Dawn as a separate native library is not a third option worth adopting. Inside Electron, Dawn is already the WebGPU implementation. Linking Dawn again beside a webview duplicates the stack.

#### Rejected as the product renderer: Three.js or Babylon.js

Both are capable WebGPU renderers. WebKit's Safari 26 note lists both as libraries that run on Safari's WebGPU. Babylon's render bundles are a legitimate WebGPU performance technique. That is an argument for studying their **draw submission** later, not for adopting their scene.

Three.js keeps authority in `Scene` / `Object3D`: parent pointers, matrix update, cameras, lights, and materials are the engine's objects. Babylon keeps authority in its own scene, engine, and asset containers. Controls and gizmos mutate those graphs directly. The moment a drag, a material edit, or a curve-to-tube lives there, the product has two scenes. Persistence, undo, and headless tests then have to scrape an engine, which violates archive section 4.2 and M0-NFR-003.

Using either engine as a **disposable cache** behind the Renderer port is possible: build engine objects from the snapshot, throw them away on device loss, never run their controls against the engine graph. People do this. The trade-off is constant pressure in the wrong direction. Helpers, inspectors, and examples all assume the engine scene is real. The first cube is fast; the second scene graph arrives as a convenience. Module 0 should not take the dependency "so the boundary looks real."

Further trade-offs if someone proposes them anyway at a later module:

- They do not remove the Linux WebKitGTK problem if the canvas is still inside that webview.
- Three.js maintains a WebGPU renderer and a WebGL renderer with historically uneven feature parity. That is two engines plus the product scene.
- Babylon is a larger runtime than this product needs in order to draw a snapshot.
- Text, widgets, and 2D drawing tend to fall out into DOM/CSS while meshes stay in the engine. That split is how unified 2D/3D quietly dies. The snapshot's one draw list is the countermeasure.

**Not recommended** as the product renderer. **Not allowed** as a Module 0 dependency. A later, explicitly labeled probe may implement the Renderer port with Three.js only to compare draw cost, then be deleted. That probe is not Module 0 work and is not authorized by this review.

### 3. Module 0 dependency and the clear-color probe

Module 0 needs a boundary that core tests can touch without a GPU. It does not need a viewport.

**Depend only on a Renderer port plus a null/headless implementation.**

Language-neutral contract:

- A snapshot value type lives where UI and GPU libraries are not imported. Core/domain does not depend on the renderer. In Module 0 there is no scene yet, so core tests do not need to reference the snapshot at all.
- The port's null implementation accepts a snapshot and returns a data result: backend `null`, device `not-requested`, the physical pixel size, the sRGB clear color, and the draw-list length. It stores the last snapshot for the test. It does not open a window, load a dynamic library, or request an adapter.
- The result type **reserves** a device status of `lost`, which the null implementation never emits. Reservation is the contract. Recovery is not.
- An integration check shows the null renderer is callable without the desktop shell and is not imported by core. That is the M0-FR-003 / M0-AC-006 evidence for this boundary. It is a test of dependency direction, not a picture.

**Against a GPU clear-color probe as production foundation.** A colored canvas or a CSS background in the shell does not prove WebGPU, and it will be mistaken for the start of a viewport. Module 0's shell is there to prove the toolchain (M0-FR-001), not to present frames. Do not put a `<canvas>` in the production shell in order to clear it.

**Against a GPU clear as a required spike.** See the desktop section for the only case that justifies a probe. If that case does not apply, skipping the probe is the recommendation, not unfinished work.

### 4. Desktop consequence

| Host | Windows viewport | macOS viewport | Linux viewport | Verdict for this product |
| --- | --- | --- | --- | --- |
| Tauri 2 system webview (WebView2 / WKWebView / WebKitGTK), canvas in the webview | WebGPU expected on x64 evergreen WebView2. ARM64 still flagged in Chromium as of 2026-08-13. Not executed here. | WebGPU only when the OS is Tahoe 26 or Golden Gate 27. Implementation is WebKit/Metal, not Dawn. Not executed here. | No shipped WebGPU. WebGL can succeed and still be the wrong GPU. Documented DMA-BUF and compositing failures. | **Not acceptable as the only GPU viewport.** |
| Electron 44 (Chromium 152, Dawn) | WebGPU default on x64. ARM64 uncertain / flagged. App owns the Chromium version. | WebGPU via bundled Chromium on macOS 13+, including machines whose system WebKit has no WebGPU. | WebGPU only on the configurations Chromium has enabled (Intel Gen12+, NVIDIA Wayland with a new enough driver). Not all Linux GPUs. | **Preferred viewport host** if security and packaging accept a bundled Chromium. |
| wgpu surface owned by a Rust host; webview is chrome only | D3D12 / Vulkan, independent of WebView2. | Metal, independent of the OS WebKit version, within the host's own OS minimum. | Vulkan, which is the point of this option. | **Acceptable alternative** if bundled Chromium is rejected. Do not build it in Module 0. |

**Do not treat "desktop is a webview" as decided by rendering.** Desktop is a first-class target, and the project overview allows native capability where it helps. Rendering's bar is reliable GPU presentation on Windows, macOS, and Linux for later modules. A system webview meets that bar on one and a half of the three desktops, not on three.

**Chromium-controlled host, preferred.** Electron 44 already contains Dawn. The web app and the desktop viewport can share one WebGPU backend family and one pointer/canvas path. Direct manipulation and unified 2D/3D both want that single surface. The cost, which this review does not waive, is Chromium's binary size, memory, and security-update cadence. Chrome 154's own late-September 2026 stable updates included GPU and WebGPU memory-safety fixes. Bundling Chromium means following Electron security releases on purpose. That is a DevOps and security requirement, not a reason to choose WebKitGTK instead.

Electron does **not** make Linux WebGPU universal. Record that as a known limitation if Electron is chosen. The fallback on unsupported Linux GPUs is WebGL2 inside the same Chromium, with an explicit capability report when `requestAdapter()` fails. It is not a switch back to WebKitGTK.

**Native wgpu behind the UI, acceptable if Chromium is rejected.** The webview can then be Tauri or another system webview because it no longer has to present the scene. Linux uses Vulkan. macOS uses Metal and is not stuck on the Tahoe WebGPU gate. The web product still needs the snapshot rendered by browser WebGPU or WebGL2. Do not implement wgpu, a child HWND/NSView/GTK surface, or input forwarding in Module 0. Choosing this direction in an ADR is allowed; taking the dependency is not.

**System webview as the viewport, rejected as an assumption.** It may still be proposed for security or package size. If it is, the proposal must say plainly that Linux does not have a production GPU viewport, and the PO must accept that limitation. Rendering does not recommend the PO accept it. WebGL2-on-WebKitGTK with a silent software rasterizer is not "Linux support" for a spatial editor.

**What to lock now versus what to spike**

Lock in the architecture proposal, before READY FOR DEVELOPMENT:

- snapshot boundary and dependency direction;
- no Three.js, Babylon.js, wgpu, or Dawn in Module 0;
- no GPU pixel gate in Module 0;
- system-webview-only GPU is not the assumption.

Do **not** lock Electron versus wgpu in this review. The Tech Lead locks that only together with the security and packaging reviews. Rendering's rank is Chromium first, wgpu-behind-UI second, in-webview system webview last.

Spike rule, from the Module 0 specification: a probe must be labeled a probe and must not become the renderer.

- If the leading shell **does not** put the future viewport in the system webview, **do not run a GPU spike** for Module 0. The null renderer is enough evidence for this module. Absence of a clear-color demo is not a gap.
- If the leading shell **does** put the viewport in WebView2, WKWebView, or WebKitGTK, a time-boxed probe during Module 0 implementation is required before anyone calls that shell GPU-capable. One machine class per OS. Record `navigator.gpu`, whether an adapter exists, whether a clear or a single triangle is visible, the reported pixel ratio, and the canvas color space. Linux WebKitGTK failure is an expected possible result and is recorded as failure. The probe is not in CI, is not a golden image, is not linked from core tests, and is removed or quarantined afterward. **Do not write it during architecture preparation.**
- A native wgpu clear has the same rule. Optional, labeled, not a foundation, not required for TESTS GREEN.

### 5. Visual regression

Two different pictures get conflated. Keep them apart.

**Shell screenshots** are pictures of chrome: window, typography, spacing. The Module 0 shell may need a manual screenshot in a design or PO package. That is design evidence. It does not validate rendering, because the shell has no viewport. Do not add an automated screenshot-diff tool in Module 0. The test plan already treats visual-regression infrastructure as future, and section 9 says not to build infrastructure this module does not need.

**Canvas or GPU goldens** are pictures of the scene. They are deferred until a module actually draws a scene. When they arrive:

- Scene correctness is a CPU test on the snapshot and on derived geometry: counts, ids, transforms, tessellation samples. Those are exact and headless.
- A GPU image is supplementary. Anti-aliasing, driver interpolation, and color management make pixel diffs flake. Flaky GPU pixel tests are not a Module 0 requirement and should not become a required CI gate later just because a viewport exists.
- If a later test plan wants image comparison, prefer a small offscreen readback on a pinned GPU runner, with an explicit tolerance and an explicit update review (archive section 11). Do not screenshot the whole desktop window and diff it.
- Full-window captures mix UI chrome, DPI scaling, and the viewport. They are a poor oracle for the renderer.

**Module 0 sets up:**

- The null renderer test: given a snapshot, the recorded physical size, sRGB clear, and empty draw list match. Data, not pixels.
- A written note, in the architecture doc the Tech Lead owns, that GPU goldens are deferred. This review is that note's source. Do not add a harness, a baseline image, or a tolerance constant "so we have a place to put them."

**Module 0 does not set up:** image diff tooling, a GPU runner, baseline PNGs, perceptual hash thresholds, or a requirement that the shell look pixel-identical across platforms. M0-NFR-008 already says cross-platform is not pixel-identical.

### 6. Cross-platform rendering risks

**Linux WebKitGTK.** The largest platform risk. No evidence of shipped WebGPU. WebGL context creation is not evidence of a GPU. DMA-BUF and compositor failures are documented by Tauri in June 2026. The webview version is the distro's, so two supported Linux machines can differ by more than the app's code. A product viewport on Linux needs either Chromium's Dawn, with the vendor limits in the evidence section, or native Vulkan via wgpu. It does not need another WebKitGTK flag.

**Color space.** macOS displays are often Display P3. A WebGPU canvas left on the default color space will not match a Windows sRGB desktop, and Safari 26 specifically added HDR image presentation inside a WebGPU canvas. wgpu's native backends do not implement the same extended color spaces either. Module 0 does not build a color pipeline. The snapshot tags the clear color as sRGB so a later backend cannot claim "unspecified" and do something different per OS. Wide gamut and HDR are a later product decision. Until that decision, the framebuffer intent is sRGB, and backends convert explicitly rather than inheriting the monitor profile by accident.

**Device pixel ratio.** The bug is using CSS pixels as framebuffer pixels. Retina (typically 2), Windows fractional scaling (1.25, 1.5, 1.75), and mixed-DPI multi-monitor setups all produce blurry or wrongly sized viewports, and they break hit tests that mix the two spaces. The snapshot stores physical pixels and the ratio used to compute them. The shell, not the renderer and not the core scene, reads `devicePixelRatio` and resize events. Core transforms stay in scene units. Module 0's null test can pass a fractional ratio and assert the physical size so the policy exists before a window does. Cap the backing-store size later; do not invent the cap now.

**Lost device.** The WebGPU specification loses the device, resolves `GPUDevice.lost`, and invalidates objects created from that device. Reasons include driver resets (Windows TDR), sleep, unplug of an eGPU, and implementation faults. WebGL's equivalent is `webglcontextlost`, which is a different event and another reason not to let WebGL own the architecture. The user's scene must not be in that lost state. Recovery is: mark the GPU cache dead, keep the snapshot, create a new device, upload again. The port reserves the `lost` status so later code has a place to report it. Module 0 does not simulate TDR and does not implement recovery. Swallowing a failed `requestAdapter()` and presenting a blank view is not a plan; when a real backend exists, adapter failure is a visible diagnostic. That diagnostic is not a Module 0 startup requirement beyond not painting a fake success.

Related risks the same boundary has to leave room for, without building them:

- GPU blocklists and CI machines with no GPU. This is why the null backend is the Module 0 default, not a software rasterizer pretending to be a device.
- Shader skew between Dawn, WebKit/Metal, and Naga. Later shaders target the intersection. No shader assets in Module 0.
- Chromium's GPU-process sandbox versus an in-process wgpu driver. Security owns the comparison. Rendering's only constraint is that neither choice leaks into core.
- Presentation versus authoring. Export and offscreen render, much later, must be able to consume a snapshot without a visible swapchain. The null renderer is that seam. Do not add an export target.

---

## Module 0 implications

### Build

- A rendering boundary whose production code is a port and a null implementation. Minimal, as M0-FR-003 allows.
- A plain snapshot type sufficient to prove the contract: physical viewport size, device-pixel ratio, sRGB clear color, empty draw list, stable-id field reserved and unused.
- A result type with backend `null`, device `not-requested`, and a reserved `lost` status that tests show the null path does not emit.
- A headless test that feeds a snapshot, including a fractional device-pixel ratio, and checks the recorded result. No window, no GPU, no image.
- A dependency-direction check: core does not import the renderer; the null renderer does not import UI, a desktop shell, Three.js, Babylon.js, or wgpu.
- Architecture text, written by the Tech Lead, that records this boundary and the desktop rank. This review does not edit `architecture.md` and does not add an ADR.

### Do not build

- A WebGPU or WebGL context, shader, pipeline, mesh, camera, light, or material.
- A Three.js, Babylon.js, wgpu, Dawn, or other rendering-engine dependency.
- A production clear-color canvas in the shell.
- A GPU spike, unless the Tech Lead separately adopts a system-webview viewport and then only as a labeled probe during implementation. Not during this preparation task.
- A native child window, swapchain, or input-forwarding layer.
- Screenshot diffing, GPU golden images, baseline PNGs, or a GPU CI runner.
- A software rasterizer "so tests have pixels."
- Scene-graph types inside the renderer. Hierarchy stays in the future core scene, which Module 0 also does not implement as a product scene graph.
- Performance thresholds or a benchmark harness. No reference viewport workload exists yet. Archive section 10 says not to invent numeric targets without one.

### What later modules inherit

Module 1's first cube and first 2D primitive are two items in one snapshot, produced from one scene. They are not a Three.js mesh plus a CSS shape. Module 2's manipulators write scene transforms and publish a new snapshot. Module 5's extrusion updates CPU derived geometry and then the snapshot. The renderer implementation can wait until the first module that must show pixels, and it still sits behind this port.

---

## Risks, assumptions, PO decisions, open questions

### Risks

| Risk | Why it is real | What Module 0 does about it |
| --- | --- | --- |
| Tauri is chosen for size and security, and Module 1 discovers Linux cannot host the viewport. | WebKitGTK has no shipped WebGPU, and WebGL there can lie about the GPU. | Reject that assumption now. If it remains the leading shell, require the labeled spike before calling it GPU-capable. |
| The first visible cube is implemented as a Three.js or Babylon scene. | Both engines are designed to be the authority. Convenience becomes the second scene graph. | No engine dependency in Module 0. Snapshot is the only render input. |
| Core tests start requiring a GPU "just for the clear." | CI agents often have no GPU or a different GPU. Pixel tests flake. M0-NFR-003 forbids a window for core tests. | Null renderer only. No GPU golden gate. |
| CSS pixels are baked into the future scene camera. | Fractional DPI then breaks both sharpness and picking. | Snapshot stores physical pixels now, in data only. |
| Device loss is handled by keeping the only copy of geometry on the GPU. | WebGPU invalidates device objects on loss. | Derived geometry is defined to live in CPU scene data. `lost` is reserved on the result type. |
| Electron is treated as "WebGPU everywhere," including every Linux GPU and Windows ARM64. | Chromium's own status page still has flag-gated rows as of 2026-08-13. | Record the limitation. Do not enable unsafe WebGPU flags as the product fix. |
| wgpu is added in Module 0 "so the native path is real." | That pulls Rust, a window, and drivers into a module that must test headless. | Port plus null only. Native host stays an ADR-level option. |
| Bundled Chromium's GPU sandbox bugs become the app's patch burden, or in-process wgpu makes driver bugs the app's process. | Both are real and different. Chrome's September 2026 updates still include GPU/WebGPU memory-safety fixes. | Hand both to security and DevOps. Do not pick a host by ignoring either cost. |
| Dawn, WebKit, and Naga disagree on a WGSL feature the first shader uses. | All three document ongoing shader and limit bugs. wgpu's README says native and browser WGSL paths differ. | No shaders in Module 0. Later, target the intersection. |

### Assumptions

- Module 0's shell is not a viewport and does not need to paint a scene to be accepted.
- The web target remains in scope, so a native-only renderer with no snapshot path back to browser WebGPU/WebGL2 would violate P-08.
- Core/domain stays free of GPU types for the life of the architecture, not only for Module 0.
- "Reliable GPU" means a hardware adapter and a presented frame on supported desktop GPUs, or a **visible** fallback. A successful WebGL context on a software rasterizer does not count.
- The Tech Lead will write the ADR and the architecture text. This file is input.
- Support matrices move. The Linux Chromium rows and the Windows ARM64 row are the most likely to be stale after 2026-08-13. They were not re-measured on hardware.
- WKWebView tracks system WebKit. That is an inference from Apple's WebKit-view model plus the Tahoe gate on `navigator.gpu`, not from a test.
- No numeric frame budget is assumed. None should be invented in Module 0.

### PO decisions

These are product decisions. Rendering recommends a default and does not make the call.

1. **Linux GPU bar.** The product overview names Linux as a target. Confirm that a later desktop viewport must actually use a GPU on Linux, and that a silent WebKitGTK software path is not accepted as Linux support. Rendering recommends confirming that.
2. **Desktop runtime size versus GPU ownership.** Accept a bundled Chromium (Electron-class) as the desktop viewport host, or reject it and accept a native wgpu surface behind a smaller webview. Rendering prefers bundled Chromium for one canvas and one input path, and accepts wgpu if security or packaging rejects Chromium. Rendering does not accept the system webview as the viewport on all three desktops.
3. **If a system webview is still proposed:** accept an explicit platform cut. WebGPU in WKWebView requires macOS 26 or later. WebGPU in WebView2 is the Windows x64 expectation, not a Windows ARM64 promise. Linux would be outside the viewport claim. That cut conflicts with the written platform vision, so it needs an explicit PO decision rather than an implementation surprise.
4. **Web fallback.** Decide, before the first viewport module and not necessarily in Module 0, whether browsers without WebGPU are supported through a degraded WebGL2 path or are unsupported. Rendering recommends supporting them as degraded, with the capability visible, and not designing the snapshot around them.
5. **Spike authorization.** A GPU probe is not required for Module 0. Authorize one only if the chosen shell puts the viewport in the system webview. It stays a probe.

### Open questions

- Did Chromium 152 or 154 move AMD, X11, or Windows ARM64 WebGPU off the flag path after the 2026-08-13 wiki edit? Unknown here. Do not guess yes.
- Does WKWebView on macOS 27.0.1 expose the same WebGPU limits as Safari 27? No Apple statement found that splits them. Not executed.
- Has any distro WebKitGTK 2.54 build turned the GPU process back on for WebGL, and does any build expose `navigator.gpu`? The 2.54 announcement does not say so. A spike is the way to answer this, and only if option 3 above is still alive.
- CPU pick versus GPU pick ids for Module 2. Either can sit on the snapshot. Decide before direct manipulation, not now.
- Who owns text and stroke tessellation when those modules arrive? This review assumes CPU domain code produces the drawable, and the renderer only samples it. The Core and 2D engineers should confirm that before any engine is allowed to tessellate as a side effect.
- sRGB authoring values versus a later linear lighting pipeline. Module 0 tags the clear as sRGB. It does not decide material color management.
- Whether the desktop host language is Rust. If it is not, the wgpu alternative is a native boundary, not an import inside the UI package. The null renderer stays in the language of the headless tests either way.

### Module 0 build / do not build

Build the port, the null renderer, the physical-pixel / sRGB snapshot fields, the headless data test, and the dependency-direction check. Do not build an engine, a canvas, a spike, a golden image, or a native surface. The full lists are under **Module 0 implications** above. That is the whole rendering scope of this module.

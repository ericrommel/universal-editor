# Editor and UI Boundary — Module 0 Preparation Review

## Role and status

| | |
|---|---|
| Role | Senior 2D / Editor Engineer |
| Document | Architecture-preparation input for the Tech Lead |
| Status | Draft recommendation. Not an ADR. Not approved architecture. |
| Date | 2026-10-02 |
| Scope | Module 0 editor/application boundary, UI boundary, and the seam where chrome stops and the render surface starts |
| Changes to requirements | None. This review does not add, remove, or reinterpret acceptance criteria. |

Module 0 does not implement the visual editor. This review describes the smallest editor and UI structure that proves dependency direction for a long-lived, accessible editor with a separate render surface. It is not a design for tools, selection, panels, or drawing.

The Product Designer owns visual design, information architecture, and interaction design. This review owns the engineering boundary that keeps those decisions possible. The Tech Lead owns the architecture document and ADRs. Core/domain, rendering technology, desktop packaging, and persistence remain with their owners; this review only states the contracts the editor and UI need from them.

Where the archived specification and the operational Module 0 specification differ, the operational specification wins. Archive modules 1–3 are context for what the boundary must not block. They are not authorization to build those modules.

---

## Documents read

- `AGENTS.md`
- `docs/product-overview.md`
- `docs/engineering/development-process.md`
- `docs/engineering/architecture.md` (intentionally incomplete; required topics 2, 7, and 14 are the ones this review answers)
- `docs/modules/module-00-foundation/specification.md` (authoritative Module 0 scope)
- `docs/modules/module-00-foundation/test-plan.md`
- `docs/archive/product-engineering-specification-v1.0.md` sections 4, 5, 9.1–9.4, and 17, as long-term context only

Operational requirements this boundary must satisfy:

- M0-FR-001, M0-FR-002, M0-FR-003, M0-FR-006, M0-FR-009
- M0-NFR-002, M0-NFR-003, M0-NFR-006, M0-NFR-007, M0-NFR-008
- M0-AC-002, M0-AC-005, M0-AC-006, M0-AC-012
- TP-M0-F-002, TP-M0-I-001, TP-M0-I-002, and the design-verification notes in the test plan

Product constraints that shape the boundary, without pulling their features into Module 0:

- P-01 unified visual space, P-02 progressive complexity, P-03 direct manipulation, P-06 simple by default, P-08 project model independent of the shell
- Archive section 4: the scene is serializable without the active UI
- Archive 9.2–9.4: later selection, viewport manipulation, undo, shapes, text, and images must cross the same boundaries rather than grow a second scene inside the UI

---

## Recommendations with alternatives and trade-offs

### 1. UI framework: React for chrome, not for the frame

**Recommendation.** Use React, client-only, as the framework for the application shell and future editor chrome. Put it in one UI package. Do not use React to store the scene, schedule frames, or draw the viewport.

React is recommended because the long-lived cost of this product is accessible application chrome around an imperative render surface, not widget rendering speed. Menus, dialogs, inspectors, object lists, text fields, and contextual controls need focus order, keyboard behavior, and ARIA semantics that outlive any one module. React's client model plus `useSyncExternalStore` is a concrete seam: React can subscribe to an external editor snapshot without becoming the owner of that snapshot. The viewport never needs that subscription to paint a frame.

This is not a recommendation to adopt Next.js, React Server Components, or a third-party design system in Module 0. Those are different decisions and are rejected below.

**Where React stops and the rendering boundary starts.**

```text
Platform host (browser tab or desktop webview)
  renders once into a document
        │
        ▼
UI package (React)
  application frame, landmarks, startup/failure text,
  future contextual chrome
  creates one empty viewport host element
  calls editor.attachViewport(element) from a mount effect
  subscribes only to coarse editor snapshots
        │  handoff is imperative; React does not retain the frame loop
        ▼
Editor + rendering boundary
  owns the surface, requestAnimationFrame or equivalent,
  resize observation, GPU/canvas commands, and viewport
  input listeners
  pulls core read models on its own schedule
        │
        ▼
Core / domain
  no React, no DOM, no frame loop
```

React's responsibility ends at the host element. It may create that element, destroy it on unmount, and lay chrome out around it. The rendering boundary starts inside `attachViewport`. From that call on, frame scheduling, surface resize, drawing, and viewport pointer listeners belong to editor/rendering code.

Rules that keep the framework off the frame path:

- The viewport host component receives a stable editor client, not scene objects and not per-frame state. Its React render runs on mount and if that client identity changes. It does not run because a frame was drawn.
- The frame loop lives in the rendering package. It must not call `setState`, dispatch into React, or replace the canvas element to present a frame.
- Size changes are observed on the host element and applied to the surface imperatively. A layout change is not a reason to recreate the surface, and it is not a React state update unless chrome layout itself changes.
- Future transform readouts and drag previews update from the gesture or the renderer, not from a React subscription on pointer-move. Chrome snapshots publish on discrete editor commits: startup, failure, and later selection, tool, and panel changes.
- Future manipulators (handles, guides, highlights) are drawn by the renderer into the same surface. They are not HTML nodes repositioned by React every frame. DOM remains the right place for real text editing, menus, dialogs, and other accessible controls.
- Viewport input listeners are registered by the editor/rendering adapter on the host element. React synthetic handlers are not the manipulation path. Module 0 registers no tools; it only places listener ownership on the editor side of the boundary so later modules do not grow an `onPointerMove` set-state loop.

A Module 0 `ViewportHost` is a mount node and an effect. If its render count increases once per frame while a probe pumps frames, the boundary is wrong.

**Rejected variant of React.** Do not build the shell as a Next.js or other server-rendered application. This product is a long-lived client editor, including desktop hosts. Server components, file-system routing, and a mandatory Node server couple the shell to a website deployment and fight a headless core. A client bundle hosted by a thin web app and, separately, a thin desktop webview is enough.

**Do not adopt a component library in Module 0.** React Aria, Radix, and Ariakit are realistic later choices for accessible widgets and are a reason React stays attractive. Choosing one now would freeze visual opinions that belong to the Product Designer and would add a dependency the shell does not need. Module 0 chrome is semantic HTML plus the design tokens the Designer actually requires.

#### Alternative A — Solid (serious alternative)

Solid is the realistic alternative if the Tech Lead optimizes for fine-grained DOM updates and a smaller runtime instead of the accessible-widget ecosystem.

| | React chrome | Solid chrome |
|---|---|---|
| Fit for accessible, long-lived chrome | Strong. Mature accessibility libraries and testing patterns for dialogs, menus, lists, and focus. Not used in Module 0, but the chrome will need them. | Adequate, not equal. Kobalte is a real headless kit, with a smaller surface and fewer maintained patterns for a multi-year editor. |
| Risk of drawing the scene in the UI framework | High unless imports and tests forbid it. React's render model makes "put the scene in state" feel natural. | Also real. A scene signal read during a component's tracking scope will subscribe chrome to document changes. The syntax makes the mistake quieter. |
| Per-frame cost when the boundary is respected | Negligible. Chrome renders on discrete snapshots, not on frames. | Also negligible. Solid's advantage appears only if chrome subscribes to high-frequency values, which this review forbids. |
| External editor store | `useSyncExternalStore` is the supported seam. | `createSignal` / store adapters work, but the editor store must stay outside Solid for the same headless-test reason. |
| Shared web + desktop package | Ordinary client components, no server assumption. | Equally hostable in a webview. |
| Contributor and agent consistency over years | Predictable component model. | Smaller pool and more compiler-specific failure modes. |
| Bundle size | Larger runtime. Irrelevant next to a GPU viewport, relevant to cold web start. | Smaller runtime. A real web-startup benefit, not an editor-architecture benefit. |

Trade-off. Solid is the better framework if most "UI" work is binding frequently changing values straight into the DOM. That is the wrong shape for this product. Direct manipulation belongs on the render surface. Chrome should update when the editor commits a coarse snapshot. Under that rule, Solid's reactivity does not pay for its smaller ecosystem. React's cost is discipline: core and editor must be unable to import it, and the viewport host must not take scene data as props.

Solid remains the fallback if the PO or Tech Lead rejects a React-based chrome. The package split, editor store, and render handoff in this review stay the same. Do not mix both frameworks.

#### Alternative B — Svelte

Svelte 5 runes can express the same chrome. It is a weaker fit here. The UI package would be `.svelte` single-file components, which are harder to keep as a plain library consumed by unrelated hosts. SvelteKit's defaults (routing, SSR, site structure) pull toward a website. This editor does not need routes or a server to show a shell. The accessibility-widget bench is thinner than React's. No offsetting gain once the frame loop is outside the framework.

#### Alternative C — Vanilla for the whole shell

Vanilla DOM is the right tool inside the rendering boundary. It is the wrong product strategy for chrome. A long-lived editor's focus traps, menus, lists, and contextual controls become an unowned framework. Module 0 would look simpler and would teach the wrong boundary: everything imperative, including the parts that must stay accessible HTML. Reject vanilla as the shell framework. Require imperative code for surface attach, frames, resize, and viewport listeners.

#### What would falsify this recommendation

Revisit React if the approved desktop strategy cannot host one web UI package and a canvas surface in the same view, or if the PO requires native widget toolkits per operating system. In that case the chrome framework decision is open again. Do not keep React for the web and rewrite the editor in AppKit, WinUI, or GTK.

---

### 2. Editor state: three owners, one command direction

**Recommendation.** Keep three kinds of state in three places. Cross them only through a small editor client and explicit commands. The editor package is plain TypeScript (or the language the Tech Lead chooses for application logic) and does not import React.

| State | Owner | Examples | Module 0 |
|---|---|---|---|
| Domain / scene | Core | Identity, hierarchy, transforms, appearance, persistence. Serializable without a UI. | A runtime entry point core tests can construct. No scene graph, no objects. |
| Editor session | Editor package | Later: selection, active tool, contextual surface id, viewport-attached flag, in-progress gesture. Not document content. | Startup and viewport attach only: `starting`, `ready`, `failed`, `detached`, `attached`. |
| Ephemeral UI | UI package, inside the component that needs it | Menu open, hover, focus within a dialog, tooltip, uncommitted text in a field. | Nothing beyond what the shell component needs locally. No store. |

**Rejected placement.** Selection and active tool are not domain data by default. They are not properties of a universal object. Archive section 4's object model has no slot for "selected" or "current tool", and the scene must serialize without the active UI. A later product decision can persist workspace preferences or restore a selection; that still would not make selection a core object capability, and it would not store a UI component.

Transient interaction (pointer capture, drag preview, hover) stays in the editor session or the renderer until a gesture commits. It must not be written into the domain on each pointer sample. Module 0 does not implement gestures. The split is so that Module 2 does not have to tear a preview out of React state or out of the document.

Ephemeral UI stays in the component. Test: if the fact disappears when the component unmounts and a headless editor test has nothing to assert, it is not editor session state. If a modal chrome surface must block viewport input, the UI sends a coarse editor command (`input owner is chrome` / `input owner is viewport`). It does not put the popover component into the editor store.

#### Recommended pattern

```text
UI event or mount
  → EditorClient command          (editor package, no React types)
       → EditorSession update     when the fact is session state
       → DomainCommand            only when the document changes
            → core gateway        (no UI types, no editor types beyond the command DTO)
       → coarse snapshot          subscribers: React chrome, tests
Rendering loop
  → reads core + surface         does not receive scene props from React
```

Module 0 commands are only:

- `editor.start` — initialize core, record ready or failed, emit a diagnostic. Failure is visible state, not a swallowed exception.
- `viewport.attach` / `viewport.detach` — hand a surface to the rendering boundary and record the session flag.

No selection command, tool command, undo command, or panel command.

The UI holds a stable `EditorClient` created by the host, not a fresh client per render. React context may carry that stable client. Context must not carry the session snapshot. Components that need startup or failure text subscribe through `useSyncExternalStore` (or the host framework's external-store equivalent) to a coarse snapshot:

```text
startup: starting | ready | failed
viewport: detached | attached
failureMessage: present only when startup failed
```

Future chrome snapshots add ids and flags (selected ids, active tool id, which contextual surface is open). They do not add scene objects, DOM nodes, or component types.

Domain mutation, when it exists, has one choke point on the editor side: the editor asks core to apply a domain command. UI code does not import core mutators. Module 0's command set can be empty. The choke point is the boundary, not an undo stack. The Core Engineer owns undo/redo. Editor session commands (later: change tool, show a contextual surface) are not undo entries. Domain commands are the future undo entries. Keeping them as separate types prevents panel toggles from landing in the document history.

#### Alternatives rejected

| Pattern | Why it loses |
|---|---|
| Scene and selection in React state or context | Bakes the document into the UI framework. Headless tests must mount React. Every drag sample becomes a render. Core can no longer be imported without the shell. This is the pattern that fails M0-NFR-002 and M0-NFR-003 in spirit as soon as features arrive. |
| One Redux (or similar) store for document, session, and widgets | Collapses three owners into one bag of actions. Panel toggles, domain edits, and hover end up in one history. Middleware becomes a second framework. Unnecessary for a shell that has two commands. |
| A global stringly-typed event bus | Hides the dependency direction. Cycles between UI, editor, and renderer are normal failure modes. A typed client with a snapshot subscription is enough. |
| Domain objects that hold UI components, view-models that are components, or a scene graph of React elements | Makes the document unserializable, platform-specific, and untestable without a DOM. Directly contradicts archive section 4.2 and M0-NFR-002. Rejected as an architecture, not deferred. |
| CQRS, event sourcing, or a plugin panel registry in Module 0 | Speculative infrastructure. The command function above is the whole pattern until a later module has a real command. |

Editor session state is not a license to add selection and tool fields "so they are ready". Empty fields become an API. Document those future fields here; do not put them in Module 0 types.

If core is not TypeScript, the same direction holds. The UI still talks only to the editor client. The editor is the only package that crosses to core, through a narrow command/result boundary rather than a shared object graph. The UI package still must not call FFI, WASM, or a Python bridge itself.

---

### 3. Progressive complexity constrains the shell

**Recommendation.** Module 0 ships a viewport-first frame: one primary surface that may occupy the window, plus the minimum chrome needed to show startup and fatal initialization failure. It does not ship a layout of panels.

Progressive complexity (P-02, P-06, product overview section 7) means advanced controls are absent until the task needs them. A foundation shell that already has a hierarchy, an inspector, a toolbar of future tools, and a timeline teaches the opposite. Hiding those regions with CSS still puts them in the accessibility tree and still freezes a Blender-like information architecture before the Designer has designed one.

Engineering constraints, not a visual design:

- The shell has a single primary slot, the viewport host, and a single status region for startup and fatal error text. Status text is text, not color alone, so a failure is visible without the log file.
- Do not add a docking library, panel registry, splitter framework, or named regions for hierarchy, inspector, timeline, or tool shelves.
- Do not encode the overview's Level 1–4 capability levels as modes, routes, or product editions. They are a future exposure policy, not a Module 0 navigation model.
- Future contextual UI mounts when the editor session says that surface is active, and unmounts when it is not. Do not mount every future panel and hide it. The Designer decides which surfaces exist and when they appear. The editor stores an id or a closed flag, never a component.
- The viewport must be able to exist with no authoring chrome. Creating a scene later cannot require a panel to be present.
- No router. A single shell has nothing to route.

**Ownership split with the Product Designer.**

| Concern | Owner |
|---|---|
| Visual identity, typography, spacing, color, motion, platform conventions, what the shell looks like | Product Designer |
| When a control appears, information architecture, contextual behavior | Product Designer |
| Which package paints chrome, what is allowed to re-render, where session data lives, how a command reaches core | Editor engineering |
| Making a future panel possible without editing the renderer or the domain | Editor engineering |
| Scene contents, including anything that would justify a hierarchy panel | Out of Module 0; later core |

The UI package should accept a design-token input (CSS custom properties or an equivalent approved by the Designer) so M0-FR-009 has a place to land. Tokens are not a component library. Engineering does not invent the production editor layout in order to have something to style.

Platform adaptation stays in the host. macOS window chrome and Windows window chrome may differ without a second React tree and without pixel-identical layout (M0-NFR-008, development-process section 5.4). Module 0 does not implement per-OS shells.

#### Alternative — a non-functional multi-panel mock

A static mock of the "real" editor would give design review something familiar and would be a mistake. It would become the layout later modules fill in, it would fail the test plan's check for unnecessary editor complexity, and it would present authoring UI the module explicitly excludes. Reject the mock. If the Designer needs a composition study, it belongs in design material, not in the application shell.

#### Alternative — build the docking shell now and keep it empty

An empty docking framework is still a permanent IA. It adds dependency weight, focus-order problems, and a plugin-shaped API nobody may extend yet. Reject it. A later approved design can introduce layout when there is a second real region to lay out.

---

### 4. Testing: three layers, one headless boundary

**Recommendation.** Test the editor and the core without a DOM. Test React chrome with component tests against a fake editor client. Use one real browser smoke test for the shell. Do not use browser tests as proof that core is headless.

| What is proven | Where | How |
|---|---|---|
| Core runs without UI, desktop, React, or a window | `core` | Unit tests. No jsdom required. This is M0-AC-005 / TP-M0-F-002. |
| `editor.start` and attach/detach update session state and call core through the gateway | `editor` | Unit tests with a fake surface. No React, no jsdom, no window. |
| Chrome shows ready and fatal-failure snapshots; mount calls `attachViewport` once; unmount detaches | `ui` | Component tests (Vitest + React Testing Library + jsdom) and a fake `EditorClient`. |
| The shell launches, the host element exists, a probe can pump frames without increasing the React render count of the host, startup failure is visible in the page | App host | One Playwright (or equivalent) browser test. |
| Import direction: `core` does not import `editor`, `ui`, `rendering`, React, or a desktop SDK. `editor` does not import React or the app host. `ui` does not import core mutators. | Package boundaries | A dependency test or lint rule. Review is not a substitute. |

**The boundary that must stay headless is the core package and the editor session.** Both run without a graphical window, without jsdom, and without React. Rendering's real GPU backend is outside that guarantee. Editor tests substitute a fake surface (`attach`, `detach`, `resize`, `pumpFrames`) so session behavior is not proved by pixels.

Implications of choosing React:

- Component tests are appropriate for chrome behavior and the attach handoff. They are not appropriate for frame output, WebGPU, or hit testing. jsdom does not run a real frame loop; do not treat a green jsdom suite as evidence the viewport draws.
- React Testing Library should assert accessible text (startup, failure), not component snapshots and not DOM structure that belongs to the Designer.
- The browser smoke test is the place that fails if someone connects the frame loop to React state. Pump a fixed number of frames through the probe surface and assert the host's render count stayed at mount level. That is a structural test, not a performance benchmark and not a visual-regression baseline.
- Do not add Cypress beside Playwright. One browser harness is enough.
- Do not add Storybook, screenshot farms, or visual-regression infrastructure in Module 0. The test plan allows future visual regression; it does not require it now.
- A deliberately failing unit test for TP-M0-F-003 should live in core or editor, not only in a browser test, so failure propagation is demonstrated on the headless path as well as in CI.

#### Alternative — browser tests for all UI and editor behavior

End-to-end coverage of `editor.start` would make M0-AC-005 look satisfied while the real editor suite required a window. It is slower, more brittle, and it hides violations of the dependency rule. Reject it as the default. The single browser smoke test exists to prove the host plus the handoff, not to own the editor contract.

#### Alternative — snapshot tests of the React tree as the architecture check

Snapshots do not prove that core is independent, and they fail when the Designer changes markup. Reject them as the boundary test. Use import constraints plus the headless editor tests.

---

### 5. One UI package, two thin hosts

**Recommendation.** Both the web shell and the desktop shell consume the same UI package. Platform differences sit behind host adapters and an injected platform capability object. They are not a second implementation of chrome.

```text
packages/ui            React shell. Imports editor client types. No Tauri, Electron,
                       Node fs, or browser-only routing.
packages/editor        Session, commands, viewport attach orchestration. No React.
packages/rendering     Frame loop and surface. No React. No editor chrome.
packages/core          Domain runtime. No UI, no editor, no rendering, no host SDK.
apps/web               Thin host. Creates the client, mounts the UI package.
apps/desktop           Thin host, when built. Same mount. Different platform adapter.
```

Exact workspace tooling is the Tech Lead's decision. The dependency direction has to be mechanical (separate compilation units and an import rule), not a comment in a folder.

Module 0 builds the shared UI package and the one primary host the specification requires. It does not build every target platform. The second host must be an entry point that mounts the same package, not a later rewrite. If only one host is implemented now, the UI package still must not import that host.

Host rules:

- The host constructs `EditorClient` with platform services (diagnostics sink now; file access only when a later module needs it).
- The UI package exports a single mount, conceptually `renderShell(container, { client })`.
- Window title bars, native menus, and file dialogs stay in the host. When native menus exist later, they emit the same editor commands as in-window controls. Module 0 has no menu bar and no file dialog.
- Web-only concerns (document title, a static page wrapper) and desktop-only concerns (window insets, native decorations) wrap the shared shell. They do not fork it.
- The renderer draws into a surface inside that same UI view for Module 0. Do not invent a hybrid of a native swapchain plus transparent HTML overlay in this module. A hybrid compositor is a later decision with the rendering engineer, with known focus, DPI, and resize costs.

#### Risks if the shells diverge

| Divergence | What breaks |
|---|---|
| React web UI and a native desktop UI (AppKit, WinUI, GTK, SwiftUI) | Two interaction models, two accessibility implementations, two progressive-disclosure paths, two bug fixes for every command. P-02 will drift between platforms. |
| Copying the web app into Electron or Tauri and then editing it in place | Desktop APIs leak into components. The "shared" UI becomes the desktop UI. The web host can no longer mount it. |
| A simplified web editor and a full desktop editor | Contradicts one visual creation environment and doubles every later module. |
| Host-specific scene code | A document saved on one host stops meaning the same thing on another. Forbidden by P-08 and M0-NFR-007. |

Trade-off. One web UI package means desktop chrome is limited by the webview: IME, global shortcuts, pen pressure, color management, and file drag-and-drop need explicit host and viewport-input work later. That is cheaper than a second editor. Native capability (files, GPU, storage, process model) still belongs in the desktop host and the rendering/platform packages. "Desktop is first-class" does not require a second widget toolkit. It requires that the desktop host is not an afterthought wrapper around a website router, and that platform services are real adapters rather than banners telling the user to use the browser.

#### Alternative — separate UI per platform, shared core only

This keeps native look-and-feel maximum and rejects the accessibility and consistency cost. It also splits the team that has to implement the Designer's interactions. It is the right alternative only if the PO decides that native widgets are a product requirement. It is not the right default for Module 0, and it should not be "left open" by implementing the shell directly inside `apps/web` with no UI package.

---

## Module 0 implications

### Build

Enough structure to prove the direction, and no authoring behavior.

1. Separate compilation units for core, editor, rendering, UI, and the primary app host, with an enforced import rule matching section 2.
2. A core entry point that tests construct without a window and without React.
3. An editor client whose session snapshot is only startup (`starting` / `ready` / `failed`) and viewport attachment (`detached` / `attached`). `editor.start` records failure instead of swallowing it and reports it through the diagnostics path the logging design defines.
4. `viewport.attach` / `detach`. The rendering implementation for Module 0 may be a labeled probe that fills a surface and can pump frames outside React. The probe is not a choice of Canvas2D, WebGL, or WebGPU. Production rendering remains the rendering engineer's decision.
5. A React shell that mounts one viewport host, calls attach once, and renders ready or fatal-failure text from the coarse snapshot. Include a named main region and an accessible name for the viewport region. The viewport is presentational in Module 0 because there is no scene to operate on.
6. A token hook (CSS variables or the Designer's equivalent) so the design foundation has a seam, without a widget kit.
7. Headless editor tests on a fake surface, component tests on a fake client, one browser smoke test that the host render count does not track frames, and the import-boundary check.
8. Startup diagnostics visible both as logs and as shell text when initialization fails (M0-FR-006). The shell is not a log viewer.

### Do not build

- Scene graph, universal objects, selection, tools, gizmos, drawing, shapes, text, images, materials, cameras, lights, animation.
- Undo history, command palette, routers, expert modes, or Level 1–4 switches.
- Docking layouts, inspectors, hierarchies, timelines, toolbars of future actions, or a non-functional mock of them.
- Redux, Zustand, MobX, a general event bus, a panel plugin API, Storybook, visual-regression infrastructure, or a third-party component library.
- A second UI for desktop, native menus, file dialogs, or a hybrid GPU compositor.
- Per-frame React state, scene props on the viewport component, or viewport listeners that call `setState`.
- Placeholder fields on the editor session for selection, tools, or panels.
- Any persistence of editor session inside a project file. Persistence strategy is a separate architecture topic; Module 0 has no project to save.

The viewport probe must be named and documented as a probe so it cannot be cited later as the approved renderer (specification section 4).

### Dependency direction to demonstrate

```text
apps/web  →  ui  →  editor  →  core
                 ↘ rendering ↗
core does not import editor, ui, rendering, React, or a host SDK
editor does not import ui, React, or a host SDK
rendering does not import ui or React
ui does not import a desktop or browser-extension SDK
```

M0-AC-006 is demonstrated by core tests that never start the shell, plus the import rule. The editor tests are the additional proof that application logic does not need the UI package.

### How later modules are expected to use this, without building them

- Module 1 selection, if approved as specified in the archive, is an editor-session change driven by a viewport hit or a future hierarchy control. The domain stores objects, not the selection. The UI does not hit-test.
- Module 2 manipulation updates a transient editor/renderer preview and commits a domain command at gesture end through the same choke point. Undo wraps domain commands, not React state.
- Module 3 text creation uses real text inputs in chrome or an editing overlay. It does not invent a canvas-only text engine that bypasses IME and accessibility. The committed text is a domain object.
- Contextual controls for those modules mount from editor-session flags. They are not compiled into the Module 0 frame.

---

## Risks, assumptions, PO decisions, open questions

### Risks

| Risk | Why it is plausible | What keeps it in check |
|---|---|---|
| Scene state migrates into React because it is convenient | The recommended framework makes local state the default habit, especially for generated code. | Import rule, no scene props on the viewport host, headless editor tests, frame-loop render-count smoke test. |
| The Canvas2D (or other) probe is treated as the renderer decision | A visible rectangle looks like a product choice. | Label it a probe in code and in architecture docs. Rendering technology stays an open architecture topic. |
| Module 0 layout becomes the permanent editor | Empty regions and docking kits survive by inertia and then fail P-02. | Viewport-first shell. No panel framework. Design review against "unnecessary editor complexity". |
| Web and desktop become two editors | Native look, or a quick Electron fork, is an easy reading of "desktop is first-class". | One UI package now, before either host grows features. PO confirmation below. |
| Shared UI imports host APIs | File and window calls land in components "temporarily". | UI package dependency rule. Platform services injected by the host. |
| jsdom is treated as proof of the viewport | Component tests are cheap and green. | Headless editor tests use a fake surface. One browser test covers the real handoff. GPU tests are not Module 0. |
| Editor session is saved as if it were the scene | Selection and panel layout get written into the project format because they sit next to the document in memory. | Separate types and packages. No project write in Module 0. Persistence review owns the file format. |
| Gesture streams later re-enter React | Live coordinates in an inspector are an obvious `setState`. | Chrome subscribes to commits. High-frequency values stay in the renderer or are written imperatively. |
| Hybrid webview plus native surface | A desktop GPU view beside HTML chrome splits focus, DPI, and resize. | Module 0 uses one surface inside the UI view. A hybrid compositor requires an explicit later decision. |
| Accessibility of the viewport is postponed until it is unfixable | A canvas with no keyboard or name becomes the whole product. | Module 0 names the region and does not pretend it is an editor. Later selection and text have to have a non-pointer path. Not built now. |
| Stylus, IME, and shortcuts are lost in the webview | One UI package defers native input problems; it does not delete them. | Viewport listeners are owned outside React synthetic events so pressure and capture can be handled explicitly when drawing exists. |
| An editor "stub API" invites authoring features during Module 0 | Extra fields and empty tool enums look like permission. | Session type is startup and attach only. This review is not an implementation ticket for selection. |

### Assumptions

- The primary Module 0 shell can host a client web UI and an element the renderer can draw into. A fully native shell with no webview invalidates the framework recommendation and must be resolved before READY FOR DEVELOPMENT.
- The UI package is TypeScript. The core language may differ. If it differs, the editor is still the only application-side caller of the core boundary.
- The Tech Lead will choose the workspace tool, test runner, and desktop host. This review requires the package direction and the headless editor tests, not a specific bundler.
- React 18 or newer is the assumed client React, because the external-store subscription is part of the seam. The exact version is a dependency decision, not a product decision.
- No third-party UI kit is required to meet M0-FR-009. Design tokens plus semantic HTML can satisfy the shell. If the Designer requires a kit, that is a new dependency decision with licensing reviewed before adoption (archive section 17).
- Editor session state is not project content. Restoring a selection later would be an explicit product decision and a separate persistence concern from scene semantics.
- The rendering package may be exercised by a probe surface in Module 0 without choosing the production GPU API.
- This review does not approve visual design. M0-AC-012 still belongs to the Product Designer against the approved Module 0 design intent.
- Operational Module 0 requirements override archive section 9.1 where the archive omits editor, UI, rendering, and persistence boundaries.

### Decisions requiring Product Owner approval

These are product-facing consequences of the technical recommendation. The Tech Lead records the architecture decision; the PO decides where product intent is ambiguous.

1. **One shared chrome implementation for web and desktop.** Desktop stays first-class through native file, process, and rendering integration, not through a second widget toolkit. Approve or reject. Rejection means the UI-package recommendation stops and Module 0 architecture must be replanned.
2. **Module 0 does not show a multi-panel editor, even as a non-working preview.** The shell is a viewport host plus startup and fatal-error status. Confirm that design review should judge that shell, not a mock of the future product.
3. **Selection, tools, and panel visibility are editor session concepts, not scene content,** unless the PO explicitly wants them in the project file later. Module 0 does not implement them either way. This confirmation prevents the project format from absorbing UI state by default.

The choice of React versus Solid is a Tech Lead architecture decision constrained by decision 1. It should appear in an ADR because M0-NFR-006 requires a recorded alternative. It does not by itself change product scope if decision 1 is approved. React is the recommendation. Solid is the recorded alternative.

### Open questions

- For the Tech Lead and rendering engineer: does any supported desktop target need a native swapchain that is not a canvas inside the webview? If yes, that is a blocking architecture question before implementation, not a Module 0 feature.
- For the Product Designer: what is the minimum visual intent for the shell (tokens, type, the appearance of a fatal startup state)? Engineering will not invent that intent.
- For the Designer and PO, later than Module 0: when text exists, is an on-canvas editor with a real DOM field acceptable, or is text editing always a chrome control? The boundary can support either. Module 0 should not guess.
- For the Core Engineer: confirm the domain gateway used by `editor.start` is a runtime status, not a placeholder scene. This review assumes core exposes something tests can call without documents.
- For Quality and DevOps: confirm the primary host can run one browser smoke test in CI without making that job a substitute for headless core and editor tests.
- For Security: the shell should not load remote content, render unsanitized HTML, or open project files in Module 0. Confirm that constraint matches the threat-model scope so the UI package does not gain a network or file capability "for later".

### What this review explicitly leaves to other owners

- Production rendering API, GPU strategy, and frame-scheduler implementation: Senior 3D / Rendering Engineer.
- Scene model, persistence format, and undo stack: Senior Core / Platform Engineer. The editor will call a domain-command choke point; it does not define the command language beyond "not UI components".
- Desktop packaging, CI, and whether the second host is built in Module 0: Tech Lead and DevOps. This review only requires that the UI package be host-neutral now.
- Visual design and interaction design of even the minimal shell: Product Designer.
- Test-plan ownership and evidence sufficiency: Quality Engineers. This review states the headless boundary those plans should enforce.

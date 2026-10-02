# Editor and UI Boundary — Module 0 Preparation Review

**Role:** Senior 2D / Editor Engineer
**Status:** Preparation evidence. Not an ADR. Does not change requirements or code.
**Date:** 2026-10-02

Module 0 does not implement the visual editor. This record keeps the editor and UI findings, the shell disagreement, and the risks. It separates binding Module 0 decisions from later ideas.

## Disagreement

This review requested a viewport in the Module 0 shell. React would create one host element, a mount effect would call `attachViewport`, and a labeled frame probe would pump frames outside React. Session state would include `detached` and `attached`. A browser test would fail if that host re-rendered once per frame.

That request was not adopted.

The Designer rejected a viewport and an editor frame. Rendering rejected a canvas and a GPU probe. The decision is no viewport, no canvas, and no frame probe in the Module 0 shell. A surface on that screen would be the wrong object for M0-AC-012, and a visible rectangle would be cited as the renderer.

This file does not reverse that decision.

## Binding for Module 0

| Decision | Constraint |
| --- | --- |
| Client-side React paints the foundation screen | No Next.js, server components, router, or component library. Solid is the recorded alternative (M0-NFR-006). |
| React does not own session state and does not schedule frames | This module has no frame loop. |
| Editor session is only `starting`, `ready`, and `failed` | No attach flag, selection, tool, panel, undo stack, or command bus. Empty fields would become an API. |
| The shell passes a plain view model | The shell creates the editor, runs startup, and passes strings. Not a client object and not scene data. |
| UI imports no workspace package | `packages/ui` cannot import core, editor, rendering, persistence, or platform. |
| Editor does not import React | Editor may import `core` and `persistence` only. Not `ui`, `rendering`, or `platform`. |
| One foundation screen | No docking kit, panel registry, toolbar, hierarchy, timeline, or mock editor. |
| Boundary evidence is headless | Specified evidence is headless startup success and injected failure, plus an import check. Type-only and test imports count. No browser harness. |

Failure is visible text, not color alone, and not a swallowed exception. Ephemeral UI state is the details disclosure only. Chrome is semantic HTML plus design tokens. The UI package does not import the app host.

## Revisitable direction

Not a binding API. Not Module 0 types. A later module may adopt, replace, or drop any item. This module has not built them.

- React may create a host element later. Scheduling, drawing-buffer resize, drawing, and viewport pointer input would sit outside React. The failure to avoid is a pointer-move `setState`.
- Hit testing returns an id. It does not return a render object for the UI to mutate.
- Selection is session state, not a scene field, unless the Product Owner later chooses to persist it. Active tool and panel visibility are the same kind of idea. The recommendation is not to persist them.

Also not an API: coarse subscriptions of ids and flags, attach and detach, undo of domain commands, and a render-count check beside a real frame loop. `editor` must not call `rendering` until a new ADR amends the import table. ADR-0008 records notes for a later viewport, not a specification. This review does not treat those notes as the later interface, and it does not amend the ADR.

Whether a later desktop host reuses this UI package is deferred. It is not a Module 0 Product Owner confirmation, not a second shell, and not a native-toolkit decision. Revisit React if a later host cannot mount one web UI, or if native widgets become a product requirement.

## Findings

React is the chrome choice because menus, dialogs, lists, and fields need focus order and semantics that outlive Module 0. The screen does not subscribe to an editor store. The shell passes a plain view model.

| Alternative | Result |
| --- | --- |
| Solid | Realistic alternative. Smaller runtime, thinner accessible-widget set. The gain matters only if chrome tracks high-frequency values. Module 0 has none. Rejected. Fallback if a shared web UI is rejected. Do not mix it with React. |
| Svelte | Rejected. Single-file components and site-framework defaults fight a host-neutral package. |
| Vanilla DOM for the whole shell | Rejected. Appropriate later inside a rendering boundary, not as the chrome framework. |
| Per-OS native widgets | Rejected unless the Product Owner requires AppKit, WinUI, or GTK. Not a Module 0 requirement. |

| State | Owner | Module 0 |
| --- | --- | --- |
| Domain document | `core` | Absent. A later scene stays serializable without the active UI. |
| Editor session | `editor` | `starting`, `ready`, `failed` only. |
| Ephemeral UI | The component that needs it | Details disclosure. Not editor session state. |

Rejected placements: the scene or selection in React state; one store for the document, the session, and widgets; a stringly-typed event bus; domain objects that hold components; CQRS, event sourcing, or a panel registry. Selection is not domain data by default. Pointer samples are not document writes. Neither rule adds Module 0 fields.

The requested UI-to-editor client was not adopted. Only the shell sees both UI and editor, and it passes plain values. UI cannot import core. The shell cannot import core either. Startup goes through the editor.

The shell is not a layout of future panels. Hidden regions would remain in the accessibility tree and would freeze an information architecture the Designer has not designed. The Designer owns appearance and when a control appears. This boundary owns which package may re-render and where session data lives. No router. Level 1-4 capability levels are not modes. An empty docking framework is still a permanent information architecture. Rejected.

Editor tests import `core` and `persistence`, do not import `ui`, and do not start a shell. Core tests do not launch the application (M0-AC-005, M0-AC-006). This review suggested Vitest, Testing Library, jsdom, and one Playwright render-count smoke test. Those were not adopted. The runner is `node:test`. Component snapshots, Storybook, Cypress, and visual regression are not Module 0 boundary evidence.

## Risks

| Risk | What Module 0 constrains |
| --- | --- |
| Scene state moves into React because local state is convenient | UI imports no workspace package. No scene props. Editor does not import React. Session state is startup only. |
| A later module draws with `setState` because no probe showed another path | No canvas exists to extend. The host-element note is revisitable direction, not a guard this module built. |
| A debug rectangle is cited as the renderer | No canvas and no frame probe. Rendering technology is not chosen here. |
| The foundation screen accretes panel chrome | No docking framework and no mock regions. |
| Web and desktop become two editors | No second toolkit is built now. Reuse of this UI package is deferred, not a Module 0 confirmation. |
| UI imports host, file, or network APIs | No workspace import and no desktop SDK. This shell loads no remote content and opens no project file. |
| A jsdom or browser suite is taken as boundary proof | Headless editor tests and the import check are the evidence. No browser harness in Module 0. |
| Editor session is saved as the scene | No project write. Session state is not document content. |
| Gesture streams later re-enter React | No gestures. High-frequency values are not view-model fields. |
| Stub session fields invite authoring work | No selection, tool, panel, undo, or attach members. |
| A hybrid native surface splits focus, DPI, and resize | No surface in Module 0. A hybrid compositor is a later rendering and desktop decision. |
| Viewport accessibility, stylus, IME, or shortcuts have no owner | There is no viewport to postpone. Non-pointer input belongs to the module that adds selection or text. |

## Verdict

CONCUR with the adopted Module 0 shell: no viewport, no canvas, and no frame probe.

Editor state is only `starting`, `ready`, and `failed`. The shell passes a plain view model. UI imports no workspace package. Editor does not import React.

The probe request was not adopted. It is not a Module 0 block, and this record does not ask for the probe back. Dependency direction is the import graph and the headless startup tests.

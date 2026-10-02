# Editor Proposal Review — Viewport Handoff

## Role and status

| | |
|---|---|
| Role | Senior 2D / Editor Engineer |
| Document | Review of the Module 0 architecture proposal after the viewport host was not adopted |
| Status | Concurrence. Not an ADR. Does not change architecture, requirements, or code. |
| Date | 2026-10-02 |
| Question | Does omitting the Module 0 viewport host and frame probe leave a blocking hole? |

A blocking hole, for this review, means only one of these:

- the dependency direction cannot be demonstrated, or
- a later module is forced into React-owned scene state.

A preference for an executable probe is not a block when the written handoff is sufficient. This review does not reopen the foundation screen, and it does not ask for a canvas in Module 0.

## Documents read

- `docs/modules/module-00-foundation/preparation/reviews/editor-2d.md` (the recommendation that was not adopted)
- `docs/engineering/architecture.md`, sections 7 and 10, the design-intent amendments, and Resolved disagreements
- `docs/engineering/adr/0002-react-for-editor-chrome.md`
- `docs/engineering/adr/0008-editor-state-and-shell-content.md`
- `docs/engineering/adr/0003-render-snapshot-and-webgpu-direction.md` and `docs/engineering/adr/0004-module-0-web-shell-and-desktop-direction.md`, for the rendering and host edges the handoff must not contradict
- `docs/modules/module-00-foundation/specification.md` (M0-FR-003, M0-NFR-002, M0-NFR-003, M0-AC-006) and test plan TP-M0-I-001 and TP-M0-I-002

Normative scope remains the operational Module 0 specification. This review does not add, remove, or reinterpret an acceptance criterion.

## Decision under review

| Earlier editor recommendation | Adopted proposal |
|---|---|
| React chrome creates one viewport host and calls `attachViewport` from a mount effect | No viewport, no canvas, no frame loop, no fake tools. Record the handoff. Do not implement it. |
| Session includes `detached` / `attached` | Session is only `starting`, `ready`, or `failed` |
| UI holds an editor client and may import editor types | UI imports no workspace package. The shell passes a plain view model |
| A labeled probe pumps frames outside React, and a browser test counts host renders | That test is not a Module 0 test. Import rules and headless editor tests are the boundary evidence |

Resolved disagreements record this explicitly: no viewport and no canvas. ADR-0008 rejects the probe because it would put a surface on the only screen M0-AC-012 reviews, and because a visible rectangle would be cited as the renderer. ADR-0003 likewise ships a null renderer and no canvas. Those reasons stand. The only question left is whether the replacement evidence and the written handoff are enough.

## Dependency direction can be demonstrated

Module 0 does not have to demonstrate a frame loop. It has to demonstrate that core can be imported and tested without UI or a desktop shell (M0-AC-006, TP-M0-I-001), that the six boundaries exist (M0-FR-003), and that core does not depend on React, a desktop shell, browser UI, or platform filesystem APIs (M0-NFR-002, TP-M0-I-002). A boundary may contain minimal code. Missing product behavior inside rendering is not a failure of that scenario.

The proposal demonstrates that direction without a host element.

- Section 7 names three owners. The domain document is core, later, and absent now. Editor session is the editor package, limited to startup. The UI package owns only ephemeral widget state, and in Module 0 that is the details disclosure. The shell creates the editor, runs startup, and passes plain values in. UI does not import core or editor. Editor does not import React.
- Section 10 is the mechanical graph. `editor` may import `core` and `persistence` only. `ui` may import nothing in the workspace. `shell` may import `ui`, `editor`, and `platform`, and must not import `core`, `persistence`, or `rendering`. `rendering` may import `core` only, and must not import `ui`, `editor`, `platform`, or a GPU library. A type-only import counts. A test import counts. `scripts/check-boundaries.mjs` fails `pnpm verify` on a forbidden edge (ADR-0005).
- Section 12 requires one editor test that imports `core` and `persistence` without importing `ui` or starting a shell, plus startup success and injected failure. Those tests are headless. They do not need a surface.
- Section 18 ties M0-NFR-002 to that script, not to review alone. Section 20 repeats the release condition: core, editor, rendering, and persistence have no DOM, React, `node:fs`, Electron, or Tauri imports.

That graph is stricter than the edge this review originally asked to demonstrate (`ui` → `editor`). The UI package cannot reach the editor or the domain even with a type import. The shell is the only composition root that sees both. Command and snapshot values cross there, as data the shell chooses to pass, not as a React-owned store inside `packages/ui`.

`editor` must not import `rendering` in Module 0. That is not a missing demonstration. There is no viewport to attach, and the null renderer is exercised by its own headless test. Section 10 already states the later amendment: a viewport module must change the table in a new ADR before `editor` may call the renderer. The allowed future caller is named. The edge is gated, not undefined, and it is not granted to `ui` or to the shell.

What the probe would have shown, and what Module 0 therefore does not execute, is a runtime count of React renders while frames are pumped. ADR-0008 says that test is not Module 0 evidence. Import rules cannot see a `setState` inside a package that is allowed to use React. They do not need to, until a package is allowed to schedule frames. Module 0 schedules none. M0-AC-006 does not require a browser, and section 14 defers browser automation. The dependency direction the specification asks for can be demonstrated.

## A later module is not forced into React-owned scene state

The risk in the original review was real: React makes local state the easy place to put a scene, and a convenient `onPointerMove` becomes a render per sample. That risk is a discipline problem. It becomes a blocking hole only if the proposal leaves no legal path except storing the scene in React.

The legal path is written, and the illegal path is forbidden. Implementing the path in Module 0 is explicitly not this module's work.

ADR-0002:

- Do not use React to store a scene, schedule frames, or own editor session state.
- A later subscription, if a module needs one, uses `useSyncExternalStore` or the equivalent. The snapshot contains ids and flags, not scene objects and not component types. That subscription is not a Module 0 feature.
- React may create one future host element. Frame scheduling, drawing-buffer resize, drawing, and viewport pointer input belong to editor and rendering code. A React state update on pointer-move is a boundary violation. A future drag must not write preview coordinates into React state.
- `packages/ui` does not import `editor` or `core`.

ADR-0008, future handoff, not implemented:

- React may create one host element. It does not render frames.
- The editor attaches that element to the rendering boundary. Pointer input for manipulation is registered there, not as React state on pointer-move.
- Chrome subscribes to coarse commits (selection, tool, panels), not to frame ticks.
- Hit testing returns a domain id. It does not return a render object for the UI to mutate.
- Selection, active tool, and panel visibility are editor session state, not scene fields, unless the Product Owner later wants them persisted. The recommendation is not to persist them.
- Changing this handoff requires a new ADR. A later module that adds a canvas must follow the handoff and must not treat ADR-0008 as already having built it.

The same split is already in the other decisions the handoff has to live with. Architecture section 6 keeps one authoritative scene as plain data in core. ADR-0003 gives the renderer a platform-neutral snapshot and stable ids; the editor maps an id; the renderer does not select, undo, or save. Architecture section 9 keeps undo and redo stacks in editor session memory, not in the project file and not in the UI. ADR-0004's native `wgpu` alternative owns the surface outside the UI. ADR-0008 says React *may* create the host element, not that every surface is a React node, so that alternative is not collapsed into chrome state.

The composition root can wire the later host without giving the scene to React and without a Module 0 attach API.

- `packages/ui` still creates at most the empty element. It does not import `editor`, so it cannot own the session and it cannot call core mutators. The shell already imports both `ui` and `editor`, which is the only legal bridge. A host callback or a ref passed in by the shell is an extension of the view-model handoff, not a new owner.
- `editor` accepts that host and, once a new ADR adds `editor` → `rendering`, attaches it. Accepting a host handle does not require `editor` to import React. Module 0 correctly refuses the attach method now. ADR-0008 states that empty session fields would become an API.
- Coarse chrome reads ids and flags through a subscribe function the shell can pass in. `useSyncExternalStore` keeps that copy as a rendering cache of an external store. It is not permission to put the document in `useState`. The Module 0 screen does not need this. Startup passes strings after `editor.start`. Those strings are a view of session state the editor still owns.

No compliant reading forces the later scene into React.

- `ui` cannot import the document. `shell` cannot import `core` either, so the composition root cannot hand core mutators or the domain graph to the screen unless `editor` exposes them. The handoff says what `editor` may expose later: ids and flags, not scene objects.
- Drawing inside `packages/ui` because `editor` cannot yet import `rendering` is not the prescribed escape. Section 10 names the escape: amend the table so `editor` may call the renderer. ADR-0002 forbids scheduling frames in React in the meantime. The prohibition is not stranded without a caller.
- Copying a future document into the "plain view model" is not an allowed growth of the Module 0 string handoff. ADR-0002 forbids storing a scene in React by any mechanism, and it names the snapshot contents. ADR-0008 forbids treating frame ticks as React updates.
- There is no Module 0 scene, selection, tool, gesture, or undo stack to park in React "until the probe exists." Leaving those types out is what keeps the hole from being dug early.

The original `ui` → `editor` client is therefore not required to protect the scene. The shell-mediated edge protects it as well, and it matches the import table instead of fighting it.

## What is still a preference, and not a block

When a later approved module actually schedules frames, that module should add the render-count check described in `editor-2d.md`: pump a fixed number of frames and fail if the host's React render count tracks the frames. ADR-0008 already says not to pretend Module 0 built that handoff. The test belongs with the module that adds the loop. It is not evidence Module 0 can produce, and it is not a hole in Module 0.

This review does not ask for a viewport, a probe canvas, an attach method, a session field, a browser harness, or any amendment to the architecture or the ADRs. No documentation change is required to remove a block, because there is no block.

## Verdict

The dependency direction Module 0 requires is the section 10 graph, enforced on imports and covered by headless editor tests. The future render handoff is recorded in ADR-0002 and ADR-0008, is consistent with the snapshot and desktop-host decisions, and leaves a legal path that does not put the scene, the frame loop, or manipulation input in React. Omitting the host and the probe does not leave a blocking hole.

CONCUR

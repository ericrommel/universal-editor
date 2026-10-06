# Module 2 — Architecture constraints

**Status:** Preparation input for issue #36. Not a specification. Not Product Owner approval. Implementation is unauthorized.
**Role:** Tech Lead
**Date:** 2026-10-06

This note recommends seams for later direct manipulation. It adds no types, no undo API, no dependency, and no ADR. Proposed ADR-0009 is not on this branch. The next ADR number stays free while that proposal may still land.

Evidence weighed: `docs/engineering/architecture.md` (especially section 10, the import-table sentence, and the deferred list), ADR-0002, ADR-0003, ADR-0006, ADR-0007, ADR-0008, the core numeric helpers, the editor startup session, the null renderer, the two-field provisional manifest, and the Module 0 records of the Senior Core / Platform Engineer, the Senior 2D / Editor Engineer, and the Senior 3D / Rendering Engineer. Those records were not rewritten here. Where they disagree, the disagreement stays open. They did not concur with the recommendations below.

## 1. Gesture state and the committed transform

**Constraint.** ADR-0002: React paints the foundation screen and does not store a scene, schedule frames, or own editor session state. ADR-0008: editor session state is only `starting`, `ready`, or `failed`. Module 0 has no selection, tool, panel, command bus, undo stack, or viewport-attach field. Empty placeholder fields were rejected because they would become an API. The editor record says pointer samples are not document writes, and that a pointer-move `setState` is the failure to avoid. The rendering record says a later renderer consumes plain data and does not own hierarchy, undo, persistence, or selection. The core record agrees the renderer must not become the document. The manifest is `formatId` and `schemaVersion` only.

**Recommendation.** Two homes, neither added on this branch:

- In-progress pointer-gesture state (captured pointer, triples at pointer-down, uncommitted candidate) lives in editor memory that a later change adds beside the startup session. It is not React state, not a view-model field, not the domain document, not the null snapshot, and not the manifest. A pointer move updates only that memory. Cancellation drops it and does not write.
- The committed transform lives in the domain document, core's later home, as plain finite triples. A commit replaces those triples through `canonicalizeFiniteTriple`. The renderer may be shown a copy. It does not hold the authority copy.

**Deferred.** Scene schema, ids, and selection persistence. No `EditorSession` members are added here. The core record left preview versus commit to a later module and did not specify this split.

## 2. Import table

**Constraint.** Architecture section 10 is the binding import table. `editor` may import `core` and `persistence` only. `rendering` may import `core` only. `shell` must not import `rendering`. A type-only import counts, and a test import counts. The same section states that a later viewport module amends that table in a new ADR before `editor` calls the renderer. The editor record repeats that gate and does not treat ADR-0008's viewport notes as the later interface.

**Recommendation.** Keep the table closed. `editor` does not import `@uvcp/rendering`. The shell does not import it to get around that. UI does not draw in place of the renderer. The amendment is a later ADR, written in that ADR's own words. This file does not add one and does not reserve a number.

**Deferred.** The amended edges, who composes the call, and any type-only exception. The core record says a later type-only exception needs its own decision.

## 3. Hit testing

**Constraint.** Without a scene schema, a hit test still needs three inputs: a view, a pointer position, and a description of each selectable object. Module 0 supplies none of the view and no primitives. It also supplies no pointer position. `renderNull` records physical pixel size, the device-pixel ratio used to compute that size, an opaque sRGB black clear, and an empty draw list (`readonly []`). `backend` is `null` and `device` is `not-requested`. ADR-0003 says that value is the Module 0 test double, not a camera and not a permanent renderer API. The null renderer does not request a device. It is not a viewport.

**Recommendation.** Later implementation only: the smallest renderer behavior is a pure test. It accepts a view, a pointer position in that view, and a description of each selectable object, and it returns an id or no hit. It does not return a render object. It does not request a device, open a canvas, or extend `renderNull` into a viewport. Testing those descriptions on the CPU does not select WebGPU, WebGL2, or wgpu. A pick buffer would need a device and a graphics API. Neither is selected.

**Deferred.** The view schema, the object-description schema, and the product graphics API. The rendering record still lists CPU picking versus a pick buffer as deferred. The CPU test above is not that record's choice.

## 4. Undo for transform gestures

**Constraint.** ADR-0006 compared inverse patches beside the document, full-document snapshots, and an event log. None is selected. Module 0 has no undo API. The provisional manifest is two fields and is not a history log. The interaction note owns user-visible granularity: which action counts as one gesture. What this note may recommend is a technical shape that makes one committed gesture one step, and that makes undo then redo restore the same finite triples.

**Recommendation.** When a committed gesture only replaces finite triples, store one step in editor session memory, not in the file and not in the manifest. The step holds the canonical triples from before the gesture and the canonical triples from after it. Undo writes the before triples back through `canonicalizeFiniteTriple`. Redo writes the after triples. Redo does not replay pointer samples or reapply a delta. Stored canonical triples are what makes undo then redo return the same numbers, including the Module 0 rule that `-0` is `0`. Pointer moves are not steps. Cancellation adds no step.

That is the smallest of the three shapes left open. A full-document snapshot would also restore triples, but only by copying a document that does not exist. An event log restores triples only by replay, and it is the shape most easily mistaken for the manifest. No undo function is added here.

The interaction note still names the gesture. This shape does not. If a committed gesture is not a finite-triple replacement, this representation does not cover it.

**Deferred.** Whether history survives save. The core record's preference, if asked, is no, and that preference is not a decision. Also deferred: stack bounds and any command type. The three Module 0 records did not select this step. See below.

## 5. Numeric frame

**Constraint.** `canonicalizeFiniteNumber` and `canonicalizeFiniteTriple` accept a finite number, map `-0` to `0`, and reject anything else with `NON_FINITE_NUMBER`. A triple that is not three finite numbers fails the same way. The helpers do not state up-axis, handedness, rotation order, or degrees versus radians. Architecture defers coordinate conventions. The core record forbids a `Vector3` and a math dependency in Module 0, and leaves units, rotation order, handedness, and up-axis undecided.

**Recommendation.** Manipulation commands refuse a geometric interpretation until a later decision chooses that frame. Once a scene contract names which triples are the committed transform, those commands may still replace the triples. Replacement is not a reading of the triple as a translation, an Euler rotation, or a scale along named axes. This note does not choose the frame.

**Deferred.** Up-axis, handedness, rotation order, degrees versus radians, units, and one scene versus several.

## 6. Dependencies

**Constraint.** The workspace has no gesture library, gizmo library, or math library. React is confined to `packages/ui` for the foundation screen. ADR-0007 still applies to any later package: locked install, public registry, the permissive license list, and Product Owner approval before a named copyleft dependency. A native GPU library is not a WebGPU fallback.

**Recommendation.** No new runtime dependency. The stack already present is enough for the seam in sections 1 through 5. A React gesture helper would put pointer samples in React, which ADR-0002 and ADR-0008 forbid. An engine gizmo, including Three.js transform controls or Babylon gizmos, would keep the committed transform in that engine's graph. The rendering and core records reject the renderer as the document, and no graphics API is selected. A matrix package would carry a layout, a handedness, and a radian convention, which section 5 will not choose. Later pointer events, `canonicalizeFiniteTriple`, and editor memory are sufficient until a scene contract exists. Any package added after that still passes ADR-0007. None is added here.

## Disagreements left open

These are already in the Module 0 records. This note does not close them and does not treat a recommendation above as their joint decision.

- **Later surface.** The editor record requested a Module 0 host element, `attachViewport`, session flags `detached` and `attached`, and a frame probe outside React. That request was not adopted. Its later sketch — React may create a host element, pointer input stays outside React, hit testing returns an id — is revisitable direction, not an API, and the record says ADR-0008 does not specify that interface. The rendering record rejected a canvas and an attach API, says the later handoff is deferred and is not specified, and still wants one surface to keep the pointer path, the hit test, and the device-pixel ratio together. It selects no host. The core record rejected Module 0 viewport commands. They do not share a viewport interface. Section 1 does not adopt the editor sketch.

- **Snapshot versus the document.** The rendering record stores physical pixels, the device-pixel ratio, an sRGB clear, and an empty draw list so color and DPI are not implicit, and it says the document must not be GPU objects. The core record describes that request as a snapshot shaped for WebGPU plus a ban on reading committed transforms from a live engine node. Core agrees the renderer must not become the document, and disagrees with adding a snapshot type or GPU fields in Module 0 to reserve a later API. The rendering record says the same snapshot selects no graphics API and holds no GPU objects. ADR-0003 then adopted the snapshot as a test double only. This note does not treat `RenderSnapshot` as the hit-test view. Both records leave the scene schema unselected. Core's studied plain-data hierarchy, including a translation, rotation, and scale record and derived world transforms, is not adopted here.

- **Undo owner and shape.** The core record studied inverse record patches in editor session memory, one per gesture rather than per pointer move, and also full-document snapshots and event sourcing as a file format. It selected none. It agrees that UI-toolkit history is not document undo and that session commands must not share a history with domain edits. It disagrees with adding an editor client, viewport commands, or a command type in Module 0. It says that if a later core is not TypeScript, the editor package is the place to cross a narrow boundary, and it does not take the future undo language as core's. The editor record says undo of domain commands is not an API, rejects event sourcing and CQRS as placements, and selects no other shape. The rendering record says the renderer does not own undo. Section 4 is not a decision those records made together.

- **Picking and the graphics API.** The rendering record defers CPU picking versus a pick buffer. It does not select WebGPU, WebGL2, or wgpu. A host rank it considered — Chromium, then native wgpu, then a system webview — was not adopted, including because other records ranked hosts differently. Section 3 does not record that rank as agreed, and it does not record the CPU test as the rendering record's choice.

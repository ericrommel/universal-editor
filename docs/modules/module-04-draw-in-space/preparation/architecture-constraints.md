# Module 4 — Architecture constraints

**Status:** Preparation input for issue #67. Not a specification. Not an ADR. Implementation is not authorized.
**Role:** Tech Lead
**Date:** 2026-10-06

This note records sequencing and package constraints for Draw in Space. It adds no curve kind, no stroke document, no viewport, no tool, no undo API, no dependency, no import edge, and no editor or rendering change. It does not allocate an ADR number. Issue #10 stays a revisable backlog item. This note does not freeze its scope and does not request a Product Owner decision.

Archive section 9.5 in `docs/archive/product-engineering-specification-v1.0.md` is context for a drawing workflow. Its identifiers are not operational requirements. Product overview section 5 is the same kind of context. Neither text is a schema.

Evidence weighed: `docs/engineering/architecture.md` (the deferred list and section 10, including the import table), ADR-0001, ADR-0003, ADR-0006, ADR-0007, ADR-0008, `docs/engineering/development-process.md` sections 2 and 20, and the Module 2 preparation index and architecture note on this branch. ADR-0009 was read from `m1/reconcile-preparation` at `a16d28220916c18a2434b8f30e5a54aa4d232c7e`. It is not on this branch and is not copied here. The latest ADR in `docs/engineering/adr/` on this branch is ADR-0008. The next number stays free.

## 1. Sequencing

**Constraint.** Development process section 2 allows research and architecture work before an implementation gate, and it forbids implementing future product functionality before that gate is open. Only the Product Owner may authorize Ready for Development. Section 20: a module is GREEN only when its blocking checks pass and the Product Owner explicitly approves the module. Only then may implementation of the next module begin.

Module 1 is approved for implementation. Pull request #50, on `m1/reconcile-preparation`, is that contract. ADR-0009 on the same branch is the package decision for it. Acceptance of that ADR authorizes implementation of the Module 1 contract. It does not make Module 1 GREEN.

**Not opened here.** Module 4 implementation waits until Module 1 is GREEN and the Product Owner authorizes Module 4. This preparation does not open that gate. It does not move issue #10 or issue #67 to a state that implies Product Owner approval.

The development process still withholds the next module's implementation until the preceding module is GREEN and the Product Owner has approved it. Module 1's implementation approval is not Module 4 authorization. This note does not declare Module 2 or Module 3 complete.

Module 2 preparation on this branch does not approve a viewport or an undo API. Module 3 preparation does not approve a creation tool. Its Tech Lead note leaves the foundation screen without creation tools and does not authorize implementation. That note is not on this branch. Module 4 does not borrow a viewport, an undo API, or a creation tool from either module.

## 2. Packages and imports

**Constraint.** Architecture section 10 is the binding import table. No new package and no new import edge.

| From | May import |
| --- | --- |
| `core` | nothing in the workspace |
| `persistence` | `core` |
| `platform` | nothing in the workspace |
| `rendering` | `core` |
| `editor` | `core`, `persistence` |
| `ui` | nothing in the workspace |
| `shell` | `ui`, `editor`, `platform` |

No cycles. A type-only import counts. A test import counts. `editor` must not import `rendering`. `shell` must not import `rendering`. A later viewport module amends that table in a new ADR before `editor` calls the renderer. This file is not that ADR and does not reserve the number.

ADR-0009 places the Module 1 scene value in `@uvcp/core` and the scene-document codec in `@uvcp/persistence`, still with no new package and no new import edge. `editor` may import `core` and `persistence` only, and that ADR adds no editor API. `rendering`, `ui`, `platform`, and the shell stay as Module 0 left them. The null-renderer draw list stays empty. Those statements are the Module 1 package decision. They are not implemented on this branch, and this note does not implement them.

**Not in this preparation.** No change under `packages/editor` or `packages/rendering`. No change to a package manifest, a project reference, or `scripts/check-boundaries.mjs`. The table above stays closed.

## 3. Absent from this preparation

Not added here, and not implied by the archive workflow:

- A curve kind. ADR-0009 kinds are `rectangle` and `box`. This note adds no kind.
- A stroke document. The provisional manifest stays the two-field writer in ADR-0006. A stroke codec is not that manifest and is not the Module 1 scene document.
- A viewport. ADR-0003 and ADR-0008 bind the null renderer and the foundation screen. Module 2 has not approved a viewport. `renderNull` is not extended.
- An undo API. ADR-0006 compared inverse patches, full-document snapshots, and an event log, and selected none. Module 2 has not approved an undo API. The manifest is not a history log.
- A file writer. ADR-0006 defers who writes a user's file. A file writer is outside ADR-0009. Curve, viewport, and undo are outside that ADR as well.
- A creation tool. Module 3 preparation does not approve one. ADR-0008 leaves the foundation screen without tools. This note does not add one.
- A dependency, a workflow change, or an ADR.

## 4. One scene and one transform

**Constraint.** ADR-0009 defines one immutable scene value and one transform. The transform is three canonical finite triples from `canonicalizeFiniteTriple`: position, rotation, and scale. That contract stores those numbers. It does not define an up axis, a handedness, a rotation order, or degrees versus radians.

A later curve has to account for that one scene and that one transform. This preparation does not implement either, and it does not implement the curve. Accounting for them is not permission to add a kind or a second scene.

Architecture on this branch still lists scene schema, coordinate conventions, and one scene or several as deferred. That list is the Module 0 record. This note does not amend it and does not copy ADR-0009 onto this branch. The deferral is not permission to give a later curve a second scene. The curve accounts for the one scene and the one transform in the Module 1 contract. It does not join them from this file.

## 5. Numeric frame

**Constraint.** `canonicalizeFiniteNumber` and `canonicalizeFiniteTriple` accept a finite number, map `-0` to `0`, and reject anything else with `NON_FINITE_NUMBER`. They do not state up-axis, handedness, rotation order, or degrees versus radians. ADR-0001 says those helpers do not set the numeric model of a later scene. Architecture leaves the frame deferred. ADR-0006 forbids a `Vector3` and a math dependency in Module 0. The product-overview labels for position, rotation, and scale are not that decision.

Module 2 preparation refused to interpret triples until a frame is accepted. The design recommendation recorded there is not accepted.

**Not decided here.** The numeric frame stays undecided. This note does not choose up-axis, handedness, rotation order, degrees versus radians, or units. A later curve has to account for the one transform. That accounting is not a reading of its triples as a translation, an Euler rotation, or a scale along named axes.

## 6. Dependencies

**Constraint.** ADR-0007 still applies to any later package: locked install, public registry, the permissive license list, and Product Owner approval before a named copyleft dependency. No curve library, stroke library, or math library is in the workspace.

**Not in this preparation.** No new runtime dependency. A math package would carry a layout and a frame section 5 does not choose. None is added here. This preparation also adds no workflow and no change to `pnpm verify`.

## Open questions

Left open on purpose. This note does not pick an answer.

- Where a later curve value lives, and whether it is a new kind on the one scene. Issue #68 owns the scene-value constraint. This note only forbids adding that kind now.
- How drawing becomes document data when no viewport and no creation tool are approved. Issues #64 and #65 own the interaction and the editing seam. Issue #66 owns the spatial-curve constraints against the null renderer. This file does not replace those notes.
- Whether curve or stroke bytes are the Module 1 scene document, a separate entry, or a container ADR-0006 has not selected. No stroke document is added here. No file writer is added here.
- Which undo shape, if any, covers one completed stroke. None is selected. Module 2's before-and-after triple step is a recommendation for one committed transform replacement. It is not an approved API, and it does not cover a curve.
- The numeric frame in section 5.
- The language of an authoritative scene. ADR-0001 still defers it. Adding no package here does not decide it. A second scene language remains a new ADR, which this note does not write.

## Out of this note

No application code, tests, fixtures, dependencies, workflow edits, or ADR. Implementation is not authorized.

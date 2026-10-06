# Module 4 — Spatial curve constraints

**Status:** Preparation input for issue #66. Not a specification. Not an ADR. Implementation is not authorized.
**Role:** Senior 3D / Rendering Engineer
**Date:** 2026-10-06

This note records rendering constraints for a later spatial curve. It is an input to issue #66, under parent issue #10. Issue #10 is a backlog placeholder. It does not authorize implementation, freeze scope, or choose an architecture.

Archive section 9.5 is context only. Its identifiers are not operational requirements. This note does not adopt them.

Module 4 stays in preparation. This note does not add a stroke, a curve, a scene kind, a viewport, a tool, an undo API, a dependency, a workflow change, or an ADR. It does not modify `packages/rendering`.

## Contract this note stands on

Module 1 is approved for implementation and is not GREEN. The contract is pull request #50, read from `m1/reconcile-preparation` at `a16d28220916c18a2434b8f30e5a54aa4d232c7e`. That branch was not checked out to write this note. The normative text there is `docs/modules/module-01-unified-scene/specification.md`. ADR-0009 on that same commit is the package decision. Neither file is on this branch. `origin/main` is `61cf9c97ebceeaa874bb3cf0b7b5f799911976a1`.

That contract, and not this note, says:

- One scene holds rectangle and box nodes in one hierarchy.
- A box stores width, height, and depth. Each extent is a canonical finite number strictly greater than zero.
- Every node stores one transform: position, rotation, and scale. Each component is a canonical finite triple. `-0` is stored as `0`. A non-finite component does not change the scene.
- The stored numbers round-trip. They do not assert an axis. The contract does not define an up axis, a handedness, a rotation order, degrees versus radians, or a pivot.
- Kinds are closed. There is no curve and no mesh. Text, images, curves, and meshes other than the box extents are out of that module.
- The null-renderer draw list stays empty. `rendering` is not given a new scene walk.

Module 2 preparation on `origin/main` does not approve a viewport or an undo API. This note does not treat a Module 3 creation tool as approved. Neither preparation adds a curve.

## 1. One transform record

**Constraint.** A later curve would have to share that one transform record. The record is the three finite triples already named on every Module 1 node: position, rotation, and scale. It is not a second transform, and it is not a renderer object.

A curve must not become its own authority by storing a matrix, a quaternion, an engine node, a glTF node, or a world placement instead of those triples. Per-sample positions must not become a second transform that replaces the node record. If a later module adds control data beside the node, that data is not this record and is not decided here.

`replaceTransform` on the approved contract replaces the three triples and changes nothing else. A later stroke edit must not be smuggled into that replacement, and a transform replacement must not be the only copy of editable curve data. This preparation adds neither operation.

The box depth is an extent. It is not a transform component. This note does not name which triple component, if any, is depth, and it does not treat depth as a mesh extrusion.

The scale triple is not accepted as stroke width, stroke radius, or visibility. The Module 0 numeric helpers still accept zero and negative scale. Extents stay a different check. This note does not change the helpers.

There is still one scene type. A spatial curve would have to live in that same hierarchy. This preparation does not add a kind, a field, or a document key. The approved contract rejects an unknown kind. Adding `curve` would be a later contract, not a rendering package change. The scene value is not in this branch.

## 2. Empty draw list

**Constraint.** In this preparation the null renderer keeps an empty draw list.

`packages/rendering/src/null-renderer.ts` on this branch defines `drawList` as `readonly []`. `renderNull` returns that frozen empty list, backend `null`, and device `not-requested`. It does not open a window and does not request a GPU. Two calls share the same frozen list. The Module 0 test source asserts that a push throws and that the next snapshot still has an empty list. This note does not run that test and does not change it.

ADR-0003 binds that snapshot as the Module 0 test double. The same ADR says the field list is not a promise that a later renderer receives the same object, draws flat and spatial items from one list, or recovers from device loss by rebuilding caches. Those ideas stay undecided. This preparation must not decide them by putting a stroke into the list.

An empty list is the constraint for now. Filling it, or allocating a second list the null renderer does not read, is outside this preparation. A curve item, a mesh item, a stable id, a material, or a `lost` status is not added. `renderNull` does not import the scene and does not walk a hierarchy. It must not become a second document.

Architecture section 10 still says `editor` must not import `rendering` until a new ADR amends the import table. This note is not that ADR and does not reserve a number. The shell still must not import `rendering` directly to draw a stroke.

## 3. No GPU API and no mesh

**Constraint.** No GPU API is selected. No mesh is selected.

Not selected, and not rejected for a later module by this note: WebGPU, WebGL2, and native `wgpu`. Three.js and Babylon.js are not a product renderer and not a disposable cache. No shader, canvas, camera, light, or material is selected. No runtime dependency is added.

The approved box is three extents and one transform. It has no vertices, indices, normals, or UVs. Those arrays would be a mesh. A tessellated stroke, a tube, or a triangle cache of a curve would also be a mesh. None is selected. Who tessellates a stroke stays deferred, as in the Module 0 rendering record.

The document must not be GPU buffers. Device loss, sleep, or removing an adapter must not be the way a curve disappears. This preparation does not implement recovery and does not store a curve. A later derived copy, if one is ever authorized, has to be rebuildable from the scene. It is not the null snapshot, and it is not the transform record.

Scene correctness is not a GPU image. Architecture section 15 still says a GPU golden image waits until a module draws, and even then the scene check is a CPU check of snapshot data. This preparation draws nothing, so it adds no image oracle.

## 4. Numeric frame is not accepted

**Constraint.** The numeric frame is not accepted. This note does not pick Y-up, glTF, radians, or a pivot. It does not pick Z-up, degrees, a screen-down axis, or any other frame either.

The approved Module 1 contract stores the triples and does not interpret them. ADR-0009 leaves coordinate conventions deferred and does not choose a pivot. Architecture still defers coordinate conventions. The Module 0 helpers accept a finite number and do not state an up axis, a handedness, a rotation order, or an angle unit.

Reading a triple as a translation along a named axis, as an Euler rotation, or as a scale along named axes would accept a frame. Sampling a stroke into space would do the same. This preparation does not sample, project, or draw.

Two earlier recommendations exist. Neither is accepted, and this note does not adopt either one.

- The Module 1 rendering review (2026-10-05) recommended a right-handed Y-up frame, intrinsic XYZ in radians, a glTF-like composition, and a center pivot. The approved contract did not accept that recommendation.
- The Module 2 design note recommends Y-up, right-handed, intrinsic XYZ, degrees. The Module 2 preparation index on `origin/main` records that recommendation as not accepted. The Module 2 editor and architecture notes refuse to interpret triples until a frame is accepted.

This note records no further frame recommendation. Y-up, glTF, radians, and a pivot stay unaccepted.

## Open questions

These stay open. They are not decisions and not acceptance criteria.

1. What, if anything, a later curve stores beside the shared transform. Control points, widths, and appearance are not specified here. Whatever that data is, it does not replace the three triples and it is not a mesh.
2. Whether a later snapshot names derived stroke data. ADR-0003 does not promise one draw list for flat and spatial items. This preparation keeps the null list empty either way.
3. The numeric frame. That remains a Product Owner decision. Until it is accepted, a curve cannot be placed in space by interpreting the triples, and no pivot for the stroke is chosen.
4. Whether a later viewport may call the renderer. That still requires a new ADR amending architecture section 10. This note does not write it.

## Out of this note

No application code, tests, fixtures, dependencies, workflow edits, or ADR. No change to `packages/rendering`, the null renderer, or its tests. No stroke tool and no undo API. Module 2 preparation does not become a viewport by being cited here.

Implementation of Module 4 is not authorized.

## Evidence

Read on 2026-10-06, without checking out `m1/reconcile-preparation` and without editing any file but this one:

- `docs/engineering/development-process.md`, especially preparation and the documentation layout
- `docs/engineering/architecture.md`, especially sections 3, 4, 10, and 15, and the deferred coordinate conventions
- ADR-0003 (`docs/engineering/adr/0003-render-snapshot-and-webgpu-direction.md`). `docs/engineering/adr/0003-null-renderer-and-draw-list.md` is not in the repository
- `packages/rendering/src/null-renderer.ts` and the assertions in `packages/rendering/src/rendering.test.ts`
- `docs/modules/module-02-direct-manipulation/preparation/README.md`, and the numeric-frame passages in that directory's `architecture-constraints.md`, `editor-2d.md`, and `interaction.md`
- Module 1 specification and ADR-0009 at `a16d28220916c18a2434b8f30e5a54aa4d232c7e` on `m1/reconcile-preparation`
- Archive section 9.5, as context only
- Issues #66 and #10

No GPU process was started. `pnpm` was not run. Tests, the build, and `pnpm verify` were not run.

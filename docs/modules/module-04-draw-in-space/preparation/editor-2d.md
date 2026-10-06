**Status:** Preparation input for issue #65. Not a specification. Not an ADR. Implementation is not authorized.
**Role:** Senior 2D / Editor Engineer
**Date:** 2026-10-06

# Module 4 — stroke editing seam

Parent issue #10 is a backlog placeholder. It does not authorize implementation. Archive section 9.5 in `docs/archive/product-engineering-specification-v1.0.md` is context only. Its identifiers are not operational requirements. Product overview section 5 is the intent that a drawn stroke keep an editable source, and that later derived geometry stay linked to that source. It does not authorize a curve, a tube, a surface, or an extrusion.

The approved Module 1 contract is `docs/modules/module-01-unified-scene/specification.md` on `m1/reconcile-preparation` at `a16d28220916c18a2434b8f30e5a54aa4d232c7e` (pull request #50). The Product Owner approved that specification for implementation on 2026-10-06: https://github.com/ericrommel/universal-editor/issues/7#issuecomment-6013883562. Module 1 is not GREEN. The approval is not on this branch, and this branch does not implement the contract. ADR-0009 on that same branch is the package decision. This note does not copy it, does not add an ADR, and does not take an ADR number.

That contract is rectangle and box only. Its mutating operations are insert, replace transform, replace extents, and subtree delete. It has no selection API, no editor change, and no curve.

Module 2 preparation on this branch does not approve a viewport or an undo API. Module 3 preparation does not approve a creation tool. This note does not approve one.

Recommendations below are not accepted.

## 1. What stays as it is

These are already binding. They are not recommendations of this note.

- Editor session state is only `starting`, `ready`, and `failed`. ADR-0008. There is no selection field, tool enum, panel registry, command bus, undo stack, or viewport attach. An empty field would become an API. This preparation adds none.
- `packages/editor/src/index.ts` exports `initializeFoundation`, `startSession`, `InitializationError`, `EditorSession`, `StartingSession`, and `SettledSession`. `initializeFoundation` returns without a project. `runHeadless` is not a package export, and it only starts that session. This preparation adds no export.
- `editor` may import `core` and `persistence` only. It must not import `ui`, React, `rendering`, or `platform`. Architecture section 10. A later call from `editor` to the renderer still needs a new ADR that amends that table. This note is not that ADR.
- The foundation screen is not a drawing surface. Its purpose string says creation tools are not part of this build. `ui` does not import `editor`. Frame ticks do not live in React state. Pointer samples do not call `setState`.
- The null renderer records an empty draw list. This note does not fill it and does not define a stroke draw item.
- The Module 0 finite-number rule is the only numeric rule used here. `-0` becomes `0`. A non-finite value is not a successful write. No vector type exists.
- The provisional manifest stays the two closed Module 0 fields. It is not a stroke document and not a history log. ADR-0006 selected no undo strategy.

## 2. Editable stroke control data

**Recommendation, not accepted.** The editable source would have to be control data on one stable id. It would not be a transform, and it would not be extents.

What that data would have to be:

- One object id. An edit of the source keeps that id. The source is not a new node on every change, and it is not one node per sample.
- An ordered list of controls on that id. Order in the list is the path order. It is not root order and not child order.
- Each control carries one position of three finite numbers, canonicalized by the same finite-triple rule a transform component already uses. Three components match that existing record. They do not name an axis. The triple is stored. It is not read as a translation, a tangent, or an angle.
- The list is what a later edit replaces, inserts into, or deletes from. That edit leaves the id in place.
- A derived tube, surface, extrusion, or mesh is not the source. Editing the source is not a replacement of the id by a box, a rectangle, or a list of either.

What an in-progress stroke would have to be, if a later gesture exists:

- Uncommitted samples live in editor memory beside the startup session. That is the split Module 2 recommended for a manipulation gesture. It was not accepted as architecture. Pointer movement replaces only the proposal. It does not write a document and it does not call `setState`.
- Commit writes the control list once, then drops the proposal, so the proposal cannot become a second path.
- Cancel drops the proposal and writes nothing.
- Chrome may receive plain values after commit or cancel. It does not receive the sample stream.
- This preparation does not add that memory. Naming the split does not add a session field.

This recommendation does not select polyline samples, Bezier handles, NURBS, weights, or a smoothing algorithm. Further control fields, if a later contract adds them, would still be data on that same id. They are not a second object and not a change of kind. They are not accepted here.

This is an editing seam only. It does not add a scene kind, a document key, or an editor export.

## 3. Basic appearance

**Recommendation, not accepted.** Basic appearance would have to be data on that same id. Replacing it would not replace the control list and would not replace the transform.

What it would have to be:

- One stroke width: a single finite number, canonicalized with the Module 0 rule. It is not rectangle width, not box width, height, or depth, and not a component of the scale triple. Module 1 requires an extent to be strictly greater than zero. That is the extent rule. It is not, by itself, the rule for this width. Whether zero is allowed is open.
- One plain color for the whole stroke. It is not a material, not a light, not a shader, and not a selection tint. It is not a foundation color role. Those roles are chrome. It is not the null renderer's clear color. The number canonicalizers are not a color encoding. This recommendation does not choose an encoding.
- Width and color belong to the stroke. They are not children and they are not controls. Replacing appearance leaves the control list and the id unchanged.

Caps, joins, dashes, gradients, opacity, and per-sample pressure are not part of this recommendation. A general color system is not part of it.

The geometric reading of the width, including screen width or world radius, is not decided. Choosing a reading would interpret the numeric frame. Section 6 leaves that frame untouched.

This recommendation does not add a field.

## 4. Which Module 1 operations cannot express it

The approved contract's node is an id, a kind of `rectangle` or `box`, an ordered child-id list, a transform of three finite triples (`position`, `rotation`, `scale`), `width`, `height`, and `depth` only on a box. There is no control list, no stroke width, and no color. There is no parent-id field and no selection field. Extents are finite and strictly greater than zero. The operations below are that contract. They are not implemented on this branch, and they are not an editor API.

The same absence applies to both halves of the seam. Insert, replace transform, replace extents, and subtree delete cannot store the control list, cannot edit one control while keeping the id, cannot store the stroke width, and cannot store the plain color.

### Insert

`insertNode` adds one leaf. The kind is `rectangle` or `box`. The caller supplies the id, the extents for that kind, one transform, a parent or null, and an index. Core does not mint the id.

Insert cannot express the seam:

- A stroke kind is not an insert input. On the document, an unknown kind is `INVALID_SHAPE`.
- The payload has no ordered control list, no per-control position, no stroke width, and no color.
- The index chooses a sibling slot. It does not order controls. A control is not a child. A child is a rectangle or a box.
- One insert per sample would be many ids, each required to carry extents strictly greater than zero. That graph is not one editable source.
- A second insert is a second object. It does not change the source of the first.

### Replace transform

`replaceTransform` replaces `position`, `rotation`, and `scale` on an existing rectangle or box. It changes nothing else. An unknown id is `UNKNOWN_NODE`. A non-finite component is `NON_FINITE_NUMBER` and leaves the scene unchanged.

Replace transform cannot express the seam:

- A control list is not three triples. The operation cannot replace one control, insert a control, or delete a control.
- Writing samples into the rotation or scale triple would store a path in a transform. The contract stores those numbers and does not interpret them. This note does not interpret them either.
- The operation cannot set a stroke width or a color, and it cannot change `rectangle` or `box` into a stroke.

A later whole-object placement, if a stroke also had a transform, would still not be the control list. The contract cannot store that pair, because it cannot store the stroke.

### Replace extents

`replaceExtents` replaces width and height, or width, height, and depth on a box, and keeps the kind. A finite extent that is not strictly greater than zero is `INVALID_EXTENT`. A rectangle that carries `depth`, or a box that omits an extent, is `INVALID_SHAPE`.

Replace extents cannot express the seam:

- Extents are the rectangle or box size. They are not a path, so they cannot hold the control list.
- Stroke width is not an extent. Using rectangle width as stroke width still stores a rectangle, which is a different object, and still stores no controls.
- There is no color field. An unknown document key is `INVALID_SHAPE`. An appearance key would be an unknown key.
- The operation cannot change kind, so it cannot turn a rectangle or a box into a stroke.

### Subtree delete

`deleteNode` removes the named id and every descendant. It does not promote children. Nodes outside the subtree keep their ids, kinds, extents, transforms, and order. An unknown id is `UNKNOWN_NODE` and leaves the scene unchanged.

Subtree delete cannot express the seam:

- It cannot remove one control and keep the stroke.
- It cannot clear appearance and keep the stroke.
- Storing controls as children, so that delete could remove one, fails both ways. A child cannot be a control, and delete removes a rectangle or box subtree.
- Delete followed by insert replaces the id. That is a different object, not an edit of control data or appearance.
- Delete is not undo. The contract has no undo and no redo. Deleting the node does not restore a control list or appearance.

### Empty scene and the document

`createScene` returns a scene with no nodes. It does not create a stroke.

`readScene` and `writeScene` round-trip only the closed rectangle and box shape. The writer has no place for a control list, a stroke width, or a color. The reader rejects an unknown kind and unknown keys, including `selection`. `writeManifest` still emits the two Module 0 fields. Neither codec can hold the source or the appearance. This note does not add a codec, a file writer, or a format id. ADR-0006 is unchanged.

The contract makes no change to `packages/editor`. This preparation makes none either.

## 5. No drawing API and no editor export

`packages/editor` must not gain a drawing API in this preparation. It must not gain an export.

Not added, including as types only: a begin, a sample append, a commit, a cancel, a control replace, a width replace, or a color replace. A type-only export would still be an export. No new `EditorSession` member is added. No tool is added to the foundation screen. `editor` does not import `rendering`.

Module 1's implementation authorization does not authorize any of that. That contract forbids an editor change. Module 4 implementation is not authorized.

## 6. Left untouched

### Numeric frame

Up axis, handedness, rotation order, and degrees versus radians stay deferred. The Module 2 design note recommends Y up, right-handed, intrinsic XYZ, and degrees. That recommendation is not accepted. This note does not accept it and does not replace it.

Stored finite triples are not a geometric reading. This note does not turn a control triple or a transform triple into an angle, a matrix, or a quaternion. No command is added that would do that.

### Module 2's open undo and selection disagreements

The four disagreements in `docs/modules/module-02-direct-manipulation/preparation/README.md` stay open. This note does not pick a side. Sections 2 and 3 are not a vote on them.

1. **Box move target.** The design note moves a box only by the axis handle under the pointer. The editor note allows a body drag to produce `move`. Untouched. No stroke body is introduced to settle it.
2. **Undo and selection.** The design note reselects the affected node on undo and on redo. The editor note does not change selection on undo or redo. Untouched. This note does not say whether a stroke commit, undo, or redo changes selection. The Module 1 contract has no selection API. This preparation does not add one.
3. **Redo shortcut.** The design note uses Ctrl+Shift+Z and Cmd+Shift+Z, and does not also use Ctrl+Y. The editor note uses Ctrl+Y and Shift+Z. Untouched. This note binds no keys.
4. **Hit-test method.** The Tech Lead recommends a later pure CPU test that returns an id or a miss, without a device. The Module 0 rendering record still treats CPU picking versus a pick buffer as deferred. Untouched. This note does not choose a pick method, a camera, or a draw item.

Module 2 also shares a recommendation that is not an accepted architecture: one committed manipulation that changes a transform is one undo step, and the stack does not survive reload. The Tech Lead's shape for that step stores the canonical before-triples and after-triples. That shape does not store a control list, a stroke width, or a color. The architecture note already says the shape does not cover a gesture that is not a finite-triple replacement. This note does not choose inverse patches, snapshots, or an event log, and it does not extend that step to a stroke.

## 7. Open questions

These are not recommendations and not decisions.

- Whether a committed source is a polyline of positions or controls that also carry handles.
- How many controls a committed stroke must have, including whether the list may be empty.
- Whether a stored stroke width may be zero or negative.
- Which encoding a plain color would use, if that appearance is later accepted.
- Whether control positions are local to a node transform or are world numbers. Either reading needs the numeric frame in section 6.
- Whether one completed stroke is one history step, and whether that step restores controls and appearance together. Section 6 leaves the undo disagreement untouched.
- Where a new stroke would sit among siblings. The contract's parent and index cannot place one.
- Smoothing, input tolerance, and any sample budget. No threshold is set.

## 8. Out of this note

No application code, test, fixture, dependency, workflow edit, scene kind, viewport, tool, undo API, or ADR. No editor export. Implementation is not authorized.

# Module 1 — Unified Scene

**Status:** Proposed. Not approved. This specification does not authorize implementation, and it is not acceptance of Module 0.

Implementation waits until Module 0 is GREEN under `docs/modules/module-00-foundation/specification.md` section 10 and the Product Owner approves this proposal.

## 1. Objective

Prove that one 2D object and one 3D object can live in one scene, one hierarchy, one transform record, and one scene document.

The proof is headless. Module 1 does not add the visual editor.

## 2. Required context

Before implementing this module, read:

- `/docs/product-overview.md`
- `/docs/engineering/development-process.md`
- `/docs/engineering/architecture.md`
- `/docs/engineering/adr/0006-domain-persistence-and-undo-direction.md`
- `/docs/engineering/adr/0008-editor-state-and-shell-content.md`
- `/docs/engineering/adr/0009-scene-model-and-scene-document.md`
- `/docs/modules/module-00-foundation/specification.md`

Archive section 9.2 states the same objective and is context only. Its identifiers are not this contract. Where this proposal is narrower than that archive section, the difference is in section 4.

## 3. Scope

This proposal includes:

- one in-memory scene value in `@uvcp/core`;
- rectangle and box nodes in one hierarchy;
- position, rotation, and scale stored as canonical finite triples;
- selection by node id;
- deletion of the selected node and its descendants;
- a scene document codec in `@uvcp/persistence`;
- headless tests discovered by the existing `pnpm test` command.

## 4. Out of scope

- A viewport, a canvas, hit testing, and gizmos. Archive section 9.2 allows selection from a viewport. This proposal selects by id only. A viewport writes its own decision, as ADR-0008 already says.
- Up axis, handedness, rotation order, and degrees versus radians. The stored numbers round-trip. A later module interprets them.
- More than one scene in a project.
- A user-facing save command, a file extension, a folder container, and hand-editing. The codec proves the document. ADR-0006 still defers who writes the file.
- Undo.
- Text, images, curves, meshes other than the box dimensions, materials, lights, cameras, and animation.
- Any change to the foundation screen or to the two-field provisional manifest.
- A new runtime dependency or a second scene language.

## 5. Functional requirements

### M1-FR-001 — Empty scene

The core shall create an empty scene with no nodes and no selection.

### M1-FR-002 — One hierarchy

A scene shall hold rectangle nodes and box nodes in the same ordered tree. A rectangle may parent a box, and a box may parent a rectangle.

### M1-FR-003 — Rectangle

The core shall add a rectangle node with a caller-supplied id and finite width and height.

### M1-FR-004 — Box

The core shall add a box node with a caller-supplied id and finite width, height, and depth to the same scene.

### M1-FR-005 — Transform

Every node shall store position, rotation, and scale as canonical finite triples. `-0` becomes `0`. A non-finite component is rejected and does not change the scene.

### M1-FR-006 — Selection

The core shall select an existing node by id and shall clear that selection. An unknown id is rejected and does not change the scene.

### M1-FR-007 — Removal

Deleting the selection shall remove that node and its descendants and shall clear the selection. Nodes outside that subtree keep their ids, kinds, dimensions, transforms, and child order. Deleting with no selection is rejected and does not change the scene.

### M1-FR-008 — Scene document

The persistence package shall write and read a scene document that reconstructs the nodes, hierarchy, dimensions, transforms, and selection. The provisional manifest writer shall still emit exactly `{"formatId":"universal-visual-creation-project","schemaVersion":1}`.

## 6. Non-functional requirements

### M1-NFR-001 — One scene type

Rectangle and box nodes shall be values in one scene type. Module 1 shall not add a separate 2D scene type and a separate 3D scene type.

### M1-NFR-002 — Closed kinds

The reader shall reject an unknown kind. Kind-specific dimensions stay on that kind. This module does not add a plugin loader.

### M1-NFR-003 — Deterministic document

Writing the same scene twice yields the same bytes. Reading those bytes yields an equal scene. Canonical finite numbers are the only intended numeric change.

### M1-NFR-004 — Reject the whole document

A document that fails validation throws `DomainError` and yields no scene. The error message does not include the document bytes. The caller's previous scene value is not modified.

### M1-NFR-005 — Module 0 regression

`pnpm verify` remains the regression gate. Module 0 checks stay in that command.

### M1-NFR-006 — Headless proof

The Module 1 tests run under `pnpm test`. They do not start Vite and do not open a window.

### M1-NFR-007 — Existing dependencies

Module 1 adds no runtime dependency. The scene document is parsed with `JSON.parse`. A host `RangeError` is invalid JSON. There is no nesting-depth limit.

## 7. Acceptance criteria

### M1-AC-001 — Shared hierarchy

Given an empty scene, adding a rectangle and a box places both node ids in that scene's tree, including the case where one is a child of the other.

### M1-AC-002 — Transform record

Reading either node returns its position, rotation, and scale triples. A triple that contained `-0` is returned as `0`.

### M1-AC-003 — Round-trip

Writing the scene and reading the bytes back preserves ids, kinds, parentage, order, dimensions, transforms, and selection.

### M1-AC-004 — Delete one subtree

Deleting the selected node removes that subtree and leaves every other node unchanged.

### M1-AC-005 — One headless suite

The behaviors above are covered by `*.test.ts` files that the existing test command discovers. The suite has no separate 2D runner and no separate 3D runner.

### M1-AC-006 — Manifest unchanged

After the scene codec is present, `writeManifest` still returns the closed Module 0 bytes, and a scene document is not accepted by `readManifest`.

### M1-AC-007 — Bad document

An empty document, a document over 262144 bytes, malformed JSON, a duplicate key, an unknown key, a duplicate id, and an unknown kind each throw `DomainError` and do not echo a sentinel planted in the input.

## 8. Verification

The Functional Quality Engineer owns the Module 1 test plan. Until that plan exists, the acceptance criteria above are the proposed checks. Developers implement them with `node:test` when implementation is authorized. The files do not need a `package.json` entry. `pnpm verify` is still the gate.

No browser session is required for this proposal.

## 9. Product Owner gate

This proposal recommends the narrowed scope in section 4. Approving the proposal adopts that scope for Module 1. It does not by itself make Module 0 GREEN, and it does not let implementation start before Module 0 is GREEN.

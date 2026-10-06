# Module 4 — Scene value constraints

**Status:** Preparation input for issue #68. Not a specification. Not an ADR. Implementation is not authorized.
**Role:** Senior Core / Platform Engineer
**Date:** 2026-10-06

Issue #68 asks why a curve must not be added to the approved scene value or to either current document codec. The parent is issue #10. This file records that constraint and the questions it leaves open. It does not add a stroke, a curve, a scene kind, a viewport, a tool, an undo API, a dependency, a workflow change, or an ADR.

The Module 1 contract is the specification at `m1/reconcile-preparation` (`a16d28220916c18a2434b8f30e5a54aa4d232c7e`), carried by pull request #50. That specification was approved for implementation on 2026-10-06. Module 1 is not GREEN. ADR-0009 on that same commit is the package decision for that contract. It is not on this branch, and this branch does not add an ADR. Another engineer is implementing that contract. This note does not change it.

Archive section 9.5 is context only. Its identifiers are not operational requirements. They are not used below.

Module 2 preparation on `main` does not approve a viewport or an undo API. Module 3 preparation does not approve a creation tool. This note does not fill either gap.

## 1. A curve is not added in this preparation

A curve must not be added to the Module 1 scene value, the scene document, or the provisional manifest in this preparation. Those are three different values. None of them gains a curve field here.

### Scene value

The approved contract puts one in-memory scene in `@uvcp/core`. The scene has exactly `rootIds` and `nodes`. A node kind is `rectangle` or `box`. An unknown kind is rejected. The contract lists curves as out of scope. There is no curve field and no plugin loader.

Adding a curve kind, or attaching curve data to these nodes, would change the contract that is already approved for implementation, before Module 1 is GREEN. Development process sections 2 and 20 do not allow the next module to enter implementation until the previous module is GREEN and the Product Owner approves it. Approval of the Module 1 specification authorizes that contract only. It does not authorize Module 4.

### Scene document

The same contract puts `readScene` and `writeScene` in `@uvcp/persistence`. That codec is not the provisional manifest. The format id is `universal-visual-creation-scene`. The schema token is the integer token `1`. A rectangle's keys, in writer order, are `id`, `kind`, `children`, `transform`, `width`, and `height`. A box adds `depth` after `height`. `transform` is `position`, `rotation`, and `scale`, each three JSON numbers. No other fields. An unknown key is `INVALID_SHAPE`. A kind other than `rectangle` or `box` is `INVALID_SHAPE`.

The scene byte cap is 1048576, checked on the `Uint8Array` before UTF-8 decode and before parse. A greater length is `TOO_LARGE`. A length of exactly 1048576 is not `TOO_LARGE` by length alone. That number is the scene document's cap. It is not a stroke budget, a point budget, or a budget for appearance bytes. This preparation does not invent a second cap, and it does not change the format id or the schema token.

### Provisional manifest

ADR-0006 and `packages/persistence/src/manifest.ts` bind the manifest that is on `main`. It has exactly two fields, `formatId` and `schemaVersion`. `writeManifest` emits `{"formatId":"universal-visual-creation-project","schemaVersion":1}` as UTF-8, with no BOM and no extra whitespace. The reader limit is 4096 bytes. The source states that this cap is only the provisional manifest, not a project-size limit. An unknown key is rejected. ADR-0006 puts no scene JSON in that codec.

The Module 1 contract keeps that writer, that rejection behavior, and that 4096-byte cap. `readManifest` rejects a scene document. A curve, a point list, stroke width, or appearance bytes do not belong in those two fields. Raising `schemaVersion` so the manifest means a stroke would change ADR-0006. This preparation does not.

## 2. Rectangle and box stay closed

Point lists, stroke width, and appearance bytes are not fields of the approved rectangle or box.

In memory, a node has `id`, `kind`, `childIds`, `transform`, `width`, and `height`. `transform` holds `position`, `rotation`, and `scale`. `depth` is present only when `kind` is `box`. There is no parent-id field and no selection field. `childIds` names child nodes. It is not a list of samples along a stroke.

`width`, `height`, and `depth` are the extents of that primitive. They are not a stroke width. Neither kind has an appearance field. This note does not add those fields, and it does not reuse the fields that exist to mean them.

## 3. Module 1 rules that stay

Caller-supplied ids, positive extents, and the finite-number helper stay Module 1 rules. This note does not invent a point schema or a second cap.

Ids stay the Module 1 node-id rule. The caller supplies every id. Core does not read a clock or a random source to mint one. An id is 1 through 64 UTF-8 bytes, already Unicode NFC, and free of the ASCII controls U+0000 through U+001F and U+007F. It is not trimmed, case-folded, or rewritten into NFC. A rejected id is `INVALID_ID`. One id on two nodes is `DUPLICATE_ID`. The message does not include the id. That rule is not a point schema, and this note does not add a point id or a second id rule. Scene ids are not manifest entry names.

Extents stay the Module 1 extent rule. Each extent is the result of `canonicalizeFiniteNumber` and is strictly greater than zero. `0` and `-1` are `INVALID_EXTENT`. A non-finite extent is `NON_FINITE_NUMBER`. A rectangle has no `depth`. The helper itself still accepts zero and a negative number, including a scale component. Positivity applies to extents, not to every finite number. ADR-0009 does not change the helper and does not choose a pivot. This note does not either. Stroke width is not given that extent rule here, because stroke width is not a field of the rectangle or the box.

The finite-number helper stays `canonicalizeFiniteNumber` and `canonicalizeFiniteTriple`, as ADR-0006 bound them. A finite number passes. `-0` becomes `0`. `NaN`, an infinity, and a non-number throw `NON_FINITE_NUMBER`. A value that is not three components fails the same way. The helper does not replace a bad component with `0`. It is not a vector, not a curve sample, and not a point type. This preparation does not add a numeric helper and does not describe a point as a triple.

## 4. No filesystem and no new dependency

Persistence does not call the filesystem. ADR-0006 defers who writes a user's file and what a failed write does. The Module 1 contract repeats that deferral. `writeManifest` takes no document. Entry-name checks do not open an archive. This preparation adds no file writer, no directory writer, no zip library, and no stroke entry.

No new dependency. The Module 1 contract adds no runtime dependency. Main has no vector type and no math library. A spline, stroke, or curve package is not added. Import edges stay as architecture section 10. No package, test, workflow, or ADR is added.

## 5. Left open

These stay unresolved. Closing one in this file would invent a schema, a cap, or a product decision.

- Whether any later module adds a curve object, after Module 1 is GREEN and the Product Owner authorizes that module. Archive section 9.5 does not decide it.
- How editable control data would be stored. Not as fields on the approved rectangle or box, and not as a schema here.
- Whether stroke width or appearance exists later, and in which value. Not on the approved nodes, and not in the provisional manifest.
- Whether later stroke bytes would fit in the existing 1048576-byte scene document. That cap is not redefined. No other cap is set.
- Up axis, handedness, rotation order, and degrees versus radians. The approved contract stores triples and does not interpret them.
- Undo. ADR-0006 selected none. The manifest is not a history log. No undo API is added.
- A viewport, a drawing tool, and selection. The Module 1 contract has none. This note does not add them.
- A user-facing save, a container, and hand-editing.
- A second scene type, or a second scene document, beside the one approved scene value.

## 6. Definition of Ready

Definition of Ready is development process section 8. From this role it is not met. Module 4 has no operational scope and no stable identifiers here. Module 1 is not GREEN. The Product Owner has not authorized Module 4 implementation.

No scene kind, document field, codec, test, dependency, workflow, or ADR is added. Implementation is not authorized.

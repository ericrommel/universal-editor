# Module 1 preparation — Tech Lead review

**Role:** Tech Lead

**Date:** 2026-10-05

**Status:** Proposed preparation review for issue #7. This is not Product Owner approval, not implementation authorization, and not Module 0 acceptance.

## Recommendation

Dissent from the starter position: none. Accept it as the proposed preparation scope for issue #7.

Prove the issue with a headless model only. One scene value is an ordered tree. A node is a rectangle or a box. Both kinds use one local transform of three finite triples, canonicalized with the existing `canonicalizeFiniteTriple`. Callers supply ids, so core stays free of the clock and of randomness. The operations are create, select by id, and delete one node without changing siblings. A scene-document codec, separate from the two-field provisional manifest, round-trips in-memory bytes only. Selection is editor session state and is not saved. There is no filesystem, viewport, canvas, shell change, GPU, undo, second scene, public extension, hand-editing promise, new dependency, or new language.

Archive section 9.2 is context for that objective. Its identifiers are not operational requirements. P-01 also requires one editing experience. This slice does not prove that clause.

This review does not authorize implementation. Development process sections 2 and 20 allow Module 1 implementation only after Module 0 is GREEN and the Product Owner approves the module. As recorded for this preparation, Module 0 is merged at `5e99484` and is not accepted. Issue #1 stays open. Section 8 is not met: there is no operational specification, no stable Module 1 identifiers, no approved test plan, and no Product Owner authorization. The choices below are not that authorization. Product questions in the quality note stay with the Product Owner.

## Packages

Add no new package. The current boundary table already permits the edges this slice uses. A new package, or an edge that lets `editor` import `rendering`, would need a new ADR. This review does not add that edge.

| Concern | Owner |
| --- | --- |
| Scene value, create, and delete | `@uvcp/core` |
| Scene-document codec | `@uvcp/persistence` |
| Selection | `@uvcp/editor` |

`core` imports no workspace package. It returns a new scene and does not mutate the input. It does not parse bytes. `persistence` may import `core` and still must not call the filesystem. `editor` may import `core` and `persistence` only. `rendering`, `ui`, `platform`, and the shell stay as Module 0 left them. The null-renderer draw list stays empty. Do not project nodes into that snapshot.

Do not add selection to the startup union or to `startSession`. Those stay `starting`, `ready`, and `failed`. Selection is a separate plain value. The shell does not receive it. No store framework is added.

## Model

The scene is not a node. Nodes are keyed by id. Sibling order is only the root id list and each node's child-id list. JSON object key order is not hierarchy order. A nested JSON tree is rejected: tree depth would sit on the `JSON.parse` stack, which Module 0 already saw fail inside a small byte size. Every child id exists, every non-root has one parent, and a cycle fails. Rectangle and box may interleave. There is no second scene type.

```ts
type Kind = "rectangle" | "box";
type Triple = readonly [number, number, number];
type Transform = {
  readonly translation: Triple;
  readonly rotation: Triple;
  readonly scale: Triple;
};
```

The caller passes the transform. There is no hidden default. The triples are local to the parent. This slice does not multiply a world matrix. The kind is the only geometric distinction. Width, height, and depth are not fields.

Ids are non-empty, unique, NFC, and at most 64 UTF-8 bytes. Comparison is exact. Do not case-fold them, and do not apply `checkEntryNames`. An id is not a path. Failures use `DomainError` with a fixed message. The message does not include the document or the id.

Create appends the new id under a parent, or at the root when the caller gives none. Delete removes exactly that node, and only when its child-id list is empty, then removes that id from its parent list. Siblings keep their ids, kinds, transforms, and relative order. Tests compare those values, not object identity. If the node has children, delete fails and the scene is unchanged. The parent can be deleted after its children are gone.

Selection holds one id or is empty. `editor` checks the id against the scene and does not write selection into the scene. An unknown id fails and leaves the previous selection. Deleting the selected id clears selection. Deleting any other id leaves it.

## Codec

`writeManifest` and `readManifest` stay unchanged, including the canonical bytes, `schemaVersion` 1, and the 4096-byte cap. The scene codec is a different pair of functions. It must not add fields to the manifest or pass a scene through `writeManifest`. Each reader rejects the other's document.

The writer emits canonical UTF-8 with no BOM and no extra whitespace. Node records are emitted in UTF-16 code-unit order of id, not locale order, so Ubuntu and Windows agree. Hierarchy order remains the id lists. Numbers are canonicalized before writing. Non-finite values are never written as `null`. The reader accepts insignificant whitespace and either key order. It rejects duplicate keys, unknown keys, non-UTF-8, and a BOM. A selection field is an unknown key and rejects the whole document. `SyntaxError` and `RangeError` from `JSON.parse` are invalid JSON. The scene document also needs its own byte cap, node cap, and structural depth cap. The operational specification sets those integers. They are not the manifest cap and not a product file-size promise. This slice does not add a depth rule to the manifest. A bad scene document is rejected whole. That does not decide quarantine for a later user file.

A discriminator, if the specification names one, is a test string in the same sense as the manifest format id. This review does not make it public, does not promise that it survives, and does not choose an extension. Whitespace tolerance is not a hand-editing promise. These bytes are untrusted even in memory. A security review of the new reader is still required before implementation. This note is not that review.

## Binding ADRs

No binding Module 0 ADR is contradicted. A proposed ADR is not required for this slice. This review does not revise ADR-0001 through ADR-0008 and is not an Accepted ADR.

- ADR-0001 binds TypeScript for the packages Module 0 created. This slice stays in those packages. It does not decide the deferred language of a later authoritative scene. A later move off TypeScript still needs its own ADR. That ADR is not written here.
- ADR-0003 binds the snapshot and the null renderer. This slice does not extend the draw list and does not select a graphics API.
- ADR-0006 binds the numeric helpers and the closed manifest. The scene schema was deferred, not forbidden. Using `canonicalizeFiniteTriple` does not change the helper and does not turn that helper into an axis or a rotation order. The new bytes are a separate document. No undo API is added.
- ADR-0008 binds startup state and a foundation screen without a viewport. Selection is additional session data. It is not a change to that union and not a shell control.

## Coordinates (proposed)

Proposed, not accepted: one right-handed, Y-up space for every node. Positive X points right, positive Y points up, and positive Z is their right-handed cross product. Rotation is intrinsic XYZ Euler in radians: X, then Y, then Z, each about the axis already moved by the previous rotation. Rectangle and box use that same meaning. It is not an extra field and not a per-node switch. Degrees shown later would be a view of these numbers, not a second stored unit.

Rejected for this module: Z-up, degree Euler, and a separate 2D angle. Z-up makes screen-up and scene-up disagree for a rectangle. Degrees, or one angle for 2D and a triple for 3D, would split the one transform. Quaternions are rejected here as well. They are not three triples, and they need a normalization rule the current helper does not have.

The helper's contract stays. Zero and negative scale pass. Angles are not wrapped. Tests of this slice check shared storage and canonical numbers. They do not treat this axis as an acceptance criterion until the Product Owner accepts the convention.

## Deferred

- Module 0 acceptance, Module 1 implementation, and any GREEN mark.
- Operational identifiers, the test plan, design behavior, and the integer document caps.
- P-01's editing experience: viewport, canvas, hit testing, hierarchy UI, tools, and gizmos.
- World matrices, extents, materials, meshes, text, images, and lights.
- Several scenes in one project, the container, filesystem save, a public format id, an extension, and hand-editing.
- Undo, persisted selection, multi-selection, reparent, subtree delete, and reorder beyond append.
- Quarantine of one bad object in a later user file, migration, and a richer numeric model.
- A new package, dependency, language, or import-table change.
- The product graphics API, the desktop host, and any change to the foundation screen.

## Evidence this slice would later require

`pnpm verify` stays the regression gate. Module 0 tests stay green. Proof is `node --test` with no window and no JSX. Core tests do not read bytes. Persistence tests do not touch the filesystem. One editor test must place a rectangle and a box in one tree, round-trip order and transforms, show that the bytes contain no selection, and delete one sibling without changing the other. That test must not import `ui` or start the shell. A browser session does not replace it.

# ADR-0009: Module 1 scene model and scene document

**Status:** Proposed. Not accepted. This ADR does not authorize implementation and does not accept Module 0.  
**Date:** 2026-10-05  
**Decider:** Tech Lead  
**Consulted:** The proposal is open for Core, Persistence, Quality, and Security review.

## Context

Issue #7 asks the team to prove that 2D and 3D objects can share one scene, one hierarchy, one persistence model, and one transform system. Archive section 9.2 is context for that objective. It is not the operational contract.

ADR-0006 binds a two-field provisional manifest and defers the scene schema, the container, and undo. It forbids scene JSON inside Module 0. ADR-0001 does not decide the language of a later authoritative scene, and it does not require a second language before there is a scene. ADR-0003 defers a product scene graph and any GPU. ADR-0008 says the foundation screen is not the editor layout and that a viewport writes its own decision.

The risk of waiting for every later product choice is that Module 1 never gets a testable contract. The risk of guessing a world axis, a file extension, or a viewport inside this proposal is that those guesses become the product.

## Decision

Module 1, once the Product Owner approves this proposal and Module 0 is GREEN, adds a headless scene value and a separate scene document. It does not add a viewport, a file dialog, or a change to the provisional manifest.

### Model

The scene value lives in `@uvcp/core`. Core still imports no UI, React, or filesystem API.

A scene is one immutable value: a selection, which is either absent or one node id, and an ordered list of root nodes. A node has an id, a kind, a transform, kind-specific dimensions, and an ordered list of child nodes. The kinds in this module are `rectangle` and `box`. A rectangle may parent a box, and a box may parent a rectangle.

The transform is three canonical finite triples from `canonicalizeFiniteTriple`: position, rotation, and scale. This module stores those numbers. It does not define an up axis, a handedness, a rotation order, or degrees versus radians. A later viewport module interprets them.

Dimensions are canonical finite numbers. Zero and negative values round-trip. This module does not decide that a size must be positive.

Operations return a new scene. They do not mutate the previous value. `createScene` returns an empty scene with no selection. `addNode` appends a node at the end of a named parent's child list, or at the end of the root list when no parent is given. `selectNode` selects an existing id. `clearSelection` clears it. `deleteSelection` removes the selected node and that node's descendants, and clears the selection. Nodes outside that subtree stay equal. A rejected operation throws `DomainError` and returns no replacement scene.

Ids are unique in the scene, non-empty, and at most 64 UTF-8 bytes. The caller supplies the id. Error messages do not include the document or the id.

### Document

The codec lives in `@uvcp/persistence`. Persistence still does not call the filesystem. Who writes a user's file, the extension, and whether the file is one document or a folder stay deferred.

The scene document is not the provisional manifest. `writeManifest` still emits exactly `{"formatId":"universal-visual-creation-project","schemaVersion":1}`.

The scene format id proposed here is `universal-visual-creation-scene`, schema version integer `1`. The writer is deterministic for one scene value. The reader rejects a leading BOM and ill-formed UTF-8 before `JSON.parse`. It accepts insignificant whitespace and either key order. It rejects duplicate keys on every object, including keys that differ only by JSON escaping, unknown keys, a non-integer version, and the wrong format id. It returns a new scene built from known fields. It does not copy the parsed object. `SyntaxError` and `RangeError` from `JSON.parse` become `DomainError` invalid JSON. The host error is not the message and not the cause. There is no nesting-depth limit.

The byte cap is 262144. The 4096-byte manifest cap stays the cap for that two-field document only. A scene needs its own bound so the parser is not handed an unbounded value. 256 KiB is large enough for the hierarchy this module tests and is not a product project-size limit.

A rejected document throws `DomainError` and returns no scene. The caller's previous scene is unchanged because the reader does not write into it.

### Out of this decision

Viewport hit testing, gizmos, cameras, lights, materials, animation, undo, multiple scenes, and a GPU draw of these nodes are not part of this ADR. A second scene language is still a new ADR, as ADR-0001 requires.

## Consequences

- Module 0 tests and the provisional manifest stay the regression baseline.
- Headless `node:test` files prove the model and the codec. A browser session is not that proof.
- Approving this ADR approves the proposal. It still does not authorize implementation while Module 0 is not GREEN.

## Confirmation

This ADR is proposed. The Product Owner has not accepted it.

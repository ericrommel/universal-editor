# ADR-0009: Module 1 scene model and scene document

**Status:** Accepted. This ADR authorizes the package decision for the approved Module 1 contract. It does not make Module 1 GREEN.  
**Date:** 2026-10-06  
**Decider:** Tech Lead  
**Consulted:** Senior Core / Platform Engineer, Senior 2D / Editor Engineer, Senior 3D / Rendering Engineer, Senior Product Designer / UX Architect, Functional Quality Engineer, Senior Application Security Engineer

## Context

Issue #7 asks the team to prove that 2D and 3D objects can share one scene, one hierarchy, one persistence model, and one transform system. Archive section 9.2 is context for that objective. It is not the operational contract.

ADR-0006 binds a two-field provisional manifest and defers the scene schema, the container, and undo. It forbids scene JSON inside the manifest codec. ADR-0001 binds TypeScript for the packages Module 0 created. It does not decide the language of a later authoritative scene, and it does not require a second language before there is a scene. ADR-0003 binds the null renderer and an empty draw list. ADR-0008 binds startup state and a foundation screen without a viewport.

Pull request #33 proposed a contract. Preparation reviews disagreed on selection, extents, document shape, insert and delete, and error codes. The Product Owner required the team to give each row one observable meaning. `docs/modules/module-01-unified-scene/preparation/reconciliation.md` records that meaning. The specification is the normative text.

## Decision

Module 1, once the Product Owner approves the specification, adds a headless scene value and a separate scene document. It does not add a viewport, a file dialog, a selection API, or a change to the provisional manifest.

### Packages

No new package and no new import edge.

| Concern | Owner |
| --- | --- |
| Scene value, insert, replace, and delete | `@uvcp/core` |
| Scene-document codec | `@uvcp/persistence` |

`core` imports no workspace package. It returns a new scene and does not mutate the input. It does not parse bytes. `persistence` may import `core` and still must not call the filesystem. `editor` may import `core` and `persistence` only, and this module does not add an editor API. `rendering`, `ui`, `platform`, and the shell stay as Module 0 left them. The null-renderer draw list stays empty.

### Model

The scene is one immutable value: an ordered root-id list and nodes addressed by id. A node has an id, a kind, extents, a transform, and an ordered child-id list. The parent is derived from those lists. A node does not store a parent id. The kinds are `rectangle` and `box`. Either kind may parent the other.

There is no selection field.

The transform is three canonical finite triples from `canonicalizeFiniteTriple`: position, rotation, and scale. This module stores those numbers. It does not define an up axis, a handedness, a rotation order, or degrees versus radians.

Extents are canonical finite numbers strictly greater than zero. The helpers still accept zero and negative scale. This ADR does not change the helpers, and it does not choose a pivot.

Operations return a new frozen scene. `createScene` returns an empty scene. `insertNode` places a new leaf at a caller-supplied index. `replaceTransform` and `replaceExtents` replace those fields on an existing id. `deleteNode` removes that id and its descendants and does not promote children. A rejected operation throws `DomainError` and returns no replacement scene.

Ids are unique, caller-supplied, NFC, free of ASCII controls, and 1 through 64 UTF-8 bytes. Core does not mint an id. Error messages do not include the document or the id.

### Document

The codec is `readScene` and `writeScene`. It is not the provisional manifest. `writeManifest` still emits exactly `{"formatId":"universal-visual-creation-project","schemaVersion":1}`.

The scene format id is `universal-visual-creation-scene`, schema version integer token `1`. That id is a codec discriminator. It is not a public format promise. The bytes are a flat object, `roots` plus `nodes`, as the specification defines. Child links are id strings. The writer is deterministic. The reader rejects a leading BOM, ill-formed UTF-8, duplicate keys on every object, unknown keys, a non-token version, and the wrong format id. `SyntaxError` and `RangeError` from `JSON.parse` become `DomainError` invalid JSON. The host error is not the message and not the cause. There is no nesting-depth limit on the manifest. The accepted scene shape does not nest a node inside a node.

The byte cap is 1048576, compared before decode. A greater length is rejected. An equal length is accepted. The 4096-byte manifest cap stays the cap for that two-field document only.

A rejected document throws `DomainError` and returns no scene. The reader builds a new scene from known fields and does not return the parsed object.

The duplicate walk is not the manifest function and does not reuse that function's reviver. A reviver used to read a raw token returns the value unchanged, does not write, and does not record `this` when `this` is `Object.prototype` or another intrinsic prototype. More raw keys than parsed keys is a duplicate-key failure. Any other disagreement between the walk and the parsed value throws `Error` with the message `Scene duplicate check lost alignment.` and returns no scene. ADR-0007's manifest rules stay on the manifest.

### Out of this decision

Selection, viewport hit testing, gizmos, cameras, lights, materials, animation, undo, multiple scenes, a user-facing save, and a GPU draw of these nodes are not part of this ADR. A second scene language is still a new ADR, as ADR-0001 requires. Coordinate conventions stay deferred.

## Consequences

- Module 0 tests and the provisional manifest stay the regression baseline.
- Headless `node:test` files prove the model and the codec. A browser session is not that proof.
- The five preparation rows have one expected result. Approving this ADR approves that result.
- Approving this ADR authorizes implementation only when the Product Owner says so. It does not by itself make Module 1 GREEN.

## Confirmation

The Product Owner approved the specification on 2026-10-06. This ADR is accepted as the package decision for that contract. Acceptance authorizes implementation of the contract. It does not make Module 1 GREEN.

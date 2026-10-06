# Module 1 preparation — reconciled contract

**Role:** Tech Lead

**Status:** Preparation decision for issue #7. Not Product Owner approval and not implementation authorization.

**Date:** 2026-10-06

## Why this record exists

Pull request #33 proposed a Module 1 contract. The reviews on pull request #32 disagreed with it on five rows. The Product Owner returned that proposal on 2026-10-05: the team resolves those rows so each requirement has one observable meaning, and does not send the alternatives back for the Product Owner to choose.

Module 0 is GREEN. Issue #1 is closed. That dependency no longer blocks Module 1 preparation. This record closes the five rows. The normative text is `../specification.md`. ADR-0009 records the package decision. The test plan states the single expected result for each row.

The earlier reviews stay in `reviews/` as the record of the positions this decision supersedes. They are not a second contract.

## Decisions

### Q-M1-B-001 — Selection

Selection is not a Module 1 value.

It is not a field of the scene, not a field of the document, and not an editor API. A document key named `selection` is an unknown key and fails `INVALID_SHAPE`. Delete names a node id.

The module objective is one hierarchy, one document, and one transform. The Tech Lead, core, 2D, and design reviews already keep selection out of the document. Core and design keep it out of this slice. A viewport selection belongs to a later manipulation module. Storing the id in the document would make editor state part of the persistence model.

This supersedes the selection field in pull request #33. It also supersedes, for this module, the editor-session selection in the Tech Lead review and the 2D review.

### Q-M1-B-002 — Extents

A rectangle has `width` and `height`. A box has `width`, `height`, and `depth`. Each extent is finite and strictly greater than zero.

Zero and negative extents fail `INVALID_EXTENT`. A non-finite extent fails `NON_FINITE_NUMBER`. A rectangle that carries `depth`, or a box that omits one extent, fails `INVALID_SHAPE`. `canonicalizeFiniteNumber` and `canonicalizeFiniteTriple` are unchanged. Zero and negative scale still pass. This module does not state a pivot, a center, or a corner.

A negative extent would be a second encoding of a moved positive extent, or of negative scale. This module already stores position and scale, and it does not interpret a corner span, so it does not keep a sign whose only reading was that span. A zero extent is not required to prove one rectangle and one box. The stricter existing review position is the contract. A later module can loosen `INVALID_EXTENT` without invalidating a document this module writes.

This supersedes the ADR-0009 sentence that zero and negative extents round-trip, the 2D review's acceptance of those values, and the Tech Lead review's omission of extent fields.

### Q-M1-B-003 — Document shape, order, and cap

The scene document is one flat JSON object. Nodes are records in a `nodes` array. Children are id strings, not nested node objects. The discriminator fields are `formatId` `universal-visual-creation-scene` and `schemaVersion` integer token `1`. Those fields are a codec test string in the same sense as the provisional manifest. They are not a public format promise, not a file extension, and not a hand-editing promise.

The writer emits a parent before its children, siblings in list order, UTF-8, no BOM, and no extra whitespace. The reader accepts insignificant whitespace and any key order, and it ignores `nodes` array order. Hierarchy order is `roots` and each `children` list.

The byte cap is 1048576. A `byteLength` greater than that cap fails `TOO_LARGE` before decode. A document of exactly 1048576 bytes is inside the cap. The manifest cap stays 4096.

Nested node objects would put tree depth on the `JSON.parse` stack. Module 0 already saw that stack fail inside a small document. Flat id lists keep the accepted JSON depth inside the schema. The format fields let each reader reject the other document with `UNSUPPORTED_FORMAT`. One mebibyte covers the rectangle and box hierarchies this module can describe. It contains no meshes and no images. The 262144 figure did not have a node budget.

This supersedes the core review's omission of format fields, the Tech Lead review's UTF-16 id sort as the writer order, and the 262144 cap in pull request #33. The reader still must not treat array order as hierarchy.

### Q-M1-B-004 — Insert and delete

`insertNode` takes a parent id, or null for a root, and an integer index. An index equal to the current length appends. An index outside that range fails `INVALID_HIERARCHY` and leaves the scene unchanged.

`deleteNode` removes that id and its descendants. It does not promote children. Nodes outside the subtree keep their ids, kinds, extents, transforms, and order. An unknown id fails `UNKNOWN_NODE`.

Sibling order is part of the hierarchy, so the index is an input. Append remains available. Subtree delete is the core and 2D result. A leaf-only delete would be a second procedure for the same outcome.

This supersedes append-only insert in pull request #33 and leaf-only delete in the Tech Lead review.

### Q-M1-B-005 — Error codes

The specification's error catalog is the code list. Module 0 codes are reused only where the meaning matches. The scene-only codes are `INVALID_ID`, `DUPLICATE_ID`, `INVALID_HIERARCHY`, `INVALID_EXTENT`, and `UNKNOWN_NODE`. `UNSUPPORTED_FORMAT` and `UNSUPPORTED_SCHEMA_VERSION` apply because this document has those fields.

Security requires fixed codes and messages. A test that accepts any `DomainError` would let two codecs disagree on every code.

Messages are the fixed sentences in the catalog. They do not include the document, a key, an id, or a number.

## Rules adopted with those rows

These were gaps in pull request #33, not a second product choice. The specification now states them.

- An id is caller-supplied, 1 through 64 UTF-8 bytes, Unicode NFC, and free of ASCII controls U+0000 through U+001F and U+007F. The codec does not trim, case-fold, or rewrite it.
- An accepted or rejected document leaves `Object.prototype` unchanged.
- A hierarchy walk visits each node at most once and then fails `INVALID_HIERARCHY`.
- A returned scene, node, id list, transform, and triple is frozen. The scene passed into an operation is not mutated.
- `@uvcp/editor`, `@uvcp/rendering`, `@uvcp/ui`, `@uvcp/platform`, and `apps/shell` do not change. The null-renderer draw list stays empty.

## Left undecided on purpose

These stay out of the pass/fail rows. A test that asserted one of them would be a new product decision.

- Up axis, handedness, rotation order, and degrees versus radians.
- Center versus corner pivot.
- Selection, including persisted selection.
- Undo, more than one scene, a user-facing save, a file extension, a folder, and hand-editing.
- A node-count cap beyond the byte cap, quarantine of one bad node, and a second scene language.

## What remains before implementation

Specialist concurrence that this text has one result per row, and that it does not break an accepted Module 0 contract. Then the Product Owner decides whether to authorize implementation.

This record does not mark Module 1 ready for development.

# Module 1 — Core / Platform preparation review

**Role:** Senior Core / Platform Engineer
**Date:** 2026-10-05
**Status:** Proposed preparation review. Not an ADR, not implementation authorization, and not Product Owner approval. Module 0 is not accepted here. Archive section 9.2 is context, not the operational contract. A later test plan must not treat these choices as pass/fail criteria until that scope is approved.

## Recommendation

Accept the starter position. Every choice below is proposed.

One headless scene value lives in `@uvcp/core`. The caller supplies string ids. A node is a rectangle or a box. Children are an ordered list. Transform is position, rotation, and scale, each passed through `canonicalizeFiniteTriple`. Core does not read a clock, a random source, or the filesystem, and it does not mint ids. The codec lives in `@uvcp/persistence`, separate from `readManifest` and `writeManifest`. Bytes stay in memory. Malformed documents throw `DomainError` and do not echo input. The provisional manifest stays two fields. The value is one scene, not several. Undo is out.

No viewport, selection, shell command, asset, zip, migration, or public format id is in this proposal.

## What already binds this

Architecture section 6 binds `DomainError` and the two canonicalizers. Finite numbers pass, `-0` becomes `0`, and `NaN`, infinities, and non-numbers throw `NON_FINITE_NUMBER`. There is no vector type. Section 8 binds the manifest to two fields and no scene. ADR-0006 leaves the scene schema, the container, and undo unselected. This review does not revise those decisions.

`@uvcp/core` currently exports only those helpers and imports no workspace package. `@uvcp/persistence` may import core. No new import edge and no new dependency are proposed.

## Scene value

Proposed. One scene value, owned by core. An empty scene has no nodes and an empty root list. That value is valid. It is not an error and it is not several scenes. A forest of top-level nodes is still one scene. Archive section 4.2, which allows more than one scene in a project, is not accepted.

A node has an id, a kind (`rectangle` or `box`), an ordered child-id list, and a transform. A rectangle has width and height. A box has width, height, and depth. Either kind may parent either kind. There is no group type and no second scene type for 2D.

The transform stores three triples. It does not choose an up axis, a rotation order, or degrees versus radians. Those stay deferred. Proposed: negative scale and zero scale are kept. They are finite. `-0` is normalized by the existing helper.

Proposed operations: empty scene, insert, replace transform, replace extents, and delete. Insert takes a new id, a kind, extents, a transform, and either a root index or a parent id plus a child index. No reparent operation. No default extents. No undo stack and no history field.

Proposed: operations and the codec return new values, not aliases of caller or parser objects, and those values are frozen. Edits do not mutate the previous scene.

Proposed split: persistence checks bytes, UTF-8, the size cap, JSON, and duplicate keys, then calls one core function with the parsed value. Core enforces ids, hierarchy, kind, transform, and extents. The writer walks a scene core has already accepted. Core does not call `JSON.stringify` on untrusted input. Persistence does not define a second scene type.

## Identifiers

Proposed. Ids are caller-supplied. Core does not call a clock, `Math.random`, or a UUID generator. An id is not a display name and not an entry name.

- An empty string is `INVALID_ID`. That is not `EMPTY`. `EMPTY` means zero input bytes.
- Length is 1 through 64 UTF-8 bytes. Over 64 is `INVALID_ID`, not `TOO_LARGE`. A UUID fits. The cap stays under the 255-byte entry-name rule so the two cannot be confused, and one id cannot spend the document budget.
- The string must already be NFC. Do not rewrite it. Non-NFC is `INVALID_ID`.
- ASCII controls, including NUL and U+007F, are `INVALID_ID`. Other Unicode is allowed. Whitespace is significant and is not trimmed.
- Do not ASCII-case-fold. `A` and `a` differ. Do not apply entry-name path rules.
- The same id on two nodes is `DUPLICATE_ID`. Comparison is the accepted string, exact.

## Parent and child

Proposed. The scene has an ordered root-id list. Each node has an ordered child-id list. Order is sibling order and is not sorted by id.

- Every node id appears in exactly one place: the root list, or one child list.
- Every child id names a node. A missing id, a repeated child, or two parents is `INVALID_HIERARCHY`.
- Walking from the roots reaches every node and never repeats a node. A cycle or an orphan is `INVALID_HIERARCHY`.
- A node is not its own child.

Store child lists and the root list only. Do not also store a parent id. The parent is derived. Two stored links were already the poorer fit in the Module 0 study.

Proposed delete: remove that node and every descendant. Drop the id from its parent list or the root list. Keep remaining sibling order. Do not promote children and do not rewrite other ids. Descendants belong to the deleted node. Siblings and other branches stay. Promotion would be a reparent, which this slice does not have. An unknown id throws `UNKNOWN_NODE` and is not success. The previous value is unchanged. Deleting the last node yields an empty scene.

## Extents

Proposed. Width, height, and box depth go through `canonicalizeFiniteNumber` first. A non-number, `NaN`, or infinity is `NON_FINITE_NUMBER`. That meaning matches the helper.

A finite value that is not strictly greater than zero is `INVALID_EXTENT`. Zero and negatives are rejected. A negative extent is not a flip. Sign belongs on scale, which this proposal keeps, including negative scale. Rejecting non-positive extents avoids two encodings of one mirror. A rectangle must not carry depth. A box must carry all three. Those mismatches are `INVALID_SHAPE`, not `INVALID_EXTENT`.

## Document shape

Proposed. Not a public format id. The bytes contain no `formatId` and no `schemaVersion`. They do not extend the provisional manifest. Canonical spelling is a test contract for this codec only. It is not a promise that the spelling survives a later public format. Extension, container, and hand-editing stay deferred. In-memory round trip is proposed. A user-facing save is not.

One JSON object with two fields: `roots` and `nodes`.

`roots` is an array of id strings and may be empty. `nodes` is an array of objects. On read, array order does not matter. The writer emits a parent before its children, roots first, siblings in list order, so one value gives one byte sequence.

Each node, in writer key order: `id`, `kind`, `children`, `transform`, then extents. `kind` is `rectangle` or `box`. `children` is an array of id strings. `transform` has `position`, `rotation`, and `scale`, each an array of three JSON numbers. A rectangle then has `width` and `height`. A box has `width`, `height`, and `depth`. No other fields. Unknown keys include `__proto__` and fail as shape. They are not inherited behavior.

The reader accepts insignificant whitespace and any key order. It rejects unknown fields, wrong types, and duplicate keys in any object. It returns a fresh scene or throws. It does not drop one bad node and keep the rest. Quarantine stays unselected. Failure yields no scene, so a previous value is not partly overwritten.

The writer emits UTF-8 with no BOM, no extra whitespace, and no trailing newline. `-0` is already `0`. Reading those bytes returns the same finite components.

## Byte cap

Proposed. Reject scene input over 1_048_576 bytes (1 MiB) before decode. The code is `TOO_LARGE`. The meaning matches the manifest: these bytes exceed the limit for this reader. The number must not. The manifest limit stays 4096 and is not a project limit. That cap would reject any useful hierarchy.

One MiB holds several thousand rectangle and box nodes and does not need a streaming parser. This slice has no meshes or images. The writer throws `TOO_LARGE` and returns no buffer if the canonical bytes would exceed the cap. Zero-length input is `EMPTY`, not an empty scene. No second node-count cap is proposed. `JSON.parse` `RangeError` stays `INVALID_JSON`, as on the manifest. No added nesting limit.

## Error codes

Proposed. Fixed messages. No id, number, length, or input excerpt. Codes match `^[A-Z][A-Z0-9_]{0,63}$`, the pattern editor startup already allows. This review does not route scene errors through startup.

Reuse only when the meaning matches:

- `EMPTY` — input length is zero. Not an empty scene and not an empty id.
- `TOO_LARGE` — scene bytes over 1 MiB, before decode. Not the 4096 manifest cap.
- `INVALID_ENCODING` — not UTF-8, or a leading BOM.
- `INVALID_JSON` — `JSON.parse` throws `SyntaxError` or `RangeError`.
- `DUPLICATE_KEY` — a JSON object repeats a member name. Any object, not only the root, because a nested duplicate can hide a field. Not two nodes with one id.
- `INVALID_SHAPE` — not the closed shape, including a kind other than `rectangle` or `box`, checked before a later field failure except for duplicate keys and non-finite numbers.
- `NON_FINITE_NUMBER` — a transform component or an extent is not a finite number. Call the existing helpers. Do not repair it to `0`.

Do not reuse `UNSUPPORTED_FORMAT` or `UNSUPPORTED_SCHEMA_VERSION`. This document has neither field. Do not reuse `ENTRY_NAME_REJECTED` or `ENTRY_NAME_CONFLICT`.

New codes, proposed:

- `INVALID_ID` — id text is rejected.
- `DUPLICATE_ID` — two nodes share an id.
- `INVALID_HIERARCHY` — the root and child lists are not a forest.
- `INVALID_EXTENT` — an extent is finite but not strictly positive.
- `UNKNOWN_NODE` — an operation names an id that is not in the scene. Not a decode failure.

## Out of this proposal

Undo, history in the file, selection, viewport, shell changes, cameras, lights, materials, text, images, meshes, animation, a public format id, an extension, a zip, a directory writer, and a migration registry. Coordinate conventions stay deferred. Who writes a user file stays deferred. The language of a later authoritative scene stays deferred. This slice can sit in the existing TypeScript packages because it is the headless value next to the canonicalizers, not a second runtime. Moving that language is still a new ADR.

Read for this review: core exports, `DomainError`, the canonicalizers, `manifest.ts`, ADR-0006, architecture sections 6 and 8, and the Module 1 quality note. No implementation, test run, or manifest change.

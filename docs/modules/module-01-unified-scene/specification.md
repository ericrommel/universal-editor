# Module 1 — Unified Scene

**Status:** Approved for implementation on 2026-10-06. Module 0 is GREEN. Module 1 is not GREEN. Sections 1 through 11 are the approved contract. Approval does not accept the module.

The preparation decision is `preparation/reconciliation.md`. This file is the normative contract. ADR-0009 is the package decision.

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
- `/docs/modules/module-01-unified-scene/preparation/reconciliation.md`
- `/docs/modules/module-01-unified-scene/test-plan.md`

Archive section 9.2 states the same objective and is context only. Its identifiers are not this contract. Where this specification is narrower than that archive section, the difference is in section 4.

## 3. Scope

This specification includes:

- one in-memory scene value in `@uvcp/core`;
- rectangle and box nodes in one hierarchy;
- position, rotation, and scale stored as canonical finite triples;
- width and height on a rectangle, and width, height, and depth on a box;
- insert at an index, replace of a transform, replace of extents, and delete of one subtree;
- a scene document codec in `@uvcp/persistence`;
- the error catalog in section 8;
- headless tests discovered by the existing `pnpm test` command.

## 4. Out of scope

- Selection. No scene field, no document field, and no editor-session API. Archive section 9.2 allows selection from a viewport. This module deletes by node id. A later module writes the selection decision.
- A viewport, a canvas, hit testing, and gizmos.
- Up axis, handedness, rotation order, degrees versus radians, and pivot. The stored numbers round-trip. A later module interprets them.
- More than one scene in a project.
- A user-facing save command, a file extension, a folder container, and hand-editing. The codec proves the document. ADR-0006 still defers who writes the file.
- Undo, reparent, and a separate reorder operation. Order changes by the insert index of a new node.
- Text, images, curves, meshes other than the box extents, materials, lights, cameras, and animation.
- Any change to the foundation screen, the editor package, the rendering package, the platform package, the shell, or the two-field provisional manifest.
- A new runtime dependency or a second scene language.

## 5. Scene value

`@uvcp/core` exports the scene operations. Core still imports no UI, React, filesystem API, or workspace package.

A scene object has exactly two fields: `rootIds` and `nodes`. `rootIds` is the ordered root-id list. `nodes` is a record addressed by id and is not hierarchy order. There is no `selection` field.

A node has:

- `id`
- `kind`, which is `rectangle` or `box`
- `childIds`, an ordered list of ids
- `transform`, with `position`, `rotation`, and `scale`
- `width` and `height`
- `depth` only when `kind` is `box`

A node has no parent-id field and no selection field. The parent is the list that contains the id. Each id appears in exactly one list: the roots, or one `childIds` list. A rectangle may parent a box, and a box may parent a rectangle.

Each transform component is the result of `canonicalizeFiniteTriple`. `-0` is returned as `0`. Each extent is the result of `canonicalizeFiniteNumber` and is strictly greater than zero.

`createScene`, `insertNode`, `replaceTransform`, `replaceExtents`, and `deleteNode` return a new scene. The scene, the `nodes` record, each node, each id list, each transform, and each triple on that result is frozen. The scene passed in is not mutated. Its observable ids, kinds, extents, transforms, and order stay as they were.

`createScene` returns a scene with no nodes and an empty root list.

`insertNode` adds one leaf. The input names the id, the kind, the extents for that kind, the transform, the parent, and the index. The parent is null for a root, or an id already in the scene. The index is an integer from 0 through the current length of that list, inclusive. The length appends.

`replaceTransform` replaces the transform of an existing id. `replaceExtents` replaces the extents of an existing id and keeps the kind. Neither operation moves the node or changes its children.

`deleteNode` removes the named id and every descendant. It removes that id from its parent list or from the roots. It does not promote children. Nodes outside the subtree keep their ids, kinds, extents, transforms, and order. Deleting the last node yields an empty scene.

A rejected operation throws `DomainError` and returns no scene.

## 6. Functional requirements

### M1-FR-001 — Empty scene

The core shall create an empty scene with no nodes and an empty root list. That value is not an error.

### M1-FR-002 — One hierarchy

A scene shall hold rectangle nodes and box nodes in the same ordered tree. A rectangle may parent a box, and a box may parent a rectangle. There is one scene type.

### M1-FR-003 — Rectangle

The core shall add a rectangle with a caller-supplied id, a width and height that are each strictly greater than zero, and no depth.

### M1-FR-004 — Box

The core shall add a box with a caller-supplied id and a width, height, and depth that are each strictly greater than zero to the same scene.

### M1-FR-005 — Transform

Every node shall store position, rotation, and scale as canonical finite triples. `-0` becomes `0`. A non-finite component throws `NON_FINITE_NUMBER` and does not change the scene. `replaceTransform` changes those triples on an existing id and changes nothing else.

### M1-FR-006 — Insert

The core shall insert a node at a caller-supplied index in the root list, or in the child list of a named parent. An index equal to the current length appends. A missing parent throws `UNKNOWN_NODE`. An index that is not an integer, or that is outside `0` through that length, throws `INVALID_HIERARCHY`. Either failure leaves the scene unchanged.

### M1-FR-007 — Removal

Deleting a node by id shall remove that node and its descendants. Nodes outside that subtree keep their ids, kinds, extents, transforms, and child order. An unknown id throws `UNKNOWN_NODE` and does not change the scene.

### M1-FR-008 — Scene document

The persistence package shall write and read a scene document that reconstructs the nodes, hierarchy, extents, and transforms. The document does not contain a selection. The provisional manifest writer shall still emit exactly `{"formatId":"universal-visual-creation-project","schemaVersion":1}`.

### M1-FR-009 — Identifiers

The caller shall supply every id. Core shall not read a clock or a random source to mint one. An id is 1 through 64 UTF-8 bytes, already Unicode NFC, and free of the ASCII controls U+0000 through U+001F and U+007F. The implementation shall not trim it, case-fold it, or rewrite a non-NFC id into NFC. A rejected id throws `INVALID_ID`. The same id on two nodes throws `DUPLICATE_ID`. The message does not include the id.

## 7. Non-functional requirements

### M1-NFR-001 — One scene type

Rectangle and box nodes shall be values in one scene type. Module 1 shall not add a separate 2D scene type and a separate 3D scene type.

### M1-NFR-002 — Closed kinds

The reader shall reject an unknown kind. Kind-specific extents stay on that kind. This module does not add a plugin loader.

### M1-NFR-003 — Deterministic document

Writing the same scene twice yields the same bytes. Reading those bytes yields an equal scene. Canonical finite numbers are the only intended numeric change. The spelling is the writer order in section 9.

### M1-NFR-004 — Reject the whole document

A document that fails validation throws `DomainError` and yields no scene. The reader rejects a BOM and ill-formed UTF-8 before `JSON.parse`. Duplicate keys are rejected on every object, including escape-equivalent spellings. The scene is built from known fields and is not the parsed object. The reader does not assign, spread, or merge parsed keys onto an object. The error message does not include the document bytes, and the host `SyntaxError` or `RangeError` is not the message or the cause. `cause` is unset. The caller's previous scene value is not modified. After an accepted document and after a rejected document, `Object.prototype` is unchanged. A duplicate walk runs only after `JSON.parse` succeeds. More raw keys than parsed keys is `DUPLICATE_KEY`. Any other disagreement between that walk and the parsed value throws `Error` with the message `Scene duplicate check lost alignment.`, returns no scene, and is not a successful read.

### M1-NFR-005 — Module 0 regression

`pnpm verify` remains the regression gate. Module 0 checks stay in that command. `readManifest` and `writeManifest` keep their Module 0 acceptance, rejection, codes, messages, and 4096-byte cap.

### M1-NFR-006 — Headless proof

The Module 1 tests run under `pnpm test`. They do not start Vite and do not open a window.

### M1-NFR-007 — Existing dependencies and bounds

Module 1 adds no runtime dependency. The scene document is parsed with `JSON.parse`. A host `RangeError` is `INVALID_JSON`. There is no nesting-depth limit on the provisional manifest. The scene byte cap is 1048576, checked on the `Uint8Array` before UTF-8 decode and before parse. A hierarchy walk visits each node at most once.

## 8. Error catalog

Every failure uses `DomainError`. The `code` matches `^[A-Z][A-Z0-9_]{0,63}$`. The `message` is the fixed sentence in this table and nothing else. No failure includes the document, a key, an id, a numeric excerpt, or a host error as `cause`.

| Code | Message | Meaning |
| --- | --- | --- |
| `EMPTY` | Scene document is empty. | The input length is zero. Not an empty scene and not an empty id. |
| `TOO_LARGE` | Scene document exceeds the size limit. | The byte length is over 1048576, before decode. The writer uses the same code when the canonical bytes would be over that cap. |
| `INVALID_ENCODING` | Scene document is not UTF-8 text. | The bytes are not UTF-8, or they start with a UTF-8 BOM. |
| `INVALID_JSON` | Scene document is not valid JSON. | `JSON.parse` throws `SyntaxError` or `RangeError`. |
| `DUPLICATE_KEY` | Scene document contains a duplicate key. | A JSON object repeats a member name, including spellings that differ only by escaping. |
| `INVALID_SHAPE` | Scene shape is not accepted. | The value is not the closed scene shape. This includes a non-`Uint8Array` input, an unknown key, a missing required field, a kind other than `rectangle` or `box`, a rectangle that has `depth`, and a box that lacks an extent. |
| `UNSUPPORTED_FORMAT` | Scene document format is not supported. | `formatId` is a string and is not `universal-visual-creation-scene`. |
| `UNSUPPORTED_SCHEMA_VERSION` | Scene document schema version is not supported. | The `schemaVersion` token is not the integer token `1`. |
| `NON_FINITE_NUMBER` | Expected a finite number. | A transform or an extent is not a finite number. This is the existing helper message. |
| `INVALID_ID` | Scene id is not accepted. | The id text fails M1-FR-009. |
| `DUPLICATE_ID` | Scene contains a duplicate id. | Two nodes share one id. |
| `INVALID_HIERARCHY` | Scene hierarchy is not accepted. | The root list and child lists are not a tree, or an insert index is not an integer in range. |
| `INVALID_EXTENT` | Scene extent is not accepted. | An extent is finite and is not strictly greater than zero. |
| `UNKNOWN_NODE` | Scene node was not found. | An operation names an id that is not in the scene. Not a document failure. |

The first matching rule wins.

Document order:

1. The input is not a `Uint8Array`: `INVALID_SHAPE`.
2. `byteLength` is 0: `EMPTY`.
3. `byteLength` is greater than 1048576: `TOO_LARGE`.
4. The bytes start with a UTF-8 BOM, or they are not UTF-8: `INVALID_ENCODING`.
5. `JSON.parse` throws `SyntaxError` or `RangeError`: `INVALID_JSON`.
6. Any object repeats a key: `DUPLICATE_KEY`.
7. The root is not an object, the root has an unknown key, or `formatId` is missing or is not a string: `INVALID_SHAPE`.
8. `formatId` is a string other than `universal-visual-creation-scene`: `UNSUPPORTED_FORMAT`.
9. `schemaVersion` is missing: `INVALID_SHAPE`.
10. The `schemaVersion` source token is not `1`, including `1.0`, `1e0`, and `"1"`: `UNSUPPORTED_SCHEMA_VERSION`.
11. `roots` or `nodes` is missing or is not an array, a node is not an object, a required key is missing, an unknown key is present, `children` is not an array of strings, `transform` is not an object, `kind` is not `rectangle` or `box`, or the depth fields do not match the kind: `INVALID_SHAPE`.
12. A present transform component or extent is not a finite number, including a value that is not a number and a triple that is not three components: `NON_FINITE_NUMBER`. The helper's code is the code for that field.
13. An extent is finite and is not strictly greater than zero: `INVALID_EXTENT`.
14. An id fails M1-FR-009: `INVALID_ID`.
15. Two nodes share an id: `DUPLICATE_ID`.
16. The lists are not a tree: `INVALID_HIERARCHY`.

Operation order for `insertNode`, after the incoming scene is left untouched:

1. The input is missing a required field, has an unknown field, or pairs `depth` with the wrong kind: `INVALID_SHAPE`. A present extent or transform field is not decided here.
2. The id fails M1-FR-009: `INVALID_ID`.
3. The id is already in the scene: `DUPLICATE_ID`.
4. `parentId` is a string that is not in the scene: `UNKNOWN_NODE`.
5. `index` is not an integer in range for that list: `INVALID_HIERARCHY`.
6. A transform component is not three finite numbers: `NON_FINITE_NUMBER`.
7. An extent is not a finite number: `NON_FINITE_NUMBER`.
8. An extent is not strictly greater than zero: `INVALID_EXTENT`.

`replaceTransform` checks the id first (`UNKNOWN_NODE`), then the transform (`NON_FINITE_NUMBER`). `replaceExtents` checks the id first, then the closed extent fields for that node's kind (`INVALID_SHAPE`), then `NON_FINITE_NUMBER`, then `INVALID_EXTENT`. `deleteNode` checks the id (`UNKNOWN_NODE`) and then removes the subtree.

A document cycle, a repeated visit, a missing child id, a node in two lists, an orphan, or a self-child is step 16. The walk that detects it visits each node at most once.

## 9. Scene document

`readScene` and `writeScene` live in `@uvcp/persistence`. Persistence still does not call the filesystem.

The document is not the provisional manifest. `readManifest` rejects a scene document. `readScene` rejects the canonical manifest bytes with `UNSUPPORTED_FORMAT`.

The writer emits UTF-8 with no BOM, no extra whitespace, and no trailing newline. Two writes of one scene return the same bytes, including on the CI hosts. Numbers are the canonical finite values written with the ordinary JSON number spelling of those values. `-0` has already become `0`.

Root key order is `formatId`, `schemaVersion`, `roots`, `nodes`.

`roots` is an array of id strings. It may be empty. `nodes` is an array of objects. The writer emits a parent before its children, roots first, siblings in list order. The reader treats that array order as insignificant.

Each rectangle, in key order: `id`, `kind`, `children`, `transform`, `width`, `height`. Each box adds `depth` after `height`. `kind` is `rectangle` or `box`. `children` is an array of id strings. `transform` has `position`, `rotation`, and `scale`, in that key order, each an array of three JSON numbers. No other fields.

The reader accepts insignificant whitespace and any key order. It rejects unknown fields, including `selection`, `__proto__`, `constructor`, and `prototype`. It returns a fresh scene or throws. It does not drop one bad node and keep the rest.

The duplicate walk is not the manifest function and does not reuse that function's reviver. A reviver used to read a raw token returns the value unchanged. It does not return `undefined`, it does not write, and it does not record `this` when `this` is `Object.prototype` or another intrinsic prototype. More raw keys than parsed keys is `DUPLICATE_KEY`. Any other disagreement throws `Error` with the fixed message `Scene duplicate check lost alignment.` The message does not include the document. That failure is not `DomainError` and not a successful read.

An empty scene is an empty root list and no nodes. Zero input bytes are `EMPTY`, not that scene.

## 10. Acceptance criteria

### M1-AC-001 — Shared hierarchy

Given an empty scene, inserting a rectangle and a box places both ids in that scene, including the case where one is a child of the other. Inserting at an index between two existing siblings places the new id at that index.

### M1-AC-002 — Transform record

Reading either node returns its position, rotation, and scale triples. A triple that contained `-0` is returned as `0`. `replaceTransform` changes that triple and leaves kind, extents, parentage, and order unchanged. The triples do not assert an axis.

### M1-AC-003 — Round-trip

Writing the scene and reading the bytes back preserves ids, kinds, parentage, order, extents, and transforms. It does not preserve a selection, because the document has none. Writing the same scene twice yields the same bytes.

### M1-AC-004 — Delete one subtree

Deleting a node by id removes that subtree and leaves every other node unchanged.

### M1-AC-005 — One headless suite

The behaviors in this specification are covered by `*.test.ts` files that the existing test command discovers. The suite has no separate 2D runner and no separate 3D runner.

### M1-AC-006 — Manifest unchanged

After the scene codec is present, `writeManifest` still returns the closed Module 0 bytes. `readManifest` rejects a scene document. `readScene` rejects the canonical manifest bytes with `UNSUPPORTED_FORMAT`.

### M1-AC-007 — Bad document

Each of the following throws the named code, yields no scene, and does not echo a sentinel planted in the input:

| Input | Code |
| --- | --- |
| Not a `Uint8Array` | `INVALID_SHAPE` |
| Zero bytes | `EMPTY` |
| 1048577 bytes, including when the extra byte is not UTF-8 | `TOO_LARGE` |
| A leading UTF-8 BOM | `INVALID_ENCODING` |
| Ill-formed UTF-8 inside the cap | `INVALID_ENCODING` |
| Malformed JSON | `INVALID_JSON` |
| A duplicate key at the root or on a nested object, including an escape-equivalent spelling | `DUPLICATE_KEY` |
| An unknown key, including `selection` | `INVALID_SHAPE` |
| The manifest format id | `UNSUPPORTED_FORMAT` |
| A schema token other than `1` | `UNSUPPORTED_SCHEMA_VERSION` |
| An unknown kind | `INVALID_SHAPE` |
| A duplicate id | `DUPLICATE_ID` |
| A cycle, a missing child, two parents, or a self-child | `INVALID_HIERARCHY` |

Exactly 1048576 bytes is not `TOO_LARGE` by length alone. A host `RangeError` from `JSON.parse` is `INVALID_JSON` and does not abort the process.

### M1-AC-008 — Extents

A positive finite extent is stored and round-trips. `0` and `-1` throw `INVALID_EXTENT` and leave the previous scene unchanged. A non-finite extent throws `NON_FINITE_NUMBER`. A rectangle has no `depth`. The test does not assert a pivot.

## 11. Verification

The test plan is `test-plan.md`. Developers implement those checks with `node:test` when implementation is authorized. The files do not need a `package.json` entry. `pnpm verify` is still the gate.

No browser session is required for this specification. No screenshot is required.

## 12. Product Owner gate

Approving this specification adopts the scope in sections 3 and 4, the catalog in section 8, and the document in section 9. That approval is the authorization to implement Module 1. It does not make Module 1 GREEN.

The Product Owner approved this specification on 2026-10-06: https://github.com/ericrommel/universal-editor/issues/7#issuecomment-6013883562. Implementation of this contract is authorized. Module 1 stays open until the later acceptance gate.

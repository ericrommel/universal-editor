# Module 1 — Test Plan

**Status:** Proposed. Not approved. This plan does not authorize implementation.

**Owners:** Functional Quality Engineer and Non-Functional Quality Engineer

**Sources:** `specification.md` and ADR-0009 after the reconciliation dated 2026-10-06. The earlier reviews under `preparation/reviews/` are inputs. `preparation/reconciliation.md` is the decision where those reviews disagreed.

**Date:** 2026-10-06

## 1. How to read a row

Each scenario names the specification identifier it covers and one expected result. A row marked **Specified** is stable enough to implement after the Product Owner approves the specification. This plan does not give that approval.

Archive section 9.2 is context. Its identifiers are not the identifiers in this plan.

No row in this plan has a second expected result. The five rows that previously did are TP-M1-F-004, F-005, F-006, F-007, and F-008.

## 2. Traceability

| Id | Scenario | Specification | State |
| --- | --- | --- | --- |
| TP-M1-F-001 | Empty scene and empty bytes | M1-FR-001, M1-AC-007 | Specified |
| TP-M1-F-002 | One hierarchy, both kinds | M1-FR-002, M1-AC-001, M1-NFR-001 | Specified |
| TP-M1-F-003 | Finite triples | M1-FR-005, M1-AC-002 | Specified |
| TP-M1-F-004 | Insert at an index | M1-FR-006, M1-AC-001 | Specified |
| TP-M1-F-005 | No selection | M1-FR-008, M1-AC-003 | Specified |
| TP-M1-F-006 | Delete one subtree | M1-FR-007, M1-AC-004 | Specified |
| TP-M1-F-007 | Strictly positive extents | M1-FR-003, M1-FR-004, M1-AC-008 | Specified |
| TP-M1-F-008 | Document shape, order, and cap | M1-FR-008, M1-NFR-003, M1-AC-003, M1-AC-007 | Specified |
| TP-M1-F-009 | Round-trip of an accepted scene | M1-NFR-003, M1-AC-003 | Specified |
| TP-M1-F-010 | Reject the whole document | M1-NFR-004, M1-AC-007 | Specified |
| TP-M1-F-011 | Separate manifest | M1-FR-008, M1-AC-006, M1-NFR-005 | Specified |
| TP-M1-F-012 | Caller-supplied ids | M1-FR-009 | Specified |
| TP-M1-F-013 | A structure that is not a tree | M1-FR-002, M1-NFR-007 | Specified |
| TP-M1-F-014 | Closed kinds | M1-NFR-002, M1-AC-007 | Specified |
| TP-M1-F-015 | Replace transform and extents | M1-FR-005, M1-AC-002, M1-AC-008 | Specified |
| TP-M1-N-001 | Headless suite | M1-NFR-006, M1-AC-005 | Specified |
| TP-M1-N-002 | No new dependency and no viewport | M1-NFR-002, M1-NFR-007 | Specified |
| TP-M1-N-003 | Module 0 regression | M1-NFR-005 | Specified |
| TP-M1-N-004 | Cap and parse failure | M1-NFR-007, M1-AC-007 | Specified |
| TP-M1-S-001 | Security conditions | M1-NFR-004, M1-NFR-007 | Specified |
| TP-M1-D-001 | Foundation screen unchanged | Section 4 | Specified |
| TP-M1-O-001 | Existing verify workflow | M1-NFR-005 | Specified |

## 3. Functional scenarios

### TP-M1-F-001 — Empty scene and empty bytes

Call `createScene`.

Expected result: the call succeeds. `rootIds` is empty and `nodes` has no keys. The scene object has no other field, including no `selection`. That value is not an error. The returned scene and `rootIds` are frozen.

Pass zero bytes to `readScene`.

Expected result: `DomainError` with code `EMPTY` and message `Scene document is empty.` No scene is returned.

Covers: M1-FR-001, the empty-document case of M1-AC-007.

### TP-M1-F-002 — One hierarchy, both kinds

Start from an empty scene. Insert a rectangle as a child of a box, and in another scene insert a box as a child of a rectangle.

Expected result: both ids are in the same scene value. There is one scene type. There is no second 2D scene type and no second 3D scene type. Sibling order is the stored id-list order.

Covers: M1-FR-002, M1-AC-001, M1-NFR-001.

### TP-M1-F-003 — Finite triples

Store position, rotation, and scale on a rectangle and on a box. Include a component of `-0`. Read the node back.

Expected result: each triple has three components. `-0` is returned as `0`. The same three fields exist on both kinds. The returned triple is frozen.

Pass `NaN`, an infinity, or a non-number as a component to `insertNode` or `replaceTransform`.

Expected result: `DomainError` with code `NON_FINITE_NUMBER` and message `Expected a finite number.` The previous scene value is unchanged. The helper is not given a replacement of `0`.

Covers: M1-FR-005, M1-AC-002.

This scenario does not assert an up axis, a rotation order, degrees versus radians, or a world matrix.

### TP-M1-F-004 — Insert at an index

Insert two root nodes. Insert a third root at index 1.

Expected result: the root-id list is first, third, second. An index equal to the list length appends.

Insert a child at index 0 under a parent that already has one child.

Expected result: the new id is the first child. The previous child stays second.

Use an index of `-1`, `1.5`, and one past the length. Use a parent id that is not in the scene, and use a parent id that is not in the scene together with an index of `1.5`.

Expected result: a bad index on an existing parent throws `INVALID_HIERARCHY`. A missing parent throws `UNKNOWN_NODE`, including when the index is also bad. The previous scene is unchanged.

Covers: M1-FR-006, M1-AC-001.

### TP-M1-F-005 — No selection

Build a scene with two nodes and write it.

Expected result: the scene value has no selection field. The parsed document has no `selection` key. The foundation screen is unchanged. `packages/editor` gains no selection export.

Read a document that is otherwise valid and adds a `selection` key.

Expected result: `INVALID_SHAPE`, no scene, and the previous scene is unchanged. The bytes do not have to round-trip a selection, and a selection field does not have to be stored.

Covers: M1-FR-008, M1-AC-003.

### TP-M1-F-006 — Delete one subtree

Build a root with two children, and give one of those children its own child. Delete the middle node. Delete an unknown id. Delete until the scene is empty.

Expected result: deleting the middle node removes that node and its descendant. The other child keeps its id, kind, extents, transform, and position in the parent's child list. Children of the deleted node are not promoted. An unknown id throws `UNKNOWN_NODE` and leaves the scene unchanged. The last successful delete yields the empty scene from TP-M1-F-001.

A node that still has children is deleted with those children. The operation does not fail because the child list is non-empty.

Covers: M1-FR-007, M1-AC-004.

### TP-M1-F-007 — Strictly positive extents

Insert a rectangle with positive width and height, and a box with positive width, height, and depth.

Expected result: those numbers round-trip, including through `replaceExtents`. A stored extent is strictly greater than zero. An extent of `-0` is canonicalized to `0` and then rejected as `INVALID_EXTENT`. It is not stored. A rectangle result has no `depth` field. A box result has `depth`.

Pass `0` and `-1` as an extent. Pass a rectangle input that includes `depth`, and a box input that omits `depth`.

Expected result: `0` and `-1` throw `INVALID_EXTENT` with message `Scene extent is not accepted.` A mismatched depth field throws `INVALID_SHAPE`. The previous scene is unchanged. Scale is a separate field. A negative scale still passes the unchanged numeric helper and is not rewritten by the extent rule.

This scenario does not assert a center or a corner.

Covers: M1-FR-003, M1-FR-004, M1-AC-008.

### TP-M1-F-008 — Document shape, order, and cap

Write one scene that contains a root, a child, and a sibling of that child.

Expected result: the bytes are UTF-8 with no BOM and no whitespace. Root key order is `formatId`, `schemaVersion`, `roots`, `nodes`. `formatId` is `universal-visual-creation-scene`. `schemaVersion` is the integer `1`. Node objects appear parent-before-children, siblings in list order. Rectangle keys are `id`, `kind`, `children`, `transform`, `width`, `height`. A box adds `depth` last. Transform keys are `position`, `rotation`, `scale`.

Read the same fields with extra whitespace, a different key order, and a different `nodes` array order.

Expected result: the scene equals the written scene. Hierarchy order follows `roots` and `children`, not the `nodes` array.

Read the canonical manifest bytes with `readScene`.

Expected result: `UNSUPPORTED_FORMAT`.

Construct a `Uint8Array` of 1048576 bytes and one of 1048577 bytes. The longer array's last byte is not UTF-8.

Expected result: the longer array throws `TOO_LARGE` and does not decode. The length 1048576 is not failed for length alone. A document that is also the wrong shape still fails with the earlier matching catalog code, not with a second code. `writeScene` throws `TOO_LARGE` and returns no bytes when the canonical UTF-8 length of a valid scene is greater than 1048576.

Covers: M1-FR-008, M1-NFR-003, M1-AC-003, M1-AC-007.

### TP-M1-F-009 — Round-trip of an accepted scene

Write a scene that uses both kinds, a nested child, an index that is not an append, positive extents, and a `-0` transform component. Read it back. Write that scene again.

Expected result: ids, kinds, parentage, order, extents, and transforms match. `-0` is `0`. The two writes are byte-identical. No selection is present.

Covers: M1-NFR-003, M1-AC-003.

### TP-M1-F-010 — Reject the whole document

For each row in M1-AC-007, plant a sentinel string in the input where the shape can hold a string.

Expected result: the named code, the fixed message from the catalog, no scene, and the sentinel absent from `message`, `code`, and `cause`. `cause` is unset. The host `SyntaxError` or `RangeError` is not thrown to the caller. A later field in the same document does not change the first matching code.

An accepted document and a rejected document leave `Object.prototype` unchanged, including a nested `__proto__` value and a `constructor` or `prototype` object.

Covers: M1-NFR-004, M1-AC-007.

### TP-M1-F-011 — Separate manifest

Call `writeManifest`. Pass its result to `readScene`. Pass a scene document to `readManifest`.

Expected result: `writeManifest` still returns `{"formatId":"universal-visual-creation-project","schemaVersion":1}` as UTF-8. `readScene` throws `UNSUPPORTED_FORMAT`. `readManifest` rejects the scene document and still enforces the 4096-byte cap. The scene codec does not call `readManifest` or `writeManifest`.

Covers: M1-FR-008, M1-AC-006, M1-NFR-005.

### TP-M1-F-012 — Caller-supplied ids

Insert an id of 1 UTF-8 byte, an id of 64 UTF-8 bytes, an id whose NFC form differs from a rejected lookalike, and two ids that differ only by ASCII case. Insert an empty id, an id of 65 UTF-8 bytes, a non-NFC id, and an id containing U+0000 and one containing U+007F. Repeat an accepted id. Put a space at the end of an otherwise accepted id.

Expected result: the accepted ids are stored unchanged. `A` and `a` are different. The trailing space is significant. Empty, 65 bytes, non-NFC, and either control throw `INVALID_ID`. A repeated id throws `DUPLICATE_ID`. The previous scene is unchanged. The id string is absent from the message. Core does not mint an id when the caller omits one: that input is `INVALID_SHAPE`.

Covers: M1-FR-009.

### TP-M1-F-013 — A structure that is not a tree

Read a document with a cycle, a missing child id, one id in two parent lists, a repeated child, an orphan node, and a self-child.

Expected result: each throws `INVALID_HIERARCHY` and returns no scene. The failure does not recurse without a visit bound. A document inside the byte cap that makes `JSON.parse` throw `RangeError` throws `INVALID_JSON` instead and does not abort the process.

Covers: M1-FR-002, M1-NFR-007.

### TP-M1-F-014 — Closed kinds

Read a document whose kind is neither `rectangle` nor `box`.

Expected result: `INVALID_SHAPE`, no scene, and the kind string is not in the message. The reader does not load a plugin.

Covers: M1-NFR-002, the unknown-kind case of M1-AC-007.

### TP-M1-F-015 — Replace transform and extents

Replace the transform of one node in a two-node scene. Replace the extents of the other.

Expected result: only the named field changes. The other node is unchanged. Kind, id, parentage, and order stay. An unknown id throws `UNKNOWN_NODE`. Replacing a rectangle's extents with a depth field throws `INVALID_SHAPE`. The returned scene and the replaced triple or extents are frozen.

Covers: M1-FR-005, M1-AC-002, M1-AC-008.

## 4. Non-functional scenarios

### TP-M1-N-001 — Headless suite

The Module 1 tests are `*.test.ts` or `*.test.mjs` files. `pnpm test` discovers them through `scripts/run-tests.mjs`. They do not need a `package.json` entry.

Expected result: `node --test` runs them. The run does not start Vite, does not open a window, and does not execute JSX. One suite covers both kinds. There is no separate 2D runner and no separate 3D runner.

Covers: M1-NFR-006, M1-AC-005.

### TP-M1-N-002 — No new dependency and no viewport

Expected result:

- The lockfile and the workspace manifests gain no runtime dependency for this module.
- `scripts/boundaries.mjs` still passes. `@uvcp/core` imports no workspace package. `@uvcp/persistence` imports no filesystem API. `@uvcp/editor` does not import `@uvcp/rendering`. The shell does not import core, persistence, or rendering.
- `renderNull` still returns a frozen snapshot with an empty draw list, backend `null`, and device `not-requested`. Module 1 tests do not import the null renderer in order to paint nodes. `packages/rendering/src/null-renderer.ts` does not gain a scene import.
- No source file under `packages/editor`, `packages/ui`, `packages/rendering`, `packages/platform`, or `apps/shell` changes for this module.
- No GPU package is added.

Covers: M1-NFR-002, M1-NFR-007, and section 4 of the specification.

### TP-M1-N-003 — Module 0 regression

`pnpm verify` remains the gate. It still runs boundaries, `tsc -b`, Biome, the license check, `pnpm audit --audit-level=high`, `pnpm test`, `pnpm build`, and the loopback preview smoke.

Expected result: the smoke line remains `preview smoke: HTTP 200 http://127.0.0.1:5173/`. Module 0 tests stay in that command and stay green. No duration from a log is a pass/fail threshold.

Covers: M1-NFR-005.

### TP-M1-N-004 — Cap and parse failure

Construct a `Uint8Array` of 1048577 bytes whose extra byte is not valid UTF-8.

Expected result: `TOO_LARGE` before decode and before `JSON.parse`. No scene.

Construct a document inside the cap that is nested deeply enough that `JSON.parse` throws `RangeError` on that host. If the host parses it, the document is still not a scene, because a node is not nested inside a node.

Expected result: `DomainError`. The host `RangeError`, when the host throws one, becomes `INVALID_JSON` and is not the caller-visible error. The process is not aborted. There is no nesting-depth rule on the provisional manifest.

Covers: M1-NFR-007, the size case of M1-AC-007, and SEC-M1-B-007.

No separate benchmark and no reference hardware workload are required. This module does not draw, and the byte cap is the resource bound.

## 5. Security verification

### TP-M1-S-001 — Conditions for implementation

The security review's conditions are implementation tests. No exploit is part of this plan. The specification now names the cap, the codes, and the flat shape those tests assert.

- SEC-M1-B-001. Covered by the document order in section 8 and by TP-M1-F-001, F-008, and N-004. The input is a `Uint8Array`. Empty input fails. The cap is compared before decode. A leading BOM fails. Decode is fatal UTF-8.
- SEC-M1-B-002. `JSON.parse` is the only syntax authority. `SyntaxError` and `RangeError` become `INVALID_JSON`. The duplicate walk runs only after a successful parse. More raw keys than parsed keys is `DUPLICATE_KEY`. Any other disagreement between the walk and the parsed value throws `Error` with the message `Scene duplicate check lost alignment.`, returns no scene, and is not a successful read. A reviver used to read a raw token returns the value unchanged. It does not return `undefined`, it does not write, and it does not record `this` when `this` is `Object.prototype` or another intrinsic prototype.
- SEC-M1-B-003. Duplicate keys on every object, including escape-equivalent spellings. Covered by TP-M1-F-010.
- SEC-M1-B-004. The scene is built from known fields. `Object.prototype` is unchanged. Covered by TP-M1-F-010.
- SEC-M1-B-005. Fixed messages, unset `cause`, no input echo. Covered by TP-M1-F-010 and the catalog.
- SEC-M1-B-006. The manifest codec stays unchanged. The scene reader does not reuse the manifest reviver. Covered by TP-M1-F-011.
- SEC-M1-B-007. The cap is 1048576 and fails closed. Covered by TP-M1-N-004. A nested document is not an accepted scene.
- SEC-M1-B-008. No filesystem, network, shell, zip, path, URL, or `$ref`. No new package. The hierarchy walk is visit-bounded. Covered by TP-M1-F-013 and TP-M1-N-002.
- SEC-M1-B-009. The writer emits bytes from the validated scene. It does not stringify a caller-supplied or previously parsed object. Non-finite numbers are rejected and are not written as `null`.

SEC-M1-N-001 through SEC-M1-N-004 stay notes. Extension, save, and undo stay out of scope. The format id in the specification is a codec discriminator, not the public format identity those notes leave open. No scene code was run for this plan.

## 6. Design verification

### TP-M1-D-001 — Foundation screen unchanged

Expected result when an implementation exists:

- The foundation screen still shows the product name, the foundation purpose sentence, and the status. The purpose sentence is not rewritten to announce a scene.
- The states remain Starting, Ready, and Not ready. There is no scene empty state and no new control.
- The diff does not add a viewport, canvas, hierarchy, inspector, toolbar, selection chrome, or authoring command to `packages/ui` or `apps/shell`.
- Existing UI tests pass.

No screenshot is required for this module. A browser session does not replace TP-M1-N-001.

## 7. Operability

### TP-M1-O-001 — Existing verify workflow

`.github/workflows/verify.yml` stays as it is: `pull_request`, push to `main`, and `workflow_dispatch`; `ubuntu-24.04` and `windows-2025`; `fail-fast: false`; Node from `.node-version` (`24.21.0`); `pnpm install --frozen-lockfile`; `node scripts/verify.mjs`.

Expected result: this module adds no job, no runner, and no new install step. `preparation/devops.md` records that fact.

## 8. What this plan does not test

A test that asserted one of these would be a new product decision.

- An up axis, a handedness, a rotation order, or degrees versus radians.
- A center pivot or a corner pivot.
- Selection as session state or as document data.
- A viewport, hit testing, gizmos, materials, lights, cameras, meshes, text, or images.
- More than one scene, undo, a user-facing save command, a file extension, a folder, or hand-editing.
- A public promise that the format id survives.
- Quarantine of one bad node, migration, and a second scene language.
- A change to the foundation screen.

## 9. Infrastructure

No new test dependency. No Vitest, Jest, jsdom, happy-dom, Playwright, or Cypress. Fixtures are `Uint8Array` values in the test file. Tests do not read a project file from disk and do not open a port other than the existing preview smoke, which this module does not change.

Developers write the tests that demonstrate the behavior they deliver, using this plan, when implementation is authorized. Quality reviews the evidence after that. This preparation does not add a `*.test.ts` file, because there is no scene implementation to exercise.

## 10. Definition of Ready

The five dissent rows now have one expected result. Module 0 is GREEN. The Product Owner approved the specification on 2026-10-06. Implementation of that contract is authorized. Module 1 is not GREEN. Specialist concurrence is not a substitute for the later acceptance gate.

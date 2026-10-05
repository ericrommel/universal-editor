# Module 1 — Test Plan

**Status:** Proposed. Not approved. This plan does not authorize implementation, and it is not acceptance of Module 0.

**Owners:** Functional Quality Engineer and Non-Functional Quality Engineer

**Sources:** pull request #33 at `7ad18b22d5a9db4480d48ad387ea796fb2ac7f9b` (`specification.md`, ADR-0009) and the specialist reviews under `preparation/reviews/`. The reviews were written against the starter position. They are inputs. This plan does not replace the proposal.

**Date:** 2026-10-06

## 1. How to read a row

Each scenario names the proposal identifier it covers and the result the proposal text would require. A row marked **Dissent** also has a second result in one or more specialist reviews. That row is not stable. An automated test of a dissent row waits until the proposal and the dissenting review name the same result.

A row marked **Specified** is one the proposal and the reviews can already share. Developers implement those tests only after Module 0 is GREEN and implementation of an approved specification is authorized. This document does not give that authorization.

Archive section 9.2 is context. Its identifiers are not the identifiers in this plan.

## 2. Traceability

| Id | Scenario | Proposal | State |
| --- | --- | --- | --- |
| TP-M1-F-001 | Empty scene and empty bytes | M1-FR-001, M1-AC-007 | Specified |
| TP-M1-F-002 | One hierarchy, both kinds | M1-FR-002, M1-AC-001, M1-NFR-001 | Specified |
| TP-M1-F-003 | Finite triples | M1-FR-005, M1-AC-002 | Specified |
| TP-M1-F-004 | Where a new node is inserted | M1-FR-006 | Dissent |
| TP-M1-F-005 | Selection | M1-FR-006, M1-FR-008, M1-AC-003 | Dissent |
| TP-M1-F-006 | Delete | M1-FR-007, M1-AC-004 | Dissent |
| TP-M1-F-007 | Extents | M1-FR-003, M1-FR-004, M1-AC-003 | Dissent |
| TP-M1-F-008 | Document shape and writer order | M1-FR-008, M1-NFR-003, M1-AC-003, M1-AC-007 | Dissent |
| TP-M1-F-009 | Round-trip of an accepted scene | M1-NFR-003, M1-AC-003 | Specified once F-007 and F-008 have one result |
| TP-M1-F-010 | Reject the whole document | M1-NFR-004, M1-AC-007 | Specified for the cases the proposal lists |
| TP-M1-F-011 | Separate manifest | M1-FR-008, M1-AC-006 | Specified |
| TP-M1-F-012 | Caller-supplied ids | ADR-0009 | Specified for the ADR text. NFC and controls are not in the proposal |
| TP-M1-F-013 | A structure that is not a tree | M1-FR-002 | Specified as `DomainError`. The code is not named |
| TP-M1-F-014 | Closed kinds | M1-NFR-002, M1-AC-007 | Specified |
| TP-M1-N-001 | Headless suite | M1-NFR-006, M1-AC-005 | Specified |
| TP-M1-N-002 | No new dependency and no viewport | M1-NFR-002, M1-NFR-007 | Specified |
| TP-M1-N-003 | Module 0 regression | M1-NFR-005 | Specified |
| TP-M1-N-004 | Cap and parse failure | M1-NFR-007, M1-AC-007 | Behavior specified. The integer is dissent F-008 |
| TP-M1-S-001 | Security conditions | M1-NFR-004, M1-NFR-007 | Specified as later implementation gates |
| TP-M1-D-001 | Foundation screen unchanged | Section 4 of the proposal | Specified |
| TP-M1-O-001 | Existing verify workflow | M1-NFR-005 | Specified |

## 3. Functional scenarios

### TP-M1-F-001 — Empty scene and empty bytes

Create a scene with no nodes.

Expected result: the call succeeds. The scene has no nodes and no selection. That value is not an error.

Pass zero bytes to the scene reader.

Expected result: `DomainError`. No scene is returned. Zero bytes are not an empty scene.

Covers: M1-FR-001, the empty-document case of M1-AC-007.

### TP-M1-F-002 — One hierarchy, both kinds

Start from an empty scene. Add a rectangle and a box so that the rectangle is a child of the box, and again so that the box is a child of the rectangle.

Expected result: both ids are in the same scene value. There is one scene type. There is no second 2D scene type and no second 3D scene type. Sibling order is the order the scene stores, and a test compares that order.

Covers: M1-FR-002, M1-AC-001, M1-NFR-001.

The parent/child case is specified. The operation used to place a node between existing siblings is TP-M1-F-004.

### TP-M1-F-003 — Finite triples

Store position, rotation, and scale on a rectangle and on a box. Include a component of `-0`. Read the node back.

Expected result: each triple has three components. `-0` is returned as `0`. The same fields exist on both kinds.

Pass `NaN`, an infinity, or a non-number as a component.

Expected result: `DomainError`. The previous scene value is unchanged. The helper is not given a replacement of `0`.

Covers: M1-FR-005, M1-AC-002.

This scenario does not assert an up axis, a rotation order, degrees versus radians, or a world matrix. Those are not acceptance criteria of the proposal.

### TP-M1-F-004 — Where a new node is inserted

**Dissent.** Not stable.

Proposal result, from M1-FR-006 and ADR-0009: `addNode` appends at the end of the named parent's children, or at the end of the root list when no parent is given. A test of that text inserts two roots and expects the second id at the end. It does not pass a sibling index.

Review result: the core review and the 2D review say insert takes a root index, or a parent id plus a child index. Append is the index equal to the current length. Their test would place a new id between two siblings and expect that index.

An automated test waits until one of those results is the only one written.

### TP-M1-F-005 — Selection

**Dissent.** Not stable.

Proposal result, from M1-FR-006, M1-FR-007, M1-FR-008, M1-AC-003, and ADR-0009:

- The scene value holds the selection, either absent or one node id.
- An unknown id throws `DomainError` and does not change the scene.
- Clearing the selection is a core operation.
- The scene document reconstructs the selection.
- Deleting the selection removes that node and clears the selection.
- Deleting when nothing is selected throws `DomainError` and does not change the scene.

Review result:

- The Tech Lead review keeps selection in `@uvcp/editor` as a separate plain value. A selection field in the document is an unknown key and rejects the whole document. The shell does not receive the value. It is not added to `starting` / `ready` / `failed`.
- The core review leaves selection out of the scene value.
- The 2D review stores at most one session id. The id is absent from the bytes. An unknown id is not stored, and the previous selection remains. Create does not change selection. Deleting the selected id clears it and does not select a sibling or the parent. Deleting any other id leaves the selection.
- The design review adds no selection type on the foundation screen.

Shared by both results: the foundation screen does not show selection, and removing the selected id ends with no selection rather than a neighboring id.

The proposal does not say whether adding a node changes an existing selection. The 2D review says it does not. That sentence is part of the dissent.

An automated test waits until one result is the only one written. In particular, a test must not both require the bytes to contain the selection and require a selection field to reject the document.

### TP-M1-F-006 — Delete

**Dissent.** Not stable.

Proposal result, from M1-FR-007 and M1-AC-004: deleting the selection removes that node and its descendants and clears the selection. Nodes outside the subtree keep their ids, kinds, dimensions, transforms, and child order.

Review result: the core review and the 2D review also remove the subtree and do not promote children. The Tech Lead review removes a node only when its child-id list is empty. If the node has children, that review's delete fails and the scene is unchanged. The Tech Lead review lists subtree delete as deferred.

An automated test waits until one result is the only one written. The two Tech Lead documents, the preparation review and pull request #33, are the pair that disagree.

### TP-M1-F-007 — Extents

**Dissent.** Not stable.

Proposal result: M1-FR-003 and M1-FR-004 require finite width and height on a rectangle, and finite width, height, and depth on a box. ADR-0009 says zero and negative dimensions round-trip. The module does not decide that a size must be positive. A non-finite dimension is the same class of failure as M1-FR-005: `DomainError`, and the previous scene is unchanged.

Review results, each different:

- The core review rejects a finite extent that is not strictly greater than zero. The code it names is `INVALID_EXTENT`. A rectangle that carries depth, or a box that omits one extent, is `INVALID_SHAPE`.
- The 3D review also wants each box extent strictly greater than zero, and places the box center on the node origin.
- The 2D review keeps zero and negative width and height. It does not rewrite them. The span runs from `0` to the extent, so the node origin is one corner. A rectangle has no depth field.
- The Tech Lead review says width, height, and depth are not fields.

A round-trip of `0` or of `-1` has more than one expected result. An automated test waits until one result is the only one written.

The pivot is not a row. This module does not compute a mesh or a matrix, so a test must not choose center versus corner.

### TP-M1-F-008 — Document shape and writer order

**Dissent.** Not stable.

Proposal result, from ADR-0009, M1-NFR-003, and M1-AC-007:

- The format id is `universal-visual-creation-scene` and the schema version is the integer `1`.
- The reader rejects the wrong format id, a non-integer version, unknown keys, and duplicate keys on every object, including escape-equivalent spellings.
- The byte length rejected as too large is a length over 262144.
- Writing the same scene twice yields the same bytes.
- There is no nesting-depth limit.

Review results:

- The core review uses one JSON object with `roots` and `nodes` only. It has no format id and no schema version. The writer emits a parent before its children, roots first, siblings in list order. The cap it names is 1_048_576 bytes. The writer throws and returns no buffer if the canonical bytes would exceed that cap.
- The Tech Lead review also uses flat records, because a nested JSON tree puts depth on the `JSON.parse` stack. It emits node records in UTF-16 code-unit order of id, and keeps hierarchy only in the id lists. It says the operational specification sets the byte cap, the node cap, and any structural depth cap. It does not choose a public format id.
- The security review does not choose the integer. SEC-M1-B-007 blocks a later implementation until the chosen cap is fixed and a document nested to that cap either parses or fails as a domain error without aborting the process.

M1-AC-007 says "over 262144 bytes" and does not say whether a document of exactly 262144 bytes is accepted. The proposal also does not say whether the JSON stores children as nested objects or as id lists. Those two gaps are part of this dissent. Two writer orders can each make two writes of one scene identical, so sameness of two writes does not decide the order.

An automated test waits until one shape, one order, one cap, and one boundary (the equal length) are written.

### TP-M1-F-009 — Round-trip of an accepted scene

Once TP-M1-F-007 and TP-M1-F-008 each have one result, write that scene and read the bytes.

Expected result under the proposal's M1-NFR-003 and M1-AC-003: a second write returns the same bytes. The read scene compares equal on ids, kinds, parentage, sibling order, dimensions, transforms, and selection. Canonical finite numbers are the only intended numeric change. `-0` is already `0` before it is written. A non-finite value is not written as `null`.

The selection clause stays inside the dissent of TP-M1-F-005. If the agreed result is that selection is absent from the bytes, equality includes that absence instead.

Covers: M1-NFR-003, M1-AC-003, after the dissents above close.

### TP-M1-F-010 — Reject the whole document

For each input below, the reader throws `DomainError`, returns no scene, and leaves any previous scene value unchanged. The message, the cause, and any diagnostic do not contain a sentinel planted in the input. The host `SyntaxError` is not the message and not the cause.

- zero bytes (also TP-M1-F-001);
- a leading UTF-8 BOM;
- ill-formed UTF-8;
- a length over the cap, before decode (the integer is TP-M1-F-008);
- malformed JSON;
- a duplicate key at the root;
- a duplicate key on a nested object;
- a duplicate key whose two spellings differ only by JSON escaping;
- an unknown key;
- a duplicate id;
- an unknown kind.

Covers: M1-NFR-004, M1-AC-007.

The proposal names `DomainError` and does not name the `code` values. TP-M1-S-001 records that gap. A test written to the proposal text can assert the type, the unchanged previous value, and the absence of the sentinel. It cannot yet assert a stable code.

### TP-M1-F-011 — Separate manifest

After a scene codec exists:

- `writeManifest()` still returns the UTF-8 bytes `{"formatId":"universal-visual-creation-project","schemaVersion":1}` with no BOM and no extra whitespace.
- `readManifest` rejects a scene document.
- The scene reader rejects the bytes `writeManifest` returns.
- Existing manifest tests pass without a change to their expected codes, messages, or the 4096-byte cap.

Covers: M1-FR-008, M1-AC-006.

The scene reader's code for a manifest document depends on TP-M1-F-008. The rejection itself is specified.

### TP-M1-F-012 — Caller-supplied ids

ADR-0009 requires ids to be caller-supplied, non-empty, unique, and at most 64 UTF-8 bytes. The error message does not include the id. Core does not read a clock or a random source to mint an id.

Expected result for that text: an empty id, an id of 65 UTF-8 bytes, and a repeated id each throw `DomainError`, and the previous scene is unchanged. A test looks for the id string in the message and fails if it is present.

The core review and the Tech Lead review also require NFC, reject ASCII controls, and forbid case-folding and trimming. Those rules are not in the proposal. They are not pass/fail rows of this plan until the proposal states them.

### TP-M1-F-013 — A structure that is not a tree

M1-FR-002 requires one ordered tree. Build a document or a core value with a cycle, a missing child id, a node in two parent lists, or a node that is its own child.

Expected result: `DomainError`, and no scene is returned or the previous scene is unchanged. The proposal does not name the code. The security review says a later id graph needs a visit bound and a new review. This scenario checks the result, not a particular walk.

### TP-M1-F-014 — Closed kinds

Read a document whose kind is neither `rectangle` nor `box`.

Expected result: `DomainError`, no scene, and the kind string is not in the message. The reader does not load a plugin.

Covers: M1-NFR-002, the unknown-kind case of M1-AC-007.

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
- No GPU package is added.

Covers: M1-NFR-002, M1-NFR-007.

### TP-M1-N-003 — Module 0 regression

`pnpm verify` remains the gate. It still runs boundaries, `tsc -b`, Biome, the license check, `pnpm audit --audit-level=high`, `pnpm test`, `pnpm build`, and the loopback preview smoke.

Expected result: the smoke line remains `preview smoke: HTTP 200 http://127.0.0.1:5173/`. Module 0 tests stay in that command and stay green. No duration from a log is a pass/fail threshold.

Covers: M1-NFR-005.

### TP-M1-N-004 — Cap and parse failure

Once TP-M1-F-008 names one cap, construct a `Uint8Array` one byte over that cap whose extra byte is not valid UTF-8.

Expected result: `DomainError` before decode and before `JSON.parse`. No scene.

Construct a document inside the cap that is nested deeply enough that `JSON.parse` with an identity reviver throws `RangeError` on that host. If the host parses it, the document is still not a scene.

Expected result: `DomainError`. The host `RangeError` is not thrown to the caller and does not abort the process. There is no nesting-depth rule on the provisional manifest. This check does not add one.

Covers: M1-NFR-007, the size case of M1-AC-007, and the behavior required by SEC-M1-B-007. The integer remains the dissent in TP-M1-F-008.

## 5. Security verification

### TP-M1-S-001 — Conditions for a later implementation

The security review's conditions block a codec implementation. They do not block this plan. When implementation is authorized, the developer tests cover them. No exploit is part of this plan.

- SEC-M1-B-001. The input is a `Uint8Array`. A non-byte value fails with a fixed message. Empty input fails. The cap is compared before UTF-8 decode and before parse. A leading BOM fails. Decode is fatal UTF-8. The reader does not accept a second value after the document.
- SEC-M1-B-002. `JSON.parse` is the only syntax authority. There is no `eval`, `Function`, `vm`, schema package, or second grammar. `SyntaxError` and `RangeError` become a domain error. A reviver returns the value unchanged and does not record `this` when `this` is `Object.prototype`.
- SEC-M1-B-003. Duplicate keys are rejected on every object the reader can accept, including equal values and escape-equivalent spellings. This overlaps TP-M1-F-010.
- SEC-M1-B-004. The scene is built from known fields. The reader does not return, assign, spread, or merge the parsed object. Property checks use `Object.hasOwn`. The reader rejects `__proto__`, `constructor`, and `prototype`. A test asserts `Object.prototype` is unchanged after a rejected document and after an accepted document, including a nested `__proto__` value.
- SEC-M1-B-005. Messages, `cause`, and diagnostics do not include the document, a key, a string value, or a byte excerpt. Overlaps TP-M1-F-010.
- SEC-M1-B-006. `readManifest` and `writeManifest` stay unchanged. The scene codec does not reuse that function and does not copy its reviver onto scene objects. Overlaps TP-M1-F-011.
- SEC-M1-B-007. The cap fails closed, as in TP-M1-N-004. The integer is still TP-M1-F-008.
- SEC-M1-B-008. The codec imports no filesystem, network, shell, or zip API. It does not resolve a path, a URL, `$ref`, or an archive entry. No new package and no second scene language. The review also says a later id graph needs a visit bound and a new review. TP-M1-F-013 is the tree result. It is not that later review.
- SEC-M1-B-009. The writer emits bytes from validated domain fields. It does not stringify a caller-supplied object or a previously parsed object. Scene numbers go through `canonicalizeFiniteNumber` or `canonicalizeFiniteTriple`. A non-finite value is rejected and is not written as `null`.

The proposal does not name stable `code` strings. The core review proposes `INVALID_ID`, `DUPLICATE_ID`, `INVALID_HIERARCHY`, `INVALID_EXTENT`, and `UNKNOWN_NODE`, and it reuses `EMPTY`, `TOO_LARGE`, `INVALID_ENCODING`, `INVALID_JSON`, `DUPLICATE_KEY`, `INVALID_SHAPE`, and `NON_FINITE_NUMBER` only where the meaning matches. Those names are not pass/fail rows until the proposal states them. Two codecs can both throw `DomainError` for M1-AC-007 and still disagree on every code. That is a testability gap in the proposal.

SEC-M1-N-001 through SEC-M1-N-004 stay notes. Format id, extension, save, and undo stay unresolved there. This plan does not pick them. No scene code was run for this plan, and this plan is not evidence for M0-AC-011.

## 6. Design verification

### TP-M1-D-001 — Foundation screen unchanged

The design review and section 4 of the proposal agree that Module 1 adds no screen.

Expected result when an implementation exists:

- The foundation screen still shows the product name, the foundation purpose sentence, and the status. The purpose sentence is not rewritten to announce a scene.
- The states remain Starting, Ready, and Not ready. There is no scene empty state and no new control.
- The diff does not add a viewport, canvas, hierarchy, inspector, toolbar, or authoring command to `packages/ui` or `apps/shell`.
- Existing UI tests pass.

No screenshot is required for this module. A browser session does not replace TP-M1-N-001.

## 7. Operability

### TP-M1-O-001 — Existing verify workflow

`.github/workflows/verify.yml` stays as it is: `pull_request`, push to `main`, and `workflow_dispatch`; `ubuntu-24.04` and `windows-2025`; `fail-fast: false`; Node from `.node-version` (`24.21.0`); `pnpm install --frozen-lockfile`; `node scripts/verify.mjs`.

Expected result: this module adds no job, no runner, and no new install step. `preparation/devops.md` records that fact. It is not a separate DevOps approval.

## 8. What this plan does not test

These are out of the proposal. A test that asserted one of them would be a new product decision.

- An up axis, a handedness, a rotation order, or degrees versus radians.
- A center pivot or a corner pivot.
- A viewport, hit testing, gizmos, materials, lights, cameras, meshes, text, or images.
- More than one scene, undo, a user-facing save command, a file extension, a folder, or hand-editing.
- A public promise that the format id survives.
- Quarantine of one bad node, migration, and a second scene language.
- A change to the foundation screen.

## 9. Infrastructure

No new test dependency. No Vitest, Jest, jsdom, happy-dom, Playwright, or Cypress. Fixtures are `Uint8Array` values in the test file. Tests do not read a project file from disk and do not open a port other than the existing preview smoke, which this module does not change.

Developers write the tests that demonstrate the behavior they deliver, using this plan, when implementation is authorized. Quality reviews the evidence after that. This preparation does not add a `*.test.ts` file, because there is no scene implementation to exercise.

## 10. Definition of Ready

Development process section 8 is not met. Module 0 is not approved. TP-M1-F-004, F-005, F-006, F-007, and F-008 do not have one expected result. Error codes are not stable. The Product Owner has not authorized implementation. This plan does not mark Module 1 ready, and it does not ask for that authorization.

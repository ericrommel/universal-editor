# Module 1 preparation — quality review of the proposed contract

**Role:** Functional Quality Engineer. The non-functional checks are in the same test plan. No separate non-functional review was written, because the gate is the Module 0 verify workflow and it does not change.

**Status:** Proposed review of pull request #33 at `7ad18b22d5a9db4480d48ad387ea796fb2ac7f9b`. This is not Product Owner approval, not implementation authorization, and not acceptance of Module 0.

**Date:** 2026-10-06

## 1. What was compared

- `docs/modules/module-01-unified-scene/specification.md` and `docs/engineering/adr/0009-scene-model-and-scene-document.md` on pull request #33.
- The six specialist reviews copied into `preparation/reviews/`. Those reviews accept the starter position. They were not revised after pull request #33.
- Pull request #34, which records the shipped Module 0 contracts. It does not select a scene shape. This review does not restate that note.
- `.github/workflows/verify.yml` and `scripts/run-tests.mjs`.

The test plan is `docs/modules/module-01-unified-scene/test-plan.md`.

## 2. What already agrees

The proposal and the reviews can share these results. The test plan marks them Specified.

- One headless scene value in `@uvcp/core`, and one codec in `@uvcp/persistence`. No new package.
- An empty scene is valid. Zero input bytes are a document error.
- A rectangle and a box can share one ordered tree, and either kind may parent the other. One scene type.
- Position, rotation, and scale are three finite triples. `-0` becomes `0`. A non-finite component fails and leaves the previous scene unchanged. The numbers do not assert an axis.
- The caller supplies ids. Core does not mint them. ADR-0009 bounds an id at 1 through 64 UTF-8 bytes. The message does not include the id.
- A cycle, a missing child, two parents, or a self-child is not a tree, so it fails and yields no scene.
- The reader rejects the whole document. The host `SyntaxError` is not the message or the cause. A planted sentinel does not appear in the error.
- `JSON.parse` is the syntax authority. A host `RangeError` is a domain error. The provisional manifest gains no nesting rule.
- `writeManifest` stays the two-field Module 0 bytes. `readManifest` rejects a scene document. The scene reader rejects a manifest. The 4096-byte manifest cap stays.
- No viewport, no GPU dependency, no draw-list change, and no foundation-screen change.
- Tests are headless `node --test` files discovered by the existing command. `pnpm verify` stays the regression gate.

## 3. Rows with two expected results

These are Q-M1-B-001 through Q-M1-B-005. Each one maps to a dissent row in the test plan. This review does not choose the winner. The proposal text and the dissenting review have to name the same result before a test can be written. That reconciliation is engineering preparation. It is not a request for the Product Owner to approve scope.

### Q-M1-B-001 — Selection

Test plan: TP-M1-F-005.

The proposal stores selection on the scene and in the document. The Tech Lead review, the core review, the 2D review, and the design review keep it off the document and off the foundation screen. The Tech Lead review places it in `@uvcp/editor`, outside the startup union.

A single acceptance test cannot require the bytes to round-trip the selection and also require a selection field to reject the document.

### Q-M1-B-002 — Extents

Test plan: TP-M1-F-007.

The proposal requires finite dimensions and ADR-0009 round-trips zero and negative values. The core review and the 3D review reject a finite extent that is not strictly positive. The 2D review keeps zero and negative width and height and uses a corner origin. The Tech Lead review has no extent fields.

M1-AC-003 says dimensions survive a round-trip. It does not say which numbers are legal, so the criterion is not yet observable.

The center-versus-corner pivot is recorded and is not a test. This slice does not compute a matrix.

### Q-M1-B-003 — Document shape, order, and cap

Test plan: TP-M1-F-008 and the integer in TP-M1-N-004.

ADR-0009 names the format id `universal-visual-creation-scene`, schema version `1`, and a failure for a document over 262144 bytes. It does not say whether children are nested objects or id strings, and it does not say whether a document of exactly 262144 bytes is accepted. M1-NFR-003 requires two writes to match and does not name the order.

The core review uses flat `roots` and `nodes`, no format fields, parent-before-children order, and a cap of 1_048_576 bytes. The Tech Lead review uses flat records in UTF-16 code-unit order of id and leaves the integers to the specification. The security review does not choose the integer. SEC-M1-B-007 still requires that a document nested to the chosen cap fail closed without aborting the process.

### Q-M1-B-004 — Insert and delete

Test plan: TP-M1-F-004 and TP-M1-F-006.

The proposal appends a node and deletes the selected subtree. The core review and the 2D review insert at an explicit index and also delete the subtree. The Tech Lead review appends, and it refuses to delete a node that still has children.

Pull request #33 and the Tech Lead preparation review disagree with each other on delete. Both documents are Tech Lead inputs. Quality does not treat the later pull request as having retired the review until one of them is updated.

### Q-M1-B-005 — Stable error codes

Test plan: TP-M1-F-010 and TP-M1-S-001.

M1-AC-007 lists eleven failing documents and says each throws `DomainError`. It does not name a `code`. The core review names a code for each failure. Two implementations can satisfy the written acceptance criterion and still disagree on every code a later regression would lock.

The candidate codes in the core review are not adopted here. They become pass/fail text only if the proposal states them.

Rules that are in the reviews and absent from the proposal are also not pass/fail text yet. That includes NFC ids, rejection of ASCII controls, and the ban on case-folding and trimming.

## 4. Security and design

SEC-M1-B-001 through SEC-M1-B-009 are implementation gates in TP-M1-S-001. They do not block publishing this review. B-007 stays open while Q-M1-B-003 is open. The proposal already covers duplicates on every object, a closed construction from known fields, and errors that do not reuse the host exception. It does not require the `Object.prototype` assertion. The test plan adds that assertion because SEC-M1-B-004 does, and because M1-NFR-004 already forbids returning the parsed object.

The design review's check is TP-M1-D-001. No new screen, no rewritten purpose sentence, and no screenshot requirement.

Coordinates stay out of the criteria. The Tech Lead review and the 3D review propose one right-handed, Y-up, intrinsic XYZ Euler convention in radians. The proposal, the core review, the 2D review, and the design review leave that choice deferred. A test of shared storage must not assert the axis.

## 5. Definition of Ready

Development process section 8 is not met.

- Module 0 is not approved. Issue #1 stays open.
- Q-M1-B-001 through Q-M1-B-005 are unresolved, so the identifiers in pull request #33 are not stable and five acceptance checks are not yet single-valued.
- Design behavior for this slice is the absence of new UI. That part is defined. The rest of the gate is not.
- The Product Owner has not authorized implementation.

This review does not mark Module 1 ready. It does not move issue #7. It does not ask the Product Owner to pick a row.

## 6. Next engineering step

Amend pull request #33, or amend the dissenting review, until each dissent row has one expected result. Then update this test plan's state column for that row. Implementation stays closed until that package exists and Module 0 is accepted.

# Module 3 preparation — technical boundary

**Role:** Tech Lead

**Status:** Preparation review for issue #9. This note does not approve a schema, authorize implementation, or request a Product Owner decision.

The dependency map is the breakdown. Specialist notes are the role records. This note says where they agree and where a later reader could merge two different blocks into one task.

## 1. What is settled for this pass

The notes agree on the shipped boundary. A later change that crosses one of these needs its own decision:

- `@uvcp/core` stays the numeric helpers and `DomainError`. No scene type, no image bytes, no id generator.
- `writeManifest` stays the two-field writer. The 4096-byte cap is not a project limit and not an image budget.
- `checkEntryNames` extracts nothing and is not a display-name policy. The ASCII case-fold gap reopens before a real archive reader.
- `EditorSession` stays `starting`, `ready`, and `failed`. The foundation screen does not gain creation tools.
- `renderNull` keeps the frozen empty draw list. `editor` does not import `rendering` until a new ADR amends the import table.
- `pnpm verify` stays the gate, including the canvas ban in the preview smoke. No decoder, font, canvas library, or CI job is added.
- Archive section 9.4 stays context. No Module 3 test file is added. Where a behavior is undecided, the result text is "blocked; no expected result."

No note selects a shape set, a raster format, a container, a stacking model, a text-editing model, a color encoding, an id source, an undo strategy, or a graphics API.

## 2. How the blocked packages stay split

**Data versus pixels.** The core note blocks ordering on an approved scene, on a later product decision, and on Module 2 before a visual result exists. The rendering note says sibling order, if a later hierarchy stores it, is document data, and that `renderNull` would not change. Those are one split, not two designs. Issue #45 may add an order field only after Module 1 has a single-valued hierarchy, and it may not treat the contested Module 1 child list as that hierarchy. Issue #48 is the pixel proof. It stays blocked on the draw ADR as well as on issues #7 and #8. This preparation does not assign that ADR to Module 3.

**Undo versus the operation.** Duplicate and appearance can be data on issue #45 once a scene contract exists. Undo of those operations cannot. ADR-0006 selected no strategy. If Module 2 approves only transform undo, issue #47 still does not cover creation, deletion, duplication, and appearance. The functional note refuses to put both "undo exists" and "undo does not cover these four" on one expected result. That refusal stands.

**Ingest error versus the creation surface.** The security note requires failed ingest, once a scene exists, to leave that scene unmutated and to keep bytes out of logs. Showing the failure is a later UI concern. Issue #49 is the creation surface. It is not automatically the ingest-error surface. Neither surface is the foundation screen. The foundation screen's startup diagnostic stays a startup diagnostic.

**Definition of Ready.** Every note finds it unmet. The functional note's reason for the test-approach bullet is the one recorded in the dependency map: a written deferral is not an approach for a requirement that does not exist yet.

## 3. What this branch does not contain

- No amendment of ADR-0001 through ADR-0008.
- No copy of the unapproved ADR-0009.
- No scene module, fixture raster, or sample font.
- No change to `scripts/verify.mjs`, the workflow, or package manifests.

Issue #44 tracks this record. Issues #45 through #49 stay blocked. Closing issue #7 or issue #8 does not by itself open #45 through #49 when the map also requires a single-valued contract, a container decision, or a draw ADR.

## 4. Non-goals

This note does not move issue #9 to Ready for PO. Definition of Ready is not met. Module 0 being GREEN does not open Module 3 implementation.

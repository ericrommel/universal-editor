# Module 1 preparation — quality input

**Update 2026-10-06.** Module 0 is GREEN. Issue #1 is closed. The five rows in section 3 are closed in [reconciliation.md](reconciliation.md). The normative contract is the specification. This file is the earlier input.

**Role:** Functional Quality Engineer

**Status:** Preparation input for issue #7. This is not an operational specification and not implementation authorization. The paragraphs below predate Module 0 acceptance.

## 1. Current gate

Module 0 pull request 31 is merged as `5e994841cdfc16b426d26e735f92d9b5c9b61beb`. The Product Owner approved that pull request. Issue #1 stays open for module acceptance. Module 0 is not GREEN.

Development process sections 2 and 20 allow Module 1 implementation only after Module 0 is GREEN and the Product Owner explicitly approves the module. Research, test design, and architecture work may start earlier. This note is that earlier test-design input. It adds no scene behavior.

Issue #7 states the objective and says the issue does not authorize implementation or freeze scope:

> Prove the central product abstraction: 2D and 3D visual objects coexist in one scene, hierarchy, persistence model, and transform system.

Archive section 9.2 is context for that objective. Its identifiers are not operational requirements.

## 2. Constraints a later test plan must keep

These come from the approved Module 0 architecture and the development process. A Module 1 test plan has to satisfy them.

- `pnpm verify` stays the regression gate. Module 0 tests remain green.
- `node --test` does not execute JSX. Domain behavior is proven without opening a window. A browser session does not replace that headless proof.
- Scene correctness is a test of the model or the render snapshot. A GPU image is not that proof.
- The provisional manifest is two fields, with a 4096-byte cap. `SyntaxError` and `RangeError` from `JSON.parse` are `INVALID_JSON`. There is no nesting-depth rule. Saving a scene is a new document decision.
- `canonicalizeFiniteNumber` and `canonicalizeFiniteTriple` are the approved numeric rules. They do not choose an axis, a rotation order, or degrees versus radians.
- The foundation shell has no viewport, canvas, hierarchy, selection, or save command. Those stay out of the foundation screen until an approved Module 1 scope adds them.
- A new dependency has to pass the existing license rule and `pnpm audit --audit-level=high`. A second scene language requires a new ADR.

## 3. Rows the test plan cannot close

Pull request #33 proposes M1-FR-001 through M1-FR-008, M1-NFR-001 through M1-NFR-007, and M1-AC-001 through M1-AC-007. `../test-plan.md` traces those identifiers. The reviews under `reviews/` were written against the starter position and disagree with that proposal on the rows below. A test that picked one expected result would decide the row.

- Where selection lives, and whether the scene document contains it.
- Which extent values are legal, and whether extents are fields.
- The scene JSON shape, the writer order, the format fields, and the byte cap.
- Whether insert can choose an index, and whether delete of a parent removes descendants.
- Stable `DomainError` codes. The proposal names the type and does not name the codes.

`proposal-review.md` records both results for each row. Those rows are the discussion between the proposal and the reviews. They are not a request for the Product Owner to approve a scope.

Coordinates, pivot, a viewport, undo, a second scene, a file extension, and hand-editing stay out of the pass/fail rows. The proposal already says the stored numbers are not an axis decision. Archive section 9.2 stays context.

## 4. Artifacts in this package

| Artifact | What it is |
| --- | --- |
| `../test-plan.md` | Test plan. The dissent rows named in this note are now single-valued. |
| `proposal-review.md` | Quality review of pull request #33. |
| `devops.md` | The verify workflow does not change. Not a DevOps sign-off. |
| `reviews/` | Tech Lead, core, 2D, 3D, design, and security reviews. |

Definition of Ready is development process section 8. It is not met. Module 0 is not approved. The rows in section 3 do not have one expected result. The Product Owner has not authorized implementation. This package does not mark Module 1 ready.

No scene type, viewport, persistence format, package, or test file is added here.

## 5. What this preparation does next

The paragraph below is the step this note named on 2026-10-05. That step is done in `reconciliation.md`. Module 0 is GREEN. Implementation stays closed until the Product Owner approves the reconciled specification.

The test plan and the proposal review were the discussion. They were not a request for the Product Owner to approve scope. The next engineering step was to give each dissenting row one expected result. That result is now the specification.

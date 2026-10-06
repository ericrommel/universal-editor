# Module 4 — Draw in space evidence

**Role:** Functional Quality Engineer
**Status:** Preparation input for issue #10. Not a test plan. Not implementation authorization.
**Date:** 2026-10-06

Archive M4-FR, M4-NFR, and M4-AC identifiers are not operational requirements. This note assigns no expected result to them.

A written deferral is not a test approach. Definition of Ready is not met.

An unknown kind on the approved Module 1 contract fails `INVALID_SHAPE`, so a curve kind is not a passing case. Pull request #50 is approved, not merged, and Module 1 is not GREEN.

There is no viewport, no curve type, and no Module 4 test file. `pnpm verify` remains the regression command for earlier modules. Playwright stays deferred. No GPU image is an oracle. No fidelity number is chosen. Module 4 implementation waits until Module 3 is GREEN. Module 3 is not GREEN.

| Behavior | Class | Expected result |
| --- | --- | --- |
| Sampling a stroke | blocked | No expected result |
| Storing editable control data | blocked | No expected result |
| Rendering a stroke | blocked | No expected result |
| Editing control data | blocked | No expected result |
| Undo of a completed stroke | blocked | No expected result |
| Save and reload of a stroke | blocked | No expected result |
| Coexistence with rectangle and box | blocked | No expected result |
| Regression of Module 0 | blocked | No expected result |

**Sampling a stroke.** Blocked: there is no viewport and no curve type, and Module 3 is not GREEN. A deferred Playwright run is not a sampling check.

**Storing editable control data.** Blocked: the approved Module 1 contract has no curve kind. An unknown kind fails `INVALID_SHAPE`, so storing a curve is not a passing case.

**Rendering a stroke.** Blocked: there is no viewport and no curve type. A GPU image is not an oracle, and no fidelity number was chosen.

**Editing control data.** Blocked: there is no stored control data to edit and no curve type. An edit cannot be checked without that data.

**Undo of a completed stroke.** Blocked: Module 1 leaves undo out of scope, and no completed stroke exists. Naming a deferred undo strategy is not an expected result.

**Save and reload of a stroke.** Blocked: Module 1 has no user-facing save, and a curve kind is not a document that reloads. A deferred file writer is not a reload check.

**Coexistence with rectangle and box.** Blocked: rectangle and box are current kinds, and a curve kind fails `INVALID_SHAPE`. Coexistence is not a passing case.

**Regression of Module 0.** Blocked only as a Module 4 addition. Module 0 regression on main is already `pnpm verify`. This preparation adds no Module 4 test file and does not treat Module 0 as unproven.

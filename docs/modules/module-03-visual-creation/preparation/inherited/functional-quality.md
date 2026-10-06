# Module 3 inherited verification map

**Role:** Functional Quality Engineer

**Status:** Preparation input for issue #9. Not a test plan. Not implementation authorization.

**Date:** 2026-10-06

Archive section 9.4 identifiers (M3-FR, M3-NFR, M3-AC) are context. This note does not turn them into operational requirements.

A written deferral is not a test approach. The Definition of Ready test-approach bullet stays unmet. No test file is added.

The Product Owner approved pull request #50 as the Module 1 implementation contract (https://github.com/ericrommel/universal-editor/issues/7#issuecomment-6013883562), head `13f1725`. It is not merged. Module 1 is not GREEN. Its tests are not on main. Rows below are blocked because that contract and the Module 2 seam do not make a Module 3 result single-valued. They are not blocked because Module 1 proposals disagreed.

Module 2 evidence classes are headless command, headed visual record, and blocked. Playwright stays deferred. No GPU image is an oracle. `pnpm verify` remains the regression command.

## Contract checks a later Module 3 test must not weaken

From the approved contract, sections 4, 10, and 11:

- An unknown kind fails `INVALID_SHAPE`.
- An unknown key, including `selection`, fails `INVALID_SHAPE`.
- Extents `0` and `-1` fail `INVALID_EXTENT`.
- The manifest writer stays the two-field bytes.
- The draw list is not part of Module 1. Section 4 has no viewport and no canvas, and it leaves the rendering package unchanged. Section 11 requires no browser session and no screenshot.

Section 4 also leaves text, images, materials, undo, a separate reorder, and any change to the foundation screen outside Module 1. Order changes only by the insert index of a new node. Section 11 keeps Module 1 on `node:test` under `pnpm verify`.

The Module 2 seam does not add the missing behavior. It has no viewport. It classes move, rotate, and scale as headless transform commands. It recommends one undo step for one committed transform and adds no undo API. That step is not create, delete, duplicate, or appearance. Save-and-reopen stays blocked on a file writer. A visible distinction, once a surface exists, is a headed record: one named session, not Playwright, and not a GPU image. Those statements are the seam. They are not a Module 3 test approach.

## Verification map

Every Module 3 behavior is blocked and has no expected result. No pass or fail oracle is stated.

| Behavior | Class | Expected result |
| --- | --- | --- |
| New kind | blocked | No expected result |
| Display name | blocked | No expected result |
| Duplicate | blocked | No expected result |
| Appearance numbers | blocked | No expected result |
| Text payload | blocked | No expected result |
| Image bytes | blocked | No expected result |
| Data order versus visible order | blocked | No expected result |
| Undo of create, delete, duplicate, and appearance | blocked | No expected result |
| Creation surface | blocked | No expected result |
| Regression of Module 0 and of the approved Module 1 contract once it is implemented | blocked | No expected result |

**New kind.** The approved checks insert a rectangle and a box. An unknown kind fails `INVALID_SHAPE`. Section 4 leaves further kinds out of Module 1. The Module 2 seam has no creation command. Naming another kind would weaken `INVALID_SHAPE` or invent the set.

**Display name.** Sections 4, 10, and 11 accept no name field. An unknown key, including `selection`, fails `INVALID_SHAPE`. The Module 2 seam has no rename command. A stored name, or a rejection of one, is not written.

**Duplicate.** A repeated id fails `DUPLICATE_ID`. That check is not a duplicate command. Section 4 places a new node by insert index and has no second operation for a copy. The Module 2 seam has no duplicate command. An id, copied fields, or an index for a copy is not stated. Treating the copy as an append would weaken insert-at-index.

**Appearance numbers.** Materials are outside Module 1, and an appearance field would be an unknown key. Extents `0` and `-1` fail `INVALID_EXTENT`. That code is not an appearance rule, and it must not be weakened. The Module 2 seam uses existing foundation color roles for selection feedback only. It adds no material and no new color role. No number is stated.

**Text payload.** Text is outside Module 1. A text kind fails the unknown-kind check. A text field would be an unknown key. The Module 2 seam has no text command. No payload is stated.

**Image bytes.** Images are outside Module 1. The manifest writer stays the two-field bytes, so those bytes are not an image store. Section 4 has no user-facing file writer. The Module 2 seam keeps save-and-reopen blocked on that writer. No GPU image is an oracle. No byte layout is stated.

**Data order versus visible order.** Approved data order is the sibling insert index. A separate reorder is outside Module 1. Visible order needs a viewport and a draw list. The draw list is not part of Module 1, and the Module 2 seam has no viewport. Playwright stays deferred. No GPU image is an oracle. Data order, visible order, or both, as a pass, would invent the result. Neither is written.

**Undo of create, delete, duplicate, and appearance.** Undo is outside Module 1. Delete there removes one subtree by id and records no history step. The Module 2 seam's undo recommendation covers one committed transform, adds no undo API, and does not cover these four operations. No restored value is stated.

**Creation surface.** Section 4 forbids changing the foundation screen and includes no viewport. The Module 2 seam has no viewport. Its headed class is a recorded session, and Playwright stays deferred. That is not a test approach for a surface that does not exist. Nothing the surface would show is stated.

**Regression of Module 0 and of the approved Module 1 contract once it is implemented.** `pnpm verify` remains the regression command. Module 0 is already on that gate (GREEN at `5e99484`). The approved Module 1 contract is not merged and is not GREEN, and its tests are not on main, so they are not on that gate. This note does not add them and does not state that they pass. Once that contract is implemented, regression is still `pnpm verify`. A Module 3 test must not weaken the checks in the list above. No separate expected result is written.

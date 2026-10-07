**Role:** Senior 2D / Editor Engineer

**Concur.** At commit `5290d80048ee7ec3bf46edf4d0fdf32273377c9d` (`5290d80`), each sentence below has one observable result. None contradicts an accepted Module 0 decision. This is a preparation concurrence for issue #53. It is not Product Owner approval and not implementation authorization.

`preparation/reviews/editor-2d.md` records the earlier position. It is not a second contract. The normative text is the specification at this commit. `preparation/reconciliation.md` is the decision where that note disagreed.

## Insert

Insert takes a parent id, or null, and an integer index. The current length appends.

`insertNode` takes one parent and one index. Null selects the root list. An id already in the scene selects that node's child list. The index is an integer from 0 through the current length of that list, inclusive. An index equal to the current length appends. A parent id that is not in the scene throws `UNKNOWN_NODE`, including when the index is also out of range. An index that is not an integer, or that is outside that range, throws `INVALID_HIERARCHY`. Either failure leaves the scene unchanged. Section 5, M1-FR-006, Q-M1-B-004, and TP-M1-F-004 state that same result. Append-only insert is not a second operation.

## Delete

Delete removes the named node and its descendants and does not promote children.

`deleteNode` removes that id and every descendant, and it removes the id from its parent list or from the roots. Nodes outside the subtree keep their ids, kinds, extents, transforms, and order. Children are not moved up to replace the deleted node. A non-empty child list does not make the delete fail. An unknown id throws `UNKNOWN_NODE` and leaves the scene unchanged. Deleting the last node yields the empty scene. Section 5, M1-FR-007, M1-AC-004, Q-M1-B-004, and TP-M1-F-006 state that same result. Leaf-only delete is not a second procedure. Delete does not write editor session state, because this module has no selection API.

## Extents

Width and height are strictly greater than zero. A rectangle has no depth. Zero and negative extents are `INVALID_EXTENT`.

A rectangle stores `width` and `height` and has no `depth` field. A box stores `width`, `height`, and `depth`. Each stored extent is the result of the unchanged `canonicalizeFiniteNumber` helper and is strictly greater than zero. `0` and `-1` throw `INVALID_EXTENT` with message `Scene extent is not accepted.` and leave the previous scene unchanged. `-0` is canonicalized to `0` and then rejected with the same code. It is not stored. A non-finite extent throws `NON_FINITE_NUMBER`. A rectangle input that includes `depth`, or a box input that omits an extent, throws `INVALID_SHAPE`. Zero and negative scale still pass the Module 0 helper and are not rewritten by the extent rule. M1-FR-003, M1-FR-004, M1-AC-008, section 8, Q-M1-B-002, and TP-M1-F-007 state that same result. This module does not state a pivot.

## Viewport, selection, and the editor package

This module adds no viewport, no selection API, and no editor-package change.

Section 4 excludes selection (no scene field, no document field, and no editor-session API), a viewport, and any change to the editor package. A document key named `selection` is an unknown key and fails `INVALID_SHAPE`. TP-M1-F-005 expects no selection field, no selection export from `packages/editor`, and an unchanged foundation screen. TP-M1-N-002 expects no source change under `packages/editor`. ADR-0008 stays accepted: editor session state is only `starting`, `ready`, or `failed`, and its notes for a later viewport are not an interface and are not added here. Q-M1-B-001 states that absence as the Module 1 result. A later selection or viewport remains undecided and is not a second result for this module.

## Boundary

No rectangle, viewport, or selection model is implemented here. The specification stays unauthorized until the Product Owner approves it. This concurrence does not merge and does not push.

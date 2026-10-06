**Role:** Senior 3D / Rendering Engineer

Concur. At commit `5290d80` (`5290d80048ee7ec3bf46edf4d0fdf32273377c9d`), the specification, ADR-0009, and the test plan each give one result for the box, the stored transform, and the null renderer. None of those results contradicts ADR-0003. The coordinate convention in `rendering-3d.md` is the earlier position. It is not a second contract and not a pass/fail rule.

**Date:** 2026-10-06

**Issue:** #54. Preparation review only. This is not a mesh, not a draw item, not a GPU dependency, not Product Owner approval, and not authorization to implement Module 1.

## Box

A box has `width`, `height`, and `depth`. Each extent is finite and strictly greater than zero.

M1-FR-004, section 5, and M1-AC-008 say that. `0` and `-1` throw `INVALID_EXTENT` and leave the previous scene unchanged. A non-finite extent throws `NON_FINITE_NUMBER`. A box that omits an extent, or a rectangle that carries `depth`, throws `INVALID_SHAPE`. TP-M1-F-007 is that result and does not assert a center or a corner. ADR-0009 records the same extent rule and does not choose a pivot. Reconciliation Q-M1-B-002 is the same sentence.

The 2026-10-05 rendering review also asked for strictly positive extents. Its mapping of those extents onto local axes, and its center pivot, are not in this contract. Section 4 of the specification and section 8 of the test plan leave the pivot out of the rows. There is not a second observable extent result.

## Transform

Position, rotation, and scale are stored as canonical finite triples from `canonicalizeFiniteTriple`. `-0` is returned as `0`. A non-finite component throws `NON_FINITE_NUMBER` and does not change the scene. The same three fields exist on a rectangle and on a box.

M1-FR-005 and M1-AC-002 require that record. M1-AC-002 says the triples do not assert an axis. ADR-0009 stores the numbers and does not define an up axis, a handedness, a rotation order, or degrees versus radians. TP-M1-F-003 states the same limit. Those conventions stay deferred. A test that asserted one of them would be a new product decision, not a failure of this text.

The earlier review proposed a right-handed, Y-up, intrinsic XYZ convention stored in radians. That proposal is not adopted here and is not an acceptance criterion.

## Null renderer

`renderNull` stays an empty draw list. This module does not import the scene into the null renderer and adds no GPU dependency.

At this commit, `packages/rendering/src/null-renderer.ts` takes CSS width, CSS height, and device pixel ratio only. It returns a frozen snapshot whose `drawList` is a frozen empty array, with `backend` `null` and `device` `not-requested`. The file has no import. `packages/rendering/package.json` depends on `@uvcp/core` and on no GPU package. That dependency is the Module 0 package edge. The source file does not import a scene, and this module does not add one.

ADR-0003 binds that empty list as the Module 0 test double. It is not a promise that one list later paints flat and spatial items, and it selects no graphics API. ADR-0009 leaves `@uvcp/rendering` as Module 0 left it and keeps the draw list empty. A GPU draw of these nodes is outside that ADR. Specification section 4 forbids a change to the rendering package, a viewport, and a new runtime dependency. TP-M1-N-002 requires the same empty snapshot, no scene import in `null-renderer.ts`, no Module 1 test that imports the null renderer in order to paint nodes, and no GPU package. That preserves ADR-0003. It does not contradict it.

## Boundaries

No mesh, draw item, coordinate pass/fail rule, or rendering dependency was added. This review does not merge and does not push. No GPU process was started. No test or `pnpm verify` was run. The empty draw list was confirmed by reading `packages/rendering/src/null-renderer.ts`.

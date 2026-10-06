# Inherited null renderer

**Role:** Senior 3D / Rendering Engineer
**Status:** Preparation input for issue #9. Not a specification. Not implementation authorization.
**Date:** 2026-10-06

`renderNull` in `packages/rendering/src/null-renderer.ts` still returns a frozen result whose `drawList` is the shared frozen empty tuple. Filling that list fails the Module 0 tests in `packages/rendering/src/rendering.test.ts`. The return type is an empty tuple, so a non-empty list is not this function.

The Product Owner approved pull request #50 as the Module 1 implementation contract (issue #7, https://github.com/ericrommel/universal-editor/issues/7#issuecomment-6013883562). That pull request is not merged. Module 1 is not GREEN. The contract keeps the null-renderer draw list empty and forbids rendering-package changes in Module 1. Text, images, and curves are outside that contract.

Objects created under the approved scene contract are domain data, not renderer objects. `roots` and child lists are data order. They are not visible ordering. `renderNull` does not read them.

Module 2 preparation did not add a viewport and did not write a draw ADR. The agreed seam is a recommendation, not an ADR. Closing or writing those notes does not create the ADR. Which module may write the draw ADR is not decided. It is not assigned to Module 3.

Hit-test method stays an open Module 2 disagreement. One side is a later pure CPU test that returns an id or a miss, without a device. The other leaves CPU picking versus a pick buffer deferred. This note does not close that disagreement and does not turn `renderNull` into a hit test.

Scene correctness is a CPU check of snapshot data, not a GPU image. No stacking model and no blending model is selected. No new dependency. No graphics API. Three.js, Babylon.js, and `wgpu` stay out. No Product Owner decision is requested.

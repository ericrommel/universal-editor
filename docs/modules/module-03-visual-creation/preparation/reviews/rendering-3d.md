# Module 3 preparation — visual ordering and the null renderer

**Role:** Senior 3D / Rendering Engineer
**Date:** 2026-10-06
**Commit read:** `5e99484` (`5e994841cdfc16b426d26e735f92d9b5c9b61beb`), branch `m3/preparation`

## 1. Status

Preparation note for issue #9. It records how visual ordering and mixed 2D/3D content relate to the shipped null renderer. It is not implementation authorization, not a renderer selection, and not a Product Owner request.

Module 0 is GREEN at `5e99484`. That is the premise for this preparation. This note does not re-open acceptance, does not re-run `pnpm verify`, and does not edit Module 0 documents.

Module 1 (a rectangle and a box, headless, no viewport) is not approved. The 2026-10-05 rendering review of that proposal was read only as context. It is not approval and not current status. Module 2 (direct manipulation) has no preparation in this repository and no viewport. This branch has no scene, no mesh, no text rasterizer, no image decoder, and no viewport.

Archive section 9.4 is context only. "Changing ordering produces the expected visual ordering for applicable overlapping objects" and "a scene can contain text, an imported image, a 2D shape, and a 3D primitive simultaneously" are not operational requirements. Those identifiers are not adopted here. A 3D primitive does not exist at this commit. The box is only in the unapproved Module 1 proposal. That archive sentence is not a rendering task this note starts.

Read on 2026-10-06, not executed on a GPU: ADR-0003; architecture sections 3, 4, 10, and 15 and the section 10 import table; `packages/rendering/src/null-renderer.ts`; `packages/rendering/src/rendering.test.ts`; `packages/rendering/src/index.ts`; `packages/rendering/package.json`; `scripts/boundaries.mjs`. Archive section 9.4 and the unapproved Module 1 rendering review were context only. `scripts/shell-document.test.mjs` and `scripts/preview-smoke.mjs` were read for the canvas-element ban. No test, build, or `pnpm verify` was run.

## 2. What the null renderer can and cannot prove

`renderNull` in `packages/rendering/src/null-renderer.ts` returns a frozen result. The snapshot is frozen. Physical size is CSS size times `devicePixelRatio`, including a fractional ratio. Clear color is the shared frozen opaque sRGB black `{ space: "srgb", red: 0, green: 0, blue: 0, alpha: 1 }`. `drawList` is typed `readonly []` and is the shared frozen empty tuple. `backend` is `null`. `device` is `"not-requested"`. There is no `lost` field. The comment in that file says opaque sRGB black is the test double because no scene background exists. `packages/rendering/src/index.ts` exports only that function and those types.

`packages/rendering/src/rendering.test.ts` is the Module 0 proof of that value:

- `renderNull(8, 4, 1.5)` deep-equals width 12, height 6, ratio 1.5, the black clear, and `drawList: []`, with `backend === null`, `device === "not-requested"`, and no `lost` key.
- `renderNull(3, 5, 2)` yields width 6, height 10, and `drawList.length === 0`.
- The result, snapshot, clear, and draw list are frozen. `push` on the draw list throws `TypeError`. A second call reuses the same clear object and the same empty draw list, and that list is still empty.

That proves a headless boundary record. It does not prove pixels, overlap, or mixed content. Filling `drawList` fails the empty-list assertions. A new empty array on each call would still fail the shared-reference assertion. The public type is an empty tuple, so a non-empty list is not this function's return type.

ADR-0003 says this object is a Module 0 test double. It is not a promise that a later renderer receives the same object, or that one list draws both flat and spatial items. No graphics API is selected. `packages/rendering/package.json` depends only on `@uvcp/core`. Three.js, Babylon.js, and `wgpu` are not dependencies. The shell source is not a canvas: `scripts/shell-document.test.mjs` asserts `apps/shell/index.html` has no `<canvas>` element, and `scripts/preview-smoke.mjs` fails a built file that contains one. `--uvcp-canvas` in that smoke is a CSS token, not a drawing surface.

The null renderer cannot prove a change of order on screen; coexistence of text, an image, a 2D shape, and a 3D primitive; painter's order, a depth sort, z-index, or sibling order as a picture; fill, opacity, rasterized text, or a decoded image; or a camera, a hit test, or a viewport.

## 3. Ordering: data order versus pixels

There is no hierarchy at this commit, so there is no sibling order to read. If a later hierarchy stores sibling order, that value is document data. It is not visual evidence. `renderNull` does not read it. Reordering data would leave the snapshot the same: physical size, ratio, opaque sRGB black, and an empty draw list.

This note does not choose z-index versus sibling order. ADR-0003 does not promise that flat items and spatial items share one draw list, so an array index is not an overlap rule decided in advance.

A GPU golden image is the wrong proof. ADR-0003 forbids an image diff and a GPU golden test for this boundary. Architecture section 15 says Module 0 has no screenshot diff, GPU golden image, or baseline PNG, and that even after a module draws, scene correctness is a CPU check of snapshot data, not a GPU image. A shell screenshot is chrome evidence, not scene evidence. There is no framebuffer: `device` is `"not-requested"`.

Visual proof of overlap stays blocked until some later module is authorized to draw. That authorization is a new ADR. Which module owns that ADR is not decided here. This note does not assign the first non-empty draw list to Module 3.

## 4. Import and package constraints before any draw list exists

Architecture section 10 and `scripts/boundaries.mjs` are the import table. `@uvcp/rendering` may import `@uvcp/core` only. `@uvcp/editor` may import `@uvcp/core` and `@uvcp/persistence` and must not import `@uvcp/rendering`. `@uvcp/shell` may import `@uvcp/ui`, `@uvcp/editor`, and `@uvcp/platform` and must not import `@uvcp/rendering`. A type-only import counts. A test import counts. The same script bans `three`, `@babylonjs/`, and `wgpu` from `@uvcp/rendering`, along with React, a desktop SDK, and filesystem modules.

`null-renderer.ts` does not import `@uvcp/core`. The package dependency is not a scene walk. This note does not add that import and does not make `renderNull` read a document.

Section 10 requires a new ADR that amends this table before `editor` may call the renderer. That ADR has not been started. Module 2 has not defined a viewport. This preparation does not open the ADR and does not name its owner. Until it exists, neither `editor` nor `shell` may present a draw list by importing rendering.

Architecture sections 3 and 4 record the same boundary: a snapshot and a null renderer, no graphics backend, and no selection of WebGPU, WebGL2, or a native surface.

## 5. Classification

| Work | Class |
| --- | --- |
| This note: archive ordering and mixed content against the shipped null renderer | Can be written now. This is that note. |
| Frozen empty snapshot, physical size, opaque sRGB black, `backend: null`, `device: "not-requested"` | Shipped and tested in Module 0 (`rendering.test.ts`). Not Module 3 work. |
| A scene whose objects can be ordered | Blocked on Module 1. The proposal is not approved. This branch has no scene. |
| Rectangle and box in one hierarchy | Blocked on Module 1. The box exists only in that unapproved proposal. That proposal was headless and had no viewport. It is not a draw list. |
| Sibling order on a future hierarchy | Data, once a scene exists. Not visual evidence. Not chosen here as the overlap rule. |
| Text, an imported image, further 2D shapes, and a 3D primitive together | Later product decision: which objects exist. No rasterizer, decoder, mesh, or primitive is on this branch. Archive section 9.4 does not start it. |
| What overlaps, and which objects are ordered | Later product decision. Not decided here. |
| z-index versus sibling order, or a depth sort | Later product decision. Not chosen here. |
| A non-empty draw list, a viewport, or `editor` calling the renderer | Blocked on a viewport/draw ADR. Not started. Module 2 has not defined one. Not assigned to Module 3. The owning module is not decided here. |
| A CPU check of snapshot data after a module is authorized to draw | Follows architecture section 15 only after that ADR. The check is not defined here. It is not a GPU image. |
| GPU API, canvas, golden image, Three.js, Babylon.js, or `wgpu` | Out of scope. See section 6. ADR-0003 left the API unselected. |

## 6. Non-goals

- No GPU, no adapter request, no shader, no golden image, and no image diff.
- No canvas in the shell, and no viewport.
- No new dependency. `packages/rendering/package.json` stays on `@uvcp/core` only. Three.js, Babylon.js, and `wgpu` stay out.
- No change to `renderNull`, `RenderSnapshot`, or `rendering.test.ts`. The shared empty draw list stays empty.
- No scene schema, mesh, text rasterizer, image decoder, or appearance model.
- No choice of z-index, sibling order, or one list for flat and spatial items.
- No request that the Product Owner approve Module 3, Module 1, a draw list, or a graphics API.

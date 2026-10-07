# Module 1 preparation — 3D / rendering review

**Role:** Senior 3D / Rendering Engineer
**Date:** 2026-10-05
**Status:** Proposed preparation review for issue #7. Not an operational specification, not implementation authorization, and not Product Owner approval. Module 0 is not GREEN.

## Recommendation

Accept the starter. The only 3D object is a box with finite width, height, and depth. It shares one hierarchy and one local transform with a 2D rectangle. Module 1 does not extend the null-renderer draw list, does not draw, and adds no mesh, material, camera, light, viewport, or GPU dependency. Coexistence is proved by the scene document, not by pixels.

Proposed coordinate convention. The Product Owner must accept or reject it before a test treats it as pass/fail. `canonicalizeFiniteNumber` and `canonicalizeFiniteTriple` do not decide it.

- Right-handed. +Y up, +Z forward, front of an object faces +Z. This matches glTF 2.0 section 3.4, read 2026-10-05. That section also says −X is the asset's right. A later camera that looks down −Z therefore has +X toward the viewer's right. This module has no camera.
- Positive rotation is counterclockwise about the axis (right-hand rule). Store an intrinsic XYZ Euler triple in radians: local X, then local Y, then local Z. For column vectors, R = Rz · Ry · Rx. The XYZ branch of Three.js r180 `makeRotationFromEuler` sends +Y to +Z for a +π/2 rotation about X. Three.js is not a dependency. glTF stores a quaternion and uses meters. Neither is adopted.
- Translation and both objects' extents share one unnamed scene unit. One unit of width equals one unit of translation X. The snapshot `devicePixelRatio` does not scale the document.
- Local composition is T · R · S: scale, then rotation, then translation, as in glTF 2.0 section 3.5.3. World placement is parent global times local and is derived, not stored. No skew, and no second stored matrix or quaternion.

The alternative is Z-up, right-handed, intrinsic XYZ Euler stored in degrees: the axes and angle unit a Blender-style or CAD-style UI usually shows. Not proposed for the document. A later importer can convert. Degrees can still be displayed. Left-handed Y-up, the Unity and default Babylon.js scene, is not proposed either.

## Scene facts this convention needs

Width, height, and depth are the box extents along local X, Y, and Z. The rectangle has width and height along local X and Y and no depth. Position Z is not depth. A rectangle with a Z translation is still a rectangle, not a box and not a mesh. Neither object has vertices, indices, normals, UVs, or a color. A color would start a material.

Both objects are centered on the node origin, so one rotation turns either about its center. The alternative is a min-corner or screen top-left pivot. Reject it: it bakes Y-down into a Y-up document. Local +Y is scene up, not CSS or SVG down. That screen map belongs to a later viewport.

Recommend each box extent be finite and strictly greater than zero. The Module 0 helpers still accept zero and negatives. A negative extent is a second scale. Zero is not a box. This check is part of the proposal, not a change to those helpers. Scale stays unitless and may be non-uniform. Zero scale is not a visibility flag.

One hierarchy holds both kinds. A rectangle may parent a box, and the reverse. Sibling order is not painter's order and not a depth sort.

## Draw list

A snapshot draw item is not required. The objective is one scene, hierarchy, persistence model, and transform. Archive section 9.2 is context only. Its viewport sentence in M1-AC-001 does not authorize drawing.

ADR-0003 makes the empty draw list a Module 0 test double, not a promise that one list paints flat and spatial items. Architecture section 15 says that even a module that draws proves a scene by a CPU check of snapshot data, not by a GPU image. The preparation quality note allows the model or the snapshot. The model is enough here because this module does not draw. `renderNull` returns a frozen empty `drawList`, backend `null`, and device `not-requested`. The Module 0 tests assert that empty list. Filling it fails those tests or builds a second list the null renderer does not read.

`scripts/boundaries.mjs` matches architecture section 10. `@uvcp/rendering` may import `@uvcp/core`. Core must not import rendering. Rendering must not import ui, editor, platform, `three`, `@babylonjs/`, or `wgpu`. A type-only import counts. `packages/rendering/package.json` depends on `@uvcp/core`. `packages/rendering/src/null-renderer.ts` does not import it. Keep that source import absent in Module 1.

That absence is not a ban on the core edge. The null renderer stays free of a scene import so it does not walk the hierarchy or become a second document. `editor` must not import rendering, and `shell` must not import rendering or core. Architecture section 10 requires a new ADR before a later viewport module lets `editor` call the renderer. This review does not request that ADR. Editor can hold a scene and cannot present it. Rendering could read a core scene, and Module 1 still must not make `renderNull` do that. Pixels cannot prove the objective without that import or a new viewport ADR.

## Out of scope

No GPU package, shader, canvas, gizmo, or foundation-screen change. No change to the two-field manifest. Saving the scene is a separate document decision. If a later save exists, it stores the plain extents and the shared transform, not a renderer object and not GPU buffers.

## Risks

- A 2D test stores screen Y-down degrees. The shared transform then disagrees with a later glTF import.
- `XYZ` is written without "intrinsic" and without R = Rz · Ry · Rx. Extrinsic XYZ is the opposite composition.
- The box gains vertices so the rendering package looks occupied. That is a mesh, and a second geometry model.
- `drawList` grows, or Three.js or Babylon.js is added to define the axes. Neither is needed. This review adds no GPU dependency.

## Verification

Read on 2026-10-05: ADR-0003, `packages/rendering/src/null-renderer.ts`, `packages/rendering/src/rendering.test.ts`, `packages/rendering/package.json`, `scripts/boundaries.mjs`, architecture sections 10 and 15, and `preparation/quality.md`. Archive section 9.2 was read as context only. glTF 2.0 sections 3.4 and 3.5.3 were read the same day. The Three.js r180 XYZ branch was read and not executed. No GPU process was started. No test, build, or `pnpm verify` was run. No other file was edited.

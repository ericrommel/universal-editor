# Rendering

**Status:** Preparation input for issue #10. Not a specification. Not implementation authorization.
**Role:** Senior 3D / Rendering Engineer
**Date:** 2026-10-06

Archive text for M4-NFR-001 and M4-AC-003 is context only. Those identifiers are not operational requirements. The Module 2 agreed seam is the boundary used here. It is not an accepted architecture and not an ADR.

## Source and render

The editable source of a stroke stays domain data. A later render must not be the only copy of that source. This note does not choose how a stroke would be tessellated.

## Null renderer

`renderNull` returns a frozen snapshot. Its `drawList` is the shared empty list (`readonly []`). That list stays empty. Do not fill it. Do not extend it for picking. `backend` stays `null`. `device` stays `"not-requested"`.

## Imports and libraries

`editor` must not import `rendering` until a new ADR amends the import table in `docs/engineering/architecture.md` section 10. This note does not open that ADR and does not assign it to Module 4. No Three.js, Babylon.js, wgpu, or curve library.

## Visible stroke

When a draw path exists, visible stroke proof is a CPU snapshot check, not a GPU image. Architecture section 15 already states that scene correctness is a CPU test of the snapshot. No such draw path is authorized here, and `renderNull` is not turned into one.

## Hit testing

The hit-test method stays the open Module 2 disagreement. The Tech Lead recommends a later pure CPU test that returns an id or a miss, without a device. The Module 0 rendering record still treats CPU picking versus a pick buffer as deferred. This note does not close that record.

## Authorization

Module 4 implementation is not authorized.

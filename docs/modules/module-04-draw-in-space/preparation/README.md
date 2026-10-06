# Module 4 preparation

**Role:** Project Manager. The notes below are the specialist records. This file records how they fit. It does not replace them.

**Status:** Preparation for issue #10. Not a specification. Not an ADR. Not implementation authorization. Not a Product Owner request.

**Date:** 2026-10-06

Archive section 9.5 in `docs/archive/product-engineering-specification-v1.0.md` is context. Its identifiers are not operational requirements.

Checked against `main` at `61cf9c9`. The approved Module 1 contract is pull request #50, head `13f1725`, approved at [issuecomment-6013883562](https://github.com/ericrommel/universal-editor/issues/7#issuecomment-6013883562). It is not merged. Module 1 is not GREEN. Module 2 preparation notes are on `main` and are not an ADR. Module 3 is not GREEN. Development-process section 20 keeps Module 4 implementation behind Module 3.

No specialist dissented.

| Note | Role |
| --- | --- |
| [architecture-constraints.md](architecture-constraints.md) | Tech Lead |
| [core-platform.md](core-platform.md) | Senior Core / Platform Engineer |
| [editor-2d.md](editor-2d.md) | Senior 2D / Editor Engineer |
| [rendering.md](rendering.md) | Senior 3D / Rendering Engineer |
| [interaction.md](interaction.md) | Senior Product Designer / UX Architect |
| [trust-boundary.md](trust-boundary.md) | Senior Application Security Engineer |
| [evidence.md](evidence.md) | Functional Quality Engineer |
| [non-functional.md](non-functional.md) | Non-Functional Quality Engineer |
| [verification-environment.md](verification-environment.md) | Senior DevOps / Platform Engineer |

## Recorded constraints

- A curve kind is an unknown kind on schema token `1` and fails `INVALID_SHAPE`. Control points are not extra keys on that document and are not fields of the two-field manifest. 1048576 is not a stroke budget.
- Editable control data, when a later contract allows it, is domain data made of finite numbers through the existing canonicalizers. It is not a mesh, not a draw-list entry, and not a renderer object. Derived geometry is not the only copy of the source. Polyline versus Bezier is not chosen.
- A freehand stroke is not move, rotate, or scale. Pointer samples are not undo steps. Completing a stroke is not a finite-triple replacement, so the Module 2 undo recommendation does not cover it. The numeric frame is not accepted. The four Module 2 disagreements stay open.
- `renderNull` stays empty. `editor` does not import `rendering` until a new ADR. That ADR is not opened and is not assigned to Module 4. No graphics library is added.
- Core does not mint ids. No new dependency. Diagnostics do not log sampled points, pointer paths, or scene contents. A stroke does not carry a script, URL, handler, or prototype key. No point-count limit is set.
- The foundation screen does not gain a stroke tool. This package does not draft issue #40 and does not design a drawing surface.
- The functional note gives every draw-in-space behavior no expected result. A written deferral is not a test approach. No fidelity number and no multi-stroke workload are set. `pnpm verify` stays the regression gate. The DevOps note does not claim a run for this branch.

## What can start now

This directory. It adds no curve type, stroke tool, viewport, undo stack, dependency, test, or workflow.

## What stays blocked

| Work | Waits on |
| --- | --- |
| Editable control data in a scene document | Module 1 GREEN under the approved contract, then Module 3 GREEN, and a new document contract. Schema token `1` is not extended in place. |
| Freehand sampling | Module 2 GREEN and Module 3 GREEN. The gesture is not a transform command. The foundation screen is not the surface. |
| Undo of a completed stroke | The same gate. The Module 2 triple step does not cover it. The undo policy is not selected. |
| A visible stroke | The same gate, plus a draw ADR that does not exist. Issue #48 shares that missing ADR. This package does not assign it. |
| Persistence of control points | A later document contract. Not the manifest, not schema token `1`, and not the image-container decision. |

Curve-to-tube is Module 5. This preparation does not start it.

## Definition of Ready

Not met. Scope is still the backlog objective plus these constraints. Earlier modules are not GREEN. Archive identifiers are not stable requirements. There is no test approach, no design of the drawing surface, no reference workload, and no Product Owner authorization to implement Module 4.

## Out of this package

No application code, fixture, dependency, workflow edit, or ADR. Issue #10 is not Ready for PO, not Ready for Development, and not Done.

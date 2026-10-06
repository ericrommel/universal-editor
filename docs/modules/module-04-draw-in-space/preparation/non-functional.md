# Module 4 — Non-functional preparation

**Status:** Preparation input for issue #10. Not a workload plan. Not implementation authorization.
**Role:** Non-Functional Quality Engineer
**Date:** 2026-10-06

## Limits

The archived Module 4 non-functional requirements are context only. This note does not adopt those identifiers.

M4-NFR-002 (input fidelity tolerances) and M4-NFR-003 (reference multi-stroke scene) name budgets this project has not defined. Those identifiers are not operational. This note does not choose a tolerance, a point count, a stroke count, or a frame time.

Module 0 set no frame-time budget. Module 2 did not reuse verification hang guardrails as one. This note does not either.

The Definition of Ready reference-workload bullet is unmet. Nothing here satisfies it.

## Caps

1048576 is the approved scene-document cap for rectangles and boxes with no images. It is not a stroke budget. Q-M1-B-003 records that cap for those documents, which contain no meshes and no images.

262144 is not a budget. Q-M1-B-003 did not give that figure a node budget, and this note does not restore it as a byte cap.

No node-count cap exists. This note does not invent one.

## Workload

Module 2 set no workload threshold. An observation is not a pass and not a fail. It does not fail `pnpm verify`, and it is not evidence that a behavior passed. This note adds no workload.

Playwright stays deferred. This note does not add it.

## Regression

`pnpm verify` remains the regression gate. Pipeline timings are observations.

## Not in this note

No application code, tests, fixtures, or continuous-integration changes. Implementation stays unauthorized.

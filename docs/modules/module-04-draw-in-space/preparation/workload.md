# Module 4 — Workload bound

**Status:** Preparation input for issue #70. Not a benchmark. Not a specification. Implementation is not authorized.
**Role:** Non-Functional Quality Engineer
**Date:** 2026-10-06

Issue #70 is preparation under issue #10. This file records constraints. It does not define a workload, and it does not open implementation.

## No workload is defined

No interactive workload is defined for Module 4. No frame-time threshold is defined. This note does not define either one.

Archive section 9.5 says a reference multi-stroke scene shall remain interactively editable. That sentence is archive context, not an operational threshold. The identifiers in that section are not operational requirements. The sentence does not state a frame time, a stroke count, or a hardware baseline. This note does not supply those, and it does not adopt the archive identifiers.

## What is on this branch

These facts were read from `61cf9c97ebceeaa874bb3cf0b7b5f799911976a1`, which is `origin/main` for this branch. The Module 1 documents are not in this tree.

Module 1 is not GREEN and does not draw. The Product Owner approved the Module 1 specification in pull request #50 for implementation. That approval is not module acceptance. The same decision leaves viewport interaction outside Module 1. Pull request #50 does not add a stroke or a drawing surface, and it is not merged here.

The null renderer returns an empty draw list. `renderNull` records physical pixel size, the device-pixel ratio used to compute that size, an sRGB clear color, and a `drawList` of type `readonly []`. The result uses backend `null` and device `not-requested`. ADR-0003 binds that empty list as the Module 0 test double. It is not a curve and not a viewport.

No viewport exists. Module 0 ships no canvas. Module 2 preparation on this branch does not approve a viewport or an undo API.

## Before a workload could be measured

An interactive workload could be measured only after three things exist. This preparation does not create them.

1. An approved curve. No stroke, curve kind, or scene kind is approved here.
2. A viewport. None exists, so there is no interactive surface.
3. A chosen observation method. None is chosen. This note does not choose a session, a harness, or a job.

Until those exist, there is nothing to measure. This note does not guess a curve, a viewport, or a method.

## What this preparation adds

No benchmark harness and no performance threshold. No fixture, no continuous-integration job, no dependency, no workflow change, and no ADR.

ADR-0005 keeps job and spawn timeouts as hang guardrails. Timings stored as observations are not thresholds. This note does not turn either into a frame-time budget. No hardware baseline is chosen.

Development process section 6.9 requires a performance claim to name the environment, the workload, the measurement method, and the threshold. This note makes no performance claim. None of the four is set.

Definition of Ready still requires reference workloads where a module needs them. They are not defined for Module 4. This note does not claim that the module is ready for development.

## Open questions

Left open on purpose.

- Which curve, once one is approved, a later workload would contain.
- Which observation method a later measurement would use.
- Whether a numeric threshold is ever set. None is set here.

## Boundary

No application code, tests, fixtures, dependencies, workflow edits, or ADR. This file does not add a stroke, a curve, a scene kind, a viewport, a tool, or an undo API. Module 3 preparation is not approval of a creation tool. Implementation is not authorized.

# Module 2 reference interaction workload

**Status:** Proposed input for issue #41. Not a pass threshold. Not Product Owner approval. Not implementation authorization.

**Role:** Tech Lead, integrated with the Module 2 contract. The Non-Functional Quality Engineer reviews this file.

**Date:** 2026-10-06

The scene kinds come from the Product Owner-approved Module 1 contract, pull request #50 at `13f1725750ba047eeed7df6f25fa7155d45cb9d5`. This note does not wait for Module 1 to be GREEN. It adds no benchmark harness, no fixture in code, and no CI job.

## Reference scene

64 rectangle nodes and 64 box nodes, all roots. Rectangles come first. Ids are `r0` through `r63`, then `b0` through `b63`. Each extent is `1`. Scale is `[1, 1, 1]`. Rotation is `[0, 0, 0]`. Positions use the root index, `0` through `127`. Column is `index % 16`. Row is `floor(index / 16)`. Position is `[(column * 4), (row * 4), 0]`. The spacing keeps the projected faces from overlapping under the view in the specification.

The count is a proposed observation size. It is not a product limit, not a maximum, and not a node-count cap. A minimal node is on the order of a few hundred document bytes, so this scene stays far under the Module 1 document cap of 1048576. The measurement is the gesture, not the byte cap.

## Common-case manipulation

The common case from the interaction note is dragging the object. The recorded gesture selects one rectangle and moves it by dragging its face until primary-button up commits a new position. The other two triples stay the values from gesture start. The run uses one rectangle. It does not also time a box handle, a rotate, or a scale. Those commands are functional tests.

## What a later measurement records

One record, `kind: observation`:

- the machine;
- the tool, either a named browser or a headless harness;
- the surface size in CSS pixels when a window is opened;
- `devicePixelRatio` when a browser is opened, recorded and not used as a second hit-test space;
- that the reference scene was built;
- that one face drag was committed;
- the wall time from primary-button down to the return of the committed transform replacement, in milliseconds.

No frame time, no sample series, and no object count other than the reference scene above.

## Threshold

Module 2 has no numeric responsiveness threshold.

ADR-0005 stores timings as observations. Module 0 set no frame-time budget. The 30-minute verification job timeout and the 60-second diagnostic spawn timeout are hang guardrails. They are not reused as a budget. An observation does not pass or fail `pnpm verify`. It is not evidence that interaction passed.

## Boundary

This file does not edit the workflow, the application, or the Module 1 specification.

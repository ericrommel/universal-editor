# Module 4 — Evidence split

**Status:** Preparation input for issue #69. Not a test plan. Not a specification. Implementation is not authorized.
**Role:** Functional Quality Engineer
**Date:** 2026-10-06

## Limits

This note says which later drawing behaviors are blocked, and which can stay headless only after a named contract exists. It is not the test plan in `docs/engineering/development-process.md` section 9. It does not satisfy the Definition of Ready in section 8. It sets no pass/fail threshold and records no pass or fail.

Archive section 9.5 is context for the behaviors below. This note does not adopt that section's requirement or acceptance identifiers. It does not write a pass/fail row for behavior that has no approved contract.

Module 1 is approved for implementation and is not GREEN. Issue #7 authorizes that contract. The text is pull request #50, branch `m1/reconcile-preparation`. It was read with `git show` and was not checked out. It is not on this branch. The proof in that contract is headless. The specification adds no viewport. The test plan requires no screenshot: a browser session does not replace the headless suite. The kinds are `rectangle` and `box`. Curves, undo, hit testing, and a user-facing save are out of scope. The scene-document codec is not a user-file writer.

Module 0 is GREEN at `5e99484` (issue #1). That acceptance does not approve a viewport or a file writer. ADR-0003 ships no canvas. The null renderer returns an empty draw list, backend `null`, and device `not-requested`. ADR-0006 defers who writes a user's file. It compares inverse patches, full-document snapshots, and an event log, and it selects no undo strategy. Module 0 adds no undo API.

Module 2 preparation on `main` does not approve a viewport or an undo API. Module 3 preparation does not approve a creation tool.

One behavior can be blocked by more than one missing contract. Removing one blocker does not make the check runnable.

Developers write automated tests after implementation is authorized. This note adds no `*.test.ts` file and no other test.

## How a later check runs

Headless checks, once a contract exists for them, run under existing `pnpm test` discovery (`*.test.ts`, `*.test.mjs`, outside `node_modules`, `dist`, `ts-out`, `build`, and `.git`). They open no window. A pass that needs xvfb, or any other supplied window system, is not headless evidence.

No screenshot is required. There is no screen in which a stroke could be pictured. Module 0's headed launch record is the foundation screen, not a drawing. Module 1 requires no screenshot. Requiring one here would treat a viewport as if it already existed.

The regression gate is `pnpm verify` / `node scripts/verify.mjs` on `ubuntu-24.04` and `windows-2025`. That script is the verification entry point. It runs the boundary check, `tsc -b`, Biome, the license allow-list, `pnpm audit --audit-level=high`, the headless tests, the production build, and the loopback preview smoke, and it returns the child exit code. No `|| true`. The smoke requests the built shell and opens no window. It is not a drawing. The built shell must not contain a canvas element. That check is Module 0 build evidence, not a stroke test, and this note does not change it. The Linux job stays a coupling check, not a desktop result. The workflow `timeout-minutes: 30` is a hang guardrail. It is not a frame-time budget. This note does not run that gate.

## 1. Blocked until a curve object exists in an approved contract

**Missing input:** an approved contract for a curve object. The Module 1 contract does not contain one. A kind other than `rectangle` or `box` is outside that closed shape. This note does not choose control points, knots, a smoothing rule, a width field, a kind string, or a new document key.

These later behaviors stay blocked on that contract:

- A stroke becoming a native spatial curve in the one scene.
- Editable source or control data retained after creation.
- Stroke width or other appearance stored on that object.
- The curve taking part in the same hierarchy as a rectangle and a box.
- A stored change to control data that keeps the same object rather than substituting another.
- Reconstruction of geometry from stored curve data. "Equivalent" is not defined. This note sets no distance, angle, or point-count tolerance.

The null renderer cannot stand in for that object. Its draw list is empty and holds no stroke. Extending it is not authorized.

Putting a curve into the current scene value, or into either current document codec, is not a way to unblock the row. Those codecs are not amended here.

## 2. Blocked until a viewport and a hit rule exist

**Missing input:** an approved viewport in which a stroke is visible, and an approved rule for what a pointer does. Module 0 has no canvas. Module 1 adds no viewport and no hit testing, and its proof does not use a screenshot. Module 2 preparation does not approve a viewport. No approved rule says which object a pointer selects. No approved rule says where a pointer sample lands in the scene. This note writes neither rule.

These later behaviors stay blocked on that viewport and that rule:

- Drawing a stroke with a pointer.
- Seeing the stroke, including after its stored control data changes.
- Selecting the curve by a pointer click.
- Any picture of the stroke used as evidence.

A headed session cannot be specified until that viewport exists. This note does not require a screenshot in its place. A picture of the foundation screen would not be a drawing.

## 3. Blocked until undo exists as an approved command

**Missing input:** undo as an approved command. ADR-0006 selects no strategy. Module 0 adds no undo API. The Module 1 contract leaves undo out of scope. Module 2 preparation does not approve an undo API. This note does not choose inverse patches, snapshots, or an event log.

These later behaviors stay blocked on that command:

- Undo removes a completed stroke.
- Redo restores that stroke, including the editable data the curve contract names.

A headed replay of the gesture is not the evidence. It is also unavailable, because there is no viewport. The missing strategy is not another evidence class.

## 4. Blocked until a file writer exists

**Missing input:** a user-file writer and a reopen of that file. ADR-0006 defers who writes a user's file and what a failed write does. Persistence does not call the filesystem. The Module 0 manifest is not a scene. The Module 1 scene codec, on the unmerged contract, writes and reads document bytes in memory for `rectangle` and `box` only. It is not a file writer, and it is not a curve document. The provisional manifest bytes are not the user's file.

These later behaviors stay blocked on that writer:

- Save, close, and reopen preserve the curve and its editable data.
- Unchanged stored curve data survives reload of that file.

An in-memory round-trip of today's scene document does not reopen a user file and cannot carry a curve.

## 5. Able to stay headless only after those contracts exist

None of the checks below can be written against the contracts that exist today. After the named contract exists, the check reads stored values with no window. It still needs no screenshot. No row sets a tolerance, a stroke count, or a frame time. Issue #70 is the workload note. This file does not guess its numbers. An absent number is not a pass and not a fail.

The rows are not requirement identifiers and not acceptance results.

| Later behavior | Headless only after | Still not enough |
| --- | --- | --- |
| A headless reader sees the curve fields the contract names, including editable source data after creation and after an edit that keeps that object | An approved curve object | A viewport, a screenshot, or a file |
| A rectangle, a box, and a curve are one scene, and a headless reader sees the curve's transform if that contract stores one | That same curve contract includes the hierarchy and the transform | An up axis, degrees versus radians, or a file. Module 1 stores triples and does not interpret them. This note does not |
| Undo restores the preceding curve state a headless reader saw, and redo applies that same state again | An approved undo command, and the curve contract | A headed replay, or a choice among the ADR-0006 strategies |
| Save, reopen, and a headless reader sees the curve data that was current at save | A file writer, and the curve in the document that writer stores | The Module 1 in-memory codec, the provisional manifest, or a screenshot of a reopened view |

Pointer drawing, a visible stroke, and pointer selection do not move into this table when the other contracts appear. They stay in section 2 until a viewport and a hit rule exist. After those exist, the stored result of an approved drawing command can still be read with no window. `pnpm test` does not prove the view. This note still does not require a screenshot.

## 6. Regression of earlier modules through `pnpm verify`

**Evidence class:** the existing verify gate. Not a new suite and not a new job.

`pnpm verify` (`node scripts/verify.mjs`) is the regression gate on `ubuntu-24.04` and on `windows-2025`. It opens no window and does not repeat the Module 0 headed launch.

Module 0 is GREEN, and its checks stay on this gate. Module 1 is approved for implementation and is not GREEN. When that implementation is what a later run contains, its proof stays the headless suite in its own test plan. That suite has no viewport and no screenshot requirement. This note does not mark Module 1 passed or failed, and it does not turn "not GREEN" into a threshold. It names no second suite.

Tests from a later approved module stay on this same gate. No numeric threshold is added. A duration in a log is not a pass/fail line.

## Not in this note

No application code, tests, fixtures, dependencies, workflow edits, or ADR. No stroke, curve, scene kind, viewport, tool, undo API, or file writer. Implementation is not authorized. This note cannot make Module 4 GREEN.

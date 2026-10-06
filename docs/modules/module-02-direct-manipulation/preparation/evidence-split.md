# Module 2 — Evidence split

**Status:** Preparation input for issue #37. Not a test plan for an approved specification. Not Product Owner approval. Implementation stays unauthorized.
**Role:** Functional Quality Engineer. Non-functional rows contributed by the Non-Functional Quality Engineer.
**Date:** 2026-10-06

## Limits

This note names evidence a later test would check. It is not the test plan the Definition of Ready requires, and it does not satisfy that definition. Ready for Development still needs an explicit scope, stable requirement identifiers, a test approach for each of them or a documented reason to defer, defined reference workloads where the module needs them, and Product Owner authorization. None of that is claimed here.

Archive section 9.3 is context for the behaviors below. This note does not adopt that section's requirement or acceptance identifiers.

Pull request #33 is an unapproved Module 1 proposal: a headless scene document, selection by id, no user-facing save, and no viewport. It was not checked out. Module 0 has no canvas (ADR-0003) and no user-facing file writer (ADR-0006). Module 0 is GREEN at `5e99484` (issue #1). That acceptance does not approve a viewport or a file writer. Developers write automated tests after implementation is authorized. This note adds none.

## How a later check runs

Headless checks run under existing `pnpm test` discovery (`*.test.ts`, `*.test.mjs`, outside `node_modules`, `dist`, `ts-out`, `build`, and `.git`). They open no window. A pass that needs xvfb, or any other supplied window system, is not headless evidence.

A headed record, when one is required, follows the Module 0 launch-evidence pattern: one named browser and a recorded session, not a browser matrix. Module 0 used headed Microsoft Edge on the primary Windows machine. Continuous integration does not open a window and does not use a display server to claim that it did.

The regression gate is `pnpm verify` / `node scripts/verify.mjs` on `ubuntu-24.04` and `windows-2025`. That script is the verification entry point. It runs the boundary check, `tsc -b`, Biome, the license allow-list, `pnpm audit --audit-level=high`, the headless tests, the production build, and the loopback preview smoke, and it returns the child exit code. No `|| true`.

Each behavior has one evidence class: headless command, headed visual record, or blocked.

## Functional rows

### 1. Pointer selection of a visible object, including a click that changes which object is selected

**Evidence class:** blocked

**Missing input:** an approved viewport in which an object is visible, and an approved rule for which object a pointer click selects. Module 0 ships no canvas. Pull request #33 selects by id, adds no viewport, and is not approved. Writing a selected id from that proposal would not show a pointer click on a visible object. A headed session cannot be specified until the viewport exists. Row 3 does not supply this input.

**Assertion a later test would check:** a pointer click on one visible object selects that object, and a click on a different visible object changes which object is selected.

### 2. Move, rotate, and scale change the transform values a headless reader sees

**Evidence class:** headless command

The shared transform record is not an approved contract. Pull request #33 proposes three finite triples and does not choose an up axis or degrees versus radians. This note does not adopt that proposal. The headless assertion does not wait on a file writer. It names the reader's values as the values a later persistence path stores. Comparing a saved file is row 6.

**Assertion:** with no window, a headless reader sees new transform values after a move, after a rotate, and after a scale. Those are the same values a later persistence path would store, not a viewport-only copy the reader cannot see.

### 3. The selected object is visibly distinct

**Evidence class:** headed visual record

**What the record must show:** in one view, a reviewer can tell the selected object from an object that is not selected without reading a log. The session names the browser and is kept as a recorded session, as the Module 0 launch record was. It is not a browser matrix. The graphic itself (outline, color, or another treatment) waits for an approved design. This record does not prove which id is selected.

### 4. Undo restores the preceding in-scope transform, and redo applies it again

**Evidence class:** headless command

This is headless if a history command exists. ADR-0006 defers the undo strategy: inverse patches, full-document snapshots, and an event log were compared, and none was selected. Module 0 adds no undo API. The missing strategy is not another evidence class, and this note does not choose one. A headed replay of the gesture is not the evidence.

**Assertion:** with no window, undo restores the preceding in-scope transform the headless reader saw, and redo applies that same transform again.

### 5. Cancel leaves the transform that was current when the gesture began

**Evidence class:** headless command

**Recommendation:** later tests should use a cancel command, not a headed-only gesture. A gesture with no command can show motion and still leave the stored transform unproven. That is a testability gap. It is not a reason to change this class.

**Assertion:** after a gesture has changed the previewed transform, cancel leaves the transform that was current when the gesture began, as a headless reader sees it. No window.

### 6. Save and reopen preserve the manipulated transform

**Evidence class:** blocked

**Missing input:** a user-file writer and a reopen of that file. ADR-0006 defers who writes a user's file and what a failed write does. Persistence does not call the filesystem, and the Module 0 manifest is not a scene. Pull request #33 proposes a scene document and has no user-facing save. It is not approved.

**Assertion once that input exists:** save after a manipulation, reopen that file, and a headless reader sees the transform that was current at save. The provisional manifest bytes are not that file.

## Non-functional rows

The Non-Functional Quality Engineer owns rows 7 and 8.

### 7. Manipulation stays interactive under a reference workload

**Evidence class:** blocked

**Missing input:** the reference workload, issue #41. That issue is blocked. It does not start until #35 and #36 are closed and the Product Owner has approved one Module 1 scene contract. Pull request #33 is not that approval.

This note sets no object count and no millisecond budget. Module 0 set no frame-time budget (ADR-0003). The 30-minute verification job timeout and the 60-second diagnostic spawn timeout are hang guardrails. They are not a frame-time budget, and they are not reused as one.

**Observation that replaces a budget until #41 exists:** not a pass and not a fail. The same kind of record as the Module 0 pipeline baseline, `kind: observation`: the machine, the tool (a named browser or a headless harness), the viewport size if a window was opened, and that one in-scope gesture was attempted. No frame time, no sample count, and no object count. The observation does not fail `pnpm verify` and is not evidence that the behavior passed. Which interval or sample #41 will choose is uncertain. This note does not guess.

### 8. Approved earlier modules stay green

**Evidence class:** headless command

**Assertion:** `pnpm verify` (`node scripts/verify.mjs`) exits 0 on `ubuntu-24.04` and on `windows-2025`. That command is the regression gate. It opens no window and does not repeat the Module 0 headed launch. The Linux job stays a coupling check, not a desktop result. Module 0 is GREEN, and its checks stay on this gate. Module 1 is not approved, so this note names no second suite and adds no job. Tests from a later approved module stay on this same gate. No numeric threshold is added.

## Disagreement

**Row 7.** Functional Quality treats blocked as the whole result: a qualitative note must not be filed as if the behavior passed. Non-Functional Quality agrees there is no pass, no object count, and no millisecond budget, and does not treat the Module 0 hang guardrails as a frame budget. They disagree that the row should stay silent about a later session. The observation in row 7 is that disagreement. It is not a threshold and not a successful result.

**Rows 5 and 8.** No disagreement. Both roles keep cancel and the regression gate on a headless command. Non-Functional Quality adds no headed timing check for pointer release and no runner.

## Not in this note

No application code, tests, fixtures, or continuous-integration changes. No edits to Module 0 or Module 1 documents. Implementation stays unauthorized.

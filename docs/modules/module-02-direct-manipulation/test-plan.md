# Module 2 — Test Plan

**Status:** Proposed. Not approved. This plan does not authorize implementation.

**Owners:** Tech Lead draft for review by the Functional Quality Engineer and the Non-Functional Quality Engineer.

**Sources:** `specification.md` after the reconciliation dated 2026-10-06. The notes under `preparation/` are inputs. `preparation/reconciliation.md` is the decision where those notes disagreed. `preparation/workload.md` is the reference scene.

**Date:** 2026-10-06

## 1. How to read a row

Each scenario names the specification identifier it covers and one expected result. A row marked **Specified** is stable enough to implement after the Product Owner accepts the specification and authorizes implementation. This plan does not give that acceptance.

Archive section 9.3 is context. Its identifiers are not the identifiers in this plan. There is no save-and-reopen row. That archive acceptance criterion is out of this module.

No row has a second expected result.

## 2. Traceability

| Id | Scenario | Specification | State |
| --- | --- | --- | --- |
| TP-M2-F-001 | Ready surface and failed startup | M2-FR-001, M2-AC-006 | Specified |
| TP-M2-F-002 | Hit and select | M2-FR-002, M2-AC-001 | Specified |
| TP-M2-F-003 | Direct move, rotate, and scale | M2-FR-003, M2-FR-004, M2-FR-005, M2-AC-002 | Specified |
| TP-M2-F-004 | Face and axis targets | M2-FR-003, M2-FR-004, M2-FR-005 | Specified |
| TP-M2-F-005 | Commit after 4px | M2-FR-006, M2-AC-002 | Specified |
| TP-M2-F-006 | Cancel | M2-FR-006, M2-AC-004, M2-NFR-002 | Specified |
| TP-M2-F-007 | Undo, redo, and reselect | M2-FR-007, M2-AC-003, M2-NFR-003 | Specified |
| TP-M2-F-008 | Steps that do not exist | M2-FR-007 | Specified |
| TP-M2-F-009 | Keys | M2-FR-008 | Specified |
| TP-M2-F-010 | Document triples | M2-NFR-001, M2-AC-007 | Specified |
| TP-M2-F-011 | Rejected id and non-finite value | M2-AC-008, M2-NFR-002 | Specified |
| TP-M2-F-012 | View formula | Section 6 | Specified |
| TP-M2-F-013 | Child follows, drag writes one node | Section 6, M2-FR-003 | Specified |
| TP-M2-D-001 | Headed selection | M2-FR-009, M2-AC-001, M2-AC-005 | Specified, manual |
| TP-M2-N-001 | Headless suite | M2-NFR-008 | Specified |
| TP-M2-N-002 | Bounds | M2-NFR-006 | Specified |
| TP-M2-N-003 | Regression | M2-NFR-005 | Specified |
| TP-M2-N-004 | Reference observation | M2-NFR-004 | Specified, not a pass |
| TP-M2-S-001 | Input and logs | M2-NFR-002, M2-NFR-007 | Specified |
| TP-M2-O-001 | Verify workflow | M2-NFR-005, M2-NFR-006 | Specified |

## 3. Functional scenarios

### TP-M2-F-001 — Ready surface and failed startup

**Expected result:** `starting` keeps the foundation screen and does not show the surface. A failed startup shows the foundation screen and the Not ready state. A ready session shows the one surface in place of the foundation content root. With no nodes it shows "This scene has no objects." and no handle. With a node it does not show that sentence. The surface is not an HTML `canvas`. The window title stays the Module 0 title.

### TP-M2-F-002 — Hit and select

Build one rectangle and one box whose projections do not overlap on an 800 by 600 surface. Place the pointer on each projection and on empty space.

**Expected result:** `hitTest` returns that node's id on its projection and a miss on empty space. Down on an id selects it. A later down on the other id changes the selection. Up on a miss after 4 CSS pixels or less clears it. A drag that starts on a miss does not clear it. The scene bytes do not gain a selection field.

The closer face wins when projections overlap. If two hits tie on `z2`, the later node in the depth-first preorder of specification section 8 wins. An identity box at the origin reports its `-X`, `+Y`, and `+Z` faces toward the viewer. A node with no projected area is a miss, including inside the 4px band and including its handles.

### TP-M2-F-003 — Direct move, rotate, and scale

With no window, call `move`, `rotate`, and `scale` on a known id with a finite replacement triple.

**Expected result:** Each call changes only that triple. Extents, kind, parentage, and the other two triples stay. `-0` is stored as `0`. The scene a headless reader returns is the scene `writeScene` would persist. Each call that changes canonical triples is one undo step.

### TP-M2-F-004 — Face and axis targets

**Expected result:** A rectangle face drag replaces `position.x` and `position.y` and copies `position.z`. A box body drag past 4 CSS pixels does not change triples. A box axis handle replaces one position component. A rectangle ring adds degrees to `rotation.z` only. A box ring adds degrees only to that ring's rotation component. A scale handle replaces one scale component and can store `0` or a negative finite value. One gesture is one command. A handle hit shape does not intersect that node's face hit region.

### TP-M2-F-005 — Commit after 4px

**Expected result:** Movement of 4 CSS pixels or less from primary-button down writes no transform. Movement greater than 4 CSS pixels on a manipulation target begins a gesture. The scene still has the baseline while the gesture is active. Primary-button up, including outside the surface, commits the proposal through the Module 1 transform replacement and drops the gesture.

### TP-M2-F-006 — Cancel

**Expected result:** Escape, lost capture, platform pointer cancel, and blur each drop the proposal and leave the baseline in the scene. No undo step is added. A later pointer up does not commit. A non-finite proposal cancels the same way, does not throw, and does not write a partial triple. Escape with no gesture does not clear the selection.

### TP-M2-F-007 — Undo, redo, and reselect

Select node B. Commit a direct move on node A. Then undo, then redo.

**Expected result:** The selection is still B after the direct move. Undo restores A's baseline triples and selects A. Redo restores the committed triples and selects A. Only undo and redo select A. A second undo then redo returns those same canonical numbers. Pointer samples are not separate steps.

### TP-M2-F-008 — Steps that do not exist

**Expected result:** A selection change, a cancel, and a commit that leaves the canonical triples unchanged add no step. Undo on an empty stack changes nothing and shows no failure screen. A new commit clears redo. A caller-supplied scene replacement clears both stacks. Undo and redo call `replaceTransform` for a step id that is still in the held scene, and they do not throw `UNKNOWN_NODE`.

### TP-M2-F-009 — Keys

**Expected result:** With the surface focused and no gesture active, Ctrl+Z undoes on Windows and Linux, and Cmd+Z undoes on macOS. Ctrl+Shift+Z and Ctrl+Y both redo on Windows and Linux. Cmd+Shift+Z redoes on macOS. The resulting triples do not depend on which redo chord ran. The same keys during a gesture do not commit and do not undo.

### TP-M2-F-010 — Document triples

**Expected result:** After a committed move, `writeScene` then `readScene` returns the new position. The document has no selection, no gesture, and no undo stack. The provisional manifest writer is unchanged.

### TP-M2-F-011 — Rejected id and non-finite value

**Expected result:** A direct `move`, `rotate`, or `scale` with an unknown id throws `UNKNOWN_NODE`. The same commands with a non-finite component throw `NON_FINITE_NUMBER`, leave any active gesture in place, and do not change the scene. The message does not contain the id or the number.

### TP-M2-F-012 — View formula

On an 800 by 600 surface, map world `(0, 0, 0)` and world `(0, 1, 0)`.

**Expected result:** The origin is `(400, 300)`. `(0, 1, 0)` is `(400, 300 - 64 * cos(15°))`, within 0.01 CSS pixel. `devicePixelRatio` does not change either point.

### TP-M2-F-013 — Child follows, drag writes one node

Parent a box under a rectangle. Move the rectangle by a direct command. Then move the box by a direct command.

**Expected result:** The rectangle command changes the rectangle triples only. The child's stored triples stay unchanged, and its painted position follows the parent map in section 6. The box command changes the box triples only.

## 4. Design verification

### TP-M2-D-001 — Headed selection

**Expected result:** One recorded session on the primary Windows machine, in current Edge or current Chrome, shows an unselected node with a 1px border and a selected node with a 2px focus silhouette and handles. A primary click changes which node is selected, and the reviewer can see that change without a log. The session names the browser. It is not a browser matrix, and CI does not open the window.

This row is manual. The headless rows do not replace it.

## 5. Non-functional scenarios

### TP-M2-N-001 — Headless suite

**Expected result:** The functional rows other than the headed session run under `pnpm test` and do not start Vite or open a window.

### TP-M2-N-002 — Bounds

**Expected result:** The dependency set is unchanged. `editor` still does not import `rendering`, `ui`, React, or `platform`. The shell still does not import `rendering` or `core`. `renderNull` still reports `backend: null`, `device: "not-requested"`, and an empty draw list. The production build contains no HTML `canvas` element.

### TP-M2-N-003 — Regression

**Expected result:** `pnpm verify` exits 0 on `ubuntu-24.04` and on `windows-2025`.

### TP-M2-N-004 — Reference observation

Build the 64 rectangle and 64 box scene from `preparation/workload.md`. Commit one rectangle face drag.

**Expected result:** The record is `kind: observation` and includes the machine, the tool, the surface size when a window was opened, and the wall time in milliseconds. It has no pass threshold. It does not fail `pnpm verify`. Recording the observation is not a successful responsiveness result.

## 6. Security verification

### TP-M2-S-001 — Input and logs

**Expected result:** Rejected transform input leaves the previous scene. Diagnostics stay the Module 0 startup events. A test can see that the implementation has no log of a pointer path, a key sequence, an object id, or a transform value. No filesystem, network, clipboard, or GPU capability is added.

## 7. Operability

### TP-M2-O-001 — Verify workflow

**Expected result:** `.github/workflows/verify.yml` is unchanged. Permissions stay `contents: read`. Playwright is not added. The headed session stays outside CI.

## 8. What this plan does not test

- Save, reopen, and a user file.
- A millisecond budget.
- Pan, zoom, multi-select, snapping, creation, and deletion from the surface.
- A graphics API or a pick buffer.
- Module 1's document codec beyond the committed triples and the absence of a selection field.

## 9. Infrastructure

No new runner, fixture pipeline, or job. Automated tests, when implementation is authorized, use the existing `pnpm test` discovery. The headed record follows the Module 0 launch-evidence pattern.

## 10. Definition of Ready

This plan is the test approach for the specification's identifiers. It does not meet Definition of Ready by itself. Module 1 is not GREEN, the Product Owner has not accepted section 16 of the specification, and the Product Owner has not authorized implementation.

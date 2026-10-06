# Module 2 preparation — reconciled contract

**Role:** Tech Lead

**Status:** Preparation decision for issues #8, #40, and #41. Not Product Owner approval and not implementation authorization.

**Date:** 2026-10-06

## Why this record exists

The notes in this folder record the specialist positions. They disagree on four rows, and they leave the numeric frame, the first screen, and save-and-reopen as later choices. `docs/engineering/development-process.md` requires one observable meaning for each requirement. A technical disagreement is closed here. A user-visible row is given one proposed meaning in `../specification.md` so the Product Owner is asked to accept or return that meaning, not to pick from the notes.

Module 0 is GREEN at `5e99484`. Issue #1 is closed. The Product Owner approved pull request #50 at `13f1725750ba047eeed7df6f25fa7155d45cb9d5` as the Module 1 implementation contract on 2026-10-06. That approval is implementation authorization for Module 1 only. Module 1 is not GREEN, and pull request #50 is not on `main`. This record binds to that approved text. It does not edit it. Archive section 9.3 stays context.

The normative text is `../specification.md`. The test plan states the single expected result for each row. The workload note states the reference scene and states that Module 2 has no numeric responsiveness threshold. The notes in this folder stay the input record. They are not a second contract.

No ADR is added. ADR-0009 is the Module 1 package decision on pull request #50 and is not on `main`, so the next ADR number on `main` is not free to take. This module does not need a new import edge.

## Technical decisions

These rows are architecture, test strategy, or operability. They do not change the intended product outcome by themselves. The specification uses them as settled preparation decisions.

### Q-M2-T-001 — Hit testing

The hit test is a pure function in `@uvcp/editor`. It takes the surface size in CSS pixels, a pointer position in those pixels, and the scene. It returns one node id or a miss. It requests no device, opens no canvas, and does not read `devicePixelRatio`. Pointer events and the surface layout are already in CSS pixels. The null snapshot's physical pixel size stays a Module 0 test double.

This supersedes leaving CPU picking versus a pick buffer open for this module. A pick buffer needs a graphics API. ADR-0003 still selects none. `renderNull` stays unchanged. The Module 0 rendering record's deferral of the product graphics API remains that deferral. It is not a second hit-test method for Module 2.

### Q-M2-T-002 — Undo storage

One committed manipulation that changes a transform is one step in editor memory. The step holds the node id, the canonical triples from before the commit, and the canonical triples from after it. Undo writes the before triples back through the Module 1 transform replacement. Redo writes the after triples. Redo does not replay pointer samples. The stacks are not in the scene, not in the scene document, and not in the provisional manifest. They do not survive replacing the scene value, reload, or a new session.

This is the editor-memory shape from the architecture note. It meets the editor note's restore guarantee. ADR-0006 still selects no file undo strategy. No undo API is added to `@uvcp/platform`. A full-document snapshot and an event log stay unselected.

### Q-M2-T-003 — Imports and the surface

`editor` may import `core` and `persistence` only. It does not import `rendering`, `ui`, React, or `platform`. The shell does not import `rendering` or `core`. `renderNull` is not the viewport. The shell paints one surface from plain facts the editor publishes, and it updates that surface without putting the gesture in React state and without calling `setState` on pointer move. UI does not import `editor`.

No ADR amends the import table. A later module that makes `editor` call the renderer writes that ADR first. Module 2 does not call the renderer.

### Q-M2-T-004 — Dependencies and verification

No new runtime dependency. Hit testing, finite triples, and editor memory use the existing stack. `node scripts/verify.mjs` stays the gate on `ubuntu-24.04` and `windows-2025`. Playwright stays deferred. Headed evidence stays one recorded session on the primary Windows machine, naming current Edge or current Chrome. The preview smoke still rejects an HTML `canvas` element. The surface is not a `canvas`.

## Proposed product rows

Each row has one meaning in the specification. None of these meanings is accepted by this record. Accepting the specification is the Product Owner decision that accepts the rows together. Returning the specification names the row that fails.

### Q-M2-P-001 — Numeric frame and the fixed view

The proposed frame is the design recommendation: Y up, right-handed, intrinsic XYZ, degrees. The rectangle lies in its local XY plane. Positive Z comes toward the viewer in the unrotated view. The position triple is the center of the node. Rotation and scale are about that center. The picture is one fixed orthographic view: yaw +30° about world Y, then pitch +15° about world X, 64 CSS pixels per world unit, centered on the surface. There is no pan, orbit, zoom, or camera tool.

The editor and architecture notes refused to interpret triples until a contract named the frame. This contract names one frame so the picture and the stored numbers have one reading. It does not treat the recommendation as already accepted.

### Q-M2-P-002 — The ready screen

When startup is ready, the surface replaces the foundation content root. Starting and failed stay on the foundation screen. The window title and the foundation strings stay. The empty surface shows "This scene has no objects." and creates nothing.

### Q-M2-P-003 — What a drag moves

A rectangle moves by dragging its face. A box moves only by the axis handle under the pointer. A drag on the box body selects and does not move. One gesture produces one command: `move`, `rotate`, or `scale`. Handles for the selected object may be on screen together. There is no mode shelf.

The editor note left the pixel choice to design and allowed a body drag to produce `move`. The pixel choice is the design note. The one-command rule is the editor note.

### Q-M2-P-004 — Undo and selection

Undo and redo select the node whose triples that step restores. A selection change, a cancelled gesture, and a commit that does not change the canonical triples are not steps. The editor note left selection unchanged on undo. The outline is the only selection feedback, so the restored node is the selected node.

### Q-M2-P-005 — Redo chords

Redo is one command. On Windows and Linux, Ctrl+Shift+Z and Ctrl+Y both run it. On macOS, Cmd+Shift+Z runs it. Undo is Ctrl+Z, or Cmd+Z on macOS. The keys do nothing while a manipulation is active. The design note excluded Ctrl+Y. The editor note required it. The command result does not depend on which chord ran.

### Q-M2-P-006 — Save and reopen

Save and reopen of a manipulated transform is out of Module 2. ADR-0006 still defers the file writer. A test may round-trip the committed scene through the Module 1 codec in memory. That is not a Save command and not archive acceptance criterion M2-AC-005.

### Q-M2-P-007 — Manipulation threshold

A manipulation starts after the pointer has moved more than 4 CSS pixels from primary-button down on a move, rotate, or scale target. The editor note did not name the distance and did not contradict it. That distance is the editor `begin`.

## What this record does not do

It does not authorize implementation. It does not mark Module 2 ready for development. Module 1 is not GREEN. It does not add application code, tests, fixtures, dependencies, workflow edits, or an ADR.

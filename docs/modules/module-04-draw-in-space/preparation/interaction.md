**Status:** Preparation input for issue #64. Not a specification. Not an ADR. Implementation is not authorized.
**Role:** Senior Product Designer / UX Architect
**Date:** 2026-10-06

# Module 4 preparation — drawing interaction

Questions a later specification has to answer before a person can start a stroke, finish it, or change it. This file does not answer them. It does not design a screen, a tool, a cursor, or a control.

Archive section 9.5 states the objective: introduce the product-defining spatial drawing workflow by allowing users to create editable strokes and curves directly in the scene. That sentence is context. The archive identifiers in that section are not operational requirements. This note does not adopt them. Product overview section 5 is the same intent at product level: draw naturally, and the stroke becomes a native spatial object. The overview's path from that curve to a tube, a surface, or an extrusion is not this interaction and is not designed here.

The scene boundary is the Module 1 contract on `m1/reconcile-preparation`, `docs/modules/module-01-unified-scene/specification.md` (pull request #50). It is approved for implementation and is not GREEN. This note does not edit it. Kinds are `rectangle` and `box` only. There is no selection field, no viewport, no curve, and no undo. Transforms are finite triples that round-trip with no axis meaning. Extents are positive finite numbers on those two kinds.

Module 2 preparation on `main` does not approve a viewport, a gizmo, or an undo API. The four disagreements in `docs/modules/module-02-direct-manipulation/preparation/README.md` stay open. The numeric frame in that package stays open. This note does not close them and does not treat the design note's defaults as accepted.

Module 3 preparation does not approve a creation tool. Its product-design note does not put creation actions on the foundation screen and does not open a creation surface. A stroke is not that tool with a freehand mode.

ADR-0008: the foundation screen is not the editor layout. A later viewport writes its own decision. There is no selection, tool, panel, undo stack, or viewport-attach API. Frame ticks do not belong in React state. ADR-0006 selects no undo representation and adds no undo API. Architecture section 10: `editor` does not import `rendering` until a new ADR amends the import table. This file is not that ADR.

Principles that keep the questions honest, without settling a workflow: P-01, one scene, not a drawing editor beside a shape editor. P-03, a mark the user can see, not a form of coordinates first. P-04, the drawn source stays editable. P-02 and P-06, the first mark does not require the advanced controls. None of these choose the gesture.

## What is blocked

A person cannot draw in this build. A later specification cannot demonstrate drawing while the blocks below stand. This note does not remove them.

### No viewport

The only screen is the foundation screen. Its purpose says creation tools are not part of this build. Drawing does not go on that screen. It does not add a canvas, a grid, a pen cursor, a stroke, or an empty slot for one. A later module replaces the content root. It does not inherit a frame of slots. That replacement is not designed here.

Module 2's design note recommends one surface, a fixed orthographic picture, and no pan, orbit, or zoom. That recommendation is not accepted. It is not a drawing surface. Whether a stroke would be drawn on that same surface, if a surface is ever accepted, changes the workflow: one picture for shapes and strokes, or a second place to draw. Leave that open. Do not draw either picture.

There is no host element, no camera, and no hit test. The null renderer records an empty draw list and does not pick. A pointer sample has no view to land in. Mapping that sample to a stored point needs a view and a frame. Neither is accepted. This note does not extend `renderNull` and does not choose WebGPU, WebGL2, or a native surface.

### No selection API

Module 1 puts no selection on the scene, none in the document, and none on the editor session. The document reader rejects a `selection` key. Module 2 recommends selection by node id and does not accept it. There is no API to select the stroke just drawn, to choose which stroke is edited, or to clear a selection by clicking empty space.

Those three sentences are user-visible, and each one is blocked. They also sit on open Module 2 disagreements, below. This note does not add a selection field to get past the block.

### No curve object

A stroke is not a `rectangle` and not a `box`. It must not be stored as either, and not as a chain of either. Module 1 rejects an unknown kind. There is no control-point field, no stroke width, and no appearance field on those nodes. `replaceTransform` and `replaceExtents` keep the kind. They are not a curve edit.

Completion cannot insert a curve. An edit cannot update a curve source. Coexistence with the rectangle and the box is the product intent and is not something this build can show. Module 1 is not GREEN. This note does not add a kind, a document field, or a codec. Issues #66 and #68 are the preparation issues for curve and scene-value constraints. This file does not write them.

### No undo API

No undo command exists. Module 2 recommends one committed manipulation as one step, in editor memory, not surviving reload, and adds no API. ADR-0006 still has no representation: not inverse patches, not snapshots, and not an event log. A stroke's history is not that recommendation promoted into an API.

Whether the history step is the whole stroke, one control edit, or one sample changes what undo means to the user. Leave it open. There is no user-facing save, so survival of a stroke across reopen is not a drawing command either.

## The Module 2 frame and the selection disagreements

These stay open. Drawing makes them sharper. It does not vote.

### Numeric frame

Module 2 question 8 is not accepted. The open choice is the meaning of the stored triples: up axis (Y or Z), handedness, rotation order (or a replacement of the triple), and degrees or radians. The design note's default — Y up, right-handed, intrinsic XYZ, degrees — is not accepted. The editor note will not interpret a triple as a rotation until a frame is accepted. Module 1 stores the numbers and does not assert an axis. Architecture still defers the convention.

A stroke is the same class of decision. A pointer moves in two dimensions on a screen. A spatial stroke is numbers in the scene. Without a frame, those numbers are not "up," not "depth," and not "the rectangle's plane."

Workflows that must not be collapsed into one while the frame is open:

- The stroke lies in one plane the frame defines.
- The stroke lies in the view plane. That needs a view. Module 2's fixed three-quarter picture is not accepted. Pan, orbit, and zoom are not approved, so "the view" is not a camera the user can move.
- The stroke lies on the face under the pointer. That needs a hit and a plane for that face. A rectangle has no depth. A box has a positive depth extent. Neither names an up axis.
- The stroke is free in depth, using a modifier, a second axis, or pressure. That is a different gesture from a drag.

**Recommendation, not accepted.** Rectangle, box, and any later stroke share one scene frame. Drawing does not invent a second axis set. This does not accept the Module 2 default, and it does not say which plane a stroke uses.

Until a frame is accepted, a specification must not show a stroke, must not foreshorten one, and must not tell a test that a screen drag changed a particular axis.

### Disagreement 1 — what a drag on a body means

The design note moves a box only by the axis handle under the pointer, and moves a rectangle by dragging its face. The editor note allows a body drag to produce move. The combined affordance is not the dissent. The box body is. The gizmo is not approved.

A stroke has no face and no approved handles. "Drag the stroke" might move the whole object, reshape it, or continue it. That is a new product choice of the same kind. It must not be settled by copying either Module 2 side. This note does not draw handles on a stroke and does not choose body-drag.

### Disagreement 2 — undo and selection

The design note reselects the affected node on undo and on redo. The editor note does not change selection on undo or redo.

If a stroke can later be selected, undo of creating it or of editing it inherits this split. This note does not pick a side.

A separate choice, also open and also blocked: does finishing a stroke select it? If it does, the next gesture is aimed at that stroke. If it does not, the next gesture can start another stroke. That changes the workflow. It is not disagreement 2, and it is not decided by closing disagreement 2.

### Disagreement 3 — redo shortcut

The design note uses Ctrl+Shift+Z and Cmd+Shift+Z, and does not also use Ctrl+Y. The editor note uses Ctrl+Y and Shift+Z.

Drawing does not add a chord and does not pick one. A later specification uses whichever chord is accepted for the manipulation history, if stroke history is that history. If the chord is still open, it stays open here. Whether stroke history is even the same stack is open under "No undo API."

### Disagreement 4 — hit-test method

The Tech Lead recommends a later pure CPU test that returns an id or a miss, without a device. The Module 0 rendering record still treats CPU picking versus a pick buffer as deferred. Module 2 does not close that.

Starting a stroke on empty space, starting one on a rectangle or a box, picking one stroke among several, and picking a control on a stroke all need a hit result. "Closer to the viewer" is only in the design note, is not accepted, and needs the frame before "closer" means anything. This note does not choose a pick method.

The design note's 4px movement before a manipulation starts is not a drawing rule. The editor note does not name it. Whether a stroke starts at pointer down or only after movement is its own question. It changes a tap: a dot, a selection change, or nothing. Leave it open. It does not close the 4px note.

## How a stroke starts

Blocked by the missing viewport, the missing hit rule, and the missing frame. The questions below are what a specification still has to answer. None of the answers is accepted.

1. Which event starts the gesture: primary-button down, pen contact, a drag that has already moved, or a second action after something else is chosen?
2. Is drawing what empty space does, or is it a mode of its own? Module 2's design note, not accepted, says a drag on empty space does not create an object and does not draw a marquee, and that pointer-up on empty space clears selection. Drawing on that same empty space would contradict that note. Do not adopt either behavior. The specification has to say what empty space does, and it cannot say that until a surface and a selection rule exist.
3. Is there a draw affordance distinct from move, rotate, and scale? Module 2's design note recommends no mode shelf for manipulation. That recommendation is not accepted. A distinct draw tool is a mode, and a mode changes the first gesture. This note designs no shelf, no toolbar, and no icon. The mode question stays open.
4. What is under the pointer: empty space, a rectangle, a box, or a stroke that already exists? On an object, the gesture might select, manipulate, or draw. That is disagreement 1, still open. A stroke-start rule must not close it.
5. Does the new stroke become a child of the object under the pointer, a child of the current selection, or a root? Parentage is user-visible if the parent moves. Module 1 can parent a rectangle and a box to each other. It cannot parent a curve. Leave the workflow open. Do not add a hierarchy panel to answer it.
6. Which devices count? Mouse, pen, and touch are different if pressure or tilt changes the path or the width. Module 2 left touch out of manipulation. That exclusion is not accepted for drawing. **Recommendation, not accepted:** if a stroke is ever authorized, a mouse-only drag has to be able to complete one. A pressure pen is not required for the first mark. Pressure as an optional effect stays open.
7. The foundation screen is not a place a stroke can start. No status sentence changes to announce drawing. Startup stays `starting`, `ready`, or `failed`.

**Recommendation, not accepted.** While the pointer is down, the in-progress mark is not a rectangle, not a box, and not a second document beside the scene. This does not choose editor memory versus a scene write. That storage choice is the editing seam, not a screen. What the user sees during the gesture is still open: raw samples, a simplified line, or a fitted curve. Smoothing that leaves the pointer is user-visible. No tolerance is set here. A non-finite sample cannot become a stored number under the Module 0 finite-number rule. Whether that sample is dropped or the whole gesture cancels is open. It does not become a foundation-screen failure.

## How a stroke is completed

Blocked by the missing curve kind. There is no object to finish into.

1. Which event completes it: pointer up, pen lift, another click, Enter, or an explicit confirm? A drag-and-release stroke and a click-to-place polyline are different workflows. Archive context mentions freehand input. That is not a requirement. Both stay open.
2. Is the result a new object in the same hierarchy as the rectangle and the box, or a continuation of a stroke that already exists? New versus continue changes the next edit. P-01 forbids a separate drawing document. It does not choose new versus continue.
3. What is the smallest completion: discard a tap, keep one point, or require a segment? Open. The Module 2 4px note is not the answer.
4. May the stroke close on itself? An open stroke and a closed one are edited differently. Open. No close-path control is designed.
5. Does completion select the new object? Open. Blocked on selection. Related to disagreement 2, and not settled by it.
6. Does completion add one history step? Open. Blocked on undo. A gesture that is cancelled has to be distinguishable from one that completed: the user can tell whether a new object exists. **Recommendation, not accepted:** cancel leaves the scene without a new object and adds no history step. Module 2 recommends that shape for a transform and has not accepted it. Copying the sentence here does not accept it for a stroke, and it does not add an API.
7. What width and appearance does the completed stroke have, and does the user choose them before the mark or after? A dialog before the first mark is a different workflow from a mark that appears immediately. There is no material system and no stroke color role. Foundation color roles belong to the foundation screen. **Recommendation, not accepted:** the first completed stroke, if one is ever authorized, does not wait on a style dialog. Width and later appearance edits stay open. This recommendation does not assign a color, a width, or a token.
8. Several strokes in one scene with the rectangle and the box is the coexistence the archive objective points at. How they are told apart is blocked without a viewport. No labels, no second view, and no 2D layer beside a 3D layer are designed here.

Save, close, and reopen of a completed stroke are not drawing commands. Module 2 leaves save-and-reopen to a file writer it does not approve. ADR-0006 still defers who writes the file. This note does not add New, Open, Save, or Export, including as disabled chrome.

## How a stroke is edited

Editing means what the user does to a stroke that already exists. How that change is stored is the stroke editing seam (issue #65), not this file. The questions are the visible workflow. They are blocked: no viewport to grab a control, no selection to know which stroke, no curve source to change. A headless number replacement would not be this workflow. This note does not specify that command.

1. Does the user edit the shared transform (position, rotation, and scale, the triples every Module 1 node stores), the stroke's own source, or both? Transform only means the shape cannot change. Source only means the stroke does not move the way a rectangle moves. Both needs two gestures the user can tell apart. That choice changes the workflow. Leave it open. Archive text that describes both editable source and transform participation is context, not a requirement.
2. If both exist, which target reshapes and which moves the whole object? Options, none accepted: drag the body, drag a control, handles only, or a mode. This is disagreement 1 on an object that has no face. Do not inherit either Module 2 side. Do not draw the handles. The gizmo stays unapproved.
3. Which source edits are in the later scope: move a control, insert one, delete one, change width along the stroke, continue from an end, trim, or redraw a span? Each is a workflow. The specification has to name the set. This note does not. Sculpting, a full vector suite, automatic cleanup, and solid modeling are archive context, not an accepted exclusion list. Tube, surface, and extrusion are the overview's derived step, not the first edit.
4. **Recommendation, not accepted.** The first edit keeps the stroke as the thing that was drawn. It does not replace that stroke with a mesh or with other derived geometry. P-04. Not a data model, and not a ban the Product Owner has accepted.
5. Does a reshape keep the same object the user already had, or delete it and insert a lookalike? The difference shows up in undo, in any later selection, and in parentage. **Recommendation, not accepted:** a reshape keeps one identity. Module 1 ids are caller-supplied and survive `replaceTransform`. There is no curve id. This recommendation does not create one.
6. Does the edit meet the visible stroke directly, or does it start in a numeric field? P-03 prefers the visible result. Module 2 left numeric fields out of manipulation. That exclusion is not accepted for drawing. A field would change the workflow. Leave it open. No inspector is designed.
7. How does width or other appearance change after completion: a direct drag, or a control this note does not design? Open. No new color role.
8. Which stroke is edited when strokes overlap, or when a stroke overlaps a rectangle or a box? Blocked on selection, on disagreement 4, and on the frame.
9. Can an in-progress edit be cancelled back to the stroke as it was at pointer down, and does Escape do that only while the edit is active? Module 2 recommends that for transforms and has not accepted it. The same question for a control drag stays open. It does not close the Module 2 cancel rule. Idle Escape clearing a selection is a different choice and is also open.
10. Undo granularity: one step for the whole stroke, one step for one control gesture, or one step per sample. Module 2 recommends that samples are not steps. That recommendation is not accepted and is not an API. A drawing specification has to choose in the open. It must not close Module 2's choice. A commit that changes nothing is the same open question: Module 2 would add no step, and has not accepted that.
11. If a stroke can be removed, is that a user-facing action at all? Module 1 deletes by id and has no delete control. A Delete key or a button would be new, and it needs a selection rule this build does not have. Leave it open. Do not add the control.

Disagreement 3 still governs any redo chord. No drawing-only shortcut is added.

## What stays outside this note

- A finished screen, layout, empty state, toolbar, icon, cursor, or component. No UI files.
- An accepted viewport, gizmo, numeric frame, selection rule, hit-test method, redo chord, or undo API.
- A curve kind, a scene field, a document field, or a codec.
- A tool enum, a mode shelf, or a command.
- A width value, a stroke color, a material, or a light.
- Snapping, constraints, symmetry, a smoothing algorithm, or a tolerance.
- Pan, orbit, zoom, and a camera.
- A hierarchy panel, an inspector, and numeric fields.
- Save and reopen.
- Module 3's creation surface. This note does not start it.
- Code, tests, dependencies, workflows, and an ADR.

Sibling preparation, not written here: issue #65 the editing seam, #66 spatial curve constraints, #67 architecture constraints, #68 scene value constraints, #69 evidence, #70 workload, #71 trust boundary, and #72 verification environment.

The Product Owner has not been asked to pick a workflow. The choices above change what the user does. They stay open until a specification is actually written. Nothing in this file authorizes implementation. Module 4 stays in preparation.

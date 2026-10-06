**Status:** Preparation input for issue #35. Not a specification. Not Product Owner approval. Implementation stays unauthorized.
**Role:** Senior Product Designer / UX Architect
**Date:** 2026-10-06

# Module 2 preparation — interaction

Recommendations for a later specification. Not decisions. Archive section 9.3 is context only; its identifiers are not requirements. Pull request #33 is not approved. Where this note says rectangle and box, it means that proposal's flat primitive and depth primitive. The rule that matters is flat versus depth.

The Module 0 foundation screen has no viewport, toolbar, hierarchy, or canvas. ADR-0008: that screen is not the editor layout, a later viewport writes its own decision, and frame ticks do not belong in React state. This note is the product behavior, not an API, a host element, or a graphics backend. WebGPU, a desktop host, and a gesture library stay undecided.

P-01: one surface for both kinds. P-02: a flat object does not wear depth handles. P-03: drag the object, not a coordinate field. P-04: a committed edit can be undone; dimensions stay put. P-05: depth is more handles on the same object, not a second editor. P-06: no mode shelf.

## 1. First viewport

**Recommendation.** One surface that shows the in-scope objects and takes pointer manipulation. It replaces the foundation content root. It is not a canvas beside the foundation column, and it leaves no empty slots for a toolbar, hierarchy, inspector, or timeline. Foundation strings and the window title stay as they are.

Empty scene: the surface is the content. Background is `color.canvas`. One sentence, existing body type, start-aligned and top-weighted: "This scene has no objects." No button, grid, drop target, gizmo, or sample shape. A click has nothing to select and does not create an object. This is not Starting, Ready, or Not ready. A failed startup stays on the foundation screen.

One rectangle and one box: both in that same surface. No second view and no labels. The rectangle is a flat face (`color.surface` fill, `color.border` stroke). The box is a volume using the same fill and stroke on its edges, not a material and not a light. The empty-state sentence is gone. Nothing in the view creates objects.

After question 8 is accepted, the view is one fixed orthographic picture. No pan, orbit, zoom, or camera tool. Recommended orientation, not accepted: Y up, X to the right, about 30° yaw and 15° pitch so the box shows more than one face. Until question 8 is accepted, do not draw a rotation or that foreshortened view as if a frame had been chosen.

**Product Owner.** Still has to accept this before a Module 2 specification can be single-valued. It replaces the confirmed foundation screen.

## 2. Selection

**Recommendation.** The pointer resolves a hit to a node id, then selects that id. Usable if the approved rule is selection by node id, and usable with no hierarchy panel.

- Primary click on a visible object selects that id. If several overlap, the one drawn closer to the viewer wins. A parent is not preferred over a child. No marquee, multi-select, or cycle.
- The rectangle is hit on its face. The box is hit on its faces. Add 4px of slop. A node with no visible area is not a pointer target; it can stay selected if that id was already selected.
- Pointer down on an object selects it immediately, so a drag that then passes the threshold in question 4 manipulates that object.
- Pointer up on empty space, without passing that threshold, clears the selection. Objects stay. A drag that starts on empty space does not clear selection and does not draw a marquee.
- The selected id and the outline in question 6 are the same fact. No panel is required to select or to see the selection.

The manipulation writes the selected node's own position, rotation, and scale. It does not write width, height, or depth, and it does not add a second transform. If the approved scene composes children under a parent, the picture follows that composition; the drag still writes only the selected node.

**Product Owner.** Still has to accept this before a Module 2 specification can be single-valued. Module 1 has not approved a selection rule, and clear-on-empty-space is user-facing.

## 3. Move, rotate, and scale

**Recommendation.** One combined affordance on the selection. Not exclusive modes, and not a tool shelf. No mode keys. Handles show only while that object is selected. During a gesture, other handles are not hittable.

Flat rectangle:

- Move: drag the face. The two position components in its plane change. The other position component, rotation, and scale do not.
- Rotate: one ring outside the face, in that plane, about the node origin. That one rotation component changes.
- Scale: one handle per in-plane axis, about the node origin. Those scale components change. The remaining scale component does not.

Box:

- Move: three axis arrows. The arrow under the pointer changes that one position component. No free drag of the body.
- Rotate: three rings, one per axis, about the node origin. The ring under the pointer changes that one rotation component.
- Scale: three axis handles, about the node origin. The handle changes that one scale component.

Which stored component is "in plane" or "that axis" waits on question 8. Negative and zero scale stay allowed when the scene allows those numbers. No numeric fields.

**Product Owner.** Still has to accept this before a Module 2 specification can be single-valued. Flat versus depth handles, and scale writing scale rather than dimensions, are product meaning.

## 4. Commit and cancel

**Recommendation.** A manipulation starts when the pointer has moved more than 4px from primary-button down on a move, rotate, or scale target. The baseline is the position, rotation, and scale at that start.

- Commit on primary-button up after the start, including outside the surface. The stored triples are that gesture's result at release, not a partial sample left behind. Use the Module 0 finite-number rule: `-0` becomes `0`. A non-finite sample does not commit; it cancels to the baseline. Selection is unchanged.
- Cancel on Escape during the manipulation, or when the pointer ends without a commit (platform cancel, lost capture, or the window blurring). All three triples return to the baseline. Not the last sample. Selection is unchanged. No undo step is added.
- Release before 4px changes no transform. On empty space that release clears selection. On an object it leaves the selection made at pointer down.
- Escape with nothing in progress changes no transform and does not clear selection.
- A commit whose triples equal the baseline adds no undo step.

A later test can record the nine components, move, press Escape, and read those nine again. A second test can release, read the change, then undo back to the nine.

**Product Owner.** Still has to accept this before a Module 2 specification can be single-valued. Cancel has to leave one observable result.

## 5. Keyboard and mouse basics

**Recommendation.** The set is:

- Primary button: select, and the drags in question 3.
- Escape: cancel the active manipulation only.
- Undo: Ctrl+Z on Windows and Linux, Cmd+Z on macOS.
- Redo: Ctrl+Shift+Z on Windows and Linux, Cmd+Shift+Z on macOS. Not also Ctrl+Y.
- The viewport is one tab stop so those keys work when it is focused. Handles are not tab stops. Keyboard focus is visible against `color.canvas` and is not the selection outline.

No keyboard-only way to start a move. Out of this module: touch-first input, snapping, constraints, modifier locks, nudging, the wheel, view navigation, animation keys, and mode keys. Right button and middle button do nothing.

**Product Owner.** Still has to accept this key set before a Module 2 specification can be single-valued. Undo and redo are user-visible commands.

## 6. Selection feedback

**Recommendation.** No materials, no lights, and no new color role.

- Unselected: 1px `color.border` on the rectangle outline and on the box edges. Fill stays `color.surface`. The box reads from its edges, not from shading.
- Selected: same fill, a 2px silhouette in `color.focus`, plus that object's handles. Weight and handles are the cues that are not color. The fill does not change. No pulse and no glow.
- Nothing selected: no focus outline and no handles.
- The outlined object is the selected node id.

Light and dark reuse the foundation roles. No in-app theme switch.

**Product Owner.** Still has to accept this before a Module 2 specification can be single-valued, so that specification does not open a color system. The roles themselves stay the ones already accepted for Module 0.

## 7. Undo granularity

**Recommendation.** One undo step is one committed manipulation that changed at least one component on one node. Samples inside the gesture are not steps. Selection changes, cancelled gestures, and no-op commits are not steps.

Undo restores that node's three triples to the baseline and selects that node. Redo restores the committed triples and selects that node. A new committed step clears redo. Undo on an empty stack changes nothing and does not show a failure screen.

The undo stack does not survive save, reload, or a new session. Once a writer exists, the committed transform is what survives reload. ADR-0006 selected no undo representation. Inverse patches, snapshots, and an event log stay with the architecture note. This note does not choose one.

**Product Owner.** Still has to accept this before a Module 2 specification can be single-valued. Whether history survives save and reopen is still deferred.

## 8. Numeric frame

**Recommendation, not an accepted frame.** The viewport cannot show a rotation, or the three-quarter view in question 1, until the Product Owner chooses. The choice is the meaning of the stored triples, not a new transform type.

- Up axis: Y up, or Z up.
- Handedness: right-handed, or left-handed.
- Rotation order, for the three stored rotation numbers: intrinsic XYZ, XZY, YXZ, YZX, ZXY, or ZYX, or the extrinsic form of those six. A quaternion or an axis-angle would replace the triple. Not recommended.
- Unit of those three numbers: degrees, or radians. Storing radians and showing degrees is not recommended. This module has no numeric readout, so a second unit would be invisible and a test would disagree with the picture.

Recommended default: Y up, right-handed, intrinsic XYZ (X, then Y, then Z on the rotating axes), degrees. The rectangle's plane is the upright plane of that frame. A quarter turn is 90. With X to the right and Y up, right-handed depth comes toward the viewer. This does not decide the rectangle's stored axis names; the scene contract does. Do not guess a frame in order to draw early.

**Product Owner.** Still has to accept this before a Module 2 specification can be single-valued. It is a Product Owner decision. The default is not accepted.

## 9. Save after manipulation

**Recommendation.** Save-and-reopen of the manipulated transform waits for a file writer. It is not a Module 2 command. This note does not assign that writer to a named later module and does not invent a format, extension, or container.

Module 2 ends at the committed transform on the object. A writer would not store the in-progress gesture or the undo stack. If an approved codec already round-trips the triples in memory, a test may use that. That is not a Save command and not a file.

**Product Owner.** Still has to accept this before a Module 2 specification can be single-valued. Roadmap context includes save and reopen. This recommendation is what keeps that outcome out of Module 2.

## Editor engineer check

The recommendation I expect the Senior 2D / Editor Engineer to challenge is question 3: one combined affordance, with no exclusive Move, Rotate, and Scale modes; the rectangle moves by dragging its face; the box moves, rotates, and scales only by the handle for one axis.

Why that role would challenge it: the handles overlap, and 4px of slop makes that worse on a small rectangle. A fixed three-quarter view makes a face drag disagree with a single stored axis. Exclusive modes give pointer capture one target and give a test one operation. A parallel note may instead recommend modes, or the same body drag on both kinds.

This note does not record that role's concurrence. Neither default is accepted. The specification gate weighs both.

## Left outside this note

Touch-first interaction, snapping, constraints, animation editing, creation tools, a hierarchy panel, materials, lights, a general color system, numeric transform fields, and multi-select. No application code, test, fixture, dependency, or ADR is authorized by this file.

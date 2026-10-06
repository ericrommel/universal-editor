**Status:** Preparation input. Not a specification. Not Product Owner approval. Implementation stays unauthorized.
**Role:** Senior 2D / Editor Engineer
**Date:** 2026-10-06

# Module 2 direct manipulation — editor note

Module 0 stands. The foundation screen has no viewport, no canvas, no mount effect, and no frame probe. Editor session state is only `starting`, `ready`, and `failed`. This note does not add fields or imports. ADR-0008 still holds: a later viewport writes its own decision, and frame ticks do not live in React state. `editor` still must not import React, `ui`, `rendering`, or `platform`. Calling the renderer still needs a new ADR that amends the architecture import table. This note is not that ADR.

Archive section 9.3 is context only. Its identifiers are not used. Pull request #33 is not approved. It proposes a headless scene, selection by one id, three finite triples, no viewport, and no undo. This note does not adopt it. The defaults below do not require it.

The product designer is writing the visible interaction separately. This note is the editing model for the same questions.

## 1. Gesture state and the committed transform

**Default:** the drag lives in the editor session. The document changes only on commit. React does not own either one.

While the pointer is down, the editor holds one gesture: the object id, the command (`move`, `rotate`, or `scale`), the three finite triples at pointer-down, and the proposed three triples. That record is not React state, not a component ref, not a mount effect, not a scene field, and not a renderer object. Pointer-move replaces the proposal only. It does not write the document and it does not call `setState`.

Pointer-up commits by replacing the object's three finite triples with the proposal, then drops the gesture. The proposal does not survive the gesture, so it cannot become a second transform.

Chrome may be given plain values after commit or cancel. It is not given pointer samples.

## 2. Selection

**Default:** one selection, either one object id or none. Selection by pointer and selection by id write that same value.

A headless test selects by id and clears by command. A later viewport is only an adapter: a hit calls select with the id from section 6, and a miss calls clear. An empty click clears the selection. It does not start a gesture and it is not an undo step. Clicking the selected object does not create a second selection.

There is no React copy and no viewport copy. This note does not decide whether an approved document stores the id. If one later does, the editor uses that field and does not keep another. Selecting and clearing are not history steps.

## 3. Move, rotate, and scale

**Default:** `move`, `rotate`, and `scale` are editor commands a headless test can call. The viewport is an adapter that produces those commands. It does not write triples itself.

Each command names an object id and one replacement finite triple. The other two triples stay as they were. A direct call commits immediately and is one undo step. A drag is begin, then updates that change only the proposal, then one commit. Tests call either path without a window.

Which pixels produce which command is the designer's choice. The editor's rule is that one pointer sequence produces one command. A body drag may produce `move`. A handle may produce `rotate` or `scale`. No pixel produces two.

**Default for handles:** a flat object exposes fewer handles. Flat means two-axis move, one-axis rotate, and two-axis scale. A spatial object may expose three axes for each. Both use the same three commands. A hidden component is not deleted from the stored triples; that gesture copies it from the start triple. The editor does not infer which component is hidden. That waits on section 7. Until then, the caller supplies the replacement triple.

## 4. Cancel and commit

**Default:** Escape and pointer cancel restore the transform from gesture start. Commit is pointer-up.

Cancel drops the proposal. The document still has the start triples, because the gesture has not written them. Drawing returns to those triples. Cancel records no undo step. Pointer-up after cancel does not commit. Pointer-up while the gesture is still active commits, including when the pointer is no longer over the object.

## 5. Undo

**Default, and the user-visible rule:** one committed gesture is one undo step. Undo restores the finite triples from the start of that step. Redo restores the triples that step committed. The undo stack does not survive reload.

Pointer moves are not steps. Cancel is not a step. A commit that leaves the triples unchanged is not a step. A direct command is one step, the same as a gesture. Undo and redo do not change selection and do not replay the pointer path. Reload, restart, and opening the document again drop the stack. The document keeps the last committed triples and no history.

This note does not choose inverse patches, snapshots, or an event log. ADR-0006 left that strategy unselected. What the editor needs history to guarantee:

- the step has an identity: one committed `move`, `rotate`, or `scale` on one object, in order with the other steps;
- undo restores that object's previous finite triples;
- redo restores the finite triples that same step committed;
- undo then redo returns those committed triples after the Module 0 finite-number rule (`-0` becomes `0`).

## 6. Hit testing

**Default:** the editor needs one result from a later hit test: the object id under the pointer, or a miss.

The Module 0 null renderer cannot produce that result. Its draw list is empty, it has no scene, and it does not hit-test. `editor` must not import `rendering` to ask it. This note stops there. It does not choose a pick method, a camera, or a draw item.

## 7. Numeric frame

**Default:** the numeric frame stays a Product Owner decision. Until it exists, editor commands may replace finite triples and must not interpret them as a geometric rotation.

Up axis, handedness, rotation order, and degrees versus radians are not guessed. Commands do not turn a triple into an angle, a matrix, or a quaternion. Non-finite input changes nothing. The Module 0 finite-triple rule is the numeric rule. No vector type is added.

## 8. Keyboard

**Default:** Escape cancels the active gesture. Ctrl+Z / Ctrl+Y, or the platform undo and redo keys, undo and redo committed steps. Nothing else.

Escape with no active gesture does nothing. It does not clear selection. Undo is Ctrl+Z, and Command+Z on macOS. Redo is Ctrl+Y, and also Ctrl+Shift+Z or Command+Shift+Z. Those keys apply only when no gesture is active. During a gesture they do not commit and do not undo.

No nudge. No snap. No touch gesture set.

## 9. Out of scope for the first manipulation module

**Default:** leave these out, including the usual gizmo extras.

- Numeric entry, scrubbing, and a live number readout owned by React.
- Pivot or center editing.
- Multi-select and box-select.
- Snap, guides, constraints, and parent space versus local space.
- A gizmo stored as a scene object.
- Touch, pen-only gestures, and animation.

## Visible feedback

A combined gizmo is acceptable as drawing. Handles for move, rotate, and scale may be on screen together. One gesture still produces one command.

Without a material system, the editor can expose plain facts: the selected id or none, whether a gesture is active, and the proposed triples beside the committed triples. A later viewport may draw a selection mark and handles from those facts. The marks follow the proposal during the gesture and the committed triples otherwise. They are not scene nodes and not materials. Chrome may show text after commit or cancel, as plain values from the shell. `ui` still does not import `editor`.

Refused, because it puts interaction state in React or invents a second transform:

- Pointer-move `setState`, including a live numeric readout in React.
- Frame ticks in React state, or a return of the rejected Module 0 host, mount effect, or frame probe.
- A preview transform stored on the object, in the viewport, or in a component after the gesture ends.
- Selection or hover as a material, tint, or shader.
- Using the foundation screen as the editor layout.

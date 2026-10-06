# Module 2 — Direct Manipulation

**Status:** Proposed. Not approved. The Product Owner has not accepted the user-visible rows in section 16. This specification does not authorize implementation.

The preparation decision is `preparation/reconciliation.md`. This file is the normative contract. The test plan is `test-plan.md`. The reference scene is `preparation/workload.md`.

Module 0 is GREEN. The Module 1 implementation contract is pull request #50 at `13f1725750ba047eeed7df6f25fa7155d45cb9d5`, approved by the Product Owner on 2026-10-06. That approval does not make Module 1 GREEN. Module 2 implementation waits until Module 1 is GREEN and the Product Owner authorizes Module 2.

## 1. Objective

Make the unified scene directly editable through viewport interaction, while the committed position, rotation, and scale remain the Module 1 transform on the same node.

## 2. Required context

Before implementing this module, read:

- `/docs/product-overview.md`
- `/docs/engineering/development-process.md`
- `/docs/engineering/architecture.md`
- `/docs/engineering/adr/0002-react-for-editor-chrome.md`
- `/docs/engineering/adr/0003-render-snapshot-and-webgpu-direction.md`
- `/docs/engineering/adr/0006-domain-persistence-and-undo-direction.md`
- `/docs/engineering/adr/0008-editor-state-and-shell-content.md`
- `/docs/modules/module-00-foundation/specification.md`
- the Module 1 specification approved in pull request #50
- `/docs/modules/module-02-direct-manipulation/preparation/reconciliation.md`
- `/docs/modules/module-02-direct-manipulation/test-plan.md`
- `/docs/modules/module-02-direct-manipulation/preparation/workload.md`

Archive section 9.3 states the same objective and is context only. A requirement in this file is defined by its text here. The same number in that archive section is not this requirement. Where this specification is narrower than that archive section, the difference is in section 4.

## 3. Scope

This specification includes:

- one surface for rectangle and box nodes when startup is ready;
- selection of one node id in editor memory;
- a pure hit test that returns that id or a miss;
- move, rotate, and scale of the selected node's Module 1 transform;
- commit, cancel, undo, and redo of those triples;
- keyboard chords for cancel, undo, and redo;
- selection feedback that uses the existing foundation color roles;
- headless commands a test can call without a window;
- one headed record of the visible selection;
- the reference-scene observation in the workload note.

## 4. Out of scope

- A user-facing save, a file writer, a file extension, and reopen. Archive section 9.3 includes that acceptance criterion. This module ends at the committed transform. ADR-0006 is unchanged.
- Persisting selection or the undo stacks. The scene document still rejects a `selection` key with `INVALID_SHAPE`.
- Pan, orbit, zoom, a camera tool, and more than one view.
- A toolbar, hierarchy panel, inspector, timeline, numeric fields, and a mode shelf.
- Multi-select, marquee, cycling hits, snapping, constraints, nudging, modifier locks, and the wheel.
- Touch-first input, pen-only gestures, and animation editing.
- Creating or deleting nodes from the surface. A click on empty space does not insert a node.
- Pivot editing. The center rule in section 6 is the reading of the existing position triple. No pivot field is added.
- Materials, lights, a new color role, and a theme switch.
- A graphics API, a pick buffer, an HTML `canvas`, a GPU device, and any change to `renderNull`.
- A new runtime dependency, a new diagnostic event, and an ADR. `editor` does not gain an import of `rendering`.
- Changing Module 0 foundation behavior for `starting` and `failed`.

## 5. Editor session

`@uvcp/editor` holds at most one scene value, using the Module 1 scene operations. The shell does not import `@uvcp/core`. UI does not import `@uvcp/editor`. `@uvcp/editor` does not import `@uvcp/rendering`, `@uvcp/ui`, React, or `@uvcp/platform`.

Startup remains `starting`, `ready`, or `failed`. Manipulation exists only while the session is ready. `starting` and `failed` show the foundation screen and have no selection, no gesture, and no undo stacks.

A ready session also holds:

- a selection, which is one node id or none;
- at most one gesture;
- an undo stack and a redo stack.

Those values live in editor memory. They are not React state, not scene fields, not document fields, and not renderer objects. Pointer move updates the gesture proposal only. It does not call `setState`, and it does not write the scene.

A caller-supplied replacement of the scene value clears the selection, drops an active gesture without committing, and clears both stacks. The new scene's triples are the committed triples. The scene returned by the editor's own `move`, `rotate`, `scale`, undo, or redo is not that replacement. Persistence still does not call the filesystem.

`selectNode`, `move`, `rotate`, and `scale` throw `UNKNOWN_NODE` when the id is not in the scene and return no replacement scene. The previous scene, selection, gesture, and stacks stay as they were. A non-finite argument to a direct `move`, `rotate`, or `scale` throws `NON_FINITE_NUMBER`, does not change the scene, and leaves any active gesture in place. A non-finite proposal does not throw. Section 10 cancels it. Messages are the Module 1 sentences. They do not include an id, a number, a pointer path, or a key sequence.

## 6. Frame, center, and view

This section is the proposed reading of the Module 1 triples. It is not an accepted frame until the Product Owner accepts this specification.

Y is up. X increases to the right. The frame is right-handed, so positive Z comes toward the viewer in the unrotated view. Rotation components are degrees. The order is intrinsic XYZ: rotate about the node's X axis, then about its rotated Y axis, then about its rotated Z axis. Positive degrees follow the right-hand rule. The stored number is the degrees. This module does not store radians, a quaternion, or an axis-angle.

The position triple is the center of the node. A rectangle occupies local `x` in `[-width/2, width/2]`, `y` in `[-height/2, height/2]`, and `z = 0`, before scale and rotation. A box occupies local coordinates within half of each extent. Scale multiplies those local coordinates component-wise. Rotation is then applied about the center. Position is then added. Each ancestor applies the same map to the child's result. The manipulation writes only the selected node's own triples. Extents do not change. Zero and negative scale remain valid.

The view is fixed and orthographic. There is no pan, orbit, zoom, or camera tool. A world point `(x, y, z)` maps as follows. Yaw is +30° about world Y. Pitch is then +15° about world X. `cos` and `sin` take degrees.

```text
x1 = x * cos(30) + z * sin(30)
y1 = y
z1 = -x * sin(30) + z * cos(30)
x2 = x1
y2 = y1 * cos(15) - z1 * sin(15)
z2 = y1 * sin(15) + z1 * cos(15)
```

`x2` is screen right, `y2` is screen up, and `z2` is toward the viewer. The surface center is `((width / 2), (height / 2))` in CSS pixels. One world unit is 64 CSS pixels.

```text
screenX = width / 2 + x2 * 64
screenY = height / 2 - y2 * 64
```

`width` and `height` are the surface size in CSS pixels. `devicePixelRatio` is not an input. For a surface of 800 by 600, world `(0, 0, 0)` is screen `(400, 300)`, and world `(0, 1, 0)` is screen `(400, 300 - 64 * cos(15))`, within 0.01 CSS pixel.

An identity box at the origin, with positive extents and scale `[1, 1, 1]`, shows its `-X`, `+Y`, and `+Z` faces. A face is toward the viewer when its outward normal has `z2 > 0`.

## 7. Surface

When the session is ready, one surface replaces the foundation content root. It is the only content. It is not a second column, and it leaves no empty toolbar, hierarchy, inspector, or timeline. It is not an HTML `canvas` and it requests no GPU device. The shell paints it from plain editor facts. During a gesture the painted triples are the proposal. Otherwise they are the committed triples. The paint path does not store the gesture in React state.

The window title and the foundation strings stay as Module 0 defined them. Starting and failed keep the foundation screen, including Not ready after a failed startup.

An empty scene paints `color.canvas` and one sentence, in the existing body type, start-aligned and top-weighted: "This scene has no objects." There is no button, grid, drop target, handle, or sample shape. A click creates nothing and selects nothing. The sentence is absent when the scene has a node.

A rectangle paints a `color.surface` face and a `color.border` stroke. A box paints the same fill and stroke on its visible edges. There is no material and no light. Light and dark reuse the foundation roles.

The surface is one tab stop. Handles are not tab stops. Keyboard focus is a ring visible against `color.canvas`. That ring is not the selection silhouette.

## 8. Hit testing and selection

`hitTest` is a pure editor function. It takes the surface width, the surface height, a pointer position in CSS pixels, and the scene. It returns one id or a miss. It does not return a render object.

A node with no projected area is a miss. Scale that flattens the drawn shape removes that area. The 4px slop does not restore it. That node's handles are not drawn and are not targets.

Otherwise each face is projected with section 6. A face hits when the pointer is inside its projection or within 4 CSS pixels of that boundary. Among those hits, the greatest `z2` wins. If two hits still tie, the later node in paint order wins. Paint order is one depth-first preorder: walk `rootIds` in order, visit each node, then the nodes in its `childIds` recursively, and do not visit the next root until that subtree is finished. A parent is not preferred over a child.

A move or scale handle hits as a disc of radius 6 CSS pixels. Its center lies on that handle's axis, 16 CSS pixels beyond that node's face hit region, so the disc does not meet the 4px band. A rotate ring hits as an 8 CSS pixel stroke whose inner edge is 8 CSS pixels outside that same face hit region. A pointer in a handle shape is not in that node's face hit region. The selected node's handles are tested before faces and win over a face, including another node's face. One pointer position starts one command.

Primary-button down on a hit selects that id immediately. Down on a miss does not clear. Primary-button up on a miss clears the selection only when the pointer has moved 4 CSS pixels or less and no manipulation started. That up does not change a transform. A drag that starts on a miss does not draw a marquee and does not clear, including when it travels farther than 4 CSS pixels. Up on a hit when no manipulation committed leaves the selection made at down. A box body is a hit and is not a move target, so a drag on that body leaves the selection and the triples unchanged.

`selectNode` selects an id that is in the scene. `clearSelection` selects none. Neither writes the scene. Neither is an undo step. There is no second selection and no document copy of the id.

## 9. Move, rotate, and scale

A manipulation names one node and one command: `move`, `rotate`, or `scale`. It replaces that one triple. The other two triples are copied from the gesture baseline. A hidden component is copied, not deleted.

A rectangle:

- Move is a drag on its face. It replaces `position.x` and `position.y`. `position.z` stays.
- Rotate is one ring about the center, in the local XY plane. It adds degrees to `rotation.z`.
- Scale is one handle on local `+X` and one on local `+Y`. Each replaces that scale component.

A box:

- Move is the axis handle under the pointer. That handle replaces one position component. A drag on the box body is not a move.
- Rotate is the ring for one local axis. It adds degrees to that rotation component.
- Scale is the handle for one local axis. It replaces that scale component.

Handles are drawn only while that node is selected and has projected area, outside the filled silhouette, in `color.focus`. Their hit shapes are section 8. During a manipulation the other handles of that node are not hittable.

A direct `move`, `rotate`, or `scale` command names an id and one replacement finite triple. It commits immediately and does not change the selection. A drag is begin, then proposal updates, then one commit. Tests may call either path with no window.

The pointer mapping for a drag that has begun:

- Move adds the view-plane world delta, from the sample where the manipulation began to the current sample, in the node's parent frame, and then keeps only the components that target owns.
- Rotate adds the change in the pointer's angle about the projected center, in degrees, to the owned rotation component.
- Scale multiplies the owned baseline scale component by the ratio of signed distances from the projected center along that handle, current sample over the sample where the manipulation began. A zero divisor cancels the manipulation.

## 10. Commit and cancel

A manipulation starts when the pointer has moved more than 4 CSS pixels from primary-button down on a move, rotate, or scale target of the selected node. The baseline is the three triples at that start.

Commit is primary-button up after that start, including when the pointer is outside the surface. The scene receives the proposal through the Module 1 transform replacement, so each component passes `canonicalizeFiniteTriple` and `-0` becomes `0`. The gesture is then dropped. The selection stays the id pointer-down already selected.

If the proposal is non-finite, the manipulation cancels and does not throw. It drops the gesture, leaves the baseline and the selection, adds no undo step, does not repair a component to `0`, and does not write a partial triple.

Cancel is Escape during the manipulation, pointer capture lost, a platform pointer cancel, or the window blurring. The proposal is dropped. The scene still has the baseline, because the gesture has not written it. Selection is unchanged. No undo step is added. A later pointer up does not commit.

Release before 4 CSS pixels writes no transform. Escape with no manipulation writes no transform and does not clear the selection. A commit whose canonical triples equal the baseline adds no undo step.

Right button and middle button do nothing.

## 11. Undo, redo, and keys

One undo step is one committed `move`, `rotate`, or `scale` on one node whose canonical triples changed. Pointer samples are not steps.

The step stores the node id and the canonical before and after triples. Undo calls `replaceTransform` with the before triples and selects that id. Redo calls `replaceTransform` with the after triples and selects that id. Each call stores the new frozen scene, and the triples pass `canonicalizeFiniteTriple`. The step id is still in the held scene: a caller-supplied scene replacement clears both stacks, and Module 2 does not remove a node any other way. Undo and redo do not throw `UNKNOWN_NODE`. A new committed step clears the redo stack. Undo or redo on an empty stack changes nothing and shows no failure screen. Undo then redo returns the canonical after triples, including `-0` already stored as `0`.

The keys apply only when the surface is focused and no manipulation is active. During a manipulation they do not commit and do not undo.

| Action | Windows and Linux | macOS |
| --- | --- | --- |
| Undo | Ctrl+Z | Cmd+Z |
| Redo | Ctrl+Shift+Z, and also Ctrl+Y | Cmd+Shift+Z |

There is no keyboard-only way to start a move.

## 12. Functional requirements

### M2-FR-001 — Surface

When startup is ready, the shell shall show the one surface in section 7 in place of the foundation content root. Starting and failed shall keep the foundation screen.

### M2-FR-002 — Selection

The user shall select one visible node by a primary click, and shall select a different visible node by a later primary click. A primary click on empty space, one that moves 4 CSS pixels or less, shall clear the selection. A drag that starts on empty space shall not clear it. The selected id shall be editor memory, not a scene field.

### M2-FR-003 — Move

The user shall move a selected rectangle by dragging its face, and shall move a selected box by dragging one axis handle. The committed result shall be a new position triple on that node. Extents and the other two triples shall stay as they were, except for the position components the target owns.

### M2-FR-004 — Rotate

The user shall rotate the selected node by its ring. The committed result shall add degrees on the owned rotation component. The frame in section 6 is the meaning of that number.

### M2-FR-005 — Scale

The user shall scale the selected node by its scale handle, about the center in section 6. The committed result shall replace the owned scale component, including a zero or negative finite result.

### M2-FR-006 — Commit and cancel

A manipulation that passes the 4 CSS pixel threshold shall commit on primary-button up and shall cancel on Escape, lost capture, platform cancel, or blur. Cancel and a non-finite proposal shall leave the baseline triples in the scene and shall add no undo step.

### M2-FR-007 — Undo and redo

The user shall undo and redo the last committed manipulation that changed a transform. Undo then redo shall restore the canonical after triples and shall select that node.

### M2-FR-008 — Keys

The chords in section 11 shall run undo and redo when the surface is focused and no manipulation is active. Escape shall cancel only an active manipulation.

### M2-FR-009 — Selection feedback

The surface shall show the selected node with a 2px `color.focus` silhouette and that node's handles. An unselected node shall keep a 1px `color.border` stroke and a `color.surface` fill. No new color role shall be added.

## 13. Non-functional requirements

### M2-NFR-001 — Same transform

A committed manipulation shall be visible to a headless reader of the scene and to `writeScene`. The document bytes shall not contain the gesture, the selection, or the undo stacks.

### M2-NFR-002 — Gesture end

Commit, cancel, lost capture, and blur shall each end the gesture. A later pointer up after cancel shall not write. The document after a rejected command shall be the previous document.

### M2-NFR-003 — Reversible triples

Undo followed by redo shall return the same canonical triples the commit stored.

### M2-NFR-004 — Responsiveness

The reference scene and the common-case face drag are `preparation/workload.md`. The measurement is an observation. Module 2 has no millisecond pass threshold. The observation shall not fail `pnpm verify`.

### M2-NFR-005 — Regression

`pnpm verify` shall remain the regression gate on `ubuntu-24.04` and `windows-2025`. Module 0 checks stay on that command. Module 1 checks stay on that command once they are on the branch under test.

### M2-NFR-006 — Bounds

Module 2 shall add no runtime dependency and no graphics API. The import table in architecture section 10 stays as written. `renderNull` stays a null snapshot with an empty draw list. The surface is not an HTML `canvas`.

### M2-NFR-007 — Diagnostics

The implementation shall not log pointer paths, key sequences, scene contents, object ids, transform values, or project bytes. A failed transform shall not add a diagnostic event. Startup events stay the Module 0 set.

### M2-NFR-008 — Headless proof

Move, rotate, scale, cancel, undo, and redo shall be provable by commands that open no window.

## 14. Acceptance criteria

### M2-AC-001 — Pointer selection

Given a ready surface and two visible nodes, a primary click on one selects it, and a primary click on the other changes which id is selected. The headed record shows that change without a log.

### M2-AC-002 — Transform edits

With no window, a move, a rotate, and a scale each change the triple a headless scene reader returns. `writeScene` on that scene preserves the committed triples.

### M2-AC-003 — Undo and redo

With no window, undo restores the preceding triples and selects that node. Redo applies the committed triples and selects that node.

### M2-AC-004 — Cancel

After a gesture has a proposal that differs from the baseline, cancel leaves the baseline in the scene. No undo step exists for that gesture.

### M2-AC-005 — Visible selection

In one headed session, a reviewer can tell the selected node from an unselected node without reading a log. The session names current Edge or current Chrome on the primary Windows machine.

### M2-AC-006 — Ready and failed screens

A failed startup shows the foundation screen, including Not ready. A ready session with an empty scene shows the empty sentence and no handle. A ready session with a node does not show that sentence.

### M2-AC-007 — Document boundary

After a committed move, the scene document round-trips the new position and still has no selection field. Replacing the scene value clears the undo stacks.

### M2-AC-008 — Rejected input

An unknown id and a non-finite direct-command triple each throw the Module 1 code, yield no replacement scene, and leave the previous triples unchanged. A non-finite proposal cancels and does not throw.

## 15. Verification

Headless rows run under the existing `pnpm test` discovery and open no window. The headed row is one recorded session, outside CI. `pnpm verify` is the regression gate. The workload observation is not a row that passes or fails.

Developers write the automated tests when implementation is authorized. This specification adds none.

## 16. Differences the Product Owner is asked to accept

Accepting this specification accepts the following proposed meanings together. This draft does not treat them as already accepted.

- The frame, center, and fixed view in section 6. The design note recommended the frame. The editor and architecture notes did not interpret triples until a contract named one.
- The ready surface replaces the foundation content root. Starting and failed do not.
- A box moves only by an axis handle. A rectangle moves by a face drag.
- Undo and redo select the restored node.
- On Windows and Linux, Ctrl+Y and Ctrl+Shift+Z are the same redo command.
- Save and reopen stays out of this module. Archive acceptance criterion M2-AC-005 is not a Module 2 criterion.
- The manipulation threshold is 4 CSS pixels.
- Responsiveness has a reference scene and has no millisecond pass threshold.

## 17. Definition of Ready still open

From `docs/engineering/development-process.md` section 8:

- Required earlier modules are approved. Module 0 is GREEN. Module 1's contract is approved and Module 1 is not GREEN. Implementation waits for that GREEN result.
- Blocking product ambiguities are resolved. Section 16 is one proposed meaning per row. The Product Owner has not accepted it.
- The Product Owner authorizes implementation. Not met. This specification does not request implementation while Module 1 is open.

The other section 8 items are stated by this file, the reconciliation, the test plan, and the workload note. They still depend on the Product Owner accepting section 16 before implementation.

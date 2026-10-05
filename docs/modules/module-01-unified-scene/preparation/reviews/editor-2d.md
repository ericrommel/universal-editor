# Module 1 preparation — 2D and editor review

**Role:** Senior 2D / Editor Engineer
**Status:** Proposed preparation review, 2026-10-05. Not an ADR. Not implementation authorization. Not Product Owner approval. Module 0 is not accepted here.

## Recommendation

Accept the starter position.

The only 2D object in this slice is an axis-aligned rectangle with finite width and height in the node's local coordinates. It uses the same ordered node hierarchy and the same transform as a 3D box. Selection is at most one editor-session id, cleared when that node is removed, and is not written into the scene document. There is no text, image, path, stroke, fill, viewport, or tool. The foundation screen stays the Module 0 screen. Creating a rectangle is a pure edit of the scene value.

Width and height of zero are valid. Zero is a real node with no area, not a missing object and not a minimum-size error.

These choices are proposed. They do not freeze a schema, amend ADR-0008, or decide save, undo, axes, or the box payload.

## One parent

Proposed: a rectangle and a box share a parent by id list, not by a 2D or 3D container.

The scene has an ordered list of root ids. Each node has an ordered list of child ids, one transform, and one kind: rectangle or box. Both kinds may be roots. Either kind may parent the other. They share a parent when both ids sit in the same child list. The parent records no mode, plane, layer, or camera. Sibling order is that list only. It is not a second 2D stacking order and not draw order.

No group type is required. The parent's geometry does not clip, mask, or change the child's kind. Removing the parent removes that subtree. An unrelated sibling stays.

The rectangle adds no position of its own. Placement is the shared transform. It occupies an axis-aligned span in the node's local XY plane and has no depth field. The node origin is one corner of that span. A parent rotation can make the edges non-axis-aligned in the parent frame. That rotation is the common transform, not a rectangle angle. Units, handedness, up axis, rotation order, and degrees versus radians stay undecided. This review does not choose them.

The box is only the other kind. Its size fields are not proposed here. A rectangle is not a box with zero depth, and a box is not stored as a rectangle.

## Width and height

Proposed: width and height are finite local extents. The only numeric gate is the approved `canonicalizeFiniteNumber` rule. `-0` becomes `0`. `NaN`, infinities, and non-numbers stay invalid.

Zero is valid. A width or height of zero, including both zero, remains in the hierarchy, keeps its id, and can be named by selection. It is not dropped, deleted, or replaced with a positive epsilon.

Negative width and height are valid finite values. They are not rewritten to absolute values. The local span runs from `0` to `width` on X and from `0` to `height` on Y, so a negative extent lies on the negative side of the node origin. Sign on the extent is not a second scale. The transform scale is left untouched.

A positive minimum, a centered pivot, and silent normalization are not proposed. Each would change the value the caller wrote, so the edit would no longer be pure. A negative extent is not another encoding of a translated rectangle: children attach to the node origin, and the extent does not move that origin.

## Selection and the edit

`packages/editor/src` has no selection API. `EditorSession` is only `starting`, `ready`, or `failed`. ADR-0008 still holds: no selection field, tool, panel, undo stack, or viewport on that session. This review does not add one and does not treat the ADR's later-viewport notes as an interface. `editor` still must not import `rendering`.

Proposed, for a later authorized slice only:

- The scene value is plain domain data. It stays serializable without the UI. React does not hold it. The shell still passes startup strings, not the scene. The proof is that value, headless, under `node:test`. A picture is not that proof.
- The caller supplies the new node id, the parent (a root insert or a node id), and the sibling index. Core does not read a clock or a random source. A duplicate id is a failure, not a silent rename. A node has one parent.
- Create does not change selection. A pure scene edit does not write session state.
- Selection, when introduced, is a separate session fact: one id, or none. It is absent when no node is selected. An id that is not in the scene is not stored.
- Delete is a pure scene edit. It removes the named node and its descendants and closes that hole in the sibling list. If the selected id was removed, selection becomes absent. It does not move to a sibling or to the parent. Selection of a node outside the removed set stays.
- Startup status is unchanged by create, delete, or selection. The foundation screen gains no hierarchy, canvas, command, or selection chrome.

## Out of this slice

Not proposed, and not withdrawn from the product: text, image, path, stroke, fill, a tool, hit testing, pointer input, a host element, and a viewport. Archive section 9.2 is context. Its viewport sentence is not met by this model-only slice. Whether that archive section is the scope to prepare remains open, as in the quality note. Save, reload, undo, one scene or several, and the public format stay open there too. A test that picks them would be deciding product scope.

The Module 0 deferrals stand. Hit testing, if a later module adds it, returns an id and not a render object. A pointer move must not be a React `setState`. Neither rule is an API now.

## Risks

A default fill or a one-pixel minimum would be mistaken for appearance and would reject a finite rectangle. A parent kind of "2D" or "3D" would split the hierarchy this slice exists to keep whole. Storing the selection id on the scene would publish editor state in the document. Painting the rectangle on the foundation screen would repeat the Module 0 mistake: that screen would again be cited as the editor.

# Module 1 preparation — product design

**Role:** Senior Product Designer / UX Architect
**Date:** 2026-10-05
**Status:** Proposed preparation review for issue #7. This is not Product Owner approval, not implementation authorization, and not acceptance of Module 0. Module 0 is merged as `5e99484` and is not GREEN. This review does not mark it GREEN.

## Recommendation

Accept the starter position.

Module 1 proves coexistence in a headless scene model: one hierarchy containing a rectangle and a box, the same transform model on each object, and reload of that hierarchy and those transforms. The foundation screen does not gain a viewport, a canvas, a toolbar, or an editor frame. A person does not need a new screen to prove the model. Archive module 2 is direct manipulation and is not this module.

Dissent: none.

## Why no new screen

Issue #7 is to prove one scene, one hierarchy, one persistence model, and one transform system. It does not ask a person to see the objects. It does not authorize implementation or freeze scope. Archive section 9.2 is context for that objective. Its identifiers are not operational requirements, including any wording that places both objects in a viewport or makes selection a user action.

P-01 requires that 2D and 3D eventually share one editing experience, not two editors joined only at the chrome. That binds the model now and a later screen later. It does not add a Module 1 surface. P-02 withholds controls the current task does not need. P-03 prefers the visible result over abstract parameters. A lifeless viewport, a hierarchy list, or a transform readout would be those parameters, and it would be the empty editor frame the foundation screen refuses. Gizmos, materials, and animation are not designed here.

A visible proof is not required to meet issue #7. It is a later module: the one that replaces this content root and writes its own viewport decision (ADR-0008). This review does not design that screen, its states, its empty state, or an accessible name. It must not be improvised onto the foundation screen. When it exists it is still one experience for both kinds of object, not a 2D view beside a 3D view.

The alternatives considered and rejected for this module are a read-only list of the two objects, and a static picture of them. The list is a hierarchy of names and numbers, which is the abstract start P-03 avoids. The picture is a viewport or a sample shape. Neither is required by issue #7.

## What the headless proof must keep true

So a later experience is not a join of two models:

- One hierarchy holds the rectangle and the box. Not a 2D tree beside a 3D tree.
- Each object uses the same transform model. They do not share one transform value. The screen does not show the values.
- Reload reconstructs that hierarchy and those transforms. Reload is a model proof. It is not a New, Open, Save, or Export command, and it adds no menu.
- No selection, tool, panel, or undo type is added so this shell can display the scene.

This review does not choose scene count, file shape, axes, rotation order, degrees versus radians, undo, or which commands exist. Those remain open product decisions.

## What remains true of the foundation screen

The foundation screen stays the only screen. Its three jobs stay identity, purpose, and status, in that order. One content column, top-weighted and start-aligned. Not a splash. Not a docking frame. Module 1 does not leave empty regions for a later module. A later module replaces the content root. It does not inherit a frame of slots.

- The heading remains the product name, as text, once. The purpose sentence still says this build only proves the foundation and that creation tools are not part of it. Do not rewrite it to announce a scene the screen does not show.
- The only states remain Starting, Ready, and Not ready, with the existing detail sentences. There is no scene empty state on this screen. Shell state remains startup only: starting, ready, or failed (ADR-0008).
- The only product control remains Details / Hide details, and only when a diagnostic exists. No new control, so no new accessible name. The heading is still the product name. The status group is still named Status. The status dot stays decorative.
- Still absent: a viewport, a canvas, a grid, a frame probe, a toolbar, a hierarchy, an inspector, a timeline, a gizmo, a sample shape, a transform field, selection chrome, and any authoring command, including a disabled one. Platform chrome still must not gain New, Open, Save, or Export.
- Tokens, contrast, focus, reduced motion, text scaling, and the light fallback stay as already specified for this screen. No second visual language and no in-app appearance control.

The window a person opens still means the foundation started or did not. It does not mean an editor.

## Definition of Ready

Development process section 8 requires design behavior to be defined before implementation. For Module 1 that behavior is the absence of new UI, plus the one-hierarchy constraint above. This note does not meet the rest of that gate. Module 0 is not approved. Scope is not frozen. The Product Owner has not authorized implementation.

No scene type, viewport, package, or test is specified here.

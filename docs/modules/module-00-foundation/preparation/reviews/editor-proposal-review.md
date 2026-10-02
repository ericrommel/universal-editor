# Editor Proposal Review

**Role:** Senior 2D / Editor Engineer
**Status:** Concurrence. Not an ADR. Does not change architecture, requirements, or code.
**Date:** 2026-10-02

Question: does omitting a viewport, a canvas, and a frame probe leave a blocking hole in Module 0?

A blocking hole would mean the dependency direction cannot be demonstrated, or a later module is forced to store the scene in React. Preferring an executable probe is not a block.

## Disagreement

The preparation review requested one host element, `attachViewport`, session flags `detached` and `attached`, and a frame probe that pumps frames outside React. That request was not adopted.

Decision, not reversed here: no viewport, no canvas, and no frame probe in the Module 0 shell.

## Why Module 0 is not blocked

Module 0 has to show that the boundaries exist and that core can be imported and tested without UI or a desktop shell (M0-FR-003, M0-NFR-002, M0-AC-006). It does not have to run a frame loop. A boundary may contain minimal code.

What is bound:

- Editor session state is only `starting`, `ready`, and `failed`.
- The shell creates the editor, runs startup, and passes a plain view model. UI imports no workspace package.
- Editor does not import React. Editor may import `core` and `persistence` only. It does not import `ui`, `rendering`, or `platform`.
- The shell does not import `core`, `persistence`, or `rendering`. Startup goes through the editor.
- Headless editor tests cover startup success and injected failure. They do not import `ui` and they do not open a window.
- A forbidden import fails verification. A type-only import counts. A test import counts.

That graph is stricter than the UI-to-editor client first requested. UI cannot reach the editor or the domain. The shell is the only composition root that sees both, and it passes data rather than a React-owned store.

There is no scene, selection, tool, gesture, or undo stack in Module 0 to park in React. M0-AC-006 does not require a browser. A render-count test is not Module 0 evidence.

## Revisitable direction

Not a binding API. Not Module 0 types. ADR-0008 records the same ideas as notes for a later viewport, not a specification. This review does not treat those notes as an interface later modules must implement unchanged, and it does not amend the ADR.

- React may create a host element later. It would not render frames. Manipulation pointer input would be registered outside React state.
- Hit testing returns an id. It does not return a render object for the UI to mutate.
- Selection is session state, not a scene field, unless the Product Owner later chooses to persist it.

A later viewport module re-decides those rules with its own evidence. It also needs a new ADR before `editor` may call `rendering`. Module 0 does not grant that edge to `editor`, `ui`, or the shell.

Nothing in the Module 0 graph requires the scene to live in React. Copying a future document into the plain view model would be a new decision, not a growth of the startup strings. Drawing inside `packages/ui` because `editor` cannot yet import `rendering` is not an allowed escape. The escape, when a viewport is approved, is a new ADR that amends the import table.

## Risks still open

| Risk | Disposition |
| --- | --- |
| React makes local state the easy place for a scene | Closed for Module 0 by the import rules and the startup-only session. Open again when a module adds a document or a surface. |
| The omitted probe is forgotten and frames call `setState` | Not a Module 0 hole. The module that schedules frames should add a render-count check then. |
| The plain view model grows into a document copy | Module 0 passes startup strings only. A scene snapshot is not authorized here. |
| `editor` or `ui` draws while the renderer edge is closed | The null renderer stays headless. Opening `editor` to `rendering` requires a new ADR. |

## Verdict

Omitting the host and the probe does not leave a blocking hole. The dependency direction Module 0 requires is the import graph and the headless startup tests.

Those later-viewport notes are revisitable direction, not a binding API, and not something Module 0 has built.

CONCUR

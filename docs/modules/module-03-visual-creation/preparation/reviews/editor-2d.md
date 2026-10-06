# Module 3 preparation — editor and shell

**Role:** Senior 2D / Editor Engineer

**Status:** Preparation for issue #9, read on `m3/preparation` at `5e99484`. Not an ADR. Not an interaction design. Not implementation authorization. Not a Product Owner decision request. Archive section 9.4 in `docs/archive/product-engineering-specification-v1.0.md` is context. Its identifiers are not operational requirements.

Module 0 is GREEN at that commit. Module 1 is not approved. Module 2 (issue #8) is an empty backlog: viewport selection, move, rotate, scale, and transform undo are unspecified. This note does not reopen the Module 1 dissent.

## 1. Status

The shipped editor can start and can fail. It cannot create. A later creation workflow may assume section 2 and must not assume a selection, a tool, a command, an undo stack, a document, or a creation screen. Every archive ambition in section 3 has no editor API. This note names the hole and the blocker. It does not fill either.

## 2. Shipped editor surface

A later workflow may assume only what is already true:

- `EditorSession` is `starting`, `ready`, or `failed`. `startSession` freezes a starting value, runs `initialize`, and returns ready or failed. Failure carries `step`, `code`, and `message`. `packages/editor/src/session.ts`. ADR-0008 (`docs/engineering/adr/0008-editor-state-and-shell-content.md`) forbids a selection field, tool enum, panel registry, command bus, or undo stack. Empty fields would become an API. Creation state does not belong on these three statuses.
- Exports are `initializeFoundation`, `startSession`, `InitializationError`, and the session types. `packages/editor/src/index.ts`. `initializeFoundation` returns without a project. `packages/editor/src/compose.ts`. There is no create, edit, import, rename, duplicate, reorder, delete, or appearance export.
- Diagnostics are `startup.beginning`, `startup.ready`, and `startup.failed`. `packages/editor/src/diagnostics.ts`. Text outside the closed patterns is replaced. A `DomainError` thrown from the initializer becomes that startup failure. `packages/editor/src/editor.test.ts` calls `readManifest` only to prove the path. It is not an edit result and not an import result.
- Headless startup is `packages/editor/src/headless.ts`. Success exits 0. `--inject-failure` exits 1. No window opens. A later behavior that needs no viewport can be proved that way. This note adds no headless creation command. The foundation screen is not that proof.
- The shell only composes. `apps/shell/src/main.tsx` calls `startSession` and renders `FoundationScreen` through `foundationProps`. That maps a settled session to `ready` or `failed`, plus the application message on failure. `apps/shell/src/foundation-props.ts`. No document is passed. UI does not import the editor.
- Screen props are status and an optional diagnostic. The only control is the details button. `packages/ui/src/foundation-screen.tsx`. The purpose string says creation tools are not part of this build. `packages/ui/src/strings.ts`. This preparation does not add commands to that screen.
- `editor` may import `core` and `persistence`. It must not import `ui`, React, `rendering`, or `platform`. Architecture section 10 (`docs/engineering/architecture.md`). A viewport ADR is required before `editor` calls the renderer. This note does not write that ADR. `packages/platform/src/index.ts` has no runtime export.
- Core exports `DomainError`, `canonicalizeFiniteNumber`, and `canonicalizeFiniteTriple`. `packages/core/src/index.ts`. Architecture section 6: no scene type and no id generator. Core does not read a clock, a random source, or the filesystem. The canonicalizers are a finiteness rule, not a shape, a color, or an opacity model.
- The persistence edge is the two-field provisional manifest. ADR-0006 (`docs/engineering/adr/0006-domain-persistence-and-undo-direction.md`). It is not a scene document, not an asset store, and not a history log. Architecture section 9: no undo strategy is selected and no undo API exists.

A later workflow must not assume the following:

- The foundation screen is an editor layout. The Module 0 design review rejected a viewport, a canvas, a drop target, toolbars, disabled shape or text tools, a hierarchy, and fake authoring commands. `docs/modules/module-00-foundation/preparation/reviews/product-design.md`. Painting a new object onto that screen repeats that mistake.
- The null-renderer clear color is not an object fill, and `editor` cannot call the renderer. `packages/rendering/src/null-renderer.ts`.
- The unapproved Module 1 editor note on pull request [#32](https://github.com/ericrommel/universal-editor/pull/32) proposes one rectangle with width and height, selection outside the document, and no text, image, fill, or viewport. It is contested with the rest of that proposal. It is not the Module 3 shape.

## 3. Each archive ambition

Classes used below: can describe the missing API now; blocked on Module 1 scene data; blocked on Module 2 viewport and transforms; blocked on deferred undo; later product decision. A class is a stop. It does not ask anyone to decide the open item. "Can describe the missing API now" means the shipped session and screen already show the hole, and naming it chooses no type and no command. No ambition has a signature this note may write.

### Basic 2D shapes

Later product decision (the shape set). Blocked on Module 1 scene data. Blocked on Module 2 for direct manipulation.

No shape export exists. A parameter list would choose the set or adopt the contested rectangle. This note does neither. Direct manipulation of a new object cannot start until Module 2 exists. Painting the shape on the foundation screen is the rejected Module 0 mistake.

### Create and edit text

Later product decision (inline text versus a field). Blocked on Module 1 scene data.

No text export and no text payload exist. This note does not define the text editor, a caret, or a field. The session has no selection. Module 2 has not specified viewport selection, and object selection would not be a text editor.

### Import a raster image

Blocked on Module 1 scene data.

Section 2 records the absence: no import export, no image object, no asset entry in the manifest. `editor` must not import `platform`. Startup `InitializationError` is the wrong failure channel. Formats, limits, and where bytes live are not described here.

### Change ordering

Later product decision (the order model). Blocked on Module 1 scene data. Blocked on Module 2 for a visible result.

No reorder export exists. No hierarchy is shipped, so there is nothing to reorder. A visible change needs a draw path, and `editor` cannot call the renderer until a viewport ADR exists. This note does not define z-order, sibling order, or a stacking field, and it does not take the contested Module 1 list as that model.

### Fill, color, and opacity

Blocked on Module 1 scene data.

No appearance field exists on the session or in core. Adding an empty one to `EditorSession` would violate ADR-0008. The number canonicalizers are not a color encoding. The renderer clear color is not a fill. This note does not choose controls. Undo of an appearance change is the undo item below, not an appearance API.

### Rename and duplicate

Blocked on Module 1 scene data.

Rename and duplicate need a display name and an identity source. Neither exists. Core has no id generator. This note does not invent one and does not adopt a caller-supplied id from the contested Module 1 note. There is no rename or duplicate export to specify until those sources exist.

### Undo of creation, deletion, duplication, and appearance

Blocked on deferred undo. Blocked on Module 2.

Archive section 9.3 describes undo of transform operations. Archive section 9.4 describes undo of creation, deletion, duplication, and appearance. ADR-0006 selected no strategy. The session has no stack. This note does not choose inverse patches, snapshots, or a command bus. The gap stays blocked on the deferred undo decision and on Module 2. It is not a decision request to the Product Owner today. If an approved Module 2 model covers only transforms, the other operations stay blocked after that module.

### Discoverable creation actions

Can describe the missing API now. Blocked on Module 2 where the action is direct manipulation of a new object.

The session exports no action. The screen's only button shows or hides the startup diagnostic. The purpose string excludes creation tools. The default creation interface is not this screen, and this preparation does not add one. Which actions exist, and how a person finds them, is not designed here.

## 4. Safe work completed by this note

This file records the assumptions in section 2 and the classification in section 3. It changes no package, screen string, session type, import edge, test, or ADR. It adds no command to the foundation screen. It does not move issue #9.

## 5. Non-goals

- Not an interaction design, and not a layout that replaces the foundation screen.
- Not authorization to implement Module 3, and not a request to approve Module 1 or to write Module 2.
- Not a viewport ADR, and not an amendment of ADR-0008.
- Not a shape set, a text editor, a z-order, a command stack, a display name, or an id generator.
- Not a reopening of the Module 1 dissent.
- Not a reading of archive identifiers as operational requirements.

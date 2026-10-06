**Role:** Senior 2D / Editor Engineer
**Status:** Preparation input for issue #9. Not a specification. Not implementation authorization.
**Date:** 2026-10-06

# Visual creation — inherited editor note

This note records editor boundaries for a later creation specification. It does not specify creation. It does not authorize implementation. It does not request a Product Owner decision.

## Inherited contract

Product Owner approval of PR #50 is the Module 1 implementation contract (https://github.com/ericrommel/universal-editor/issues/7#issuecomment-6013883562), head `13f1725`. That pull request is not merged. Module 1 is not GREEN. The specification status line is stale. This note does not edit the specification. The contract is a boundary only.

From sections 4 and 5 of that contract:

- No selection in the scene, the document, or the editor API.
- `insertNode`, `replaceTransform`, `replaceExtents`, and `deleteNode` return a new frozen scene. The scene passed in is not mutated.
- No reorder operation. A new node's place is its insert index. That is not a reorder command.
- No text, image, or curve.
- Stored triples round-trip. They are not axes or degrees.

Module 2 preparation is recommendations, not an ADR. These stay open. This note does not pick a side:

- box body drag versus an axis handle
- whether undo reselects
- Ctrl+Y versus Shift+Z only
- a CPU hit test versus a deferred pick buffer

The numeric frame is not accepted. Triples are not interpreted as axes or degrees.

## What stays put

`EditorSession` is only `starting`, `ready`, or `failed`. This note does not add selection, tool, or undo fields.

The foundation screen does not gain creation tools. Its purpose string says creation tools are not part of this build.

Ingest errors and creation errors are not the foundation-screen diagnostic.

`editor` still does not import React, `ui`, `rendering`, or `platform`. This note is not a viewport ADR.

## Not the manipulation commands

Create, delete, duplicate, rename, reorder, and appearance change are not Module 2 `move`, `rotate`, or `scale`.

A pointer gesture for manipulation does not become the creation tool. Pointer-move still must not call `setState`. Pointer samples are not undo steps.

The Module 2 recommendation is one before/after triple step for a committed move, rotate, or scale. That step does not cover create, delete, duplicate, rename, reorder, or appearance change. This note does not stuff those operations into it.

Duplicate cannot mint an id inside core. The caller supplies ids. This note does not choose the id source.

## Not designed here

No toolbar. No text editor. No shape set. No code.

**Status:** Preparation input for issue #10. Not an interaction specification. Not implementation authorization.
**Role:** Senior 2D / Editor Engineer
**Date:** 2026-10-06

# Module 4 draw in space — editor note

Archive section 9.5 is context only. Its identifiers are not used. This note adds no tool, no fields, and no imports.

## Module 2 seam

The Module 2 seam is a recommendation, not an ADR.

- A pointer gesture lives in editor memory. React does not own it. Pointer-move does not call `setState`.
- Commit replaces finite triples. Cancel writes no undo step. Pointer samples are not undo steps.
- Move, rotate, and scale are headless commands.

The four disagreements stay open. This note does not resolve them. The numeric frame is not accepted. Triples are not interpreted.

## Not added here

`EditorSession` has no tool field and no undo field. This note does not add a stroke tool to it or to the foundation screen.

The drawing surface is not the foundation screen. This note does not design it.

## Stroke and undo

A freehand stroke is not move, rotate, or scale. Completing a stroke is not a finite-triple replacement. The Module 2 undo step does not cover undo of a completed stroke.

Sampled points are not an undo stack. This note does not choose a smoothing algorithm. This note does not choose shortcuts.

## Authorization

Issue #10 does not authorize implementation. Module 4 implementation waits until Module 3 is GREEN.

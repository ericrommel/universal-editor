# Core platform

**Status:** Preparation input for issue #10. Not a specification. Not implementation authorization.
**Role:** Senior Core / Platform Engineer
**Date:** 2026-10-06

This note records constraints for later Module 4 work. It adds no type, kind, or codec. Issue #10 does not authorize implementation. The Module 1 specification is not edited.

## Core on this branch

`@uvcp/core` exports only `DomainError`, `canonicalizeFiniteNumber`, and `canonicalizeFiniteTriple`. No scene value is exported. None is on `main` yet.

ADR-0006 binds those helpers. A finite number passes. `-0` becomes `0`. `NaN`, infinities, and non-numbers throw `NON_FINITE_NUMBER`. Callers pass values. Core does not mint ids and does not gain a clock, a random source, or a matrix package. No project container is selected.

## Module 1 contract, not landed

PR #50 is the approved Module 1 implementation contract (https://github.com/ericrommel/universal-editor/issues/7#issuecomment-6013883562). It is not merged. Module 1 is not GREEN.

Under that contract the only kinds are `rectangle` and `box`. A curve kind is an unknown kind on schema 1 and fails `INVALID_SHAPE` until a later approved contract adds it. This note does not add one.

Ids are caller-supplied (M1-FR-009). Core does not read a clock or a random source to mint one. An id is 1 through 64 UTF-8 bytes, already Unicode NFC, with no ASCII controls U+0000 through U+001F or U+007F. It is not trimmed, case-folded, or rewritten into NFC. Rejection is `INVALID_ID`. A repeated id is `DUPLICATE_ID`. The message does not include the id.

Transform components are canonical finite triples. Extents are canonical finite numbers strictly greater than zero. A non-finite component throws `NON_FINITE_NUMBER` and does not change the scene. Stored numbers round-trip. Up axis, handedness, rotation order, degrees versus radians, and pivot stay uninterpreted.

The scene document is not the provisional manifest. The manifest writer still emits exactly `{"formatId":"universal-visual-creation-project","schemaVersion":1}`. Persistence does not call the filesystem.

## Points are not the manifest

Control points are not image bytes. They still do not belong in the two-field manifest. `1048576` is the scene-document byte cap (`TOO_LARGE`) in that contract, before decode and on canonical writer bytes. It is not a point-list budget. This note sets no point-list budget and does not choose a container.

## Not chosen

Polyline, Bezier, or any other control schema is not chosen. No codec is added. Schema 1 is not extended.

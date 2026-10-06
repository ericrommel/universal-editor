# Module 4 — Architecture constraints

**Status:** Preparation input for issue #10. Not a specification. Not an ADR. Not implementation authorization.
**Role:** Tech Lead
**Date:** 2026-10-06

Issue #10 is an open backlog placeholder. It does not authorize implementation and it does not freeze scope. This note records constraints. It adds no curve schema, no types, no dependency, and no ADR.

Archive section 9.5 is context only. Its M4-FR, M4-NFR, and M4-AC identifiers are not operational requirements.

## 1. Implementation gate

**Constraint.** A module is GREEN only when section 20 of `docs/engineering/development-process.md` is met, including explicit Product Owner approval. Only then may implementation of the next module begin. Section 2 states the same gate: Module N+1 must not enter implementation until Module N is GREEN. Module 3 is not GREEN. Preparation may proceed. Implementation of Module 4 may not.

Curve-to-tube is Module 5. This note does not start Module 5. A tube is not the curve.

## 2. Module 1 contract

**Constraint.** The Product Owner approved pull request #50 as the Module 1 implementation contract (https://github.com/ericrommel/universal-editor/issues/7#issuecomment-6013883562), head `13f1725`. That head is not merged. Module 1 is not GREEN. The specification status line still says proposed. This note trusts the specification body and does not edit that file. This branch does not change that contract.

Kinds on that contract are only `rectangle` and `box`. An unknown kind is `INVALID_SHAPE`. Curves are explicitly out of scope. The scene schema token is `1`. Unknown keys are rejected. The document contains no images. The 1048576-byte cap is the scene-document size check, not a stroke budget. Core does not mint an id. The caller supplies every id.

## 3. Editable control data

**Constraint.** When a later contract allows a curve, the editable control data is domain data made of finite numbers through the existing canonicalizers, `canonicalizeFiniteNumber` and `canonicalizeFiniteTriple`. `-0` becomes `0`. A non-finite number does not change the document. No new numeric helper is added. That data is not a mesh, not a draw-list entry, and not a renderer object. Derived geometry must not be the only copy of the source.

**Deferred.** Polyline versus Bezier versus another control schema. That choice is user-visible and waits. Which existing canonicalizer a later field uses is part of that schema. The numeric frame is not accepted. No smoothing algorithm and no tolerance number.

## 4. Undo

**Constraint.** The Module 2 notes are recommendations, not an ADR. The undo step they recommend covers only a committed finite-triple replacement. Pointer samples are not steps. That recommended stack does not survive reload.

A completed stroke is not a transform-triple replacement, so that step does not cover it. Pointer samples are not the undo step. This note does not select the undo product policy.

## 5. Persistence

**Constraint.** Persistence of control points does not go in the two-field provisional manifest. It does not go in schema `1` as extra keys. Unknown keys on that schema are rejected. The manifest stays the two Module 0 fields.

**Deferred.** Any later document shape. This note does not write one.

## 6. Imports, the null renderer, and dependencies

**Constraint.** `editor` does not import `rendering` until a new ADR amends the import table. This note does not open that ADR, does not assign it to Module 4, and does not take the next ADR number. ADR-0009 exists only on the unmerged Module 1 branch. It is not on this branch.

`renderNull` stays empty. Its draw list is not a stroke list. No graphics API is selected.

No new dependency. No graphics library. No id minting in core.

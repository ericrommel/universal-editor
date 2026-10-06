**Role:** Tech Lead

**Status:** Preparation input for issue #9. Not a specification. Not implementation authorization. Not a Product Owner request.

**Date:** 2026-10-06

`origin/main` is `61cf9c9`. This branch contains that commit. The Module 2 preparation notes on it are recommendations, not an ADR. The Module 1 specification is the approved implementation contract. The Product Owner approved it on 2026-10-06: https://github.com/ericrommel/universal-editor/issues/7#issuecomment-6013883562. Sections 1 through 11 are that contract. Approval does not make Module 1 GREEN. The specification is not on `origin/main`.

`../reviews/tech-lead.md` was written before that approval and did not adopt the contract. It is not a second vote against the contract. The constraints below are what carry forward.

Archive section 9.4 identifiers are context, not operational requirements. Module 3 implementation still waits until Module 1 is GREEN, Module 2 is GREEN, and the Product Owner authorizes Module 3. This note does not implement product functionality.

## Closed document

Schema version token `1` rejects an unknown kind and an unknown key. Both failures are `INVALID_SHAPE`. The only kinds are `rectangle` and `box`. The document fields are the closed set in the contract: `formatId`, `schemaVersion`, `roots`, `nodes`, and on each node `id`, `kind`, `children`, `transform`, `width`, `height`, and `depth` only on a box. Text, a display name, appearance, an image reference, and a curve are not fields.

Do not loosen those closed-kind checks to make room for them. A silent extra field would make token `1` describe two different documents. A later document change is a new approved contract.

## Selection

Selection stays out of the scene, the document, and the Module 1 editor API. The contract keeps it out so editor state does not become part of the persistence model. Issue #45 must not put it back. A document key named `selection` is `INVALID_SHAPE`.

This does not decide whether a later manipulation module keeps selection in editor memory. The Module 2 disagreement on whether undo changes selection stays open.

## Order is not a draw list

Sibling order is the document's `roots` array and each node's `children` list. In memory those lists are `rootIds` and `childIds`. The `nodes` array is not order: the reader ignores it, and the in-memory `nodes` value is a record addressed by id.

Module 1 has no reorder operation. Insert places a new node at an index. That is not a reorder of nodes already in the scene. The list is hierarchy data, not visual proof, and this note does not select it as a stacking field.

`renderNull` stays an empty draw list. Do not open or assign the draw ADR, and do not decide which module draws. `editor` must not import `rendering`. A type-only import counts, and a test import counts. The shell must not import `rendering` to get around that table. A later viewport amends the import table in its own ADR. This note does not write that ADR.

## Undo step Module 2 recommended

Module 2 recommends one undo step for one committed transform replacement: the canonical before-triples and the canonical after-triples, in editor memory. That recommendation is not an ADR. The step does not survive reload. It is not the provisional manifest. It is not pointer samples.

Create, delete, duplicate, rename, an appearance change, and an extent replacement are not that step. Do not encode them as triple replacements. The shape only puts finite triples back. Using it for another operation would pretend that operation was `replaceTransform`.

Any later record of those other operations is editor memory, does not survive reload, is not the provisional manifest, and is not pointer samples. An insert or a delete may still change the scene document. That document result is not an undo record.

This does not choose a general command history. It does not resolve the four Module 2 disagreements: which part of a box a move targets, whether undo changes selection, which redo shortcut applies, and whether a later hit test is a CPU test or a pick buffer. It does not accept the numeric frame. Replacing triples is not a reading of those triples as a translation, a rotation, or a scale.

## Image bytes and caps

Image bytes stay out of `@uvcp/core`, out of the two-field manifest, and out of the scene document. The approved contract does place the scene value in `@uvcp/core` and the codec in `@uvcp/persistence`. That value still has no image bytes. The manifest stays `formatId` and `schemaVersion` only.

`1048576` is the scene-document cap. A document of that many bytes is inside the cap. The cap bounds a rectangle-and-box document, which holds no image bytes, so it is not an image budget. The manifest cap of 4096 is not an image budget either. `262144` is not a budget: the contract superseded that figure, and the figure did not state a node budget.

ADR-0006 still has not selected a container. Do not select one.

## Identifiers

Ids stay caller-supplied. Core does not mint ids. It does not read a clock or a random source to do so. This note adds no dependency, no ADR, no test, and no workflow change.

## Not selected

This note does not select the shape set, raster formats, a container, a stacking field, a text-editing UI, a color encoding, an undo product policy, or which module draws.

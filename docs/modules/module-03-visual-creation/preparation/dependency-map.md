# Module 3 — dependency map

**Role:** Project Manager

**Status:** Preparation for issue #9. This map is not an operational specification, not implementation authorization, and not a request for a Product Owner decision.

Definition of Ready is not met. The checklist is section 8.

## 1. Program state

Checked against `main` at `61cf9c9` and the GitHub issues on 2026-10-06. This branch contains that `main`. The approved Module 1 contract is not on `main`.

| Module | Issue | State that bounds Module 3 |
| --- | --- | --- |
| Module 0 — Engineering Foundation | [#1](https://github.com/ericrommel/universal-editor/issues/1), closed | GREEN at historical `main` `5e99484`. The Product Owner approved the module at [issuecomment-6004334244](https://github.com/ericrommel/universal-editor/issues/1#issuecomment-6004334244). Current `main` is `61cf9c9`. Later commits do not reopen Module 0. |
| Module 1 — Unified Scene | [#7](https://github.com/ericrommel/universal-editor/issues/7) | The Product Owner approved pull request [#50](https://github.com/ericrommel/universal-editor/pull/50) as the implementation contract ([issuecomment-6013883562](https://github.com/ericrommel/universal-editor/issues/7#issuecomment-6013883562)). Head `13f1725`. The pull request is not merged. Module 1 is not GREEN. That approval authorizes implementation of the contract only. Pull requests [#32](https://github.com/ericrommel/universal-editor/pull/32), [#33](https://github.com/ericrommel/universal-editor/pull/33), and [#34](https://github.com/ericrommel/universal-editor/pull/34) are the earlier input record. They are not a second contract. |
| Module 2 — Direct Manipulation | [#8](https://github.com/ericrommel/universal-editor/issues/8) | Preparation notes are on `main` at `61b86f3`. The index is `docs/modules/module-02-direct-manipulation/preparation/README.md`. Issues [#35](https://github.com/ericrommel/universal-editor/issues/35) through [#39](https://github.com/ericrommel/universal-editor/issues/39) are closed as inputs. [#40](https://github.com/ericrommel/universal-editor/issues/40) through [#42](https://github.com/ericrommel/universal-editor/issues/42) stay blocked. The notes are not a specification, not an ADR, and not a viewport or an undo API. Module 2 is not GREEN. |
| Module 3 — Visual Creation | [#9](https://github.com/ericrommel/universal-editor/issues/9) | This preparation. Archive section 9.4 does not freeze its scope. |

Development process section 2 allows research, architecture, design, and test design for a later module before the predecessor is GREEN. Section 20 allows implementation of the next module only after the predecessor is GREEN and the Product Owner has approved it. Module 3 implementation waits until Module 2 is GREEN, which waits until Module 1 is GREEN.

## 2. Shipped contracts

These are on `main`. A later slice that contradicts one of them needs its own decision.

**Domain.** `@uvcp/core` exports `DomainError`, `canonicalizeFiniteNumber`, and `canonicalizeFiniteTriple`. Finite numbers pass. `-0` becomes `0`. Non-finite values throw `NON_FINITE_NUMBER`. There is no scene type, vector type, id generator, clock, random source, or filesystem read. The triple is not an axis or a rotation order. ADR-0006.

**Manifest.** `writeManifest` takes no document and returns the UTF-8 bytes `{"formatId":"universal-visual-creation-project","schemaVersion":1}`. `readManifest` applies a 4096-byte cap to that manifest only. The cap is not a project-size limit (`packages/persistence/src/manifest.ts`). `JSON.parse` is the syntax authority. A host `RangeError` is `INVALID_JSON`. There is no nesting limit.

**Names that are entry names.** `checkEntryNames` checks NFC, length, relative slash segments, and ASCII case-fold collisions. It extracts nothing. ASCII case-fold does not cover every Unicode case collision. ADR-0006 makes that gap a review item before the first real archive reader. A display name is not an entry name.

**Container and undo.** ADR-0006 compared a manifest plus a document plus asset entries, one JSON file, SQLite, and a custom binary document. None is selected. The same ADR says a single JSON file is a poor fit once images exist, because the bytes become base64 or the format has to change. No undo strategy is selected. No undo API exists. The manifest is not a history log.

**Editor and screen.** `EditorSession` is `starting`, `ready`, or `failed`. ADR-0008 leaves out selection, tools, panels, and undo, and says empty fields would become an API. The foundation screen purpose string says creation tools are not part of this build (`packages/ui/src/strings.ts`). There is no viewport, canvas, toolbar, or hierarchy.

**Renderer.** `renderNull` returns a frozen snapshot, opaque sRGB black, an empty draw list, backend `null`, and device `not-requested`. ADR-0003 makes that object a Module 0 test double. It is not a promise that one draw list paints flat and spatial items. Architecture section 15: scene correctness is a CPU check of snapshot data, not a GPU image. Filling the empty list fails the Module 0 tests.

**Imports.** `editor` must not import `rendering`. `shell` must not import `core`, `persistence`, or `rendering`. Architecture section 10: a later viewport amends that table in a new ADR before `editor` may call the renderer. `@uvcp/platform` has no runtime export.

**Gate.** `pnpm verify` is the regression command: boundaries, `tsc -b`, Biome, license check, `pnpm audit --audit-level=high`, `pnpm test`, `pnpm build`, and the loopback preview smoke. GitHub Actions runs it on `ubuntu-24.04` and `windows-2025`. The preview smoke rejects a canvas in the production build. Pipeline timings are observations.

## 3. Work that can start now

This is preparation. It does not add a scene, a shape, text, an image decoder, a font, a viewport, an undo stack, a dependency, or a workflow.

| Key | Issue | Work | Outcome of this pass |
| --- | --- | --- | --- |
| M3-NOW-01 | [#44](https://github.com/ericrommel/universal-editor/issues/44) | Dependency map and specialist constraint notes | This directory |
| M3-NOW-02 | [#44](https://github.com/ericrommel/universal-editor/issues/44) | Keep image bytes out of the provisional manifest and out of core | Recorded in section 2 and in the security and core notes. No decoder is added. |
| M3-NOW-03 | [#44](https://github.com/ericrommel/universal-editor/issues/44) | Keep `renderNull`'s draw list empty | Recorded in the rendering note. The Module 0 test stays the lock. |
| M3-NOW-04 | [#44](https://github.com/ericrommel/universal-editor/issues/44) | Keep creation tools off the foundation screen | Recorded in the design and editor notes. |
| M3-NOW-05 | [#44](https://github.com/ericrommel/universal-editor/issues/44) | Verification map with no expected result for Module 3 behavior | Recorded in the quality notes. No Module 3 test file is added. |
| M3-NOW-06 | [#44](https://github.com/ericrommel/universal-editor/issues/44) | Record how creation data attaches to the approved Module 1 contract and the Module 2 seam | [inherited/README.md](inherited/README.md). No schema is written. |

This pass does not write a creation-data schema. The approved contract stays closed, and pull request #33 is not a second contract.

No Product Owner decision is required to finish this pass. The decisions in section 6 block implementation. They do not block the record.

## 4. Work blocked on Module 1

The scene contract is approved and is not on this branch. Module 1 is not GREEN. Schema version token `1` rejects an unknown kind and an unknown key with `INVALID_SHAPE`. This preparation does not amend that document.

Implementation of every package in this section waits until issue #7 is GREEN under that contract and the Product Owner authorizes Module 3. Until then, these packages stay closed.

### M3-DEP-M1-01 — Creation data on the approved scene

Issue [#45](https://github.com/ericrommel/universal-editor/issues/45), blocked by [#7](https://github.com/ericrommel/universal-editor/issues/7).

The approved contract already stores a rectangle or a box, caller-supplied ids, extents strictly greater than zero, transforms, and sibling order on `roots` and each children list. Insert takes an index. Delete removes the subtree. `replaceTransform` and `replaceExtents` return a new scene. The document has no selection.

This package, when it is later authorized, is only what that contract does not store:

- visual kinds other than `rectangle` and `box`;
- a display name that rename can change;
- duplicate, as a new insert whose id the caller supplies (M1-FR-009; core does not mint an id);
- appearance numbers for fill, color, and opacity, passed through `canonicalizeFiniteNumber`, which are not extents;
- a text payload stored as data;
- an image reference stored as data, with the bytes kept out of `@uvcp/core` and out of the scene document;
- a later reorder of an existing node. The approved contract has no reorder operation. `nodes` array order is not hierarchy.

Those values are unknown keys on schema token `1`. Adding them is a new document contract. This preparation does not write that contract and does not choose the kind list, the name rules, or the appearance encoding.

Sibling order already exists. This package does not add a second order field. Pixel evidence is M3-DEP-M2-02.

### M3-DEP-M1-02 — Text, appearance, and image bytes in an approved container

Issue [#46](https://github.com/ericrommel/universal-editor/issues/46), blocked by [#7](https://github.com/ericrommel/universal-editor/issues/7).

The provisional manifest stays the two-field writer. Raising its 4096-byte cap does not create a project file.

ADR-0006 already records why image bytes do not belong in one JSON document. The container is still unselected. `checkEntryNames` is not an extractor. The Unicode case-fold gap is open again before the first archive reader.

The approved scene-document cap is 1048576 bytes. The reconciliation states that this document contains no meshes and no images. That cap is not an image budget. The 262144-byte figure from pull request #33 is not the scene cap and is not an image budget. ADR-0006 still has not selected a container. Putting image bytes into this JSON document is the shape that ADR says becomes base64 or forces a format change.

Done for this package means an approved document round-trips the text and appearance it claims to store, image bytes live in the approved container, and a failed read yields no scene. Implementation waits for that approval.

## 5. Work blocked on Module 2

Module 2's preparation notes are on `main`. They are not a specification and not an ADR. These packages stay closed while Module 1 is not GREEN, because section 20 runs in order. The notes do not open them.

### M3-DEP-M2-01 — Selection, transform, and undo participation

Issue [#47](https://github.com/ericrommel/universal-editor/issues/47), blocked by [#7](https://github.com/ericrommel/universal-editor/issues/7) and [#8](https://github.com/ericrommel/universal-editor/issues/8).

New visual objects use the selection, transform, and undo model Module 2 actually approves. They do not grow a second one. Selection is not a field of the approved scene document.

ADR-0006 selected no undo strategy. `EditorSession` has no undo stack. The Module 2 notes recommend one undo step for one committed transform replacement: canonical before-triples and after-triples in editor memory. Pointer samples are not steps. The stack does not survive reload. Create, delete, duplicate, rename, reorder, an appearance change, and an extent replacement are not that step. If Module 2 later approves only the transform step, those operations stay blocked after Module 2 is GREEN. This package does not choose the strategy and does not resolve Module 2's open disagreements.

ADR-0008: do not add empty selection or tool fields to the startup session.

### M3-DEP-M2-02 — Visible ordering

Issue [#48](https://github.com/ericrommel/universal-editor/issues/48), blocked by [#7](https://github.com/ericrommel/universal-editor/issues/7) and [#8](https://github.com/ericrommel/universal-editor/issues/8).

Data order is the approved `roots` list and each children list. Visible order needs a draw path. This package does not add a stacking field.

`renderNull` stays empty until a new ADR amends the import table and authorizes a non-empty snapshot. Module 2's notes do not add that ADR. This package stays blocked on issue #8 and on that ADR. Closing issue #8 is not enough if Module 2 ships no draw list. The owning module for the ADR is not decided here.

The proof, when a draw path exists, is a CPU check of snapshot data. Architecture section 15. A GPU image is not the oracle. No graphics API is selected.

Which module is allowed to write that ADR is not decided here. Assigning it to Module 3 now would implement a viewport inside preparation.

### M3-DEP-M2-03 — Default creation surface

Issue [#49](https://github.com/ericrommel/universal-editor/issues/49), blocked by [#7](https://github.com/ericrommel/universal-editor/issues/7) and [#8](https://github.com/ericrommel/universal-editor/issues/8).

The foundation screen is not the creation interface. Its copy says creation tools are not part of this build. A disabled toolbar on that screen is a layout the Module 0 design review rejected.

This package starts when Module 1 has objects to create, Module 2 has a place to show the result, and a design for the default creation interface is approved. Discoverability cannot be evidenced before that surface exists.

## 6. Decisions that block implementation and are premature now

These are real. Asking for them before Module 1 has one approved scene contract would freeze Module 3 against an unsettled predecessor. This map does not ask the Product Owner to answer them.

| Decision | Why it can wait |
| --- | --- |
| Which shapes are "basic" beyond rectangle and box | The approved contract's kinds are closed. Further kinds are a later product contract. This map does not open one. |
| Raster formats, pixel limits, and byte limits | No container and no decoder are selected. 1048576 is the scene-document cap, not an image budget. |
| Where image bytes live | ADR-0006 leaves the container open. The approved scene document contains no images. |
| A stacking field besides sibling order | Sibling order is `roots` and the children lists. A second field would be a new document contract. Visual proof is still M3-DEP-M2-02. |
| Inline text editing or a separate field | No text object and no viewport exist. Text is not a schema-1 field. |
| Numeric encoding of color and opacity | The canonicalizers constrain finiteness only. Appearance is not an extent. |
| How a caller chooses a duplicate's id | Core does not mint ids. M1-FR-009 already requires a caller-supplied id. The user-facing rule for choosing that id is not selected. |
| Undo as a general command model | Deferred in ADR-0006. The Module 2 recommendation covers a transform-triple replacement only. |
| Which module first replaces the empty draw list | Architecture requires a new ADR. Module 2's notes do not write it. It is not assigned to Module 3. |

## 7. Order after the gates open

This sequence is the recommended order for later issues. It is not authorization to start.

1. Module 1 reaches GREEN under the approved pull request #50 contract.
2. M3-DEP-M1-01 specifies creation data against that contract, as a new document contract. Schema token `1` is not extended in place.
3. M3-DEP-M1-02 places text, appearance, and image bytes in the container that contract, or a follow-on ADR, actually selects.
4. Module 2 reaches GREEN, including whatever undo and viewport it actually approved.
5. M3-DEP-M2-01 attaches new objects to that interaction model.
6. A draw ADR, owned by whichever module is authorized to draw, amends the import table. M3-DEP-M2-02 then proves order from snapshot data.
7. A design for the default creation interface is approved. M3-DEP-M2-03 implements it off the foundation screen.
8. Module 3's own Definition of Ready goes to the Product Owner. Implementation starts only after that approval.

## 8. Definition of Ready

| Ready bullet | Module 3 |
| --- | --- |
| Objective, scope, and out-of-scope are explicit | Not met. Issue #9 is still the backlog objective plus this dependency map. Archive section 9.4 is context. |
| Dependencies identified | Met by this map. |
| Earlier modules approved | Not met. The Module 1 contract is approved for implementation. Module 1 and Module 2 are not GREEN. |
| Stable requirement identifiers | Not met. Archive identifiers stay context. |
| Acceptance criteria observable | Not met. Quality notes refuse an expected result for Module 3 behavior. The approved Module 1 rows are no longer the reason. |
| Test approach, or a documented reason to defer | Not met. The functional note records why no expected result can be written. That deferral is not an approach for a requirement that does not exist yet. Infrastructure for images and pixels is not defined. |
| Design behavior defined | Not met. The creation surface does not exist. The foundation screen must stay as it is. |
| Reference workloads | Not met. None is defined. This preparation does not invent one. |
| Blocking security questions resolved | Not met for implementation. The ingress boundary is named. Formats, limits, and the container are open. |
| Blocking architecture resolved | Not met. The Module 1 scene schema is approved and closed. A Module 3 document, the container, the undo policy, and the draw-list ADR are open. |
| Product ambiguities resolved | Not met. Section 6. |
| Product Owner authorizes implementation | Not requested. |

## 9. Specialist records

The notes under [reviews](reviews) are the first role records. [inherited/README.md](inherited/README.md) is the later integration. Neither moves issue #9 to Ready for PO.

## 10. Repository effect

This preparation adds documents. It does not change runtime behavior, the verify workflow, package dependencies, or the Module 0 tests.

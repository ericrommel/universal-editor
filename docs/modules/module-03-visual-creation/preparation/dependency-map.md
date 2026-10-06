# Module 3 — dependency map

**Role:** Project Manager

**Status:** Preparation for issue #9. This map is not an operational specification, not implementation authorization, and not a request for a Product Owner decision.

Definition of Ready is not met. The checklist is section 8.

## 1. Program state

Checked against `main` at `5e99484` and the GitHub issues on 2026-10-06.

| Module | Issue | State that bounds Module 3 |
| --- | --- | --- |
| Module 0 — Engineering Foundation | [#1](https://github.com/ericrommel/universal-editor/issues/1), closed | GREEN. The Product Owner approved the module at [issuecomment-6004334244](https://github.com/ericrommel/universal-editor/issues/1#issuecomment-6004334244). `main` is `5e99484`. |
| Module 1 — Unified Scene | [#7](https://github.com/ericrommel/universal-editor/issues/7) | Preparation only. Pull requests [#32](https://github.com/ericrommel/universal-editor/pull/32), [#33](https://github.com/ericrommel/universal-editor/pull/33), and [#34](https://github.com/ericrommel/universal-editor/pull/34) are open. They are not implementation authorization. Five rows still have two expected results: selection storage, extents, document shape and byte cap, insert and delete, and stable error codes. The Product Owner's Module 0 approval says Module 1 may proceed beyond preparation only through its own readiness gate. That gate is not met. |
| Module 2 — Direct Manipulation | [#8](https://github.com/ericrommel/universal-editor/issues/8) | Backlog placeholder. No comments, no specification, no branch, no viewport. |
| Module 3 — Visual Creation | [#9](https://github.com/ericrommel/universal-editor/issues/9) | This preparation. The issue was a backlog placeholder. Archive section 9.4 does not freeze its scope. |

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
| M3-NOW-05 | [#44](https://github.com/ericrommel/universal-editor/issues/44) | Verification map with no expected result where the predecessor is unsettled | Recorded in the quality notes. No Module 3 test file is added. |

A Module 3 object schema written against pull request #33 would be a second unapproved contract. This pass does not write one.

No Product Owner decision is required to finish this pass. The decisions in section 6 block implementation. They do not block the record.

## 4. Work blocked on Module 1

Start condition for every package in this section: issue #7 is GREEN, and the approved scene contract has one expected result for each row that still disagrees. Until then, these packages stay closed.

### M3-DEP-M1-01 — Creation data on the approved scene

Issue [#45](https://github.com/ericrommel/universal-editor/issues/45), blocked by [#7](https://github.com/ericrommel/universal-editor/issues/7).

Add only what the approved scene does not already store:

- visual kinds beyond the approved set;
- a display name that rename can change;
- duplicate, using an id rule the approved model already has, or a new ADR if it has none (core still has no id generator);
- appearance numbers for fill, color, and opacity, passed through `canonicalizeFiniteNumber`;
- a text payload stored as data;
- an image reference stored as data, with the bytes kept out of `@uvcp/core`;
- an ordering change on the order the approved hierarchy already stores.

If the approved hierarchy has no order, the order field is part of this package and the pixels are not. Pixel evidence is M3-DEP-M2-02.

The unapproved Module 1 proposal is a headless rectangle and box, with no text, image, name, appearance, undo, or viewport. It is contested. It is not the baseline this package may extend until it is approved.

### M3-DEP-M1-02 — Text, appearance, and image bytes in an approved container

Issue [#46](https://github.com/ericrommel/universal-editor/issues/46), blocked by [#7](https://github.com/ericrommel/universal-editor/issues/7).

The provisional manifest stays the two-field writer. Raising its 4096-byte cap does not create a project file.

ADR-0006 already records why image bytes do not belong in one JSON document. The container is still unselected. `checkEntryNames` is not an extractor. The Unicode case-fold gap is open again before the first archive reader.

The 262144-byte figure in the unapproved Module 1 proposal is not a limit and is not an image budget. A document cap of that order still does not hold a typical raster.

Done for this package means an approved document round-trips the text and appearance it claims to store, image bytes live in the approved container, and a failed read yields no scene. Implementation waits for that approval.

## 5. Work blocked on Module 2

Issue #8 has no specification. These packages also stay closed while Module 1 is open, because section 20 runs in order.

### M3-DEP-M2-01 — Selection, transform, and undo participation

Issue [#47](https://github.com/ericrommel/universal-editor/issues/47), blocked by [#7](https://github.com/ericrommel/universal-editor/issues/7) and [#8](https://github.com/ericrommel/universal-editor/issues/8).

New visual objects use the selection, transform, and undo model Module 2 actually approves. They do not grow a second one.

ADR-0006 selected no undo strategy. `EditorSession` has no undo stack. Archive Module 2 describes undo of transforms. Archive Module 3 describes undo of creation, deletion, duplication, and appearance. If the approved Module 2 model covers only transforms, the other operations stay blocked after Module 2 is GREEN. This package does not choose the strategy.

ADR-0008: do not add empty selection or tool fields to the startup session.

### M3-DEP-M2-02 — Visible ordering

Issue [#48](https://github.com/ericrommel/universal-editor/issues/48), blocked by [#7](https://github.com/ericrommel/universal-editor/issues/7) and [#8](https://github.com/ericrommel/universal-editor/issues/8).

Data order is M3-DEP-M1-01. Visible order needs a draw path.

`renderNull` stays empty until a new ADR amends the import table and authorizes a non-empty snapshot. Module 2's backlog is viewport interaction, and that ADR does not exist. This package stays blocked on issue #8 and on that ADR. Unblocking issue #8 is not enough if Module 2 ships no draw list.

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
| Which shapes are "basic" | The approved scene has no kinds yet. The Module 1 proposal's rectangle is contested and is not a shape set. |
| Raster formats, pixel limits, and byte limits | No container and no decoder are selected. A number chosen now would become an unapproved budget. |
| Where image bytes live | ADR-0006 leaves the container open on purpose. |
| Sibling order or a separate stacking field | No approved hierarchy exists to attach either one to. |
| Inline text editing or a separate field | No text object and no viewport exist. |
| Numeric encoding of color and opacity | The canonicalizers constrain finiteness only. |
| Id source for duplicate | Core has no clock and no random source. The caller-supplied id in the Module 1 proposal is not approved. |
| Undo as a general command model | Deferred in ADR-0006. Module 2 has not started. |
| Which module first replaces the empty draw list | Architecture requires a new ADR. Module 2 has not written it. |

## 7. Order after the gates open

This sequence is the recommended order for later issues. It is not authorization to start.

1. Module 1 reaches GREEN under its own approved contract.
2. M3-DEP-M1-01 specifies creation data against that contract.
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
| Earlier modules approved | Not met. Module 1 and Module 2 are not GREEN. |
| Stable requirement identifiers | Not met. Archive identifiers stay context. |
| Acceptance criteria observable | Not met. Quality notes refuse an expected result where the predecessor disagrees. |
| Test approach, or a documented reason to defer | Not met. The functional note records why no expected result can be written. That deferral is not an approach for a requirement that does not exist yet. Infrastructure for images and pixels is not defined. |
| Design behavior defined | Not met. The creation surface does not exist. The foundation screen must stay as it is. |
| Reference workloads | Not met. None is defined. This preparation does not invent one. |
| Blocking security questions resolved | Not met for implementation. The ingress boundary is named. Formats, limits, and the container are open. |
| Blocking architecture resolved | Not met. Scene schema, container, undo, and the draw-list ADR are open. |
| Product ambiguities resolved | Not met. Section 6. |
| Product Owner authorizes implementation | Not requested. |

## 9. Specialist records

The notes under [reviews](reviews) are the role records. They do not move issue #9 to Ready for PO.

## 10. Repository effect

This preparation adds documents. It does not change runtime behavior, the verify workflow, package dependencies, or the Module 0 tests.

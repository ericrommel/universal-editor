# Module 3 preparation — verification map

**Role:** Functional Quality Engineer

**Status:** Preparation note for issue #9, on `m3/preparation` at `5e99484` (2026-10-06). Definition of Ready is not met. This is not a test plan, not a set of stable identifiers, not implementation authorization, and not a request for the Product Owner to approve scope. It does not move issue #9.

Archive section 9.4 is context. Identifiers in the table point back at those sentences. They are not operational requirements. The phrases are restatements, not promoted criteria.

Development process section 9 is a test plan written after operational identifiers exist. This file is not that plan. No test file and no fixture is added.

## 1. Status

Development process section 8 is not met.

The dependency map marks "dependencies are identified" as met. This note uses that map and does not fail that bullet.

These bullets fail:

- Objective, scope, and out-of-scope behavior are not explicit. Issue #9 has no operational specification. The archive objective is context only.
- Required earlier modules are not approved. Module 0 is GREEN at `5e99484`. Module 1 has no approved contract (issue #7; pull requests #32, #33, and #34 are open). Module 2 has no specification, no viewport, and no tests (issue #8).
- FR, NFR, and AC identifiers are not stable. None are minted here.
- Acceptance criteria are not observable or testable. The archive uses undefined sets: a defined shape list, a supported raster, applicable objects, basic appearance, expected visual ordering, and primary actions versus advanced panels.
- An appropriate test approach does not exist for every operational FR, NFR, and AC. There are no operational identifiers to attach one to. A written deferral of an archive sentence is not an approach for a requirement. The dependency map, section 8, records this bullet as not met for that reason. Where the behavior is undecided, this note's only result text is "blocked; no expected result."
- Required design behavior is not defined. There is no creation UI. The foundation screen says creation tools are not part of this build (`packages/ui/src/strings.ts`).
- Required test infrastructure and reference workloads are not defined. None is invented here.
- Blocking trust-boundary questions for image input are not resolved. Accepted types, where the bytes live, and how a failure is shown are open. This note is not a security review and does not close that bullet.
- Blocking architectural decisions are not resolved. ADR-0006 deferred the scene schema, the container, and the undo strategy. ADR-0003 keeps the null-renderer draw list empty until a later ADR. There is no viewport.
- Blocking product ambiguities are not resolved. The dependency map, section 6, lists them. This note does not ask the Product Owner to answer them.
- The Product Owner has not authorized implementation. This note does not ask for that authorization.

## 2. Regression that can be stated now

`pnpm verify` on the current tree remains the gate. Architecture section 11 runs, in order, and returns the first non-zero exit: boundary check, `tsc -b`, Biome, license check, `pnpm audit --audit-level=high`, `pnpm test`, `pnpm build`, and the headless preview smoke. `pnpm test` is `node:test` via `node --test` for `*.test.ts` and `*.test.mjs`. It must not start Vite or open a window. A test import counts as a boundary edge (architecture section 10).

No new runner. Vitest, Jest, jsdom, happy-dom, Playwright, and Cypress are not added. Architecture sections 12 and 14. No Module 0 check is dropped. That includes the empty draw list, the foundation screen, and a preview smoke that rejects a canvas. The smoke is build evidence. It is not the graphical launch and not a scene proof.

Archive context M3-NFR-005 says approved earlier-module tests stay green. The paragraph above is that sentence applied to the shipped gate. It is not a new Module 3 scenario and it has no new identifier.

This note does not re-run the suite.

## 3. Archive ambitions

The contested Module 1 plan put two expected results on rows for selection storage, extents, document shape and byte cap, insert and delete, and error codes. Pull request #33 and the reviews on pull request #32 still disagree. This map does not repeat that failure, and it does not pick a side. A row here does not assume a rectangle-and-box pair, a 262144-byte cap, or selection stored in the document.

There is no scene, no image ingest, no text object, no undo API, and no creation UI. The shipped manifest is two fields. Its 4096-byte cap applies to that manifest only and is not a project limit. `checkEntryNames` is not a display-name check. Core has no id generator. `canonicalizeFiniteNumber` rejects non-finite numbers and does not define a color or an opacity encoding.

For every row, no test can be written now. The only result text is: blocked; no expected result. The observable column is what a later single-valued contract would have to make visible. It is not a pass sentence.

| Archive context | Observable behavior once a contract exists | Predecessor | Can a test be written now | Why not |
| --- | --- | --- | --- | --- |
| M3-FR-001 | Create a defined set of basic flat shapes. The scene model would show one new object of a kind the contract lists, and no extra object. | Module 1 scene and insert. No creation UI. | No | No scene and no set. Naming any shape, including a rectangle, would take a side of the Module 1 kind and extent dissent or invent the set. blocked; no expected result. |
| M3-FR-002 | Create a text object and change its text. The model would return the content the contract calls current. | Module 1, for a node that can hold a payload. No text type. Selection storage is contested, so an edit of "the selected text" has no target. Module 2 has no viewport if editing is an interaction. | No | Inline editing and a separate field are both undecided. Writing either behavior would be a second result. blocked; no expected result. |
| M3-FR-003 | Import one supported raster as a scene object. The model would show that object, and the bytes would live only where the contract places them. | Module 1 document shape. No ingest API. ADR-0006 selected no container. | No | No supported-type list. The two-field manifest and core are not an image store. The 262144-byte figure in pull request #33 is not a limit and not an image budget. blocked; no expected result. |
| M3-NFR-002, M3-AC-004 | Reject invalid image input. A person would see an error, no object would be added, and the project would still load as it did. | Same ingest gap as M3-FR-003. No defined error surface. Module 1 error codes still disagree. | No | Which inputs fail, what "visible" means, and which code is used are open. None is written. The foundation screen is not that surface. blocked; no expected result. |
| M3-FR-004, M3-AC-003 | Change the order of applicable objects, including when they overlap. A later check would read the one order the contract names. | Module 1 hierarchy. Insert position is contested, so stored order is not single-valued. Module 2 has no viewport. The draw list stays empty until a later ADR. | No | A data-order proof waits on an approved hierarchy. A proof that needs pixels waits on a draw path. Headless tests cannot prove pixels. Architecture section 15 says scene correctness is a CPU check of snapshot data, and this snapshot cannot hold that data yet. Writing either proof as the pass result would invent the contract. Writing both would put two results on one row. blocked; no expected result. |
| M3-FR-005 | Expose basic fill, color, and opacity on applicable objects. The model would store and return the fields the contract names. | Module 1 object fields and document shape. No appearance model. | No | Range, color space, and which objects apply are undefined. A number would be an invented limit. Finiteness alone is not that contract. blocked; no expected result. |
| M3-FR-006 (rename) | Rename a supported object. One stored display name would change. The object's other approved fields would not. | Module 1 identity and document shape. No name field. | No | No object exists. The entry-name helper is not a rename oracle. Where a name sits is part of the contested document shape. blocked; no expected result. |
| M3-FR-006 (duplicate) | Duplicate a supported object. A second object would exist, with a distinct identity and the copied fields the contract names. The source would remain. | Module 1 insert, contested as append versus an index. No approved id source. Core mints no ids. | No | Expecting the copy at the end, or between siblings, would pick the insert dissent. Expecting a generated id would invent an id source. blocked; no expected result. |
| M3-AC-001 | One scene holds text, an imported image, a flat shape, and a 3D primitive at the same time. | Module 1 closed kinds and one hierarchy. Text, image, and any shape set do not exist. | No | The flat shape and the 3D primitive are not approved kinds. Assuming a rectangle and a box would pick the contested Module 1 pair. blocked; no expected result. |
| M3-AC-005 | Undo and redo cover create, delete, duplicate, and a supported appearance change. After undo the model would match the prior value. After redo it would match the later value. | No undo API. ADR-0006 selected no strategy. Module 2 has no specification. Module 1 insert and delete still disagree, so a prior scene after delete is not single-valued. | No | Inverse patches, full-document snapshots, and an event log were compared and not chosen. Archive Module 2 describes transform undo. That does not by itself cover these four operations, even after Module 2 exists. Naming one strategy would decide the ADR. blocked; no expected result. |
| M3-NFR-003; M3-AC-002 save and restore | Text content and in-scope appearance survive save and reload. A model read after reload would match the model from before the save. | Module 1 persistence. Document shape and any byte cap are contested. Module 0 has no scene writer. | No | A round-trip would have to choose a document shape and a size limit. Those are the Module 1 dissent. "In-scope" appearance is not defined. The two-field manifest round-trip is a Module 0 check and is not this row. blocked; no expected result. |
| M3-NFR-004 | Primary creation actions are findable on the default creation surface, without opening an advanced panel. | No creation UI. Module 2 has no viewport and no specification. Design behavior is not defined. Module 1 has no objects to create. | No | Discoverability is not a headless model check. The foundation screen is not the creation surface. Adding a control there, including a disabled one, would change a Module 0 result. "Primary" and "advanced" are undefined. blocked; no expected result. |

Archive context M3-NFR-001, and the select and transform clauses of archive context M3-AC-002, are the same block. New objects would have to join one approved hierarchy, transform, selection, persistence, and undo model. Selection still has two homes in the Module 1 disagreement: inside the document, or outside it. This note writes neither home. A test must not both require the bytes to keep the selection and require a selection field to reject the document. Transform interaction has no Module 2 specification. blocked; no expected result.

Archive context M3-NFR-005 is section 2. It is not a row above.

## 4. Evidence types later

These are kinds of evidence a later test plan could name. They are not scheduled, not assigned to a milestone, and not fixtures.

- Headless model test. Architecture section 12: `node:test` through `pnpm test`, inside `pnpm verify`. A future test would read approved scene or document data. It would not open a window. It would not import `rendering` from `editor`, or `core` from `shell`, while architecture section 10 still forbids those edges.
- CPU snapshot. Architecture section 15: once a scene is drawn, correctness is still a CPU check of model or snapshot data, not a GPU image. The null renderer draw list is empty and must stay empty until a later ADR. This note does not fill it. A future ordering proof that needs pixels stays blocked. A future data-order proof stays blocked on an approved hierarchy.
- Headed design review. Architecture section 14: graphical launch is a manual step on the primary environment. For Module 0 that evidence was the foundation screen only. Playwright stays deferred. A later review of an approved creation surface would be this kind of evidence. It is not a screenshot diff and not a CI gate.

## 5. What this note refuses to write

- Stable Module 3 requirement ids, test-plan ids, or pass/fail rows.
- Expected numeric limits: byte caps, image dimensions, text length, shape counts, color channels, or opacity ranges. The 4096-byte manifest cap and the contested 262144-byte figure are not reused as budgets.
- A shape list, a raster-format list, or an error-code list.
- Screenshot baselines, golden images, or a canvas in the shell.
- Test files, fixtures, a workload, or a change to `pnpm verify`.

A later plan can use the archive context column to find the sentence. That plan waits until an approved contract makes each row single-valued, and until the Product Owner authorizes implementation. This note asks for neither.

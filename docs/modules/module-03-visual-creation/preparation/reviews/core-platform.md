# Module 3 preparation — core and platform input

**Role:** Senior Core / Platform Engineer

**Status:** Preparation input for GitHub issue #9. This is not an operational specification, not implementation authorization, and not a Product Owner request.

## 1. Status and the question

What do the shipped Module 0 core and persistence contracts force on later visual-creation data, and which archive ambitions for shapes, text, images, ordering, appearance, rename, and duplicate have nowhere to live yet?

Module 0 is GREEN. The Human Product Owner's comment on issue #1 is Decision APPROVED, `main` at `5e99484`. Issue #1 is closed. This branch is `m3/preparation` at that same commit. That approval covers Module 0 only. It does not approve Module 1 or Module 3.

Issue #7 (Module 1) is still preparation. Pull requests #32, #33, and #34 are open and are not implementation authorization. Definition of Ready, development process section 8, is not met. Five dissent rows remain on pull request #32: selection storage, extents, document shape and byte cap, insert and delete, and stable error codes. This note does not resolve them.

Issue #8 (Module 2) is a backlog placeholder. Issue #9 is this preparation. The package split is `docs/modules/module-03-visual-creation/preparation/dependency-map.md`. Archive section 9.4 in `docs/archive/product-engineering-specification-v1.0.md` is context for the ambitions below. Its `M3-*` identifiers are not operational requirements.

Development process sections 2 and 20: Module N+1 must not enter implementation until Module N is GREEN and the Product Owner has approved it. Research and design for a future module may be written earlier. Future product functionality must not be implemented. Module 0 being GREEN does not open Module 3. Module 3 implementation waits on Module 2, which waits on Module 1. Neither later module is GREEN.

The Module 1 scene proposal was read from outside this branch: `docs/modules/module-01-unified-scene/specification.md` and `docs/engineering/adr/0009-scene-model-and-scene-document.md`. Both are marked proposed and not accepted. They are not on `main`. Where this note describes them, it describes an unsettled proposal, not a contract.

## 2. Shipped contracts a later creation model has to keep

These are the contracts on `main`. A later change that contradicts one of them needs its own decision. It is not a local cleanup, and it is not authorized by this note.

**Core.** `packages/core/src/index.ts` exports only `DomainError`, `canonicalizeFiniteNumber`, and `canonicalizeFiniteTriple`. There is no scene type, no node type, no id generator, no clock, no random source, and no filesystem. `packages/core/package.json` has no dependencies. Architecture section 6 and ADR-0006 record the same boundary.

- `packages/core/src/domain-error.ts`: `DomainError` carries a `code` string and a short message. It does not carry the rejected value.
- `packages/core/src/number.ts`: a finite number passes through `canonicalizeFiniteNumber`. `-0` becomes `0`. `NaN`, an infinity, and a non-number throw `NON_FINITE_NUMBER` with message `Expected a finite number.` The helper does not repair a bad value to `0`.
- `canonicalizeFiniteTriple` requires an array of three components and applies that same rule to each one. A value that is not three finite numbers fails with `NON_FINITE_NUMBER`. The returned triple is not an axis, a handedness, a rotation order, or a choice of degrees versus radians. ADR-0006 leaves those choices open. Architecture section 6 says the same.

**Persistence.** `packages/persistence/src/index.ts` exports `checkEntryNames`, the `ProvisionalManifest` type, `readManifest`, and `writeManifest`. Nothing else.

- `writeManifest` in `packages/persistence/src/manifest.ts` takes no document. It returns the UTF-8 bytes `{"formatId":"universal-visual-creation-project","schemaVersion":1}` with no BOM and no extra whitespace. The writer does not walk a caller-supplied object.
- `readManifest` accepts insignificant whitespace and either key order. Unknown keys, a missing field, a non-object, duplicate root keys (including escape-equivalent spellings), a format id other than the provisional string, and a `schemaVersion` token other than the integer `1` are rejected. `1.0` and `1e0` are not version `1`. The reader returns a new two-field value, not the parsed object.
- The reader cap is 4096 bytes, checked before decoding. The comment in `manifest.ts` says this cap is only the provisional manifest, not a project-size limit. Architecture section 8 says the same. The bytes over that cap are `TOO_LARGE`. They are not a scene that almost fit.
- `JSON.parse` is the syntax authority. The reader adds no nesting-depth limit. `SyntaxError` and `RangeError` from `JSON.parse` become `INVALID_JSON`. A document inside the byte cap can still throw `RangeError`. The host error is not the domain message.
- The format id is the provisional test string. ADR-0006 does not promise that the string survives until a user-facing save exists. Renaming it before that save is not a migration. There is no migrator, because there is no older file.

`checkEntryNames` in `packages/persistence/src/entry-name.ts` is a pure check. It does not open an archive and it does not return bytes. A name must be NFC, 1–255 UTF-8 bytes, and slash-separated relative segments. Empty segments, `.`, and `..` are rejected, which also rejects a leading or trailing slash. Backslash, colon, and ASCII controls (including NUL and `0x7F`) are rejected. Two names that collide under ASCII `A`–`Z` case-fold are `ENTRY_NAME_CONFLICT`. Any other rejection is `ENTRY_NAME_REJECTED`. The fold is not `String.toLowerCase`. ASCII case-fold does not cover every Unicode case collision. ADR-0006 accepts that gap only because Module 0 extracts nothing, and it makes the gap a review item before the first real archive reader. No such reader exists.

Shipped domain codes from these two packages are `NON_FINITE_NUMBER`, `EMPTY`, `TOO_LARGE`, `INVALID_ENCODING`, `INVALID_JSON`, `DUPLICATE_KEY`, `INVALID_SHAPE`, `UNSUPPORTED_FORMAT`, `UNSUPPORTED_SCHEMA_VERSION`, `ENTRY_NAME_REJECTED`, and `ENTRY_NAME_CONFLICT`. They describe the helpers above. They are not a scene-document code list. `DomainError` is not a closed registry. This note does not add codes. Stable error codes for the Module 1 proposal are one of the open dissent rows.

**Package edges.** Architecture sections 10 and 18: `core` imports no workspace package. `persistence` may import `core`. Neither may import React, a desktop SDK, DOM or browser UI types, `node:fs`, or `node:path` used as I/O. `packages/platform/src/index.ts` is `export {}`. Module 0 platform code has no filesystem or network API. The shell does not import `core` or `persistence`. There is no asset entry type and no project writer.

**Container and undo, studied and not selected.** ADR-0006 compared a manifest plus a domain document plus asset entries with one JSON file, SQLite, and a custom binary document. None is selected. The Module 0 manifest is JSON because it is two fields, not because the project format is one JSON file. ADR-0006 says a single JSON file is a poor fit once images and meshes appear, because they become base64 or force a format change. Inverse patches, full-document snapshots, and an event log were compared. None is selected. Architecture section 9: no undo API exists, and the manifest is not a history log. No clock port, random port, or filesystem port was added.

## 3. Archive ambitions with nowhere to live yet

Archive section 9.4 names additional 2D shapes, text, raster images, ordering, fill and opacity, rename, and duplicate. None of those values exist in `@uvcp/core` or `@uvcp/persistence`. The unapproved Module 1 proposal would add `rectangle` and `box` only. It excludes text, images, undo, names, appearance, and a viewport. It discusses a scene-document cap of 262144 bytes. That cap is not approved. This note does not adopt it as a Module 3 limit. A document of that size still cannot hold a typical raster.

Work on the items below cannot start. "Blocked on" names the missing contract. It is not a request for the Product Owner to decide it now.

**Additional shapes.** Blocked on an approved Module 1 scene contract, and on a later Product Owner decision for the set. Shipped core has no node and no kind. The proposal's closed pair (`rectangle`, `box`) is not approved, and insert, delete, extents, and the document that would hold a kind are dissent rows on pull request #32. This note does not choose the shape set, and it does not add a kind beside that pair.

**Text.** Blocked on an approved Module 1 scene contract, and on a later Product Owner decision. The proposal excludes text. Shipped core has no text value. This note does not decide whether text is a string field. Save and reload of text content, which the archive describes, is also blocked on the deferred container: there is no approved scene document and no selected project package for that text to survive in. The two-field manifest is not that document.

**Image bytes.** Blocked on the deferred container, and on an approved Module 1 scene contract before any reference could be domain data. Current packages force the split. Core must not gain filesystem access or image bytes. Architecture section 6 and section 18 already forbid that I/O in core, and persistence does not call the filesystem. A later image reference, if a scene contract ever has one, is domain data. The bytes belong at a persistence or platform boundary that does not exist yet. `platform` has no capability. `checkEntryNames` checks names and extracts nothing. Saying where bytes would have to sit is not a choice of zip, folder, SQLite, or a custom binary document. ADR-0006 left those unselected, and it already records why stuffing image bytes into one JSON document is a poor fit. The proposed 262144-byte cap is not a shelter for those bytes. An image decoder is not specified here. The archive's invalid-image failure has no boundary to attach to.

The ASCII case-fold gap stays a review item before the first real archive reader. There is no reader to review, so image entry names cannot be prepared by widening the shipped fold.

**Ordering.** Blocked on an approved Module 1 scene contract, on a later Product Owner decision, and on Module 2 interaction before a visual result can be shown. Shipped core has no child list and no order field. The proposal stores sibling order and appends on insert. Insert and delete are an open dissent row, so this note does not treat that list as the order model. It does not choose z-order versus sibling order. Archive text about overlapping objects also needs a viewport. Module 0 has no viewport. Issue #8 is a backlog placeholder, not an interaction contract.

**Fill and opacity.** Blocked on an approved Module 1 scene contract, on a later Product Owner decision, and on deferred undo before an appearance change could be reversed. The proposal excludes appearance. No fill or opacity field exists. If a later model stores numeric components, those numbers have to go through `canonicalizeFiniteNumber` or `canonicalizeFiniteTriple`. `-0` becomes `0`. A non-finite component throws `NON_FINITE_NUMBER` and does not change a scene, because there is no scene to change. This note does not choose a color space, `0`–`1` versus `0`–`255`, or a default fill. Persistence of appearance is also blocked on the deferred container. Undo of appearance changes has no API to join. Architecture section 9 and ADR-0006 selected none of the undo strategies they studied.

**Rename.** Blocked on an approved Module 1 scene contract, and on a later Product Owner decision about whether a display name is domain data. The proposed node is an id, a kind, a transform, kind-specific dimensions, and children. It has no name. Shipped core has no name. A name that must survive save is also blocked on the deferred container. This note does not add a name field to either the manifest or the unsettled scene proposal.

**Duplicate.** Blocked on an approved Module 1 scene contract. It is not blocked on a missing random helper that this role should add. Core has no clock and no random source, so it cannot mint an id. Caller-supplied ids are only in the Module 1 proposal. This note does not choose an id strategy. Copying a node also needs an insert rule, and insert and delete remain a dissent row. Undo of duplication is blocked on deferred undo, which Module 0 did not build and Module 2 has not been approved to build.

Archive text that new object types participate in one hierarchy, one transform, selection, persistence, and undo describes five systems. On `main`, the transform numbers have a canonicalizer and the other four systems do not exist. Selection storage in the proposal is itself a dissent row. Extending that proposal with creation fields would pick sides in those rows.

## 4. What this role can prepare now

The constraint list in sections 2 and 3 is the preparation this role can write without those decisions.

A Module 3 object schema written now would be a second unapproved contract on top of an unsettled Module 1 proposal. This note does not write one. It does not add a type, a codec, a test, a package, or a dependency. It does not move issue #9. It does not ask the Product Owner for a decision.

Definition of Ready is not met for Module 1, and Module 3 has no operational scope, no stable identifiers, and no approved scene to extend. Recording that is the useful output. Inventing the missing schema is not.

## 5. Recommendations that are safe, and explicit non-goals

Safe to keep, because each one restates a shipped contract or refuses a decision this note must not make:

- Leave `packages/core/src/index.ts` exporting only `DomainError`, `canonicalizeFiniteNumber`, and `canonicalizeFiniteTriple`. Do not add a scene, a text value, an image buffer, a clock, a random source, or a filesystem import so an archive ambition has somewhere to live.
- Leave `writeManifest` closed on the two-field bytes. Do not add keys or raise `schemaVersion` so the provisional manifest can carry shapes, text, names, or assets. A later creation document, if one is approved, is a new document. The Module 1 proposal already separates its scene document from `writeManifest`. That proposal is not approved, and its byte cap is not a limit to copy.
- Keep 4096 as the manifest cap only. Do not reuse it, and do not reuse 262144, as a project-size limit or an image-size limit.
- When a later approved model stores opacity or color components as numbers, run them through the shipped canonicalizers. Do not add a second numeric policy beside `packages/core/src/number.ts`.
- Keep image bytes out of core. A reference, if an approved scene later has one, is domain data. Bytes wait for a persistence or platform boundary that does not exist yet. Do not read that split as a container decision. ADR-0006's rejection of a single JSON file for images and meshes still stands, and it still does not select a replacement.
- Leave ASCII case-fold as shipped. Do not widen it while nothing is extracted. The Unicode gap is reviewed with the first real archive reader, not in this note.
- Do not resolve the five dissent rows on pull request #32.

Explicit non-goals:

- No operational Module 3 specification. `M3-*` identifiers stay archive context.
- No scene type, node type, image decoder, text type, undo stack, viewport, or dependency.
- No choice of shape set, z-order versus sibling order, whether text is a string field, color space, component range, default fill, or id strategy.
- No selected container and no selected undo strategy.
- No Product Owner request, and no claim that Module 1 or Module 3 is approved. Issue #1's approval does not extend to them. Pull requests #32, #33, and #34 are not implementation authorization.

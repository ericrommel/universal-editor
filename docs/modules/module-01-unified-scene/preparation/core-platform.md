# Module 1 preparation — core and platform input

**Update 2026-10-06.** Module 0 is GREEN. Scene decisions this note left open are closed, where the specification now states them, by `reconciliation.md`. This file remains the record of the shipped Module 0 constraints.

**Role:** Senior Core / Platform Engineer

**Status:** Preparation input for issue #7. This is not an operational specification and not implementation authorization. The paragraphs below predate Module 0 acceptance.

## 1. Question

What does the shipped Module 0 core, persistence, and package boundary force on a later scene, and which scene decisions does that code still leave open?

## 2. Current gate

Module 0 is on `main` as `5e99484`. The Product Owner approved pull request #31. Issue #1 stays open. Module 0 is not GREEN.

Development process sections 2 and 20 allow Module 1 implementation only after Module 0 is GREEN and the Product Owner approves the module. Issue #7 is a backlog placeholder. It does not freeze scope.

The 2026-10-02 core review is `docs/modules/module-00-foundation/preparation/reviews/core-platform.md`. ADR-0006 records the scene shape, the container, and the undo strategy studied there as not selected. This note does not select them.

## 3. Shipped behavior a later scene has to keep

These are the contracts on `main`. A Module 1 change that contradicts one of them needs its own decision. It is not a local cleanup.

**Core.** `@uvcp/core` exports `DomainError`, `canonicalizeFiniteNumber`, and `canonicalizeFiniteTriple`.

- `DomainError` carries a stable `code` and a short message. It does not carry the rejected payload.
- A finite number passes through `canonicalizeFiniteNumber`. `-0` becomes `0`. `NaN`, an infinity, and a non-number throw `NON_FINITE_NUMBER`.
- `canonicalizeFiniteTriple` requires three components and applies that same rule to each one. A bad component fails the call. The helper does not replace it with `0`.
- The triple is not a vector, a transform, an axis choice, or a rotation order. ADR-0006 leaves those choices open.

**Persistence.** `writeManifest` takes no document and returns the UTF-8 bytes `{"formatId":"universal-visual-creation-project","schemaVersion":1}` with no BOM and no extra whitespace. `readManifest` accepts insignificant whitespace and either key order. The reader limit is 4096 bytes, and it applies only to this manifest. `JSON.parse` is the syntax authority. `SyntaxError` and `RangeError` are `INVALID_JSON`. There is no nesting-depth limit. Equal root keys, including escape-equivalent spellings, are `DUPLICATE_KEY`. A document the host parses keeps the existing shape, format, version, and key results.

`checkEntryNames` is a pure check: NFC, 1–255 UTF-8 bytes, relative slash segments, no `.` or `..`, no backslash or colon, no ASCII controls, and no ASCII case-fold collision. A rejected name is `ENTRY_NAME_REJECTED`. A collision is `ENTRY_NAME_CONFLICT`. No archive is opened. ASCII case-fold is the known gap before the first real archive reader.

The format id is the provisional test string. ADR-0006 does not promise that the string survives until a user-facing save exists.

**Rendering.** `renderNull` returns a frozen snapshot. Physical size is the CSS size times `devicePixelRatio`, including a fractional ratio. The clear color is opaque sRGB black. The draw list is empty. The backend is `null` and the device is `not-requested`. ADR-0003 makes that object the Module 0 test double. It is not a scene and not a promise that a later renderer receives the same fields.

**Platform.** `packages/platform/src/index.ts` is `export {}`. The shell declares the dependency and does not import it. Module 0 has no host call to make. A marker export is not specified.

**Package edges.** `scripts/boundaries.mjs` allows:

| Package | May import |
| --- | --- |
| `@uvcp/core` | no workspace package |
| `@uvcp/persistence` | `@uvcp/core` |
| `@uvcp/rendering` | `@uvcp/core` |
| `@uvcp/editor` | `@uvcp/core`, `@uvcp/persistence` |
| `@uvcp/ui` | no workspace package |
| `@uvcp/platform` | no workspace package |
| `@uvcp/shell` | `@uvcp/ui`, `@uvcp/editor`, `@uvcp/platform` |

Core, persistence, rendering, editor, and platform have no DOM library. Core and persistence have no React, desktop SDK, or filesystem import. Rendering has no Three.js, Babylon.js, or `wgpu` import. The shell does not import core, persistence, or rendering.

## 4. Boundaries a scene document has to respect

The provisional manifest stays two fields. Putting nodes, transforms, or assets into those fields, or raising `schemaVersion` to mean a scene, changes ADR-0006. A scene file is a new document.

`writeManifest` is not a general serializer. The codec exists so the first save is not `JSON.stringify` of a renderer object. A later writer is a new decision. It is not an extra argument on the current function.

A scene does not fit in the 4096-byte manifest by nesting. On some hosts `JSON.parse` throws `RangeError` inside that cap, and the reader reports `INVALID_JSON`. A nesting-depth rule on this manifest was rejected. An approved scene document needs its own size and parse rules.

Persistence still does not call the filesystem. Who writes a user file, and what a failed write does, stays deferred.

React stores the foundation screen. ADR-0002 and ADR-0008 keep the scene out of React state for Module 0. A later viewport writes its own decision. The foundation screen is not the editor layout.

A second language for the authoritative scene needs a new ADR. ADR-0001 does not require that scene to stay in TypeScript, and it does not authorize building it now.

## 5. Decisions this note leaves open

The approved architecture leaves these unresolved. Answering one here would be a product or architecture decision.

- Whether archive section 9.2 is the scope to prepare. Its identifiers are not operational requirements.
- One scene per project, or more than one.
- Public format identifier, extension, one file or a folder, and whether hand-editing is supported.
- The container and the undo strategy studied in 2026. Neither is selected.
- Up axis, handedness, rotation order, and degrees versus radians.
- Which 2D primitive and which 3D primitive are in scope, if primitives are in scope.
- Whether the first slice includes save and reload, and whether it includes undo.
- Whether selection comes from a hierarchy, a viewport, or both.
- The language of the authoritative scene, the desktop viewport host, and the product graphics API.

The plain-data document studied in 2026, with caller-supplied ids and parent `childIds`, remains a study. The Tech Lead owns whether that study becomes architecture. The Product Owner owns the product choices in the list above.

## 6. Definition of Ready

Definition of Ready is development process section 8. From this role it is not met. The blocking architectural decisions are the open items in section 5. There is no operational specification and no stable Module 1 identifier.

No scene type, viewport, persistence format, package, or test is added here.

## 7. Product Owner decisions

Two decisions remain with the Product Owner:

1. Accept or reject Module 0.
2. Approve the operational scope of Module 1 before implementation begins.

Until both are explicit, Module 1 stays in preparation.

# ADR-0006: Domain, persistence, and undo direction

**Status:** Proposed  
**Date:** 2026-10-02  
**Decider:** Tech Lead  
**Consulted:** Senior Core / Platform Engineer, Senior 2D / Editor Engineer, Senior 3D / Rendering Engineer

## Context

Later modules need one scene, a portable project, and undo of edits. Module 0 must establish the persistence boundary without implementing authoring, a scene graph, or a user-facing save. Archive Modules 1 and 2 describe that later work and do not authorize it.

The risk of an empty persistence package is that the first save becomes `JSON.stringify` of a renderer object. The risk of a rich framework now is a scene implementation disguised as a placeholder.

## Decision

### Domain

One authoritative scene will live in `core` as plain data, starting in Module 1 if that module is approved. Not before.

Intended shape, not Module 0 code:

- nodes in one map, ordered children only on the parent's `childIds`
- transform as a small record of translation, rotation, and scale
- 2D and 3D as payloads in that hierarchy, not as a second scene
- asset bytes referenced by id, not inlined in the document
- ids supplied by the caller; core does not read a clock or a random source
- world transforms derived, not saved

Up-axis, handedness, rotation order, and degrees versus radians are one schema-level constant. They are intentionally undecided. The starting proposal for the Module 1 ADR is degrees, a fixed XYZ order, and the edited triple as the stored value. Do not also persist a quaternion. That proposal is not a Module 0 decision and may be replaced before Module 1 tests exist.

Rejected for the scene model: a class hierarchy with draw methods, an ECS framework, storing both `parentId` and `childIds`, and any renderer scene graph as the document.

### What Module 0 puts in core

`DomainError`, `canonicalizeFiniteNumber`, and `canonicalizeFiniteTriple`. Finite numbers pass. `-0` becomes `0`. `NaN`, infinities, and non-numbers throw `NON_FINITE_NUMBER`. No `Vector3` type and no math dependency.

### Persistence

Long-term project: a logical package of `manifest.json`, a domain document, and asset entries under relative `/` names. Recommended user-facing container, when save exists: one zip of that package. Tests may later use the same entries as a directory. Same names, no second schema.

Module 0 implements only:

- `formatId` provisional value `universal-visual-creation-project`
- `schemaVersion` integer `1`
- a writer that emits exactly `{"formatId":"universal-visual-creation-project","schemaVersion":1}` as UTF-8 with no BOM and no extra whitespace
- a reader that accepts insignificant whitespace and either key order, rejects duplicate keys, unknown keys, a non-integer version, and inputs over 4096 bytes, and returns a new value
- pure entry-name checks: NFC, 1–255 UTF-8 bytes, relative `/` segments, no `..`, no `\` or `:`, no ASCII controls, and no two names that collide under ASCII case-fold

No zip library, no directory writer, no migration registry, and no scene JSON. Persistence does not call the filesystem. The editor will pass bytes in when a save exists. `replace-all` semantics for the user's file are a later platform concern: the previous complete package stays readable if the write fails.

`schemaVersion` is the compatibility authority. A newer version is rejected whole. An older version is migrated in memory by persistence, and the file is not rewritten until the user saves. There is no older version in Module 0, so there is no migrator.

### Undo

Not built. Later default: `apply(document, operation)` returns the next document and an inverse patch of the records that changed. The editor holds the stacks. The file does not. A transform gesture pushes one patch on commit, not one patch per pointer move. A failed save does not roll the document back and does not discard history.

Full-document snapshots are easier and will retain asset bytes if those bytes ever sit on the node. Rejected as the default. They may be reconsidered in the Module 2 ADR only if history stays in the editor, stays out of the file, and does not copy asset payloads.

Event sourcing as the project format is rejected. Collaboration is outside the initial product path, and a log of untrusted operations is a worse persistence surface than a document.

### Python and other hosts

No clock port, random port, filesystem interface, or dependency-injection container in Module 0. Callers pass values. A future Python sidecar submits bytes. It does not hold core objects. The transport is undecided and is not built.

## Alternatives

### Empty persistence package

Enough to satisfy "a boundary may contain minimal code," and too weak to stop a later `JSON.stringify` writer. Rejected. The codec is small, headless, and has no product save UI.

### Single JSON file as the project

Fine for a scene with no assets. Images and meshes then become base64 or force a format change. Rejected as the long-term project. The Module 0 manifest is JSON because it is two fields, not because the whole project is one JSON file.

### SQLite

A real one-file database, and a poor creative-document format here: opaque diffs, a large untrusted parser, journal or WAL companions, and a Wasm storage port on the web. Rejected as the project. A later cache outside the portable project is not forbidden by this ADR and is not Module 0 work.

### Custom binary document

Compact, and a private parser on every future language boundary, including a Python sidecar. Interchange binaries belong to export. Rejected for the working document. Asset payloads are the binary part.

## Consequences

- Headless persistence tests are the first proof that core and persistence import without the shell.
- The provisional format id can be renamed until a user can save. After that, a rename is a migration.
- ASCII case-fold does not solve every Unicode case collision. That gap is accepted only because Module 0 extracts nothing. It is a security review item before the first real archive reader.
- Quarantining a bad object while keeping the rest of a file is a product decision. This ADR's recommendation is to reject the file. It does not apply to any Module 0 user file, because there is none.

## Confirmation

Format id, extension, one file versus a folder, hand-editing, and undo-across-reload need the Product Owner before a user-facing save. They do not block Module 0. One scene versus several scenes needs a decision before the Module 1 schema, not before this module.

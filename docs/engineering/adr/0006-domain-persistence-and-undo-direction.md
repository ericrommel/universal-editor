# ADR-0006: Module 0 domain helpers and provisional manifest

**Status:** Accepted for the binding Module 0 decision. Revisitable and deferred items stay open.  
**Date:** 2026-10-02  
**Decider:** Tech Lead  
**Consulted:** Senior Core / Platform Engineer, Senior 2D / Editor Engineer, Senior 3D / Rendering Engineer

## Context

Module 0 must establish a persistence boundary without implementing authoring, a scene graph, or a user-facing save. Archive descriptions of later modules do not authorize that work and do not decide it.

The risk of an empty persistence package is that the first save becomes `JSON.stringify` of a renderer object. The risk of a rich model now is a scene implementation disguised as a placeholder.

**Binding for Module 0:** numeric helpers and the provisional manifest codec below.  
**Revisitable:** package shape, scene shape, and undo notes.  
**Deferred:** the scene schema, the container, and the undo strategy.

## Decision

### What Module 0 puts in core

`DomainError`, `canonicalizeFiniteNumber`, and `canonicalizeFiniteTriple`. Finite numbers pass. `-0` becomes `0`. `NaN`, infinities, and non-numbers throw `NON_FINITE_NUMBER`. No `Vector3` type and no math dependency.

### Persistence

Module 0 implements only:

- `formatId` provisional value `universal-visual-creation-project`
- `schemaVersion` integer `1`
- a writer that emits exactly `{"formatId":"universal-visual-creation-project","schemaVersion":1}` as UTF-8 with no BOM and no extra whitespace
- a reader that accepts insignificant whitespace and either key order, rejects duplicate keys, unknown keys, a non-integer version, and inputs over 4096 bytes, and returns a new value
- pure entry-name checks: NFC, 1–255 UTF-8 bytes, relative `/` segments, no `..`, no `\` or `:`, no ASCII controls, and no two names that collide under ASCII case-fold

No zip library, no directory writer, no migration registry, and no scene JSON. Persistence does not call the filesystem. Who writes a user's file, and what a failed write does, is deferred.

The Module 0 reader rejects a `schemaVersion` other than `1`. There is no migrator, because there is no older file.

### Studied, not selected

A logical package of a manifest, a domain document, and asset entries was compared with one JSON file, SQLite, and a custom binary document. A zip file was the container most often named. None of these is selected. The Module 0 manifest is JSON because it is two fields, not because the project format is one JSON file.

Undo was compared the same way. Inverse patches held beside the document, full-document snapshots, and an event log are all possible. None is selected. Module 0 adds no undo API, and the manifest is not a history log.

No clock port, random port, filesystem interface, or dependency-injection container is added. Callers pass values. A Python sidecar is not built.

## Alternatives

### Empty persistence package

Enough to satisfy "a boundary may contain minimal code," and too weak to stop a later `JSON.stringify` writer. Rejected. The codec is small, headless, and has no product save UI.

### Single JSON file as the project

Fine for a document with no assets. Images and meshes then become base64 or force a format change. Not selected. The Module 0 manifest is JSON because it is two fields.

### SQLite

A real one-file database. The costs named in preparation were opaque diffs, a large untrusted parser, journal or WAL companions, and a web storage port. Not selected. Not forbidden for a later cache. Not Module 0 work.

### Custom binary document

Compact, and a private parser on every language boundary. Not selected for Module 0. Not a decision that a later document cannot be binary.

## Consequences

- Headless persistence tests are the first proof that core and persistence import without the shell.
- The provisional format id is a test string. Renaming it before any user-facing save does not require a migration. This ADR does not promise that the string will survive.
- ASCII case-fold does not solve every Unicode case collision. That gap is accepted only because Module 0 extracts nothing. It is a review item before the first real archive reader.
- The Module 0 reader rejects a bad manifest whole. That rule is about two JSON fields. It is not a decision to reject a later user file in full.

## Confirmation

The Product Owner accepted the binding numeric helpers and provisional manifest on 2026-10-02. Format id, extension, container, hand-editing, scene cardinality, and undo do not block Module 0. They are deferred.

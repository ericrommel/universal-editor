# Module 4 — Stroke trust boundary

**Status:** Preparation input for issue #71. Not a threat-model signoff. Not a specification. Implementation is not authorized.
**Role:** Senior Application Security Engineer
**Date:** 2026-10-06

Archive section 9.5 in `docs/archive/product-engineering-specification-v1.0.md` is context only. Its identifiers are not operational requirements. Freehand input, a spatial curve, appearance, persistence, and undo in that section are not requirements of this note.

This preparation adds no parser, no file import, and no network call. It does not write an exploit, a payload, or a proof-of-concept. It does not invent a second parser. It does not add a stroke, a curve, a scene kind, a viewport, a tool, an undo API, a dependency, a workflow change, or an ADR.

Development process section 18 makes security review matter when a module introduces untrusted project files, imported assets, network access, or native filesystem access. This note does not introduce those boundaries. It records the questions a later stroke specification has to answer without weakening the contracts already in force.

## What stays closed

Module 1 is approved for implementation and is not GREEN. The contract is pull request #50, branch `m1/reconcile-preparation`, `docs/modules/module-01-unified-scene/specification.md`, sections 8 and 9, M1-NFR-004, and M1-NFR-007. That text is not on this branch. This note does not change it, does not implement it, and does not narrow its rejections.

Module 2 preparation on main does not approve a viewport or an undo API. Pointer and keyboard events stay untrusted input inside the loopback shell. They are not a new origin and not a reason to add a host bridge. See `docs/modules/module-02-direct-manipulation/preparation/trust-boundary.md`.

Module 3 preparation does not approve a creation tool. Drawing is not added to the foundation screen.

ADR-0007 and architecture section 22 still bind. The shell stays the loopback page. There is no application network client, no remote script, font, stylesheet, or frame, and no telemetry. Core does not import the shell, React, or filesystem APIs. Project files, imported assets, non-loopback network, AI output, plugins, scripts, collaboration, and marketplace content stay untrusted and unimplemented. Electron and Tauri are not selected.

ADR-0006 still binds the provisional manifest. `packages/persistence/src/manifest.ts` is unchanged: two fields, a 4096-byte cap checked before decode, fixed messages that do not include the input, and a duplicate-check failure whose message is `Manifest duplicate check lost alignment.` The source comment on that cap is the rule: it is only the provisional manifest, not a project-size limit. Persistence does not call the filesystem. `checkEntryNames` does not extract. No container is selected.

Diagnostics stay the closed startup record in architecture section 17 and `packages/editor/src/diagnostics.ts`: `event`, `shell` (`browser`), `version`, `step`, and on failure `code` and `message`. Events remain `startup.beginning`, `startup.ready`, and `startup.failed`. No environment dump.

## Questions for later stroke data

These questions are open. The sentences under each one are constraints. They are not a stroke schema and not a byte budget.

### Untrusted points

Which pointer samples, if any, become stored points, and which are dropped before a later command runs?

Points are untrusted. That includes samples from the local operator and bytes a test would supply. The operator at the viewport is not a privilege boundary and does not grant filesystem, network, or process rights. The event handler is not the rejection boundary. A non-finite component fails the existing finite-number rule: `DomainError` code `NON_FINITE_NUMBER`, message `Expected a finite number.` Do not repair a bad component to `0`. A rejected value does not change the caller's document and does not return a partial document. This note does not define the command, the point shape, smoothing, pressure, time, or tilt. Capturing a gesture does not add a parser.

### Document size

Does a later stroke need its own point-count or working-set bound, and who sets that number?

The approved scene-document cap is 1048576 bytes, checked on the `Uint8Array` before UTF-8 decode and before `JSON.parse`. A greater length is `TOO_LARGE` with the fixed message `Scene document exceeds the size limit.` Exactly 1048576 bytes is not `TOO_LARGE` by length alone. The writer uses the same code when the canonical bytes would exceed the cap. That cap is the scene document bound. It is not a stroke budget, not a point-count budget, and not a width budget. This note does not raise it, split it, or spend it on strokes. It does not choose another number.

The manifest's 4096-byte cap is not a substitute budget. Do not raise it, and do not place stroke points in that two-field document. The hierarchy walk that visits each node at most once is not a point budget either. There is no nesting-depth limit on the provisional manifest; that fact does not become a stroke limit.

ADR-0006's reject-whole rule is about two JSON fields. It is not a decision to reject every later user file in full, and it is not permission to import a file here. No file import is added.

### Duplicate keys

Which objects in a future stroke value, if it is ever accepted inside the scene document, does the duplicate walk have to cover?

The approved rule is not open. Duplicate keys are rejected on every object that can be accepted, including equal values and spellings that differ only by escaping. The walk runs only after `JSON.parse` succeeds. More raw keys than parsed keys is `DUPLICATE_KEY` with the fixed message `Scene document contains a duplicate key.` Any other disagreement throws `Error` with the fixed message `Scene duplicate check lost alignment.`, returns no scene, and is not a successful read. That message does not include the document. The walk is not the manifest function and does not reuse that function's reviver. A reviver that reads a raw token returns the value unchanged. It does not return `undefined`, it does not write, and it does not record `this` when `this` is `Object.prototype` or another intrinsic prototype.

The manifest walk is root-only because a nested object is never accepted there. Copying that narrower check onto a stroke object would weaken the scene contract. Do not do that. Do not add a second parser, a second grammar, `eval`, `Function`, `vm`, or a schema package to find duplicates. `JSON.parse` remains the only syntax authority for the scene document. This preparation adds no parser. A private stroke parser that accepts a duplicate the scene reader rejects is out of scope. If stroke bytes ever live outside that document, that is a new boundary and a new review. This note does not open it and does not sketch the parser. No container is selected.

### Prototype keys

How would a later point list be built so a key on a point cannot change `Object.prototype`?

The approved reader rejects unknown fields, including `__proto__`, `constructor`, and `prototype`. The scene is built from known fields and is not the parsed object. The reader does not assign, spread, or merge parsed keys onto an object. After an accepted document and after a rejected document, `Object.prototype` is unchanged. A caller-chosen name is data, never a property assignment. Ownership is `Object.hasOwn`, not `in`. Today's `JSON.parse` behavior is not that control. This note does not name stroke fields. Approved kinds stay `rectangle` and `box`. An unknown kind remains `INVALID_SHAPE`. Adding a curve kind is not authorized.

### Diagnostics must not log raw strokes

Where would an operator later see that a stroke was rejected, if the log cannot carry the stroke?

The logging rule is not open. Diagnostics must not log raw strokes. Do not log point sequences, control data, widths, pressure, timestamps, stroke bytes, object ids, or scene contents. Do not log pointer paths. Module 2 already forbids that, and a stored stroke is that path retained. Do not add a diagnostic field. Do not widen `packages/editor/src/diagnostics.ts`. A failed stroke is not a new event name and not an environment dump.

Messages do not echo input. The approved catalog says the `message` is the fixed sentence and nothing else. No failure includes the document, a key, an id, a numeric excerpt, or a host error as `cause`. `cause` is unset. A host `SyntaxError` or `RangeError` is not the message. Do not replace a fixed sentence with text that quotes a point. The foundation screen reports startup only. It is not a stroke-error channel.

## Not in this preparation

- No parser, no stroke codec, and no second parser beside the scene document's `JSON.parse` or the manifest reader.
- No file import, no path, no zip, and no archive reader.
- No network call, no telemetry, and no client for automatic cleanup. Archive section 9.5 places that cleanup out of scope. This note does not build it.
- No new dependency and no license exception. ADR-0007's allow-list is unchanged.
- No change to the manifest codec, the scene codec, the content security policy, CI, or the diagnostic field list.
- No exploit, payload, or proof-of-concept. No package was installed and no test was run.
- Not a threat-model signoff. Not Product Owner approval. Implementation is not authorized. Module 4 stays in preparation. Module 1's implementation approval does not authorize Module 4.

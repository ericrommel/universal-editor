# Module 1 — Application Security Review

**Recommendation:** Accept the preparation position. Module 1 may specify an in-memory scene-document codec on the boundary below. Reject any reading that adds a filesystem, a network client, a zip or other container, a path, a new dependency, a second syntax, or a change to the provisional manifest. This review does not weaken ADR-0007.

**Role:** Senior Application Security Engineer

**Status:** Preparation review, 2026-10-05. Not implementation authorization. Not a sign-off of an implementation. There is no scene code. Not Product Owner approval.

## Position

- Input bytes are untrusted, including bytes supplied by tests.
- No filesystem, no network, no zip or other container, and no path.
- A size cap is applied to those bytes before decode and before parse.
- Where the document is JSON, `JSON.parse` is the only syntax authority.
- Duplicate keys are rejected.
- Prototype keys cannot change `Object.prototype`.
- `DomainError` messages do not include the input.
- The provisional manifest codec stays unchanged. No new dependency.

This is not a scene schema, a save command, or a public format identifier. Those remain open, as in the quality note. A binary layout, a zip, or a custom grammar is not covered by "if the document is JSON" and is not accepted here.

## What stays in force

ADR-0007 still binds the shell, CI secrets, closed diagnostics, frozen install, empty `allowBuilds`, the public registry, and the license allow-list. Project files, assets, non-loopback network, AI output, plugins, scripts, collaboration, and marketplace content stay untrusted. Electron and Tauri are not selected. Conditions omitted from the shorter later-host notes are not waived.

ADR-0006 still binds the manifest: two fields, a 4096-byte cap, no scene JSON in that codec, and no archive reader. `packages/persistence/src/manifest.ts` checks size before decode, uses `JSON.parse` as the syntax authority, and maps `SyntaxError` and `RangeError` to `INVALID_JSON`. It rejects duplicate root keys. A nested duplicate is only an unknown shape. An own `__proto__` key is rejected as an unknown key. Fixed strings are the only `DomainError` messages. If the duplicate walk loses alignment, it throws a fixed `Error` and does not echo the document. The manifest's lack of a nesting limit is that two-field cap, not a rule for a larger document.

## Blocking conditions for a later implementation

These block a codec implementation. They do not block this preparation review.

**SEC-M1-B-001 — Cap before decode.** Take a `Uint8Array`. A non-byte value fails with a fixed message and no echo. Reject empty input. Compare `byteLength` with a fixed cap before UTF-8 decode and before `JSON.parse`, including when the extra bytes are not UTF-8. Reject a leading UTF-8 BOM. Decode is fatal UTF-8. Do not read a stream or accept a second value after the document. The cap is the memory and CPU bound for one document.

**SEC-M1-B-002 — One syntax authority.** This acceptance is for JSON only. `JSON.parse` is the syntax authority. No `eval`, `Function`, `vm`, schema package, or second grammar. Run a duplicate walk only after `JSON.parse` succeeds. If the walk disagrees with the parse, fail closed with fixed text and do not report a successful read. Map `SyntaxError` and `RangeError` to a fixed domain error. A reviver used to read a raw token must return the value unchanged. Returning `undefined` deletes a key. It must not write, and it must not record `this` when `this` is `Object.prototype` or another intrinsic prototype.

**SEC-M1-B-003 — Duplicates in every accepted object.** Root-only rejection is enough for the manifest because a nested object is never accepted. Reject duplicate keys in every scene object that can be accepted, including equal values and spellings that differ only by escapes. Allow and deny lists use decoded keys from `JSON.parse`, after any normalization the codec adds. `\u005f\u005fproto\u005f\u005f` is `__proto__`.

**SEC-M1-B-004 — Prototypes do not move.** Build a new domain value from known fields. Do not return the parsed object. Do not `Object.assign`, spread, or recursively merge parsed keys. A caller-chosen name is data in a `Map` or a domain field, never a property assignment. Use `Object.hasOwn`, not `in`. Reject `__proto__`, `constructor`, and `prototype` on every object read. Tests must show `Object.prototype` unchanged after rejected and accepted documents, including a nested `__proto__` value and a `constructor` / `prototype` object. Today's `JSON.parse` behavior is not that control.

**SEC-M1-B-005 — No input in errors or logs.** Use fixed `DomainError` codes and messages. Messages, `cause`, and diagnostics must not include the document, a key, a string value, or a byte excerpt. Replace parse and decode errors that quote input. Do not add a diagnostic field. ADR-0007's closed field list still applies.

**SEC-M1-B-006 — Leave the manifest codec unchanged.** Do not change `readManifest` or `writeManifest` acceptance, rejection, codes, messages, or the 4096-byte cap. Do not refactor that walk into the scene codec, and do not copy its reviver onto nested scene objects. Keeping the manifest free of a nesting limit does not weaken ADR-0007.

**SEC-M1-B-007 — The scene cap must fail closed.** This review does not choose the number. Implementation is blocked until the cap is fixed and a document nested to that cap either parses or fails as a domain error, without aborting the process. If that cannot be shown, this codec needs a depth limit. That limit must not change the manifest.

**SEC-M1-B-008 — No I/O and no new dependency.** Do not import filesystem, network, shell, or zip APIs. Do not treat a string as a path, URL, or archive entry, and do not resolve `$ref` or fetch a schema. `checkEntryNames` is not permission to extract. The ADR-0006 Unicode case-fold gap stays open until a real archive reader. Shared ids and cycles are outside this codec; a later id graph needs a visit bound and a new review. No new package. A second scene language still requires a new ADR. Do not relax ADR-0007's license, audit, install, or secret rules to admit a parser.

**SEC-M1-B-009 — Closed writer.** Emit bytes from validated domain fields. Do not `JSON.stringify` a caller-supplied or previously parsed object. Scene numbers go through `canonicalizeFiniteNumber` or `canonicalizeFiniteTriple`. Non-finite values are rejected with `Expected a finite number.` and are not written as `null`.

## Non-blocking notes

**SEC-M1-N-001.** Format id, extension, file or folder, hand-editing, cardinality, save, and undo stay unresolved. This review does not pick them.

**SEC-M1-N-002.** Unpaired surrogates in a JSON string are not a prototype or path bypass while those strings stay data and are not evaluated.

**SEC-M1-N-003.** Signing, notarization, auto-update, SBOM, zip bombs, and AI, plugin, and script sandboxes stay deferred until the module that introduces that boundary. Do not imitate them in this codec.

**SEC-M1-N-004.** No scene code was executed. No exploit was written. No audit was run. This note is not Module 0 acceptance and is not evidence for M0-AC-011.

# Module 0 — Core / Platform Review

**Role:** Senior Core / Platform Engineer
**Date:** 2026-10-02
**Result:** Recommendation only. Not an ADR, not approved architecture, and not authorization to implement. Module 0 should build the numeric helpers and the provisional manifest codec below. It must not treat assumptions about later modules as binding architecture.

Labels below are engineering strength. They do not change product requirements or acceptance criteria. Where the archive disagrees with the operational Module 0 specification, the operational specification wins.

## Question answered for Module 0

What must the platform-neutral core and persistence boundary contain so a later scene, save, and undo are not painted shut, without deciding those later designs now?

## Findings that change what Module 0 must build

- An empty persistence package meets "a boundary may contain minimal code" and still leaves `JSON.stringify` as the obvious first writer. That call serializes `NaN` and `Infinity` as `null`, and duplicate object names are not interoperable (RFC 8259). Module 0 should ship a closed manifest codec and explicit numeric helpers. That is not a project writer and not a scene.
- TypeScript types are erased. They do not validate project bytes. Untrusted input is checked in persistence. Core reports a `DomainError` and does not echo the payload.
- A JavaScript `number` is IEEE 754 binary64, not an integer and not an f32. The helpers Module 0 actually ships must state the `-0`, `NaN`, and infinity policy. They must not introduce a transform or vector type.
- No application source or package manifest was present for this study. Entry-name checks can be pure functions. Opening an archive cannot.
- Headless core tests and separable boundaries are in the Module 0 contract. A scene, a user save, and a migration registry are not. Editor, rendering, UI, and platform may stay empty. Core and persistence are the exception, because of the codec and the numeric policy.
- Tests that lock canonical bytes will be mistaken for a public format promise. The format id below stays provisional until a user-facing save exists. Renaming it before that save is not a migration.

## Recommendations

### Binding for Module 0

**Language of this module's code.** Implement the Module 0 core and persistence code in TypeScript, compiled to ordinary JavaScript, and test it with a headless JavaScript runner. Rust (native plus Wasm), C# / Blazor, and Python / Pyodide were evaluated and rejected for this module: a second target or a large runtime before any scene exists; Blazor Server needs a backend; a full Pyodide distribution is hundreds of megabytes. Do not add those toolchains beside the Module 0 package.

TypeScript may be right for Module 0 code. It is not, on current evidence, a decision that the future authoritative scene and other core product functionality must stay in TypeScript. Choosing another language for that later work is a new decision. It is not an optimization of these packages, and Module 0 must not pre-build it.

**Core, headless, no I/O.**

- `DomainError`: stable `code`, short message, no payload echo.
- `canonicalizeFiniteNumber`: return the value when it is finite; return `0` for `-0`; throw `DomainError` with code `NON_FINITE_NUMBER` for `NaN`, `Infinity`, `-Infinity`, and non-numbers.
- `canonicalizeFiniteTriple`: the same rule per component. Throw on a bad component. Do not repair it to `0`.

No `Vector3`, math dependency, scene type, id generator, clock, or filesystem call.

**Provisional manifest codec.** Not a public compatibility promise. The writer emits only these canonical bytes, UTF-8, no BOM, no insignificant whitespace, no trailing newline, keys in this order:

`{"formatId":"universal-visual-creation-project","schemaVersion":1}`

It builds those bytes from the two fields. It does not walk a general object.

The reader:

- accepts insignificant whitespace and either key order;
- rejects duplicate keys, rather than host last-key-wins;
- rejects unknown keys, missing keys, non-objects, and a `schemaVersion` that is not the integer `1`;
- returns a freshly built value, not the parser's object;
- refuses inputs larger than 4096 bytes before parsing. That limit is only for this manifest, not a project-size limit.

Also reject empty input, bad UTF-8, a BOM, bad JSON, and the wrong format id. Failure yields no manifest. Success returns the two fields and implies no scene. Stable codes: `EMPTY`, `TOO_LARGE`, `INVALID_ENCODING`, `INVALID_JSON`, `DUPLICATE_KEY`, `INVALID_SHAPE`, `UNSUPPORTED_FORMAT`, `UNSUPPORTED_SCHEMA_VERSION`, `ENTRY_NAME_REJECTED`, `ENTRY_NAME_CONFLICT`. Error objects must not include the input bytes.

**Entry names**, as pure functions, even though no archive is opened:

- NFC (`name === name.normalize("NFC")`);
- 1–255 UTF-8 bytes;
- relative slash segments only: no empty segment, no leading or trailing `/`;
- no `.` or `..` segment;
- no backslash, no colon, no ASCII controls (including NUL);
- reject the set when two names collide under ASCII case-fold (`A`–`Z` only).

ASCII fold does not solve Unicode case-folding. That gap is accepted only because Module 0 extracts nothing.

Headless tests cover round-trip to the exact bytes, whitespace and key-order acceptance, each rejection above, 4096 versus 4097 bytes, a BOM, and hostile names (dot-dot, absolute paths, backslash traversal, drive prefixes, empty segments, non-NFC, `Assets/A` versus `assets/a`). No JSON-schema, zip, math, undo, or dependency-injection package.

**Boundaries.** Core imports no workspace package and nothing listed in M0-NFR-002: desktop shell, browser UI, React or an equivalent UI framework, platform filesystem APIs. Persistence may import core, uses these canonicalizers rather than a second copy, and does not call the filesystem. UI does not import core. A forbidden core import fails verification. Which script enforces that is not this review's choice. Do not add a service container, or a clock, random, or filesystem port. Module 0 has no caller for them.

**Not in this module.** Scene graph, node or transform types, zip or directory writer, migration registry, undo stack, command bus, file dialog, telemetry, Python, Rust, Blazor, or Pyodide.

### Revisitable direction

Not selected. Not Module 0 code. Kept so a later decision does not have to rediscover the study.

**Scene schema.** The shape studied was one plain-data document: nodes keyed by an opaque caller-supplied id, sibling order only in parent `childIds`, a transform record of translation, rotation, and scale, 2D and 3D as payloads in that hierarchy, world transforms derived, asset bytes stored by id. Class hierarchies with draw methods, an ECS, two stored parent links, and a renderer scene used as the document were poorer fits. Units, rotation order, handedness, up-axis, and one scene versus several are undecided.

**Zip container.** The package shape studied for later assets was a manifest, a domain document, and asset entries under the entry-name rules above. One zip of those entries was the container suggested for a future save. A single JSON project, SQLite, and a custom binary document were weaker fits for different reasons: asset inlining, journal companions plus an opaque parser, and a private parser on every language boundary. None of these is chosen. If a zip is later chosen, compare entry name plus entry bytes, not compressed zip bytes.

**Undo strategy.** The strategy studied was an immutable document, inverse record patches held in editor session memory and not in the file, one patch per gesture rather than per pointer move. Full-document snapshots and event sourcing as the file format were also studied. No undo strategy is selected.

### Deferred

- Product Owner confirmation of the public format id, extension, one file versus a folder, and hand-editing. Preference if asked later: not `.json`, one container file, hand-editing unsupported, malformed files rejected whole. Not required to build Module 0.
- Unicode case-fold, zip-slip, symlink entries, and nested archives, with Security, before the first archive reader.
- A Python sidecar that exchanges validated bytes under its own protocol version. Transport is undecided. Core does not import Python.
- Asset hash algorithm and media-type allowlist.
- Whether history, selection, or the viewport survive save. Preference if asked: no. That state is not core.
- Hard-reject versus quarantine of one bad object inside a later document. That choice is product-visible. Module 0 only rejects a bad manifest as a whole.
- RFC 8785 for a whole document, and only if documents are signed or compared byte for byte across languages.
- Replacing one measured numeric function with WebAssembly. That function would not own a scene and would not select the scene language.

## Disagreements with other roles

- **DevOps — an empty persistence boundary is enough.** Position: ship the codec and the entry-name functions. Do not ship a zip or a save UI. An empty package does not define duplicate keys or non-finite numbers.
- **DevOps — wider imports, including UI into core.** Position: UI does not import core in Module 0. The editor may call core and persistence. A later type-only exception needs its own decision.
- **Editor — an editor client and commands in Module 0, with this role owning the future undo language.** Position: agree that UI-toolkit history is not document undo, and that session commands must not share a history with domain edits. Disagree that Module 0 should add that client, viewport commands, or a command type. The undo strategy is not selected. If a later core is not TypeScript, the editor is the right package to cross a narrow boundary. Do not build that crossing now.
- **Rendering — a Module 0 render snapshot (physical pixels, sRGB) shaped for WebGPU, and a ban on taking committed transforms from a live engine node.** Position: agree the renderer must not become the document. The scene schema is not selected. Do not add a snapshot type or GPU fields in Module 0 to reserve one. Preview versus commit belongs to a later module.
- **Security — ASCII case-fold is incomplete.** Position: agreed. It is an accepted Module 0 gap, not the policy for a real archive reader.

## Risks that remain

- The provisional bytes are treated as a public `schemaVersion` 1 promise. A rename is free only before a user can save.
- A later writer calls `JSON.stringify` on domain values and stores `null` for non-finite numbers.
- The import check is described and never fails the build.
- A desktop host cannot run this Module 0 TypeScript package. That reopens how this package is hosted. It does not decide the language of the later scene.
- The studied scene, zip, or undo notes are implemented as placeholders and become the design.
- Unicode case collisions and zip path traversal stay open until an archive reader exists. Module 0 does not extract.
- No measured mesh workload exists. Wasm or a second core would spend that risk without evidence.

## Verification

Checked on 2026-10-02. The study used the operational Module 0 specification and test plan, the product overview, and the development process. Archive text was context only. Sibling preparation reviews were read for the disagreements above (DevOps, Editor, Rendering, Security). No application source or package manifest was in the tree to execute. Draft architecture text is not approved by this record.

External facts this recommendation still uses, retrieved the same day: TypeScript types are erased and there is no TypeScript runtime (handbook, "TypeScript for the New Programmer," updated 2026-09-28); JavaScript numbers are IEEE 754 binary64 (MDN `Number`, 2026-07-12); `JSON.stringify` writes `NaN` and `Infinity` as `null` (MDN, 2026-08-28); RFC 8259 does not make duplicate member names interoperable; Rust-to-Wasm via wasm-bindgen is a maintained path, and shared Wasm memory requires cross-origin isolation; Blazor Server is not an offline local editor, and Blazor WebAssembly downloads a .NET runtime (Microsoft Learn, ASP.NET Core 10 hosting models); Pyodide 314.0.7 describes a full distribution of 200+ MB; SQLite's steady-state database is one cross-platform file, with journal files during transactions; concatenating a zip entry name onto an output directory is a known path-traversal class.

Did not run a build, tests, CI, a browser, a desktop shell, a GPU process, zip extraction, or a package install. Did not select a Node, Deno, or Bun version, and did not claim one is installed. Did not re-fetch those external pages while shortening this record.

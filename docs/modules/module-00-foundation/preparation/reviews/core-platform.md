# Module 0 Architecture Preparation — Core / Platform Review

**Role:** Senior Core / Platform Engineer
**Status:** Recommendation only. This is not an ADR, not an approved architecture, and not authorization to implement Module 1 or later.
**Date:** 2026-10-02
**Audience:** Tech Lead, for `/docs/engineering/architecture.md` and ADRs. The Tech Lead owns those documents. The Human Product Owner has not approved this recommendation.

The operational Module 0 specification wins wherever the archived specification disagrees with it. Archive text is used only to keep later scene, persistence, and undo extension points from being painted shut.

---

## Documents read

- `AGENTS.md`
- `docs/product-overview.md`
- `docs/engineering/development-process.md`
- `docs/engineering/architecture.md` (intentionally incomplete; no approved decisions yet)
- `docs/modules/module-00-foundation/specification.md` (operational; status PLANNED)
- `docs/modules/module-00-foundation/test-plan.md` (operational; status DRAFT)
- `docs/archive/product-engineering-specification-v1.0.md`, sections 4, 5, 9.1–9.3, 10, 11, and 17, plus the surrounding module list needed to see what those sections depend on

No application source, package manifest, or ADR exists in the repository at the time of this review. Nothing below was verified by a build or test run. There is nothing to build yet.

External facts this recommendation relies on were checked on 2026-10-02. Citations are in [Sources](#sources). No toolchain version is selected here.

---

## Recommendations

### 1. Primary language for the platform-neutral core

**Decision:** Implement the authoritative domain and the persistence codec in **TypeScript**, compiled to ordinary JavaScript, and run that same package on the web and on the desktop shell.

TypeScript is a typed superset of JavaScript whose types are erased. It does not ship a runtime and it does not change JavaScript behavior (TypeScript handbook, “TypeScript for the New Programmer,” last updated 2026-09-28). The core is therefore testable by a headless JavaScript runner and loadable by a browser without a second compilation target. That is the smallest toolchain that satisfies M0-FR-002, M0-NFR-002, M0-NFR-003, and M0-NFR-007.

This is a document-and-operations core, not a promise that every future geometry kernel stays in JavaScript.

**What must remain true through scene, persistence, and undo**

1. **One authoritative implementation, one host.** Web and desktop import the same core package. The desktop shell must host a JavaScript engine or a web view that loads that package. If the Tech Lead chooses a desktop UI that cannot run this package, this language decision is void and must be reopened **before Module 1**, not papered over with a second core.
2. **Plain data and pure operations.** Domain values are data. Operations are functions from one document value to the next. No DOM nodes, no GPU resources, no file handles, no renderer objects, no hidden mutable singletons.
3. **Runtime validation stays at the boundary.** Erased types do not validate project files, AI output, or sidecar messages. Persistence validates bytes before core sees them.
4. **Numeric policy is the JavaScript number policy, made explicit.** A JavaScript `number` is an IEEE 754 binary64 value (MDN `Number`, last modified 2026-07-12). It is not an integer type and not an f32 type. Integers above `2^53` are not exact. Domain code canonicalizes `-0` to `0` and rejects `NaN` and infinities. It does not call `JSON.stringify` on domain values and hope.
5. **Transforms stay small records.** A transform edit replaces a small record. Vertex and pixel bytes, when they exist, are assets referenced by id, or whole typed-array buffers replaced as a unit. They are not deep-copied as JavaScript object graphs on every edit. If a Module 1 or Module 2 operation cannot be written that way, stop and redesign that operation. Do not “temporarily” mutate a shared graph.
6. **Hot numeric code stays behind pure functions.** A later measured workload may replace one of those functions with WebAssembly that accepts and returns buffers or numbers. That kernel must not own hierarchy, identity, or persisted transforms. Moving the authoritative scene itself into WebAssembly is a new architecture decision, not an optimization.
7. **The import boundary is mechanical.** CI fails if core or persistence imports UI, rendering, the desktop shell, or a host API. Review alone will not hold.

If (1) or the performance half of (6) fails, the replacement this review accepts is a Rust domain core (below), not a gradual second implementation in Rust beside a living TypeScript scene.

**Alternative rejected for Module 0: Rust domain core, native on desktop and WebAssembly on the web**

This is a real alternative. Rust compiles to WebAssembly, and `wasm-bindgen` is the maintained JS interop layer (MDN “Compiling from Rust to WebAssembly,” last modified 2026-09-08; wasm-bindgen guide and README, retrieved 2026-10-02). `cargo test` is headless. A Rust core would be the stronger long-term choice for mesh-scale CPU work and for a desktop shell that has no JavaScript engine.

Rejected for Module 0, and not the default for the scene model, for these reasons:

- Module 0 would start with two targets (native and Wasm) and a JS glue layer before any scene exists. That is more toolchain than M0-FR-002 needs.
- The UI will not be the Rust object graph. Every inspector refresh then either copies the hierarchy into JS or reads it field by field. Copied hierarchy becomes a second scene graph. That failure mode is more likely, and more damaging to P-01, than a slow transform update in Module 1.
- Threaded Wasm is not desktop-equivalent. Sharing `WebAssembly.Memory` across workers requires cross-origin isolation (`Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`; MDN `SharedArrayBuffer`, retrieved 2026-10-02). A Rust core that needs threads for its performance argument does not get those threads on the web for free.
- The original Rust-and-WebAssembly book repository was archived on 2025-08-25 (`rustwasm/book`). Wasm-bindgen itself is still maintained. The lesson is to pin a current toolchain later, not to adopt Rust now because an old tutorial made it look settled.

**Trade-off:** Rust buys predictable memory and a higher ceiling for geometry kernels. It spends Module 0 complexity and puts the scene on the far side of a boundary the editor must not mirror. Take that trade only if there is no JavaScript host, or after a pure TS kernel misses a measured budget.

**Alternative rejected: C# as the client core**

Also realistic. The same language can run in a desktop process and in the browser via Blazor WebAssembly. Microsoft’s hosting-model documentation (retrieved 2026-10-02, `view=aspnetcore-10.0`) states that Blazor WebAssembly downloads a .NET runtime to the browser and executes IL with an interpreter that has partial JIT support, unless ahead-of-time compilation to WebAssembly is turned on. AOT improves speed and increases payload size. Blazor Server keeps component state in a server circuit over SignalR and has no offline support. Blazor Hybrid runs .NET natively and renders UI in a web view; the same page names MAUI, WPF, and Windows Forms as hosts, and notes that native clients are packaged per platform.

Rejected:

- Blazor Server contradicts a local editor that must work without a backend (product overview, sections 9 and 10; Module 0 out of scope for cloud).
- Blazor WebAssembly as the **UI** ties the product to Razor in the browser and still pays a runtime download. Blazor WebAssembly as a **core behind a separate UI** recreates the Rust boundary problem.
- A hybrid web-view shell can host the TypeScript core directly. Using C# only so the shell can be hybrid is an extra runtime, not a simpler core.
- This page does not establish a Linux desktop UI stack. Inventing one was not part of the check.

**Trade-off:** C# is a strong desktop language with headless `dotnet test` and a real Wasm path. The web cost is a downloaded runtime and either a Razor UI or a second scene across interop. That cost is not justified by any Module 0 requirement.

**Alternative rejected as the client core, deferred as a sidecar: Python**

Pyodide is a real CPython port to WebAssembly (documentation version 314.0.7, retrieved 2026-10-02). It is not an acceptable home for the authoritative scene. The same documentation says the full distribution is 200+ megabytes. The browser build removes or stubs parts of the standard library and is subject to browser networking limits (Pyodide “Wasm constraints” and download pages, same retrieval). Desktop CPython would be a different runtime again. Either choice makes every edit a foreign call and makes Module 0’s supply chain the size of a language distribution.

Python remains the right **later** integration shape: a sidecar or service, specified in section 6. Not a Module 0 runtime. Not an import from core.

**Trade-off:** Python has the compute and AI libraries a future sidecar wants. As the client core it fails startup cost, packaging, and the single-scene rule on every target at once.

### 2. Scene / domain architecture direction

**Decision:** There will be one authoritative scene. It is plain data in core. Hierarchy, identity, and persisted transforms live only there. Rendering, UI, and the operating system hold derived views.

Module 0 does **not** implement this model. Module 1 is the first module allowed to add a scene, and only when its own specification is approved. The shape below is the constraint Module 0 must not make impossible.

Future document, not Module 0 code:

- A project document has a schema version and one or more scenes. “One or more” comes from archive section 4.2 and is **not** confirmed as a Module 1 product requirement. See the PO question. The Module 0 manifest deliberately has no scene list, so it does not freeze either answer.
- A scene holds nodes in one map keyed by opaque string id, plus an ordered list of root child ids.
- **`childIds` on the parent is the only writable hierarchy.** Order is the array order. A parent index may be built inside a domain operation and then discarded. It is not a second stored field and it is not persisted on its own.
- A node holds id, user-facing name, `childIds`, a transform record, and later a visual payload. 2D and 3D are visual payloads in this one hierarchy (P-01, P-05). They are not sibling scene types. Z exists on every transform even when a 2D tool hides it. Hiding Z is editor behavior.
- The transform record stores translation XYZ, rotation XYZ, and scale XYZ, because that is the product model and the archived Module 1 contract (archive M1-FR-005). The **unit, rotation order, handedness, and up-axis are one schema-level constant**, decided in the Module 1 ADR. They are not per object and they are not whatever the renderer uses internally.
- Starting proposal for that ADR, not a Module 0 choice: store **degrees**, fixed XYZ order, values exactly as edited. The renderer converts to a matrix at the boundary. Do not also persist a quaternion. A live gizmo may keep a preview matrix in editor or rendering state, but the committed value is the stored triple the user would see in the fields. Recomputing Euler from a matrix on commit will drift and will fail a round-trip.
- World transforms are derived by walking `childIds`. They are not saved. A cache inside core, if one is ever added, is private, dropped on load, and never read back as an edit.
- Visual payloads are a discriminated union (`rectangle`, `mesh`, …) added by the module that introduces them. Not a class hierarchy with a `draw()` method. Not an entity-component framework.
- Optional capabilities (material, animation, modifiers) are later fields or side tables **inside the same document**, keyed by the same node id. Absence means “does not have this.” They are not a parallel object system.
- Asset bytes are not node fields. A node stores an asset id. Bytes live in the package (section 4).
- Identity is an opaque string supplied by the caller. Core does not read a clock or a random source to mint ids. When ids appear (Module 1), brand `NodeId` and `AssetId` in the type system so structural typing cannot swap them. Branding is erased at runtime; persistence still checks the string.

**Invariant — one scene graph.** Rendering may keep GPU resources and draw-node indexes keyed by domain id and a revision. It may rebuild that view from a domain snapshot. It must not own parent/child relationships, object lifetime, or the transforms that persistence writes. Forbidden as the product scene:

- a Three.js, Babylon, Filament, or similar render-scene graph
- a game-engine world or ECS used as the document
- a 2D display list plus a separate 3D scene that are reconciled at save time
- any path where hit-testing returns a render object and the editor mutates that object instead of calling a domain operation with a domain id

A preview transform during a drag may live in editor session state or in the derived view. On commit, cancel, or crash of the gesture, the domain document is either the pre-gesture value or the single committed value (archive M2-AC-004 is the later requirement; Module 0 only has to leave room for it).

**Module 0 versus Module 1**

| In the core boundary during Module 0 | Wait for Module 1 or later |
| --- | --- |
| Numeric canonicalization used by every later transform and codec | Scene, node, hierarchy, transform records |
| The rule that core data is not a renderer object | 2D primitive, 3D primitive, selection, deletion |
| Package and import walls that make a second graph a reviewable violation | World-matrix evaluation, up-axis, rotation order |
| | Asset records, materials, animation, modifiers |

**Alternative rejected: class hierarchy (`Mesh extends Object3D`).** Methods on the node become the easy place to hang draw, pick, and serialize. Those pull UI and GPU back into the document. Extending behavior then means editing the class tree, which fights archive M1-NFR-002 (new types should not require unrelated type changes).

**Alternative rejected: an ECS framework in Module 0 or Module 1.** Optional capabilities do match a component model. A framework, archetype storage, and system scheduler do not match any current requirement. A discriminated union plus later optional fields is the same idea without the machinery. Revisit only if a real module has many optional behaviors whose combinations are no longer readable as data. That is not Module 0 and it is not the first scene.

**Alternative rejected: store `parentId` and `childIds`.** Either field can represent the tree. Storing both creates two authorities that drift. `childIds` keeps order and topology in one place. The cost is rewriting the parent’s array on reparent, which is the correct cost at this scale.

**Trade-off:** One data scene is less convenient for a renderer that wants to parent draw objects directly, and it forces a sync step. That inconvenience is the product. Two graphs will diverge under undo, save, and 2D/3D promotion (P-05).

### 3. Editor / application versus domain

**Decision:** Domain state is the document that persistence can reconstruct. Editor session state is process-local working state. Core contains only domain state and pure domain operations. The editor owns session state and is the only place that may call platform, persistence, rendering, and UI together.

Detailed session design (tools, selection presentation, viewport navigation, panel layout) is deferred to the Senior 2D / Editor Engineer. The boundary is not deferred.

**Domain state (later modules, persisted, undoable):**

- scene document, node identity, name, hierarchy, transforms, visual payloads
- asset **references** and the metadata required to find bytes inside the package
- schema version after migration to the current document
- nothing whose only purpose is “how this session is looking at the document”

**Editor session state (not in core, not in the project file):**

- selection, hover, active tool, keyboard focus
- the editor viewport’s view: pan, orbit, zoom, and preview matrices. A user-created camera object, when one exists, is domain data. The view used to look at the document is not
- in-progress drag/pointer capture before commit
- undo and redo stacks
- dirty bit, last-saved fingerprint, open-file locator
- clipboard, panel visibility, command-palette text, recent files, user preferences
- which errors are currently displayed

**Core must not contain:**

- selection sets, tools, shortcuts, or viewport cameras
- an undo stack or a command bus
- React, DOM, canvas, WebGPU, or any other UI or rendering type
- filesystem, path, clock, random, network, or clipboard calls
- the current filename, an absolute path, or a platform file handle
- logging sinks. Core throws or returns a typed error. The shell logs it
- a “session” object, a service locator, or a dependency-injection container

The editor calls domain operations. Components do not mutate the document. The renderer does not mutate the document. A future Python sidecar does not mutate the document; it submits bytes that persistence validates and the editor applies through domain operations.

**Alternative rejected: store selection and viewport in the scene “because other tools do.”** That makes save, undo, and cross-platform reload depend on UI. It also makes two windows on one document fight. Rejected. If the PO later wants a project to reopen on the same selection, that is an explicit editor-layout sidecar in the package, still not core, and it is a product decision. Default: do not save it.

**Trade-off:** Keeping session state out of core means the editor package is where features feel slow to wire. Putting them in core is faster at first and makes M0-NFR-002 false as soon as the first tool lands.

### 4. Persistence and project-format direction

**Decision:** The long-term project is a **logical package**: a manifest plus a domain document plus zero or more asset entries. Names inside the package are relative, `/`-separated entry names. The authoritative creative content is the document, not a renderer export and not a database.

Module 0 implements only a closed manifest codec and the pure entry-name rules. It does not implement zip, a directory writer, scene JSON, or assets.

**Recommended user-facing container, for the PO to confirm before any user can save:** one file that is a zip of that logical package. Tests and a future developer mode may use the same entries as an exploded directory. Same names, same manifest, no second schema.

Illustrative layout, **not Module 0 code and not a file extension:**

```text
manifest.json     format id, schema version, later the asset index
document.json     domain document at the current schema
assets/<id>       opaque bytes, content-addressed when assets exist
```

Asset bytes are addressed by content hash when they exist, with the manifest mapping an asset id to that hash and a media type. Nodes store the asset id only. Hash algorithm is not chosen in Module 0. Do not inline image or mesh bytes in `document.json`.

**Alternative rejected: a single JSON file as the project.** Fine for a scene with no assets, which is roughly archived Module 1. Images and meshes then become base64, or the format is thrown away. Diff-friendliness is not worth a migration of every project. A single JSON file also makes “replace one asset” a full rewrite and makes one truncated write destroy the document and the bytes together.

**Alternative rejected for the editable project: SQLite.** Rejected on fit, not on portability. SQLite’s own documentation (sqlite.org/onefile.html, retrieved 2026-10-02) is clear: a database is one cross-platform file, stable back to SQLite 3.0.0 (2004-06-18), including across endianness, and SQLite recommends it as an application file format. The same page notes that temporary journal files exist during transactions. WAL mode also creates companion files. A creative-tool save must not depend on the user copying the steady-state file at the right moment. SQLite can be checkpointed into one file, but:

- the working format is opaque and awkward for golden semantic diffs
- untrusted database files are a large parser surface
- web delivery needs a Wasm build and a browser storage port (OPFS or equivalent), which is a platform concern leaking into the format
- none of this helps Module 0 or the first scene

SQLite remains a possible later cache or local index **outside** the portable project. It is not the project.

**Alternative rejected: a custom binary document.** Compact and fast, and a private parser must be kept honest on every language boundary, including the future Python sidecar. glTF or other interchange binaries belong to export (archived Module 9), not to the working document. The working document stays text so failures are inspectable. Asset payloads are the binary part.

**Alternative deferred: RFC 8785 JSON Canonicalization Scheme for the whole document.** Right idea, wrong time. Module 0’s manifest is two fields and should not take a dependency on a general canonicalizer. Revisit if documents are signed or compared across languages byte for byte. Until then the bar is semantic round-trip of domain values plus exact bytes for the Module 0 manifest writer.

#### Manifest contract (this is the Module 0 persistence API)

Provisional format id, pending PO confirmation before a user-facing save:

```text
formatId: "universal-visual-creation-project"
schemaVersion: 1
```

Canonical bytes, UTF-8, no BOM, no insignificant whitespace, no trailing newline, keys in this order:

```text
{"formatId":"universal-visual-creation-project","schemaVersion":1}
```

Writer emits only that encoding. It builds the bytes from the two fields. It does not walk a general object (`JSON.stringify` would also serialize `Infinity` and `NaN` as `null`, which is silent data loss; MDN `JSON.stringify`, last modified 2026-08-28).

Reader:

- accepts insignificant whitespace as defined by RFC 8259 and either key order
- rejects duplicate keys rather than using host last-key-wins. RFC 8259 section 4 says duplicate member names are unpredictable across parsers. `JSON.parse` alone is not an acceptable duplicate-key policy
- rejects unknown keys, missing keys, non-objects, and a `schemaVersion` that is not the integer `1`
- does not trust key order
- returns a freshly built manifest value, not the object the host parser allocated
- refuses inputs larger than **4096 bytes** before parsing. That limit is only for this manifest, not a project-size limit

#### Versioning and migrations

- `schemaVersion` is a positive integer. It is the compatibility authority. An application build string may be recorded later as diagnostics; it must not decide whether a file opens.
- Persistence owns migrations. They are pure functions from version N to N+1, in order, tested with fixtures. Core types represent only the current version. Core does not contain old document shapes.
- Newer than supported: **reject the whole file.** Do not open a partial scene.
- Older than supported: migrate in memory. Do not write the migrated file back until the user saves.
- A failed migration or a failed decode leaves any already-open document untouched and leaves the user’s previous file untouched.
- **Do not build a migration registry in Module 0.** There is no version 0 document. The first real migration is added with the first actual schema change.

#### Deterministic round-trip

- Module 0 bar: `decode(encode(manifest))` equals the manifest, and `encode`’s bytes are exactly the canonical bytes above. A whitespace variant decodes, then encodes back to those same bytes.
- Later document bar: semantic equality of domain values, not “whatever the host JSON serializer emitted.” Finite numbers only. `-0` becomes `0`. `NaN` and infinities are rejected, never written as `null`.
- Ids are persisted strings, not regenerated on load.
- Encode must not read a clock. Opening or saving must not change creative content because “now” changed.
- Asset bytes are copied verbatim. They are not recompressed on ordinary save.
- When a zip container is implemented, tests compare **entry name + entry bytes**, not compressed zip bytes. Zip timestamps and compressor versions are a known way to fail a byte-identical golden file for no semantic reason. Fix the container metadata (for example a fixed timestamp) at that point; do not pretend Module 0 solved it.

#### Rejection and isolation

Malformed input is an error with a stable code. It is not repaired, not logged with the raw bytes, and not turned into an empty scene.

| Condition | Module 0 behavior |
| --- | --- |
| Empty, oversize, bad UTF-8, BOM, bad JSON, duplicate key, extra key, wrong format id, wrong version | Reject. No manifest object. |
| Valid manifest | Return the two fields. No scene is implied. |

Later, structural damage (cycles, duplicate ids, non-finite transforms, unknown required fields) also rejects the whole load. Hard reject satisfies the archive’s “do not silently corrupt unrelated objects” rule (M1-NFR-004) without dropping user data on the floor. Quarantining bad objects while keeping the rest is a product decision; this review recommends against it. See PO decisions.

Entry-name rules, implemented as pure functions in Module 0 even though no archive is opened:

- UTF-8 NFC only (`name === name.normalize("NFC")`)
- 1 to 255 UTF-8 bytes
- relative, `/` separators only, no empty segments, no leading or trailing `/`
- no `\` , no `:`, no ASCII control characters, no NUL
- no `.` or `..` segment
- a set of names is rejected if two names are equal under ASCII case-fold (`A`–`Z` only)

That last rule exists so a later extract onto a case-insensitive volume cannot collapse `Assets/A` and `assets/a`. It does **not** solve full Unicode case-folding. That gap is accepted in Module 0 only because nothing is extracted. It must be closed, with the Security Engineer, before the first archive reader writes or reads real entries. Zip symlink entries, absolute-path extras, and nested-archive bombs are the same gate: specified here, not implemented.

These rules are the path policy. They do not call the operating system. Platform code may map a user-chosen file to bytes. It must not reinterpret entry names with `path.join` against a user-controlled string.

**PO decisions inside this topic:** file extension, one file versus a folder the user can open, whether hand-editing is a supported workflow, and confirmation of the public format id. Engineering defaults if the PO agrees: not `.json` as the user-facing extension; one container file; hand-editing unsupported even though the manifest is readable; malformed files rejected in full.

**Trade-off:** A zip package is harder to diff in git and must be treated as untrusted input (zip path traversal is a known class of archive bugs; see Sources). A single JSON file is easier now and wrong by the time assets exist. SQLite is a better database than it is a source format for this product.

### 5. Undo / redo direction

**Decision for later modules:** The document is immutable. A domain operation is a pure function:

```text
apply(document, operation) -> { document, inversePatch }
```

The editor keeps undo and redo stacks of those inverse patches in session memory. A patch is the record-level before/after of the nodes (and root `childIds`, if those changed) that the operation actually touched. The inverse swaps before and after. The UI does not build patches by hand. The renderer does not have its own undo stack.

Module 2’s transform undo is one patch per **gesture**, not per pointer move. The editor holds the preview. Commit calls `apply` once. Cancel drops the preview and pushes nothing.

**Relationship to persistence:** The file stores the document after committed operations. It does not store the undo stack. Save, close, reopen yields the document and an empty history. Undo does not go through the filesystem. A failed save does not roll the document back and does not discard history; persistence failure and domain commit are different steps.

**Module 0 must not build:** undo stack, redo stack, command bus, patch engine, gesture transactions, macro recording, history serialization, or “temporary” snapshot infrastructure.

**Alternative rejected: full-document snapshot stack.** Easiest to implement and easiest to trust. Also the easiest way to retain every mesh and image inside history the first time someone puts bytes on the node. Rejected as the architecture. It may be reconsidered in the Module 2 ADR only if nodes hold asset ids, snapshots are structurally shared, and the stacks still live in the editor and are still not written to the file. That reconsideration must not move history into core.

**Alternative rejected: event sourcing as the project format.** A log of every operation is attractive for collaboration and audit. Collaboration is explicitly out of the initial product path. Event schemas are harder to migrate than documents, and load still needs snapshots. Persistence would become a fold over untrusted history. Rejected. A sidecar may later propose operations; those operations are applied to the document and then discarded from the file.

**Trade-off:** Inverse patches require every domain operation to report exactly what it changed. That is more design work than cloning the document. It is also what keeps undo, save, and a future sidecar on the same operations (archive M2-NFR-001: manipulation, persistence, and programmatic access share one transform model). A patch that forgets a changed node is a bug in that operation, caught by a round-trip test of `apply` then inverse, not by a UI test.

### 6. Platform abstraction, and future Python

**Decision:** Core and persistence do not call host APIs. They receive and return values. The editor is the composition root. Platform is the only place that may touch the operating system, the browser, clocks, and real paths.

Do **not** add a service container, a clock port, a random port, or a filesystem interface in Module 0. Nothing in core needs them. An unused port layer is how host types leak in “just for convenience.”

**Clocks.** Domain and persistence functions do not read the current time. If a later field is a timestamp, the editor reads the clock and passes the number in. Encode must not stamp “saved at.” Module 0 therefore has no `Clock` interface.

**Identifiers.** Same rule. The editor supplies ids into domain operations. Core does not call `crypto.randomUUID`, `Math.random`, or a GUID library. Module 0 mints no ids.

**Filesystem.** When save/load exists, platform exposes byte operations roughly of this shape (not Module 0 code):

```text
read(locator) -> bytes
replaceAll(locator, bytes) -> success | failure
```

`locator` is opaque to core and persistence. `replaceAll` either installs the complete new package or leaves the previous complete package readable. No truncate-in-place of the user’s only file. Browser and desktop implementations differ behind that contract (download or File System Access versus an atomic rename on a real filesystem). The editor passes the resulting bytes to `decodeManifest` / the future document decoder. Persistence never receives a path.

**Paths.** Package entry names are validated by the pure functions in persistence (section 4). OS path joins stay in platform and are used for locators the application itself creates, never for raw entry names from a file.

**Capabilities.** The Module 0 shell requests the minimum needed to open a window in development. It does not request project-file access, network access, or a Python process. Later capabilities (filesystem, network, clipboard, GPU device, sidecar) are granted by the shell and passed into the editor. They are not imported by core. No telemetry (product security rules; PO approval would be required).

**Future Python, not a Module 0 runtime.**

- Core does not import Python. Persistence does not import Python. Python does not link against core objects.
- The editor starts a sidecar only when a future, approved feature needs it. Transport (stdio, local socket, or otherwise) is undecided and is not built now.
- Messages are a separate versioned envelope (`protocolVersion`), not the project `schemaVersion`. Payload is untrusted. Persistence or a dedicated validator checks it before any domain `apply`.
- The sidecar proposes operations or a replacement document. The editor applies the proposal through the same domain operations as a user edit, so undo and save stay consistent. A sidecar crash or a schema rejection leaves the open document unchanged.
- Large binary results are asset bytes with the same entry-name and media-type rules as user assets, not a side channel of host pointers.
- Start with the same validated JSON-or-bytes split as the project. A binary RPC codec is justified only by a measured payload, later.

**Alternative rejected: embed CPython or Pyodide in the shell “so we won’t have to migrate later.”** That makes Python a Module 0 runtime, which this review forbids, and it gives untrusted compute the process’s memory. A sidecar keeps the trust boundary at bytes.

**Alternative rejected: a general `Platform` interface with clock, fs, net, and ids, implemented in Module 0.** It has no caller. It will be implemented by calling the host from whichever package was easiest to import. Function arguments at the editor edge are the abstraction.

**Trade-off:** Passing bytes instead of sharing objects costs copies and forces an explicit schema. Shared objects cost a second scene and make web, desktop, and Python three different programs.

### 7. Dependency rules

Recommended package names. The Tech Lead may rename them in the workspace ADR. The Tech Lead may not merge the boundaries.

Allowed import direction:

```text
app        -> editor, ui, platform, rendering
editor     -> core, persistence, rendering, ui, platform
rendering  -> core, platform
ui         -> (no workspace package)
persistence -> core
platform   -> (no workspace package)
core       -> (no workspace package)
```

Nothing imports `app`. No cycles. A type-only import is still an import. A test import is still an import.

| From → To | core | persistence | platform | rendering | ui | editor | app |
| --- | --- | --- | --- | --- | --- | --- | --- |
| core | — | no | no | no | no | no | no |
| persistence | yes | — | no | no | no | no | no |
| platform | no | no | — | no | no | no | no |
| rendering | yes, data only | no | yes, surface/device only | — | no | no | no |
| ui | no | no | no | no | — | no | no |
| editor | yes | yes | yes | yes | yes | — | no |
| app | avoid | avoid | yes | yes | yes | yes | — |

`app` should not become a second editor. It starts the process, attaches logging, and constructs the editor. It does not encode manifests or walk scenes except by calling editor or persistence.

Additional rules:

- **core** has no dependency on a UI framework, a desktop shell, a browser API, Node/Deno/Bun built-ins, or a rendering engine. This is M0-NFR-002, and it is stronger than the archived M0-NFR-002, which only mentioned windowing. The operational text wins.
- **persistence** may depend on core for shared numeric and, later, document types. It does not reimplement `canonicalizeFiniteNumber`. In Module 0 it has no need to call that function yet; the allowed edge still stands. It does not depend on platform. File IO is not how persistence reads.
- **rendering** may read core data once that data exists. It does not import persistence, editor, or UI. It does not write domain objects. Module 0 rendering code has no scene to read and depends on nothing.
- **ui** does not import core. The editor hands it strings and numbers. This is deliberate duplication of view values to keep components from calling domain operations.
- **platform** does not import core. It does not learn manifest fields.
- **editor** is the only package that knows both “bytes on disk” and “document in memory.”
- Logging implementation lives in `app` or `platform`. Core and persistence error values contain a code and a short message. They do not contain the untrusted payload.
- No package may depend on a future Python runtime, a cloud SDK, or an AI SDK in Module 0.

**Enforcement, required in Module 0:** declared package dependencies must not list a forbidden package, **and** a CI check must fail on a forbidden import even if the declaration was bypassed. The tool is the Tech Lead’s and DevOps’ choice. The failure must be non-zero and visible (M0-NFR-004, test-plan TP-M0-I-001 and TP-M0-I-002). Core tests run without opening a window and without a DOM implementation.

**Alternative rejected: ui may import core types.** Fewer duplicated props, and then widgets start calling operations “because the type was already there.” If a later module has a concrete need, the Tech Lead can allow **type-only** imports of branded ids by ADR. Not in Module 0, and never mutations from `ui`.

**Alternative rejected: rendering imports persistence so it can “load the scene itself.”** Then the renderer owns load errors, migrations, and partial documents. Load stays in the editor: platform reads bytes, persistence decodes, editor holds the document, rendering receives a snapshot.

**Trade-off:** The strict `ui` rule adds pass-through props. The loose rule is how a second scene starts in a component’s `useState`.

### 8. What this review needs the Tech Lead to resolve

Recorded in full in the final section. The decisions that can invalidate this recommendation, rather than merely schedule follow-up, are:

1. Whether every target, including desktop, can host this TypeScript package.
2. Whether any engineer’s shell or renderer proposal requires the render graph to be authoritative. The answer this review will defend is no.
3. Whether Module 0’s CI will actually fail closed on the import table above.

---

## Module 0 implications

### Build

Packages, or equivalent workspace projects, for `core`, `persistence`, `platform`, `rendering`, `ui`, `editor`, and `app`. Empty boundaries still have a public entry module so the import check has something to scan. No behavior is added just to make a package look busy.

**`core`**, headless, no I/O:

- `DomainError` with a stable `code` and a short message. No payload echo.
- `canonicalizeFiniteNumber(value: number): number`
  - returns the value if it is a finite number
  - returns `0` if the value is `-0`
  - throws `DomainError` with code `NON_FINITE_NUMBER` for `NaN`, `Infinity`, `-Infinity`, and for values that are not numbers
- `canonicalizeFiniteTriple(value: readonly [number, number, number]): [number, number, number]`
  - runs the same rule per component
  - throws the same error; does not repair a bad component into `0`
- Unit tests that cover those cases and that run without a window.

This is the numeric contract later transforms, patches, and codecs share. It is not a vector library and not a transform type. Do not add a `Vector3` class, a math dependency, or a scene type beside it.

**`persistence`**, headless, no filesystem:

- constants `FORMAT_ID` and `SUPPORTED_SCHEMA_VERSION` as specified above
- `ProjectManifest` type with those two readonly fields
- `PersistenceError` with stable codes: `EMPTY`, `TOO_LARGE`, `INVALID_ENCODING`, `INVALID_JSON`, `DUPLICATE_KEY`, `INVALID_SHAPE`, `UNSUPPORTED_FORMAT`, `UNSUPPORTED_SCHEMA_VERSION`, `ENTRY_NAME_REJECTED`, `ENTRY_NAME_CONFLICT`
- `encodeManifest(manifest: ProjectManifest): Uint8Array` producing the exact canonical bytes
- `decodeManifest(bytes: Uint8Array): ProjectManifest` with the rejection rules in section 4
- `validatePackageEntryName(name: string): void` with the entry rules in section 4
- `findPackageEntryConflicts(names: readonly string[]): void` for ASCII case-fold collisions and for names that fail validation
- tests for canonical round-trip, whitespace and key-order acceptance, every rejection code above, duplicate keys, 4096 versus 4097 bytes, BOM, and representative hostile entry names (`..`, `/etc/passwd`, `a\\..\\b`, `C:`, `foo//bar`, non-NFC, `Assets/A` versus `assets/a`)
- error objects must not include the input bytes

These tests are the headless core/persistence evidence for M0-FR-002, M0-NFR-003, M0-AC-005, and M0-AC-006. They also give TP-M0-I-002 something real to inspect. They are not a project writer.

**Boundary packages with no domain behavior:**

- `platform`: allowed to be the home of host calls. Module 0 does not add a filesystem API. If the shell needs a window, that call stays here or in `app`, never in `core`.
- `rendering`: entry module only. No engine, no scene, no GPU init required by this review.
- `ui`: the minimal shell’s presentation lives with the design and UI decisions. It does not import `core`.
- `editor`: entry module only. No selection, tools, undo, or pass-through wrappers around `decodeManifest`. A headless test may import `persistence` from the editor test suite to prove the allowed edge; production editor code does not need a wrapper to do that.
- `app`: minimal shell and startup diagnostics (M0-FR-001, M0-FR-006). Diagnostics identify startup, initialization failure, and fatal startup failure. They are not a logging framework. They do not log environment dumps or file payloads.

**Import-boundary check in CI**, failing closed, as in section 7.

No new runtime dependency is required for the codec or the numeric helpers. Do not add a JSON-schema package, a zip package, a math package, an undo package, or a DI package in Module 0.

### Do not build

- a scene graph, node type, transform type, hierarchy walker, or empty-scene factory that is “just a placeholder” for Module 1. Placeholders become the model
- a project writer, zip writer, directory writer, SQLite file, asset store, or migration registry
- undo/redo, commands, patches, or history
- clock, random, filesystem, network, or Python ports
- a second scene type inside `rendering`
- selection and tools inside `core` or `editor` beyond the empty editor boundary
- Blazor, Pyodide, wasm-bindgen, or a Rust crate
- user-facing file extensions and file dialogs
- telemetry
- requirement or acceptance-criterion edits to make this recommendation easier

Module 0 is GREEN only against the operational specification. Satisfying this review is not a substitute for M0-AC-001 through M0-AC-012.

---

## Risks, assumptions, PO decisions, open questions

### Risks

1. **Desktop cannot host the TypeScript package.** The language decision fails. Mitigation: Tech Lead confirms the host before READY FOR DEVELOPMENT. Fallback: Rust core, with the one-scene rule rewritten around a command/document boundary, not a mirrored JS graph.
2. **A renderer is adopted with its own scene graph and the domain is “synced later.”** This will break P-01, save/reload, and undo. Mitigation: the invariant in section 2 is an ADR, and rendering code review rejects authoritative render parenting.
3. **`JSON.stringify` becomes the real project writer.** Non-finite numbers become `null` (MDN, 2026-08-28). Duplicate keys and key order vary in practice (RFC 8259 sections 4 and 6). Mitigation: the Module 0 writer is closed-form; later document writers must reject non-finite numbers and must not persist class instances.
4. **Zip slip and archive bombs when the container lands.** Mitigation: entry rules exist now; extraction code is security-reviewed before it exists; no extraction in Module 0.
5. **Unicode case-folding gap.** ASCII fold does not catch every pair that a case-insensitive filesystem will collapse. Accepted only until the first real archive reader.
6. **Euler storage drifts once gizmos exist.** Mitigation: commit the edited triple; do not persist a second rotation; decide order and units in the Module 1 ADR before transform tests are written.
7. **Undo captures asset bytes.** Mitigation: bytes are not document fields; history is not built in Module 0; Module 2 tests must show a gesture patch does not contain asset payloads.
8. **Import lint is documented and never turned on.** The boundary will be crossed in the first feature. Mitigation: TP-M0-I-002 is a failing CI check, not a narrative review.
9. **Schema id and version 1 get treated as a public compatibility promise** because tests lock the bytes. Mitigation: mark them provisional until the PO confirms the public id and until a user-facing save exists. Renaming before that save is free. Renaming after it is a migration.
10. **Performance surprise on the first real mesh.** Mitigation: asset-by-reference and replace-whole-buffer rules; a Wasm kernel is allowed behind a pure function; moving the scene is not allowed silently.

### Assumptions

- The operational specification, not archive section 9.1, is the Module 0 contract. In particular, core must stay free of UI frameworks and of platform filesystem APIs, and all listed boundaries exist even when their code is minimal.
- Web and desktop are both required to share one project model (P-08). Module 0 does not ship all four targets (M0-NFR-007).
- Archived Module 1 is the first consumer of a real scene and a real save. Archived Module 2 is the first consumer of undo. Neither is authorized by this review.
- A headless JavaScript test runner is available on the primary development environment once the Tech Lead pins the toolchain. This review does not choose Node, Deno, or Bun, and it does not claim one is installed.
- The minimal shell’s UI technology will be chosen by the Tech Lead with the design and editor/rendering engineers. This review only constrains what that shell must not import into core.
- Hand-edited projects are not a support commitment unless the PO says they are.
- No user projects exist, so there is no migration obligation yet.

### Decisions that need the Human Product Owner

These are product-visible. They do not block designing the Module 0 shell. They block shipping a user-facing save (the first one is archived Module 1, not Module 0).

1. **File extension and package presentation.** One container file versus a directory a user can browse. This review recommends one file, not a `.json` extension. The extension string itself is a product choice.
2. **Public format identifier** `universal-visual-creation-project`, or a different id, before any file is something a user can keep.
3. **Is hand-editing supported?** Recommended answer: no. The manifest stays readable for diagnosis. Invalid files are rejected whole; the application does not repair them.
4. **Newer files.** Recommended answer: refuse to open a newer `schemaVersion`, with an explicit error. No partial import.
5. **Bad objects inside an otherwise readable file.** Recommended answer: reject the file. Do not drop the bad objects and continue.
6. **Does undo history survive save and reopen?** Recommended answer: no. Confirm before Module 2, not during Module 0.
7. **One scene per project or several scenes in one project?** The overview speaks of a unified scene. Archive section 4.2 says a project contains one or more scenes. Module 0 does not encode either choice. It must be decided before the Module 1 document schema is implemented.
8. **Whether “reopen where I left off” (selection, panels, viewport) is product behavior.** Recommended answer: no, not in the creative document. That can be revisited without changing core.

### Open questions and disagreements for the Tech Lead

1. **Confirm or reject the JavaScript host assumption** with the desktop and rendering proposals. If it is rejected, do not implement a TypeScript core “for now.”
2. **Up-axis, handedness, rotation order, and degrees versus radians** are unresolved on purpose. This review will not guess Y-up versus Z-up. They are one schema constant, required before Module 1 transform acceptance tests, and they are not a Module 0 blocker.
3. **`ui` → core type-only imports.** This review forbids them in Module 0. Override only by ADR if a real shell requirement appears.
4. **Inverse patches versus structural snapshots** at Module 2. This review chooses inverse record patches. A snapshot design is acceptable later only under the constraints in section 5, and only in an ADR. Do not build either in Module 0.
5. **Hard reject versus quarantine** of malformed objects. This review chooses hard reject. If another engineer reads archive M1-NFR-004 as “skip the bad object,” that disagreement is product-visible and goes to the PO with question 5 above.
6. **Workspace tool and import-lint tool** are open. The rule table is not open. DevOps owns the CI mechanism; this review owns the allowed edges.
7. **Hash algorithm and media-type allowlist for assets** are intentionally undecided. They are not needed to keep bytes out of the document model.
8. **Python transport and protocol codec** are intentionally undecided. The boundary (serialized, versioned, validated, no shared scene) is not undecided.
9. **Expected disagreement with rendering:** manipulating a live engine node and writing back on mouse-up. Preview state may be live. The committed transform may not originate from the engine’s stored parent matrix.
10. **Expected disagreement with editor/UI:** using the UI toolkit’s state history as undo. Rejected. Undo stacks live in editor session state and store domain patches only.

Unresolved items 2, 5, 7, and 8 are not missing research. The repository does not contain a product decision or a measured workload that would justify closing them now.

---

## Sources

Checked 2026-10-02.

- TypeScript handbook, “TypeScript for the New Programmer,” last updated 2026-09-28. Types are erased; runtime behavior is JavaScript; no TypeScript runtime library. <https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html>
- MDN `Number`, last modified 2026-07-12. JavaScript numbers are IEEE 754 binary64. <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number>
- MDN `JSON.stringify`, last modified 2026-08-28. `Infinity` and `NaN` are serialized as `null`. <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify>
- RFC 8259, December 2017, retrieved 2026-10-02. Section 4: duplicate object names are not interoperable. Section 6: `Infinity` and `NaN` are not permitted JSON numbers. <https://www.rfc-editor.org/rfc/rfc8259>
- MDN “Compiling from Rust to WebAssembly,” last modified 2026-09-08. <https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/Rust_to_Wasm>
- wasm-bindgen guide and project README, retrieved 2026-10-02. The guide describes current JS/Wasm interop; the README’s MSRV history shows maintenance continuing through 2026. <https://wasm-bindgen.github.io/wasm-bindgen/> and <https://github.com/wasm-bindgen/wasm-bindgen/blob/main/README.md>
- `rustwasm/book` repository, archived by its owner on 2025-08-25. Cited only as evidence that the old book is not the current toolchain home. <https://github.com/rustwasm/book>
- MDN `SharedArrayBuffer` / WebAssembly shared memory, retrieved 2026-10-02. Cross-origin isolation is required to share memory across workers. <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer>
- Microsoft Learn, “ASP.NET Core Blazor hosting models,” retrieved 2026-10-02 (`view=aspnetcore-10.0`). Blazor Server has no offline support and uses a server circuit; Blazor WebAssembly downloads a .NET runtime and interprets IL unless AOT is enabled; AOT trades speed for size; Hybrid uses a native host plus a web view. The page’s support banner is internally inconsistent about which .NET version is current, so this review does not select a .NET version. <https://learn.microsoft.com/en-us/aspnet/core/blazor/hosting-models?view=aspnetcore-10.0>
- Pyodide documentation version 314.0.7, “Downloading and deploying Pyodide,” retrieved 2026-10-02. Full distribution described as 200+ megabytes. <https://pyodide.org/en/stable/usage/downloading-and-deploying.html>
- Pyodide documentation version 314.0.7, Wasm constraints, retrieved 2026-10-02. Reduced standard library and browser networking limits. <https://pyodide.org/en/stable/usage/wasm-constraints.html>
- SQLite, “Single File Database,” retrieved 2026-10-02. Cross-platform stable file format; journal files exist during transaction control and are not part of the steady-state database. <https://sqlite.org/onefile.html>
- Android documentation, “Zip Path Traversal,” retrieved 2026-10-02. Archive entry names can escape the destination directory if they are concatenated without a check. <https://developer.android.com/privacy-and-security/risks/zip-path-traversal>

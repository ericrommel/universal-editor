# Module 3 — threat note for the first untrusted content

**Role:** Senior Application Security Engineer

**Status:** Preparation for issue #9. Not implementation authorization. Not a request for a Product Owner decision. Not a format, character-set, or size-cap selection.

**Date:** 2026-10-06

**Tree:** `m3/preparation` at `5e99484`. No application code, dependency, decoder, or workflow is changed.

Archive section 9.4 in `docs/archive/product-engineering-specification-v1.0.md` is context only. Its `M3-*` identifiers are not operational requirements. The sentences used below are: import a supported raster image; invalid or unsupported image input fails with a visible error and does not corrupt the project; text content and in-scope appearance survive save/reload; no image filters; no marketplace.

## 1. Status

Module 0 is GREEN at `main` `5e99484`. It does not open project files, assets, network responses, or user images. Module 1 and Module 2 are not GREEN. This note does not implement Module 3.

The unapproved Module 1 proposal is pull request [#33](https://github.com/ericrommel/universal-editor/pull/33). Its security review is on pull request [#32](https://github.com/ericrommel/universal-editor/pull/32), not in the specification branch. The proposal excludes text and images, and its 262144-byte scene figure is not approved. Five dissent rows on that proposal remain unresolved: selection storage, extents, document shape and byte cap, insert and delete, and stable error codes (`preparation/dependency-map.md`, section 1). This note does not resolve them and does not extend that proposal.

No image was decoded. No exploit was written. No numeric limit in this file is policy.

This pass records constraints for later implementers. It does not ask the Product Owner to choose a raster format, a pixel or byte cap, a display-name alphabet, or a container. Those decisions stay premature (`preparation/dependency-map.md`, section 6).

## 2. Trust boundary that does not exist yet

The boundary is the first untrusted content this product would accept: raster image bytes, object display names, and text content. Architecture section 22 and ADR-0007 name project files, imported assets, non-loopback network, plugins, scripts, and marketplace content as untrusted and unimplemented. Module 0 builds no parser and no sandbox for them.

Shipped controls already keep that boundary closed:

- **Core has no filesystem.** Architecture section 18: core and persistence must not import `node:fs` or `node:path` used as I/O. ADR-0006: persistence does not call the filesystem. `@uvcp/core` exports numeric helpers and `DomainError` only. `@uvcp/platform` has no runtime export (`packages/platform/src/index.ts`).
- **The shell must not import persistence.** Architecture section 10: `shell` may import `ui`, `editor`, and `platform`. It must not import `core`, `persistence`, or `rendering`. Persistence is not a file dialog.
- **The manifest is closed.** `writeManifest` takes no input and emits exactly `{"formatId":"universal-visual-creation-project","schemaVersion":1}`. `readManifest` caps the input at 4096 bytes before decode, rejects unknown keys, and uses fixed messages (`packages/persistence/src/manifest.ts`). The source comment states that cap is the provisional manifest, not a project-size limit. Architecture section 8: malformed manifests are rejected whole.
- **Entry-name checks do not extract.** `checkEntryNames` rejects a non-NFC name, a UTF-8 length outside 1–255, ASCII controls, `\`, `:`, an empty, `.`, or `..` segment, and an ASCII case-fold collision (`packages/persistence/src/entry-name.ts`). It does not open a path. ADR-0006 accepts the ASCII-only fold only because nothing is extracted.
- **Logs are a closed startup record.** Architecture section 17 and `packages/editor/src/diagnostics.ts`: one JSON line with `event`, `shell`, `version`, `step`, and on failure a code and message. No file contents, no environment dump, no tokens. Events are `startup.beginning`, `startup.ready`, and `startup.failed` only.
- **The shell is not an importer.** Architecture section 22: loopback page, no application network client, no remote font or frame, production CSP including `object-src 'none'`. `packages/ui/src/foundation-screen.tsx` renders a startup diagnostic as a text child so a leading `<` stays text. That screen is not a text object and not an ingest error.

These controls do not accept raster bytes, names, or text. They stop this preparation from growing a quiet path that does. Map key M3-NOW-02 is this section plus section 4: image bytes stay out of the manifest and out of core, and no decoder is added.

## 3. Threats preparation can name

One class per row. "Record now" needs no Product Owner answer and authorizes nothing. The other classes are why the control cannot be built yet.

| Threat | Class |
| --- | --- |
| Raster bytes, display names, and text are untrusted. Module 0 does not accept them. This preparation adds no parser, decoder, image library, font, or fetch. | record now |
| Image bytes, text, or names placed in the two-field manifest, or a raised 4096-byte cap treated as a project or image limit. | record now |
| Zip, SQLite, a directory layout, or one JSON document that holds images as base64. ADR-0006 compares a manifest plus a document plus asset entries, one JSON file, SQLite, and a custom binary document, and selects none. It states that a single JSON file becomes base64 or forces a format change once images exist. | blocked on an approved container (Module 1 and ADR-0006) |
| An archive entry that expands far beyond its stored size. Nothing in Module 0 extracts. | blocked on an approved container (Module 1 and ADR-0006) |
| Codec expansion, a polyglot that is also another grammar, huge pixel dimensions, and non-pixel metadata inside a raster. Named in the paragraphs below. No number is attached. | record now |
| Which raster formats are supported, and any byte, pixel, or metadata cap. | product decision later, not now |
| SVG, HTML, or another script-bearing format, treated as a kind of raster. | product decision later, not now |
| A failed ingest that mutates a scene or leaves a partial object. No scene and no mutation API exist. The shape, once they exist, is section 4. | blocked on a scene mutation API (Module 1) |
| A person seeing that failure. The foundation screen reports startup only. There is no creation surface and no project-error surface. | blocked on a visible error surface (later UI, Module 2 or 3) |
| Error text or a diagnostic that echoes bytes. The manifest already refuses this. Ingest does not get a wider log. | record now |
| A display name used as a filesystem path, written into a diagnostic line, assigned as a property on parsed JSON, or displayed through bidirectional overrides that hide the stored sequence. The allowed character set is not chosen here. | record now |
| The allowed character set for display names and text. | product decision later, not now |
| Text or a display name parsed as HTML, or fetched because it looks like a URL. Metadata is included. | record now |
| A remote font, a stock-image download, or any application network client added so import can "just work." | record now |
| Unicode case collisions beyond ASCII A–Z, before a reader maps names onto stored entries. | record now |

**Expansion, polyglots, dimensions, metadata.** A small stored sequence can expand, inside a future archive or inside a raster codec, to a much larger working set. Pixel width and height can demand memory far beyond the file size. Metadata can be large and can carry text that is not pixels. A byte sequence can also match more than one format. A header check is not permission to run a second parser. None of these sentences is a limit. Setting one now would freeze an unapproved budget (dependency map, section 6). Map key M3-DEP-M1-02 stays blocked on Module 1 and on an approved container. The 262144-byte figure is not that container and is not an image budget.

**SVG and HTML.** The archive context is a raster. SVG, HTML, and other script-bearing formats can carry markup, script, or fetches. Admitting them is a new trust decision. It is not a subtype of the raster sentence, and this note does not make it.

**Failure before commit.** ADR-0006 says the manifest reader rejects a bad document whole, and that this rule is about two JSON fields, not a decision to reject a later user file in full. This note does not reverse that. What it does require, once a scene mutation API exists, is narrower: invalid or unsupported image input fails before any mutation of the caller's scene, returns no partial object, and does not corrupt that scene. There is no scene today, so the control cannot be implemented. Showing the failure is a later UI concern (Module 2 or Module 3), not a change to the foundation screen.

**Display names are not entry names.** `checkEntryNames` allows relative `/` segments on purpose and exists for names that might become archive entries. It is not a rename policy and not an extractor. Calling it to accept a rename would miss the display-name risks below. Unsafe, without choosing an alphabet: storing path characters and later using the name as a filesystem path; interpolating the name or the text into a diagnostic line (the log contract is one JSON object with no user contents); assigning the name as a property on an object that came from JSON; and bidirectional overrides that make the displayed label differ from the stored sequence. Text content has the same log and bidi risks. Durability of text across save and reload is archive context and is blocked on the container. It is not tested here.

**Text is data.** It must not be interpreted as HTML and must not be fetched as a URL. The same applies to a display name and to raster metadata. The foundation screen's text child is the existing pattern for application diagnostics. It is not a text-object renderer. CSP is not a reason to parse text as markup, and this note does not relax CSP.

## 4. Safe preparation conclusions

A later implementer must not violate these. They are preparation constraints. They are not approved requirement identifiers.

1. **The manifest stays closed.** Do not add image bytes, text, display names, or metadata to `writeManifest` or `readManifest`. Do not raise the 4096-byte cap and call it a project limit. Unknown keys still fail as shape. Messages stay the fixed strings in `packages/persistence/src/manifest.ts`, which do not include the input. The duplicate-check failure is a fixed `Error` for the same reason.
2. **No image bytes in core.** `@uvcp/core` does not gain a raster buffer, a filesystem read, or a path. A later image reference, if an approved scene stores one, is not a copy of the bytes inside core.
3. **No decoder dependency in this preparation.** No image library, font package, native image toolchain, fixture raster, or network fetch. A later dependency is not pre-approved. ADR-0007's license, audit, and install-script rules still apply. This note requests no copyleft exception and no secret for an asset service.
4. **Reject before commit.** Once a scene exists, failed ingest does not mutate it and does not return a partial object. Error text does not echo the bytes, a decoded excerpt, a key, or a host exception that quotes input. Follow the manifest shape. Do not treat that shape as ADR-0006 deciding that every later user file is rejected in full.
5. **Logs exclude bytes.** Do not add image bytes, display names, text, metadata, or paths derived from them to diagnostic records. Do not widen `packages/editor/src/diagnostics.ts`. No environment dump and no tokens. The startup diagnostic is not the ingest-error channel.
6. **The entry-name checker is not an extractor and not a display-name policy.** `checkEntryNames` does not open, write, or unzip anything. A name that passes is not permission to touch the filesystem. Do not call it to accept or reject a rename.
7. **The Unicode case-fold gap reopens before a real archive reader.** `asciiFold` folds only ASCII A–Z. The comment in `packages/persistence/src/entry-name.ts` and ADR-0006 accept that gap only because Module 0 extracts nothing. ADR-0006 makes it a review item before the first real archive reader. Closing it is not a display-name policy, and this note does not choose a fold for display names.

Also in force for that later implementer: the shell still does not import persistence; platform still exports no filesystem or network API; text is still not HTML and still not a URL fetch; SVG and HTML are still a new trust decision.

## 5. Non-goals

- Implementing Module 3, or implementing Module 1 or Module 2 in order to unblock it.
- Selecting zip, SQLite, a directory layout, a single JSON project file, or any other container.
- Choosing raster formats, pixel limits, byte limits, metadata limits, or a display-name or text alphabet.
- Resolving the five Module 1 dissent rows, or adopting the unapproved 262144-byte figure.
- Adding a decoder, image library, font, sample image, or network client.
- Admitting SVG, HTML, or script-bearing formats.
- Image filters, templates, and an asset marketplace.
- Plugins, collaboration, AI-generated assets, or a script host.
- An undo strategy, a viewport, a draw list, or a creation surface on the foundation screen.
- Changing CSP, the diagnostic field list, the manifest codec, `checkEntryNames`, or `pnpm verify`.
- A Product Owner decision in this pass. Formats, limits, and the container block implementation later. They do not block this record.

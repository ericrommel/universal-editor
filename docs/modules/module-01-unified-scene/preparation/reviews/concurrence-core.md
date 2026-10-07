**Role:** Senior Core / Platform Engineer

**Concur.** At commit `5290d80048ee7ec3bf46edf4d0fdf32273377c9d` (`5290d80`), the reconciled Module 1 contract fits `@uvcp/core` and `@uvcp/persistence` and does not break the accepted Module 0 contract. This is a preparation concurrence for issue #52. It is not Product Owner approval and not implementation authorization.

The normative text is `specification.md`. ADR-0009 is the package decision. `preparation/reconciliation.md` closes the five rows. `preparation/core-platform.md` remains the record of the shipped Module 0 constraints. It is not a second contract.

## Scene value

The scene value fits `@uvcp/core`.

Section 5 puts one immutable scene in core: `rootIds`, `nodes`, and operations that return a new frozen scene without mutating the input. Core still imports no UI, React, filesystem API, or workspace package. It does not parse bytes and does not mint an id. ADR-0009 adds no package and no import edge. At this commit, `packages/core/src/index.ts` exports only `DomainError`, `canonicalizeFiniteNumber`, and `canonicalizeFiniteTriple`, and `packages/core` imports no workspace package. That edge stays.

## Numeric helpers

`canonicalizeFiniteNumber` and `canonicalizeFiniteTriple` stay as shipped.

`packages/core/src/number.ts` still returns a finite number, maps `-0` to `0`, and throws `DomainError` code `NON_FINITE_NUMBER` with message `Expected a finite number.` A value that is not three finite numbers fails the same way. ADR-0006 binds that behavior. Q-M1-B-002, ADR-0009, and section 5 leave the helpers unchanged. Zero and negative scale still pass. An extent is the helper's result and must then be strictly greater than zero, so `0`, `-1`, and `-0` are `INVALID_EXTENT` and a non-finite extent is `NON_FINITE_NUMBER`. That is one extent result. It does not edit the helper.

## Scene codec

The codec fits `@uvcp/persistence`.

`readScene` and `writeScene` are a new document, not an extra argument on `writeManifest`. Persistence may import `@uvcp/core` and still must not call the filesystem. At this commit, `packages/persistence` depends only on `@uvcp/core`, and `packages/persistence/src` does not reference the filesystem. ADR-0006 defers who writes a user file. Section 4 and section 9 keep that deferral. No runtime dependency is added. The duplicate walk is not the manifest function, and ADR-0007's manifest rules stay on the manifest.

## Manifest

`writeManifest` remains the closed two-field Module 0 document, and the 4096-byte cap stays on that document only.

`packages/persistence/src/manifest.ts` takes no document and returns the UTF-8 bytes `{"formatId":"universal-visual-creation-project","schemaVersion":1}`. `MANIFEST_BYTE_LIMIT` is 4096, checked before decode. Unknown keys fail `INVALID_SHAPE` before `formatId` is considered. M1-FR-008, M1-AC-006, M1-NFR-005, and ADR-0009 require those same bytes, codes, messages, and cap. `readScene` rejects those canonical bytes with `UNSUPPORTED_FORMAT`. `readManifest` rejects a scene document by the Module 0 rule already in that file, so `roots` and `nodes` are `INVALID_SHAPE`, not a new manifest code. The scene cap of 1048576 applies to `readScene` and `writeScene` only. A length equal to that cap is inside it. A greater length is `TOO_LARGE` before decode.

## Closed rows

Each closed row has one observable result. This review does not reopen the alternatives.

Selection is not a scene field, a document field, or an editor API. A `selection` key is `INVALID_SHAPE`. Delete names a node id.

Extents are strictly greater than zero after the unchanged helpers. A mismatched `depth` is `INVALID_SHAPE`.

The scene document is one flat object. Children are id strings. The writer order is parent before children, siblings in list order. The reader ignores `nodes` array order. The scene cap is 1048576. The manifest cap stays 4096.

`insertNode` takes a parent id, or null, and an integer index. The current length appends. An index outside that range is `INVALID_HIERARCHY`. `deleteNode` removes that subtree and does not promote children. An unknown id is `UNKNOWN_NODE`.

The section 8 catalog is the code list, and the first matching rule wins. Scene messages are those fixed sentences. Manifest messages stay the Module 0 sentences, including `Expected a finite number.`

## Boundary

No scene value, codec, viewport, save format, or dependency is added here. `@uvcp/editor`, `@uvcp/rendering`, `@uvcp/ui`, `@uvcp/platform`, and `apps/shell` do not change. The null-renderer draw list stays empty. The specification stays unauthorized until the Product Owner approves it. This concurrence does not merge and does not push.

# Module 3 — Inherited application-security boundary

**Role:** Senior Application Security Engineer

**Status:** Preparation input for issue #9. Not a specification. Not implementation authorization.

**Date:** 2026-10-06

Product Owner approval of pull request #50 is the comment on issue #7: https://github.com/ericrommel/universal-editor/issues/7#issuecomment-6013883562. The approved head is `13f1725`. That head is not merged. Module 1 is not GREEN. This note does not edit the Module 1 specification. Its status line is stale relative to that comment.

The approved document rejects unknown keys, rejects prototype-pollution keys, rejects the whole document on failure, and does not echo document bytes in errors. `selection` is an unknown key. The scene document cap is 1048576. That document has no images. The manifest cap is 4096. Neither number is an image budget. The earlier preparation review's 262144-byte figure is not this cap.

Module 2 preparation does not log pointer paths, key sequences, or scene contents. That preparation has no blocking security finding.

ADR-0006 has not selected a container. This note does not select one.

## Later creation data

Image bytes are untrusted input. They stay out of `@uvcp/core`, the two-field manifest, and the schema-1 scene document.

Text and display names are data. They are not HTML, not URLs to fetch, and not archive entry names. `checkEntryNames` is not a display-name policy.

A created object does not carry a script, a handler, or a prototype key. The approved reader already rejects `__proto__`, `constructor`, and `prototype`, and it does not assign, spread, or merge parsed keys onto the scene. Later creation does not add those keys.

Diagnostics for later creation must not log image bytes, text payloads, pointer paths, or scene contents.

A failed image read must not be defined as the foundation-screen diagnostic. It must not leave a partial scene. The caller's previous scene stays unchanged, and the failure returns no partial object. This note does not choose formats or size limits.

No new security control is weakened. Error text still does not echo input bytes. This note adds no decoder.

This record does not implement creation, does not merge Module 1, and does not request a Product Owner decision.

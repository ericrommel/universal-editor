# Module 4 — Trust-boundary delta

**Status:** Preparation input for issue #10. Not a specification. Not implementation authorization.
**Role:** Senior Application Security Engineer
**Date:** 2026-10-06

A stroke does not open the approved Module 1 document and does not add a capability. This note is that threat-model delta. It does not select a container.

## What still binds

Schema 1 stays closed. The reader rejects an unknown kind, an unknown key, and the prototype keys `__proto__`, `constructor`, and `prototype`. A failure throws `DomainError` and yields no scene. The caller's previous scene is not modified. After an accepted document and after a rejected document, `Object.prototype` is unchanged. The reader does not assign, spread, or merge parsed keys onto an object. It does not drop one bad node and keep the rest.

A curve stuffed into schema 1 is an unknown kind or an unknown key. That is a rejected document. Do not weaken the reader so a stroke can ride in schema 1.

The scene byte cap stays 1048576, checked on the `Uint8Array` before UTF-8 decode and before parse. That number is the document cap. It is not a stroke budget.

The Module 2 diagnostic rule still binds: do not log pointer paths, key sequences, or scene contents. No failure message includes the document, a key, an id, or a numeric excerpt.

## Control points

Control points are untrusted numbers when they later arrive from a document or a pointer. The event handler is not the rejection boundary.

A non-finite number is already rejected by the finite-number helper. The code is `NON_FINITE_NUMBER`. The message stays that helper's fixed sentence. Do not repair a bad component. Do not add a second error type for that case.

This note does not choose a point-count limit. 1048576 is not that limit.

## What a stroke must not carry

A stroke must not carry a script, a URL, a handler, or a prototype key. Those are not geometry. A script is not evaluated. A URL is not fetched. A handler is not installed. A prototype key is not assigned. None of them is a reason to grant network, remote script, or any other capability.

## Diagnostics

Do not log pointer paths, key sequences, or scene contents. A stroke's sampled points are pointer data and scene data. Do not log them. Do not log control points.

## Container

No container is selected. This note does not select one.

## Finding

Preparation keeps schema 1 closed, treats later control points as untrusted numbers under the existing finite-number helper, refuses script, URL, handler, and prototype keys on a stroke, sets no point-count limit, selects no container, adds no capability, and logs no stroke samples.

No blocking finding for preparation.

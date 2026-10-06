# Module 2 — Trust-boundary delta

**Status:** Preparation input for issue #38. Not an implementation review. Not Product Owner approval. Implementation stays unauthorized.
**Role:** Senior Application Security Engineer
**Date:** 2026-10-06

Direct manipulation sits on the Module 0 loopback web shell. This note is the threat-model delta for that. It does not amend ADR-0007. It does not reopen `docs/modules/module-00-foundation/evidence/security-review.md`. That review's "no blocking finding" is not this result.

## What still binds

The shell stays the conditioned loopback page. The dev server binds to `127.0.0.1`. No filesystem API, no process spawn, no application network client, no remote script, font, stylesheet, or frame, and no service worker. The production content security policy stays `default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`. Core does not import the shell, React, or filesystem APIs. `@uvcp/platform` gains no capability.

Diagnostics stay on ADR-0007's closed fields, also architecture section 17: `event`, `shell` (`browser`), `version`, `step`, and on failure an application error code and message. Events remain `startup.beginning`, `startup.ready`, and `startup.failed`.

ADR-0007's license rule still applies to any later package. An `OR` passes only when every disjunct is on the permissive list. Choosing the permissive side is not Product Owner approval of the package.

## Pointer and keyboard input

Pointer and keyboard events are untrusted input. They already arrive inside the loopback shell. They are not a new origin and not a reason to add a host bridge.

The event handler is not the rejection boundary. A later command that writes a transform must reject the value before the document changes, using the existing domain-error shape:

- A non-finite transform fails the finite-number rule in `packages/core/src/number.ts` (`canonicalizeFiniteNumber` / `canonicalizeFiniteTriple`). That is `DomainError` code `NON_FINITE_NUMBER`. Do not repair a bad component to `0`.
- An unknown object id fails the same shape: `DomainError` from `packages/core/src/domain-error.ts`, a stable code, a short message, and no payload echo.
- On either failure the document is unchanged. The call does not return a partly updated document. That matches a rejected manifest, which yields no document.

Do not add a second error type, a second code list, or a diagnostic channel for interaction failures.

## Capabilities not granted

This module has no reason to grant filesystem, network, native process, clipboard, a new origin, remote script, remote font, or telemetry. No camera, microphone, notification, protocol handler, or companion process. A missing WebGPU does not start a native GPU stack.

## Diagnostics

Do not log pointer paths, key sequences, or scene contents. Do not log object ids, transform values, or project bytes. A failed transform is not a new event name and not an environment dump. Do not log the raw `UVCP_FORCE_INIT_FAILURE` value.

## Dependencies

No new runtime dependency is assumed. Hit testing and the finite-number check use the existing stack.

If a later task proposes one, every disjunct of an `OR` must be on ADR-0007's permissive list: MIT, MIT-0, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, Zlib, Unlicense, CC0-1.0, BlueOak-1.0.0. `MIT OR Apache-2.0` passes. `MIT OR GPL-3.0-only` does not. Unknown, missing, or `NOASSERTION` is not added. Copyleft or source-available licenses still need Product Owner approval of that named dependency before it is added. Choosing the permissive side is not that approval.

## Operator and project bytes

The local operator is the person pointing at the viewport. Hit testing chooses an object in that scene. It is not a privilege boundary against that person, and it does not grant filesystem, network, or process rights.

Untrusted project bytes stay in the persistence review. This note does not review a parser, a zip reader, or a scene loader. Module 0 still rejects only the provisional manifest.

## Not security controls

Commit, cancel, and undo are product behavior. They keep or restore a transform for the operator. They are not access control and not a reason to log the gesture.

## Finding

Preparation keeps manipulation inside the existing shell, rejects a non-finite transform or an unknown object id with the existing domain error, leaves the document unchanged, adds no capability, loads no remote content, and logs none of the gesture or the scene.

No blocking finding for preparation.

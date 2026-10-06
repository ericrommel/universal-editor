# Module 3 — non-functional constraints

**Role:** Non-Functional Quality Engineer

**Status:** Preparation record for issue #9. Not an executed test report, not a performance claim, and not implementation authorization.

**Date:** 2026-10-06

**Tree:** `m3/preparation` at `5e99484`. This note does not change the verify gate, the baseline file, or any package.

Archive section 9.4 in `docs/archive/product-engineering-specification-v1.0.md` is context only. Its identifiers are not operational requirements. Where this note disagrees with `docs/engineering/architecture.md` or ADR-0006, those documents win.

## 1. Status

Module 0 is GREEN. The Product Owner approved it on issue #1 ([issuecomment-6004334244](https://github.com/ericrommel/universal-editor/issues/1#issuecomment-6004334244)). `main` is `5e99484`.

Module 3 has no approved non-functional requirement and no reference workload. Definition of Ready (development process section 8) is not met. This note does not ask the Product Owner to set a budget, choose a workload, or authorize implementation.

This pass did not run `pnpm verify`. The gate in section 2 is the command the architecture already requires. It is not a new measurement.

## 2. What is measurable on the current tree

The only check this tree can execute for later visual creation is the existing regression gate.

`pnpm verify` is that command. Architecture section 16 runs it on `ubuntu-24.04` and `windows-2025`. Both jobs are required. A failed verify fails the job. The verify step does not use `continue-on-error`. Development process section 15 keeps previously approved behavior in the contract. The only approved module is Module 0. There is no approved Module 1 or Module 2 suite to keep green.

Architecture section 12 is the headless suite inside that command: Node's test runner and `node:assert`. It is not a benchmark harness. This preparation adds no harness and no Module 3 test.

`docs/modules/module-00-foundation/evidence/m0-pipeline-baseline.json` has `"kind": "observation"`. Its statement says the durations are not pass/fail thresholds. They are not frame time, load time, or memory. Architecture section 16 says the same. The 30-minute job timeout and the 60-second headless spawn timeout are hang guardrails. They are not visual-creation budgets, and this note does not retune them.

Nothing else on this tree is a visual-creation measurement. There is no scene document, no save command, and no undo API (architecture sections 8 and 9; ADR-0006). Durability of text cannot be measured. Invalid-image behavior cannot be measured.

## 3. Future oracles

These properties are safe to name now. They have no numeric bound. They are not tests that can run on this tree.

**Failed ingest is atomic.** The archive sentence that an invalid image fails visibly and does not corrupt the project cannot be tested until a project container and a scene mutation exist. When they exist, the oracle is: a failed ingest leaves the previous project bytes and the previous in-memory scene unchanged, and does not leave a partial object. A visible error is a functional outcome, not a timing budget. ADR-0006 rejects a bad manifest whole. That rule is about two JSON fields. It is not this oracle, and it is not a decision to reject a later user file in full.

**Round-trip preserves stored text and appearance.** Once a save exists, reload must preserve the text and the appearance the approved document actually stores. Fields the document does not store are outside the oracle. The comparison is equality of those stored values, not of pixels and not of a duration. This is not a crash-consistency, fsync, or file-size claim. What a failed write does stays deferred (ADR-0006). No save command and no scene document are on `main`.

**Regression command stays `pnpm verify`.** The same command, on the same two pinned runners, remains the regression check. A later module does not replace it with a benchmark job. Architecture section 23 keeps one `verify` command so CI cannot swallow a failure.

## 4. Explicitly undefined

No number is set for any row below. Each is blocked on a later product or architecture decision. This note does not ask for that decision.

| Undefined | Why it stays unset |
| --- | --- |
| Reference workload | None exists. Archive section 9.3 mentions one for transform responsiveness and does not define it. Archive section 9.4 asks for a report against a defined workload and does not define one. ADR-0003 sets no frame-time budget because there is no reference viewport workload. This preparation does not create one. |
| Frame time | No workload, no viewport, and no scene being drawn. Architecture section 15: when a module draws, scene correctness is a CPU test of the snapshot, not a GPU image. |
| Memory ceiling | No workload and no measurement method. Development process section 6.9 requires an environment, a workload, a method, and a threshold together before a performance claim. |
| Image byte cap | No container and no image decoder are selected. |
| Text length cap | No text object and no approved document field exist. |
| Object-count cap | No approved scene and no workload exist. |

`MANIFEST_BYTE_LIMIT` in `packages/persistence/src/manifest.ts` is 4096. The source comment and architecture section 8 limit that cap to the provisional two-field manifest. It is not a project-size limit, a text-length cap, or an image-byte cap. The 1–255 byte entry-name rule is an entry-name check only. A display name is not an entry name.

A 262144-byte cap appears only in the unapproved Module 1 proposal (proposed ADR-0009, not on this tree and not accepted). That proposal says the figure is not a product project-size limit. This note does not adopt it as a threshold. A JSON document cap in that range cannot be an image-byte budget. ADR-0006: a single JSON file fits a document with no assets; images then become base64 or force a format change. No container is selected.

## 5. Classification

**Now.** Regression of approved Module 0 behavior through `pnpm verify` on `ubuntu-24.04` and `windows-2025`. Pipeline observations stay observations. No other non-functional check is runnable.

**Blocked on Module 1.** Participation in one hierarchy and one transform model. ADR-0006 calls a single plain-data hierarchy revisitable direction, not a schema, and ships no scene. Issue #7 has not approved a scene. The round-trip oracle cannot name text or appearance fields until an approved document stores them. The in-memory half of failed ingest also waits on a scene mutation. The 262144-byte figure stays in that unapproved proposal.

**Blocked on Module 2.** Participation in selection. Module 0 has no selection (architecture section 7). No approved selection system is on this tree. Archive section 9.3's responsiveness sentence depends on a reference scene workload that was never defined. This note does not inherit that sentence as a frame-time budget. Undo of creation, deletion, duplication, and appearance cannot attach to a Module 2 undo model that does not exist.

**Blocked on container and undo decisions.** Scene persistence and text durability. ADR-0006 selects no container. Persistence does not call the filesystem, and there is no save command. Failed ingest cannot promise unchanged project bytes until a container exists. Undo was compared as inverse patches, full-document snapshots, and an event log. None is selected. The manifest is not a history log. No undo API exists.

Selection, scene persistence, and undo are not approved systems. Hierarchy and transform are not a shipped model. A requirement that new object types participate in all five is not testable in this preparation.

## 6. Non-goals

- Authorizing implementation, declaring Definition of Ready, or requesting a Product Owner decision.
- Promoting archive section 9.4 identifiers to operational requirements.
- Setting a latency, frame-time, FPS, memory, file-size, text-length, image-byte, or object-count budget.
- Creating a reference scene, a fixture, or a benchmark harness.
- Treating discoverability as a performance NFR. Whether primary creation actions are discoverable without advanced panels belongs to the design review and the functional review (`reviews/product-design.md`, `reviews/functional-quality.md`). It is not a time-to-discover budget.
- Adding visual regression, a screenshot diff, or a GPU golden (architecture section 15).
- Changing `pnpm verify`, the runner labels, the manifest cap, or the observation baseline.
- Using manifest rejection, or the unapproved 262144-byte document cap, as the image-ingest oracle.

# Module 0 — Project Manager gate

## Role and gate status

| | |
| --- | --- |
| Role | AI Project Manager |
| Document | Definition of Ready check of the Module 0 architecture proposal |
| Date | 2026-10-02 |
| Status | Architecture preparation complete, awaiting Product Owner authorization, **not** READY FOR DEVELOPMENT |

This review does not approve the module, does not authorize implementation, and does not change the specification, the test plan, the architecture, the ADRs, or any code. The Human Product Owner has not approved Module 0. No such approval is recorded here.

The proposal states the same limit. `docs/engineering/architecture.md` is marked **Proposed. Not approved.** Its Definition of Ready table marks Product Owner authorization **Not met**. That is not a false claim of readiness. ADR-0001 through ADR-0008 are Proposed.

The Module 0 specification stays PLANNED until the Product Owner explicitly authorizes READY FOR DEVELOPMENT. The project board records this preparation gate as Ready for PO. That status is not implementation authorization, not GREEN, and not authorization for Module 1.

## Documents read

- `docs/engineering/development-process.md`, section 3 and section 6.2, section 8 for the Definition of Ready, section 19 for the review package, and section 21 for the requirement-change rule. Operational Work Tracking was inserted as section 3, so older role and gate numbers are one higher.
- `docs/modules/module-00-foundation/specification.md`, sections 8 and 10, and the objective, scope, requirements, and acceptance criteria those gates depend on
- `docs/engineering/architecture.md`
- `docs/modules/module-00-foundation/test-plan.md`, including the 2026-10-02 clarifications
- ADR titles under `docs/engineering/adr/`:
  - ADR-0001 — TypeScript for the shared core
  - ADR-0002 — React for editor chrome
  - ADR-0003 — Render snapshot and WebGPU direction
  - ADR-0004 — Module 0 web shell and desktop direction
  - ADR-0005 — Workspace, build, and verification
  - ADR-0006 — Domain, persistence, and undo direction
  - ADR-0007 — Module 0 trust boundaries
  - ADR-0008 — Editor state and shell content
- `docs/product-overview.md`, for product targets and the rule that desktop is first-class
- Specialist preparation reviews, to see whether a blocking finding was left open or a confirmation would rewrite Module 0 requirements

The editor, design, and functional proposal reviews in this folder concur with the adopted proposal on their own questions. They are not Product Owner approval, and this gate does not treat them as authorization to implement.

## Definition of Ready

Source: development-process section 8. Labels are **Met**, **Not met**, or **Met pending PO confirmation**.

| Ready condition | State | Basis |
| --- | --- | --- |
| Objective, scope, and out-of-scope behavior are explicit | Met | Operational specification sections 1, 3, and 4. The proposal says that text is unchanged. Module 0 establishes the foundation and does not implement the visual editor. |
| Dependencies are identified | Met | No earlier product module. The proposal names the workspace, Node.js 24 LTS, pnpm 12.x with the CVE-2026-50021 fix, the public npm registry, and GitHub Actions on `ericrommel/universal-editor`. Exact React, TypeScript, Vite, and Biome patches are deliberately not invented; they are pinned on implementation day. |
| Required earlier modules are approved | Met | None. Module 0 is the first implementation module. |
| FR, NFR, and AC identifiers are stable | Met | M0-FR-001 through M0-FR-009, M0-NFR-001 through M0-NFR-010, and M0-AC-001 through M0-AC-012. The 2026-10-02 test-plan clarifications say they do not change requirements or acceptance criteria. Archive §9.1 identifiers are not substitutes. |
| Acceptance criteria are observable and testable | Met pending PO confirmation | Each AC has an observable pass condition in the specification and a path in the test plan. M0-AC-001 and M0-AC-002 are executable only after the Product Owner names the primary development environment (confirmation 2) and accepts the loopback shell as the launch (confirmation 3). The criteria text is not rewritten by that naming. |
| An appropriate test approach exists for every FR, NFR, and AC, or deferral is documented | Met | The updated test plan names a path for every operational identifier. See the traceability note below. Manual and review paths are explicit. Preview HTTP 200 is build evidence, not M0-AC-002. |
| Required design behavior is sufficiently defined | Met pending PO confirmation | The design review is the Module 0 design intent, adopted as written, with two amendments: no viewport or editor frame, and no on-screen failure switch. Confirmation 4 can still replace the identity strings. For this shell, the Web row applies: document title `Foundation — Universal Visual Creation Platform`, no application menu. The native title `Foundation` is a purpose label for a later window. It does not replace the browser title. |
| Required test infrastructure and reference workloads are defined where applicable | Met | Test-plan §9 and ADR-0005 name `pnpm verify`, headless `node --test`, `tsc -b`, Biome, the boundary check, CI failure propagation, the initialization fake, and retained logs. Reference hardware and product performance workloads are not applicable to Module 0. The test plan and the proposal both say pipeline timings are observations, not pass/fail thresholds. That does not weaken M0-NFR-010. |
| Blocking security risks or trust-boundary questions are resolved where applicable | Met | For preparation only. ADR-0007 and architecture §22 select the conditioned loopback web shell and record the conditions for SEC-M0-B-001 through SEC-M0-B-007: no Electron or Tauri, no filesystem or process entitlement, secret-free CI, no `pull_request_target`, locked install, reviewed build scripts, closed diagnostic fields, and no native GPU fallback. M0-AC-011 stays open until an implementation review shows the built shell matches that record. This gate is not that review. |
| Blocking architectural decisions for Module 0 are resolved | Met pending PO confirmation | The Tech Lead proposal and ADR-0001 through ADR-0008 decide the Module 0 stack, boundaries, shell, and verification path. They are not approved. Confirmation 1 is the authorization of that proposal. The proposal's own row, "Proposed here," matches this state and does not say the decisions are already approved. |
| Blocking product ambiguities are resolved | Not met | The five confirmations in architecture, "Decisions that need the Product Owner," are still open. They are listed again below. |
| The Product Owner authorizes implementation | Not met | No authorization exists. This review must not be read as one. |

### Traceability note

The draft-plan gaps named in the functional quality review (no path for M0-FR-008, M0-NFR-006, and M0-NFR-007, and incomplete paths for several other IDs) are closed in the current test plan, not by changing expected results:

| Identifier | Path |
| --- | --- |
| M0-FR-001, M0-FR-004, M0-FR-007, M0-NFR-001, M0-AC-001, M0-AC-002, M0-AC-003, M0-AC-008 | TP-M0-F-001 |
| M0-FR-002, M0-NFR-003, M0-AC-005, M0-AC-006 | TP-M0-F-002, TP-M0-I-001; M0-AC-006 also TP-M0-I-002 |
| M0-FR-003, M0-NFR-002 | TP-M0-I-002, including the six areas and an automated failure on a prohibited core import |
| M0-FR-005, M0-NFR-004, M0-AC-004, M0-AC-007 | TP-M0-F-003; M0-NFR-004 also TP-M0-NF-004 |
| M0-FR-006 | TP-M0-F-004 |
| M0-FR-008 | Test-plan §9, by review of the implemented commands and CI stages |
| M0-FR-009, M0-NFR-008, M0-AC-012 | Test-plan §6, against the adopted design intent, after the shell exists |
| M0-NFR-005 | TP-M0-I-003 together with M0-AC-008. Commands are checked by following the developer documentation. |
| M0-NFR-006 | TP-M0-I-004 |
| M0-NFR-007 | TP-M0-I-005 |
| M0-NFR-009, M0-AC-011 | Test-plan §7, against ADR-0007, after implementation |
| M0-NFR-010 | TP-M0-NF-001. TP-M0-NF-002 and TP-M0-NF-003 are observation records, not extra acceptance criteria |
| M0-AC-009 | TP-M0-I-003, after implementation |
| M0-AC-010 | Test-plan §10. Preparation reviews do not satisfy it |

M0-AC-010, M0-AC-011, and M0-AC-012 are intentionally unexecuted. Specification section 10 is the exit gate, not this Definition of Ready check. The proposal does not claim those criteria have passed.

Specialists required by specification section 8 have written preparation reviews: Product Designer, Functional Quality, Non-Functional Quality, DevOps / Platform, and Application Security, plus Core / Platform, 2D / Editor, and 3D / Rendering. That satisfies the preparation involvement check. It does not satisfy later implementation reviews.

## Work packages

WP-0 through WP-6 can be implemented without pulling Module 1 into Module 0. No work package overreaches.

Module 1, as constrained by the proposal and the core review, is the first module that may add a scene and a user-facing save, and only after its own specification is approved. None of the work packages build a scene graph, objects, selection, tools, undo, a viewport, a GPU, a project writer, or a second shell.

| ID | In Module 0 scope | Stop line, so it does not become Module 1 |
| --- | --- | --- |
| WP-0 | Repository structure, pins, typecheck, lint, boundary and license checks, supply-chain baseline. M0-NFR-005 and M0-NFR-009. | Workspace and checks only. No scene package and no desktop host. |
| WP-1 | Platform-neutral core helpers and a closed manifest codec with headless tests. M0-FR-002, M0-NFR-003, M0-AC-005, M0-AC-006. The specification allows minimal code inside the persistence boundary. | No scene type, transform type, `document.json`, zip, directory writer, migration, file dialog, or user save. The format id stays provisional. |
| WP-2 | Editor startup session (`starting`, `ready`, `failed`), diagnostic records, headless composition script, injected failure. M0-FR-006. | No selection, tool, panel, undo stack, or viewport-attach API. |
| WP-3 | Rendering boundary: snapshot value and null renderer, headless, including a fractional device-pixel ratio. M0-FR-003. | Empty draw list only. No canvas, WebGPU or WebGL context, shader, engine, or scene items. |
| WP-4 | Platform marker with no capability, UI tokens, foundation screen, loopback Vite shell. M0-FR-001, M0-FR-009, M0-AC-002. | The design-intent column only. No editor frame, menu of authoring commands, or second toolkit. |
| WP-5 | `pnpm verify`, GitHub Actions, Dependabot, developer documentation. M0-FR-004, M0-FR-005, M0-FR-007, M0-FR-008, and the clean-setup and CI acceptance criteria. | No installer, signing, macOS runner, browser matrix, or performance gate. |
| WP-6 | Short-lived failing-test evidence, then removal, plus the pipeline baseline from real runs. M0-AC-004, M0-NFR-004, M0-NFR-010. | Evidence, not a feature. The red commit is not the approval commit and is not merged as a permanent failure. |

"The seven boundaries" in the proposal are seven workspace projects. The six M0-FR-003 areas are `core`, `persistence`, `editor`, `rendering`, `platform`, and `ui`. `apps/shell` is the composition root, not a seventh product boundary and not a second application.

Sequencing matches the Depends on column. WP-1 and WP-3 may proceed together after WP-0. WP-2 waits until the core and persistence exports it imports exist. WP-4 waits for editor startup. WP-6 is evidence, and its red commit is not merged.

## Product Owner confirmations

None of the confirmations in `architecture.md` is a hidden requirement change. The specification and the acceptance criteria stay as written. Development-process section 21 forbids rewriting them to match an implementation. Authorization, if given, should say that explicitly.

These five are required before READY FOR DEVELOPMENT. They resolve ambiguities the specification left open. They do not add or delete an FR, NFR, or AC.

1. **Authorize the proposal and ADR-0001 through ADR-0008, without changing Module 0 requirements or acceptance criteria.** This is the authorization gate. It is not a new requirement. Rejecting it leaves the specification PLANNED and returns the board item to In Preparation.
2. **Primary development environment.** Naming 64-bit Windows x64 as the documented setup and local-launch environment, with required CI on `windows-2025` and `ubuntu-24.04`, makes M0-AC-001 and M0-NFR-001 executable. The specification already requires one primary environment and already says Module 0 does not implement every target. The product targets remain Web, Windows, macOS, and Linux. This confirmation must not be copied back into the specification as a Windows-only product.
3. **Loopback web shell, and no Electron, Tauri, or native GPU stack in Module 0.** M0-FR-001 requires a minimal shell in the primary environment. It does not require a native window or final distribution. Product-overview section 9 still makes desktop first-class for the product. This confirmation does not remove that target. It keeps it out of Module 0, which M0-NFR-007 already allows. No viewport in Module 0 is part of this confirmation and of the adopted design intent. It is not a new acceptance criterion.
4. **Design intent.** Confirming the foundation-screen strings, no icon, and system appearance with a light fallback defines the intent M0-AC-012 already requires. A correction replaces design-intent strings. It does not amend M0-AC-012. The window title `Foundation` is not a product rename.
5. **One UI implementation for later desktop chrome.** This does not change a Module 0 requirement. Module 0 already has one UI package. The forward commitment is that a later desktop host reuses that package, with native file and process integration in the host, instead of a second widget toolkit. It does not authorize Module 1 or a desktop shell. If the Product Owner rejects it, this package structure stops and the architecture must be replanned before READY FOR DEVELOPMENT. Rejection is still not a specification edit.

The items the proposal lists as **not** required to start Module 0 are also not silent requirement changes, provided implementation does not treat them as approved product decisions:

- No product `LICENSE` grant and no copyleft dependency are engineering refusals until the Product Owner decides otherwise. They do not set the application's license.
- The manifest `formatId` and `schemaVersion` 1 are a provisional codec, not a public format promise. Authorizing Module 0 does not confirm the public format id, extension, one file versus a folder, or hand-editing.
- Undo across save, one scene versus several, and whether selection or panel layout is saved stay undecided. They block a later schema, not Module 0.
- Electron versus a native `wgpu` surface, the macOS distribution channel, and the first web-release browser matrix stay undecided.
- Reference hardware and the first performance workload stay undecided. Module 0 has no numeric product performance threshold.
- Telemetry remains absent. That is the existing rule that telemetry needs an explicit Product Owner decision. It is not a new product policy beyond Module 0.
- Repository admin settings are recommended and not done. They are not a new acceptance criterion.

## Open risks for the PO package

The package should include these. They are not proposals to change Module 0 requirements.

- The module is not READY FOR DEVELOPMENT. The five confirmations above are the authorization questions. A "yes" accepts the recommended answers. A "no" on item 1, 2, 3, or 5 stops this proposal. A "no" on item 4 replaces strings or the appearance fallback and does not by itself replan the architecture.
- Windows-primary evidence is not a cut of Web, macOS, or Linux. The Linux CI job is a headless coupling check, not a Linux desktop delivery.
- Add one question to the same authorization: the single browser used for the manual `pnpm dev` launch on that Windows machine. The product browser matrix stays deferred. The non-functional review asked for this name if the shell is a web page, so M0-AC-002 evidence is not "whichever browser opened." A recommended default is the current Microsoft Edge or Chrome already on that x64 Windows machine, with the actual browser recorded in the launch evidence. This does not change M0-AC-002.
- Authorizing the proposal does not choose hardened Electron, does not accept Tauri as the GPU viewport, and does not accept a Linux software WebGL path as Linux support. Those remain later Product Owner decisions. The recorded rank is a recommendation.
- The provisional bytes `{"formatId":"universal-visual-creation-project","schemaVersion":1}` will be locked by tests. That lock is not a compatibility promise. Renaming is free until a user-facing save exists and is a migration after that.
- A future host that cannot run this TypeScript package reopens ADR-0001 before Module 1. Module 0 does not build a second core.
- A later scene must not be a Three.js or Babylon scene graph. Module 0 does not take those dependencies.
- Up-axis, handedness, rotation order, and degrees versus radians are undecided on purpose. They must be decided before Module 1 transform tests, not before Module 0.
- One scene per project versus several is an unresolved product conflict between the overview and archive section 4.2. Module 0 does not encode either answer. It must be decided before the Module 1 document schema.
- `pnpm audit` inside `pnpm verify` contacts the public npm registry. Developer documentation must say that the audit step needs network, so an offline audit failure is not treated as an undocumented machine defect. This is the accepted scanner, not a second product requirement. High-severity audit waivers need an owner and an expiry if they are ever proposed. None are proposed now.
- Actions availability was not queried. Branch protection that requires the verify check is an admin action, recommended and not done. Absence of that setting does not waive M0-AC-007. It is a residual risk that a branch can change without the check.
- The pipeline baseline is an observation. It must not be turned into a pass/fail threshold or used to rewrite an acceptance criterion.
- Toolchain patch numbers are chosen on implementation day against the license allow-list and the high-severity audit. This gate did not re-verify the npm registry. If the stated pnpm 12.x pin is not actually available with the required integrity fix, implementation stops on that pin. It does not float to "latest."
- Copyleft or an unknown license stops for a Product Owner decision before the dependency is added. Module 0 authorization does not pre-approve that exception.
- ASCII case-fold on entry names is an accepted gap only because Module 0 reads no archive. It is a security review item before the first real archive reader.
- No user projects exist, so Module 0 has no migration to perform and must not invent one.

## Blocking gaps

None for this gate.

Preparation has an explicit scope, stable identifiers, a test path for every identifier, a design intent, test infrastructure appropriate to Module 0, recorded dispositions for the blocking security findings, and a proposed architecture with ADRs. What is not met is Product Owner confirmation and authorization. That keeps the module out of READY FOR DEVELOPMENT. It does not mean the architecture proposal is incomplete.

Specification section 9 evidence, specification section 10 exit criteria, M0-AC-010, M0-AC-011, and M0-AC-012 are implementation and acceptance evidence. They are not missing preparation artifacts, and they are not claimed as done.

## Operational record

This file is review evidence. It is not the project status.

The operational record is GitHub issue #1 on the Universal Visual Creation Platform board. Architecture preparation is at the Product Owner review gate. The board column is `Ready for PO`. `PO Approval` remains Pending. This review does not set Ready for Development, Done, or Approved.

The proposal is on branch `docs/m0-architecture-preparation` and is submitted through [pull request #2](https://github.com/ericrommel/universal-editor/pull/2). Session output is not a substitute for that issue, pull request, and board state.

CONCUR

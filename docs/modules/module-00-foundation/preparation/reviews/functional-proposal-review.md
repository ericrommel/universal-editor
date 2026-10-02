# Module 0 — Functional Proposal Review

**Role:** Functional Quality Engineer  
**Status:** Review of the 2026-10-02 test-plan clarifications against the architecture proposal. Document comparison only. No application was run, and no test, build, or CI result is claimed.  
**Disposition:** The test plan may be used as the functional verification approach for this proposal. This review is not TESTS GREEN, not M0-AC-010, not module approval, and not a Product Owner decision.

The specification was not modified. `git diff` against the initial commit shows changes only in `docs/modules/module-00-foundation/test-plan.md` and `docs/engineering/architecture.md`. Operational identifiers remain M0-FR-001 through M0-FR-009, M0-NFR-001 through M0-NFR-010, and M0-AC-001 through M0-AC-012 in `specification.md`.

## Documents read

- `docs/modules/module-00-foundation/specification.md`
- `docs/modules/module-00-foundation/test-plan.md` (current text, compared with the initial-commit text)
- `docs/modules/module-00-foundation/preparation/reviews/functional-quality.md` (PTU-1 through PTU-10)
- `docs/engineering/architecture.md`
- `docs/engineering/adr/0005-workspace-build-and-verification.md` and `docs/engineering/adr/0008-editor-state-and-shell-content.md`, for the verify command and the failure-injection decision the architecture cites

## Previously written expected results

The test-plan diff is additive. The status line and the TP-M0-F-001 Covers line were edited. Every previous Covers identifier on TP-M0-F-001 remains. No expected-result sentence was deleted or rewritten.

| Scenario | Expected result in the initial commit | In the current plan |
|---|---|---|
| TP-M0-F-001 | no undocumented manual workaround is required | Unchanged. The log note and the added Covers identifiers are additional. |
| TP-M0-F-002 | core tests complete normally | Unchanged. The display-server note is additional and excludes an xvfb pass. |
| TP-M0-F-003 | local verification fails; CI test verification fails; the failure is visible and actionable; the deliberate failure is removed | Unchanged. The procedure defines that result. It does not allow a permanent red test, a skip, `continue-on-error`, or a squash that never ran CI on the red commit. |
| TP-M0-F-004 | startup and failure are diagnosable without silent termination | Unchanged. |
| TP-M0-I-002 | no prohibited dependency from core/domain into UI or platform-specific layers | Unchanged. The category list and the automated check make that result enforceable. |
| TP-M0-I-003 | documentation describes the actual Module 0 architecture | Unchanged. |
| TP-M0-NF-002 | baseline, not initially a pass/fail performance target unless the architecture defines a justified threshold | Unchanged. Section 9 and the architecture both say the 30-minute job timeout and the 60-second diagnostic-spawn timeout are hang guardrails, not product performance targets. |
| TP-M0-NF-004 | review representative build/test/type/lint failures for actionable diagnostics | Unchanged. The added procedure still requires a non-zero local log that names the file or the rule. |

Two adopted clarifications differ from the proposed wording and do not replace the sentences above.

- PTU-4 allowed "a non-zero exit or another observable, non-silent termination" and rejected a failure flag left enabled in the shipped shell. The plan now requires a non-zero exit from the headless composition script, which is stricter, and rejects a failure flag left enabled in the shipped production shell. `UVCP_FORCE_INIT_FAILURE=1` is allowed only for `pnpm dev`, and the production bundle must ignore it. Silent termination still fails the original sentence. A production backdoor still fails the clarification.
- PTU-5 said the six M0-FR-003 areas exist as modules, packages, or crates. The plan says separate packages. That matches the architecture. A placeholder package still passes. Missing product behavior in rendering or persistence still does not fail TP-M0-I-002.

No previously written expected result was weakened or replaced.

## Verification paths

Every operational identifier has a path in the current test plan. Post-implementation reviews are paths. They are not claimed to be done.

| ID | Path |
|---|---|
| M0-FR-001 | TP-M0-F-001 launch on the primary environment. The architecture's HTTP preview smoke is not this launch. |
| M0-FR-002 | TP-M0-F-002 and TP-M0-I-001. `pnpm test` is headless `node --test`. |
| M0-FR-003 | TP-M0-I-002. Six areas as packages; a placeholder is enough; the boundary check fails a wrong-way core import. |
| M0-FR-004 | TP-M0-F-001, including the success log of tests and applicable type checking and lint, and TP-M0-F-003. The architecture states that `tsc -b` and Biome apply. |
| M0-FR-005 | TP-M0-F-003. A required failure fails the CI job that runs `pnpm verify`. |
| M0-FR-006 | TP-M0-F-004. Captured normal and failure diagnostics, non-zero exit of the headless composition script, and the dev-only shell failure display. |
| M0-FR-007 | TP-M0-F-001, followed as written. |
| M0-FR-008 | Test-plan §9 review: implemented commands and CI stages match the named infrastructure and the documented workflow. |
| M0-FR-009 | Test-plan §6 against the design intent adopted by the architecture. |
| M0-NFR-001 | TP-M0-F-001 and TP-M0-NF-001. |
| M0-NFR-002 | TP-M0-I-002. The prohibited list is the operational category list, and the automated check is on the required workflow. |
| M0-NFR-003 | TP-M0-F-002 and TP-M0-I-001. An xvfb pass is not evidence. |
| M0-NFR-004 | TP-M0-F-003 and TP-M0-NF-004. Local breaks remain required for build, type checking, and lint. |
| M0-NFR-005 | TP-M0-I-003 together with M0-AC-008. Commands are checked by following the developer documentation. |
| M0-NFR-006 | TP-M0-I-004. |
| M0-NFR-007 | TP-M0-I-005. The denylist supports the review and does not replace it. |
| M0-NFR-008 | Test-plan §6, including Progressive Complexity, contextual interaction, and non-identical cross-platform adaptation. |
| M0-NFR-009 | Test-plan §7. Functional tests do not substitute. The preparation threat model and ADR-0007 are the records the later implementation review uses. |
| M0-NFR-010 | TP-M0-NF-001. TP-M0-NF-002 and TP-M0-NF-003 are observation records, not thresholds. |
| M0-AC-001 | TP-M0-F-001 and TP-M0-NF-001. |
| M0-AC-002 | TP-M0-F-001. Architecture: documented `pnpm dev` on the primary environment. |
| M0-AC-003 | TP-M0-F-001 step 5. Now cited on that scenario. |
| M0-AC-004 | TP-M0-F-003 procedure. The approval commit is the green commit. |
| M0-AC-005 | TP-M0-F-002. |
| M0-AC-006 | TP-M0-F-002, TP-M0-I-001, and TP-M0-I-002. Architecture requires an editor test that imports core and persistence without importing UI or starting a shell. |
| M0-AC-007 | TP-M0-F-003 plus the green required-workflow run in that procedure. |
| M0-AC-008 | TP-M0-F-001. |
| M0-AC-009 | TP-M0-I-003, after implementation. |
| M0-AC-010 | Test-plan §10. Writing this review does not satisfy it. |
| M0-AC-011 | Test-plan §7, after implementation. The architecture leaves this open until the built shell matches ADR-0007. |
| M0-AC-012 | Test-plan §6, after the shell implements the adopted design intent. |

Identifiers that still have no verification path: none.

## Test plan and architecture

These are the architecture choices the plan has to agree with. They agree.

- **`node:test`.** The plan names `node --test` as the headless core command, with `tsc -b`, Biome, and `pnpm verify`. The architecture uses that runner and `node:assert`, and it excludes Vitest, Jest, jsdom, and happy-dom. `pnpm test` must not start Vite or open a window. That is the same command TP-M0-F-002 and TP-M0-I-001 require.
- **No Playwright.** The plan's UI evidence is the manual launch in TP-M0-F-001 and the human design review in §6. It does not require a browser-driver suite, a multi-browser matrix, or a visual-regression harness. The architecture rejects Playwright and Cypress for Module 0 and points the screen check at that design review. The Node HTTP preview smoke is build evidence, not M0-AC-002 and not Playwright.
- **Dev-only failure variable.** TP-M0-F-004 allows `UVCP_FORCE_INIT_FAILURE=1` only for `pnpm dev` and requires the production bundle to ignore it. The failure used as automated evidence is still a test double or local fixture at the composition root. The architecture and ADR-0008 say the same: injected initializer in tests and in the headless script; the variable is read only by `pnpm dev`; the production bundle does not contain it.
- **Headless composition script.** TP-M0-F-004 requires captured diagnostics and a non-zero exit from that script, and it says a window is not required for the script. The architecture says the script writes the diagnostic lines to stderr and exits non-zero on failure, and that a window by itself is not startup evidence. The additional shell check (Not ready on the dev-only path) is the same manual dev-server check the architecture describes. It does not move the core suite onto a display server.

Also compared, and not in conflict:

- xvfb, or any other supplied window system, does not prove M0-NFR-003 or M0-AC-005. CI does not use xvfb to claim a launch.
- Type checking and lint run inside `pnpm verify`, which returns the first non-zero exit and does not use `continue-on-error`. The plan's single red CI run is the wiring evidence for that job. Local build, type, and lint breaks are still required for TP-M0-NF-004.
- The six M0-FR-003 areas are the six packages in architecture section 10. `apps/shell` is the composition root, not a seventh boundary that the plan forgot.
- `m0-pipeline-baseline.json` is the observation record for TP-M0-NF-002 and TP-M0-NF-003 (`kind: observation`). It is not a performance threshold and it is not the benchmark-result storage the plan excludes.
- The primary environment remains the plan's "primary supported development environment." The architecture proposes 64-bit Windows x64, pending Product Owner confirmation. The plan does not name a different OS.

Places the test plan and the architecture disagree: none.

## Archive identifiers

Traceability stays on `specification.md`. The plan says archive §9.1 numbers are not interchangeable with those IDs, in the introduction and in §12. The architecture says the same.

The swapped archive meanings were not written back onto the operational IDs:

- Operational M0-FR-003 is the six boundaries (TP-M0-I-002), not the archive's single test command.
- Operational M0-FR-004 is the verification workflow (TP-M0-F-001 and TP-M0-F-003). CI failure propagation is operational M0-FR-005.
- Operational M0-FR-006 is diagnostics (TP-M0-F-004), not operational M0-FR-005.
- Operational M0-AC-002 remains application startup (TP-M0-F-001). The archive sentence that demanded a core unit test and an integration-level test was not reimposed on that ID. The headless editor import test is M0-AC-006 evidence.

CONCUR

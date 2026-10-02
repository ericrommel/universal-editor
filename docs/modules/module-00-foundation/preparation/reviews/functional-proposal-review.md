# Module 0 — Functional Proposal Review

**Role:** Functional Quality Engineer
**Status:** Comparison of the current test plan with the architecture proposal, 2026-10-02. No application, test, build, or CI result is claimed.
**Disposition:** Concur. The test plan is the functional verification approach for this proposal. This review is not TESTS GREEN, not M0-AC-010, not module approval, and not a Product Owner decision.

Compared: `specification.md` (operational identifiers only), `test-plan.md` against its initial text, `docs/engineering/architecture.md`, ADR-0005, and ADR-0008. The procedure stays in the test plan.

## Agreement

The test plan and the architecture agree. Nothing below is a disagreement.

- **`node:test`.** `pnpm test` is headless `node --test` with `node:assert`. Vitest, Jest, jsdom, and happy-dom are out of Module 0. `pnpm test` does not start Vite or open a window. `tsc -b` and Biome run inside `pnpm verify`. A green `node --test` is not the type check.
- **No Playwright.** UI evidence is TP-M0-F-001 and test-plan §6. Playwright and Cypress are deferred. The Node HTTP preview smoke is build evidence. It is not M0-AC-002. Neither CI job is a graphical launch. The Linux job is a coupling check, not a Linux desktop.
- **Failure injection.** Automated evidence is an injected initializer at the composition root. The headless script exits non-zero on failure and does not need a window. `UVCP_FORCE_INIT_FAILURE=1` is only for `pnpm dev`. Any other non-zero value fails as invalid, not as success. The production bundle ignores the variable and does not contain it. ADR-0008 matches this.
- **TP-M0-F-003.** Short-lived red branch or draft pull request. The approval commit is the green commit after the probe is removed. The red commit is not the approval commit. One red run of `pnpm verify` is the CI wiring evidence for the tests, type checking, and lint in that job. Local build, type, and lint breaks remain required for TP-M0-NF-004.
- **Headless claim.** xvfb, or any supplied window system, does not prove M0-NFR-003 or M0-AC-005. CI does not use xvfb to claim a launch.
- **Boundaries.** The six M0-FR-003 areas are the six packages in architecture section 10. `apps/shell` is the composition root, not a seventh area. The boundary script is on `pnpm verify`. A placeholder package passes TP-M0-I-002. Missing rendering or persistence behavior does not fail that scenario.
- **Baselines.** `m0-pipeline-baseline.json` with `kind: observation` is the record for TP-M0-NF-002 and TP-M0-NF-003. The 30-minute job timeout and the 60-second diagnostic-spawn timeout are hang guardrails, not performance targets.
- **Environment.** The plan's primary environment is the architecture's proposed 64-bit Windows x64, pending Product Owner confirmation. The plan does not name a different OS.

dependency-cruiser is not required. ADR-0005 adopts `scripts/check-boundaries.mjs` while imports are direct specifiers. If aliases or re-exports appear, that script has to see them or it stops being the control.

## Expected results

Checked against the initial test plan (commit `7eab8c0`). No previously written expected-result sentence was deleted, rewritten, or weakened.

| Scenario | Sentence that remains | What was added |
| --- | --- | --- |
| TP-M0-F-001 | no undocumented manual workaround is required | Verification-log note and Covers identifiers. |
| TP-M0-F-002 | core tests complete normally | Display-server note. An xvfb pass is not evidence. |
| TP-M0-F-003 | local verification fails; CI test verification fails; the failure is visible and actionable. Remove the deliberate failure after evidence is collected | Procedure. A permanent red test, a skip, `continue-on-error`, or a squash that never ran CI on the red commit does not meet M0-AC-004. |
| TP-M0-F-004 | startup and failure are diagnosable without silent termination | Non-zero exit of the headless script. That is stricter than another observable termination. The production bundle must ignore the dev-only variable. |
| TP-M0-I-002 | no prohibited dependency from core/domain into UI or platform-specific layers | Category list and the automated check. Six areas are packages. A placeholder still passes. |
| TP-M0-I-003 | documentation describes the actual Module 0 architecture | Unchanged. |
| TP-M0-NF-002 | This is a baseline, not initially a pass/fail performance target unless the architecture proposal defines a justified threshold | Unchanged. The hang guardrails are not that threshold. |
| TP-M0-NF-004 | review representative build/test/type/lint failures for actionable diagnostics | The local non-zero log must name the file or the rule. |

## Coverage

Draft gaps, recorded in `functional-quality.md`: no path for M0-FR-008, M0-NFR-006, and M0-NFR-007; incomplete paths for M0-FR-003, M0-FR-009, M0-NFR-002, M0-NFR-005, M0-NFR-008, M0-NFR-009, and M0-NFR-010. M0-AC-003, M0-AC-009, M0-AC-010, M0-AC-011, and M0-AC-012 had a scenario but were not cited on a Covers line.

The current test plan has a path for every M0-FR, M0-NFR, and M0-AC: M0-FR-001 through M0-FR-009, M0-NFR-001 through M0-NFR-010, and M0-AC-001 through M0-AC-012. The path index is in `functional-quality.md`. No operational identifier is unmapped.

Reviews after implementation are still paths. They are not done. This review does not satisfy M0-AC-010. M0-AC-011 stays open until the built shell matches ADR-0007. M0-AC-012 waits until the shell implements the adopted design intent.

Archive §9.1 numbers are not interchangeable with the operational IDs. The plan says so, and the architecture says so. Swapped archive meanings were not written back onto those IDs. Operational M0-AC-002 remains application startup.

## Deferred

Playwright, Cypress, visual regression, benchmark storage, a multi-browser matrix, multi-OS GUI CI, golden persistence files, GPU conformance, and a second-language test runner are deferred. They are not Module 0 gates, and they are not binding decisions for a later module.

CONCUR

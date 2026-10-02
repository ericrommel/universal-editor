# Module 0 — Functional Quality

**Role:** Functional Quality Engineer
**Status:** Architecture-preparation record, 2026-10-02
**Disposition:** Module 0 verification strategy. Not TESTS GREEN, not module approval, and not a Product Owner decision. No application, test, build, or CI run is claimed. Developers implement the tests. The procedure is `docs/modules/module-00-foundation/test-plan.md`.

## Decisions Module 0 depends on

Binding for this module. Later-module tools are deferred. They are not adopted in advance.

### Runner

Core and in-process integration tests use `node --test` and `node:assert`. `pnpm test` must not start Vite or open a window. A green test run is not type checking. `tsc -b` and Biome run inside `pnpm verify`.

Not used in Module 0: Vitest, Jest, jsdom, and happy-dom. Vitest can treat a DOM environment as a headless core run. Reconsidering it for a later module that has DOM component tests is deferred. Pytest, `cargo test`, and any other second-language runner are deferred. Module 0 does not add them, and it does not decide a future core language.

### Launch and UI evidence

M0-AC-002 is the documented manual launch: `pnpm dev` on the primary environment, the foundation screen reaches Ready, and the dev-only failure path shows Not ready. Design evidence is test-plan §6.

Playwright and Cypress are deferred. A browser-driver session is not application startup, and it would not launch a later desktop shell. The Node HTTP preview smoke shows that the shell builds and serves. It is not M0-AC-002.

No visual-regression harness, screenshot baseline, multi-browser matrix, or coverage-percentage gate.

### Failure injection

Automated evidence for TP-M0-F-004 is a test double or local fixture at the composition root. Tests and the headless composition script pass a throwing initializer. The script writes diagnostics to stderr and exits non-zero on failure. A window is not required for that script.

`UVCP_FORCE_INIT_FAILURE=1` is honored only by `pnpm dev`. Unset or `0` starts normally. Any other non-zero value fails startup as an invalid value, not as success. The production bundle ignores the variable and must not contain it.

A failure flag left enabled in the shipped production shell fails the scenario. Silent termination still fails the expected result.

### Failure propagation

TP-M0-F-003 is a short-lived branch or draft pull request. The commit proposed for approval is the later green commit. The red probe is not the approval commit.

A permanent red test, a skipped test, `continue-on-error`, or a squash merge that never ran CI on the red commit does not meet M0-AC-004. The steps stay in the test plan.

Type checking and lint sit in the same `pnpm verify` job as the tests, so one red CI run shows that those steps are on the required path. Local breaks for build, type checking, and lint remain required. A log that names neither the file nor the rule is not actionable.

### Boundaries and the headless claim

The six M0-FR-003 areas are separate packages. A placeholder passes TP-M0-I-002. Missing product behavior in rendering or persistence does not fail that scenario. `apps/shell` is the composition root, not a seventh boundary.

The prohibited set is every M0-NFR-002 category. `scripts/check-boundaries.mjs` fails `pnpm verify` on a violating import. Review does not replace that check. The denylist supports TP-M0-I-005 and does not replace that review.

An xvfb pass, or a pass that needs any other supplied window system, is not evidence for M0-NFR-003 or M0-AC-005. CI does not use xvfb to claim a launch. Neither CI job is graphical-launch evidence. The Linux job is a coupling check, not a Linux desktop.

`pnpm verify` is the only verification entry point for the developer documentation and for CI. It returns the first non-zero child exit. That step has no `continue-on-error`. The commands are Node scripts, so the workflow does not depend on PowerShell `&&`.

dependency-cruiser was the recommendation if path aliases or barrel re-exports exist. ADR-0005 uses the boundary script while imports are direct specifiers. If aliases or re-exports appear, the script has to see them or it stops being the control. Under the adopted architecture that is not an open coverage gap.

The editor review's frame-loop render-count test is not a Module 0 test. A later viewport handoff is deferred.

## Expected results that stay in force

The 2026-10-02 clarifications add evidence notes and Covers lines. Against the initial test plan (commit `7eab8c0`), no expected-result sentence was deleted or rewritten.

| Scenario | Sentence that remains |
| --- | --- |
| TP-M0-F-001 | no undocumented manual workaround is required |
| TP-M0-F-002 | core tests complete normally |
| TP-M0-F-003 | local verification fails; CI test verification fails; the failure is visible and actionable. Remove the deliberate failure after evidence is collected |
| TP-M0-F-004 | startup and failure are diagnosable without silent termination |
| TP-M0-I-002 | no prohibited dependency from core/domain into UI or platform-specific layers |
| TP-M0-I-003 | documentation describes the actual Module 0 architecture |
| TP-M0-NF-002 | This is a baseline, not initially a pass/fail performance target unless the architecture proposal defines a justified threshold |
| TP-M0-NF-004 | review representative build/test/type/lint failures for actionable diagnostics |

Two additions are stricter than the wording first proposed. They do not relax the sentences above. The headless failure path requires a non-zero exit from the composition script, not merely some other observable termination. TP-M0-I-002 names separate packages, matching the architecture. A placeholder still passes.

The 30-minute CI job timeout and the 60-second diagnostic-spawn timeout are hang guardrails, not product performance targets. `m0-pipeline-baseline.json` (`kind: observation`) records TP-M0-NF-002 and TP-M0-NF-003. It is not a threshold and not benchmark-result storage.

## Coverage

### Gaps found in the draft plan

Before the clarifications now in the test plan:

- No path: M0-FR-008, M0-NFR-006, M0-NFR-007.
- Incomplete: M0-FR-003, M0-FR-009, M0-NFR-002, M0-NFR-005, M0-NFR-008, M0-NFR-009, M0-NFR-010.
- A scenario existed, but the identifier was not on a Covers line: M0-AC-003, M0-AC-009, M0-AC-010, M0-AC-011, M0-AC-012.

Those gaps blocked Definition of Ready until the test plan named a path. They were not proposals to change an acceptance criterion.

### Current plan

The test plan now has a path for every operational identifier: M0-FR-001 through M0-FR-009, M0-NFR-001 through M0-NFR-010, and M0-AC-001 through M0-AC-012. No identifier lacks a path. None of these paths has been executed.

| ID | Path |
| --- | --- |
| M0-FR-001 | TP-M0-F-001. The HTTP preview smoke is not this launch. |
| M0-FR-002 | TP-M0-F-002, TP-M0-I-001 |
| M0-FR-003 | TP-M0-I-002 |
| M0-FR-004 | TP-M0-F-001, TP-M0-F-003 |
| M0-FR-005 | TP-M0-F-003 |
| M0-FR-006 | TP-M0-F-004 |
| M0-FR-007 | TP-M0-F-001 |
| M0-FR-008 | Test-plan §9 |
| M0-FR-009 | Test-plan §6 |
| M0-NFR-001 | TP-M0-F-001, TP-M0-NF-001 |
| M0-NFR-002 | TP-M0-I-002 |
| M0-NFR-003 | TP-M0-F-002, TP-M0-I-001 |
| M0-NFR-004 | TP-M0-F-003, TP-M0-NF-004 |
| M0-NFR-005 | TP-M0-I-003 with M0-AC-008. Commands are checked by following the developer documentation. |
| M0-NFR-006 | TP-M0-I-004 |
| M0-NFR-007 | TP-M0-I-005 |
| M0-NFR-008 | Test-plan §6 |
| M0-NFR-009 | Test-plan §7. Functional tests do not substitute. |
| M0-NFR-010 | TP-M0-NF-001. NF-002 and NF-003 are observations, not thresholds. |
| M0-AC-001 | TP-M0-F-001, TP-M0-NF-001 |
| M0-AC-002 | TP-M0-F-001 |
| M0-AC-003 | TP-M0-F-001 |
| M0-AC-004 | TP-M0-F-003. The approval commit is the green commit. |
| M0-AC-005 | TP-M0-F-002 |
| M0-AC-006 | TP-M0-F-002, TP-M0-I-001, TP-M0-I-002 |
| M0-AC-007 | TP-M0-F-003 |
| M0-AC-008 | TP-M0-F-001 |
| M0-AC-009 | TP-M0-I-003, after implementation |
| M0-AC-010 | Test-plan §10. This record does not satisfy it. |
| M0-AC-011 | Test-plan §7, after the built shell matches ADR-0007 |
| M0-AC-012 | Test-plan §6, after the shell implements the adopted design intent |

Post-implementation reviews are paths. They are not results.

Archive §9.1 identifiers are not the operational IDs in `specification.md`. Operational M0-FR-003 is the six boundaries, not a single test command. Operational M0-AC-002 is application startup. The headless import of core is M0-AC-006 evidence, not a rewrite of M0-AC-002.

## Deferred

Not Module 0 work, and not a binding decision for a later module:

- Visual regression, perceptual diffs, and Storybook visual tests.
- Benchmark-result storage, trend history, and a performance pass/fail threshold.
- A multi-browser matrix, or multi-OS GUI CI treated as proof that every product target ships in Module 0.
- Golden persistence files, round-trip corpora, and independent format readers.
- GPU or WebGPU conformance, trace captures, and reference renders. Core verification must not require a GPU.
- Coverage gates, flake quarantine, Testcontainers, and axe-core as a release gate.
- Playwright, Cypress, WebDriver, and CDP attachment to a system webview.
- Electron or system-webview launch automation. The Module 0 shell is the loopback browser.
- A Python or Rust test stack kept only so a future core language stays easy.

## Risks

- Core tests run under jsdom, happy-dom, Vitest browser mode, xvfb, or Electron, and the log is filed as M0-NFR-003 evidence.
- CI uses `continue-on-error`, a non-required job, or a shorter script than documented `pnpm verify`.
- The probe remains on the approval branch, is skipped, or never runs in CI because only a green squash commit is tested.
- The production bundle still reads `UVCP_FORCE_INIT_FAILURE`.
- The HTTP preview smoke, or a Chromium session against the dev server, is reported as M0-AC-002.
- Archive §9.1 text is implemented in place of the operational identifiers.
- CI is green because the image has toolchains the developer documentation never names.
- A sandbox, context-isolation, or certificate control is weakened to make a later automated launch easier. That is a security regression, not a test fix.
- A test-plan §9 example, such as visual regression or benchmark storage, is built in Module 0 and treated as a gate.
- Documented startup requires a GPU on a module that does not render.

## Limits

This record does not change an acceptance criterion. A stack that cannot test core without a window fails the current specification. Waiving M0-NFR-003, M0-AC-005, or M0-AC-006 is a product change and is not recommended.

M0-AC-001 and M0-AC-002 use the primary environment the Product Owner confirms. The architecture proposes 64-bit Windows x64. The test plan does not name a different OS. Graphical CI beyond that environment is not required. Adding it would be new scope.

M0-AC-012 reviews the design intent the architecture adopts. This record does not define that intent. Security content for M0-NFR-009 and M0-AC-011 stays with the Application Security Engineer.

Agreement with the architecture proposal is in `functional-proposal-review.md`.

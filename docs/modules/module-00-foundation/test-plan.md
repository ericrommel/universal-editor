# Module 0 — Test Plan

**Status:** DRAFT, with preparation clarifications dated 2026-10-02  
**Owners:** Functional Quality Engineer and Non-Functional Quality Engineer  
**Contributors:** Tech Lead, Developers, Product Designer, DevOps / Platform Engineer, Application Security Engineer

The 2026-10-02 clarifications add verification paths for identifiers the draft did not name. They do not change expected results that were already written, and they do not change Module 0 requirements or acceptance criteria. Tooling names match `docs/engineering/architecture.md`. Archive §9.1 identifiers are not interchangeable with the identifiers in `specification.md`.

## 1. Purpose

Define how Module 0 will be verified before implementation begins.

This plan describes the required verification approach. Developers remain responsible for implementing the automated tests needed by their changes.

The Quality Engineers design the strategy, provide or define shared test infrastructure, review developer tests, identify coverage gaps, and review the resulting evidence.

---

## 2. Verification Scope

Module 0 verification covers:

- clean repository setup;
- build success;
- minimal application startup;
- architectural dependency boundaries;
- headless core testing;
- local verification workflow;
- CI behavior;
- failure propagation;
- diagnostics;
- developer documentation;
- baseline design implementation;
- baseline security controls;
- reproducibility of the engineering environment.

Product editor functionality is outside this test plan.

---

## 3. Functional Scenarios

### TP-M0-F-001 — Clean Setup

From a clean checkout on the primary supported development environment:

1. follow only documented prerequisites/setup;
2. install dependencies;
3. build the project;
4. launch the minimal shell;
5. run the complete verification workflow.

Expected result: no undocumented manual workaround is required.

The successful verification log shows each applicable automated check actually running, including tests and, when the architecture says they apply, static/type checking and linting.

Covers: M0-FR-001, M0-FR-004, M0-FR-007, M0-NFR-001, M0-AC-001, M0-AC-002, M0-AC-003, M0-AC-008.

### TP-M0-F-002 — Headless Core

Run the core test suite without starting the graphical application.

Expected result: core tests complete normally.

Additional evidence requirement: the core command does not start the graphical shell and does not depend on a display server. A pass that requires xvfb, or any other supplied window system, is not evidence that M0-NFR-003 or M0-AC-005 passed. Record whether a display server was present.

Covers: M0-FR-002, M0-NFR-003, M0-AC-005, M0-AC-006.

### TP-M0-F-003 — Verification Failure Propagation

Temporarily introduce a deliberately failing test in a controlled verification branch/change.

Expected result:

- local verification fails;
- CI test verification fails;
- the failure is visible and actionable.

Remove the deliberate failure after evidence is collected.

Procedure:

1. Start from the implementation candidate. Use a short-lived branch or draft pull request, for example `verify/m0-failure-propagation`. Do not use a reduced CI workflow.
2. Add one new test file whose only purpose is the probe, so removal is a complete file delete. Do not edit an existing test. The assertion must be an ordinary failure with a fixed message, for example `M0 failure-propagation probe: this test must fail`. It must run under the same core test command CI runs, not under an excluded path.
3. Run the documented local verification command. Keep the log. Pass condition for this step: non-zero exit, the probe name, and the message are visible without a private debugger.
4. Push that commit and let the required CI test job run on that commit. Keep the job reference and the log excerpt. Pass condition: the test job status is failed, not skipped or neutral; the same probe message is in the log; the aggregate required check for the pull request is failed. A workflow syntax error, a cancelled job, or a failure in an unrelated job does not count.
5. If the workflow swallows the test step, fix the wiring and repeat from step 3. Do not remove the probe first.
6. Delete the probe file. Run local verification again. Push the removal. CI on the removal commit must pass the required checks.
7. The commit proposed for approval is the green commit. Evidence is the red local log, the red CI reference, the green local log, the green CI reference, and the diff that added and then removed the probe. Store logs as review artifacts, not as a checked-in failing test.

A permanent red test, a skipped test, `continue-on-error`, or a squash merge that never ran CI on the red commit does not meet M0-AC-004. If type checking and lint run inside the same `pnpm verify` job, this one red CI run also shows that those steps are on the required path. A failure that prints only "error", with no file or rule identifier, is not actionable under M0-NFR-004.

Covers: M0-FR-004, M0-FR-005, M0-NFR-004, M0-AC-004, M0-AC-007.

### TP-M0-F-004 — Startup Diagnostics

Verify normal startup logging and a controlled initialization-failure path.

Expected result: startup and failure are diagnosable without silent termination.

The controlled initialization failure is produced through a test double or a local fixture at the composition root, not by a failure flag left enabled in the shipped production shell. The architecture allows `UVCP_FORCE_INIT_FAILURE=1` only for `pnpm dev`. The production bundle must ignore it. Evidence is the captured diagnostic for normal startup and the captured diagnostic for the failure, plus a non-zero exit from the headless composition script on the failure path. A window is not required for that script. The shell must also show the failure when the dev-only path is used.

Covers: M0-FR-006.

---

## 4. Architecture / Integration Verification

### TP-M0-I-001 — Core Independence

Verify through build/test dependency analysis that core/domain tests do not require UI or desktop-shell startup.

Covers: M0-FR-002, M0-NFR-003, M0-AC-005, M0-AC-006.

### TP-M0-I-002 — Boundary Direction

Review dependency declarations/imports against the approved architecture.

Expected result: no prohibited dependency from core/domain into UI or platform-specific layers.

"Prohibited" includes every category in M0-NFR-002: a specific desktop shell, browser UI components, React components or equivalent UI-framework components, and platform-specific filesystem APIs. An automated check in the required verification workflow fails when core/domain violates that list. Review still confirms the result. The six areas in M0-FR-003 exist as separate packages. A placeholder is sufficient. Missing product behavior inside rendering or persistence is not a failure of this scenario. Platform-specific behavior that exists crosses an explicit abstraction rather than a core import.

Covers: M0-FR-003, M0-NFR-002, M0-AC-006.

### TP-M0-I-003 — Architecture Documentation Consistency

Compare implemented workspace/package boundaries with `docs/engineering/architecture.md` and ADRs.

Expected result: documentation describes the actual Module 0 architecture.

Covers: M0-AC-009. Contributes to M0-NFR-005 together with M0-AC-008. Development commands are verified by following the developer documentation, not by this comparison alone.

### TP-M0-I-004 — Technology Justification

Review `docs/engineering/architecture.md` and the Module 0 ADRs.

Expected result: each major technology choice records a justification against the Product Overview and at least one realistic alternative, including the trade-offs.

Covers: M0-NFR-006.

### TP-M0-I-005 — Core Platform Coupling

Review the core/domain model and its dependencies for intentional coupling to one target platform.

Expected result: the core project model does not depend on one operating system or one presentation layer. Not shipping Windows, macOS, Linux, and Web shells in Module 0 is not a failure.

Covers: M0-NFR-007.

The automated denylist supports this scenario. It does not replace the review.

---

## 5. Non-Functional Verification

### TP-M0-NF-001 — Reproducibility

Execute the documented setup and verification workflow in a clean or isolated environment appropriate to the selected stack.

Record:

- environment;
- toolchain versions;
- commands;
- result;
- undocumented intervention, if any.

Covers: M0-NFR-001, M0-NFR-010.

### TP-M0-NF-002 — Verification Runtime Baseline

Record the initial runtime of the complete verification workflow.

This is a baseline, not initially a pass/fail performance target unless the architecture proposal defines a justified threshold.

### TP-M0-NF-003 — Build/CI Baseline

Record initial build and CI timings and relevant cache behavior where available.

The purpose is to create comparison history for later modules.

### TP-M0-NF-004 — Failure Clarity

Review representative build/test/type/lint failures for actionable diagnostics.

Covers: M0-NFR-004. The deliberate test-failure half is TP-M0-F-003. For build, type checking, and lint, introduce one local break in that class, keep the non-zero log, and revert it before the next commit. Do not push that break unless the class is a separate required CI job. The architecture puts type checking and lint inside the same `pnpm verify` job as the tests, so the red CI run for TP-M0-F-003 covers that wiring. A log that does not name the file or the rule is not actionable.

---

## 6. Design Verification

The Product Designer reviews the minimal shell for:

- approved product identity direction;
- visual hierarchy;
- typography/spacing foundation where introduced;
- interaction consistency;
- accessibility-oriented basics applicable to the shell;
- avoidance of unnecessary editor complexity;
- platform adaptation assumptions.

Module 0 is not expected to contain the final design system.

Any platform-specific Apple/macOS design claims must be checked against current official guidance at the time the relevant behavior is introduced.

The review also judges Progressive Complexity, contextual interaction, and cross-platform adaptation. Cross-platform adaptation does not require pixel-identical behavior. The approved Module 0 design intent is `docs/modules/module-00-foundation/preparation/reviews/product-design.md`, as adopted by `docs/engineering/architecture.md`. The review cannot be executed until that intent is the one the shell implements.

Covers: M0-FR-009, M0-NFR-008, M0-AC-012.

---

## 7. Security Verification

The Application Security Engineer reviews:

- dependency trust and update strategy;
- package lock/reproducibility strategy;
- CI secret boundaries;
- desktop/native capability boundaries if present;
- local file/network permissions introduced by the shell;
- third-party build/runtime dependencies;
- initial software-supply-chain controls.

A lightweight threat model should identify the trust boundaries introduced by the selected Module 0 architecture.

No artificial vulnerability is introduced merely to prove the security process.

Covers: M0-NFR-009, M0-AC-011. Functional tests do not substitute for this review. The preparation threat model is `docs/modules/module-00-foundation/preparation/reviews/application-security.md`. ADR-0007 is the architecture decision that review judges the implementation against.

---

## 8. Developer Test Responsibilities

Developers are expected to:

- implement unit/integration tests required by their changes;
- keep tests deterministic where practical;
- run the agreed local verification workflow;
- provide tests for bug fixes discovered during Module 0;
- maintain compatibility with shared test infrastructure;
- address review findings from Quality Engineers.

Quality Engineers review the tests rather than automatically replacing developer test ownership.

---

## 9. Test Infrastructure Responsibilities

Quality Engineers define what shared infrastructure is required.

DevOps / Platform provides reproducible execution infrastructure where appropriate.

Examples may include:

- common test commands;
- CI test stages;
- clean-environment execution;
- test result artifacts;
- benchmark result storage;
- future visual-regression infrastructure.

Only infrastructure justified by Module 0 should be implemented now.

Module 0 shared infrastructure is: the documented verification command, the headless core test command, CI stages that fail on a required verification failure, the automated core dependency-boundary check, test-side fakes required by TP-M0-F-004, and retained verification logs including the TP-M0-NF-001 record. Timings for TP-M0-NF-002 and TP-M0-NF-003 are copied from those logs. The architecture names `node --test`, `tsc -b`, Biome, and `pnpm verify` as those commands.

Module 0 does not add a visual-regression harness, benchmark-result storage, a multi-browser matrix, a multi-OS GUI matrix, golden persistence files, or a performance pass/fail threshold. Pipeline timings are observations. A 30-minute CI job timeout and a 60-second diagnostic-spawn timeout are hang guardrails, not product performance targets.

M0-FR-008 is verified by review: the implemented commands and CI stages match this list and are the workflow the documentation tells developers to run. No separate product scenario is required.

---

## 10. Evidence Required for TESTS GREEN

Required evidence includes:

- complete verification output;
- clean setup result;
- build result;
- startup result;
- headless core-test result;
- deliberate-failure propagation result;
- CI result;
- architecture boundary review;
- baseline verification/build timing;
- design review result;
- security review result;
- Quality Engineer review of developer tests;
- documented known gaps/limitations.

The Quality Engineer review of this evidence is the verification of M0-AC-010.

---

## 11. Blocking Conditions

Module 0 must not reach TESTS GREEN if:

- required verification cannot be reproduced;
- core tests require the GUI despite the requirement;
- CI silently ignores a required failure;
- documented setup requires undocumented manual intervention;
- implemented architecture contradicts approved ADRs without an approved update;
- a blocking design or security finding remains unresolved;
- a Quality Engineer identifies a material untested requirement with no approved verification path.

---

## 12. Traceability

The final Module 0 evidence should map each M0-FR, M0-NFR, and M0-AC to one or more test, review, benchmark, or documented verification items.

The traceability matrix is maintained as delivery evidence and reviewed before PO approval.

Traceability uses the IDs in `specification.md` only. Archive §9.1 numbers are not interchangeable with those IDs.

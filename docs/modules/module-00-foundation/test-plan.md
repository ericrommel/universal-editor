# Module 0 — Test Plan

**Status:** DRAFT  
**Owners:** Functional Quality Engineer and Non-Functional Quality Engineer  
**Contributors:** Tech Lead, Developers, Product Designer, DevOps / Platform Engineer, Application Security Engineer

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

Covers: M0-FR-001, M0-FR-007, M0-NFR-001, M0-AC-001, M0-AC-002, M0-AC-008.

### TP-M0-F-002 — Headless Core

Run the core test suite without starting the graphical application.

Expected result: core tests complete normally.

Covers: M0-FR-002, M0-NFR-003, M0-AC-005, M0-AC-006.

### TP-M0-F-003 — Verification Failure Propagation

Temporarily introduce a deliberately failing test in a controlled verification branch/change.

Expected result:

- local verification fails;
- CI test verification fails;
- the failure is visible and actionable.

Remove the deliberate failure after evidence is collected.

Covers: M0-FR-004, M0-FR-005, M0-NFR-004, M0-AC-004, M0-AC-007.

### TP-M0-F-004 — Startup Diagnostics

Verify normal startup logging and a controlled initialization-failure path.

Expected result: startup and failure are diagnosable without silent termination.

Covers: M0-FR-006.

---

## 4. Architecture / Integration Verification

### TP-M0-I-001 — Core Independence

Verify through build/test dependency analysis that core/domain tests do not require UI or desktop-shell startup.

### TP-M0-I-002 — Boundary Direction

Review dependency declarations/imports against the approved architecture.

Expected result: no prohibited dependency from core/domain into UI or platform-specific layers.

### TP-M0-I-003 — Architecture Documentation Consistency

Compare implemented workspace/package boundaries with `docs/engineering/architecture.md` and ADRs.

Expected result: documentation describes the actual Module 0 architecture.

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

### TP-M0-NF-002 — Verification Runtime Baseline

Record the initial runtime of the complete verification workflow.

This is a baseline, not initially a pass/fail performance target unless the architecture proposal defines a justified threshold.

### TP-M0-NF-003 — Build/CI Baseline

Record initial build and CI timings and relevant cache behavior where available.

The purpose is to create comparison history for later modules.

### TP-M0-NF-004 — Failure Clarity

Review representative build/test/type/lint failures for actionable diagnostics.

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

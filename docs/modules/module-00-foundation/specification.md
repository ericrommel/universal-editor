# Module 0 — Engineering Foundation

**Status:** PLANNED

## 1. Objective

Establish a production-oriented engineering foundation for the Universal Visual Creation Platform before product functionality is implemented.

Module 0 establishes repository structure, architectural boundaries, build and verification tooling, CI, diagnostics, developer workflow, and the foundations needed for later cross-platform development.

Module 0 does **not** implement the visual editor.

---

## 2. Required Context

Before preparing or implementing this module, read:

- `/docs/product-overview.md`
- `/docs/engineering/development-process.md`
- `/docs/engineering/architecture.md`

During architecture preparation, `architecture.md` is expected to be incomplete.

The archived full Product & Engineering Specification may be consulted for long-term context only. It does not authorize implementation of future modules.

---

## 3. Scope

Module 0 includes:

- repository/workspace structure;
- minimal application shell;
- core/domain boundary;
- editor/application boundary;
- UI boundary;
- rendering boundary;
- platform boundary;
- persistence/project-format boundary;
- build tooling;
- automated unit testing;
- integration-testing foundation;
- static/type analysis where applicable;
- linting and formatting where appropriate;
- CI;
- basic diagnostic logging;
- developer setup documentation;
- initial design foundations needed by the shell;
- initial test infrastructure;
- initial security and supply-chain controls appropriate to the selected stack;
- architecture documentation and ADRs.

---

## 4. Out of Scope

Module 0 does not include:

- production visual authoring;
- production scene editing;
- a production scene graph;
- 2D drawing tools;
- 3D object editing;
- materials;
- lighting authoring;
- cameras;
- animation;
- AI product functionality;
- cloud backend functionality;
- collaboration;
- marketplace functionality;
- final production distribution.

Small technical probes or spikes may be used to validate architecture decisions. They must remain clearly identified as probes and must not silently become future product implementation.

---

## 5. Functional Requirements

### M0-FR-001 — Application Shell

The project shall build and launch a minimal application shell in the primary development environment.

The shell exists to prove the selected architecture and toolchain. It is not the visual editor.

### M0-FR-002 — Platform-Neutral Core

The repository shall provide a platform-neutral core/domain area that can be built and tested without launching the complete graphical application.

### M0-FR-003 — Architectural Boundaries

The repository shall establish explicit boundaries for at least:

- core/domain logic;
- editor/application logic;
- UI;
- rendering;
- platform-specific functionality;
- persistence/project format.

A boundary may initially contain minimal code.

### M0-FR-004 — Automated Verification

The repository shall provide a documented workflow that runs the required automated verification.

At minimum, it shall include:

- automated tests;
- static/type checking where applicable;
- linting where applicable.

### M0-FR-005 — Continuous Integration

The repository shall contain an automated CI workflow that performs the required build and verification steps.

A required verification failure shall fail the corresponding CI job.

### M0-FR-006 — Diagnostic Logging

The application shall provide basic diagnostics sufficient to identify:

- application startup;
- initialization failure;
- fatal startup errors.

### M0-FR-007 — Developer Documentation

The repository shall document:

- prerequisites;
- setup;
- development startup;
- build commands;
- test commands;
- verification commands;
- relevant repository structure.

### M0-FR-008 — Test Infrastructure Foundation

The repository shall provide the initial shared test infrastructure required by the approved Module 0 test plan.

### M0-FR-009 — Design Foundation

The repository shall support the initial design-system foundation required by the minimal application shell without prematurely implementing the production editor UI.

---

## 6. Non-Functional Requirements

### M0-NFR-001 — Reproducible Setup

A clean supported development environment shall be able to follow the documented setup process and reach a successful build without undocumented manual modifications.

### M0-NFR-002 — Separation of Concerns

Core/domain code shall not directly depend on:

- a specific desktop shell;
- browser UI components;
- React components or equivalent UI framework components;
- platform-specific filesystem APIs.

Platform-specific behavior shall cross an explicit abstraction boundary.

### M0-NFR-003 — Headless Core Verification

Core automated tests shall execute without opening a graphical window.

### M0-NFR-004 — Failure Visibility

Build, test, type-checking, linting, or equivalent verification failures shall produce actionable failures rather than silently succeeding.

### M0-NFR-005 — Maintainability

Repository conventions, dependency boundaries, development commands, and major architectural decisions shall be documented.

### M0-NFR-006 — Technology Justification

Major technology choices shall be justified against the Product Overview.

For major choices, at least one realistic alternative shall be evaluated.

### M0-NFR-007 — Cross-Platform Direction

The architecture shall not intentionally couple the core project model to one target platform.

This does not require implementing all target platforms during Module 0.

### M0-NFR-008 — Design Direction

The shell and design foundation shall preserve the product principles of Progressive Complexity, contextual interaction, and cross-platform adaptation.

Cross-platform shall not be interpreted as requiring pixel-identical platform behavior.

### M0-NFR-009 — Security Foundation

The selected architecture and repository shall define initial trust boundaries and provide appropriate baseline controls for dependencies, CI secrets, and platform capabilities introduced by Module 0.

### M0-NFR-010 — Reproducible Verification

Verification and benchmark infrastructure introduced in Module 0 shall be designed so that results can be reproduced in documented environments.

---

## 7. Acceptance Criteria

### M0-AC-001 — Clean Build

Given a clean checkout in a supported development environment, following the documented setup procedure results in a successful build.

### M0-AC-002 — Application Startup

The minimal application shell launches successfully using the documented development workflow.

### M0-AC-003 — Verification Workflow

A documented verification command/workflow successfully executes all required Module 0 automated checks.

### M0-AC-004 — Failure Detection

Given a deliberately failing test introduced only for verification, the local verification workflow and corresponding CI test step fail.

The deliberate failure is removed after the verification.

### M0-AC-005 — Headless Core Tests

Core tests execute successfully without launching the graphical application.

### M0-AC-006 — Dependency Boundary

The repository demonstrates that core/domain code can be imported and tested independently from UI and desktop-shell code.

### M0-AC-007 — CI Verification

CI performs the documented required checks and reports failure when a required check fails.

### M0-AC-008 — Reproducible Documentation

A reviewer can determine from repository documentation how to:

- install dependencies;
- run the application;
- build it;
- run tests;
- run the complete verification workflow.

### M0-AC-009 — Architecture Evidence

`/docs/engineering/architecture.md` and required ADRs accurately describe the architecture implemented by Module 0.

### M0-AC-010 — Quality Evidence

The Module 0 test plan has been executed, required evidence is available, and the Quality Engineers identify no blocking coverage gap.

### M0-AC-011 — Security Evidence

Security-relevant Module 0 architecture decisions have documented trust boundaries and no unresolved blocking security finding.

### M0-AC-012 — Design Review

The minimal shell has been reviewed against the approved Module 0 design intent and has no blocking design-quality finding.

---

## 8. Architecture Preparation

Before Module 0 becomes READY FOR DEVELOPMENT, the Tech Lead shall complete `/docs/engineering/architecture.md` and create ADRs under `/docs/engineering/adr/` for major decisions.

The architecture proposal must cover the topics listed in `architecture.md`.

The Product Designer, Quality Engineers, DevOps/Platform Engineer, and Application Security Engineer should contribute to the proposal where their expertise is relevant.

No production application implementation begins until blocking architecture decisions are reviewed and the PO authorizes READY FOR DEVELOPMENT.

---

## 9. Required Evidence Before PO Review

At minimum:

- clean build evidence;
- application startup evidence;
- automated test results;
- static/type verification results where applicable;
- linting results where applicable;
- CI result;
- proof that a failing test causes verification failure;
- proof that core tests run headlessly;
- architecture documentation;
- relevant ADRs;
- developer setup documentation;
- executed test-plan evidence;
- design review evidence;
- security review evidence;
- requirement traceability matrix;
- known limitations;
- unresolved technical debt.

---

## 10. Exit Criteria

Module 0 is GREEN only when:

- all blocking Module 0 FRs pass;
- all blocking Module 0 NFRs pass;
- all Module 0 ACs pass;
- required tests and regressions are green;
- required design/security/quality reviews are complete;
- blocking defects are closed;
- architecture documentation matches implementation;
- developer setup documentation is verified;
- required evidence exists;
- the Human Product Owner explicitly approves Module 0.

Only then may Module 1 enter implementation.

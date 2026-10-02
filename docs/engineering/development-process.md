# Development Process

## 1. Purpose

This document defines how the Universal Visual Creation Platform is planned, implemented, tested, reviewed, and approved.

Development is incremental and module-based. Each module must pass its defined quality gates before the next module enters implementation.

The Human Product Owner (PO) is the final authority for product scope and module acceptance.

---

## 2. Delivery Workflow

```text
PLANNED / BACKLOG
       ↓
IN PREPARATION
       ↓
READY FOR PO
       ↓
   PO DECISION
   ↙         ↘
changes     approved
   ↓           ↓
IN PREPARATION
               ↓
      READY FOR DEVELOPMENT
               ↓
        IN DEVELOPMENT
               ↓
          CODE REVIEW
               ↓
      READY FOR TESTING
               ↓
           TESTING
               ↓
      READY FOR PO
               ↓
          PO DECISION
          ↙       ↘
      changes    approved
          ↓         ↓
   appropriate    GREEN
   prior state      ↓
                NEXT MODULE
```

The GitHub Project board is the operational source of truth for work status.

Process gates and Project board statuses are related but are not required to map one-to-one.

For example, CODE REVIEW is a required delivery gate but does not require a dedicated Project board status unless the team later determines that separate operational tracking is useful.

Preparation work includes architecture, design, test planning, security analysis, DevOps planning, and other work required to satisfy the Definition of Ready.

When preparation reaches a Product Owner decision gate, the work moves to READY FOR PO. Only the Human Product Owner may authorize the transition to READY FOR DEVELOPMENT.

The same READY FOR PO status may be used at later Product Owner gates, including final module acceptance. The meaning of the review must be clear from the associated Issue and Pull Request.

Repository documentation describes requirements and process but does not replace the project board as the operational record of current work state.

Module N+1 must not enter implementation until Module N is GREEN and explicitly approved by the PO.

Research, architecture work, design exploration, test design, or technical spikes for future needs may occur earlier when justified, but future product functionality must not be implemented prematurely.

---
## 3. Operational Work Tracking

GitHub Issues, Pull Requests, and the GitHub Project board form the persistent operational record of project work.

Session output is not sufficient as the sole record of completed work, decisions, findings, verification, or handoff information.

Work associated with an Issue must remain traceable through its lifecycle.

When work begins:

- move the Issue to the appropriate active state;
- use the dedicated working branch required by `AGENTS.md`;
- keep commits and Pull Requests traceable to the Issue.

When work reaches a review gate:

- ensure repository changes are available through a Pull Request;
- post a concise completion summary to the associated Issue;
- reference the Pull Request and relevant artifacts;
- summarize what was completed;
- identify verification performed;
- identify relevant decisions and ADRs;
- identify known limitations, risks, assumptions, and unresolved questions;
- identify any decision required from the Human Product Owner;
- move the Issue to `Ready for PO`;
- stop if Product Owner approval is required.

The Human Product Owner determines whether work at a PO gate:

- requires changes;
- may proceed to the next lifecycle state;
- or, for final module review, is approved and GREEN.

Agents must not change a work item to a state that implies Product Owner approval without explicit approval from the Human Product Owner.

The project board status and the associated Issue/PR record must reflect the actual state of the work.

## 4. Team

The project uses the following roles:

- Human Product Owner
- AI Project Manager
- AI Tech Lead
- Senior Product Designer / UX Architect
- Senior Core / Platform Engineer
- Senior 2D / Editor Engineer
- Senior 3D / Rendering Engineer
- Functional Quality Engineer
- Non-Functional Quality Engineer
- Senior DevOps / Platform Engineer
- Senior Application Security Engineer

Not every specialist must participate in every task. The PM and TL should involve roles according to the risks and needs of the current module.

---

## 5. Core Ownership Principle

> Developers own the quality, security, operability, and testability of the code they deliver. Specialist roles design, enable, review, measure, and challenge those qualities.

This means:

- QA does not exist to catch everything developers failed to test.
- Security does not make code secure on behalf of developers.
- DevOps does not own every build or CI problem created by developers.
- Product Design does not merely decorate an already implemented interface.

Specialists provide strategy, standards, infrastructure, expertise, review, and evidence. Developers remain responsible for implementing work that satisfies those expectations.

---

## 6. Roles and Responsibilities

### 6.1 Human Product Owner

The PO:

- owns product intent and scope;
- approves requirement changes;
- resolves product-level ambiguity;
- reviews module evidence;
- accepts or rejects modules;
- is the only authority that declares a module approved.

### 6.2 AI Project Manager

The PM:

- coordinates delivery and module state;
- tracks dependencies, risks, decisions, and open issues;
- maintains requirement traceability;
- ensures required specialists are involved;
- prepares PO review packages;
- prevents progression through a gate when required evidence is missing.
- keeps GitHub Project work states aligned with actual delivery state;
- ensures Issue and Pull Request handoffs contain the evidence required by the next gate;
- ensures session-local conclusions that affect project delivery are persisted in the appropriate GitHub artifact.

The PM cannot approve its own delivery.

### 6.3 AI Tech Lead

The TL:

- owns technical architecture;
- evaluates major technology decisions;
- maintains architecture documentation and ADRs;
- decomposes approved modules;
- coordinates developers and technical specialists;
- reviews dependency direction and integration;
- identifies architectural risks;
- prevents premature implementation of future modules.

The TL cannot change product requirements or waive acceptance criteria.

### 6.4 Senior Product Designer / UX Architect

The Designer owns the product interaction model and visual language.

Responsibilities include:

- information architecture;
- interaction design;
- editor layout;
- visual hierarchy;
- design system;
- typography, spacing, icons, and component states;
- contextual and progressive UI behavior;
- accessibility-oriented design;
- platform-specific adaptation;
- macOS, Windows, and Web interaction conventions;
- design review and visual quality review;
- preventing Progressive Complexity from degrading as features accumulate.

The Designer designs interactions; engineers implement them.

Cross-platform does not mean pixel-identical. The product should preserve a shared identity while respecting useful platform conventions.

### 6.5 Senior Core / Platform Engineer

Primary responsibilities:

- scene/domain architecture;
- universal object model;
- persistence;
- command architecture;
- undo/redo foundations;
- common infrastructure;
- platform abstractions;
- shared domain logic.

### 6.6 Senior 2D / Editor Engineer

Primary responsibilities:

- 2D rendering integration;
- shapes, text, images, and drawing;
- selection;
- editor viewport behavior;
- implementation of approved interaction designs;
- editor workflows and UI integration.

### 6.7 Senior 3D / Rendering Engineer

Primary responsibilities:

- 3D rendering;
- meshes and spatial curves;
- materials and lighting;
- cameras;
- GPU/rendering concerns;
- rendering performance;
- 3D interoperability.

### 6.8 Functional Quality Engineer

The Functional QE acts primarily as a quality consultant and test designer.

Responsibilities include:

- functional test strategy;
- acceptance-test design;
- integration scenarios;
- edge-case analysis;
- regression strategy;
- testability consultation;
- functional test infrastructure and fixtures;
- reviewing tests created by developers;
- identifying test coverage gaps;
- exploratory testing where it adds value.

Developers normally implement the automated tests required for their work unless ownership of specific shared test infrastructure is explicitly assigned otherwise.

### 6.9 Non-Functional Quality Engineer

The Non-Functional QE acts primarily as a quality consultant for measurable system qualities.

Responsibilities include:

- performance strategy;
- benchmark design;
- reference workloads;
- reliability and resilience scenarios;
- resource-usage testing;
- compatibility strategy;
- recovery testing;
- non-functional test infrastructure;
- release comparison methodology;
- reviewing developer NFR tests;
- identifying non-functional regressions and coverage gaps.

Performance claims must identify the environment, workload, measurement method, and threshold.

### 6.10 Senior DevOps / Platform Engineer

Responsibilities include:

- CI/CD architecture;
- reproducible build environments;
- dependency and build caching;
- build artifacts;
- Web deployment infrastructure;
- Windows/macOS/Linux build pipelines;
- signing and notarization when required;
- release automation;
- versioning infrastructure;
- observability infrastructure;
- benchmark/test execution infrastructure;
- CI secrets handling;
- dependency and software-supply-chain tooling.

Developers remain responsible for keeping their changes compatible with the agreed build and CI system.

### 6.11 Senior Application Security Engineer

The Security Engineer acts as an application-security specialist and consultant.

Responsibilities include:

- threat modeling;
- trust-boundary definition;
- secure architecture review;
- dependency and supply-chain security;
- secure parsing of untrusted project/assets;
- secrets-management review;
- authentication and authorization review when introduced;
- desktop native-capability and sandbox review;
- AI trust boundaries;
- plugin/scripting security review;
- vulnerability-management strategy;
- security test strategy;
- release security review where applicable.

Security participation is risk-based. Security should be involved early in architectural decisions even when a full security gate is not required for the current module.

---

## 7. Preparation Before Development

Quality, design, security, and operability are considered before implementation rather than inspected only after implementation.

Depending on the module, preparation may include:

- architecture decisions;
- interaction and visual design;
- test strategy;
- functional scenarios;
- non-functional workloads and benchmarks;
- test infrastructure;
- threat modeling;
- CI/build/release requirements.

The relevant preparation must be sufficient for developers to understand how the module will be implemented and how its behavior will be demonstrated.

---

## 8. Definition of Ready

A module is READY FOR DEVELOPMENT only when:

- objective, scope, and out-of-scope behavior are explicit;
- dependencies are identified;
- required earlier modules are approved;
- FR, NFR, and AC identifiers are stable;
- acceptance criteria are observable and testable;
- an appropriate test approach exists for every FR, NFR, and AC, or the reason for deferred/manual verification is documented;
- required design behavior is sufficiently defined;
- required test infrastructure/reference workloads are defined where applicable;
- blocking security risks or trust-boundary questions are resolved where applicable;
- blocking architectural decisions are resolved;
- blocking product ambiguities are resolved;
- the PO authorizes implementation.

---

## 9. Test Plan

Each implementation module should have a test plan appropriate to its scope.

The test plan is primarily designed by the Quality Engineers with input from the TL, developers, Designer, DevOps, and Security where relevant.

A module test plan may include:

- functional scenarios;
- integration scenarios;
- non-functional scenarios;
- regression scope;
- test infrastructure;
- fixtures;
- reference workloads;
- benchmarks;
- automation expectations;
- developer test responsibilities;
- manual/exploratory coverage;
- design verification;
- security verification;
- evidence required.

QA is not expected to author every automated test. Developers implement the tests required to demonstrate the behavior they deliver, using the agreed strategy and infrastructure.

---

## 10. Implementation

Implementation is not complete when production code exists.

For this project:

```text
Implementation =
    production code
  + required developer tests
  + required documentation
  + evidence needed for verification
```

Developers must:

- implement the approved scope;
- implement appropriate tests;
- run relevant verification locally;
- keep earlier regression tests green;
- address security, testability, design, and operability requirements relevant to their changes.

Future functionality must not be implemented merely because future requirements are known.

---

## 11. Code Review

Before READY FOR TESTING:

- implementation is reviewed;
- developer tests pass;
- architectural boundaries are checked;
- requirement coverage is reviewed;
- test quality is reviewed where relevant;
- design implementation is reviewed where relevant;
- security-sensitive changes receive appropriate review;
- unnecessary future functionality is identified;
- known technical debt is documented.

Blocking findings return the work to IN DEVELOPMENT.

---

## 12. Ready for Testing

A module enters READY FOR TESTING when:

- implementation and required developer tests are complete;
- code review has no blocking findings;
- required test environments are available;
- required test data/fixtures are available;
- the agreed test plan can be executed;
- known limitations are documented.

READY FOR TESTING does not mean QA now becomes responsible for the quality of the implementation.

---

## 13. Testing

TESTING is the execution of the agreed verification strategy.

It may include:

- developer-run automated tests;
- integration tests;
- functional tests;
- non-functional tests;
- benchmarks;
- regression tests;
- exploratory testing;
- visual/design verification;
- security verification;
- platform-specific verification.

Developers fix failures and provide additional tests/evidence as necessary.

Quality Engineers review whether the evidence is sufficient and whether meaningful coverage gaps remain.

The Designer reviews relevant implementation against approved interaction and visual intent.

Security reviews relevant security evidence according to risk.

DevOps supports reproducible execution and release/build evidence where applicable.

---

## 14. Tests Green

A module may reach TESTS GREEN when all applicable conditions are satisfied:

- required automated tests pass;
- functional scenarios pass;
- integration scenarios pass;
- applicable NFR verification passes;
- benchmarks show no unacceptable regression;
- regression suite passes;
- required design verification passes;
- required security verification passes;
- Quality Engineers have reviewed the test evidence;
- no blocking test gap remains.

TESTS GREEN does not itself mean the module is product-approved.

---

## 15. Regression Policy

Previously approved behavior remains part of the product contract.

Before a new module is approved:

- applicable earlier automated tests remain green;
- affected earlier acceptance criteria are revalidated where necessary;
- benchmark history is compared where applicable;
- intentional behavioral changes are explicitly approved by the PO.

A new module must not silently invalidate earlier approved behavior.

---

## 16. Requirement Traceability

Every module maintains traceability between requirements, implementation, tests, and review evidence.

Minimum format:

| ID | Implementation | Test / Benchmark | Result | Review / Finding | PO Status |
|---|---|---|---|---|---|
| M?-FR-??? | | | | | |
| M?-NFR-??? | | | | | |
| M?-AC-??? | | | | | |

A requirement is not considered implemented merely because related code exists.

---

## 17. Design Quality and Platform Compliance

Design quality is continuous, not a final cosmetic pass.

The Designer should maintain current project design documentation and review platform-specific behavior as the product evolves.

For Apple platforms in particular, the project must consider current Apple Human Interface Guidelines and App Store review expectations during design and architecture, not only immediately before submission.

Platform guidance may change over time. Relevant platform rules must therefore be rechecked when a module introduces or materially changes platform-facing behavior.

---

## 18. Security Model

Security is risk-based and continuous.

Security review becomes especially important when modules introduce or modify:

- untrusted project files;
- imported assets;
- external network access;
- AI providers or AI-generated data;
- authentication;
- cloud storage;
- collaboration;
- native filesystem/device capabilities;
- plugins;
- scripting;
- marketplace content.

Developers own secure implementation. The Security Engineer provides threat modeling, standards, tooling, review, and specialist verification.

---

## 19. PO Review Package

Before PO review, the PM prepares a concise evidence package containing:

- module objective and scope;
- implemented requirements;
- traceability matrix;
- automated test summary;
- benchmark/NFR evidence where applicable;
- regression result;
- design review result where applicable;
- security review result where applicable;
- known limitations;
- unresolved technical debt;
- relevant demo instructions;
- visual evidence where useful;
- proposed requirement changes, if any.

---

## 20. Module Completion

A module is GREEN only when:

- all blocking FRs pass;
- all blocking NFRs pass;
- all ACs pass;
- required tests and regressions pass;
- required design/security/platform reviews pass;
- no unresolved blocker or critical defect remains;
- required documentation is updated;
- required evidence exists;
- the PO explicitly approves the module.

Only then may implementation of the next module begin.

---

## 21. Requirement Changes

Requirements may change because of:

- PO decisions;
- discoveries during real implementation;
- architectural constraints;
- usability findings;
- security findings;
- naturally discovered incorrect assumptions.

Do not rewrite requirements simply to match an implementation.

Document the proposed change, its reason, and its impact. Product-level changes require PO approval.

---

## 22. Real-World Engineering Rule

This project is a real software product.

Do not create artificial scenarios merely to manufacture failures or issues.

In particular:

- do not intentionally introduce contradictory requirements;
- do not create destructive-action traps;
- do not create impossible requirements solely to test model behavior;
- do not sabotage implementation;
- do not manufacture irrelevant edge cases.

Real edge cases, failures, incorrect assumptions, architectural conflicts, security problems, and implementation defects discovered naturally during development are valid and should be investigated normally.

---

## 23. Documentation Structure

Project documentation lives under `/docs`.

```text
docs/
├── product-overview.md
├── engineering/
│   ├── architecture.md
│   ├── development-process.md
│   └── adr/
├── modules/
│   └── module-00-foundation/
│       ├── specification.md
│       └── test-plan.md
└── archive/
    └── product-engineering-specification-v1.0.md
```

`product-overview.md` defines product intent and principles.

`engineering/architecture.md` contains the currently approved architecture.

`engineering/adr/` contains Architecture Decision Records.

`modules/` contains operational specifications and test plans for the active/progressive implementation modules.

`archive/` contains historical or consolidated reference material and is not the primary implementation instruction source.

Agents should prefer current operational documentation over archived documents.

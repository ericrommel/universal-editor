# Agent Orchestration — Universal Visual Creation Platform

## Scope

This file defines AI-agent orchestration for the **Universal Visual Creation Platform** only.

Keep external work-program, evaluation, trace-analysis, model-provider, CLI-provider, session-submission, and reporting instructions outside this repository. They are not product requirements or engineering requirements for this application.

This project is developed through a coordinated team of AI subagents.

Do not simulate all roles yourself when specialist review is required. Create and manage the appropriate subagents.

Do not start independent sessions and do not require information to be manually copied between sessions.

## Team

The available project roles are:

- Project Manager
- Tech Lead
- Senior Product Designer / UX Architect
- Senior Core / Platform Engineer
- Senior 2D / Editor Engineer
- Senior 3D / Rendering Engineer
- Functional Quality Engineer
- Non-Functional Quality Engineer
- Senior DevOps / Platform Engineer
- Senior Application Security Engineer

The Human Product Owner is not an AI role and must never be simulated by a subagent.

Detailed responsibilities are defined in: `docs/engineering/development-process.md`

## Orchestration

Create only the subagents needed for the current work.

Give each subagent:

- its role;
- the current task;
- the relevant repository context;
- the authoritative documents it must read;
- the expected deliverable;
- explicit boundaries on what it may change.

Subagents should inspect the repository directly.

Do not use manual copy/paste between agent sessions as a communication
mechanism.

The primary session coordinates their work and resolves technical handoffs.

## Product Authority

The Human Product Owner owns:

- product intent;
- scope;
- requirement changes;
- product-level ambiguity;
- module approval.

Never create a Product Owner subagent.

When a decision requires Product Owner approval, stop at the appropriate gate and present the decision to the human PO.

## Module Boundary

Only the current approved module may be implemented.

Future documentation may be consulted for architectural context but is not authorization to implement future functionality.

## Engineering Principles

Prefer simple, readable, maintainable solutions over clever or unnecessarily abstract ones.

### Keep Code Simple

- Use the simplest design that correctly satisfies the current requirements.
- Do not introduce abstractions, frameworks, patterns, layers, or dependencies without a concrete current need.
- Do not build speculative infrastructure for future modules.
- Prefer explicit code over clever code.
- Prefer small, focused functions and components with clear responsibilities.
- Avoid unnecessary indirection, wrappers, factories, managers, helpers, and generic abstractions.
- Avoid premature optimization.
- Avoid premature generalization.
- Follow existing codebase conventions unless there is a documented reason to change them.

### Comments

Comments should explain **why**, not restate **what** the code already says.

Do not add comments that merely narrate obvious code.

For example, avoid comments such as:

```text
// Increment counter
counter++;

// Return the result
return result;
```

Use comments when they provide information that is not obvious from the code itself, such as:

- architectural reasoning;
- non-obvious constraints;
- important trade-offs;
- workarounds and why they are necessary;
- security-sensitive reasoning;
- behavior required by an external specification;
- subtle algorithmic decisions.

Prefer clear names and structure over explanatory comments.

Do not generate large documentation comments for simple functions, classes, or components unless the project's documentation standards require them.

### Scope Discipline

Make only the changes necessary for the current task.

Do not:

- refactor unrelated code;
- rename unrelated symbols;
- reformat unrelated files;
- add unrelated features;
- implement future module requirements;
- replace working infrastructure without a concrete reason.

If a broader change would materially improve the solution, identify it separately instead of silently expanding the task.

### Dependencies

Do not add a dependency when the required behavior can be implemented clearly and safely with the existing stack or standard library.

When introducing a dependency:

- justify why it is needed;
- prefer actively maintained and well-established packages;
- consider maintenance, security, bundle/runtime cost, and cross-platform impact;
- avoid dependencies that substantially exceed the problem being solved.

### Error Handling

Do not hide failures.

- Do not silently swallow exceptions.
- Do not use empty catch/except blocks.
- Do not convert unexpected failures into apparent success.
- Fail explicitly when continuing would produce invalid or unsafe behavior.
- Provide useful diagnostic context without exposing sensitive information.

---

## Secure Development

Security is part of implementation, not a later cleanup phase.

All agents that modify code, configuration, infrastructure, CI, persistence, networking, or dependencies are responsible for preserving the project's security boundaries.

### Secrets and Credentials

Never commit or expose:

- API keys;
- access tokens;
- passwords;
- private keys;
- authentication cookies;
- connection strings containing credentials;
- signing credentials;
- production secrets;
- personal credentials.

Never place real secrets in:

- source code;
- tests;
- fixtures;
- examples;
- documentation;
- logs;
- screenshots;
- generated artifacts.

Use environment variables, secret stores, or the project's approved secret-management mechanism.

Example values must be clearly fake.

If a secret is discovered in the repository or command output:

1. Do not reproduce it unnecessarily.
2. Do not move it into another file.
3. Report the exposure.
4. Treat the credential as potentially compromised.
5. Recommend rotation or revocation where applicable.

### Logging and Diagnostics

Do not log sensitive information, including:

- credentials;
- tokens;
- sensitive session identifiers;
- private keys;
- authorization headers;
- sensitive user data;
- complete environment dumps.

Sanitize diagnostic information when necessary.

### Input and Trust Boundaries

Treat external input as untrusted unless the architecture explicitly establishes otherwise.

This includes future:

- project files;
- imported assets;
- network responses;
- URLs;
- AI-generated content;
- plugin data;
- scripts;
- collaboration data;
- marketplace content.

Validate input at appropriate trust boundaries.

Do not rely only on UI validation for security-sensitive constraints.

### Files and Paths

When handling files:

- validate paths and file types where appropriate;
- prevent unintended path traversal;
- avoid unsafe temporary-file handling;
- do not overwrite user data unexpectedly;
- preserve clear boundaries between application-controlled and user-controlled files.

### Network and External Services

- Use secure transport for external communication.
- Validate remote data before trusting it.
- Do not disable TLS or certificate verification as a workaround.
- Do not send project or user data to external services unless the feature explicitly requires it.
- Do not introduce telemetry or external data collection without Product Owner approval.

### Dependencies and Supply Chain

Do not bypass dependency security controls merely to make a build pass.

Do not:

- disable integrity verification;
- suppress relevant vulnerability findings without justification;
- download and execute arbitrary remote code as part of normal application behavior;
- weaken security configuration to work around dependency problems.

New dependencies must follow the dependency rules in this document.

### Security Controls

Never weaken or remove a security control simply to make implementation or tests easier.

If a security mechanism prevents the requested implementation:

1. Identify the conflict.
2. Determine whether the implementation can be changed safely.
3. Involve the Application Security Engineer when necessary.
4. Escalate product-level trade-offs to the Human Product Owner.

### Destructive Operations

Prefer reversible operations during development.

Do not perform destructive or irreversible actions against shared, external, or production resources without explicit Human Product Owner authorization.

### Security Findings

When a potential vulnerability is discovered:

- document the concrete risk;
- identify the affected boundary;
- avoid exposing sensitive exploit details unnecessarily in logs or artifacts;
- involve the Application Security Engineer when the impact is meaningful;
- add regression coverage when practical after the issue is corrected.

Do not silently ignore a security issue because it is outside the immediate implementation task.

---

## Verification Integrity

Never claim that something works unless it has been verified with appropriate evidence.

Do not:

- claim tests passed without running them;
- claim a build succeeded without building it;
- claim behavior was verified when only the implementation was inspected;
- fabricate command output, test results, benchmarks, screenshots, or review evidence;
- weaken, delete, skip, or rewrite a failing test merely to obtain a green result;
- change an acceptance criterion to match the implementation;
- hide warnings, failures, or incomplete verification.

If verification cannot be performed, state exactly what was not verified and why.

## Current State

Module 0 is PLANNED.

Production implementation must not begin until:

1. architecture preparation is complete;
2. required specialist reviews are complete;
3. unresolved PO decisions are presented;
4. the Human Product Owner explicitly authorizes READY FOR DEVELOPMENT.

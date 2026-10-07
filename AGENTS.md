# Agent Orchestration — Universal Visual Creation Platform

## Scope

This file defines AI-agent orchestration for the **Universal Visual Creation Platform** only.

Keep external work-program, evaluation, trace-analysis, model-provider, CLI-provider, session-submission, and reporting instructions outside this repository. They are not product requirements or engineering requirements for this application.

This project is developed through a coordinated team of AI subagents.

Do not simulate all roles yourself when specialist review is required. Create and manage the appropriate subagents.

Independent primary sessions may be used when useful. Sessions should use the repository and persistent project records as their shared source of truth. Do not use manual copy/paste of plans, reasoning, or responses between sessions as a coordination mechanism.

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

Do not simulate a Product Owner. Acceptance is professional review, as defined in `docs/engineering/development-process.md`.

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

## Decision Authority

The Project Manager and Tech Lead resolve technical, architectural, sequencing, quality, security, and implementation decisions with the relevant specialists and record the result.

There is no Product Owner gate. A product decision is settled by the roles responsible for that area and recorded on the pull request.

Do not stop because more than one reasonable engineering option exists.

## Module Boundary

Modules organize the product. They do not block implementation of a later module.

Use the existing scene, editor, rendering, and shell boundaries. Do not add a package, a dependency, or a persistence field for a capability the current behavior does not need.

When an existing constraint still applies, keep it. Examples: fixed domain-error messages, the scene byte cap, and the package import table.

## Engineering Principles

Prefer simple, readable, maintainable solutions over clever or unnecessarily abstract ones.

### Keep Code Simple

- Use the simplest design that correctly satisfies the current requirements.
- Before implementing substantial custom infrastructure, check whether the existing stack, standard library, or a focused well-maintained dependency already solves the problem more simply.
- Do not implement custom parsers, serializers, protocol handlers, state machines, schedulers, security primitives, or similar infrastructure without first evaluating simpler existing alternatives.
- If custom infrastructure is still the best choice, keep it narrowly scoped and document why the simpler alternatives are insufficient.
- Passing tests does not by itself justify unnecessary implementation complexity.
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

Do not add a dependency when the required behavior can be implemented clearly, safely, and with comparable maintainability using the existing stack or standard library.

Do not avoid a focused dependency by replacing it with substantially more custom code that the project would then have to maintain.

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
- Do not introduce telemetry or external data collection.

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
4. Record a product trade-off on the pull request and have the affected roles accept it.

### Destructive Operations

Prefer reversible operations during development.

Do not perform destructive or irreversible actions against shared, external, or production resources without explicit authorization. `main` is one of those resources.

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

## Work Tracking

GitHub Issues and the project board are the persistent operational record of project work.

Do not rely on session output as the only record of completed work, decisions, findings, or verification.

For work associated with a GitHub Issue:

- move the issue to the appropriate active status when work begins;
- perform repository changes on the task's dedicated branch;
- keep the issue and related Pull Request traceable to each other;
- when work reaches a review gate, post a concise completion summary to the issue;
- include relevant decisions, artifacts, verification performed, known limitations, risks, and unresolved questions;
- link or reference the Pull Request containing the proposed repository changes;
- move the issue to the appropriate review status when a pull request is open.

## Repository Workflow

All repository changes must be made on a dedicated branch.

### Branch Safety

- `main` is protected. Never commit, push, merge, or force-push to `main`.
- `master` is the integration branch. Do not commit directly on `master`.
- Before making any repository change, verify the current branch.
- If the current branch is `main` or `master`, create and switch to a working branch before modifying files.
- Keep each branch scoped to the task.
- Do not mix unrelated changes into the same branch.
- Do not force-push or rewrite shared history.
- Do not merge into `master` until the requested reviews approve the head and required CI is green.
- Repository documentation changes follow the same branch and review rules as source-code changes.

### Pull Requests

Changes intended for `master` must be submitted through a Pull Request. Do not open a pull request into `main`.

A Pull Request should:

- clearly describe the purpose and scope of the change;
- reference the relevant module, requirement, issue, or architectural decision where applicable;
- include the verification performed;
- identify known limitations or unresolved findings;
- remain limited to its stated scope.

Agents may prepare branches, commits, and Pull Requests as part of authorized work, but must not treat creation of a Pull Request as approval to merge.

Merging into `master` requires the review and verification rules in `docs/engineering/development-process.md`.

### Review Coordination and Merge Authority

The role that creates and drives a Pull Request is its logical owner.

When opening a PR, the owner must identify the required reviewer roles based on scope and risk, request those reviews, and identify the head being reviewed.

Because multiple logical roles may use the same GitHub account, review independence is established by distinct role-attributed review records, not by GitHub account identity alone.

Reviewers work independently on the same head.

Review findings are recorded as focused comments, preferably inline when they apply to a specific line or file. Each review comment must identify the logical reviewer role. Blocking and non-blocking findings should be separate threads where practical.

The role that created a review thread owns it. Only that same logical role may resolve the thread after verifying the fix. Other roles, including the PR owner, must not resolve it merely because the shared GitHub account allows them to.

When a reviewer finishes the current head, it posts a short role-attributed completion comment. An approval is recorded as **Review complete: APPROVED** for the reviewed head after that reviewer has no unresolved blocking findings.

The PR owner waits for all requested reviewers to finish before making normal review fixes, then integrates the complete feedback set. Re-review is required only from roles whose review area was materially affected.

Minimum review requirements and reviewer-selection rules are defined in `docs/engineering/development-process.md`.

The PR owner owns the merge by default. Another role must not merge merely because it has repository permission.

After all required reviews approve the current material head, required CI and verification are green, and blocking findings are closed, the PR is merge-authorized.

Repository permission is not merge authorization. An explicit instruction not to merge always takes precedence.

### Agent Attribution

When posting persistent project updates to GitHub Issues, Pull Requests, or reviews, clearly identify the responsible project role at the beginning of the message.

Use:

**Role: <project role>**

Examples:

**Role: Tech Lead**

**Role: Functional Quality Engineer**

**Role: Application Security Engineer**

Do not present the Human Product Owner as the author of an AI-generated project update.

If multiple specialist roles contributed to the same handoff, identify the primary authoring role and list the contributing roles separately.

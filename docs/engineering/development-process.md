# Development Process

## 1. Purpose

This document is the development process for the Universal Visual Creation Platform.

`master` is the integration branch. `main` is protected and is not an integration branch. Do not commit, push, merge, or force-push to `main`.

Acceptance is professional review by the roles affected by the change. There is no Product Owner gate. Do not stop work to wait for one.

Modules describe the product. A later module does not wait for an earlier module to be marked GREEN.

## 2. Branches

- Create `master` from `main` and integrate there.
- Do not commit directly on `master` or `main`. Use a dedicated branch and a pull request into `master`.
- Do not force-push or rewrite shared history.
- CI runs on pull requests and on pushes to `master`.

A pull request merges into `master` when:

- every requested reviewer has approved the current head;
- required CI is green;
- no blocking finding is unresolved.

The pull request owner merges it. Another role does not merge only because the shared account has permission.

## 3. Roles

Use the roles named in `AGENTS.md`. Do not invent a Product Owner role and do not simulate one.

The role that opens a pull request names the reviewers the change needs. Material code, persistence, security, architecture, or tests need at least two independent roles. A docs-only process change needs at least two roles when it changes how the team accepts work.

Reviews are role-attributed comments. Do not use the GitHub Approve button as the review record.

Each review comment starts with **Role:** and the role name. A finding is **Finding: BLOCKING** or **Finding: NON-BLOCKING**. Completion is **Review complete: APPROVED** and the reviewed head. Only the role that opened a thread resolves it.

The owner waits until every requested reviewer has finished that head before changing it to address findings.

## 4. Building

Implement the behavior the product needs. Prefer the existing packages and the scene document over new infrastructure.

Record behavior in the module document that owns it. State the behavior. Leave out process narration and unused alternatives.

Keep the package boundaries in `scripts/boundaries.mjs` and `docs/engineering/architecture.md`.

`node scripts/verify.mjs` is the verification gate. Node is exactly the version in `.node-version`. Do not claim a result the command did not produce.

## 5. Security

Treat scene documents, imported files, and other external input as untrusted.

Do not log secrets, tokens, or document contents. Do not add telemetry. Do not weaken a security control to make a test pass. Domain errors use fixed messages and do not echo input.

A security finding is fixed or recorded as blocking before merge.

The secure-development rules in `AGENTS.md` still apply.

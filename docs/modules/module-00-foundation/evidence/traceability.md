# Module 0 traceability

**Role: Tech Lead**

This matrix maps the operational identifiers in `specification.md` to the implementation and the evidence. Archive identifiers are not used. PO Status stays Pending. This matrix is not GREEN.

| ID | Implementation | Test / Benchmark | Result | Review / Finding | PO Status |
| --- | --- | --- | --- | --- | --- |
| M0-FR-001 | `apps/shell`, `pnpm dev` | `evidence/launch/` | Headed Edge showed the foundation screen | `evidence/design-review.md` | Pending |
| M0-FR-002 | `packages/core` | `packages/core/src/core.test.ts` inside `pnpm test` | Headless tests passed. The test command does not start Vite | Functional quality review of the section 12 list | Pending |
| M0-FR-003 | Six packages and `scripts/check-boundaries.mjs` | First step of `pnpm verify` | Boundary check passed in local verify | Functional quality review | Pending |
| M0-FR-004 | `scripts/verify.mjs` | Local verify and GitHub Actions | Local verify exited 0. A failing test exits 1 | `evidence/failure-clarity.md` | Pending |
| M0-FR-005 | `.github/workflows/verify.yml` | Required jobs on `ubuntu-24.04` and `windows-2025` | A failing verify fails the job. A passing verify passes the job | Pull requests 23 and 28 | Pending |
| M0-FR-006 | `packages/editor` diagnostics and the shell screen | Editor tests and the dev failure launch | Startup and failure are logged and shown | `evidence/launch/` and `evidence/design-review.md` | Pending |
| M0-FR-007 | `docs/engineering/developer-setup.md` | The documented commands | Install, launch, build, test, and verify are written down | Functional quality review | Pending |
| M0-FR-008 | `pnpm test`, `pnpm verify`, the boundary check, CI, and the dev-failure double | Test plan section 9 | The commands match that list | Functional quality review | Pending |
| M0-FR-009 | `packages/ui` strings, tokens, and screen | UI tests and the running shell | The screen uses the adopted strings and tokens | `evidence/design-review.md` | Pending |
| M0-NFR-001 | Developer setup and the cold-store record | `evidence/m0-pipeline-baseline.json`, `evidence/reproducibility.md` | Documented install and verify exited 0. Windows 11 Pro build 26200 is recorded for the 2026-10-05 machine | Non-functional quality review | Pending |
| M0-NFR-002 | `scripts/boundaries.mjs` | Boundary tests | Core does not import UI, React, or filesystem APIs | Functional quality review | Pending |
| M0-NFR-003 | `pnpm test` | Ubuntu verify without xvfb | The test command does not open a window. Run 37235385386 passed on `ubuntu-24.04` | `evidence/reproducibility.md` | Pending |
| M0-NFR-004 | `scripts/verify.mjs` returns the first non-zero status | Local type, lint, build, and test breaks | Each log names the file or the rule | `evidence/failure-clarity.md` | Pending |
| M0-NFR-005 | Architecture, ADRs, and developer setup | `evidence/architecture-consistency.md` | Binding sections match the tree | Tech Lead | Pending |
| M0-NFR-006 | ADR-0001 through ADR-0008 | Alternatives in the architecture and the ADRs | Each major choice records an alternative | Functional quality review | Pending |
| M0-NFR-007 | `packages/core` has no OS or presentation import | Boundary check | The core model is not coupled to one platform | Functional quality review | Pending |
| M0-NFR-008 | Foundation screen | Design review DV-01 through DV-20 | No blocking design finding. Non-blocking differences are listed | `evidence/design-review.md` | Pending |
| M0-NFR-009 | ADR-0007 controls in the shell, CI, and dependency checks | `evidence/security-review.md` | No blocking security finding | Application Security Engineer | Pending |
| M0-NFR-010 | Baseline file, `kind: observation` | Cold local Windows verify and Windows CI | Durations are recorded and are not thresholds | Non-functional quality review | Pending |
| M0-AC-001 | `docs/engineering/developer-setup.md` | Cold empty-store install and verify, exit 0 | The documented commands succeed. No undocumented project edit is recorded | `evidence/reproducibility.md` | Pending |
| M0-AC-002 | `pnpm dev` on loopback | Headed Microsoft Edge 154.0.4258.53 | Ready with the variable unset. Not ready with `UVCP_FORCE_INIT_FAILURE=1` | `evidence/launch/README.md` | Pending |
| M0-AC-003 | `pnpm verify` | Local exit 0 and Actions run 37235385386 | The documented checks ran | Functional quality review | Pending |
| M0-AC-004 | Deliberate failing test, then removal | Pull request 23, pull request 28, and the discovery-gate runs 37361409189 and 37361578198 | Both required jobs failed with the probe message and exit 1. The probe was removed. The current command discovers the probe file | `evidence/failure-clarity.md` and `evidence/m0-quality-trace.md` | Pending |
| M0-AC-005 | `pnpm test` | Same command in CI without a display server | Passed without xvfb | `evidence/reproducibility.md` | Pending |
| M0-AC-006 | Core imported by headless tests, not by the shell UI path | Editor test and boundary tests | Core tests do not import UI | Functional quality review | Pending |
| M0-AC-007 | The verify workflow | Red runs 37192000472 and 37359364804, green run 37235385386 | CI reports failure when verify fails | Functional quality review | Pending |
| M0-AC-008 | `docs/engineering/developer-setup.md` | A reviewer can follow install, launch, build, test, and verify | The guide names those commands and the Edge or Chrome launch | Functional quality review | Pending |
| M0-AC-009 | `docs/engineering/architecture.md` and ADR-0001 through ADR-0008 | `evidence/architecture-consistency.md` | The binding text matches the implementation | Tech Lead | Pending |
| M0-AC-010 | Executed test plan and this matrix | Evidence files in this directory | No blocking coverage gap remains | `evidence/quality-review.md` | Pending |
| M0-AC-011 | ADR-0007 as implemented | `evidence/security-review.md` | No unresolved blocking security finding | Application Security Engineer | Pending |
| M0-AC-012 | Running foundation screen | `evidence/launch/` and `evidence/design-review.md` | DV-01 through DV-20 pass. No blocking design finding | Senior Product Designer / UX Architect | Pending |

# Module 0 — Non-Functional Quality Review

**Role:** Non-Functional Quality Engineer  
**Status:** Architecture-preparation record. Not an executed test report. Not module approval.  
**Date:** 2026-10-02  
**Module:** Module 0 — Engineering Foundation (PLANNED)

Module 0 non-functional verification is reproducibility, failure visibility, headless execution, and diagnostic reliability. It is not a product performance program.

No benchmark was run. No duration in this record was measured. Nothing here is evidence that a build, test, or machine met a time.

Where this review and `docs/engineering/architecture.md` disagree, the architecture document wins. **Binding for Module 0 only** means required to verify this module. **Deferred** means not a Module 0 verification gate. Neither label is Product Owner approval.

Traceability: M0-NFR-001, M0-NFR-004, M0-NFR-007, M0-NFR-010, M0-FR-006, M0-AC-001, M0-AC-002, and TP-M0-NF-001 through TP-M0-NF-004.

## Binding for Module 0 only

### Primary development environment

Proposed, pending Product Owner confirmation: 64-bit Windows x64 for documented setup, local build, `pnpm dev`, and local verification evidence.

Product targets stay Web, Windows, macOS, and Linux. This recommendation does not drop those targets and does not implement them in Module 0 (M0-NFR-007).

Linux CI is a headless coupling check. It runs without a window and is not Linux desktop support. The architecture proposal's required runners are `windows-2025` and `ubuntu-24.04`, with those labels pinned. macOS CI is not a Module 0 check.

Record the Windows edition and build that the evidence run actually used. Do not invent a minimum build. A clean setup is a documented checkout and a fresh CI runner, not an operating-system reinstall. An undocumented intervention fails M0-NFR-001 until a rerun needs none. Reproduced verification means the pinned toolchain, the lockfile, and the documented commands succeed. It does not mean bit-identical binaries.

### Manual launch browser

Module 0 launch evidence uses current Microsoft Edge or current Google Chrome. One of them is enough. The evidence records which one was used. Firefox, Safari, and other browsers are not Module 0 launch evidence. This is not a browser-support matrix.

The graphical check is the documented `pnpm dev` launch on that Windows environment (M0-AC-002). CI does not open a window and must not use a display server to claim that it did.

### Pipeline observations and hang guardrails

TP-M0-NF-002 and TP-M0-NF-003 record pipeline timings as observations (`kind: observation`). They are not pass/fail thresholds. Module 0 has no justified numeric product performance target. Do not add a benchmark suite to create one.

The implementation records one cold local Windows run and one cold Windows CI run at `docs/modules/module-00-foundation/evidence/m0-pipeline-baseline.json`, from real runs, not estimates. Record cache hit, miss, or not-applicable. A cache hit is not clean-setup evidence. A missing record fails the evidence step. The duration values do not. Do not treat the local number and the CI number as one series.

Hang guardrails, not performance targets:

- CI verification job timeout: 30 minutes. A breach means the job did not finish.
- Headless diagnostic spawn timeout: 60 seconds. A silent hang is a failed diagnostic test, not a slow product.

If the first cold run on the approved stack exceeds a guardrail, raise that guardrail in the same change that records the baseline and name the step that required it. Do not remove the timeout to obtain a green run.

### Startup failure

M0-FR-006 needs a named diagnostic. A window is not sufficient.

`pnpm dev` reads `UVCP_FORCE_INIT_FAILURE`:

- Unset or `0`: normal startup.
- `1`: after the diagnostic sink exists and before ready, fail step `forced-initialization-failure`. Do not report success.
- Any other value: fail startup as an invalid value, not as success.

Tests use an injected throwing initializer at the composition root. They do not read the variable. The headless composition script uses that injection, writes `startup.failed` to stderr, and exits non-zero. The success path exits zero. Neither opens a window. The production bundle does not read the variable. On the dev path the shell shows the failure; that screen is not the automated proof.

Diagnostics omit environment dumps, secrets, tokens, file contents, and the raw value of `UVCP_FORCE_INIT_FAILURE`.

### Failure visibility

M0-NFR-004 and TP-M0-NF-004: each required check fails with a non-zero exit, the check's name, a location or test name when the tool provides one, and the tool's own diagnostic. `pnpm verify` fails if a constituent fails. It does not use `continue-on-error` or an equivalent. A dialog or an editor marker is not the diagnostic of record.

The deliberate failure for M0-AC-004 is temporary. Capture the log, then remove the fault. Do not leave a standing red test.

## Deferred

Reference hardware and product performance workloads are deferred. They do not block Module 0. They block the Definition of Ready of the first module that makes a product performance claim. Before that module, define the hardware class, OS and version, workload fixture, measurement method, and any threshold together. Module 0 pipeline observations are not frame-time, load-time, or memory results.

Also deferred, and not Module 0 exit criteria:

- The product browser-support matrix.
- macOS runners, signing, and notarization.
- Linux desktop packaging and any distro list.
- Windows on ARM as an evidence target.
- GPU API, vendor, and driver matrices.
- Installers and packaged distribution.
- A multi-run statistical performance campaign, a cache-hit target, or a rule that a run slower than the baseline fails CI.

## Disagreement

This review originally recommended that the automated startup test set `UVCP_FORCE_INIT_FAILURE` and assert a non-zero process exit. Functional quality required an injected failure so the switch is not a backdoor in the shipped shell. Disposition in the architecture and ADR-0008: tests and the headless script inject the failure; `pnpm dev` alone honors the variable; the production build does not read it. A dialog-only or crash-only failure is still not the proof.

## Risks

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| Windows-primary is read as dropping Web, macOS, or Linux | The product targets are all four. | Limit the confirmation to the Module 0 development and CI path. |
| The baseline file is treated as a threshold | Unrelated machines fail for noise. | `kind: observation`. No threshold field. The number does not fail CI. |
| A hang guardrail is read as a speed target, or deleted when a cold run is slow | That invents a performance claim or hides a hang. | Raise it only with the measured baseline and a named step. |
| The Linux job is described as Linux desktop support | That is a false compatibility claim. | Call it a headless coupling check in the workflow and the setup docs. |
| The failure variable ships in production or is left on | Users can force a failure, or the green path stays red. | Default off. Tests inject the failure. Production does not read it. Invalid values fail closed. |
| Startup evidence is only a screenshot or a watched window | CI cannot regress M0-FR-006. | Assert the headless script's event and exit code. Record which browser was used for the manual launch. |
| Runner tags float, or install is not locked | A clean path stops being reproducible. | Pin `windows-2025` and `ubuntu-24.04`. Frozen lockfile install. Record the resolved image on the evidence run. |
| A GPU device or an unpinned system webview is added to the clean path | Driver or runtime identity becomes an unpublished prerequisite. | Module 0 acceptance does not require a GPU. The launch browser is Edge or Chrome, recorded in evidence. |

## Confirmation still open

Product Owner confirmation of the primary development environment is still required before READY FOR DEVELOPMENT. The recommendation is 64-bit Windows x64 for local evidence, required CI on `windows-2025` and `ubuntu-24.04`, current Microsoft Edge or current Google Chrome as the recorded manual launch browser, and unchanged product targets. This review does not grant that confirmation.

Reference hardware is not part of that confirmation.
# Module 0 — Non-Functional Quality Review

**Role:** Non-Functional Quality Engineer  
**Status:** Architecture-preparation recommendation. Not an executed test report.  
**Date:** 2026-10-02  
**Module:** Module 0 — Engineering Foundation (status PLANNED)

This review defines how Module 0 should be made reproducible, how pipeline baselines should be recorded, and what must not be turned into a performance target. It does not select the language, UI framework, renderer, desktop shell, or CI vendor. It does not implement benchmarks, harnesses, or product code.

No setup was executed for this review. No duration in this document was measured. Nothing here is a claim that a build, test, or machine met a time.

## Role and status

Module 0 non-functional verification is reproducibility, failure visibility, headless execution, and diagnostic reliability. It is not a product performance program.

The test plan already states the rule this review follows: verification runtime and build/CI timings are baselines, not pass/fail performance targets, unless a later architecture proposal defines a justified threshold. No such threshold is justified today. The archive states the same constraint: concrete numeric thresholds require a defined reference environment and workload. Operational documents win where they differ from the archive. The operational Module 0 specification and test plan are the requirements; archive sections 10, 11, and 17 are context only.

Definition of Ready asks for reference workloads only where applicable. They are not applicable to Module 0 acceptance. They become applicable at the first module that has a product performance claim.

| ID | Preparation conclusion |
|---|---|
| M0-NFR-001 | Name one primary documented development environment, pin toolchain and lockfile, and prove a clean setup on that environment and on a fresh CI runner. |
| M0-NFR-004 | Define "actionable" as a checkable property of build, test, typecheck, and lint output. Non-zero, named, located, and not GUI-only. |
| M0-NFR-010 | Reproduce verification by documenting the environment and commands. Record pipeline observations. Do not add a benchmark suite in Module 0. |
| M0-FR-006 | Startup and initialization failure must be visible from stderr and/or a log file. A window is not sufficient. Provide a default-off forced-failure hook. |
| TP-M0-NF-001 | Evidence is environment, toolchain versions, commands, result, and any undocumented intervention. |
| TP-M0-NF-002 | Record one labeled verification-runtime observation. Do not gate on it. |
| TP-M0-NF-003 | Record build and CI step timings and cache hit/miss. Store a committed summary plus raw CI artifacts. |
| TP-M0-NF-004 | Review one representative failure of each required check, then remove the faults. |
| Archive §17 hardware/workload item | Does not block Module 0. Defer to the first performance-sensitive product module. |

## Documents read

Operational, authoritative for this module:

- `AGENTS.md`
- `docs/product-overview.md`
- `docs/engineering/development-process.md` (in particular §5.9, §8, and §14; surrounding gate and evidence sections were read for consistency)
- `docs/engineering/architecture.md` (intentionally incomplete; no stack is approved)
- `docs/modules/module-00-foundation/specification.md`
- `docs/modules/module-00-foundation/test-plan.md` (in particular §5 and §10–§11; the full plan was read)

Context only:

- `docs/archive/product-engineering-specification-v1.0.md` §10, §11, and §17

Conflict note: archive §9.1 is an older, smaller Module 0 list. The operational specification adds requirements through M0-NFR-010, including reproducible verification, and the test plan adds TP-M0-NF-001 through TP-M0-NF-004. Those operational IDs are the ones used here. Archive §10's refusal of unsupported numeric targets agrees with the test plan and is followed. Archive §17 leaves the primary development OS, the initial CI matrix, the initial browser target, and reference hardware/workloads unnamed. The operational spec still says "the primary development environment" without naming it, so those items stay open rather than being invented.

## Recommendations with alternatives and trade-offs

### 1. Reproducible setup and reproducible verification

M0-NFR-001, M0-NFR-010, M0-AC-001, M0-AC-008, and TP-M0-NF-001 require a stranger to follow documented steps on a **named** environment and reach a successful build and verification run with no undocumented manual changes. An unnamed "primary development environment" makes that criterion untestable.

#### Engineering default

Document **64-bit Windows** as the primary development environment for Module 0.

Reasons:

- The current human workspace is Windows. Clean-setup evidence has to be producible where the team actually works.
- M0-FR-001 and TP-M0-F-001 require one primary environment, not four.
- M0-NFR-007 forbids coupling the core model to one OS. It does not require Module 0 to implement Web, macOS, and Linux.

This default does **not** change the product targets in `docs/product-overview.md`: Web, Windows, macOS, and Linux. It does not mean Windows is the only desktop the product will support. It means Module 0 setup, local build, shell launch, and the official local baseline are documented and proven on 64-bit Windows.

Do not write a guessed edition or build into the architecture. Windows 10 versus Windows 11, the specific build, and any minimum required by a vendor runtime are facts to copy from the machine and from the CI image used for evidence (`winver`, the runner image's resolved version, and the chosen runtime's own minimum once a runtime exists). Until a stack is chosen, "64-bit Windows" is the assumption and the concrete version is a recorded field, not a made-up minimum.

#### Product Owner confirmation

Treat the **name** of the primary supported development OS, and the initial CI matrix, as a Product Owner confirmation before READY FOR DEVELOPMENT.

It is an engineering default because the workspace is already Windows and Module 0 needs one documented path. It is still a support decision because:

- the operational specification uses "primary" without naming an OS;
- archive §17 lists "Primary supported development OS and initial CI matrix" as open before Module 0;
- declaring Windows primary will be misread as dropping macOS, Linux, or Web unless the confirmation says otherwise.

Architecture preparation can proceed on the Windows default. Module 0 should not be declared READY FOR DEVELOPMENT on this point until the Product Owner confirms it or replaces it. Replacing it changes the clean-setup procedure, the CI image, and M0-AC-001 evidence.

#### What developer docs and the architecture must pin

Pin these before implementation is called reproducible. The version file checked into the repo is the source of truth for toolchain versions. Setup docs and CI install from that file. Do not keep three hand-edited copies that can drift.

| Pin | Rule | Not sufficient |
|---|---|---|
| OS assumption | Primary path: 64-bit Windows. Record the edition and build actually used. State that docs do not depend on a translated locale. Tests match exit codes and project diagnostics, not localized compiler prose, unless the command explicitly sets the tool language. | "A modern OS", "the developer's machine", an unmeasured "Windows 11" claim. |
| CPU architecture | x64 for Module 0 evidence. | An implied ARM64 Windows or macOS Apple Silicon claim. |
| Toolchain | Exact versions of every language runtime, package manager, and native SDK the setup needs, selected by a committed version file (for example `.nvmrc`, `rust-toolchain.toml`, or the stack's equivalent). | "Install Node", "latest", a version only in a prose paragraph. |
| Package manager | One documented manager. Its lockfile is committed. Install uses the immutable/frozen mode (`npm ci`, `pnpm install --frozen-lockfile`, or the equivalent). A lockfile that would change fails verification where the tool can check that. | `npm install` with no lockfile, a global install as an unpublished step, floating ranges resolved differently on each machine. |
| CI image | The workflow requests a specific image label, not a floating `latest`. Each evidence run records the **resolved** image version, because hosted labels move. | `windows-latest` or `ubuntu-latest` with no resolved version in the evidence record. |
| Commands | The same documented commands for install, build, test, typecheck (if applicable), lint (if applicable), shell launch, and the single verification workflow. | A CI script that is not the documented local workflow and is not explained as a thin wrapper around it. |
| Network | A clean setup may download dependencies pinned by the lockfile. After install, verification must not need network access. | A test or build step that fetches unpinned tools. |
| Clean | A new clone with no pre-existing project dependency directory, plus a fresh CI runner. Documented toolchain prerequisites may already be installed. | A full OS reinstall as the normal case, or a developer machine whose unpublished global state is required. |
| Intervention | TP-M0-NF-001 evidence records "none" or describes the intervention. Any intervention fails M0-NFR-001 until the docs or the setup change so a rerun needs no intervention. | A successful local build that required an unwritten PATH, SDK, or certificate step. |

"Reproduced" in M0-NFR-010 means a documented environment, the pinned toolchain, the locked dependencies, and the documented commands produce a successful verification and a comparable observation. It does not mean bit-identical binaries. Bit-reproducible builds are a stronger property Module 0 does not need. A Windows shell that uses a system webview usually cannot provide it.

#### What CI must cover in Module 0

Required:

1. A verification job on the primary 64-bit Windows image: frozen install, build, applicable typecheck, applicable lint, headless core tests, and the documented aggregate verification. Any required failure fails that job (M0-FR-005, M0-AC-007).
2. At least one **cold** run on a fresh runner, with caches disabled or empty, as TP-M0-NF-001 / M0-AC-001 evidence. Cached PR runs are allowed afterward, but a cache hit is not evidence that a clean setup works.
3. Capture of step timings and cache hit/miss as observations (see baselines below). Missing timing evidence fails the evidence checklist. The duration values themselves do not fail the job.

Recommended coupling check, not a support claim:

4. A Linux job that runs the platform-neutral core tests, typecheck, and lint without launching a Windows shell or opening a window. Its role is to catch an accidental core dependency on Windows UI or filesystem APIs (M0-NFR-002, M0-NFR-003, M0-NFR-007). Developer docs must say this job is a coupling check. It must not be described as Linux desktop support.

Explicitly deferred, and not Module 0 exit criteria:

5. macOS runners, signing, and notarization.
6. A browser matrix, mobile browsers, and WebGPU/WebGL device tiers.
7. GPU runners and native graphics drivers.
8. Installers and packaged distribution.
9. A standing deliberately-failing test. M0-AC-004 is a temporary change, evidence is collected, and the fault is removed.

If the Tech Lead selects a shell that cannot be built on Linux, the Linux job runs only the core and other headless packages. It must not be bent into launching a Windows UI under Wine in order to look cross-platform.

#### Alternatives and trade-offs

| Alternative | Trade-off | Why it is not the default |
|---|---|---|
| Linux container as the only supported development environment | Strong isolation and easier image pinning. Poor fit to the current Windows workspace. A Windows-only shell technology would make the documented path something the human workspace cannot run without a second machine. | Use Linux as the coupling check, not as a silent replacement of the primary path. |
| Devcontainer or Nix as the only supported environment | Best reproducibility. High setup cost before any product behavior exists. A container that cannot host the chosen Windows UI session fails the shell-launch criterion or creates an undocumented workaround. | Do not require it for Module 0. A container is appropriate for the Linux coupling job if DevOps wants one. |
| Document all four product platforms as supported developer environments now | Matches the long-term vision on paper. Module 0 then cannot exit until macOS, Linux, and Web setup are all proven. That implements platform coverage the specification defers. | Violates M0-NFR-007's explicit statement that not all target platforms are implemented in Module 0. |
| Leave the primary OS unnamed until after implementation | Avoids a Product Owner decision. Makes M0-AC-001 and TP-M0-F-001 untestable and guarantees "works on my machine" evidence. | Blocks a named clean setup. Confirm the default instead. |

### 2. Failure clarity

M0-NFR-004 and TP-M0-NF-004 require build, test, typecheck, lint, or the equivalent required checks to fail visibly. Archive wording adds "non-zero." Operational wording is the requirement: do not succeed silently. Non-zero exit of the documented command and of the matching CI step is how silence is detected. M0-AC-004, M0-AC-007, and test-plan §11 already make a swallowed failure blocking.

#### What "actionable" means

A failure is actionable when someone who did not introduce it can answer all of the following from the command output or the CI log, without attaching a debugger and without looking at a GUI dialog:

1. **Which check failed:** build, test, typecheck, or lint, by the name used in the documented workflow.
2. **That it failed:** the documented command exits non-zero, and the CI step for that check is a failed step. Required checks do not set `continue-on-error`, `|| true`, or an equivalent success override.
3. **Where:** a test name, or a file path plus line/column when the tool provides them, or the package/target for a build error.
4. **What the tool said:** the underlying diagnostic is preserved. A wrapper may add the check name and the command. It must not replace the diagnostic with only "verification failed."
5. **How to run that check again:** the log shows the documented command or a named step that maps one-to-one to it.
6. **That the aggregate failed:** if any required constituent fails, the single verification workflow exits non-zero. One green package must not hide a red package. A success banner must not be printed after the failure.

Warnings are actionable only if the project has classified them as required. Required lint rules and required type diagnostics are errors and fail the process. A style warning that is allowed to pass is not a required check and must not be described as one. That classification belongs in the architecture when the linter is chosen. This review does not invent a rule set.

If the approved stack has no separate typecheck or no lint, the architecture says so and names the equivalent static check, or states that the check is not applicable. TP-M0-NF-004 then skips the absent check. Do not add a typechecker only to satisfy the word "typecheck."

#### Per check

| Check | Actionable result | Silent or non-actionable result |
|---|---|---|
| Build | Non-zero exit. Package or target name. File and line when the tool has them. The compiler or bundler message, not a later cascade alone. | Exit 0 after a failed subprocess. "Build failed" with the tool log discarded. An interactive prompt that hangs CI. |
| Test | Non-zero exit if any required test fails. Test name, file, assertion message (expected versus actual when the framework provides it), and a location or stack. A summary count. | A timeout that does not name the test. A runner crash with no test identity. A green exit when a test was skipped because a display was missing. |
| Typecheck | Non-zero exit. Diagnostic code when the tool emits one, file, line/column, message. A distinct step name so a type error is not reported as a test failure. | Errors that appear only in an editor. A successful emit or build that never ran the checker. A blanket skip of project diagnostics with no documented exception. |
| Lint | Non-zero exit for each required rule. Rule id, file, line/column, message. CI checks the tree; it does not rewrite it and exit 0. | "Lint failed" without a rule id. An auto-fix that changes files in CI and still passes. |

Headless and local runs use the same text stream. A modal dialog, toast, or IDE squiggle is not the diagnostic of record.

#### How TP-M0-NF-004 is reviewed

In a throwaway change that is not merged, introduce one fault at a time:

1. a build break (invalid source or an unresolved reference in the shell);
2. one failing assertion (this is also the M0-AC-004 / TP-M0-F-003 case; keep the local and CI output);
3. one type error, if typecheck is a required check;
4. one required lint violation, if lint is a required check.

For each, record the command, the exit code, whether the check name is obvious, whether a location and the tool message are present, and whether CI presents the same facts. Restore the tree after evidence is captured. Do not leave a permanent failing fixture, and do not invent a product defect to make the exercise more realistic.

The Quality Engineer review is a checklist against the six actionable properties, not a score and not a timing measurement.

#### Alternative

Rely on "developers will notice in the IDE." That fails CI, fails a clean clone, and fails M0-NFR-004. Reject it.

A single generic wrapper exit with the child logs deleted is also a failure of this requirement even when the exit code is non-zero, because the failure is not actionable.

### 3. Startup diagnostics reliability

M0-FR-006 and TP-M0-F-004 require normal startup and a controlled initialization failure to be diagnosable. Silent termination fails the scenario. Product reliability for Module 0 is this narrow contract: the process either reports startup complete or reports a named initialization failure and a non-zero exit. There is no project file to recover. Do not design scene recovery, autosave, or crash rollback in Module 0.

#### What a normal startup must log

Write these to stderr, to a documented log file, or to both:

- a timestamp with an offset, or UTC, using one documented convention;
- a stable event name, recommended `startup.ready`;
- a short statement that initialization finished;
- the coarse subsystem that became ready, at shell granularity (process started and the shell reached its ready state). Do not dump framework traces;
- a build or version identity only if the build already injects one. Module 0 does not need a release-versioning scheme.

The ready event is the success marker. Its absence is meaningful. Do not infer success from "a window was seen."

#### What an initialization failure must log

- a stable event name, recommended `startup.failed`;
- the initialization step name;
- severity `error`;
- the error message, plus a short stack or tool error when one exists;
- non-zero process exit.

The failed event has to be emitted, not merely implied by a missing ready event. Exit code and log are both required. The exit code is the machine-readable result. The log is the human-readable result.

#### Where it must be written

The diagnostic of record is **stderr, a documented log file, or both**. A window, crash dialog, or toast may also be shown. It is not sufficient, and it is not what TP-M0-F-004 asserts.

If the logger cannot be created, write the failure to stderr and exit non-zero. Do not continue into a GUI-only error, and do not report startup success because logging failed.

Windows GUI-subsystem binaries often have no usable stderr. For Module 0, the development binary should be a console-subsystem process, or it must always write the documented log file even when no console is attached. The test reads that stream or file. A shell that can fail only as a graphical dialog fails M0-FR-006 on CI.

#### What must never be logged

Module 0 diagnostics are developer diagnostics for a shell that has no accounts and no project model. Still apply the project logging rules now so the foundation does not teach the wrong default:

- secrets, tokens, passwords, API keys, cookies, signing material, and connection strings;
- authorization headers and CI credentials;
- a dump of the environment, or any `printenv` / `process.env` equivalent;
- contents of files the process can read;
- full command lines when they may carry the values above.

The forced-failure flag value `1` is not a secret. Do not log the environment "for reproducibility." OS name and toolchain version belong in the baseline record, collected by the setup/CI evidence procedure, not in an application environment dump.

Startup logging in Module 0 performs no network call and sends no telemetry. Privacy-sensitive transfer is out of scope and must not be added in order to "have observability."

#### Controlled initialization-failure path

Ship a **development verification hook**, default off, not a user feature and not something a file can turn on:

| Input | Behavior |
|---|---|
| `UVCP_FORCE_INIT_FAILURE` unset or `0` | Normal startup. Ready event. Exit 0 once the shell is up. |
| `UVCP_FORCE_INIT_FAILURE=1` | After the diagnostic sink is available and before `startup.ready`, fail a named step (recommended step id `forced-initialization-failure`). Write `startup.failed`. Exit non-zero. Do not open a requirement that a human dismiss a dialog. |
| Any other value | Fail startup with an actionable message that the value is invalid. A typo must not fall through to success. |

The Tech Lead may rename the variable. The behavior above is the requirement: default off, deterministic, headless-observable, and impossible to mistake for a successful start.

Prove it with an automated test that spawns the process, sets the variable, and asserts a non-zero exit plus the stable failed event in stderr or the log file. Prove the inverse with the variable unset: ready event and exit 0. Neither assertion uses a screenshot or OCR.

Give that spawn a harness timeout so a hung process is a failed test that names the diagnostic check, not an unbounded wait. Start the harness timeout at 60 seconds. If the first successful cold start on the pinned CI image routinely exceeds it, raise the harness timeout in the same change that records the baseline and say why. The timeout detects a hang. It is not a startup-performance acceptance target.

The hook stays off in the ordinary CI green path. The negative test sets it itself.

#### Alternatives and trade-offs

| Alternative | Trade-off | Why it is not the default |
|---|---|---|
| GUI dialog only | Fine for a person at the machine. Invisible to CI and to a redirected log. | Fails TP-M0-F-004 as specified ("without silent termination") and fails headless evidence. |
| Crash the process (abort, access violation) as the "failure path" | Proves the OS can kill a process. Produces no step name and often no project diagnostic. | Not a controlled initialization failure. |
| Permanent broken configuration in the tree | Easy to notice. Makes the green path red and will be "fixed" by weakening the test. | Same discipline as M0-AC-004: force the fault only inside the test. |
| Require an interactive desktop session for the only startup proof | Matches a pure GUI shell. Makes CI evidence depend on a logged-on session and a human. | Accept only if stderr or a log file is still asserted. Session video is not the proof. |

## Baselines and guardrails

TP-M0-NF-002 and TP-M0-NF-003 require the initial verification runtime, build time, CI time, and relevant cache behavior to be **recorded** so later modules have comparison history (development-process §14). They are pipeline observations. They are not product performance results, and they must not be stored in a way that looks like a service-level objective.

No product workload exists in Module 0: no scene, viewport, asset, or interaction. Do not invent one so that a number has somewhere to live.

### What to record

Record wall-clock seconds from process start to process exit for the documented commands, not CPU time, unless both are free. Never average them into one number. Never drop a sample because it looks slow.

| Observation | Label | Notes |
|---|---|---|
| Dependency install | `cold` | Fresh checkout or empty cache. This is the clean-setup install. |
| Dependency install | `warm` | Optional. Only if a second run happens naturally. |
| Documented build | `cold` and, if measured, `warm` | The documented build command, not an ad-hoc variant. |
| Documented complete verification workflow | `cold` local, and the CI run attached to the evidence commit | This is the TP-M0-NF-002 number. |
| CI steps | per step | Checkout, install, build, typecheck, lint, test, timing capture, and job total, as those steps exist. |
| Cache | `hit`, `miss`, or `not-applicable` | Dependency cache and build cache separately. Record the cache key inputs that are not secret (lockfile identity, toolchain version). |

Each record also carries: git commit SHA, ISO-8601 timestamp, command argv, exit code, OS family, OS version, architecture, and either `local-primary` or `ci`. CI records add the image label written in the workflow and the resolved image version. CPU model and memory may be recorded as description. They are not a hardware qualification.

The official Module 0 pair is:

- one cold local run on the primary documented Windows environment, on external power, using the documented toolchain;
- one CI run of the required Windows verification job, with the cold evidence run identified as cold.

Do not compare the local number with the CI number and call the difference a regression. Different machine classes are different series.

### How many samples

One recorded cold local run and one recorded CI evidence run. Module 0 does not need a multi-run statistical campaign. Extra runs may be stored beside the official sample. They must not be collapsed into a mean that is then treated as the baseline.

### Where to store them

Use both places, for different jobs:

| Store | Role | Rejected use |
|---|---|---|
| Committed observation file | Durable comparison history that survives artifact expiry and is reviewable beside the module. | A pass/fail gate. An update on every PR (the diff becomes noise and is not a decision). |
| CI artifacts | Full logs and the machine-readable timing dump for that run. | The only copy. Retention will delete the history §14 needs. |

Recommended committed path, created when evidence exists, not during this preparation review:

`docs/modules/module-00-foundation/evidence/m0-pipeline-baseline.json`

One JSON object per observation, or a list of them. Suggested fields:

```text
schema: uvcp.pipeline-baseline/v1
kind: observation
module: M0
commit
recorded_at
label: cold | warm
runner.role: local-primary | ci
runner.os_family
runner.os_version
runner.arch
runner.image_request          (CI only)
runner.image_resolved          (CI only)
runner.cpu                     (optional description)
runner.memory_gib              (optional description)
toolchain[]: name, version
lockfiles[]: path
commands[]: name, argv, exit_code, wall_clock_seconds, cache, log_artifact
undocumented_intervention: none | description
```

`kind` stays `observation`. Do not add a threshold field "for later" and leave it zero. A later module that justifies a threshold can add a different schema with environment, workload, method, and threshold stated together (development-process §5.9). Updating the committed file is an intentional act at module acceptance or when the Product Owner or Tech Lead accepts a new comparison point because the toolchain, image, or pipeline changed. Ordinary PRs upload artifacts only.

Raw logs are not committed.

The timing step is required for Module 0 evidence. If it cannot write its summary, that step fails with an actionable error. The failure condition is "no record," not "too slow" or "too fast."

### Engineering guardrail against an unbounded pipeline

This is the only numeric ceiling recommended for Module 0. It is not a performance budget and not an acceptance target for how fast the product feels.

| Guardrail | Initial value | What a breach means |
|---|---|---|
| Hard timeout on the Module 0 CI verification job | 30 minutes | The pipeline did not finish. Typical causes: a hung download, a test waiting on a window, a retry loop, or a missing timeout. It does not mean the product is slow, and a finish in 29 minutes is not a quality claim. |
| Default per-test timeout | 60 seconds | A Module 0 test is a headless check with no network and no GUI. Exceeding this should name the test. A longer timeout requires a reason on that test. |
| Diagnostic shell-spawn timeout | 60 seconds, same revise-on-evidence rule | A silent hang is a failed diagnostic test. |

Justification for having a ceiling at all: without one, a hosted runner's platform default (often several hours) hides an unbounded Module 0 job and then kills it with a generic platform message. That fails M0-NFR-004 in practice. Module 0's required work is install, build, static checks, and headless tests of a minimal shell, so a finite ceiling belongs on the job now, before the first pipeline exists.

Justification for 30 minutes rather than a tight budget: the stack is not chosen. A cold Windows runner installing one mainstream toolchain and building a minimal shell should finish under this ceiling. A dual native toolchain or an uncached heavy browser download might not. **Do not lower the ceiling in advance to manufacture a performance goal. If the first measured cold run on the approved stack exceeds 30 minutes, raise the ceiling in the same change that records the baseline, and document the step that required it.** Do not remove the timeout to make the red run green.

Justification for not setting a pass/fail duration: there is no reference hardware, no workload, and no measured distribution. A threshold invented now would be an arbitrary product target, which the archive and TP-M0-NF-002 both forbid. Laptop-versus-CI comparisons would flake for thermal and scheduling reasons that are not product regressions.

#### Rejected alternatives

| Alternative | Why it is rejected for Module 0 |
|---|---|
| "Verification must finish in N seconds" on developer laptops | No defined hardware or workload. Would become a false gate. |
| Cache-hit-rate target | Cache is an optimization. The cold path is the reproducibility evidence. |
| Fail CI when a run is slower than 2× the committed baseline | A multiplier is still an unmeasured threshold. Review large jumps manually; do not encode them as failures until a pinned image has a real history and a later module justifies a gate. |
| No timeout, trust the platform default | Leaves the unbounded-pipeline hole this guardrail exists to close. |
| 10-minute job ceiling before any measurement | Likely false failures on cold Windows runners. Tightens a number that has not been observed. |

Later comparison method, still not a gate: a future module compares a new observation only with the last accepted observation that has the same `runner.role`, the same cache label, and a compatible image. A large unexplained jump is a review item for the Non-Functional Quality Engineer. It becomes a failing threshold only when environment, workload, method, and threshold are all written down and the threshold is justified. Pipeline timings from Module 0 are never reused as frame-time, load-time, or memory targets.

## Compatibility and workload deferrals

Archive §10 says supported OS, browser, and GPU matrices are versioned and tested progressively as packaging matures. Module 0 does not implement all platforms (M0-NFR-007). The correct Module 0 artifact is a **claims list**, not a compatibility matrix that implies tested support.

Put the claims list in `docs/engineering/architecture.md` and copy the same claims into the developer setup document. Defer a standalone versioned matrix until a second platform is actually implemented and tested. Creating that matrix now would be read as a support commitment.

### Document now

| Surface | Claim that may be written in Module 0 | Wording constraint |
|---|---|---|
| Development OS | 64-bit Windows is the primary documented development environment, subject to Product Owner confirmation. The evidence record carries the real edition and build. | Not "Windows is the only product platform." |
| Core portability | Core tests run without a GUI and without a desktop shell. The Linux CI job, if adopted, is evidence about dependency direction only. | Not "Linux is a supported desktop." |
| Browser | Only if the approved shell is a web UI: name the **one** browser used to smoke-launch the shell, and record that browser's version in the evidence. Call it a development smoke browser. | Not a supported-browser matrix. Not "last two versions" unless the Product Owner adopts that sentence. |
| Desktop runtimes | If the shell needs a system runtime (webview, VC++ redistributable, or similar), document the install step and the version observed. A missing runtime is an actionable startup or setup failure. | Not an evergreen "whatever the OS has" assumption left unwritten. |
| GPU | **No GPU claim.** The rendering boundary may exist as an empty or probe boundary. GPU presence is not a clean-setup requirement. | Not an NVIDIA/AMD/Intel/Apple matrix. |
| macOS and Linux desktops | Named as product targets that Module 0 does not implement. | Not "deferred forever," and not "tested." |

### Defer

| Item | Defer until | Why it is not a Module 0 block |
|---|---|---|
| Browser support matrix, including Safari, Firefox, Chrome, and Edge ranges | The module that makes Web a shipped shell, and only after the Product Owner sets the initial browser target (archive §17). | One smoke browser is enough to prove a web shell starts. A matrix is a support policy. |
| macOS packaging, signing, notarization, and Apple silicon versus Intel | The module that ships a macOS desktop shell. Recheck Apple guidance then (development-process §16). | Module 0 does not distribute. |
| Linux desktop packaging and distro list | The module that ships a Linux desktop shell. | The coupling-check job does not need a distro matrix. |
| Windows on ARM | A decision that the product supports it. | Current evidence target is x64. |
| Minimum OS versions beyond what the chosen vendor runtime already requires | Stack selection. Copy the vendor minimum; do not invent a tighter one. | A made-up minimum becomes an untested promise. |
| GPU API matrix: WebGPU, WebGL, Metal, Direct3D, Vulkan; vendor; driver; software renderer; headless GL | The first module that executes real rendering. | Module 0 rendering is a boundary, not a renderer. |
| Reference hardware and product workloads | The first performance-sensitive product module. See below. | No Module 0 NFR is a speed or memory claim. |

### Reference hardware and workloads

Archive §17 lists "Reference hardware/workloads for the first performance-sensitive module" as an open decision before Module 0. That scheduling note must not be read as "Module 0 cannot start until a benchmark PC and a scene are defined."

**This decision does not block Module 0.** Module 0 has no scene, no viewport workload, and no numeric product threshold. Archive §11 introduces performance and reference-workload tests with the module that needs them. TP-M0-NF-002 and TP-M0-NF-003 are pipeline baselines on the documented development and CI environments.

**It does block the Definition of Ready of the first module that makes a product performance claim** (interactive rendering, large-scene editing, import, or export timing — whichever module first needs that claim). Before that module is READY FOR DEVELOPMENT, the Product Owner, Tech Lead, and Non-Functional Quality Engineer define:

- the hardware class (not a fantasy minimum and not an unnamed "developer laptop");
- the OS and version;
- the workload (scene or operation), stored as a fixture;
- the measurement method;
- any threshold, justified against that environment and workload.

Recommend leaving the hardware class undecided through all of Module 0. Record the deferral as a known limitation in the Module 0 evidence package so the pipeline baseline is not quoted later as product performance.

#### Alternative

Choose a reference PC now. That looks decisive and satisfies the archive heading literally. It also freezes hardware before any workload exists, encourages Module 0 to grow a fake scene benchmark, and blocks foundation work on a product decision the current NFRs do not use. Deferral is the better reading of archive §10 and of the operational test plan together.

## Risks, assumptions, PO decisions, open questions

### Risks

| Risk | Why it matters | Mitigation |
|---|---|---|
| Windows-primary is read as cancelling macOS, Linux, or Web | Product overview targets all four. A careless sentence in setup docs becomes a scope change. | PO confirmation text must restate the product targets and limit the decision to the Module 0 development and CI path. |
| The committed baseline is treated as an SLO | Later modules will "fail" unrelated machines, or requirements will be rewritten to match an accidental timing. | `kind: observation`. No threshold field. Compare only matched runner class and cache label. QE review, not a CI assertion on the number. |
| The 30-minute ceiling is treated as a speed target, or is too low for the eventual stack | Either manufactures a performance claim or creates a false red that someone "fixes" by deleting the timeout. | State the ceiling as a hang guard. Raise it only with the first cold measurement and a written reason. |
| CI image tags float (`windows-latest`, `ubuntu-latest`) | Baselines and "it passed last week" stop being reproducible with no dependency change. | Pin the requested label and record the resolved image on every evidence run. |
| System webview is unpinned | WebView2, WKWebView, or WebKitGTK updates outside the lockfile. Clean setup flakes or the UI differs with no commit. | Prefer not to depend on a system webview in Module 0 unless the desktop strategy needs it. If it is required: document the install, record the observed version, fail startup actionably when it is missing, and do not claim bit-identical UI. Do not make "latest evergreen runtime" an unpublished precondition. |
| Native GPU initialized by the Module 0 shell | Driver versions become part of "works on my machine." Headless CI becomes conditional on a device. | Do not create a GPU device in the Module 0 shell. A rendering probe must be labeled a probe, must not be required for clean setup, and must not write product GPU timings into the pipeline baseline. |
| Rust plus Node, or any other dual toolchain, chosen for convenience | Two version managers, two lockfiles, two caches, longer cold installs, and more ways for laptops and CI to diverge. This is the most likely way a minimal Module 0 pipeline becomes unbounded. | One toolchain unless the Tech Lead justifies a second against the product overview (M0-NFR-006), including the reproducibility cost. If both are approved: pin both, commit both lockfiles, install both from the documented files in CI, and have the verification command invoke both explicitly. Revisit the 30-minute ceiling from the first cold run rather than pretending the cost is free. |
| Undocumented native prerequisites | Visual Studio Build Tools, Python, pkg-config, or a system webview installed months ago make M0-NFR-001 pass only on one machine. | Prerequisites are a documented list with versions. The fresh CI runner is the tie-breaker. Any fix applied only on the laptop is an intervention until it is in the docs or the toolchain. |
| Tests need a display, the network, or a clock | Headless core verification and reproducible verification fail intermittently. | Core tests open no window and make no network call. Assert stable event names, not full timestamps. No live external service in Module 0 tests. |
| Startup proof is a screenshot or a human watching a window | CI cannot regress FR-006, and a GUI-subsystem process can fail with an empty log. | Console subsystem or a mandatory log file. Automated spawn test. Forced-failure hook. |
| Forced-failure hook left on, or accepted from a file | The green path is red, or a future project file can deny startup. | Default off. Set only by the test process. Invalid values fail closed. Not read from project data (Module 0 has no project format in product scope). |
| Timing recorder fails open | TESTS GREEN is declared without TP-M0-NF-002/003 evidence. | The evidence run's timing step is required. Missing record fails that step. The values do not. |
| Linux coupling job is described as Linux support | False compatibility claim. | Name the job as a core coupling check in the workflow and in the claims list. |
| Deliberate failures from AC-004 or NF-004 remain on the main branch | The foundation's green path is intentionally broken, and later "fixes" weaken the checks. | Throwaway change only. Evidence captured. Tree restored. |

### Assumptions

- `docs/engineering/architecture.md` is incomplete on purpose. No language, framework, renderer, or CI vendor is approved. These recommendations are constraints on that choice, not a stack selection.
- The human workspace being Windows is a fact about where clean-setup evidence can be produced. It is not, by itself, a Product Owner approval of a support policy.
- Module 0 does not call cloud services or AI providers and does not open a project file. Reliability and recovery stop at process exit, diagnostics, and a re-runnable documented setup.
- A clean environment means a clean checkout and a fresh CI runner, not a reimaged operating system, unless an actual failure shows dependence on unpublished machine state.
- Operational Module 0 IDs override the shorter archive §9.1 list.
- Pipeline observations are not performance claims and therefore do not carry thresholds. A future performance claim must state environment, workload, method, and threshold together.
- Formatting, lint, and typecheck are required checks only if the approved architecture includes them. If they are included, the failure-clarity bar applies.
- The Non-Functional Quality Engineer designs this strategy and later reviews evidence. Developers implement the tests. DevOps provides the reproducible CI execution. This review does not implement either.

### Product Owner decisions

These need a decision before Module 0 is READY FOR DEVELOPMENT. Recommended defaults are so the decision can be a confirmation rather than an open design exercise.

1. **Primary development OS.** Confirm 64-bit Windows as the primary documented development environment for Module 0 setup, build, launch, and local verification evidence. Confirm that Web, Windows, macOS, and Linux remain the product targets and that Module 0 does not implement all of them. Rejecting the default means naming the replacement environment in the same decision, because M0-AC-001 cannot stay unnamed.

2. **Initial CI matrix.** Confirm: one required 64-bit Windows verification job (including one cold clean run); one recommended Linux headless core coupling-check job that is not a support claim; macOS, browser grids, GPU runners, signing, and installers deferred. This is the archive §17 CI-matrix item, reduced to what Module 0 can honestly run.

3. **Reference hardware and product workloads.** Confirm they are deferred and do **not** block Module 0. They block the first performance-sensitive product module instead. Confirm Module 0 has no numeric product performance acceptance threshold.

4. **Browser support target.** Does not need a matrix decision for Module 0. If, and only if, the Tech Lead proposes a web shell, confirm the single smoke browser before READY FOR DEVELOPMENT. Leave the product browser matrix open.

Technology choices (language, UI, rendering, desktop packaging, dual toolchain, system webview) are Tech Lead recommendations recorded as ADRs and reviewed by the Product Owner with the architecture. This review does not ask the Product Owner to pick those technologies. It does ask the Product Owner to see, in that review, any choice that adds an unpinned system webview, a native GPU requirement on the clean-setup path, or a second toolchain. Those choices change reproducibility and what "clean supported environment" means.

### Open questions

Not Product Owner questions unless noted above. They stay open until the architecture and CI design exist:

- Which package manager and lockfile name the stack uses. The immutability rule is already set; the filename is not.
- Which CI system is used. Image-pin syntax depends on that choice (DevOps).
- The CI artifact retention period. Unknown retention is why the summary file must be committed and the raw log must not be the only record.
- Whether the Linux coupling job can build the shell or only the headless packages. Depends on the desktop strategy.
- The vendor minimum Windows version, if the chosen runtime has one. Copy it when it is known.
- Whether the development shell is a console-subsystem process or a GUI-subsystem process that is required to write a log file. The diagnostic contract allows either; the Tech Lead has to pick one that CI can assert without a human.
- Whether formatting is a required failing check. If it is part of the documented verification workflow, it follows the failure-clarity rules. If it is a local convenience, docs must not call it required.

### Stack choices that make reproducibility harder

Kept together so the Tech Lead can weigh them while `architecture.md` is still empty:

1. **Unpinned system webviews.** The runtime is outside the lockfile and updates on the OS's schedule. Mitigate by avoiding that dependency until a desktop shell truly needs it; otherwise pin or vendor what the platform allows, record the observed version, and fail clearly when it is absent.
2. **Native GPU on the Module 0 critical path.** Driver identity becomes an unpublished prerequisite and CI stops being a clean environment. Keep GPU initialization out of Module 0 acceptance.
3. **Two language toolchains, especially Rust plus Node.** Justifiable only with an explicit product reason. The cost is two pins, two lockfiles, two caches, and a cold pipeline that can pressure the hang ceiling. Paying that cost silently is how Module 0 verification becomes non-reproducible.
4. **Floating CI image tags and unlocked package installs.** These undo the rest of the pins. They are not acceptable defaults regardless of stack.
5. **A shell whose only failure channel is a window.** That choice cannot satisfy M0-FR-006 under CI. Diagnostics have to be a process result.

None of these forbids a later desktop webview, a later GPU renderer, or a later second toolchain. They forbid making an unpinned, machine-specific, or GUI-only behavior look like a reproducible Module 0 foundation.

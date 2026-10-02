# Module 0 — Functional Quality Review

**Role:** Functional Quality Engineer  
**Status:** Architecture-preparation review, 2026-10-02  
**Disposition:** Strategy only. No production code, automated tests, or test-plan edits were made. Nothing in this review was executed against a running application. The repository has no application source, CI workflow, or ADRs yet (`docs/engineering/architecture.md` is still the unfilled outline; `docs/engineering/adr/` is empty).

This review is not TESTS GREEN, not module approval, and not a Product Owner decision. Developers still implement the tests. This document is the functional verification approach they should implement against, and the input the Tech Lead should use before asking the Product Owner to authorize READY FOR DEVELOPMENT.

Definition of Ready requires an approach for every FR, NFR, and AC, or a documented reason for deferred or manual verification. Where the draft test plan already provides that approach, this review uses it and does not change its expected result. Where it does not, the gap is named and a proposed test-plan update is given for the Tech Lead. Those proposals are not part of the test plan until the Tech Lead updates `test-plan.md`.

---

## Documents read

Authoritative for this review:

- `AGENTS.md`
- `docs/product-overview.md`
- `docs/engineering/development-process.md` (in particular §§5.8, 8, and 11–15; surrounding sections were read for gate and traceability context)
- `docs/engineering/architecture.md` (unfilled; not yet an approved architecture)
- `docs/modules/module-00-foundation/specification.md` (operational Module 0 requirements)
- `docs/modules/module-00-foundation/test-plan.md` (draft)

Context only:

- `docs/archive/product-engineering-specification-v1.0.md` §§9.1, 11, and 17

Operational specification and test plan win where the archive differs. Archive §9.1 must not be copied into the Module 0 matrix. Its IDs are not the same requirements:

| Archive §9.1 ID | What it actually says | Operational ID to use instead |
|---|---|---|
| M0-FR-003 | Single verification command for the test suite | M0-FR-004 |
| M0-FR-004 | CI build and checks | M0-FR-005 |
| M0-FR-005 | Startup and fatal-initialization diagnostics | M0-FR-006 |
| M0-NFR-002 | Core must not depend on one desktop windowing implementation | M0-NFR-002, which also forbids browser UI components, React or equivalent UI-framework components, and platform-specific filesystem APIs |
| M0-AC-002 | Verification includes at least one core unit test and one integration-level test | M0-AC-002 is application startup. The archive sentence is superseded and is not reimposed here |
| M0-AC-003 | CI runs build and test on a representative change | Closest operational IDs are M0-AC-003 and M0-AC-007, which are not the same criterion |

Operational requirements with no same-numbered archive predecessor include M0-FR-003 (six architectural boundaries), M0-FR-008, M0-FR-009, M0-NFR-006 through M0-NFR-010, and M0-AC-006 and M0-AC-008 through M0-AC-012.

Archive §11 (serialization goldens, UI interaction suites, performance workloads, independent format readers) applies to later modules that introduce that behavior. It is not Module 0 scope. Archive §17 is still relevant as an open-decision list: language, desktop strategy, primary development OS, CI matrix, browser target, and test tooling are not decided, because `architecture.md` has not been written.

Process §15's delivery matrix (implementation, result, PO status) is future evidence. This review maps verification approach only. Empty result cells are not implied passes.

---

## Traceability

### Path status in the draft test plan

"Covered" means an existing `TP-M0-*` scenario or a named test-plan section already checks that ID, even if the ID is not yet cited on a Covers line.

"Incomplete" means a related scenario exists but a material part of the requirement is not checked.

"No path" means the draft plan can pass while that requirement is unmet.

| Path status | IDs |
|---|---|
| Covered | M0-FR-001, M0-FR-002, M0-FR-004, M0-FR-005, M0-FR-006, M0-FR-007, M0-NFR-001, M0-NFR-003, M0-NFR-004, M0-AC-001, M0-AC-002, M0-AC-004, M0-AC-005, M0-AC-006, M0-AC-007, M0-AC-008 |
| Covered, but the ID is not cited (link only) | M0-AC-003 (TP-M0-F-001 step 5), M0-AC-009 (TP-M0-I-003), M0-AC-010 (§§10–11), M0-AC-011 (§7), M0-AC-012 (§6) |
| Incomplete | M0-FR-003, M0-FR-009, M0-NFR-002, M0-NFR-005, M0-NFR-008, M0-NFR-009, M0-NFR-010 |
| No path | **M0-FR-008, M0-NFR-006, M0-NFR-007** |

No other Module 0 FR, NFR, or AC is absent from the table below. M0-FR-001 through M0-FR-009, M0-NFR-001 through M0-NFR-010, and M0-AC-001 through M0-AC-012 are all mapped. The three "no path" IDs are blocking coverage gaps for Definition of Ready until the Tech Lead accepts the proposed updates (or an equivalent approach) into the operational test plan. They are not requests to weaken the criteria.

CI green is not, by itself, TP-M0-F-001. That scenario includes a clean setup and a launch. A headless CI run can satisfy the automated portion and still leave M0-AC-001 and M0-AC-002 unproven.

### Traceability table

Primary type is the evidence that must exist. "Also" is supporting evidence, not a second way to skip the primary type.

| ID | Verification type | Draft-plan mapping | Path | What must be true |
|---|---|---|---|---|
| M0-FR-001 | Documented manual check. Also CI check for the build | TP-M0-F-001 | Covered | On the primary supported development environment, documented setup ends in a successful build and the minimal shell actually launches. A compile-only CI result does not launch the shell |
| M0-FR-002 | Automated test. Also CI check | TP-M0-F-002, TP-M0-I-001 | Covered | Core/domain build and tests run without starting the graphical application |
| M0-FR-003 | Automated test for dependency direction. Also review | TP-M0-I-002, TP-M0-I-003 | Incomplete | Six areas exist as boundaries: core/domain, editor/application, UI, rendering, platform-specific functionality, persistence/project format. Placeholders are enough. I-002 checks only the core→UI/platform direction. I-003 passes if docs and code omit the same boundary |
| M0-FR-004 | CI check. Also documented manual check of the success log | TP-M0-F-001 step 5, TP-M0-F-003, TP-M0-NF-004 | Covered | One documented workflow runs tests and, where applicable, static/type checking and linting. The success log must show each applicable check ran. "Where applicable" is an architecture statement, not a silent skip |
| M0-FR-005 | CI check | TP-M0-F-003, and one green run of the required workflow | Covered | The in-repo CI workflow runs the required build and verification. A required failure fails the corresponding job. See the failure-propagation procedure |
| M0-FR-006 | Automated test if initialization can run without a window; otherwise documented manual check of captured logs | TP-M0-F-004 | Covered | Normal startup is identifiable. A controlled initialization failure is identifiable and does not end in silent termination. The injection method is not specified by the draft plan; the procedure below is the proposed method |
| M0-FR-007 | Documented manual check. Also review | TP-M0-F-001, M0-AC-008 | Covered | Docs contain prerequisites, setup, development startup, build, test, verification, and repository structure, and a reviewer can follow them |
| M0-FR-008 | Review | None. §§9–10 describe infrastructure and evidence but never check this ID | **No path** | The shared infrastructure the approved plan requires is present and is what the verification workflow runs. Proposed PTU-9 |
| M0-FR-009 | Review | §6 design review, which does not name this ID | Incomplete | The shell carries only the initial design foundation it needs. §6 does not cite the ID and does not name the principles in M0-NFR-008. Proposed PTU-7 |
| M0-NFR-001 | Documented manual check | TP-M0-F-001, TP-M0-NF-001 | Covered | A clean supported environment reaches a successful build using only documented steps. Record environment, toolchain versions, commands, result, and any undocumented intervention |
| M0-NFR-002 | Automated test. Also review | TP-M0-I-002 | Incomplete | Core/domain does not directly depend on a desktop shell, browser UI components, React or an equivalent UI framework, or platform-specific filesystem APIs. Platform-specific behavior crosses an explicit abstraction. I-002 does not enumerate those categories, and a review will not fail CI on the next violating import. Proposed PTU-5 |
| M0-NFR-003 | Automated test and CI check | TP-M0-F-002, TP-M0-I-001 | Covered | Core tests execute and do not open a graphical window. Supplying xvfb only for the core command is not sufficient evidence. Proposed PTU-2 records that without changing the expected result |
| M0-NFR-004 | CI check for a failing test. Documented manual check for the other applicable classes | TP-M0-F-003, TP-M0-NF-004 | Covered | Build, test, type-checking, and lint failures that apply to the stack are actionable and non-zero, not silent successes. One red test does not prove a later lint step is wired. Procedure below |
| M0-NFR-005 | Review | Split across M0-AC-008 / TP-M0-F-001 and TP-M0-I-003, with no ID citation | Incomplete | Conventions, dependency boundaries, development commands, and major architectural decisions are documented. Commands are checked by following the developer docs. Boundaries and decisions are checked against architecture.md and ADRs. Proposed PTU-1 |
| M0-NFR-006 | Review | None. M0-AC-009 checks that docs match the code, not that alternatives were evaluated against the Product Overview | **No path** | Each major technology choice records a Product Overview justification and at least one realistic alternative with trade-offs. Proposed PTU-6 |
| M0-NFR-007 | Review. Automated import check can support it and cannot replace it | None. TP-M0-I-002 is adjacent only | **No path** | The architecture does not intentionally couple the core project model to one target platform. Not implementing Windows, macOS, Linux, and Web shells in Module 0 is not a failure. A core that avoids UI imports can still bake in one OS's paths, filesystem, or presentation types. Proposed PTU-6 |
| M0-NFR-008 | Review | §6 | Incomplete | Shell and design foundation preserve Progressive Complexity, contextual interaction, and cross-platform adaptation. Pixel-identical platform skins are not required. §6's bullets do not name those three principles. Proposed PTU-7 |
| M0-NFR-009 | Review | §7, owned by the Application Security Engineer | Incomplete | Trust boundaries and baseline controls for dependencies, CI secrets, and platform capabilities introduced by Module 0 are documented, with no unresolved blocking security finding. Functional tests do not replace §7. The ID is not cited. Proposed PTU-8 |
| M0-NFR-010 | Documented manual check | TP-M0-NF-001, with timings from TP-M0-NF-002 and TP-M0-NF-003 when those records exist | Incomplete | Verification that Module 0 introduces can be repeated in a documented environment. This does not require a benchmark product, visual baselines, or a pass/fail timing gate. NF-002 already says the timing baseline is not a pass/fail target. The ID is not cited. Proposed PTU-9 |
| M0-AC-001 | Documented manual check. CI build is supporting only | TP-M0-F-001, TP-M0-NF-001 | Covered | Clean checkout plus documented setup produces a successful build. Hidden preinstalled tools that are not in the docs fail the criterion |
| M0-AC-002 | Documented manual check | TP-M0-F-001 | Covered | The minimal shell launches through the documented development workflow. An optional automated smoke may be added; it does not replace this check |
| M0-AC-003 | CI check and the local documented run | TP-M0-F-001 step 5. Omitted from that scenario's Covers line | Covered | The documented verification workflow successfully runs every required Module 0 automated check. Evidence is a success log that names those checks, plus a later red run for M0-AC-004 |
| M0-AC-004 | CI check and local documented run | TP-M0-F-003 | Covered | A deliberate failing test, introduced only for this check, makes local verification and the CI test step fail. The failure is then removed. No permanent red test remains |
| M0-AC-005 | Automated test | TP-M0-F-002 | Covered | The core suite completes without launching the graphical application |
| M0-AC-006 | Automated test. Also review | TP-M0-F-002, TP-M0-I-001, TP-M0-I-002 | Covered | A test imports and exercises core/domain code from a project or target that does not depend on UI or desktop-shell code. Analysis without that import is not enough |
| M0-AC-007 | CI check | TP-M0-F-003 plus one green required-workflow run | Covered | CI performs the documented required checks on the candidate that will be approved, and a required failure is reported as a failure. Both halves are required |
| M0-AC-008 | Documented manual check | TP-M0-F-001 | Covered | From repository documentation alone, a reviewer can determine how to install dependencies, run the application, build it, run tests, and run the complete verification workflow |
| M0-AC-009 | Review | TP-M0-I-003 | Covered | After implementation, architecture.md and the required ADRs describe the architecture that was actually built, not only the architecture that was proposed |
| M0-AC-010 | Review | §§10–11 and development-process §13 | Covered | The test plan was executed, required evidence exists, and Functional and Non-Functional Quality Engineers report no blocking coverage gap. This cannot be an automated test. It is also not met by writing this preparation review |
| M0-AC-011 | Review | §7 | Covered | Security-relevant Module 0 decisions have documented trust boundaries and no unresolved blocking security finding. Owner: Application Security Engineer |
| M0-AC-012 | Review | §6 | Covered | The minimal shell has been reviewed against the approved Module 0 design intent, with no blocking design finding. The path exists only once that intent exists. Owner: Product Designer |

TP-M0-NF-002 and TP-M0-NF-003 are baseline records, not extra product requirements. They support M0-NFR-010. They do not add a timing threshold.

---

## Tool recommendations with alternatives and trade-offs

The Tech Lead selects languages and the shell. Functional quality constrains how that selection is tested. Do not add a second language's test stack "just in case." Archive §11's full ladder is not a Module 0 tool list.

Module 0 needs three layers only:

1. Unit tests of platform-neutral core behavior that actually exists.
2. In-process integration tests at the composition boundary, with UI and desktop shell replaced by test doubles.
3. A documented launch check of the minimal shell. Browser-driver end-to-end coverage is optional and only for a shell that a driver can honestly launch.

There is no production editor behavior to automate. Component tests, visual snapshots, and a multi-browser matrix are out of Module 0.

### Unit

| If the approved core is | Recommend | Alternative evaluated | Do not use for the core suite |
|---|---|---|---|
| TypeScript or JavaScript | Node.js built-in runner, `node:test` with `node:assert` | Vitest, only under the constraints below | Jest; pytest; cargo test; any runner whose default environment is a DOM |
| Rust | `cargo test` | `cargo nextest`. Not justified for a Module 0-sized suite | A JavaScript runner that reaches Rust only by launching the shell |
| Python | `pytest` | The standard-library `unittest` runner | Vitest or `node:test` as a wrapper around a Python core |

**Recommendation when the core is TypeScript:** use `node:test` for the core package.

Trade-off against Vitest:

- `node:test` has been stable since Node 20, adds no test-framework dependency, and has no browser mode and no jsdom default. That matches M0-NFR-003 and M0-AC-005. Constructor-injected ports should be used instead of module mocks; `node:test` module mocking is the weaker area, and Module 0 should not need it if core does not hard-import the platform.
- Type stripping, when the pinned Node version provides it, is not type checking. A green `node --test` does not satisfy the static/type portion of M0-FR-004. The type checker remains a separate command. Type stripping also does not execute every TypeScript syntax form (constructs that need code generation, such as some enums and namespaces). The documented test command must run the tests with the pinned toolchain only. An undocumented `tsx` or `ts-node` loader fails M0-NFR-001.
- Vitest is the realistic alternative when the shell is already Vite-based and the team wants one TypeScript transform for enums and later UI tests. It is faster to iterate in and it understands workspaces. It is also one configuration line away from `jsdom`, `happy-dom`, or browser mode. A suite can load a DOM and still be described as "headless."
- Vitest is acceptable for core only if the committed core project sets the environment to Node, leaves browser mode off, and the dependency check fails verification when that config changes. UI configuration must not be the core configuration.
- Jest is rejected for Module 0. Its usual path pulls a DOM environment and a transform layer the core does not need.
- pytest is rejected unless the approved core language is Python. Future Python integration, listed as an architecture topic, is not Module 0 product scope. Adding pytest now is speculative infrastructure.
- `cargo test` is rejected for a TypeScript core for the same reason. Use it only if Rust is the core language. It is headless by default and is the strongest fit for M0-NFR-003 when the core crate does not link a windowing library. `cargo nextest` adds a second runner without a Module 0 need.

Coverage percentages and snapshot testing are not Module 0 gates. The spec defines no coverage threshold. Do not invent one. Node's coverage flag and Vitest coverage are optional local diagnostics, not required infrastructure.

### Integration

Use the same runner as the unit suite. Put integration tests in a distinct file or directory name so the M0-AC-006 evidence is recognizable in the log. Do not adopt a second integration framework.

The Module 0 integration test is:

- a test target that depends on the core public entry and on test doubles of the platform/window port;
- not a test that depends on the UI package, Electron, a system webview, a browser, or a GPU;
- able to run the composition root through normal startup diagnostics and through one controlled initialization failure (TP-M0-F-004).

That is the integration-testing foundation named in the Module 0 scope. It also fulfills the import half of M0-AC-006. It is not a revival of archived M0-AC-002.

Alternatives rejected for this layer:

- Playwright or Cypress "integration" that boots the real shell. That couples the boundary test to a window and collides with M0-NFR-003.
- Testcontainers, dockerized desktop sessions, or a packaged installer test. Final distribution is out of scope, and Module 0 has no service to contain.
- A hand-written subprocess harness around the GUI binary as the only integration test. A process smoke may support launch evidence. It is not a substitute for importing the core without the shell.

If Rust is the core and TypeScript is the shell, `cargo test` is the core integration suite. A TypeScript test may call the real FFI or WASM entry only when that entry loads without the webview. See stack notes. Mocks of the FFI, alone, do not count as M0-AC-006 for the Rust core; `cargo test` of the real crate does.

### UI / end-to-end

**Required Module 0 UI verification is the documented manual launch in TP-M0-F-001 (M0-AC-002), plus the design review in §6.** No end-to-end framework is required for that.

| Tool | Module 0 judgment | Trade-off |
|---|---|---|
| Playwright | Acceptable only as one optional smoke: launch, observe a documented ready signal, close. Use it only when the approved shell is a web page or an Electron `BrowserWindow` that Playwright can launch itself | Honest about Chromium and, with extra OS packages, Firefox and WebKit in a browser. Electron support is a narrower API than browser Playwright and should stay a single smoke, not a suite. It does not see native chrome outside the web contents. Downloading browsers is real CI cost and supply-chain surface. Do not add it "for later modules" |
| Cypress | Reject for Module 0 | Cypress launches its own browser against a URL. That is not evidence that the product shell started (M0-AC-002), and it does not host a platform-neutral core. Component testing would couple Module 0 tests to a UI framework the shell is not supposed to grow into. No desktop-shell story that beats a manual launch plus a log |
| WebDriver (Selenium, WebdriverIO, Appium, WinAppDriver) | Defer | The protocol can drive browsers, and native drivers exist, but an empty Module 0 window does not repay the flake, the grid, and the per-OS driver setup. WebView2 can be driven later via CDP; WKWebView is a different problem. Reconsider when a later module has editor interaction worth automating, or when the approved shell is a system webview and someone proposes a driver with a concrete ready signal |

Do not treat a Playwright run against a dev server as proof that a desktop shell launched. That run does not start Electron, WebView2, WKWebView, or WebKitGTK.

The optional smoke, if adopted, asserts only observables Module 0 already requires: the process is the documented shell, a startup diagnostic is present (M0-FR-006), and the process exits in a controlled way. It must not assert editor widgets, canvas pixels, or WebGPU device creation.

### How core tests stay headless

These rules are the verification design for M0-NFR-003, M0-AC-005, and M0-AC-006. They should be reflected in the architecture, not discovered after the shell is wired through the core.

1. `test:core` (name is illustrative) runs unit tests, the boundary integration tests, and the dependency-boundary check. It does not invoke the shell entry point, Electron, a webview, a browser, or a GPU context.
2. The documented complete verification command runs `test:core` plus the applicable type check and lint. It still does not launch the GUI. Launch remains the separate documented step in TP-M0-F-001.
3. The core test target's dependencies exclude UI, renderer implementation, and desktop-shell packages. Test code lives outside the shell package.
4. CI runs `test:core` without xvfb or an equivalent display workaround. xvfb on a shell-smoke job is acceptable. xvfb on `test:core` means the headless claim was not demonstrated.
5. Preferred dynamic evidence is a core run on a job with no display server. If the only CI OS always has a desktop session, minimum evidence is: the command line does not start the shell, the dependency check shows no GUI modules, and a local TP-M0-F-002 record states that no window opened. Say so in the evidence. Do not describe that weaker record as a display-less run.
6. M0-AC-006 needs a test that imports the architecture's real public core entry and asserts the contract architecture.md actually defines. Do not invent scene, document, or editor behavior so the test has something to call. If the public entry cannot be imported without executing a window constructor, the architecture fails M0-AC-006.
7. Core type checking, when TypeScript is used, uses a core tsconfig that does not include DOM libraries or JSX. A green check of a single solution-wide tsconfig that includes `"lib": ["DOM"]` does not prove the core is platform-neutral.
8. A test that needs a DOM, a canvas, Electron, or a webview is a shell test. It is not part of `test:core` and cannot be the only proof of M0-FR-002.

Initialization for TP-M0-F-004 should be a function or composition root that accepts the platform port. The test passes a succeeding fake and a failing fake. Production code does not contain a hidden "fail on startup" flag. The fake stays in the test target.

### How dependency boundaries are enforced

TP-M0-I-002 as written is a review. A review will not keep M0-NFR-002 true on the next change, and M0-NFR-004 requires verification failures to be visible. The prohibited-direction check therefore belongs in the required automated workflow. The expected result of I-002 stays: no prohibited dependency from core/domain into UI or platform-specific layers. Automation is how that result is produced on every run. Review remains for the judgment calls automation cannot make (M0-NFR-006, M0-NFR-007, and whether a placeholder is a real boundary).

**TypeScript or JavaScript monorepo**

- Recommend [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) (or the maintained release current at implementation time) as a devDependency and a CI step, when the repo uses path aliases, barrel `index.ts` files, or `export *`. A text search misses those and creates false confidence, which is worse than one boundary-focused devDependency.
- Alternative: a `node:test` that reads the core package manifest and scans core source for forbidden specifiers. Acceptable when imports are direct and there are no aliases or barrels. Reject it as the sole control once aliases or re-exports exist.
- ESLint `no-restricted-imports` is useful editor feedback if ESLint is already the linter chosen for M0-FR-004. It is not sufficient alone: disables are local, and it does not police the package manifest.
- Do not adopt Nx, Sheriff, or another monorepo framework only to obtain a boundary rule.

The forbidden set is architecture-owned, committed next to the ADR, and fails closed if the list is missing. At minimum the list must encode M0-NFR-002 for core/domain:

- the desktop shell package and its native module (`electron` is the example if Electron is chosen; the rule is the shell that was chosen, not Electron forever);
- browser UI component libraries and, when present, React, Vue, Svelte, Solid, or whichever equivalent UI framework the shell uses;
- platform filesystem APIs (`node:fs`, `fs`, and the equivalent in another language) inside core/domain.

Rendering implementations (WebGPU, WebGL, wgpu, a canvas toolkit) are not named in M0-NFR-002. They should still be denied to core if the Tech Lead agrees that "platform-neutral" and the rendering boundary in M0-FR-003 mean core may hold a rendering-agnostic interface only. That interpretation is an assumption in this review, not an extra requirement. UI may depend on core. The rule is directional. Do not ban `fs` from the whole repository; a future persistence implementation has to live somewhere that is not core. Module 0 does not implement that persistence.

**Rust core**

- Recommend a small `cargo metadata` (or manifest) test in the required workflow: the core crate's dependency list does not include the shell, the UI host, or a windowing/webview crate.
- Alternative: `cargo-deny` bans, if Security or DevOps already adopt `cargo-deny` for supply chain. Use one Rust ban mechanism, not two.
- dependency-cruiser does not see Rust `use` paths. A TypeScript-only graph leaves the Rust half of M0-NFR-002 unenforced.

**Both languages**

Run both checks inside the documented verification command. Either check failing must fail that command.

Placeholder packages count for M0-FR-003. The automated check should fail if any of the six areas is missing as a package, crate, or clearly isolated module, and if core's manifest or imports point the wrong way. It should not fail because rendering or persistence has no product behavior yet.

---

## Infrastructure to build in Module 0

Test-plan §9 lists examples, then warns that only infrastructure justified by Module 0 is in scope. The examples are not a backlog. M0-NFR-010 applies to verification and benchmark infrastructure that Module 0 introduces. It does not order the project to introduce benchmarks.

### Build now

These are justified by M0-FR-004, M0-FR-005, M0-FR-008, M0-NFR-002, M0-NFR-003, M0-NFR-004, M0-AC-003, and the evidence list in test-plan §10.

| Infrastructure | Why it is Module 0 | Owner to implement |
|---|---|---|
| One documented verification entry point that runs core tests, the boundary check, and applicable type and lint checks, and that returns a non-zero exit if any of them do | M0-FR-004, M0-AC-003, M0-NFR-004 | Developers, with DevOps for CI |
| A separate core test command that does not launch the shell | M0-FR-002, M0-NFR-003, M0-AC-005, M0-AC-006 | Developers |
| CI jobs that run the documented build and that verification command as required checks | M0-FR-005, M0-AC-007 | DevOps with developers |
| The architecture-owned dependency denylist and the automated check above | M0-NFR-002, M0-AC-006 | Developers; Tech Lead owns the allowed graph |
| One test-side fake platform port and one controlled initialization failure used only from tests | TP-M0-F-004, M0-FR-006 | Developers |
| Retained logs of local and CI verification, including the red probe and the later green run | Test-plan §10, process §15 | DevOps provides artifact retention; developers capture the local half |
| A clean CI checkout that uses only documented setup commands | Supports M0-NFR-001 and M0-AC-001. It does not replace a launch record | DevOps |
| The TP-M0-NF-001 record: environment, toolchain versions, commands, result, undocumented intervention | M0-NFR-001, M0-NFR-010 | Whoever runs the clean setup; Quality Engineers review it |
| Initial verify/build timings copied from those ordinary logs | TP-M0-NF-002, TP-M0-NF-003 | Non-Functional Quality Engineer uses the logs. No new store |

The verification entry point must propagate child exit codes on the supported developer shell. A bash `set -e` script is not enough if the documented steps are pasted into Windows PowerShell 5.1, which does not support `&&`. A single documented command (`npm run verify`, `cargo` plus a small runner, or another entry the Tech Lead names) is the portable contract. CI and the local docs must call that same entry point. Two different scripts, with only the local one containing the boundary check, fail M0-AC-003 and M0-AC-007.

Required CI steps must not set `continue-on-error`, `|| true`, or an equivalent swallow on build, test, type check, lint, or the boundary check. Quality Engineers review the workflow file for that. A unit test that parses workflow YAML is optional, not required infrastructure; reading the file plus the live red run is the evidence.

Fixtures stay in the test target, contain no secrets and no production user paths, and do not need binary goldens.

### Do not build in Module 0

| Deferred item | Why it waits |
|---|---|
| Visual-regression harness, screenshot baselines, perceptual diffs, Storybook visual tests | The shell is not the editor. §6 is a human design review. Baselines would churn and would invent a pixel gate the spec does not set. M0-NFR-008 explicitly does not require pixel-identical platforms |
| Benchmark-result storage, trend dashboards, historical comparison services | NF-002 is a baseline, not a pass/fail target. NF-003 asks for an initial timing record so later modules have something to compare. CI logs are that record. Storage becomes justified when a later module defines a workload and a threshold |
| Multi-browser matrix, BrowserStack, or "Chromium plus Firefox plus WebKit" as a required check | No operational AC names browsers. Archive §17 leaves the initial browser target open. One engine is enough if a web smoke is adopted at all |
| Multi-OS GUI CI as proof of cross-platform product behavior | M0-NFR-007 forbids coupling the core model to one platform. It does not require shipping every platform in Module 0. Core tests should still avoid OS-specific APIs so they can run on the CI OS |
| Golden persistence files, round-trip corpus, independent format readers | No project-format behavior is in Module 0. The persistence boundary may be an empty interface |
| GPU or WebGPU conformance, trace captures, reference renders | The rendering boundary is not a renderer. Core verification must not require a GPU. If shell startup fails closed when WebGPU is missing, clean setup and CI become accidental hardware matrices. Keep any such probe out of `test:core` and out of the definition of a successful Module 0 launch unless the Product Owner adds that prerequisite |
| Coverage gates, flake quarantine, Testcontainers, axe-core as a release gate, Playwright browser cache as mandatory CI | Not implied by any Module 0 ID. Accessibility-oriented basics in §6 are a design review, not an automated axe gate |
| Python test infrastructure, solely to prepare a future backend | Speculative relative to Module 0 |

---

## Failure-propagation evidence

TP-M0-F-003 and M0-AC-004 require a deliberately failing test, visible local failure, visible CI failure, and removal of that failure afterward. M0-NFR-004 additionally requires actionable failures for build, type checking, and linting when those checks exist. The expected results already written in the test plan stay as written.

A permanent red test, `test.fail`, `it.skip`, `allow_failure`, a feature flag that defaults off, or `continue-on-error` does not meet the criteria. The first hides a failure on the default branch or forces a waiver. The others never fail the required check. Do not commit the probe to the branch that will be approved.

### Procedure for TP-M0-F-003

1. Start from the implementation candidate. Use a short-lived branch or draft pull request, for example `verify/m0-failure-propagation`. Do not use a reduced CI workflow.
2. Add one new test file whose only purpose is the probe, so removal is a complete file delete. Do not edit an existing test. The assertion must be an ordinary failure with a fixed message, for example `M0 failure-propagation probe: this test must fail`. It must run under the same core test command CI runs, not under an excluded path.
3. Run the documented local verification command. Keep the log. Pass condition for this step: non-zero exit, the probe name, and the message are visible without a private debugger. That is the "actionable" half of M0-NFR-004 for tests.
4. Push that commit and let the required CI test job run on that commit. Keep the job reference and the log excerpt. Pass condition: the test job status is failed, not skipped or neutral; the same probe message is in the log; the aggregate required check for the pull request is failed. A workflow syntax error, a cancelled job, or a failure in an unrelated job does not count.
5. Confirm the workflow does not swallow the test step. If it does, the architecture/CI setup fails M0-AC-007. Fix the wiring and repeat from step 3. Do not "fix" it by deleting the probe first.
6. Delete the probe file. Run local verification again. Push the removal. CI on the removal commit must pass the required checks.
7. The commit proposed for approval is the green commit. Evidence for the Product Owner package is the red local log, the red CI reference, the green local log, the green CI reference, and the diff that added and then removed the probe. Store logs as review artifacts, not as a checked-in failing test.

If branch protection cannot run CI on that branch, open a draft pull request so the real required check runs, then close it or drop the red commit. Squash-merging only the green tree, without a CI run on the red commit, does not satisfy M0-AC-004.

The probe is one test failure. It proves the test step fails closed. It does not prove type checking or lint fails closed if those steps never ran.

### Procedure for the rest of TP-M0-NF-004

For each applicable class among build, type checking, and lint:

1. Locally, and not on the approval commit, introduce one deliberate break in that class only.
2. Run that class's documented command. Keep the non-zero log and confirm the diagnostic names the fault.
3. Revert the break before the next commit. Do not push it unless that class is a separate required CI job whose wiring is not the same script already proven by the red test run.

If type checking or lint is a distinct required CI job, local evidence alone does not prove that job fails the pull request. Either include those commands in the single verification job that the probe already failed, or capture one red CI run for that job and then remove the break. Prefer one verification job so Module 0 needs only one red CI run.

Quality Engineers review the logs. A failure that prints only "error" or a non-zero code with no file or rule identifier is not actionable under M0-NFR-004.

---

## Stack testability notes

Functional quality does not choose the stack. The notes say which shapes make a Module 0 ID untestable. "Damages" means the choice can still pass if the constraint is met. "Blocking coverage gap" means that, under that architecture, at least one current ID has no honest evidence path.

Across every option, the testable shape required by M0-FR-002, M0-NFR-002, M0-NFR-003, and M0-AC-006 is the same: core is a library; the shell is a separate composition root; core tests never construct the window; fatal startup is observable as a diagnostic plus a non-zero exit. A stack that cannot draw that line fails the operational spec. Tooling will not repair it.

### TypeScript everywhere

This does not inherently damage testability. One language makes M0-AC-006 a normal import, and one graph tool can see both core and shell.

It is a blocking coverage gap if any of these remain true:

- Core and UI share one tsconfig that enables DOM libraries or JSX, so type checking cannot see a platform import the core is not supposed to have.
- The only test runner configuration is a DOM or browser environment, so M0-NFR-003 cannot be shown.
- The repository is one undifferentiated source tree with no package or module rule that CI can fail. Folder names are not a boundary if imports ignore them. TP-M0-I-002 then has nothing enforceable to review, and M0-FR-003 is documentation.
- `node --test` or Vitest is treated as the type check. Type stripping and Vite transforms do not type-check. M0-FR-004 would be unmet whenever static checking is applicable, which it is if the language is TypeScript.

It damages testability, without automatically failing an ID, if path aliases or barrels are introduced and the boundary control is a regex. Use dependency-cruiser in that case.

A single Vitest workspace is acceptable only under the core-project constraints in the unit section. Running every test, including core tests, through the shell's Vite browser pipeline is a blocking M0-NFR-003 gap.

### Rust core plus TypeScript UI

This is the strongest headless split if the Rust crate is a pure library: `cargo test` does not open a window, and Rust cannot import React. It is also the easiest way to create a false pass.

Blocking coverage gaps:

- The required verification command or CI runs only `npm test` or only `cargo test`. The other language is then an untested core or an untested shell. M0-FR-002 and M0-AC-003 are unmet for the missing half. Either failure must fail the one documented workflow.
- The Rust crate depends on a windowing or webview crate, or the only way to call it is to boot the TypeScript shell. M0-AC-005 and M0-AC-006 are then not demonstrable. `cargo test` of a library crate is the required demonstration. A TypeScript mock of the native API is not.
- The native entry cannot load in CI without the GUI runtime, a GPU, or an interactive login. Headless verification is then unreproducible (M0-NFR-001, M0-NFR-003).
- dependency-cruiser (or an ESLint rule) is the only boundary check. It does not see Cargo dependencies, so M0-NFR-002 is unenforced on the core side. The Rust manifest check in the tool section is mandatory under this stack, not optional.

Non-blocking damage to plan for:

- Hand-written TypeScript types can drift from Rust. Module 0's surface should stay small. One test that calls the real exported entry without a window is enough. Do not build a general FFI contract framework in Module 0.
- Panics that cross FFI as a generic JavaScript rejection can hide the subsystem M0-FR-006 wants identified. The shell log must still name initialization failure. That is a diagnostics design constraint, not a second test framework.
- Two toolchains make clean setup easier to get wrong. Document both, including versions, in the TP-M0-NF-001 record. An interactive Rustup or Visual Studio prompt that is not in the docs fails M0-NFR-001.

### Electron versus a system webview

Neither choice is a functional rejection. They damage different evidence.

**Electron**

- Easier optional smoke: Playwright can launch the app and read renderer console output, which helps M0-FR-006. Treat that API as a smoke, not a large suite. It does not replace `test:core`.
- Blocking coverage gap if core modules import `electron`, if domain code lives in the Electron main process beside `BrowserWindow`, or if `test:core` starts Electron. M0-NFR-002 and M0-NFR-003 fail in that shape even when the renderer is "just a web page."
- Damaging, and not allowed as a fix: turning off `contextIsolation`, turning off the sandbox, or disabling certificate checks so a test can poke internals. Those are security controls. If a smoke cannot run without that change, stop and involve the Application Security Engineer. Do not weaken the control to make M0-AC-002 automatic.
- Linux CI for an Electron smoke needs OS libraries and often a display workaround. That cost belongs on the smoke job only. Do not move it onto `test:core`.
- Electron's own startup (GPU process, crash handler, singleton lock) can fail for reasons that look like silent launch failure. The Module 0 log must still satisfy M0-FR-006. A smoke that ignores a non-zero exit is not a launch.

**System webview (WebView2, WKWebView, WebKitGTK, or a shell such as Tauri that uses those)**

- Blocking coverage gap if the planned AC-002 evidence is a Playwright session against a dev server or against desktop Chromium only. On this class of shell the Windows web content is Chromium-family, and macOS and Linux web content are WebKit-family. A green Chromium smoke does not launch the product window and does not match the other platforms' engines. Presenting it as M0-AC-002 evidence is a false pass.
- Playwright has no Module 0-suitable driver for WKWebView. WebView2 automation requires a CDP debugging port. Leaving remote debugging enabled outside a test build is a security finding, not a test feature. Do not adopt CDP attachment in Module 0. Use the manual launch plus process diagnostics instead.
- Blocking for M0-NFR-001 if a clean machine cannot launch the documented shell without an undocumented runtime install, a developer-account prompt, or a keychain dialog the docs do not state. Final distribution and notarization are out of scope; a development launch that depends on them anyway still fails the clean-setup criterion.
- Not a blocking gap: absence of an automated cross-platform UI suite. M0-AC-002 can be a documented manual check on the primary development environment. Record the limitation so CI green is not described as a launch. Regressions in window startup will not be caught until a person launches the shell. That cost is acceptable for an empty Module 0 shell and is not acceptable later as a substitute for editor automation.
- The same core rule applies: the webview host must not be how core code gets executed in tests. A Rust/TypeScript split helps here only when the core crate does not link the webview crate.

**Comparison:** Electron is easier to smoke-test and easier to contaminate with shell imports. A system webview preserves a native host boundary and makes automated launch evidence weak or platform-specific. The blocking mistake in both cases is putting domain logic behind window creation. The blocking mistake unique to the webview is claiming a browser test launched the application. The blocking mistake unique to Electron is importing `electron` from core or running core tests inside Electron.

---

## Proposed test-plan clarifications

Proposed test-plan updates for the Tech Lead. They do not change any expected result already written in `test-plan.md`. They are not approved test-plan text until the Tech Lead edits that file. Functional quality will not apply them in this task.

### PTU-1 — Cite IDs that already have a scenario

Add these Covers lines. Do not edit the existing expected-result sentences.

- TP-M0-F-001, extend Covers to: `M0-FR-001, M0-FR-004, M0-FR-007, M0-NFR-001, M0-AC-001, M0-AC-002, M0-AC-003, M0-AC-008.`
- TP-M0-I-001, add: `Covers: M0-FR-002, M0-NFR-003, M0-AC-005, M0-AC-006.`
- TP-M0-I-002, add: `Covers: M0-FR-003, M0-NFR-002, M0-AC-006.` Further I-002 text is PTU-5.
- TP-M0-I-003, add: `Covers: M0-AC-009. Contributes to M0-NFR-005 together with M0-AC-008; development commands are verified by following the developer documentation, not by this comparison alone.`
- TP-M0-NF-001, add: `Covers: M0-NFR-001, M0-NFR-010.`
- TP-M0-NF-004, add: `Covers: M0-NFR-004. The deliberate test-failure half is TP-M0-F-003.`
- Test-plan §10, add: `The Quality Engineer review of this evidence is the verification of M0-AC-010.`

Evidence note to add under TP-M0-F-001, without changing "no undocumented manual workaround is required":

> The successful verification log shows each applicable automated check actually running, including tests and, when the architecture says they apply, static/type checking and linting.

### PTU-2 — Headless evidence for TP-M0-F-002

Add after the existing expected result. Leave "core tests complete normally." in place.

> Additional evidence requirement: the core command does not start the graphical shell and does not depend on a display server. A pass that requires xvfb, or any other supplied window system, is not evidence that M0-NFR-003 or M0-AC-005 passed. Record whether a display server was present.

### PTU-3 — TP-M0-F-003 procedure

Insert the procedure in the section "Failure-propagation evidence" of this review under TP-M0-F-003, after the existing expected result. Do not change that expected result. Do not add a permanent failing test, a skipped test, or `continue-on-error` as the demonstration.

### PTU-4 — TP-M0-F-004 injection

Add after the existing expected result. Leave "startup and failure are diagnosable without silent termination." in place.

> The controlled initialization failure is produced through a test double or a local fixture at the composition root, not by a failure flag left enabled in the shipped shell. Evidence is the captured diagnostic for normal startup and the captured diagnostic for the failure, plus a non-zero exit or another observable, non-silent termination on the failure path. A window is not required when the composition root can run against the test double.

### PTU-5 — Make TP-M0-I-002 enforce M0-NFR-002

Add after the existing expected result. Leave "no prohibited dependency from core/domain into UI or platform-specific layers." in place.

> "Prohibited" includes every category in M0-NFR-002: a specific desktop shell, browser UI components, React components or equivalent UI-framework components, and platform-specific filesystem APIs. An automated check in the required verification workflow fails when core/domain violates that list. Review still confirms the result. The six areas in M0-FR-003 exist as separate modules, packages, or crates. A placeholder is sufficient. Missing product behavior inside rendering or persistence is not a failure of this scenario. Platform-specific behavior that exists crosses an explicit abstraction rather than a core import.

This is an addition. It does not relax I-002.

### PTU-6 — Paths for M0-NFR-006 and M0-NFR-007

Add two scenarios. They are new; they do not rewrite existing ones.

```text
### TP-M0-I-004 — Technology Justification

Review docs/engineering/architecture.md and the Module 0 ADRs.

Expected result: each major technology choice records a justification against the Product Overview and at least one realistic alternative, including the trade-offs.

Covers: M0-NFR-006.

### TP-M0-I-005 — Core Platform Coupling

Review the core/domain model and its dependencies for intentional coupling to one target platform.

Expected result: the core project model does not depend on one operating system or one presentation layer. Not shipping Windows, macOS, Linux, and Web shells in Module 0 is not a failure.

Covers: M0-NFR-007.
```

The automated denylist supports TP-M0-I-005. It does not replace the review.

### PTU-7 — Design review cites the design IDs

Add to test-plan §6, without removing the current bullets:

> The review also judges Progressive Complexity, contextual interaction, and cross-platform adaptation. Cross-platform adaptation does not require pixel-identical behavior. Covers: M0-FR-009, M0-NFR-008, M0-AC-012. The review cannot be executed until a Module 0 design intent exists to review against.

### PTU-8 — Security review cites the security IDs

Add to test-plan §7:

> Covers: M0-NFR-009, M0-AC-011. Functional tests do not substitute for this review.

### PTU-9 — Infrastructure in and out, and M0-FR-008

Add to test-plan §9, after "Only infrastructure justified by Module 0 should be implemented now.":

> Module 0 shared infrastructure is: the documented verification command, the headless core test command, CI stages that fail on a required verification failure, the automated core dependency-boundary check, test-side fakes required by TP-M0-F-004, and retained verification logs including the TP-M0-NF-001 record. Timings for TP-M0-NF-002 and TP-M0-NF-003 are copied from those logs.
>
> Module 0 does not add a visual-regression harness, benchmark-result storage, a multi-browser matrix, a multi-OS GUI matrix, golden persistence files, or a performance pass/fail threshold.
>
> M0-FR-008 is verified by review: the implemented commands and CI stages match this list and are the workflow the documentation tells developers to run. No separate product scenario is required.

### PTU-10 — Archive IDs

Add to test-plan §12:

> Traceability uses the IDs in `specification.md` only. Archive §9.1 numbers are not interchangeable with those IDs.

---

## Risks, assumptions, PO decisions, open questions

### Risks

- **False headless pass.** Core tests run under jsdom, happy-dom, Vitest browser mode, xvfb, or Electron, and the log is still filed as M0-NFR-003 evidence.
- **CI swallow.** `continue-on-error`, a non-required job, or a success script that does not include type checking or lint makes M0-AC-007 look green. One red unit test does not prove the other checks are wired.
- **Docs and CI diverge.** Local verification runs the boundary check; CI runs a shorter script. M0-AC-003 and M0-NFR-001 then disagree.
- **Shell portability.** PowerShell 5.1 will not run a documented `&&` chain. The failure appears as a setup problem, not as a failed test, and is easy to "fix" with an undocumented manual step.
- **Probe handling.** The deliberate failure is left on the default branch, skipped, or never built by CI because only the green squash commit is tested. Any of those misses M0-AC-004.
- **Archive ID mix-up.** Implementing superseded archive M0-AC-002, or ignoring operational M0-FR-003, M0-FR-008, and M0-FR-009 because they were not in §9.1.
- **Single tsconfig or main-process core.** TypeScript-everywhere or Electron looks simple and makes M0-NFR-002 unenforceable. See stack notes.
- **FFI tested only through mocks.** Rust tests never run in CI, while a TypeScript mock stands in for M0-AC-006.
- **Webview smoke on the wrong engine.** A Chromium dev-server test is reported as desktop launch evidence.
- **Security control removed to ease automation.** Sandbox, context isolation, or a production remote-debugging port changed for Playwright. That is a security regression, not a test fix.
- **Scope creep from §9 examples and archive §11.** Visual regression, benchmark storage, and format goldens land in Module 0 and become fake gates.
- **GPU on the startup path.** Machines without a usable GPU cannot complete documented setup, which fails M0-NFR-001 for a module that does not yet render.
- **Design intent missing at the end.** Implementation finishes and only then discovers M0-AC-012 has nothing approved to be reviewed against.
- **Clean image that is not clean.** CI has global toolchains the docs never mention, so the pipeline stays green while a reviewer cannot reproduce the build.

### Assumptions

- Operational `specification.md` and `test-plan.md` are the requirements. This review does not import archive acceptance text.
- "Where applicable" for type checking, linting, and formatting means the architecture names the tools or explicitly records that the stack has none. Formatting is in the Module 0 scope list ("where appropriate") but is not required by M0-FR-004 unless the Tech Lead includes it in verification. If it is included, M0-NFR-004 applies to it.
- A placeholder module satisfies "a boundary may initially contain minimal code." Tests will not demand a scene graph, a file format, or a renderer.
- The M0-AC-006 assertion matches the public core entry the architecture defines. Quality engineering does not predefine that API.
- Core may expose persistence and rendering interfaces. Concrete filesystem modules and concrete renderers stay outside core. This reading of M0-FR-003 plus M0-NFR-002 is an assumption for the Tech Lead to confirm in the ADR. The explicit NFR-002 denylist (shell, browser UI, UI-framework components, platform filesystem APIs) is not an assumption; it is already specified.
- NFR-010 is met by repeatable documented commands and the NF-001 record. It does not mandate benchmark storage.
- The primary development OS is not decided. Inspection of this review happened on Windows. That fact does not make Windows the product's primary environment.
- No numeric performance threshold and no browser support matrix exist for Module 0. None are added here.
- Security verification content is owned by the Application Security Engineer (§7). This review only keeps M0-NFR-009 and M0-AC-011 from having no named path.
- Design judgment is owned by the Product Designer (§6). Functional tests will not score visual quality.

### Decisions requiring the Product Owner

Functional quality does not ask the Product Owner to change any Module 0 acceptance criterion. A stack that cannot run core tests without a window fails the current spec. The remedy is to change the architecture, not the criterion. A waiver of M0-NFR-003, M0-AC-005, or M0-AC-006 would be a product requirement change and is not recommended.

The Product Owner already has to authorize READY FOR DEVELOPMENT and later module approval. These preparation items need a Product Owner decision because they change what evidence means or what the shell is allowed to be:

- Approve the architecture proposal, including language, shell, and primary supported development environment. Those choices define which clean environment M0-AC-001 and TP-M0-NF-001 must use. They are already listed as architecture decisions requiring Product Owner review.
- Approve the Module 0 design intent that M0-AC-012 reviews against, once the Designer proposes it. Without an approved intent, the design criterion cannot pass later. This review does not invent that intent.
- Decide, only if the architecture proposal asks, whether Module 0 CI must launch a graphical shell on more than the primary development environment. The current criteria do not require that. Expanding CI to a multi-OS GUI matrix would be new scope.

No other Product Owner decision is required to accept this test strategy.

### Open questions

For the Tech Lead, before implementation:

- Are the six M0-FR-003 areas separate packages or crates, or one tree with import rules? Packages and crates are enforceable. A single tree needs dependency-cruiser-class path rules or it has no automated boundary.
- Which type checker and linter apply, or is the explicit answer that a given stack has none? That statement is what "where applicable" refers to.
- What is the public core entry M0-AC-006 will import, and what is the startup diagnostic string TP-M0-F-004 will recognize? Both must be specified by architecture or shell design, not by the test author.
- Is controlled initialization failure a fake platform port (recommended) or a documented bad local configuration? Either can work. A production backdoor flag is not acceptable.
- Will one CI verification job wrap tests, type checking, and lint, or will they be separate required jobs? Separate jobs need their own failure evidence.
- Can CI provide one display-less run of `test:core`? If not, headless evidence stays the weaker record described above and must be labeled as such.
- If the shell is a system webview, which runtime does a clean primary-environment machine need, and is that runtime already named in the prerequisites? Unnamed runtimes fail M0-NFR-001.
- Does any Module 0 spike touch the network or a GPU? Spikes must stay identified as spikes and must stay out of the required verification path.

For the Product Designer:

- What is the minimum visible shell, so a launch check has a ready signal that is not an editor control? A documented startup diagnostic plus a visible shell window is enough for Module 0. The diagnostic text needs to be designed, not improvised in a test.

For DevOps, coordinated with this strategy:

- Which CI service and OS image count as the clean environment, and are every preinstalled tool and version listed in developer documentation?
- How long are verification logs retained so the red probe and the green rerun still exist at Product Owner review?

For the Application Security Engineer:

- Confirm the trust boundary of the test-only platform fake and, if anyone later proposes WebView2 CDP or an Electron debug port, that the port cannot ship in the non-test shell. This review does not approve that port.

### Readiness note

The three IDs with no draft-plan path are M0-FR-008, M0-NFR-006, and M0-NFR-007. PTU-6 and PTU-9 are the proposed paths. Incomplete IDs, especially M0-FR-003 and M0-NFR-002, are not ready to implement against until PTU-5 is accepted or replaced with an equivalent automated denylist. Until then, a review-only reading of TP-M0-I-002 will miss the next violating import and can miss a missing boundary entirely.

This review should be treated as the functional test approach for preparation. It becomes the operational approach only when the Tech Lead folds the accepted PTUs into `test-plan.md` or records an equivalent update. Developers should not implement a permanent failure-propagation test, a visual-regression harness, or a benchmark store from this document.

# Architecture

**Status:** Approved for the binding Module 0 decisions.  
**Date:** 2026-10-02  
**Owner:** Tech Lead  
**Module:** 0 — Engineering Foundation

The Human Product Owner approved the binding Module 0 architecture on 2026-10-02, including ADR-0001 through ADR-0008 and the four confirmations in this document. The approval is https://github.com/ericrommel/universal-editor/pull/2#issuecomment-5956211119. Revisitable direction and deferred items stay open. That approval authorizes development of the binding scope once the work item enters Ready for Development. It is not module acceptance and it is not GREEN.

This document is the Module 0 architecture. Major decisions are recorded in `/docs/engineering/adr/`. Specialist inputs are in `/docs/modules/module-00-foundation/preparation/reviews/`. Those reviews are evidence and recommendations. This document is the decision.

No production application code is part of this document.

## Operational record

Work status for Module 0 is GitHub issue [#1](https://github.com/ericrommel/universal-editor/issues/1) and the Universal Visual Creation Platform project board. This document does not record the current board column.

## Authority

Normative for this architecture:

- `docs/product-overview.md`
- `docs/engineering/development-process.md`
- `docs/modules/module-00-foundation/specification.md`
- `docs/modules/module-00-foundation/test-plan.md`

`docs/archive/product-engineering-specification-v1.0.md` is long-term context. It does not authorize later modules, and it does not override the operational Module 0 specification. Archive Module 0 identifiers are not the same as the operational identifiers.

## Decision classes

Product Owner review of the architecture proposal asked that later-module assumptions not be written as binding architecture. Every decision in this document and in ADR-0001 through ADR-0008 uses one of these labels.

**Binding for Module 0.** Required to implement and verify this module. A change during Module 0 implementation needs an ADR revision.

**Revisitable direction.** Analysis the foundation should not accidentally close. A later module may replace it when that module has requirements and evidence. It is not a commitment to build that shape.

**Deferred.** Not decided.

### Binding for Module 0

| Topic | What this module implements | Record |
| --- | --- | --- |
| Language of this module's code | TypeScript for the packages Module 0 creates | ADR-0001 |
| Foundation screen | Client-side React. No component library, router, or scene ownership | ADR-0002 |
| Rendering boundary | Snapshot value and null renderer. No GPU library and no canvas | ADR-0003 |
| Shell | Loopback Vite app and a static build with a relative base. No Electron, Tauri, or native GPU stack | ADR-0004 |
| Domain code present now | `DomainError` and finite-number canonicalizers | ADR-0006 |
| Persistence present now | Provisional manifest codec and entry-name checks. Not a public format | ADR-0006 |
| Editor state present now | Startup session only. No viewport API | ADR-0008 |
| Workspace and CI | pnpm, project references, Biome, `node:test`, GitHub Actions | ADR-0005 |
| Trust boundary | Web-shell controls, locked installs, secret-free CI, permissive license rule | ADR-0007 |

### Revisitable direction

- Module 0 domain code stays free of React, a renderer, and filesystem APIs, so later domain code can be tested without a window. The language of a later authoritative scene is not decided.
- The Module 0 UI and null renderer do not hold a second document. The concrete scene model is not decided.
- The Module 0 snapshot is size, device-pixel ratio, an sRGB clear, and an empty draw list. That is the test double, not a permanent renderer API. WebGPU, WebGL2, and a native surface were compared and none is selected.
- ADR-0004 records studied desktop hosts. It does not select one. Module 0 only refuses to add a desktop host now.
- A manifest plus a document plus assets was compared with other containers. No container is selected.
- Inverse patches in editor memory were compared with other undo shapes. No undo strategy is selected.
- Module 0 has one UI package because it has one screen. That does not decide the toolkit of a later desktop host.
- A Python sidecar that exchanges validated bytes is a studied integration shape. No protocol is selected.

### Deferred

Scene schema, coordinate conventions, one scene or several, public format identity, container and hand-editing, undo, selection persistence, product graphics API, desktop viewport host, macOS distribution channel, browser-support matrix, reference hardware, product license, copyleft exceptions, and telemetry. Each waits for the module that has the requirements and the evidence.

## 1. Primary language

Binding: the packages Module 0 creates are TypeScript, types erased, and the headless packages run under Node's test runner with no browser and no DOM.

Rust, C# / Blazor, and Python were evaluated as the language of this module and rejected for Module 0. Each would add a second runtime before this module has a scene that needs one. That rejection does not choose the language of a later authoritative scene. Moving that scene to another language, or replacing these packages, is a new ADR when rendering, performance, desktop, and domain evidence exists. A later measured numeric function may still move behind a narrow boundary without that being a language decision for the scene. See ADR-0001.

## 2. UI framework

Binding: client-side React paints the foundation screen. It does not own scene state, schedule frames, or draw a viewport. There is no Next.js, no server components, no router, and no third-party component library.

Solid is the realistic alternative and is not adopted for this screen. Svelte and a fully vanilla shell were also rejected for Module 0. Whether later editor chrome stays on React is revisitable. See ADR-0002.

## 3. Rendering technology

Binding: Module 0 implements a snapshot value and a null renderer. The null renderer records pixel size, device-pixel ratio, an sRGB clear color, and an empty draw list. It does not open a window or request a GPU. Three.js, Babylon.js, and `wgpu` are not Module 0 dependencies.

The null renderer is not a second product document. The scene model and the product renderer are not decided. See ADR-0003.

## 4. Graphics API comparison

Deferred. Module 0 implements no graphics backend.

WebGPU, WebGL2, and a native surface were compared on 2026-10-02 so the Module 0 shell would not treat a system webview as a portable GPU viewport. That comparison is evidence. It is not a selection. See ADR-0003 and ADR-0004.

## 5. Desktop host

Binding: Module 0 launches a Vite dev server bound to loopback and a static production build of the same UI. The static build uses a relative base. No Node native addon is introduced. Filesystem access stays out of core and out of the Module 0 shell. Electron, Tauri, and a native GPU library are not Module 0 dependencies.

Desktop remains a product target. Module 0 does not package it. Which host presents a later viewport is deferred. ADR-0004 keeps the comparison. See ADR-0004.

## 6. Scene and domain direction

No scene is implemented in Module 0.

Binding code is `DomainError`, `canonicalizeFiniteNumber`, and `canonicalizeFiniteTriple`. Finite numbers pass. `-0` becomes `0`. `NaN`, infinities, and non-numbers throw `NON_FINITE_NUMBER`. There is no scene type, no vector library, and no id generator. Core does not read a clock, a random source, or the filesystem.

A single plain-data hierarchy is revisitable direction taken from the product principles. It is not a schema. See ADR-0006.

## 7. Editor state

Three owners in Module 0:

| State | Owner | Module 0 |
| --- | --- | --- |
| Domain document | `core` | Not present |
| Editor session | `editor` | `starting`, `ready`, `failed` |
| Ephemeral widget state | `ui` | Details disclosure only |

The shell creates the editor, runs startup, and passes plain view-model values into the UI. UI does not import core or editor. Editor does not import React. Module 0 has no selection, tool, panel, undo stack, or viewport-attach API. Whether a later module persists any of those is deferred. See ADR-0008.

## 8. Persistence

Binding: a closed provisional manifest codec and pure entry-name checks. Canonical bytes are exactly:

```text
{"formatId":"universal-visual-creation-project","schemaVersion":1}
```

Those bytes are the Module 0 test contract. `formatId` is not a public format promise. Module 0 has no save command, file extension, zip library, migration, or scene document. Malformed manifests are rejected whole.

A manifest plus a document plus asset entries was compared with one JSON file, SQLite, and a custom binary document. No container is selected. See ADR-0006.

## 9. Undo direction

Not built in Module 0, and no undo API is added.

Inverse patches in editor memory, full-document snapshots, and an event log were compared so the Module 0 manifest would not be mistaken for a history log. No undo strategy is selected. See ADR-0006.

## 10. Repository structure

pnpm workspace, packages private, scope `@uvcp/*`. Nothing is published.

```text
apps/shell/            Vite application. Composition root.
packages/core/         Domain helpers. No I/O.
packages/persistence/  Manifest codec and entry-name rules.
packages/editor/       Startup session.
packages/rendering/    Snapshot port and null renderer.
packages/platform/     Host boundary. No capability in Module 0.
packages/ui/           React foundation screen, tokens, and strings.
scripts/               verify, boundary check, license check.
```

`apps/shell` is the only launchable application. There is no `apps/desktop` in Module 0.

Allowed imports:

| From | May import |
| --- | --- |
| `core` | nothing in the workspace |
| `persistence` | `core` |
| `platform` | nothing in the workspace |
| `rendering` | `core` |
| `editor` | `core`, `persistence` |
| `ui` | nothing in the workspace |
| `shell` | `ui`, `editor`, `platform` |

No cycles. A type-only import counts. A test import counts. `editor` must not import `ui`, React, `rendering`, or `platform`. `rendering` must not import `ui`, `editor`, `platform`, or a GPU library. `shell` must not import `core`, `persistence`, or `rendering` directly; startup goes through `editor`.

These edges are enforced by package manifests, TypeScript project references, and `scripts/check-boundaries.mjs`. A forbidden import fails `pnpm verify`. See ADR-0005.

A later viewport module must amend this table in a new ADR before `editor` may call the renderer.

## 11. Build tooling

- Node.js 24 LTS, patch pinned in `.node-version` on implementation day. Node 24 enters Maintenance LTS on 2026-10-20 and is supported until 2028-04-30. Do not track Current (Node 26) as "latest".
- pnpm 12.8.1 or a later 12.x patch chosen on implementation day, pinned in `packageManager`. The pin must be a release that still contains the integrity fix for CVE-2026-50021 (fixed in pnpm 10.34.1 and 11.4.0; do not choose an older 10.x or 11.x). Enable that exact pnpm with Corepack. Do not install it with an unpinned `curl` script, and do not add a root `install` lifecycle script. CI uses `pnpm install --frozen-lockfile`, not `pnpm ci`, until pnpm issue 15276 is confirmed fixed for that patch.
- TypeScript project references and `tsc -b`. Packages executed by `node --test` set `erasableSyntaxOnly`, so Node can strip types without a second transform. `packages/ui` and the shell entry contain JSX, which is not erasable, so they do not set that flag. Vite bundles them. `tsc` remains mandatory for every package. Node does not type-check.
- Vite for `apps/shell` only.
- Biome for format and lint, one config. ESLint plus Prettier was the alternative and is not adopted.
- No Turborepo, Nx, or remote cache.

Root commands:

| Command | Behavior |
| --- | --- |
| `pnpm install` | Install from the lockfile. CI adds `--frozen-lockfile`. |
| `pnpm dev` | Loopback shell. This is the documented launch for M0-AC-002. |
| `pnpm start` | Alias of `pnpm dev`. |
| `pnpm build` | Libraries and static shell assets. No installer. |
| `pnpm test` | Headless `node --test` for every `*.test.ts` and `*.test.mjs` file outside dependency, build, and declaration output. Another test suffix fails the command. Must not start Vite or open a window. |
| `pnpm verify` | The single verification entrypoint. |

`pnpm verify` runs, in order, and returns the first non-zero exit: boundary check, `tsc -b`, Biome, license check, `pnpm audit --audit-level=high`, `pnpm test`, `pnpm build`, headless preview smoke. The smoke requests `/` from the Vite preview server with Node. HTTP 200 with the production content security policy is build evidence only when the served document, script, and stylesheet are the built files, those files contain the foundation copy and palette, and the build contains neither a canvas element nor the dev failure switch. It is not the graphical launch.

## 12. Unit testing

Node's built-in test runner and `node:assert`. No Vitest, Jest, jsdom, or happy-dom in Module 0.

Required headless coverage:

- numeric canonicalization, including rejection of non-finite values
- manifest round-trip, rejection cases, and hostile entry names
- editor startup success and injected initialization failure
- null renderer result for a fractional device-pixel ratio
- one editor test that imports `core` and `persistence` without importing `ui` or starting a shell

Vitest is the alternative if a later module needs component tests. It is not justified while the shell has no DOM tests.

## 13. Integration testing

The cross-package editor test above is the Module 0 integration test. It runs in the same headless command. Playwright and Cypress are not integration harnesses for this module.

## 14. UI and end-to-end testing

No browser automation in Module 0. Graphical launch is a documented manual step on the primary development environment: run `pnpm dev`, confirm the foundation screen reaches Ready, and confirm the dev-only failure path shows Not ready.

Playwright was evaluated and deferred. It downloads a browser, and a Chromium smoke would not be evidence of a desktop webview. The test plan's design review covers the screen.

## 15. Visual regression

No screenshot diff, GPU golden image, or baseline PNG in Module 0. Shell screenshots may later be design evidence. They are not a CI gate. GPU image comparison waits until a module draws a scene, and even then scene correctness is a CPU test of the snapshot. See ADR-0003.

## 16. CI

GitHub Actions on the existing remote `ericrommel/universal-editor`. One workflow, `pull_request`, `push` to `main`, and `workflow_dispatch`. Do not use `pull_request_target`.

Permissions: `contents: read` only.

Runners: `ubuntu-24.04` and `windows-2025`. Pin those labels. Do not use `ubuntu-latest` or `windows-latest`. No macOS runner in Module 0. `macos-14` is retiring and must not be copied from examples.

Both jobs run the same install and `pnpm verify`. `fail-fast: false`. A failed verify fails the job. Artifact upload uses `if: always()` and must not hide that failure. Actions are pinned to commit SHAs. No repository secrets.

Job timeout: 30 minutes. This is a hang guardrail, not a performance target. If the first cold run on the approved stack exceeds it, raise it in the same change that records the baseline and name the step that required it. The headless startup spawn uses a 60-second harness timeout for the same reason.

Pipeline timings are observations. The implementation records one cold local Windows run and one cold Windows CI run at `docs/modules/module-00-foundation/evidence/m0-pipeline-baseline.json` with `kind: observation`. The numbers are not pass/fail thresholds.

Dependabot opens weekly pull requests for npm and GitHub Actions. It does not merge them.

## 17. Logging and diagnostics

Diagnostic records are single-line JSON. Required event names: `startup.beginning`, `startup.ready`, `startup.failed`.

Fields: `event`, `shell` (`browser`), `version` (`0.0.0`), `step`, and on failure an application error code and message. No environment dump, no tokens, no file contents, no WebGPU adapter or limits, no telemetry, and no raw value of `UVCP_FORCE_INIT_FAILURE`. The step id `forced-initialization-failure` is the failure signal.

The headless composition script writes these lines to stderr and exits non-zero on failure. The browser shell writes the same records with `console.error` and shows the matching status on screen. A window by itself is not evidence of startup.

Initialization failure in tests is an injected initializer at the composition root. The production static build has no failure switch. `pnpm dev` honors `UVCP_FORCE_INIT_FAILURE=1` and rejects any other non-zero value. That variable is not compiled into the production bundle. The preview smoke fails if a built file contains the variable name, the dev-only step id `forced-initialization-failure`, or `INVALID_INITIALIZATION_VALUE`.

## 18. Dependency boundaries

Section 10 is the rule. M0-NFR-002 is enforced by the boundary script, not by review alone. Core and persistence must not import React, a desktop SDK, DOM or browser UI types, `node:fs`, or `node:path` used as I/O. Platform-specific behavior, when it eventually exists, crosses `platform`. Module 0 platform code has no filesystem or network API.

## 19. Future Python or backend integration

Deferred. Module 0 does not import Python and does not build a port, socket, or protocol.

Pyodide and an embedded CPython were rejected as the Module 0 runtime. A sidecar that submits bytes for validation is revisitable direction, not a selected integration. See ADR-0001 and ADR-0006.

## 20. Cross-platform build and release

Module 0 does not distribute. The conditions that keep a later release possible:

- core, editor, rendering, and persistence have no DOM, React, `node:fs`, Electron, or Tauri imports
- the shell production build is static files with a relative base
- the only host linked in Module 0 is the browser
- source and workflows use LF and case-sensitive paths
- one private version field, `0.0.0`
- CI is an OS matrix of the same steps, so a macOS job can be added later without a new pipeline design

Web hosting, installers, signing, notarization, and auto-update are out of scope.

## 21. Apple and macOS distribution

Not executed in Module 0. No Apple secret, certificate, or runner.

The macOS channel is deferred. Direct Developer ID distribution and the Mac App Store were both identified. They are not interchangeable: the store channel adds the App Sandbox. New Developer ID certificates must use the G2 intermediate; the previous Developer ID intermediate expires on 2027-02-01 (Apple notice, 2026-10-01). Neither channel is selected.

Filesystem I/O stays out of core and persistence in Module 0, which leaves both channels possible. The Product Owner chooses a channel before any Mac build is signed, not before Module 0.

The shell follows the Module 0 design intent for contrast, text size, reduced motion, and system chrome. It does not claim App Store readiness. See the design review cited below.

## 22. Security and trust boundaries

Module 0 introduces a developer install, CI, a loopback shell, and a log stream. It does not open project files, assets, network services, AI output, plugins, or scripts. Those are named future boundaries and are not implemented.

The shell is the web-only option from the security review, with these conditions:

- Vite binds to `127.0.0.1`, not all interfaces
- the page is a secure context on loopback
- no remote script, font, or frame
- no service worker
- production content security policy is `default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`
- the dev server may allow a same-origin WebSocket for Vite HMR only; that exception is not in the production policy
- no companion process and no native GPU fallback
- dependency build scripts are denied except a named `allowBuilds` entry. `esbuild` may be allowed if Vite requires it. Nothing else is pre-approved
- public npm registry only; pnpm's default `minimumReleaseAge` and `blockExoticSubdeps` stay on
- licenses of resolved packages must be on the allow-list in ADR-0007
- CI has no secrets and does not use `pull_request_target`

See ADR-0007. The threat model in the security review remains the Module 0 threat model. Its blocking findings are resolved for preparation by the decisions in that ADR. The implementation review is `docs/modules/module-00-foundation/evidence/security-review.md`. It records no blocking finding. That review is not Product Owner approval.

## 23. Technical risks

| Risk | Mitigation in this proposal |
| --- | --- |
| A later module puts the document inside a renderer or UI framework | Module 0 does not take that dependency. Choosing it later is a new ADR, not a decision already made here. |
| A desktop host is chosen before a viewport exists | Module 0 adds no desktop host. ADR-0004 keeps the comparison and does not select one. |
| Module 0 TypeScript is read as the permanent scene language | ADR-0001 binds TypeScript for this module's packages only. The later scene language is deferred. |
| `JSON.stringify` becomes the project writer | The Module 0 writer emits one closed byte string. Non-finite numbers are rejected, not written as `null`. |
| The manifest bytes are mistaken for a public format promise | `formatId` is provisional until a user-facing save exists. |
| Import rules are documented and not enforced | The boundary script is part of `pnpm verify`. |
| CI swallows a failure | One `verify` command, no `continue-on-error` on that step. The deliberate red run is specified in the test plan. |
| An env dump lands in startup logs | The diagnostic field list is closed. |
| pnpm 12 `pnpm ci` runs scripts anyway | CI uses `pnpm install --frozen-lockfile` until issue 15276 is confirmed fixed. |
| Windows-primary is read as dropping Linux, macOS, or Web | The product targets are unchanged. Windows is the Module 0 documented development environment only, and only if the Product Owner confirms it. |
| The dev failure variable ships in production | It is honored only by the dev server. The static build ignores it. |

## Design intent

`docs/modules/module-00-foundation/preparation/reviews/product-design.md` is the Module 0 design intent for M0-FR-009, M0-NFR-008, and the later M0-AC-012 review.

Adopted as written, including the foundation screen, the exact strings, the light and dark color roles, the type and space scales, the 4.5:1 text contrast target, the 3:1 non-text target, system appearance with a light fallback, and the absence of an editor frame.

Amendments:

- The shell has no viewport, canvas, toolbar, hierarchy, or frame probe. The editor review's viewport-first frame is not adopted. A later viewport is deferred. ADR-0008 does not specify its API.
- `UVCP_FORCE_INIT_FAILURE` is not a control on the screen.

The native window title is `Foundation`. The on-screen heading is `Universal Visual Creation Platform`. There is no icon asset and no placeholder logo.

## Primary development environment

Confirmed by the Product Owner on 2026-10-02:

- Documented setup, local build, `pnpm dev`, and local verification evidence: 64-bit Windows on x64.
- Manual launch browser for that evidence: current Microsoft Edge or current Google Chrome. One of them is enough. Record which one was used. Firefox, Safari, and other browsers are not Module 0 launch evidence. This is not the product browser-support matrix.
- Required CI: `windows-2025` and `ubuntu-24.04`.
- The Linux job is a headless coupling check. It is not a claim that Module 0 delivers a Linux desktop.
- macOS, browser matrices, GPU runners, and installers are deferred.
- Product targets remain Web, Windows, macOS, and Linux.

Record the actual Windows edition and build in the reproducibility evidence. Do not invent a minimum build in advance.

## What Module 0 builds

- The workspace, lockfile, pins, and the seven boundaries above.
- The core numeric helpers and the persistence manifest codec, with headless tests.
- Editor startup, the diagnostic records, and the headless composition script.
- The null renderer and its data test.
- The React foundation screen and the loopback Vite shell.
- `pnpm verify`, GitHub Actions, Dependabot, the license check, and the high-severity audit.
- Developer documentation of prerequisites and the commands in section 11.
- The pipeline baseline file, written from a real run during implementation, not estimated here.

## What Module 0 does not build

- A scene graph, objects, selection, tools, undo, gizmos, or a project writer.
- A canvas, WebGPU context, shader, Three.js, Babylon.js, `wgpu`, or Dawn.
- Electron, Tauri, Rust, WebAssembly, or a second shell.
- Playwright, Cypress, visual-regression baselines, or a performance threshold.
- Signing, notarization, update feeds, telemetry, or a product `LICENSE` grant.
- A docking layout or a non-functional mock of the future editor.
- Any requirement or acceptance-criterion change.

## Verification

The test plan now names a path for every operational Module 0 FR, NFR, and AC. Tooling in this proposal is what "where applicable" means for type checking and lint:

- Type checking applies: `tsc -b`.
- Lint and format apply: Biome.
- Automated tests apply: `node --test`.
- Graphical launch and design review are manual on the primary environment.
- Security and architecture justification are reviews against ADR-0007, this document, and the ADRs.

The deliberate failing test for M0-AC-004 is a short-lived branch, never the approval commit. Procedure: test plan, TP-M0-F-003.

## Resolved disagreements

| Topic | Positions | Decision |
| --- | --- | --- |
| Viewport in the Module 0 shell | Editor: mount a host element and a frame probe. Designer: no viewport and no editor frame. Rendering: no canvas and no GPU probe. | Binding for Module 0: no viewport and no canvas. A later handoff is deferred. |
| Who may import whom | Core forbade UI from importing editor and allowed editor to import UI. Editor forbade editor from importing React and wanted UI to hold an editor client. DevOps allowed several wider edges, including UI to core. | Shell passes a plain view model. UI imports no workspace package. Editor imports core and persistence only. |
| Desktop host | Rendering prefers Electron later and rejects Tauri as the only GPU viewport. Security's privilege order is web, then conditional Tauri, then conditional Electron, and blocks a native GPU fallback in Module 0. DevOps would not decide in Module 0 and leans Tauri if forced. | Binding for Module 0: web shell only, no desktop dependency. The later host is deferred. The comparison stays in ADR-0004 and is not a selection. |
| Failure injection | Non-functional quality: an environment variable and a non-zero process exit. Functional quality: a test double, not a shipped backdoor. | Injected initializer in tests and in the headless script. Environment variable only in `pnpm dev`. Absent from the production bundle. |
| Test runner | Editor suggested Vitest and Testing Library for chrome. DevOps and functional quality recommend `node:test` and no Playwright. | `node:test` only. |
| Persistence depth | Core: a real manifest codec. DevOps: an empty boundary is enough. | Codec and entry-name rules. No zip and no user save. |
| Vulnerability scanner | Security prefers OSV-Scanner and accepts `pnpm audit` for a JavaScript-only repo. | `pnpm audit --audit-level=high` only. Do not also fail the job on a second scanner. |
| `OR` licenses | DevOps would accept `MIT OR GPL-3.0-only` as MIT. The security proposal review blocked that rule (SEC-M0-B-008) because the same wording also admits AGPL, LGPL, SSPL, and BUSL. | An `OR` passes only when every disjunct is on the permissive list. Any copyleft identifier still needs Product Owner approval of that dependency. |

## Assumptions

- The operational specification is the Module 0 contract.
- Module 0 packages are TypeScript. That is not an assumption that every later host or the authoritative scene stays on this package.
- Module 0 does not persist editor session state, because the only session state is startup. Whether later session state is saved is deferred.
- No user projects exist, so Module 0 has no migration to perform. Hand-editing is not defined.
- The repository remote stays on GitHub. Actions availability was not queried against the GitHub API.
- External version and platform facts were checked by the specialist reviews on 2026-10-02. No shell had been built at that date. The shell on main is the loopback Vite application in sections 4, 5, and 10. Module 0 still does not launch a GPU process.
- React, TypeScript, Vite, and Biome are pinned to the exact versions that pass the license and audit checks on implementation day. This proposal does not invent patch numbers for them.
- Reference hardware and product performance workloads are not decided. They do not block Module 0. They block the first module that makes a product performance claim.
- Up-axis, handedness, rotation order, and degrees versus radians are deferred. They are not guessed here.

## Product Owner decisions

The Product Owner confirmed these four decisions on 2026-10-02. They do not lock a later module.

1. **Architecture.** ADR-0001 through ADR-0008 are approved for the binding column only. Requirements and acceptance criteria are unchanged. Revisitable direction and deferred items stay open.
2. **Primary development environment.** 64-bit Windows x64 is the documented setup and local-launch environment. Required CI is `windows-2025` and `ubuntu-24.04`. Manual `pnpm dev` uses current Microsoft Edge or current Google Chrome, and the evidence records which one. Web, Windows, macOS, and Linux remain the product targets. Module 0 does not implement all of them.
3. **Module 0 shell.** The shell is a loopback web shell. Electron, Tauri, and a native GPU stack are not part of Module 0.
4. **Design intent.** The foundation screen in the design review is confirmed: the heading `Universal Visual Creation Platform`; no icon in Module 0; system light/dark with a light fallback; the purpose sentence in that review. The window title `Foundation` is a purpose label, not a product name.

Not decided here. Notes under a bullet are analysis, not a selection:

- Application license. Module 0 does not add an open-source `LICENSE` grant.
- Any copyleft dependency. The Module 0 allow-list refuses it until the Product Owner approves that named dependency.
- Public format id, file extension, one file versus a folder, and whether hand-editing is supported.
- Undo, including whether history survives save and reopen.
- One scene per project or several. The overview describes a unified scene. Archive section 4.2 says one or more.
- Whether selection and panel layout are saved.
- Desktop viewport host and product graphics API. ADR-0004 records the comparison.
- Whether later desktop chrome reuses the Module 0 UI package.
- Language of the authoritative scene once rendering, performance, and desktop evidence exist.
- macOS channel, browser-support matrix, reference hardware, and telemetry.
- Repository settings only an admin can change: Actions enabled, and branch protection that requires the verify check. Not done in this proposal.

## Implementation breakdown

The order below is the breakdown for the approved binding scope. Work packages may proceed in parallel only where the dependencies allow it. The outcome of that breakdown is the implementation record after the table. The record is not module acceptance and not GREEN.

Each work package is implemented on its own branch and opened as a pull request linked to issue #1. That work is not committed directly to `main`.

| ID | Work | Depends on | Demonstrates |
| --- | --- | --- | --- |
| WP-0 | Workspace, pins, TypeScript references, Biome, boundary script, license script, `.gitattributes`, gitignore additions for key material | Authorization | M0-NFR-005, supply-chain baseline |
| WP-1 | `core` numeric helpers and `persistence` manifest codec, headless tests | WP-0 | M0-FR-002, M0-NFR-003, M0-AC-005, M0-AC-006 |
| WP-2 | `editor` startup, diagnostic records, headless composition script, injected failure | WP-1 | M0-FR-006 |
| WP-3 | `rendering` snapshot and null renderer, headless test | WP-0 | M0-FR-003 rendering boundary |
| WP-4 | `platform` marker, `ui` tokens and foundation screen, Vite shell bound to loopback | WP-2 | M0-FR-001, M0-FR-009, M0-AC-002 |
| WP-5 | `pnpm verify`, GitHub Actions, Dependabot, developer setup documentation | WP-1, WP-2, WP-3, WP-4 | M0-FR-004, M0-FR-005, M0-FR-007, M0-FR-008, M0-AC-001, M0-AC-003, M0-AC-007, M0-AC-008 |
| WP-6 | Short-lived failing-test branch, then removal. Record local and CI evidence. Record the pipeline baseline from real runs. | WP-5 | M0-AC-004, M0-NFR-004, M0-NFR-010 |

WP-1 and WP-3 may proceed together after WP-0. WP-2 waits until the core and persistence exports it imports exist. WP-4 waits for editor startup. WP-6 is evidence, not a feature, and its red commit is not merged.

## Implementation record

The binding decisions in this document are unchanged. Main implements that scope as follows.

| ID | Outcome |
| --- | --- |
| WP-0 | On main. Workspace, pins, TypeScript references, Biome, boundary check, and license check. |
| WP-1 | On main. Core numeric helpers and the provisional manifest codec, with headless tests. |
| WP-2 | On main. Editor startup, diagnostic records, the headless composition script, and injected failure. |
| WP-3 | On main. Null renderer snapshot. It records a fractional device-pixel ratio and does not request a GPU. |
| WP-4 | On main for the foundation screen and the loopback shell. `@uvcp/platform` is the host boundary and has no capability. `packages/platform/src/index.ts` has no runtime export. The shell declares the dependency and does not import it, because Module 0 has no host call to make. |
| WP-5 | On main. `pnpm verify` runs the boundary check, `tsc -b`, Biome, the license check, `pnpm audit --audit-level=high`, `pnpm test`, `pnpm build`, and the loopback preview smoke. GitHub Actions runs that command on `ubuntu-24.04` and `windows-2025`. Dependabot opens weekly pull requests and does not merge them. |
| WP-6 | Evidence, not a feature. The pipeline baseline is `docs/modules/module-00-foundation/evidence/m0-pipeline-baseline.json` with `kind: observation`. The durations are not pass/fail thresholds. The candidate failure probe is draft pull request 28. Its red commit is not merged. |

`pnpm dev` is the documented launch. The headed browser record is `docs/modules/module-00-foundation/evidence/launch/`. The preview smoke is build evidence and is not that launch.

## Definition of Ready

| Ready condition | State |
| --- | --- |
| Objective, scope, and out-of-scope behavior | Met by the operational specification. Unchanged. |
| Dependencies on earlier modules | None. |
| Stable FR, NFR, and AC identifiers | Met. Unchanged. |
| Test approach for every identifier | Met by the updated test plan plus this proposal. |
| Design behavior defined | Met. The Product Owner confirmed the design review on 2026-10-02. |
| Test infrastructure defined | Met. Listed in the test plan and in ADR-0005. |
| Blocking security findings for preparation | Addressed by ADR-0007. Implementation evidence is still required later for M0-AC-011. |
| Blocking architectural decisions for Module 0 | Met for the binding column. Revisitable direction and deferred items stay open. |
| Product ambiguities that block Module 0 | Met. The four confirmations are recorded above. Deferred items are not Module 0 gates. |
| Product Owner authorizes implementation | Met for the binding scope, by the 2026-10-02 approval, once the work item enters Ready for Development. This row is not module acceptance and not GREEN. |

## ADR index

| ADR | Title |
| --- | --- |
| 0001 | TypeScript for Module 0 |
| 0002 | React for the Module 0 foundation screen |
| 0003 | Module 0 render boundary |
| 0004 | Module 0 web shell |
| 0005 | Workspace, build, and verification |
| 0006 | Module 0 domain helpers and provisional manifest |
| 0007 | Module 0 trust boundaries |
| 0008 | Editor state and shell content |

## Specialist inputs

| Role | Review |
| --- | --- |
| Senior Core / Platform Engineer | `preparation/reviews/core-platform.md` |
| Senior 2D / Editor Engineer | `preparation/reviews/editor-2d.md` |
| Senior 3D / Rendering Engineer | `preparation/reviews/rendering-3d.md` |
| Senior Product Designer / UX Architect | `preparation/reviews/product-design.md` |
| Functional Quality Engineer | `preparation/reviews/functional-quality.md` |
| Non-Functional Quality Engineer | `preparation/reviews/non-functional-quality.md` |
| Senior DevOps / Platform Engineer | `preparation/reviews/devops-platform.md` |
| Senior Application Security Engineer | `preparation/reviews/application-security.md` |

The Tech Lead dispositions in this document override conflicting recommendations in those reviews.

Second-pass reviews and their results are indexed in `docs/modules/module-00-foundation/preparation/README.md`.

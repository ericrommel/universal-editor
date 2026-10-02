# Architecture

**Status:** Proposed. Not approved.  
**Date:** 2026-10-02  
**Owner:** Tech Lead  
**Module:** 0 — Engineering Foundation, architecture preparation only

The Human Product Owner has not authorized implementation. Module 0 is **not** READY FOR DEVELOPMENT until that authorization is explicit.

This document is the Module 0 architecture proposal. Major decisions are recorded in `/docs/engineering/adr/`. Specialist inputs are in `/docs/modules/module-00-foundation/preparation/reviews/`. Those reviews are evidence and recommendations. This document is the decision.

No production application code is part of this proposal.

## Operational record

GitHub issue [#1](https://github.com/ericrommel/universal-editor/issues/1) and the Universal Visual Creation Platform project board are the operational record for this module. This document does not replace them.

Architecture preparation is at the Product Owner review gate. On that board the column for the gate is **Ready for PO**. There is no separate "Ready for PO Review" column. `PO Approval` stays **Pending** until the Human Product Owner decides. This proposal does not set **Ready for Development** or **Done**.

The repository changes are on branch `docs/m0-architecture-preparation` and are submitted through [pull request #2](https://github.com/ericrommel/universal-editor/pull/2). They are not a commit on `main`. Merging that pull request does not authorize implementation.

## Authority

Normative for this proposal:

- `docs/product-overview.md`
- `docs/engineering/development-process.md`
- `docs/modules/module-00-foundation/specification.md`
- `docs/modules/module-00-foundation/test-plan.md`

`docs/archive/product-engineering-specification-v1.0.md` is long-term context. It does not authorize later modules, and it does not override the operational Module 0 specification. Archive Module 0 identifiers are not the same as the operational identifiers.

## Decision summary

| Topic | Decision for Module 0 | Record |
| --- | --- | --- |
| Language | TypeScript for core, persistence, editor, rendering port, UI, and shell | ADR-0001 |
| UI | React for the foundation screen only | ADR-0002 |
| Rendering | Snapshot port plus a null renderer. No GPU, no engine | ADR-0003 |
| Desktop | Loopback web shell now. No Electron, Tauri, or native GPU library | ADR-0004 |
| Scene, persistence, undo | Direction only, plus a provisional manifest codec and numeric canonicalizer | ADR-0006 |
| Editor state | Startup session only. No viewport in the shell | ADR-0008 |
| Workspace and CI | pnpm, TypeScript project references, Vite, Node test runner, Biome, GitHub Actions | ADR-0005 |
| Security | Web-shell trust boundary, locked installs, secret-free CI | ADR-0007 |

## 1. Primary language

TypeScript, types erased, one package shared by the web shell and any later desktop host. The core runs under Node's test runner with no browser and no DOM.

Rust as the authoritative scene, C# / Blazor, and Python as the client core were evaluated and rejected for Module 0. A later measured numeric kernel may be replaced by WebAssembly behind a pure function. Moving the authoritative scene out of TypeScript is a new architecture decision, not an optimization. Python, if it appears at all, is a future sidecar that exchanges validated bytes. See ADR-0001 and ADR-0006.

## 2. UI framework

React, client-only, paints the foundation screen. It does not own scene state, schedule frames, or draw a viewport. There is no Next.js, no server components, no router, and no third-party component library.

Solid is the realistic alternative and is not adopted. Svelte and a fully vanilla shell were also rejected. See ADR-0002.

## 3. Rendering technology

The product scene, when it exists, is plain data in core. A renderer consumes a platform-neutral snapshot and does not keep a second scene graph. Three.js and Babylon.js are rejected as the product renderer. They are not Module 0 dependencies.

Module 0 implements only the port and a null renderer. The null renderer records pixel size, device-pixel ratio, an sRGB clear color, and an empty draw list. It does not open a window or request a GPU. See ADR-0003.

## 4. WebGPU strategy

WebGPU is the graphics API the future snapshot is aimed at. WebGL2 is the fallback backend, not the design center. Neither backend is implemented in Module 0.

A system webview is not an acceptable sole GPU viewport for Windows, macOS, and Linux together. WebKitGTK has no shipped WebGPU as of the 2026-09-16 WebKitGTK 2.54 notes, and Tauri documents Linux WebGL paths that can succeed without a usable GPU. Chromium-class WebGPU is the preferred future viewport host. A native `wgpu` surface behind UI chrome is the alternative if bundled Chromium is later rejected. Both are deferred. See ADR-0003 and ADR-0004.

## 5. Desktop strategy

Module 0 launches a Vite dev server bound to loopback and a static production build of the same UI. That is the minimal shell required by M0-FR-001 in the primary development environment.

Desktop remains a product target. Module 0 does not package it. The static build uses a relative base so a later thin host can load the same assets. No Node native addon is introduced. Filesystem access stays out of core and out of the Module 0 shell. See ADR-0004.

The future desktop viewport host is deliberately not locked by installing Electron or Tauri now. The ranking, when a later module actually presents a scene, is:

1. Hardened Electron, because one Chromium canvas keeps pointer input and WebGPU together, subject to the conditions in ADR-0007.
2. A native `wgpu` surface with the webview limited to chrome, only after a new security review. Module 0 forbids that native path.
3. A Tauri system webview as the viewport. Not recommended. It requires an explicit Product Owner acceptance that Linux has no production GPU viewport.

## 6. Scene and domain direction

There will be one authoritative scene. It is not implemented in Module 0.

When Module 1 is separately approved, the scene is plain data: nodes keyed by opaque id, parent order stored only as `childIds`, and a transform record. 2D and 3D are payloads in that one hierarchy. World matrices are derived. A renderer may cache GPU resources by id and must be able to rebuild them from a snapshot. It must not own hierarchy, lifetime, or persisted transforms.

Module 0 core contains only:

- `DomainError`, with a stable code and a short message
- `canonicalizeFiniteNumber` and `canonicalizeFiniteTriple`, which reject `NaN` and infinities and map `-0` to `0`

No scene type, no vector library, and no id generator. Core does not read a clock, a random source, or the filesystem. See ADR-0006.

## 7. Editor state

Three owners:

| State | Owner | Module 0 |
| --- | --- | --- |
| Domain document | `core`, later | Not present |
| Editor session | `editor` | `starting`, `ready`, `failed` |
| Ephemeral widget state | `ui` | Details disclosure only |

The shell creates the editor, runs startup, and passes plain view-model values into the UI. UI does not import core or editor. Editor does not import React. There is no selection, tool, panel, undo stack, or viewport-attach API in Module 0. Those future session facts stay out of the document. See ADR-0008.

## 8. Persistence strategy

The long-term project is a logical package: a manifest, a domain document, and asset entries addressed by id. The user-facing container recommended for later is one zip file of that package. SQLite, a single JSON project file, and a custom binary document were rejected as the working format. None of the container is built in Module 0.

Module 0 persistence implements a closed manifest codec and pure package-entry name checks. Canonical manifest bytes are exactly:

```text
{"formatId":"universal-visual-creation-project","schemaVersion":1}
```

`formatId` is provisional until the Product Owner confirms it, and until a user-facing save exists. Module 0 has no save command and no file extension. Migrations, zip reading, and scene JSON wait. Malformed manifests are rejected whole. See ADR-0006.

## 9. Undo direction

Not built in Module 0. The later shape is an immutable document and `apply(document, operation) -> { document, inversePatch }`, with undo and redo stacks held in editor session memory. The project file stores the committed document, not the history. Full-document snapshots and event sourcing as the file format were rejected as the default. See ADR-0006.

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
| `pnpm test` | Headless `node --test`. Must not start Vite or open a window. |
| `pnpm verify` | The single verification entrypoint. |

`pnpm verify` runs, in order, and returns the first non-zero exit: boundary check, `tsc -b`, Biome, license check, `pnpm audit --audit-level=high`, `pnpm test`, `pnpm build`, headless preview smoke. The smoke requests `/` from the Vite preview server with Node. HTTP 200 is build evidence. It is not the graphical launch.

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

Initialization failure in tests is an injected initializer at the composition root. The production static build has no failure switch. `pnpm dev` honors `UVCP_FORCE_INIT_FAILURE=1` and rejects any other non-zero value. That variable is not compiled into the production bundle.

## 18. Dependency boundaries

Section 10 is the rule. M0-NFR-002 is enforced by the boundary script, not by review alone. Core and persistence must not import React, a desktop SDK, DOM or browser UI types, `node:fs`, or `node:path` used as I/O. Platform-specific behavior, when it eventually exists, crosses `platform`. Module 0 platform code has no filesystem or network API.

## 19. Future Python or backend integration

Out of Module 0. The allowed later shape is a sidecar started by the editor, speaking a versioned envelope that persistence or a dedicated validator checks before any domain operation. Core does not import Python. Pyodide and an embedded CPython are rejected as the client core. No port, socket, or protocol is built now. See ADR-0001 and ADR-0006.

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

When desktop distribution is in scope, the recommended first macOS channel is direct distribution: Developer ID Application certificate, Hardened Runtime, secure timestamp, `notarytool`, and stapling. The Mac App Store is a second channel and adds the App Sandbox. Those certificates are not interchangeable. New Developer ID certificates must use the G2 intermediate; the previous Developer ID intermediate expires on 2027-02-01 (Apple notice, 2026-10-01).

The Module 0 rule that filesystem I/O is not in core or persistence is what keeps both channels possible. The Product Owner chooses the channel before any Mac build is signed, not before Module 0.

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

See ADR-0007. The threat model in the security review remains the Module 0 threat model. Its blocking findings are resolved for preparation by the decisions in that ADR. M0-AC-011 stays open until implementation matches them.

## 23. Technical risks

| Risk | Mitigation in this proposal |
| --- | --- |
| A later module adopts Three.js or Babylon as the scene | ADR-0003 forbids a second authoritative graph. The null renderer is the only implementation now. |
| Tauri is chosen later for size, and Linux cannot host the viewport | ADR-0004 rejects the system webview as the sole GPU viewport unless the Product Owner explicitly accepts that cut. |
| Desktop cannot host the TypeScript package | Any future host must execute this package. A host that cannot do that reopens ADR-0001 before Module 1. |
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

- The shell has no viewport, canvas, toolbar, hierarchy, or frame probe. The editor review's viewport-first frame is not adopted. The future rule is recorded in ADR-0008 and is not a Module 0 widget.
- `UVCP_FORCE_INIT_FAILURE` is not a control on the screen.

The native window title is `Foundation`. The on-screen heading is `Universal Visual Creation Platform`. There is no icon asset and no placeholder logo.

## Primary development environment

Proposed, pending Product Owner confirmation:

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
| Viewport in the Module 0 shell | Editor: mount a host element and a frame probe. Designer: no viewport and no editor frame. Rendering: no canvas and no GPU probe. | No viewport and no canvas. Record the future handoff. Do not implement it. |
| Who may import whom | Core forbade UI from importing editor and allowed editor to import UI. Editor forbade editor from importing React and wanted UI to hold an editor client. DevOps allowed several wider edges, including UI to core. | Shell passes a plain view model. UI imports no workspace package. Editor imports core and persistence only. |
| Desktop host | Rendering prefers Electron later and rejects Tauri as the only GPU viewport. Security's privilege order is web, then conditional Tauri, then conditional Electron, and blocks a native GPU fallback in Module 0. DevOps would not decide in Module 0 and leans Tauri if forced. | Web shell now. No desktop dependency. Tauri is not the future viewport assumption. Electron versus `wgpu` waits for the first viewport module and a Product Owner decision. |
| Failure injection | Non-functional quality: an environment variable and a non-zero process exit. Functional quality: a test double, not a shipped backdoor. | Injected initializer in tests and in the headless script. Environment variable only in `pnpm dev`. Absent from the production bundle. |
| Test runner | Editor suggested Vitest and Testing Library for chrome. DevOps and functional quality recommend `node:test` and no Playwright. | `node:test` only. |
| Persistence depth | Core: a real manifest codec. DevOps: an empty boundary is enough. | Codec and entry-name rules. No zip and no user save. |
| Vulnerability scanner | Security prefers OSV-Scanner and accepts `pnpm audit` for a JavaScript-only repo. | `pnpm audit --audit-level=high` only. Do not also fail the job on a second scanner. |
| `OR` licenses | DevOps would accept `MIT OR GPL-3.0-only` as MIT. The security proposal review blocked that rule (SEC-M0-B-008) because the same wording also admits AGPL, LGPL, SSPL, and BUSL. | An `OR` passes only when every disjunct is on the permissive list. Any copyleft identifier still needs Product Owner approval of that dependency. |

## Assumptions

- The operational specification is the Module 0 contract.
- Web and desktop will share this TypeScript core. A future host that cannot run it reopens ADR-0001.
- Editor session state is not project content.
- Hand-edited project files are not a support commitment.
- No user projects exist, so there is no migration to perform.
- The repository remote stays on GitHub. Actions availability was not queried against the GitHub API.
- External version and platform facts were checked by the specialist reviews on 2026-10-02. No shell was built, and no GPU process was launched, because there is no application to launch.
- React, TypeScript, Vite, and Biome are pinned to the exact versions that pass the license and audit checks on implementation day. This proposal does not invent patch numbers for them.
- Reference hardware and product performance workloads are not decided. They do not block Module 0. They block the first module that makes a product performance claim.
- Up-axis, handedness, rotation order, and degrees versus radians are one future schema constant. They are not guessed here. They must be decided before Module 1 transform tests.

## Decisions that need the Product Owner

These are the confirmations required before Module 0 is READY FOR DEVELOPMENT. Recommended answers are stated so a single approval can accept them, and any rejection is explicit.

1. **Authorize this proposal** as the Module 0 architecture, including ADR-0001 through ADR-0008, without changing the Module 0 requirements or acceptance criteria.
2. **Primary development environment.** Confirm 64-bit Windows x64 as the documented setup and local-launch environment, with required CI on `windows-2025` and `ubuntu-24.04`. Confirm that the manual `pnpm dev` launch uses current Microsoft Edge or current Google Chrome, and that the evidence records which one. Confirm that Web, Windows, macOS, and Linux remain the product targets and that Module 0 does not implement all of them.
3. **Module 0 shell.** Confirm a loopback web shell, and confirm that Electron, Tauri, and a native GPU stack are not part of Module 0.
4. **Design intent.** Confirm the foundation screen in the design review, or correct these assumptions: the heading `Universal Visual Creation Platform`; no icon in Module 0; system light/dark with a light fallback; the purpose sentence in that review. The window title `Foundation` is a purpose label, not a product name.
5. **One UI implementation.** Confirm that later desktop chrome uses the same UI package, with native file and process integration in a thin host, rather than a second widget toolkit.

Not required to start Module 0. Required before the module that makes them user-visible:

- Application license. Do not add an open-source `LICENSE` grant in Module 0.
- Any copyleft dependency. The default is to refuse it.
- Public format id, file extension, one file versus a folder, and whether hand-editing is supported. Engineering defaults when that day comes: one container file, not `.json`, hand-editing unsupported, a newer `schemaVersion` refused, a malformed file rejected whole.
- Whether undo history survives save and reopen. Recommended answer: no.
- One scene per project or several. The overview says a unified scene. Archive section 4.2 says one or more. Decide before the Module 1 document schema.
- Whether selection and panel layout are saved. Recommended answer: no.
- Desktop viewport host when pixels are required: hardened Electron, or native `wgpu` behind chrome. Rendering recommends Electron. Security will re-review whichever is chosen. Tauri-as-viewport is not the recommendation.
- macOS channel: direct Developer ID, or Mac App Store.
- Browser support matrix for the first web release.
- Reference hardware and the first performance workload.
- Telemetry. The decision in force is none.
- Repository settings only an admin can change: Actions enabled, and branch protection that requires the verify check. Recommended. Not done here.

## Implementation breakdown

Implementation has not started. The order below is the proposed breakdown after authorization. Work packages may proceed in parallel only where the dependencies allow it.

After the Product Owner authorizes Ready for Development, each work package is implemented on its own branch and opened as a pull request linked to issue #1. That work is not committed directly to `main`. It does not start while issue #1 remains at the Product Owner review gate.

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

## Definition of Ready

| Ready condition | State |
| --- | --- |
| Objective, scope, and out-of-scope behavior | Met by the operational specification. Unchanged. |
| Dependencies on earlier modules | None. |
| Stable FR, NFR, and AC identifiers | Met. Unchanged. |
| Test approach for every identifier | Met by the updated test plan plus this proposal. |
| Design behavior defined | Met by the adopted design review. Pending confirmation in decision 4. |
| Test infrastructure defined | Met. Listed in the test plan and in ADR-0005. |
| Blocking security findings for preparation | Addressed by ADR-0007. Implementation evidence is still required later for M0-AC-011. |
| Blocking architectural decisions for Module 0 | Proposed here. |
| Product ambiguities that block Module 0 | The five confirmations above. |
| Product Owner authorizes implementation | **Not met.** |

## ADR index

| ADR | Title |
| --- | --- |
| 0001 | TypeScript for the shared core |
| 0002 | React for editor chrome |
| 0003 | Render snapshot and WebGPU direction |
| 0004 | Module 0 web shell and desktop direction |
| 0005 | Workspace, build, and verification |
| 0006 | Domain, persistence, and undo direction |
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

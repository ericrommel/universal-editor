# Module 0 quality trace

**Role:** Functional Quality Engineer
**Date:** 2026-10-05
**Tree:** `m0/qe-foundation-proof` at the commit that adds this file
**Disposition:** Review record. Not TESTS GREEN, not module approval, and not a Product Owner decision.

This record checks the implemented Module 0 tree against `specification.md` and `test-plan.md`. It does not waive an acceptance criterion.

## Defects corrected in this review

The null renderer returned one shared clear-color object. Writing `clear.red` on one result changed the next result. Each result, snapshot, clear, and empty draw list is now frozen. A regression test mutates them and expects `TypeError`.

`pnpm test` named test files in `package.json`. A new test file was skipped unless that list changed, so the failure-propagation probe could not be removed by deleting one file. The command now runs every `*.test.ts` and `*.test.mjs` file outside `node_modules`, `dist`, `ts-out`, `build`, and `.git`. Any other test suffix fails the command and names the file.

The preview smoke accepted HTTP 200 and the production content security policy without reading the body. It now requires the served document, script, and stylesheet to match the build, requires the foundation copy and palette in those files, and fails if a built file contains a canvas element, `UVCP_FORCE_INIT_FAILURE`, `forced-initialization-failure`, or `INVALID_INITIALIZATION_VALUE`.

The dev failure helper's thrown errors were not executed. They are now. Shell declaration emit is locked to `ts-out` with `emitDeclarationOnly`, and shell tests are part of `tsc -b`.

## Local verification

Environment: 64-bit Windows, Node `v24.21.0`, pnpm `12.8.2` through Corepack. Install was `corepack pnpm install --frozen-lockfile` and reused 30 packages from the existing store. That is not a new cold-store series. The earlier cold-store observation remains `m0-pipeline-baseline.json`.

`node scripts/verify.mjs` on this tree, before the deliberate probe, exited 0. The run included the boundary check, `tsc -b`, Biome, the license check, `pnpm audit --audit-level=high`, 76 headless tests, `pnpm build`, and `preview smoke: HTTP 200 http://127.0.0.1:5173/`. The test command did not start Vite or Edge. A Windows desktop session was logged in. No display server was added for the tests.

### TP-M0-F-003 local half

A formatted file `scripts/m0-failure-probe.test.mjs` was added and not listed in `package.json`. `node scripts/verify.mjs` exited 1. The log named `scripts\m0-failure-probe.test.mjs:4:1` and the message `M0 failure-propagation probe: this test must fail`. Verify stopped before `pnpm build`. The file was deleted. An earlier unformatted probe failed at Biome and never reached the test; that run does not count. Biome named `scripts\m0-failure-probe.test.mjs` and the formatter.

The 2026-10-04 probe on draft pull request 23 is not evidence for this gate. `scripts/verify.mjs` gained the production build and the preview smoke after that probe, and that commit is not an ancestor of `main`.

The CI half of TP-M0-F-003 has not been run on this gate.

### TP-M0-NF-004 local breaks

Each break was reverted before the next commit.

| Class | Result |
| --- | --- |
| Typecheck | Exit 1. `apps/shell/src/foundation-props.ts(17,7): error TS2322: Type 'string' is not assignable to type 'number'.` |
| Lint | Exit 1. `apps/shell/src/foundation-props.ts` rule `lint/correctness/noUnusedVariables` |
| Build | Exit 1. `apps/shell/src/main.tsx:31:20` `Unexpected ";"` |

## Rendered shell

`corepack pnpm dev` was opened in headless Microsoft Edge `154.0.4258.53`. The page was inspected through the browser's debugger. This was not a watched visible window, and it is not the Product Designer's M0-AC-012 review. A keyboard was not used.

| Check | Ready | `UVCP_FORCE_INIT_FAILURE=1` | Invalid sentinel |
| --- | --- | --- | --- |
| Document title | Foundation — Universal Visual Creation Platform | same | same |
| Visible status | Ready, no Details control | Not ready, diagnostic `Initialization failed.`, control `Hide details` | Not ready, same diagnostic, sentinel absent from the page and the console |
| Console | `startup.beginning`, `startup.ready` | `startup.failed`, step `forced-initialization-failure` | `startup.failed`, code `INVALID_INITIALIZATION_VALUE`, sentinel absent |
| Canvas / images / headings | 0 / 0 / one product-name heading | same | same |
| 880×640 column | x 152, y 64, width 576 | y 64 | y 64 |
| 640×480 column | x 32, y 32 | y 32 | y 32 |
| Appearance | light, then dark, then forced | same | same |
| Text at a 32px root | heading 56px, vertical scroll 646 against 640 | vertical scroll 770 against 640 | same |

The failure control measured 107×31.5 CSS pixels. Canvas background was `rgb(244, 245, 247)` and primary text `rgb(28, 31, 38)`. The status word used the primary text color. The button kept native chrome.

## Traceability

`Pass` here means this review has direct evidence. It does not mean the module is GREEN.

| ID | Result | Evidence |
| --- | --- | --- |
| M0-FR-001 | Exercised | Verify build and preview smoke. Headless Edge launch above. |
| M0-FR-002 | Pass | Headless `pnpm test`, including `packages/core`. |
| M0-FR-003 | Pass | Boundary check in the green verify run. Six packages exist. |
| M0-FR-004 | Pass locally | Green verify ran tests, `tsc -b`, and Biome. |
| M0-FR-005 | Open on this gate | Workflow is `.github/workflows/verify.yml`. Current-gate CI failure is not re-recorded. |
| M0-FR-006 | Pass | Editor tests, dev-failure tests, and the Edge failure screen. |
| M0-FR-007 | Pass | `docs/engineering/developer-setup.md` matches the commands used. |
| M0-FR-008 | Pass | Discovery, headless command, boundary check, dev-failure tests, and this verify log. |
| M0-FR-009 | Exercised | Screen observation against `product-design.md`. Designer sign-off is M0-AC-012. |
| M0-NFR-001 | Not re-proven cold | This install reused the store. The 2026-10-04 baseline is a different commit. |
| M0-NFR-002 | Pass | Boundary check. |
| M0-NFR-003 | Pass | `pnpm test` did not start the shell. Edge was a separate inspection. |
| M0-NFR-004 | Pass locally | Probe and the three local breaks name a file. CI half is open. |
| M0-NFR-005 | Pass for this change | Architecture and developer setup describe discovery and the smoke checks. |
| M0-NFR-006 | Unchanged | ADR-0001 through ADR-0008 still record the alternatives. This review did not reopen them. |
| M0-NFR-007 | Pass | Core imports nothing in the workspace. Boundary check passed. |
| M0-NFR-008 | Exercised | Edge observation. Not a designer sign-off. |
| M0-NFR-009 | No new blocking defect | Bundle scan locks the dev switch out of `dist`. Security sign-off is M0-AC-011. |
| M0-NFR-010 | Pass locally | Commands and versions above. This branch has no CI run yet. |
| M0-AC-001 | Not re-proven | No new cold checkout. Prior baseline is `m0-pipeline-baseline.json`. |
| M0-AC-002 | Exercised headless | Edge 154, `pnpm dev`, Ready and Not ready. Visible window not watched. |
| M0-AC-003 | Pass locally | Green `node scripts/verify.mjs`. |
| M0-AC-004 | Local only | Red verify on the probe, file removed. CI on this gate is not recorded. Pull request 23 does not cover it. |
| M0-AC-005 | Pass | Core tests in the headless run. |
| M0-AC-006 | Pass | Core and persistence tests, plus the boundary check. |
| M0-AC-007 | Open on this gate | The workflow has no `continue-on-error` on verify. A red run of this script is not recorded. |
| M0-AC-008 | Pass | Developer setup was followed for install, test, verify, dev, and build. |
| M0-AC-009 | Pass for this change | Architecture text matches the discovery rule and the smoke checks. |
| M0-AC-010 | Not passed | CI failure propagation on this gate is still missing. |
| M0-AC-011 | Not passed | No Application Security implementation sign-off in this review. |
| M0-AC-012 | Not passed | No Product Designer sign-off. The QE observation found no blocking screen defect. |

## Still required before TESTS GREEN

- A red CI run and a following green CI run of this verify script, with the probe message in the red log.
- Application Security review of the built shell against ADR-0007.
- Product Designer review of the running shell against `product-design.md`.
- Human Product Owner acceptance. This record does not grant it.

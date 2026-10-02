# Module 0 — DevOps / Platform Review

**Role:** Senior DevOps / Platform Engineer
**Status:** Architecture-preparation recommendation. Not an ADR, not PO approval, and not authorization to implement.
**Date:** 2026-10-02
**Scope:** CI/CD architecture, reproducible builds, caching, artifacts, cross-platform build and release direction, signing and notarization implications, versioning infrastructure, and CI secrets.

This review does not add workflows, application code, directories, or git configuration. Operational Module 0 requirements win where they differ from the archived specification. Archive identifiers are historical only.

---

## Documents read

Authoritative:

- `AGENTS.md`
- `docs/product-overview.md`, section 9 (Platform Vision)
- `docs/engineering/development-process.md`, section 5.10 (Senior DevOps / Platform Engineer) and the preparation / definition-of-ready context around it
- `docs/engineering/architecture.md` (still an unapproved skeleton)
- `docs/modules/module-00-foundation/specification.md`, in particular M0-FR-004, M0-FR-005, M0-FR-007, M0-NFR-001, M0-NFR-007, M0-NFR-010, M0-AC-001, M0-AC-003, M0-AC-004, M0-AC-007, and M0-AC-008, plus the boundary requirements those depend on (M0-FR-001 through M0-FR-003, M0-NFR-002, M0-NFR-003, M0-NFR-004, M0-NFR-009)
- `docs/modules/module-00-foundation/test-plan.md`, in particular TP-M0-F-001, TP-M0-F-002, TP-M0-F-003, TP-M0-I-001, TP-M0-I-002, TP-M0-NF-001, TP-M0-NF-003, section 7 (security verification), and section 9 (test infrastructure)

Context only:

- `docs/archive/product-engineering-specification-v1.0.md`, sections 9.1, 16, and 17

Repository state inspected on 2026-10-02: no application source, no workspace manifest, no CI workflow, and no `docs/engineering/adr/` decisions. `architecture.md` explicitly says the initial architecture is not yet approved.

---

## Evidence

### Repository

Local read-only git inspection on 2026-10-02:

- A `.git` directory exists. `git rev-parse --is-inside-work-tree` returned `true`.
- `origin` is configured as `git@github.com:ericrommel/universal-editor.git` for fetch and push.
- The current branch is `main`, tracking `origin/main`.
- No git config was changed. Nothing was pushed. GitHub was not queried for repository visibility, Actions enablement, branch protection, or billing.

The forge is GitHub. Module 0 CI should be GitHub Actions. No other CI system is justified while this remote remains the repository of record.

### External facts checked on 2026-10-02

**GitHub-hosted runners.** The `actions/runner-images` image list, read on 2026-10-02, currently maps:

- `ubuntu-latest` or `ubuntu-24.04` to Ubuntu 24.04 x64
- `ubuntu-26.04` to Ubuntu 26.04, now generally available, but not what `ubuntu-latest` is today
- `windows-latest` or `windows-2025` to Windows Server 2025
- `macos-latest` or `macos-26` to macOS 26 Arm64
- `macos-14`, `macos-14-large`, and `macos-14-xlarge` still listed, but scheduled for removal

Sources:

- [actions/runner-images](https://github.com/actions/runner-images), available-images table read 2026-10-02
- [Ubuntu 26.04 GA and `ubuntu-latest` migration](https://github.blog/changelog/2026-09-17-ubuntu-26-generally-available-and-latest-migration), 2026-09-17. `ubuntu-latest` moves from Ubuntu 24.04 to 26.04 gradually from 2026-10-19 through 2026-11-19. Pin `ubuntu-24.04` to stay put.
- [macOS 14 runner retirement](https://github.blog/changelog/2026-10-01-github-actions-macos-14-runner-image-retirement), 2026-10-01. The image is removed on 2026-11-02, with brownouts starting 2026-10-05. Do not use any `macos-14` label.
- [GitHub Actions retention now covers checks, runs, and statuses](https://github.blog/changelog/2026-10-01-actions-retention-now-covers-checks-runs-and-statuses), 2026-10-01
- [Configuring the retention period](https://docs.github.com/en/organizations/managing-organization-settings/configuring-the-retention-period-for-github-actions-artifacts-and-logs-in-your-organization), read 2026-10-02. Default retention is 90 days. Public repositories can be set from 1 to 90 days. Private repositories can be set from 1 to 400 days. Repository settings cannot exceed an organization or enterprise cap.
- [`actions/upload-artifact`](https://github.com/actions/upload-artifact), read 2026-10-02. `retention-days` overrides artifact lifetime only. `0` means the repository default. The action documents a per-artifact maximum of 90 days unless repository settings say otherwise. v3 is deprecated. Pin a current major by full commit SHA at implementation time; do not float a moving tag.

**Node.js.** Checked 2026-10-02:

- [Node.js releases](https://nodejs.org/en/about/previous-releases): Node 24 (Krypton) is LTS, last listed update 2026-09-07. Node 26 is Current, first released 2026-05-05, last listed update 2026-09-21. Node 22 is still LTS. Node 20 and Node 25 are EOL.
- [nodejs/release schedule](https://github.com/nodejs/release/blob/main/README.md): Node 24 is Active LTS until maintenance on 2026-10-20 and EOL on 2028-04-30. Node 26 stays Current until Active LTS on 2026-10-28 and EOL on 2029-04-30. Node 22 is Maintenance LTS until EOL on 2027-04-30.
- [Evolving the Node.js release schedule](https://nodejs.org/en/blog/announcements/evolving-the-nodejs-release-schedule): the annual, every-major-becomes-LTS model starts with Node 27. Node 26 is the last line on the old model.
- [Running TypeScript natively](https://nodejs.org/learn/typescript/run-natively), page dated 2026-07-10: Node 22.18.0 and later run erasable TypeScript with no flag. Node does not type-check. `enum` and other non-erasable syntax still need a transform. Type-check with `tsc` separately.

**pnpm.** On 2026-10-02, `npm view pnpm version` against the public npm registry returned `12.8.1`. The `pnpm@12` version list also contained `12.8.2`. Pin the exact version chosen on implementation day in `packageManager`. Do not float `latest`.

pnpm supply-chain behavior used below:

- [pnpm 10.26](https://pnpm.io/blog/releases/10.26), 2026-10-02: `allowBuilds` is the preferred build-script control. Git-hosted dependencies do not run `prepare` unless explicitly allowed.
- [pnpm 11.0](https://pnpm.io/blog/releases/11.0), release notes read 2026-10-02: requires Node.js 22 or newer; `minimumReleaseAge` defaults to 1440 minutes; `blockExoticSubdeps` defaults to true; `onlyBuiltDependencies` and `ignoreDepScripts` are removed in favor of `allowBuilds`; project settings move toward `pnpm-workspace.yaml`.
- [pnpm/pnpm#15276](https://github.com/pnpm/pnpm/issues/15276), opened 2026-09-22: on pnpm 12.5.1, `pnpm ci --ignore-scripts` still ran project lifecycle scripts when a `clean` script existed, while `pnpm install --frozen-lockfile --ignore-scripts` did not. CI should use `pnpm install --frozen-lockfile`. Re-check this issue when the pinned 12.x patch is chosen. It was not re-tested here.

**Tauri 2**, for a later desktop path, not for Module 0:

- [Prerequisites](https://v2.tauri.app/start/prerequisites/), page last updated 2026-08-20, and the [v2 docs source](https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/start/prerequisites.mdx) read 2026-10-02. Development needs Rust, plus OS libraries. The docs source still says macOS Catalina 10.15 and later, and Windows 7 and later. That Windows line is stale relative to the release below.
- Linux examples require WebKitGTK 4.1 (`libwebkit2gtk-4.1-dev` on Debian, `webkit2gtk4.1-devel` on Fedora) plus a C toolchain, OpenSSL headers, and GTK/AppIndicator/librsvg packages.
- Windows needs the Microsoft C++ Build Tools workload "Desktop development with C++", and Microsoft Edge WebView2. The docs say WebView2 is already installed on Windows 10 version 1803 and later; otherwise install the Evergreen Bootstrapper. MSI packaging also needs the Windows VBSCRIPT optional feature, which Microsoft is deprecating.
- macOS desktop development needs Xcode, or the Xcode Command Line Tools if iOS is not a target.
- Node.js is required only for a JavaScript frontend. pnpm is supported via Corepack.
- [Tauri 2.12](https://v2.tauri.app/blog/tauri-2.12/), 2026-09-26: official Windows 7 support is dropped. Minimum supported Rust version is 1.90. The stated MSRV policy is latest stable minus two, updated only in minor or major releases, and may be broken for a security fix.
- [Distribute](https://v2.tauri.app/distribute/), page updated 2026-07-22: Linux targets include deb, RPM, AppImage, Snap, Flatpak, and AUR. macOS is either a direct DMG or the App Store. Both need code signing. Distribution outside the App Store also needs notarization. Windows is an installer or the Microsoft Store.
- [macOS code signing](https://v2.tauri.app/distribute/sign/macos/), last updated 2026-05-17: paid Apple Developer Program membership is required for distribution certificates (the page states 99 USD per year). `Developer ID Application` is for outside the App Store. `Apple Distribution` is for the App Store. Notarization credentials are App Store Connect API keys (`APPLE_API_ISSUER`, `APPLE_API_KEY`, `APPLE_API_KEY_PATH`) or an Apple ID. CI certificate material is `APPLE_CERTIFICATE` and `APPLE_CERTIFICATE_PASSWORD`. An ad-hoc identity (`-`) is not notarization.
- [Windows code signing](https://v2.tauri.app/distribute/sign/windows/), updated 2026-09-11: documents OV certificates and Azure Key Vault, and points EV certificates at the issuer's own docs.

**Electron**, also later, not Module 0:

- [Code signing](https://www.electronjs.org/docs/latest/tutorial/code-signing), page content retrieved 2026-10-02. Packaged Electron apps should be signed. macOS release is sign, then notarize. The documented prerequisites are Apple Developer Program membership, Xcode on a Mac, and signing certificates. Electron Forge is the documented packaging path and uses `@electron/packager`, `@electron/osx-sign`, and `@electron/notarize`. Mac App Store submission is a separate guide.
- The same page says that since June 2023, Windows SmartScreen reputation from the older OV Authenticode certificate no longer applies, and an EV certificate on FIPS 140 Level 2, Common Criteria EAL 4+, or equivalent hardware is required for that benefit. The private key is not a file checked into CI. Azure Artifact Signing, formerly Azure Trusted Signing, is documented as the cloud alternative and is not available in every country.
- The same page says `autoUpdater` on macOS (Squirrel.Mac) does not work unless the app is signed. `safeStorage` and login-item APIs are also unreliable without a stable signature.
- Electron vendors its browser and JavaScript runtime in the app binary. That is the reproducibility contrast with Tauri's OS webview. Module 0 does not take an Electron dependency.

**Apple distribution rules** that any later macOS build must satisfy:

- [Notarizing macOS software before distribution](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution), retrieved 2026-10-02. Notarization is an automated malware and signing scan, not App Review. The ticket is stapled to the software and also published for Gatekeeper. Accepted deliverables include apps, UDIF disk images, and flat installer packages.
- Prepare-for-notarization rules on that page: sign every executable with a valid signature; use a Developer ID application, installer, kernel-extension, or system-extension certificate; do not use a Mac Distribution, ad hoc, Apple Developer, or development certificate; enable the Hardened Runtime; include a secure timestamp; do not set `com.apple.security.get-task-allow` to true; link the macOS 10.9 SDK or later; use properly formatted entitlements.
- [Customizing the notarization workflow](https://developer.apple.com/documentation/security/customizing-the-notarization-workflow), retrieved 2026-10-02. Custom and CI workflows use `notarytool` and `stapler`, shipped with Xcode. `altool` is not the current path.
- [Resolving common notarization issues](https://developer.apple.com/documentation/security/resolving-common-notarization-issues), retrieved 2026-10-02. Notarization fails with "The executable does not have the hardened runtime enabled" when the Hardened Runtime is missing. Enable it with the Hardened Runtime capability or `--options runtime`.
- [Hardened Runtime](https://developer.apple.com/documentation/security/hardened-runtime), retrieved 2026-10-02. It blocks code injection, library hijacking, and process-memory tampering. JIT is off unless the app has an explicit entitlement. Plug-ins inherit the host executable's entitlements.
- [Protecting user data with App Sandbox](https://developer.apple.com/documentation/security/protecting-user-data-with-app-sandbox) and [Configuring the macOS App Sandbox](https://developer.apple.com/documentation/xcode/configuring-the-macos-app-sandbox), retrieved 2026-10-02. App Sandbox is required for Mac App Store distribution. It is kernel-enforced. A sandboxed app must declare every privileged access, including user-selected files. Sandbox is not the same control as the Hardened Runtime, and it is not required for Developer ID notarization.
- [Upcoming expiration of the Developer ID Certification Authority (Sub-CA)](https://developer.apple.com/news/?id=w4atic4c), 2026-10-01. The original Developer ID intermediate expires on 2027-02-01. Certificates it issued stop working that day. New certificates must come from Developer ID Certification Authority (G2). Installer packages signed with an affected certificate must be re-signed before that date. Mac apps that were already signed with a secure timestamp and notarized keep launching. This matters only when distribution certificates exist. Module 0 must not create any.

What was not verified: no build, test, or workflow was run, because the repository has neither. Actions enablement, repository visibility, runner billing, and Apple Developer membership were not checked. Tauri and Electron were not installed.

---

## Recommendations with alternatives and trade-offs

Module 0 needs a launchable shell, a headless core, explicit package boundaries, one verification command, and CI that fails closed. It does not need a desktop packager, a release train, or a task orchestrator.

Assumption, to be confirmed by the Tech Lead before implementation: the Module 0 language is TypeScript on Node, with a browser-shaped shell. That is the smallest toolchain that can later sit in a browser, a Tauri webview, or Electron without rewriting the core. If the Tech Lead selects a Rust core instead, use the Cargo alternative in section 1 and redesign CI before any package is added. Do not stack Rust on top of an already-built TypeScript core "just in case."

### 1. Monorepo, workspace, and build tooling

**Recommendation:** a private pnpm workspace, TypeScript project references, and Vite only for the shell. Root scripts are plain `package.json` scripts plus one small Node script, `scripts/verify.mjs`. No Turborepo. No Nx.

Proposed internal package scope: `@uvcp/*`. Every package is `"private": true`. Nothing is published. The scope is an implementation detail, not a product name.

**Why pnpm.** pnpm's isolated `node_modules` makes a forbidden import fail at resolve time instead of accidentally working through hoisting. The workspace protocol (`workspace:*`) makes internal edges explicit. The content-addressable store caches cleanly in CI. pnpm 12 already defaults to the supply-chain controls Module 0 should keep: no dependency build scripts unless named in `allowBuilds`, a one-day minimum release age, and blocked exotic transitive sources.

**Alternative: npm workspaces.** Realistic and smaller. Node already ships npm, and `npm ci` is a frozen install. Trade-offs: hoisting still permits phantom dependencies, so boundary mistakes type-check on one machine and fail on another; the lockfile and cache story is adequate but less strict; there is no pnpm-style build-script allow-list unless it is rebuilt by hand. Choose npm only if the team rejects a second package manager. Do not choose it for convenience alone if boundary enforcement is a Module 0 acceptance criterion.

**Alternative: Yarn.** Not recommended. Yarn Classic is a hoisted workspace with a weaker maintenance story than current npm. Yarn Berry with PnP adds a resolver that Vite and Node tooling still trip over; Yarn Berry with a `node_modules` linker is npm-like complexity without pnpm's install isolation. There is no Module 0 problem that Yarn solves better than pnpm or npm.

**Alternative: Cargo workspace as the root.** Use this only if the Tech Lead makes Rust the core language. Layout would be a Cargo workspace for `core`, `editor`, `rendering`, `platform`, and `persistence`, plus a JavaScript UI package for the shell. Trade-offs:

- Headless tests become `cargo test`, which satisfies M0-NFR-003 cleanly, and native performance is available later without a rewrite.
- Web is no longer free. A shared core must compile to WebAssembly, with a second toolchain (Rust plus Node) in every CI job and on every developer machine.
- Tauri then fits the shell, but the product still owes a browser target (product overview, section 9). WASM boundary code, `wasm-bindgen` or an equivalent, and browser-incompatible crates become architectural constraints on day one.
- Tauri 2.12's MSRV is 1.90 with a stable-minus-two policy (2026-09-26). CI would pin a Rust toolchain file and still move more often than a Node LTS line.
- Module 0 has no rendering or scene implementation that needs Rust. Adding it now violates the project's own rule against speculative infrastructure.

**TypeScript project references.** The root `tsconfig.json` is a solution file. Each package has a composite `tsconfig.json` whose `references` match the dependency edges below. `tsc -b` is the typecheck. Set `erasableSyntaxOnly` so tests can run under Node's type stripping. Node does not type-check (Node.js docs, 2026-07-10); `tsc -b` remains mandatory inside `verify`.

**Vite, for the shell only.** The shell must launch (M0-FR-001) and the product must remain able to ship the same UI to the Web. Vite is a dev server plus a static build. It does not decide React or any other component model. A vanilla TypeScript entry is enough for Module 0. Trade-off versus a hand-written HTML file and `tsc`: Vite is one more dependency, and its dev server uses esbuild, which may be the one package allowed to run a build script. Trade-off the other way: a no-bundler shell does not prove the static-asset path that later web hosting, Tauri, and Electron all consume. Vite is justified. Using it inside `core` is not.

**Dependency direction.** CI must fail when an edge is not on this list. Enforce it in two places: each package's `dependencies`, and a `scripts/check-boundaries.mjs` that reads those manifests plus source imports. TypeScript project references follow the same list. Do not add dependency-cruiser or an ESLint boundary plugin for this. A script is enough for seven packages.

| Package | May depend on | Must not depend on |
| --- | --- | --- |
| `@uvcp/core` | nothing internal | editor, ui, rendering, platform, persistence, shell, DOM, React, `node:fs`, `node:path` used as I/O |
| `@uvcp/editor` | core, persistence, rendering | ui, platform, shell |
| `@uvcp/rendering` | core | ui, platform, editor, shell, a concrete GPU backend |
| `@uvcp/persistence` | core | ui, platform, editor, shell, `node:fs` |
| `@uvcp/platform` | core | ui, editor, rendering, shell |
| `@uvcp/ui` | core | editor, rendering, platform, shell |
| `@uvcp/shell` | ui, editor, rendering, platform, persistence | nothing may depend on the shell |

`core` is the platform-neutral model required by M0-FR-002 and M0-NFR-002. Persistence owns format and pure serialize/parse, not filesystem I/O. Platform owns browser or OS adapters. The shell is the composition root: it may import a browser adapter from `platform`, and the browser build must not statically import a future Node or Tauri adapter. Empty packages export a named placeholder and a test or a type-only surface. They do not grow editor features.

The Tech Lead may tighten these edges in the architecture proposal. CI should encode the approved list, not a looser one.

**Task runner.** Do not add Turborepo or Nx. Module 0 has one ordered gate: boundaries, typecheck, lint, headless tests, shell build, shell smoke. A Node script can run those and return the child exit code. Turborepo's value is a task graph and, if remote cache is turned on, a shared cache. Remote cache adds a token, a cache-poisoning boundary, and a vendor. Nx adds generators and a graph service. Neither pays for itself at this package count. Revisit only after TP-M0-NF-003 shows a measured wait that local `tsc -b` incrementality does not already remove.

**Lint and format.** Use one tool. Biome is the recommendation: format and lint in a single dependency, no plugin ecosystem required. Alternative: ESLint plus Prettier. That pair is more familiar and has more plugins, and it is two tools and two configs for a repository that does not yet have code. Boundary rules stay in the script either way.

**Tests.** Use Node's built-in test runner (`node --test`) on erasable TypeScript, including at least one core unit test and one cross-package integration test that does not open a window (archive M0-AC-002's "integration-level test" is still a good bar; the operational plan's TP-M0-F-002 is the headless requirement). Alternative: Vitest. It matches Vite and is the better later home for component tests. It is unnecessary while tests do not need a DOM. Do not add Playwright or Cypress in Module 0.

### 2. CI strategy

**Recommendation:** one GitHub Actions workflow, `.github/workflows/ci.yml`, added during implementation, not in this review.

Triggers: `pull_request` and `push` to `main`, plus `workflow_dispatch` so a verifier can re-run the required gate. Do not use `pull_request_target`. Do not trigger on a schedule.

Permissions: `contents: read` at workflow scope. No `id-token`, `packages`, `pull-requests`, or write permission. The default `GITHUB_TOKEN` still exists; the workflow must not print it, must not write with it, and must not request more scope.

**Jobs Module 0 needs:**

- Required: `ubuntu-24.04`. This is the canonical reproducible environment for install, build, typecheck, lint, headless tests, and the shell smoke below. Pin the label. Do not use `ubuntu-latest`, because that label moves to Ubuntu 26.04 between 2026-10-19 and 2026-11-19.
- Required: `windows-2025`. The current developer workspace is Windows, and M0-NFR-001 fails if the documented setup works only on Linux. The Windows job runs the same steps. It is not a packaging job. Pin `windows-2025` rather than `windows-latest` for the same reason.
- Not in Module 0: macOS. `macos-latest` is macOS 26 Arm64 and costs more than Linux. Nothing in Module 0 links, signs, or notarizes. `macos-14` is retiring and must not be copied from old examples.

**Alternative: Linux only.** Simpler and cheaper, and sufficient to prove the toolchain. Trade-off: path separators, PowerShell versus bash, and case sensitivity will not be caught, so the Windows clean-setup in TP-M0-F-001 becomes a manual gate that can drift from CI. Rejected as the default because Windows is already the machine in use.

**Alternative: Linux, Windows, and macOS now.** Catches Mac path and toolchain surprises early. Trade-off: a higher-cost runner, Xcode image churn, and no Module 0 step that needs a Mac. Add `macos-26` only when a Mac developer is supported or when signing starts.

**What the job runs, in order:**

1. Checkout.
2. Set up the Node version named in `.node-version`, with the pnpm cache enabled.
3. `pnpm install --frozen-lockfile`. A lockfile mismatch is a failure. Do not use `pnpm ci` until issue 15276 is confirmed fixed for the pinned version.
4. `pnpm verify`, which is the only verification entrypoint. It runs boundary check, `tsc -b`, lint/format check, headless `node --test`, shell production build, and a headless shell smoke.
5. Upload the verify log and the test report.

The shell smoke starts the built shell with Vite's preview server and requests `/` from Node. It must not open a graphical window. A non-200 or a timeout fails the step. This is CI evidence that the shell builds and serves. It is not a substitute for a person launching `pnpm dev` on a desktop (M0-AC-002). Graphical launch stays a documented local step in TP-M0-F-001.

**Failure propagation (M0-FR-005, M0-AC-004, M0-AC-007, TP-M0-F-003).** A required check that fails must fail the job. Concretely:

- `verify` returns the failing child process exit code. No `catch` that returns 0. No `|| true`.
- The workflow step does not set `continue-on-error`.
- Later steps may use `if: always()` only to upload evidence. That must not be placed on the verify step.
- Lint warnings are not failures unless the linter is configured to exit non-zero for the violations Module 0 treats as required. Type errors are failures.
- A deliberately failing test is introduced only on a temporary branch or a draft change, the red run is recorded, and the failure is removed. It is never merged to `main`.

**Caching.** Cache the pnpm store through `actions/setup-node` with `cache: pnpm`, keyed from `pnpm-lock.yaml`. A cache miss must still pass. Do not cache `node_modules` as a blob across operating systems. Do not cache Rust, Electron, or a browser in Module 0. There is no remote task cache.

**Secrets.** Module 0 needs no production secret, no Apple credential, no Windows signing credential, and no npm publish token. Do not create those GitHub Actions secrets yet. When they are needed later:

- Store them only in GitHub Actions secrets or an environment with required reviewers.
- Never put them in the repository, a workflow log, an artifact, a screenshot, or a default `GITHUB_TOKEN` permission expansion.
- Prefer short-lived or hardware-backed credentials over a long-lived `.p12` password. Apple API keys and Windows EV keys are release-time concerns.
- Masked secrets can still leak through base64 and debug traces. Do not enable step debug on a signing job, and do not `echo` the environment.
- Fork pull requests of a future public repository must not receive secrets. `pull_request` (not `pull_request_target`) is how that stays true.

**Artifacts.** Upload the verify log and a machine-readable test report (Node's `junit` or `tap` reporter written to a file). Set `retention-days: 30`. Do not upload `node_modules`, `dist` installers, `.env`, certificates, or a full environment dump. Thirty days covers a Module 0 evidence review. The PO evidence package is a separate copy of the relevant logs; Actions retention is not the archive of record. Repository default retention remains 90 days for logs unless an admin changes it. Public-repository artifacts cannot be kept longer than 90 days under the current GitHub rules.

**Action supply chain.** Pin `actions/checkout`, `actions/setup-node`, and `actions/upload-artifact` to full commit SHAs when the workflow is written. Dependabot may update those SHAs. Do not use `@main` or an unpinned major tag.

**Alternative CI: GitLab CI or Azure Pipelines.** Not recommended. The configured remote is GitHub. Another system would duplicate the forge without a requirement. If the remote changes before implementation, port the same steps; do not invent a second design.

### 3. Cross-platform build and release direction

Module 0 does not distribute. Final packaging, stores, update feeds, and web hosting are out of scope (specification section 4; archive section 9.1).

The product targets Web, Windows, macOS, and Linux, and desktop is first-class (product overview, section 9). The core stays independent of the shell (M0-NFR-007). Module 0's job is to avoid blocking that path.

**What must be true at the end of Module 0:**

- `core`, `editor`, `rendering`, and `persistence` are TypeScript libraries with no DOM, no React, no `node:fs`, and no Tauri or Electron import.
- The shell's production build is a static asset directory from Vite, using a relative base so it can be hosted or loaded from a desktop shell later.
- The only platform adapter linked into the shell is a browser adapter. A second adapter can be added inside `platform` later without editing `core`.
- Paths in source and workflow files are case-sensitive and free of a single OS's separators. `.gitattributes` marks text as LF.
- There is one version field, root `package.json` `"version": "0.0.0"`, private, and not a release.
- CI is an OS matrix of the same steps, so a Mac job can be added later by adding a runner, not by redesigning the pipeline.
- No native Node addon is introduced. Native addons force per-OS rebuilds and install scripts.

**Later packaging, not chosen now.**

| Path | What it is | Trade-off |
| --- | --- | --- |
| Tauri 2 | Rust host, system webview, JS front end. The current front-end plan fits. | Smaller app and real OS integration. Adds Rust (MSRV 1.90 as of Tauri 2.12), MSVC plus WebView2 on Windows, WebKitGTK 4.1 on Linux, and Xcode on macOS. The webview is not version-pinned. Follow Tauri 2.12, not the prerequisites page's stale "Windows 7 and later" line. |
| Electron | Packaged Chromium and Node, with Forge as the current documented packager. | The browser engine is pinned to the Electron version, so visual bugs reproduce. The download is large, memory use is higher, and Chromium security fixes require an Electron upgrade. macOS still needs Developer ID, Hardened Runtime, notarization, and usually a JIT entitlement. Windows signing is an EV or cloud-signing problem, not a file in the repo. |
| Web only | Deploy the Vite `dist` directory to static hosting. | Simplest release and no notarization. It does not meet the product's first-class desktop requirement. File access, large local projects, and device integration stay limited by the browser. Keep the web build working; do not make it the only shell. |

**Direction.** Keep the Module 0 shell as a web UI so all three remain possible. When a desktop shell is actually in scope, prefer a thin host around that same build rather than a second UI. Between Tauri 2 and Electron, do not decide in Module 0. The reproducibility difference (OS webview versus vendored Chromium) and the sandbox difference are the facts the Tech Lead and PO need at that later gate. This review's bias, if forced early, is Tauri 2 for a thin native shell, because the product wants local files and hardware access without shipping a second browser. That bias is not a decision. Electron remains realistic if a pinned rendering engine becomes more important than binary size.

**Web deployment.** Later, and only with PO approval of a host. Module 0 does not create a hosting account, a CDN, or GitHub Pages. The static build is the whole preparation required now.

**Versioning infrastructure.** No Changesets, semantic-release, tag pipeline, or updater. Diagnostics may show `0.0.0` plus a git SHA when git is available. The SHA is not a release version. A future release workflow should read one version, build from the lockfile, sign on a protected runner, and publish artifacts from CI rather than from a laptop. That workflow is not Module 0.

**Deferred past Module 0:** Tauri and Electron dependencies, Rust, WebView2 bundling, Linux WebKit packages, Xcode, installers (MSI, NSIS, DMG, PKG, deb, RPM, AppImage, Flatpak, Snap), stores, auto-update, stapling, notarization, Authenticode, Azure Artifact Signing, any Apple or Microsoft secret, crash-reporting vendors, and hosted web infrastructure.

### 4. Developer workflow commands

Standardize these root commands. They are the contract for M0-FR-007 and M0-AC-008. Document them in the developer setup page during implementation. Names:

| Command | Behavior |
| --- | --- |
| `pnpm install` | Install from `pnpm-lock.yaml`. First-time local setup. CI uses `pnpm install --frozen-lockfile`. |
| `pnpm dev` | Start the shell dev server. This is the launch command for M0-AC-002. |
| `pnpm start` | Alias of `pnpm dev`. |
| `pnpm build` | Build the libraries and the shell static assets. No installer. |
| `pnpm test` | Headless tests only. Must not start Vite or open a window. |
| `pnpm verify` | The one verification entrypoint. |

`pnpm verify` runs, in order, and stops on the first non-zero exit:

1. boundary check
2. `tsc -b`
3. lint and format check
4. `pnpm test`
5. `pnpm build`
6. headless shell smoke

CI runs install and then `pnpm verify`. Developers run the same `pnpm verify` locally. There is no second "CI-only" check that is not in `verify`, except the frozen lockfile flag on install and the artifact upload.

Do not add a `verify:ci` script that skips lint. Do not make `build` implicitly succeed when typecheck fails.

Prerequisites to document for Module 0: Git, the pinned Node 24 patch, the pinned pnpm 12 patch, and a current desktop browser for `pnpm dev`. Not prerequisites: Rust, Visual Studio, Xcode, WebView2, or a signing certificate.

### 5. Reproducibility

M0-NFR-001 and M0-NFR-010 require a documented environment, not identical pixels.

- Commit `pnpm-lock.yaml`. CI refuses to install without it (`--frozen-lockfile`).
- Pin Node with `.node-version`. On 2026-10-02 the recommended line is Node 24 Active LTS, exact patch recorded at implementation (the releases page last listed 24.21.0 on 2026-09-07; use that patch or a newer 24 security patch if one exists on implementation day). `engines` should require `>=24.21.0 <25`. CI reads `.node-version`, not `node-version: lts/*`.
- Node 24 enters Maintenance LTS on 2026-10-20 and is supported until 2028-04-30. That is acceptable. Do not start on Node 26 while it is still Current. A move to Node 26 after 2026-10-28 is a separate, reviewed toolchain change.
- **Alternative:** pin Node 22 because it is still maintained until 2027-04-30. Trade-off: a new project would start on Maintenance LTS and have to move sooner. Rejected.
- **Alternative:** pin Node 26 now. Trade-off: newest APIs, but it is Current until 2026-10-28, so Module 0 would be tracking a non-LTS line for its first weeks. Rejected until the LTS date.
- Pin pnpm with `packageManager`, currently a 12.8.x version confirmed against the registry on implementation day. Enable it with Corepack when the pinned Node provides Corepack. If it does not, install that exact pnpm version with the pinned Node. Do not curl an unpinned install script.
- Pin CI OS labels, as above. Do not pin `ubuntu-latest`.
- Record in the TP-M0-NF-001 evidence: OS, Node patch, pnpm patch, lockfile commit, commands, and whether any manual step was required. TP-M0-NF-003 records cold and warm CI duration. Those numbers are a baseline, not a pass/fail budget, unless the Tech Lead sets one.
- Third-party actions are pinned by commit SHA.

**System webviews are not pinned.** Module 0 does not use one. The risk arrives with the desktop host:

- Tauri on Windows uses WebView2 Evergreen, which updates with the Edge channel. Two machines on the same app build can render differently.
- Tauri on macOS uses the system WKWebView. It changes when macOS updates.
- Tauri on Linux uses the distro's WebKitGTK 4.1. Ubuntu 24.04 and 26.04, and a developer's Fedora machine, are not the same browser build.
- The Module 0 dev shell uses whatever browser the developer opens. Headless tests do not pin a browser, because they do not launch one.
- Electron is the alternative that does pin Chromium, at the cost of shipping it.

Do not add a pinned Playwright browser in Module 0 to paper over this. There is no visual-regression suite yet. When one exists, its browser build must be version-pinned and recorded with the result. A Tauri webview result must record the OS webview version or it is not reproducible.

### 6. Licensing and supply chain

The application's own license is a Product Owner decision. Module 0 must not add a `LICENSE` file that grants an open-source license. Root and workspace packages stay private so they cannot be published by accident.

**Dependency allow-list, recommended default.** Fail `pnpm verify` when a resolved package has any other SPDX license, or no license. Accept a dual license when one side is on this list (`MIT OR GPL-3.0-only` is accepted as MIT). Reject an `AND` expression if any part is not on the list.

Allowed:

- `MIT`, `MIT-0`
- `Apache-2.0`
- `BSD-2-Clause`, `BSD-3-Clause`
- `ISC`
- `0BSD`
- `Unlicense`
- `CC0-1.0`
- `BlueOak-1.0.0`

**Copyleft and non-permissive licenses require PO approval before the dependency is added,** even if the code is only a dev tool. That includes GPL, AGPL, LGPL, MPL, EPL, CDDL, EUPL, OSL, SSPL, BUSL, CC-BY-SA, CC-BY-NC, the SIL Open Font License, and any unknown or missing license. LGPL is not "safe because it is a library" once the code is bundled into a desktop or web artifact. Do not encode a silent exception.

Implement the check with `pnpm licenses list` (or the equivalent JSON output of the pinned pnpm) inside `scripts/check-licenses.mjs`. Do not add a separate license-scanning product in Module 0.

**Install scripts.** pnpm 12 does not run dependency lifecycle scripts unless `allowBuilds` says so. Commit an empty allow-list, then add a package only when the build fails without it and someone has read the script. The likely first exception is `esbuild`, because Vite needs its binary. Allow `esbuild: true` and nothing else until a second package demonstrates the same need. Do not set a global "run all scripts" switch. Do not use `pnpm approve-builds` as a per-machine side channel that CI does not see; the committed `allowBuilds` map is the source of truth.

**Other build-side controls:**

- Public npm registry only. No git dependencies, no URL tarballs. Leave `blockExoticSubdeps` and `minimumReleaseAge` at the pnpm 12 defaults. A same-day publish will not install until it is a day old. Overriding that for a security fix is an explicit change, not a local flag.
- `--frozen-lockfile` in CI.
- No `curl | sh` in workflows.
- `.gitignore` includes `node_modules`, `dist`, `.env`, `.env.*`, `*.pem`, `*.p12`, `*.cer`, and `*.key`.
- Dependabot for npm and GitHub Actions, weekly, as a small `.github/dependabot.yml` during implementation. It opens pull requests; it does not merge them. No third-party SCA service.

The Application Security Engineer still reviews dependency trust, the lockfile policy, and CI secret boundaries (test plan, section 7). This section is the build control, not that review.

### 7. Versioning, observability, and what "simple" excludes

Versioning is covered above: `0.0.0`, private, one field, no release automation.

Observability for Module 0 is local diagnostic logging owned by the application (M0-FR-006), not a collector, a vendor, or a dashboard. Do not add OpenTelemetry exporters, crash reporters, or product analytics. AGENTS.md forbids telemetry without PO approval.

---

## Proposed repository tree

Proposal only. Do not create these directories as part of this review. Existing `docs/` stays as it is. Developer-setup documentation is a later Module 0 deliverable under M0-FR-007, not an extra file created here.

```text
/
  .gitattributes
  .gitignore
  .node-version
  package.json
  pnpm-lock.yaml
  pnpm-workspace.yaml
  tsconfig.json
  tsconfig.base.json
  apps/shell/
    package.json
    tsconfig.json
    index.html
    vite.config.ts
    src/main.ts
  packages/core/
    package.json
    tsconfig.json
    src/index.ts
    src/index.test.ts
  packages/editor/
    package.json
    tsconfig.json
    src/index.ts
  packages/ui/
    package.json
    tsconfig.json
    src/index.ts
  packages/rendering/
    package.json
    tsconfig.json
    src/index.ts
  packages/platform/
    package.json
    tsconfig.json
    src/index.ts
  packages/persistence/
    package.json
    tsconfig.json
    src/index.ts
  scripts/verify.mjs
  scripts/check-boundaries.mjs
  scripts/check-licenses.mjs
  .github/workflows/ci.yml
  .github/dependabot.yml
```

`apps/shell` is the only launchable application. The six packages under `packages/` are the Module 0 boundaries. They may contain a placeholder export and a boundary test. They must not contain scene editing, drawing, materials, cameras, animation, AI, collaboration, or a project-file implementation beyond an empty persistence boundary.

---

## CI outline

Implementation target: `.github/workflows/ci.yml`. Not added by this review.

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
jobs:
  verify:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-24.04, windows-2025]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@<pinned-sha>
      - uses: actions/setup-node@<pinned-sha>
        with:
          node-version-file: .node-version
          cache: pnpm
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm verify
      - uses: actions/upload-artifact@<pinned-sha>
        if: always()
        with:
          name: verify-${{ matrix.os }}-${{ github.run_id }}
          path: |
            reports/verify.log
            reports/test-results.xml
          retention-days: 30
          if-no-files-found: error
```

Notes for the implementer:

- `fail-fast: false` so a Windows-only failure is still visible when Linux fails, and the reverse. The job is still required on both.
- `if: always()` is only on the upload. A failed `pnpm verify` must remain a failed job.
- `if-no-files-found: error` so a green job that forgot to write evidence is not silently green.
- `verify` writes `reports/` itself. Those reports contain commands, tool versions, and failures. They do not contain environment dumps.
- Branch protection that requires this check is a repository-admin setting. Recommend it. Do not turn it on as a side effect of implementation without the repository owner.
- No signing job, no release job, no deploy job, no macOS job.

---

## Release and Apple implications (direction only)

No Module 0 release exists. The notes below are constraints on a later desktop distribution, so Module 0 does not paint the project into a corner.

**Two macOS channels, and they are not interchangeable.**

- Direct distribution (download a DMG or zip from the product): sign with a **Developer ID Application** certificate, enable the **Hardened Runtime**, include a secure timestamp, submit with **`notarytool`**, and staple the ticket. Apple's notarization guide, retrieved 2026-10-02, explicitly says not to use a Mac Distribution, ad hoc, Apple Developer, or development certificate for that submission. Gatekeeper on current macOS treats an unnotarized Developer ID app downloaded from the internet as untrusted.
- Mac App Store: sign with an **Apple Distribution** certificate, enable the **App Sandbox** entitlement, and pass App Review. Sandbox is an App Store requirement (Apple's App Sandbox documentation, retrieved 2026-10-02). Notarization is the Developer ID path, not the App Store path. A Mac Distribution signature is the wrong certificate for notarization, and Apple's own guidance is not to run App Store distribution-signed builds as if they were direct downloads.

**Hardened Runtime** is mandatory for notarization. It is a runtime-integrity control, not a file-access sandbox. JIT, unsigned executable memory, library loading, and debugging entitlements are exceptions and must be justified one by one. An Electron shell typically needs `com.apple.security.cs.allow-jit` because V8 generates code. A Tauri shell uses WKWebView and may need a smaller set. Do not copy an Electron entitlement file onto a future Tauri app, or the reverse. Do not set `com.apple.security.get-task-allow` on anything that will be notarized.

**App Sandbox** restricts filesystem, network, and process rights. A visual editor that opens arbitrary user projects needs security-scoped bookmarks for user-selected files, not a temporary "all files" entitlement. Sandbox is optional for Developer ID apps and mandatory for the Mac App Store. Turning it on later is expensive if the platform layer has already assumed POSIX paths and unrestricted child processes. The Module 0 rule that filesystem I/O lives behind `platform`, and that persistence does not call `node:fs`, is what keeps both channels possible.

**Recommended direction, not a PO decision yet:** plan direct distribution with Developer ID, Hardened Runtime, notarization, and stapling as the first desktop macOS channel. Treat the Mac App Store as a second channel that requires sandbox design, not as the default. The PO decides the channel when distribution is actually in scope. Module 0 does not need that decision in order to start, provided the boundaries above hold.

**Credentials, when that day comes.** Apple Developer Program membership is paid (Tauri's signing guide states 99 USD per year; confirm the current fee at enrollment). Signing requires a Mac. CI secrets would be an App Store Connect API key and a certificate, never an Apple ID password in a workflow file, and never a `.p12` in git. The Developer ID intermediate that expires on 2027-02-01 must not be used for new certificates; use the G2 intermediate (Apple news, 2026-10-01). None of these secrets are created for Module 0.

**Windows, later.** SmartScreen warns on unsigned downloads. Electron's current documentation says that since June 2023 only EV certificates on approved hardware, or a cloud service such as Azure Artifact Signing, remove that warning in practice. Tauri's Windows signing guide, updated 2026-09-11, still documents an OV certificate path and tells EV users to follow their issuer. Whichever packager is chosen, the private key does not live in the repository or in a long-lived GitHub secret file if a hardware or cloud signer is available. MSI builds on a Windows runner also need the VBSCRIPT optional feature for Tauri's WiX path; that feature is being deprecated, so NSIS or another installer may be the more durable Windows target. Not a Module 0 choice.

**Linux, later.** No notarization equivalent. Signature is optional reputation (GPG for AppImage, repo signatures for deb/RPM). WebKitGTK 4.1 is a distro package, not a pin. Flatpak or a clearly documented distro set will matter more than inventing a universal binary. Not a Module 0 choice.

**Web, later.** Static files. No Apple involvement. Separate from the desktop signature story.

---

## Risks, assumptions, PO decisions, open questions

### Risks

- **`ubuntu-latest` will change under any workflow that uses it**, starting 2026-10-19. Pin `ubuntu-24.04`.
- **`macos-14` brownouts start 2026-10-05** and the image is removed 2026-11-02. Do not introduce it.
- **Node 24 moves from Active to Maintenance LTS on 2026-10-20.** It remains supported until 2028-04-30. Treating "install the latest Node" as the setup doc will break reproducibility immediately, because Node 26 is still Current.
- **pnpm 12 is new and has already had a `pnpm ci` ignore-scripts regression (issue 15276).** Frozen `pnpm install` is the safer CI install. Re-read the pinned patch notes before locking the version.
- **`minimumReleaseAge` of one day** can block a legitimate just-published fix. That delay is intentional. Bypassing it casually removes the control.
- **esbuild's install script** is the first pressure to weaken `allowBuilds`. Allow that one package by name if Vite requires it. Do not allow the tree.
- **A Rust core decided after the TypeScript workspace exists** splits the repository. Settle the language before creating packages.
- **System webviews**, once a desktop shell exists, make rendering bugs unreproducible across OS updates. Module 0 must not claim a pinned visual baseline.
- **Empty boundary packages** can attract product code early. Reviewers should reject scene, tool, and format implementations that are not the Module 0 placeholder.
- **A verify script that swallows exit codes** would make M0-AC-004 look green. The temporary red-test run is the evidence, and it has to be a real CI failure.
- **Case-insensitive Windows checkouts** hide filename clashes that Linux CI will catch, which is one reason the Linux job stays required.
- **Signing material created "early so CI is ready"** would violate M0-NFR-009. There is nothing to sign.
- **Developer ID certificates from the pre-G2 intermediate expire 2027-02-01.** Irrelevant until release, and easy to get wrong if someone creates a certificate from old instructions.

### Assumptions

- The Tech Lead accepts a TypeScript-first Module 0, or explicitly chooses the Cargo alternative before implementation.
- The shell's UI toolkit (React or none) can wait. Vite does not require that choice.
- The approved dependency edges will be the table in section 1, or a stricter table. CI will enforce whatever is approved, not this draft if it is revised.
- GitHub remains the forge. Actions can be enabled on `ericrommel/universal-editor`. That was not verified against the GitHub API.
- Module 0 verification does not need a graphical runner. Local `pnpm dev` plus the headless smoke is the launch evidence.
- No production or signing secret is required for any Module 0 acceptance criterion.
- "Primary development environment" includes Windows, because that is the current workspace, and Linux, because that is the canonical CI image. macOS is expected to work for the Node toolchain but is not a Module 0 CI gate.
- The operational specification, not archive section 9.1, is the requirement source. Archive M0-FR and M0-AC numbers do not match the current identifiers and are not used as the checklist.

### PO decisions

- **Application license.** Not chosen here. Do not publish an open-source grant in Module 0.
- **Dependency allow-list.** The permissive list in section 6 is the recommended default. Any copyleft or missing license needs an explicit PO yes before it is added. A blanket "GPL is fine" or "no third-party licenses at all" would change the toolchain (Vite and TypeScript are permissively licensed; a stricter ban is workable but must be deliberate).
- **macOS distribution channel, when desktop shipping starts.** Direct Developer ID versus Mac App Store. Not required to approve Module 0 if the platform boundary stays free of filesystem and sandbox assumptions. Required before any Mac build is signed.
- **Whether Windows CI is mandatory.** This review says yes, alongside Linux. The PO can reduce that to Linux-only if Windows is not a supported developer environment. That would be a product-support decision, not a technical default.
- **Repository settings** that only an admin can change: Actions enabled, branch protection on the verify check, and artifact-retention caps. Recommended, not done.
- **Telemetry or a hosted error collector.** Out of scope. Needs a future PO decision. Default is none.

### Open questions

- Is `ericrommel/universal-editor` public or private? Visibility changes the maximum Actions retention (90 days public, up to 400 days private) and whether fork pull requests exist. The workflow above does not depend on the answer. Retention is set to 30 days either way.
- Are GitHub Actions and branch protection available on this repository's plan? Not queried.
- Which browsers are in the first Web support matrix? Archive section 17 leaves this open. Module 0 only needs "a current browser can open `pnpm dev`." A support matrix belongs with the first real web release.
- Who will own the Apple Developer account and the Windows signing identity when distribution exists? Nobody needs to be named for Module 0.
- Does the Tech Lead want Vitest from the start because Module 1 UI tests are already planned? This review says no. A later migration from `node --test` is cheap while tests are headless and few.
- Exact Node 24 and pnpm 12 patch numbers on implementation day. The versions cited here are the ones observed on 2026-10-02, not a promise that no patch shipped later that same day. `12.8.2` was visible in the version list while the `latest` dist-tag returned `12.8.1`.

### Module 0 build

- pnpm workspace, lockfile, `packageManager` pin, `.node-version`, `engines`
- TypeScript project references and the seven boundaries in the tree above
- Vite shell, and only that shell
- `scripts/verify.mjs`, boundary check, license allow-list check
- Root commands: `install`, `dev`, `start`, `build`, `test`, `verify`
- GitHub Actions workflow as outlined, on `ubuntu-24.04` and `windows-2025`
- pnpm store cache, frozen install, `contents: read`, 30-day test-evidence artifacts
- `allowBuilds` with no entries until a named package proves it needs a script
- `.gitignore` and `.gitattributes` as described
- Dependabot configuration for npm and Actions
- Developer documentation of prerequisites and these commands
- A headless shell smoke inside `verify`
- A one-time deliberate CI failure, recorded and then removed, as the M0-AC-004 evidence

### Module 0 do not build

- Tauri, Electron, Rust, WebAssembly, native addons, or a second shell
- Installers, code signing, notarization, stapling, or store submission
- Apple, Microsoft, npm, or cloud secrets
- Turborepo, Nx, Changesets, semantic-release, or a deploy workflow
- macOS runners, `ubuntu-latest`, `macos-14`, or a pinned browser
- Playwright, Cypress, visual-regression baselines, or benchmark gates with invented thresholds
- A license file that chooses the product license
- Telemetry, crash reporting, or a hosted log stack
- Product features inside the boundary packages
- Any edit to git config, and any push, as part of adopting this review

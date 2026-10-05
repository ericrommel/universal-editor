# Module 0 security review

**Role: Senior Application Security Engineer**

**Verdict:** No blocking finding. M0-AC-011 is satisfied by this review. This is not Product Owner approval and it is not GREEN.

Commit reviewed: `3cfa957e46baef128059243430a62fe02576ef66`. Preparation findings SEC-M0-B-001 through SEC-M0-B-008 are not reopened. Electron and Tauri are not present, so those later lists in ADR-0007 are not in force.

The Tech Lead recorded this review after the commit. Later product-source edits on the review branch are a comment in `packages/platform/src/index.ts` and the removal of the pre-parse nesting scanner in `packages/persistence/src/manifest.ts`. The platform file still has no runtime export. The reader still turns `SyntaxError` and `RangeError` from `JSON.parse` into `INVALID_JSON` and does not add a manifest field. This security review was not repeated for that removal. Developer setup now names Edge or Chrome for the loopback launch. None of these edits adds a capability, a secret, or a network client.

## Controls

- Lockfile, frozen install, reviewed build scripts, and the permissive license rule are in force. `allowBuilds` names only `esbuild`. An `OR` passes only when every disjunct is permissive.
- CI is secret-free, `contents: read`, and does not use `pull_request_target`. Actions are pinned by commit.
- The dev server binds to `127.0.0.1`. The page has no filesystem API, process spawn, or application network client.
- The production content security policy is `default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`. Development adds `connect-src 'self'` only. There is no `unsafe-inline` and no `unsafe-eval`.
- `UVCP_FORCE_INIT_FAILURE` is inlined only for the dev server. The production bundle does not contain that name.
- Diagnostics use the closed field list. The headless script does not read the dev failure variable.
- Core does not import the shell, React, or filesystem APIs. `@uvcp/platform` has no capability.
- There is no service worker, no remote font or script, no product `LICENSE` grant, and no second failing vulnerability scanner. `pnpm audit --audit-level=high` is the gate. On the pinned toolchain it reported no known high vulnerabilities.
- The null renderer does not request a GPU. The shell does not import it.

## Non-blocking notes

- The license check reads the installed store, so an optional package for another operating system is not installed on Ubuntu or Windows CI. The lockfile's other-platform packages were permissive at review time. A later lockfile could add a copyleft optional package that neither job installs.
- The production policy is the preview response header, not a meta element. `frame-ancestors` cannot be set from markup. A later static host has to send the same header. Module 0 does not host the files anywhere else.
- `esbuild` honors `ESBUILD_BINARY_PATH` when that file exists. CI does not set it.
- The dev CSS middleware serves workspace CSS that Vite already transformed, on loopback, by an opaque token. It is not a page filesystem API.
- pnpm still exempts git-hosted archives from the missing-integrity failure. This lockfile has no git or URL resolutions.
- ASCII case-fold for entry names remains the known residual. Module 0 extracts nothing.

## Known limit of the review

The reviewer did not run `pnpm verify` inside the review worktree, because that worktree's Node was not the pinned 24.21.0 and Corepack's signature check was left enabled. The Tech Lead ran `node scripts/verify.mjs` on Node v24.21.0 after this review. It exited 0, including the audit and the preview smoke. The production `apps/shell/dist` from that run does not contain `UVCP_FORCE_INIT_FAILURE`.

# Developer setup

This guide is how to install dependencies and run the checks that exist in this repository today. It is not a work-status board. It does not accept a module.

## Local environment

The documented local environment is 64-bit Windows on x64.

Install Git and Node.js. The Node.js version is exact: the contents of `.node-version`, which is `24.21.0`. Do not use a floating current release, and do not substitute a newer patch.

Enable the Corepack that ships with that Node.js build. The `packageManager` field in `package.json` selects pnpm `12.8.2`. Do not install pnpm with a curl script, and do not install a global pnpm another way.

Do not approve dependency build scripts except the named `esbuild` entry in `pnpm-workspace.yaml`. Vite does not install without that script. Nothing else is approved.

## Commands

PowerShell 5.1 has no `&&`. Run each command separately from the repository root:

```text
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm test
corepack pnpm verify
corepack pnpm dev
corepack pnpm start
corepack pnpm build
```

`corepack pnpm start` is an alias of `corepack pnpm dev`. Both serve the shell on `127.0.0.1` port `5173`. `corepack pnpm build` writes the static shell to `apps/shell/dist` with a relative base. It does not create an installer. `tsc -b` writes the shell's declarations to `apps/shell/ts-out` and does not write them into `apps/shell/dist`.

`UVCP_FORCE_INIT_FAILURE` is read only by `corepack pnpm dev`. Unset or `0` starts normally. `1` shows Not ready. Any other value also shows Not ready and is not treated as success. `corepack pnpm build` and `corepack pnpm --filter @uvcp/shell preview` do not read it. It is not a control on the screen.

Preview the static build with `corepack pnpm --filter @uvcp/shell preview`. That server binds to `127.0.0.1` port `5173`.

Continuous integration uses `corepack pnpm install --frozen-lockfile`. Do not use `pnpm ci`.

`corepack pnpm test` runs the headless `node:test` suite. It does not start a dev server or open a window.

## Verify

`corepack pnpm verify` runs `scripts/verify.mjs`. That script runs, in order:

1. the boundary check
2. `tsc -b`
3. Biome
4. the license allow-list
5. `pnpm audit` at high severity
6. the headless `node:test` suite
7. `pnpm build`
8. the loopback preview smoke

It stops on the first failure and returns that process status. A Node.js version other than the pinned version fails the gate before those steps.

The preview smoke runs after the build. It starts the shell preview on `127.0.0.1` port `5173` and requests `/` with Node. HTTP 200 with the production content security policy passes. Port `5173` must be free. The smoke does not open a window and is not the manual browser launch.

## Continuous integration

The workflow is `.github/workflows/verify.yml`. It runs on `pull_request`, on `push` to `main`, and on `workflow_dispatch`. It does not use `pull_request_target`.

Both of these runners are required, with `fail-fast` off:

- `ubuntu-24.04`
- `windows-2025`

The workflow does not use `ubuntu-latest`, `windows-latest`, or a macOS runner. The `ubuntu-24.04` job is a coupling check. It is not Linux desktop support.

Permissions are `contents: read` only. No repository secrets are required.

The install in CI is `corepack enable` followed by `corepack pnpm install --frozen-lockfile`. There is no dependency cache. The verify log is kept for 30 days. `node --test` output is in that log. There is no separate test-report file yet.

Dependabot opens weekly pull requests for the npm and GitHub Actions ecosystems. It does not merge them.

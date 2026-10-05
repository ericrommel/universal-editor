# Module 0 failure-clarity evidence

These probes are TP-M0-NF-004 and the local half of TP-M0-F-003 on the current candidate. Each local break was reverted before the next commit. None of these breaks was pushed except the deliberate test probe on draft pull request 28, which is removed again before that pull request is closed. A red commit is not merged.

The machine was 64-bit Windows, Node.js v24.21.0, pnpm 12.8.2. Each command exited 1.

## Type check

A string was assigned to a `number` in `packages/core/src/number.ts`. `tsc -b` reported:

```text
packages/core/src/number.ts(29,14): error TS2322: Type 'string' is not assignable to type 'number'.
```

The file was restored.

## Lint

A `debugger` statement was inserted in `packages/core/src/number.ts`. Biome reported `packages/core/src/number.ts:29:1 lint/suspicious/noDebugger` and a format error for the inserted line. The file was restored.

## Build

`apps/shell/src/main.tsx` imported a missing module. `pnpm build` reported:

```text
Could not resolve "./missing-m0-build-probe.ts" from "src/main.tsx"
file: apps/shell/src/main.tsx
```

The file was restored.

## Test, local

`packages/core/src/m0-failure-probe.test.ts` was added and named from the explicit `package.json` test list. The list is explicit because a glob in that script is not expanded on Windows. `node scripts/verify.mjs` reached the test step and exited 1. It did not continue to the build or the preview smoke. The log named the file and the assertion:

```text
test at packages/core/src/m0-failure-probe.test.ts:4:1
AssertionError [ERR_ASSERTION]: M0 failure-propagation probe: this test must fail
```

Both edits were restored in this worktree. The same probe was then committed only on `verify/m0-ac004-candidate` as `857a901`. Draft pull request 28 ran it. Verify run [37359364804](https://github.com/ericrommel/universal-editor/actions/runs/37359364804) failed on `ubuntu-24.04` and `windows-2025`. Both jobs named `M0 failure-propagation probe`, the file `packages/core/src/m0-failure-probe.test.ts`, the message `M0 failure-propagation probe: this test must fail`, and exit code 1. Removal commit `1b34fad` restores the candidate tree. Verify run [37360849752](https://github.com/ericrommel/universal-editor/actions/runs/37360849752) passed on `ubuntu-24.04` and `windows-2025`. The diff against main is empty. The pull request is closed without a merge.

## Earlier CI run

Draft pull request 23 recorded the same procedure against the verify gate before the production build and preview smoke were added. Those later steps run after the tests. The workflow still returns the verify status, with no `continue-on-error` on that step. Pull request 28 repeats the procedure on the candidate that contains those steps.

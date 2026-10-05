# Module 0 architecture consistency

**Role: Tech Lead**

This is the TP-M0-I-003 comparison for M0-AC-009. It is not module acceptance and it is not GREEN.

Compared commit `3cfa957` with `docs/engineering/architecture.md` and ADR-0001 through ADR-0008. The binding sections match the tree:

- Packages and the allowed import table match `scripts/boundaries.mjs` and the package manifests. The shell may import `@uvcp/ui`, `@uvcp/editor`, and `@uvcp/platform`. It imports the first two. It declares `@uvcp/platform` and does not import it.
- `@uvcp/platform` has no capability and no runtime export. That is the host boundary in section 10. The work-breakdown words "platform marker" do not add an export. An export would be a capability Module 0 does not have.
- `pnpm verify` runs the eight steps in section 11, in that order, and returns the first non-zero status.
- The null renderer records size, a fractional device-pixel ratio, an sRGB clear, and an empty draw list. It does not request a GPU.
- Diagnostics use `startup.beginning`, `startup.ready`, and `startup.failed` with the closed fields. `UVCP_FORCE_INIT_FAILURE` is honored only by `pnpm dev`.
- The production shell is static, with `base: "./"`, and the preview server binds to `127.0.0.1`.
- CI uses `ubuntu-24.04` and `windows-2025`, `contents: read`, and no `pull_request_target`.

The sentence "Implementation has not started" was left over from the approved proposal. The implementation record in `docs/engineering/architecture.md` replaces it. Section 22 now points M0-AC-011 at `evidence/security-review.md` instead of leaving that criterion open. The binding decisions are unchanged. ADR status lines still say the binding decision is accepted and that revisitable items stay open. That remains accurate.

No binding statement in the ADRs contradicts the code reviewed here.

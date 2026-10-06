# Module 2 preparation

**Status:** Input record for issue #8. The operational contract is [`../specification.md`](../specification.md). The decision that closes the disagreements below is [`reconciliation.md`](reconciliation.md). The test plan is [`../test-plan.md`](../test-plan.md). The reference scene is [`workload.md`](workload.md). Those files are Proposed. They are not Product Owner approval and not implementation authorization.
**Role:** Project Manager for this index. The Tech Lead wrote the contract that supersedes the open rows. The notes below stay the specialist inputs.
**Date:** 2026-10-06

Archive section 9.3 stays context. Its identifiers are not operational requirements. The Module 1 contract this package binds to is pull request #50 at `13f1725750ba047eeed7df6f25fa7155d45cb9d5`, which the Product Owner approved as Module 1 implementation authorization. Module 1 is not GREEN. Pull request #33 is not that contract.

| Note | Issue | Role |
| --- | --- | --- |
| [interaction.md](interaction.md) | #35 | Senior Product Designer / UX Architect |
| [editor-2d.md](editor-2d.md) | #35, #36 | Senior 2D / Editor Engineer |
| [architecture-constraints.md](architecture-constraints.md) | #36 | Tech Lead |
| [evidence-split.md](evidence-split.md) | #37 | Functional Quality Engineer, with Non-Functional Quality |
| [trust-boundary.md](trust-boundary.md) | #38 | Senior Application Security Engineer |
| [verification-environment.md](verification-environment.md) | #39 | Senior DevOps / Platform Engineer |

`editor-2d.md` is the editor record for the same interaction questions and for the editing seam. It is not a second specification.

The evidence note, as first committed, said Module 0 was not GREEN. That sentence was corrected before the notes were merged. Module 0 is GREEN at `5e99484` (issue #1). The correction does not approve a viewport or a file writer.

## Agreed seam

These are the recommendations the notes share. They are not an ADR. Where a bullet says "later" or "recommends", `reconciliation.md` is the current result.

- The first viewport is a later Module 2 proposal. Module 0 has no viewport. `editor` does not import `rendering` until a new ADR amends the import table in `docs/engineering/architecture.md` section 10. This package does not add that ADR and does not take the next ADR number.
- A pointer gesture lives in editor memory. React does not own it, and pointer-move does not call `setState`. Commit replaces finite triples. Cancel drops the proposal and writes no undo step. The Module 0 finite-number rule stays: `-0` becomes `0`, and a non-finite value does not change the document.
- One committed manipulation that changes a transform is one undo step. Pointer samples are not steps. The stack does not survive reload. The Tech Lead recommends storing the canonical before-triples and after-triples in editor memory, which meets the editor note's restore guarantee. The Module 0 records did not select that shape together. No undo API is added.
- A later hit test returns an object id or a miss. The null renderer cannot do that today, and `renderNull` is not extended into a viewport. No graphics API is selected.
- Move, rotate, and scale are headless commands a test can call without a window. The viewport is an adapter that produces those commands.
- Selection feedback uses the existing foundation color roles. No material, light, or new color role.
- Save-and-reopen of a manipulated transform waits for a file writer. It is not a Module 2 command. ADR-0006 is unchanged.
- No new runtime dependency. The verify workflow does not change. Playwright stays deferred. Headed evidence stays a recorded session on the primary Windows machine, naming Edge or Chrome.
- No blocking security finding for this preparation. Commit, cancel, and undo are product behavior, not security controls. Diagnostics do not log pointer paths, key sequences, or scene contents.

## Disagreements closed by the contract

The notes disagreed on the rows below. [`reconciliation.md`](reconciliation.md) gives each row one result. The technical rows are preparation decisions. The product rows are the single proposed meaning in the specification. They are not already accepted.

| Row | Single result |
| --- | --- |
| Box move target | A rectangle moves by a face drag. A box moves only by the axis handle. One gesture is one command. |
| Undo and selection | Undo and redo select the node whose triples the step restores. |
| Redo shortcut | One redo command. Windows and Linux use Ctrl+Shift+Z and Ctrl+Y. macOS uses Cmd+Shift+Z. |
| Hit-test method | A pure CPU function in `editor`. No device and no pick buffer. `renderNull` is unchanged. |
| 4px threshold | A manipulation starts after more than 4 CSS pixels. That distance is editor `begin`. |

## Evidence

The evidence note is the input. The test plan is the current assignment. No millisecond threshold was set.

| Behavior | Class in the test plan |
| --- | --- |
| Pointer selection of a visible object | Headless `hitTest`, plus the headed record for the visible change |
| Move, rotate, and scale change the triples a headless reader sees | Headless command |
| Selected object is visibly distinct | Headed visual record |
| Undo, then redo | Headless command |
| Cancel restores the gesture baseline | Headless command |
| Save and reopen | Out of this module. No file writer |
| Interactive under the reference scene | Observation. Not a pass |
| Earlier approved modules stay green | `pnpm verify` on `ubuntu-24.04` and `windows-2025` |

## Still for the Product Owner

The specification section 16 lists the proposed meanings. Accepting that specification is the decision. It is not implementation authorization. Issue #42 still requires Module 1 to be GREEN before Module 2 can be ready for development.

The proposed frame is Y up, right-handed, intrinsic XYZ, degrees, with the position triple as the center and the fixed view in the specification. Save-and-reopen stays out of Module 2.

## Out of this package

No application code, tests, fixtures, dependencies, workflow edits, or ADR. The specification, test plan, reconciliation, and workload are the integrated draft. They do not authorize implementation.

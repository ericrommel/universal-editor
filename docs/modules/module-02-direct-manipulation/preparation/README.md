# Module 2 preparation

**Status:** Integrated preparation inputs for issue #8. Not a specification. Not Product Owner approval. Implementation stays unauthorized.
**Role:** Project Manager. The notes below are the specialist records. This file records how they fit. It does not replace them.
**Date:** 2026-10-06

Archive section 9.3 stays context. Its identifiers are not operational requirements. Pull request #33 is not an approved Module 1 contract.

| Note | Issue | Role |
| --- | --- | --- |
| [interaction.md](interaction.md) | #35 | Senior Product Designer / UX Architect |
| [editor-2d.md](editor-2d.md) | #35, #36 | Senior 2D / Editor Engineer |
| [architecture-constraints.md](architecture-constraints.md) | #36 | Tech Lead |
| [evidence-split.md](evidence-split.md) | #37 | Functional Quality Engineer, with Non-Functional Quality |
| [trust-boundary.md](trust-boundary.md) | #38 | Senior Application Security Engineer |
| [verification-environment.md](verification-environment.md) | #39 | Senior DevOps / Platform Engineer |

`editor-2d.md` is the editor record for the same interaction questions and for the editing seam. It is not a second specification.

The evidence note, as first committed, said Module 0 was not GREEN. That sentence was stale. Module 0 is GREEN at `5e99484` (issue #1). The correction is in this branch. It does not approve a viewport or a file writer.

## Agreed seam

These are recommendations the notes share. They are not an accepted architecture and not an ADR.

- The first viewport is a later Module 2 proposal. Module 0 has no viewport. `editor` does not import `rendering` until a new ADR amends the import table in `docs/engineering/architecture.md` section 10. This package does not add that ADR and does not take the next ADR number.
- A pointer gesture lives in editor memory. React does not own it, and pointer-move does not call `setState`. Commit replaces finite triples. Cancel drops the proposal and writes no undo step. The Module 0 finite-number rule stays: `-0` becomes `0`, and a non-finite value does not change the document.
- One committed manipulation that changes a transform is one undo step. Pointer samples are not steps. The stack does not survive reload. The Tech Lead recommends storing the canonical before-triples and after-triples in editor memory, which meets the editor note's restore guarantee. The Module 0 records did not select that shape together. No undo API is added.
- A later hit test returns an object id or a miss. The null renderer cannot do that today, and `renderNull` is not extended into a viewport. No graphics API is selected.
- Move, rotate, and scale are headless commands a test can call without a window. The viewport is an adapter that produces those commands.
- Selection feedback uses the existing foundation color roles. No material, light, or new color role.
- Save-and-reopen of a manipulated transform waits for a file writer. It is not a Module 2 command. ADR-0006 is unchanged.
- No new runtime dependency. The verify workflow does not change. Playwright stays deferred. Headed evidence stays a recorded session on the primary Windows machine, naming Edge or Chrome.
- No blocking security finding for this preparation. Commit, cancel, and undo are product behavior, not security controls. Diagnostics do not log pointer paths, key sequences, or scene contents.

## Open disagreements

Left open on purpose. The later specification records both sides and does not silently pick one.

1. **Box move target.** The design note moves a box only by the axis handle under the pointer. The rectangle moves by dragging its face. The editor note allows a body drag to produce `move`, and accepts a combined gizmo as drawing provided one gesture produces one command. The combined affordance itself is not the dissent. The box body is.
2. **Undo and selection.** The design note reselects the affected node on undo and on redo. The editor note does not change selection on undo or redo.
3. **Redo shortcut.** The design note uses Ctrl+Shift+Z and Cmd+Shift+Z, and does not also use Ctrl+Y. The editor note uses Ctrl+Y and Shift+Z.
4. **Hit-test method.** The Tech Lead recommends a later pure CPU test that returns an id or a miss, without a device. The Module 0 rendering record still treats CPU picking versus a pick buffer as deferred. This package does not close that record.

The 4px movement before a manipulation starts is in the design note. The editor note does not name it and does not contradict it. The editor "begin" can be that threshold.

## Evidence

From the evidence note. No threshold was set.

| Behavior | Class |
| --- | --- |
| Pointer selection of a visible object | Blocked, until a viewport and a hit rule exist |
| Move, rotate, and scale change the triples a headless reader sees | Headless command |
| Selected object is visibly distinct | Headed visual record |
| Undo, then redo | Headless command |
| Cancel restores the gesture baseline | Headless command |
| Save and reopen | Blocked, until a file writer exists |
| Interactive under a reference workload | Blocked on issue #41. An observation is not a pass |
| Earlier approved modules stay green | `pnpm verify` on `ubuntu-24.04` and `windows-2025` |

## Still for the Product Owner

No decision here is required to keep these notes. Issue #40 asks later, after a Product Owner-approved Module 1 contract. The choices that note has to present are:

- The numeric frame. The design note recommends Y up, right-handed, intrinsic XYZ, degrees. The editor and architecture notes refuse to interpret triples until that choice is accepted. The recommendation is not accepted.
- Whether the viewport replaces the foundation content root, as the design note recommends.
- The four open disagreements above.
- Whether save-and-reopen stays outside Module 2, as these notes recommend.
- Authorization to implement. That remains issue #42, and it still requires Module 1 to be GREEN.

## Out of this package

No application code, tests, fixtures, dependencies, workflow edits, or ADR. Issues #40, #41, and #42 stay blocked.

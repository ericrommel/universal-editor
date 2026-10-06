# Inherited constraints

**Role:** Project Manager

**Status:** Integration of the specialist notes in this directory. Not a specification. Not implementation authorization. Not a Product Owner request.

**Date:** 2026-10-06

These notes were written after pull request #50 was approved and after the Module 2 preparation notes landed on `main`. The earlier notes in [../reviews](../reviews) stay as the first preparation record. Where one of those reviews still says the five Module 1 rows disagree, or that Module 2 has no notes, this directory and the [dependency map](../dependency-map.md) are the current record.

No specialist dissented.

| Note | Role |
| --- | --- |
| [tech-lead.md](tech-lead.md) | Tech Lead |
| [core-platform.md](core-platform.md) | Senior Core / Platform Engineer |
| [editor-2d.md](editor-2d.md) | Senior 2D / Editor Engineer |
| [rendering-3d.md](rendering-3d.md) | Senior 3D / Rendering Engineer |
| [product-design.md](product-design.md) | Senior Product Designer / UX Architect |
| [application-security.md](application-security.md) | Senior Application Security Engineer |
| [functional-quality.md](functional-quality.md) | Functional Quality Engineer |
| [non-functional-quality.md](non-functional-quality.md) | Non-Functional Quality Engineer |

The DevOps gate is unchanged. The existing [DevOps note](../reviews/devops-platform.md) still describes it. This pass does not add a second one.

## What engineering records

These constraints follow from the approved Module 1 contract and the Module 2 seam. They are not a new product scope.

- Schema token `1` stays closed. Unknown kinds and unknown keys fail `INVALID_SHAPE`. Text, a display name, appearance, an image reference, and a curve are not fields. A later creation document is a new contract.
- Selection stays out of the scene, the document, and the Module 1 editor API. Issue #45 does not put it back.
- Sibling order is `roots` / `rootIds` and the children lists. `nodes` array order is not hierarchy. There is no reorder operation and no stacking field. That order is not visible proof. `renderNull` stays empty. The draw ADR is not opened and is not assigned to Module 3.
- The Module 2 undo recommendation is before-triples and after-triples in editor memory for one committed transform replacement. It does not cover create, delete, duplicate, rename, reorder, appearance change, or extent replacement. A later record of those operations is editor memory, does not survive reload, is not the manifest, and is not pointer samples. The four Module 2 disagreements stay open. The numeric frame is not accepted.
- Ids stay caller-supplied. A later duplicate is a new insert with a second caller-supplied id. Core does not mint it.
- Image bytes stay out of core, the two-field manifest, and the scene document. 1048576 and 262144 are not image budgets. No container is selected. Text and display names are data, not HTML and not entry names. Diagnostics do not log image bytes, text, pointer paths, or scene contents.
- Creation tools stay off the foundation screen. Issue #49 is not issue #40. No shape set, text editor, raster limit, color encoding, or workload number is selected.
- No new dependency, ADR, test, workflow, or scene type.

## Evidence

The functional note's table has no expected result for any Module 3 behavior. A written deferral is still not a test approach. Definition of Ready stays unmet.

That table classes regression of Module 0 together with the future Module 1 checks as blocked, because the Module 1 tests are not on `main`. Module 0 regression itself remains `pnpm verify`. The functional note also lists the approved checks a later Module 3 test must not weaken: unknown kind, unknown key including `selection`, extents `0` and `-1`, the two-field manifest, and the empty draw list.

## Out of this directory

No application code. Issue #9 is not Ready for PO, not Ready for Development, and not Done.

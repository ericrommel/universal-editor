# Module 3 — inherited non-functional limits

**Role:** Non-Functional Quality Engineer

**Status:** Preparation input for issue #9. Not a workload plan and not implementation authorization.

**Date:** 2026-10-06

## Scene-document cap

The Product Owner approved pull request #50 ([issuecomment-6013883562](https://github.com/ericrommel/universal-editor/issues/7#issuecomment-6013883562)). The head is `13f1725`. That pull request is not merged. Module 1 is not GREEN.

Q-M1-B-003 and M1-NFR-007 set the scene-document cap at 1048576 bytes, checked on the byte length before UTF-8 decode and before parse. The cap covers rectangle and box hierarchies with no meshes and no images. It is not an image-byte budget and not a text-size budget. The 262144-byte figure is superseded for that document and is still not an image budget. The manifest cap stays 4096.

No node-count cap was added. A node-count cap beyond the byte cap remains outside the pass/fail rows. This note does not invent one.

This preparation does not put that cap on `pnpm verify` and does not treat Module 1 as a green suite.

## Workload and gate

Module 2 set no workload threshold. An observation is not a pass. Playwright stays deferred. Pipeline timings are observations. `pnpm verify` is the regression gate.

## Not set here

Archive M3-NFR identifiers are not operational requirements.

This preparation sets no image-byte budget, no text-size budget, no frame-time target, no fidelity number, and no reference workload. The Definition of Ready reference-workload bullet stays unmet. This note does not request a Product Owner decision. There is no benchmark file.

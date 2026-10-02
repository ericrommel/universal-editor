# Module 0 — Design proposal review

**Role:** Senior Product Designer / UX Architect
**Status:** Concurrence. The architecture proposal adopts the Module 0 foundation-screen specification. Not a visual mock, not an implementation review, and not M0-AC-012.
**Date:** 2026-10-02

I checked the proposal against `docs/modules/module-00-foundation/preparation/reviews/product-design.md`. That file is the specification. This review does not restate its tables.

## What was checked

- The specification: exact user-visible strings, the purpose sentence, window title and document title, status names and sentences, the Details control, light and dark color roles, type scale, space scale, 4.5:1 text contrast, 3:1 non-text contrast, system appearance with a light fallback, forced colors, focus, reduced motion, text scaling, reading order, no icon, and no editor chrome.
- `docs/engineering/architecture.md` section "Design intent"; sections 2, 7, 14, 17, and 21; and "Resolved disagreements".
- `docs/engineering/adr/0008-editor-state-and-shell-content.md`.

Design intent names the specification as the Module 0 design intent for M0-FR-009, M0-NFR-008, and the later M0-AC-012 review, and adopts it as written. The adoption includes the foundation screen, the exact strings, the light and dark color roles, the type and space scales, the 4.5:1 text contrast target, the 3:1 non-text target, system appearance with a light fallback, and the absence of an editor frame. Focus, reduced motion, text scaling, forced colors, the Details control, reading order, and the Web chrome row stay in force because they are in the adopted specification.

The native window title is `Foundation`. The on-screen heading is `Universal Visual Creation Platform`. There is no icon and no placeholder logo. Section 2 paints this screen and does not draw a viewport. Section 7 limits ephemeral UI state to the Details disclosure and adds no selection, tool, panel, undo stack, or viewport-attach API. Section 14 requires manual confirmation of Ready, and of Not ready on the dev-only failure path. Section 17 keeps diagnostic `version` `0.0.0` in the log record, not on the screen. Section 21 follows the specification for contrast, text size, reduced motion, and system chrome, and does not claim App Store readiness.

## Amendments

### No viewport, canvas, toolbar, hierarchy, or frame probe

This amendment does not contradict the specification.

The specification already forbids a viewport, a canvas, a toolbar, a hierarchy, and a frame probe, including empty regions held for later modules. Resolved disagreements reject the editor review's viewport-first frame. ADR-0008 records notes for a later viewport and does not specify that viewport in Module 0. Those notes are not a widget on this screen and do not add a host element. A later module replaces the content root. It does not inherit empty regions. This review does not decide a future editor layout.

### `UVCP_FORCE_INIT_FAILURE` is not a visible control and is absent from the production bundle

This amendment does not contradict the specification.

The only product control is Details / Hide details. The variable is not on the screen. ADR-0008 rejects shipping it. Architecture section 17 does not compile it into the production bundle. `pnpm dev` may honor `UVCP_FORCE_INIT_FAILURE=1`. Any other set value fails startup rather than succeeding. None of those cases adds a control. Keeping it out of the production bundle does not remove Not ready. On an open shell, failure still shows Not ready, the application message, and the detail sentence, including when the diagnostic is collapsed. A headless failure with no window does not replace that on-screen state.

## Concurrence

The foundation screen can be implemented from the specification plus these two amendments. Neither amendment contradicts the design intent. An engineer does not invent a visual language, a failure control, or a viewport probe to satisfy the proposal.

M0-AC-012 is not decided here. It passes later only when every blocking condition in the specification is false for the shell that launches.

CONCUR

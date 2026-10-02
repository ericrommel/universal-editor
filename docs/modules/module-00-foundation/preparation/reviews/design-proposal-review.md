# Module 0 — Design proposal review

**Status:** Review of the architecture proposal's adoption of the Module 0 design intent. Not a visual mock, not an implementation review, and not M0-AC-012.  
**Role:** Senior Product Designer / UX Architect  
**Date:** 2026-10-02  
**Question:** Can the foundation screen be implemented from the design review plus the stated amendments without an engineer inventing a visual language?

## Documents read

- `docs/modules/module-00-foundation/preparation/reviews/product-design.md` (the design intent)
- `docs/engineering/architecture.md`, section "Design intent", and the shell decisions that carry it (sections 2, 7, 14, 17, and 21, and "Resolved disagreements")
- `docs/engineering/adr/0008-editor-state-and-shell-content.md`

The design review remains the visual and interaction specification. This file only checks whether the proposal keeps that specification.

## Adoption

The architecture section "Design intent" names the design review as the Module 0 design intent for M0-FR-009, M0-NFR-008, and the later M0-AC-012 review, and adopts that review as written. The sentence lists the foundation screen, the exact strings, the light and dark color roles, the type and space scales, the 4.5:1 text contrast target, the 3:1 non-text target, system appearance with a light fallback, and the absence of an editor frame.

"As written" is the whole design review. That list is not a shorter substitute. Rules the paragraph does not repeat — focus, reduced motion, text scaling, forced colors, the details control, reading order, and the Web chrome row — stay in force because they are in the adopted document. Architecture section 21 repeats contrast, text size, reduced motion, and system chrome for the shell.

ADR-0008 decides that the Module 0 screen is that foundation screen: identity, purpose, and startup status. No viewport, no canvas, no frame loop, no fake tools.

## Amendments

### No viewport, canvas, toolbar, hierarchy, or frame probe

This amendment does not contradict the design intent.

The design review already forbids a viewport, a canvas grid, a toolbar, a hierarchy, an inspector, a timeline, splitters, docks, and empty regions held open for later modules. That is the "What must not appear" list, DV-04, DV-15, and the rejected empty editor frame. The editor review's viewport-first frame, mount effect, and frame probe are the conflict ADR-0008 records. Rejecting that frame is the design review's outcome, not a new visual.

The future handoff in ADR-0008 — one host element, editor-owned frames, and a coarse chrome subscription — is a later boundary. The architecture amendment says that rule is not a Module 0 widget. ADR-0008 says implementing the handoff in Module 0 does not. The handoff does not put a surface, a slot, or a panel host on this screen, and it does not replace the rule that a later module replaces the content root instead of inheriting empty regions. An empty host element on the foundation screen would violate both documents.

### `UVCP_FORCE_INIT_FAILURE` is not a visible control and is absent from the production bundle

This amendment does not contradict the design intent.

The design review defines one product control: Details / Hide details. A failure switch, button, or field on the screen would be a second control, and it would be an invented one. The proposal keeps the variable off the screen. ADR-0008 rejects shipping it in the production bundle. Architecture section 17 does not compile it into that bundle. Any value other than unset, `0`, or `1` fails startup rather than succeeding. None of those cases adds a control.

Keeping the variable out of the production bundle does not remove Not ready. ADR-0008 still requires that, on failure, the screen shows Not ready and the application message, and that the detail sentence stays visible if a longer diagnostic is collapsed. `pnpm dev` still honors `UVCP_FORCE_INIT_FAILURE=1`, and architecture section 14 requires that path to show Not ready. A real startup failure in the production shell still uses the same screen state. The headless script may fail without a window; that does not replace the on-screen failure state when the shell is open.

## Blocking constraints

### Contrast

Kept. Both light and dark role sets, the specified hex values, 4.5:1 for every visible string against its immediate background, and 3:1 for the border, the focus mark, and the status dot remain the targets. When forced colors or `prefers-contrast: more` is active, system colors replace the hex palette. The proposal adds no third palette and no in-app theme switch. System appearance with a light fallback is restated and matches assumption A-05. The shell is not dark-only.

### Strings

Kept. "Exact strings" adopts the full constant table, including `string.purpose`, the three status words, the three detail sentences, Details / Hide details, and `string.diagnosticEmpty`. The proposal restates the on-screen heading `Universal Visual Creation Platform`, the native window title `Foundation`, no icon asset, and no placeholder logo. That matches DV-01 and assumptions A-01, A-02, and A-04.

Module 0 launches in the browser. The adopted Web row still sets the document title to `string.webDocumentTitle` (`Foundation — Universal Visual Creation Platform`). The native title `Foundation` is the purpose label for a later window. It does not replace the browser title, and it is not the product name.

No version line is added. The diagnostic record's private `0.0.0` is a log field. The design review still says to omit a version from the screen. The application message on failure is diagnostic text, not a new status word and not a new designed sentence. If that message is missing, `string.diagnosticEmpty` still fills the slot.

### No editor chrome

Kept. The first amendment makes the rejection explicit against the editor review. The screen stays one top-weighted, start-aligned column. No viewport, canvas, frame probe, toolbar, hierarchy, inspector, timeline, splitter, dock, empty panel slot, sample object, transform field, disabled authoring command, Get Started action, splash, gradient, glass, blur, or image. Architecture section 7 puts no selection, tool, panel, undo stack, or viewport-attach API in Module 0. The proposal also excludes a docking layout and a non-functional editor mock. The only structural allowance for later work remains replacement of this content root.

### Status behavior

Kept. Editor session values `starting`, `ready`, and `failed` are not on-screen words. The screen words remain Starting, Ready, and Not ready, with the matching detail sentences. ADR-0008 maps failure to Not ready plus the application message and keeps the detail sentence visible when the diagnostic is collapsed. Architecture section 7 limits ephemeral UI state to the Details disclosure, which is the only product control in the design review.

These rules are in the adopted design review and are not amended:

- Skip Starting when the window is shown only after initialization finishes. Do not flash an empty window. If the window is shown during startup, show Starting immediately, with no spinner and no progress animation, then replace it in place.
- Not ready starts expanded. Ready starts collapsed. Ready with no diagnostic has no Details control.
- The diagnostic is plain text, wrapped, selectable, and copyable. It is not HTML, Markdown, or a terminal. There is no log viewer, filter, or copy button.
- The status word carries the meaning. The dot is optional, decorative, and not the accessible name. Starting has no dot and no warning color.
- No modal is required to understand failure. Escape does not quit. Escape collapses an expanded diagnostic only when focus is on its control.

### Platform chrome

Kept. The loopback web shell is the design review's Web row, not a new chrome language. The browser owns the window frame and Close. The page does not draw a title bar, traffic lights, caption buttons, an application menu bar, a site header, a footer, or a marketing nav. There is no File menu and no New, Open, Save, or Export, including disabled. About and Quit are not painted into the page to imitate a desktop menu. Those commands remain the design review's desktop rows for a later host. One shared UI package, architecture confirmation 5, matches the rule that a later port does not get a new visual language. Pixel-identical desktop chrome is still not required.

Custom-drawn surfaces use the token roles. The details control is a platform button — on this shell, a native HTML button — or the quiet fallback specified in the design review if a native button cannot be drawn. No button family, pill, or marketing call to action is authorized. The focus-ring rules still apply. `motion.duration.instant` is still the only motion.

## Implementation

The foundation screen can be implemented from the design review plus these two amendments. Layout numbers, tokens, strings, state presentation, focus, reduced motion, text scaling, and the Web chrome row are already specified. The amendments only refuse a viewport probe and refuse an on-screen or production-bundle failure switch. Neither amendment contradicts the design intent.

An engineer does not invent a component library, a second type style, a brand font, an icon, a theme control, a Starting color, a failure toggle, or a host element so a future viewport has a place.

M0-AC-012 is not decided here. It is a later review of the shell that actually launches. It passes only when every blocking condition in the design review's checklist is false for that shell. This review says only that the proposal leaves those conditions specified and does not contradict them.

CONCUR

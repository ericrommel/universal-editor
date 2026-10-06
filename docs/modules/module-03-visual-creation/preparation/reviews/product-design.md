# Module 3 preparation — product design

**Role:** Senior Product Designer / UX Architect
**Date:** 2026-10-06
**Status:** Preparation note for issue #9. Interaction constraints for a later visual-creation surface. Not a wireframe, not a component specification, not implementation authorization, and not a request for the Product Owner to approve a layout.

This note does not start issue #49. That issue is the future creation surface, and it stays blocked by issues #7 and #8. Definition of Ready for Module 3 is not met. Archive section 9.4 in `docs/archive/product-engineering-specification-v1.0.md` is context only. Its identifiers are not operational requirements.

## What the current screen is allowed to be

The only screen is the foundation screen specified in `docs/modules/module-00-foundation/preparation/reviews/product-design.md` and implemented in `packages/ui/src/foundation-screen.tsx`. The purpose string in `packages/ui/src/strings.ts` says this build only proves the application foundation and that creation tools are not part of it.

ADR-0008 (`docs/engineering/adr/0008-editor-state-and-shell-content.md`) and the design intent in `docs/engineering/architecture.md` adopt that screen: identity, purpose, and startup status. No viewport, no canvas, no toolbar, no hierarchy, no inspector, and no fake tools. Editor state on this screen remains `starting`, `ready`, or `failed`.

The screen stays one content column. It is not a docking frame and it does not reserve empty regions for a later module. A later module replaces the content root. It does not inherit a frame of slots. The only product control remains Details / Hide details, and only when a diagnostic exists. Platform chrome still must not gain New, Open, Save, Export, or any other authoring command, including a disabled one.

Tokens in `packages/ui/src/tokens.ts` stay the visual language of this screen: the light and dark roles, system appearance with a light fallback, and no in-app theme picker. No second visual language is added here.

## Discoverability

The archive usability sentence says primary creation actions shall be discoverable from the default creation interface without requiring advanced panels. That sentence is context only. Discoverability cannot be tested, and it cannot be designed in detail, until a default creation interface exists. This screen is not that interface. Adding creation actions here would make the purpose copy false.

"Default creation interface" does not mean:

- the foundation screen, or a rewrite of its purpose sentence that announces tools this build does not have;
- a disabled or empty toolbar, palette, hierarchy, or inspector on that screen, which is the empty editor frame ADR-0008 and the Module 0 design review rejected;
- a second widget toolkit, icon family, or component library beside the Module 0 tokens.

Direct manipulation is principle P-03 in `docs/product-overview.md`, and it is Module 2, issue #8. Issue #8 has no design and no viewport. A creation control that does not show a result is not the product.

## Questions that are real and premature

These questions block implementation of a creation surface. They are not answered here. Asking them now would freeze a layout against an unsettled scene. Answer them when Module 1 has an approved object model and Module 2 has a viewport direction. Issue #49 tracks that surface. This note does not open it.

| Question | Class |
| --- | --- |
| Which shapes | Blocked on Module 1. No approved objects, so there is no set to expose. |
| Where the first actions live | Blocked on Module 2. No viewport, so there is no place a result can appear. |
| Inline text versus a field | Blocked on Module 2. The choice is the visible result versus an abstract field, and no viewport exists. A text object is also not approved. The interaction is not chosen here. |
| Color control | Later design decision. The control is not designed in this note. |
| Platform shortcuts | Later design decision. No creation commands exist to bind, and Module 0 does not copy one platform's commands onto the others. |

## Principles that bind a later surface, without designing it

From `docs/product-overview.md`:

- P-01. One visual space. Shapes, text, and images do not become separate editors joined only at the chrome. This note does not draw that space.
- P-02 and P-06. Progressive complexity, simple by default. The first surface does not put vector path editing, advanced typography, image filters, templates, or a marketplace into the first row. The archive already places those out of scope. Those panels are not designed here.
- P-03. Direct manipulation. Creation is interaction with a visible result, not a control that only names a future object.
- P-04. Non-destructive creation. The first creation step is not specified here as a destructive conversion. Undo is not designed here. Issue #8 has not chosen a history model.
- P-05. Continuum. A later 2D object must be able to gain spatial properties without abandoning the scene. Extrusion and materials are not designed here.

## Accessibility that already exists and must survive

These constraints already bind the foundation screen. They survive for any later surface. This note does not design the widgets that would carry them.

- Contrast. Visible text meets 4.5:1 against its immediate background in both default appearances. Non-text marks that communicate state or focus meet 3:1, unless forced colors or increased contrast has replaced the hex palette. Do not paint the custom palette over system colors. Do not add a third contrast theme or an in-app appearance control.
- Text size. Nothing on this screen goes below 14px at 100% scale. At 200%, name, purpose, status, and diagnostic stay readable by vertical scroll, without essential horizontal scroll and without ellipsis. Web type stays in relative units. A later surface does not get a new type scale in this note.
- Reduced motion. This shell has no entrance animation, spinner, or animated disclosure. The only duration is instant. There is no in-app motion toggle. If a later surface adds custom motion, it honors the platform reduced-motion signal.
- Focus. On this screen the details control is in the tab order only when it exists. Focus is visible, not trapped, and not moved on a timer. That control is not autofocused on launch. Tab order for creation controls is not specified, because those controls do not exist.
- Color is not the only signal on this screen. The status word carries the meaning. The dot is decorative.

## Non-goals

- No commands, strings, or controls added to `packages/ui`.
- No layout, wireframe, empty state, toolbar, or icon set.
- No change to the foundation screen, its purpose copy, or its tokens.
- No viewport, canvas, hierarchy, inspector, or disabled authoring chrome.
- No design of vector path editing, advanced typography, image filters, templates, a marketplace, or the panels that would hold them.
- No start of issue #49, and no Product Owner request to approve a creation layout.
- No claim that discoverability was observed. There is no default creation interface to observe.

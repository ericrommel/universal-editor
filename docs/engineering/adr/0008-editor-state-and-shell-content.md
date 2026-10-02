# ADR-0008: Editor state and shell content

**Status:** Proposed  
**Date:** 2026-10-02  
**Decider:** Tech Lead  
**Consulted:** Senior 2D / Editor Engineer, Senior Product Designer / UX Architect, Senior 3D / Rendering Engineer, Functional Quality Engineer, Non-Functional Quality Engineer

## Context

Module 0 needs an application shell and an editor/application boundary. It does not implement the visual editor. Two specialist recommendations conflicted:

- The editor review wanted a viewport-first frame, a mount effect that attaches a surface, and a probe that can pump frames outside React, so later modules do not put the scene in React state.
- The design review rejected a viewport, a toolbar, a hierarchy, and an empty editor frame. The rendering review rejected a canvas and a GPU probe.

M0-AC-012 will review the shell against the design intent. A probe canvas would give that review the wrong object.

## Decision

The Module 0 screen is the foundation screen in `docs/modules/module-00-foundation/preparation/reviews/product-design.md`. Identity, purpose, and startup status. No viewport, no canvas, no frame loop, no fake tools.

Editor session state is only startup: `starting`, `ready`, or `failed`. The shell calls `editor.start` with an initializer, then passes strings into the UI package. The UI package does not import the editor.

Diagnostics use `startup.beginning`, `startup.ready`, and `startup.failed`, as specified in the architecture document. On failure the screen shows Not ready and the application message. The detail sentence stays visible if a longer diagnostic is collapsed.

Failure injection:

- Tests and the headless composition script pass a throwing initializer. The script writes the failed event to stderr and exits non-zero. The success path exits zero. Neither opens a window.
- `pnpm dev` reads `UVCP_FORCE_INIT_FAILURE`. Unset or `0` starts normally. `1` fails the step `forced-initialization-failure` after the diagnostic sink exists and before ready. Any other value fails startup as an invalid value, not as success.
- The production build does not read that variable.

There is no selection field, tool enum, panel registry, command bus, or undo stack in Module 0 types. Empty fields would become an API.

### Future handoff, not implemented

When a viewport is an approved feature:

- React may create one host element. It does not render frames.
- The editor attaches that element to the rendering boundary. Pointer input for manipulation is registered there, not as React state on pointer-move.
- Chrome subscribes to coarse commits (selection, tool, panels), not to frame ticks.
- Hit testing returns a domain id. It does not return a render object for the UI to mutate.
- Selection, active tool, and panel visibility are editor session state, not scene fields, unless the Product Owner later wants them persisted. The recommendation is not to persist them in the creative document.
- One UI package is mounted by the web host and by any desktop host.

Changing this handoff requires a new ADR. Implementing it in Module 0 does not.

## Alternatives

### Viewport host plus a labeled probe

Proves the React boundary with a test that pumps frames and counts renders. It also puts a surface on the only screen Module 0 has, which the design intent forbids, and it invites the probe to be cited as the renderer. Rejected for Module 0. The constraint is written here so it does not depend on someone remembering a review comment.

### Multi-panel mock

Gives a familiar picture and freezes an information architecture the Designer has not designed. Rejected.

### Redux or a global event bus for the shell

Two startup commands do not need a store framework. Rejected. Editor session and the future undo stack stay in the editor package.

### Ship `UVCP_FORCE_INIT_FAILURE` in the production bundle

Easier to flip in a packaged build, and it is a permanent test switch in user-facing assets. Rejected. The headless script covers the automated failure path.

## Consequences

- M0-AC-012 reviews a foundation screen, not an empty editor.
- The frame-loop render-count test the editor review described is not a Module 0 test. The import rules and the headless editor tests are the boundary evidence instead.
- A later module that adds a canvas must follow the handoff above and must not treat this ADR as already having built it.

## Confirmation

Product Owner confirmation 4 accepts the foundation screen copy and appearance assumptions. Confirmation 5 accepts one shared UI implementation for later desktop chrome. Neither confirmation adds a viewport to Module 0.

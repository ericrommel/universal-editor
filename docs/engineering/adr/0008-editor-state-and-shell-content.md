# ADR-0008: Editor state and shell content

**Status:** Accepted for the binding Module 0 decision. Revisitable and deferred items stay open.  
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

### Notes for a later viewport, not a specification

A later module that adds a viewport writes its own decision. The notes that should not be lost, and that are not binding, are: do not put frame ticks in React state, and do not treat the Module 0 screen as the editor layout. How hit testing, selection, and a host element work is deferred.

## Alternatives

### Viewport host plus a labeled probe

Proves the React boundary with a test that pumps frames and counts renders. It also puts a surface on the only screen Module 0 has, which the design intent forbids, and it invites the probe to be cited as the renderer. Rejected for Module 0. The constraint is written here so it does not depend on someone remembering a review comment.

### Multi-panel mock

Gives a familiar picture and freezes an information architecture the Designer has not designed. Rejected.

### Redux or a global event bus for the shell

Two startup commands do not need a store framework. Rejected for Module 0. Where a later undo stack lives is deferred.

### Ship `UVCP_FORCE_INIT_FAILURE` in the production bundle

Easier to flip in a packaged build, and it is a permanent test switch in user-facing assets. Rejected. The headless script covers the automated failure path.

## Consequences

- M0-AC-012 reviews a foundation screen, not an empty editor.
- The frame-loop render-count test the editor review described is not a Module 0 test. The import rules and the headless editor tests are the boundary evidence instead.
- A later viewport is not specified here and is not authorized by this ADR.

## Confirmation

The Product Owner confirmed the foundation-screen copy and appearance on 2026-10-02. That confirmation does not add a viewport and does not decide later desktop chrome.

# ADR-0002: React for the Module 0 foundation screen

**Status:** Accepted for the binding Module 0 decision. Revisitable and deferred items stay open.  
**Date:** 2026-10-02  
**Decider:** Tech Lead  
**Consulted:** Senior 2D / Editor Engineer, Senior Product Designer / UX Architect

**Binding for Module 0:** client-side React for the foundation screen, in `packages/ui`, with no scene ownership.  
**Revisitable:** whether later editor chrome stays on React.  
**Deferred:** any viewport host element.

## Context

Module 0 needs one accessible foundation screen. It has no viewport (ADR-0008). M0-NFR-006 requires a realistic alternative, not a familiar default. The framework for later editor chrome is a separate question and is not decided here.

## Decision

Use client-side React for the Module 0 foundation screen. Put it in `packages/ui`. Do not use React to store a scene, schedule frames, or own editor session state.

Module 0 chrome is semantic HTML plus the design tokens in the Module 0 design intent. No component library, no Next.js, no server components, and no router.

The shell passes a plain view model into the UI package. `packages/ui` does not import `editor` or `core`. Module 0 does not create a viewport host element.

Whether a later module keeps React, subscribes to an editor snapshot, or creates a host element is deferred. Those choices must not be read out of this ADR.

## Alternatives

### Solid

The serious alternative for this screen. Fine-grained updates and a smaller runtime. The accessible-widget ecosystem is thinner than React's. Rejected for the Module 0 screen. It remains available if a later chrome decision rejects React. Do not mix the two in Module 0.

### Svelte

Svelte 5 can paint the same screen. Single-file components and SvelteKit's site defaults fight a host-neutral UI package and a desktop webview. Rejected.

### Vanilla DOM for the whole shell

Vanilla DOM can paint this one screen. It is a poor fit for the accessible foundation screen. Rejected for Module 0. It does not decide how a later viewport draws.

### Per-platform native widgets

AppKit, WinUI, or GTK would split every interaction the Designer specifies. Rejected unless the Product Owner makes native widgets a product requirement. That requirement is not in the product overview. Desktop is first-class through capabilities, not through a second widget toolkit.

## Consequences

- `packages/ui` depends on React. `packages/core`, `packages/editor`, `packages/persistence`, and `packages/rendering` do not.
- Module 0 does not add React Testing Library or jsdom. The screen is reviewed against the design intent and by the documented manual launch.
- This ADR does not forbid or require React for a later editor.

## Confirmation

The Product Owner accepted React for the Module 0 foundation screen on 2026-10-02. That acceptance does not change product scope and does not decide later desktop chrome.

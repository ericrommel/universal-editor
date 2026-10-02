# ADR-0002: React for editor chrome

**Status:** Proposed  
**Date:** 2026-10-02  
**Decider:** Tech Lead  
**Consulted:** Senior 2D / Editor Engineer, Senior Product Designer / UX Architect

## Context

The shell and the later editor chrome are accessible application UI around an imperative surface. Menus, dialogs, lists, and text fields need focus order and semantics that will outlive Module 0. The frame loop, when a viewport exists, must not be a React render. Module 0 itself has no viewport (ADR-0008).

M0-NFR-006 requires a realistic alternative, not a familiar default.

## Decision

Use client-side React for the foundation screen and for future editor chrome. Put it in `packages/ui`. Do not use React to store a scene, schedule frames, or own editor session state.

Module 0 chrome is semantic HTML plus the design tokens in the Module 0 design intent. No component library, no Next.js, no server components, and no router.

The shell passes a plain view model into the UI package. `packages/ui` does not import `editor` or `core`. If a later module needs the UI to subscribe to an editor snapshot, that subscription uses `useSyncExternalStore` or the equivalent, and the snapshot contains ids and flags, not scene objects and not component types. That subscription is not a Module 0 feature.

React's job ends at chrome. A future viewport host element may be created by React. Frame scheduling, resize of the drawing buffer, drawing, and viewport pointer input belong to editor and rendering code. React state updates on pointer-move are a boundary violation. Module 0 does not create the host element.

## Alternatives

### Solid

The serious alternative. Fine-grained updates and a smaller runtime. The gain appears when chrome subscribes to high-frequency values, which this architecture forbids. The accessible-widget ecosystem is thinner than React's, and that ecosystem is the long-term cost of this product's chrome. Rejected. Solid remains the fallback if the Product Owner rejects a React chrome. The package split does not change. Do not mix the two.

### Svelte

Svelte 5 can paint the same screen. Single-file components and SvelteKit's site defaults fight a host-neutral UI package and a desktop webview. Rejected.

### Vanilla DOM for the whole shell

Vanilla DOM is required inside a future rendering boundary. It is the wrong tool for a multi-year accessible chrome. Rejected as the shell framework.

### Per-platform native widgets

AppKit, WinUI, or GTK would split every interaction the Designer specifies. Rejected unless the Product Owner makes native widgets a product requirement. That requirement is not in the product overview. Desktop is first-class through capabilities, not through a second widget toolkit.

## Consequences

- `packages/ui` depends on React. `packages/core`, `packages/editor`, `packages/persistence`, and `packages/rendering` do not.
- Module 0 does not add React Testing Library or jsdom. The screen is reviewed against the design intent and by the documented manual launch.
- A future drag must not write preview coordinates into React state.

## Confirmation

Choosing React does not change product scope if the shared-UI confirmation in the architecture proposal is accepted. Rejecting a shared web UI reopens this ADR.

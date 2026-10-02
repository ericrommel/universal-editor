# ADR-0001: TypeScript for Module 0

**Status:** Proposed  
**Date:** 2026-10-02  
**Decider:** Tech Lead  
**Consulted:** Senior Core / Platform Engineer, Senior DevOps / Platform Engineer, Senior 3D / Rendering Engineer

**Binding for Module 0:** the packages this module creates are TypeScript.  
**Revisitable:** a later measured numeric function may move behind a narrow boundary.  
**Deferred:** the language of the authoritative scene, and of any later core that replaces these packages.

## Context

The product must run on the web and on desktop, and the project model must not depend on one operating system or one presentation layer (product overview, P-08; M0-NFR-007). Module 0 must provide a platform-neutral core that tests without a graphical window (M0-FR-002, M0-NFR-003). The core must not import a desktop shell, a UI framework, or platform filesystem APIs (M0-NFR-002).

Module 0 does not implement a scene graph. The language of that later scene is not decided here. Choosing TypeScript for this module's packages does not require the later scene to stay in TypeScript.

## Decision

Write the Module 0 packages in TypeScript and compile them to ordinary JavaScript. Headless tests run under Node.

Domain values that exist in this module are plain data. Operations are functions from one value to the next. Runtime validation of untrusted bytes stays in persistence, because TypeScript types are erased.

JavaScript numbers are IEEE 754 binary64. The Module 0 numeric helpers canonicalize `-0` to `0` and reject `NaN` and infinities. They do not treat `JSON.stringify` as a numeric serializer.

This decision stops at those packages. It does not require a later desktop host to execute them, and it does not forbid a later module from implementing the authoritative scene in another language. That choice needs its own ADR when rendering, performance, desktop, and domain evidence exists. A measured numeric function may later move behind a boundary that accepts and returns buffers or numbers. That function does not, by itself, decide the scene language.

## Alternatives

### Rust core, native on desktop and WebAssembly on the web

A real alternative. `cargo test` is headless, and the performance ceiling for later meshes is higher.

Rejected for Module 0. Not a decision about the later scene:

- Module 0 would carry two targets and a JS glue layer before a scene exists.
- The editor would be tempted to copy the hierarchy into JavaScript, which is a second scene graph.
- Threaded Wasm needs cross-origin isolation. The performance argument does not transfer to the web for free.
- The product UI will not be a Rust widget tree. The interop boundary is paid on every inspector refresh.

Rust remains available for a later scene ADR. This record does not set the condition that would choose it.

### C# and Blazor

Blazor Server needs a server circuit and is incompatible with a local editor that works without a backend. Blazor WebAssembly downloads a .NET runtime. Using C# only so a webview can host it adds a runtime the TypeScript core does not need. Rejected.

### Python as the client core

Pyodide is a real CPython-in-Wasm distribution and is hundreds of megabytes. Desktop CPython would be a second runtime. Python is the wrong language for the Module 0 packages. It is not ruled out as a later sidecar or as a later scene language.

A Python sidecar that exchanges validated bytes is revisitable direction. It is not a Module 0 dependency and not a selected protocol.

## Consequences

- One toolchain for Module 0: Node, pnpm, and TypeScript. No Rust and no Python on the Module 0 developer path.
- Headless tests use Node. They do not prove GPU behavior, and they are not required to.
- The numeric limits of the Module 0 helpers are explicit. They do not set the numeric model of a later scene.
- A later decision to leave TypeScript is a new ADR. This one does not have to be reopened merely because a host or a scene is being discussed.

## Confirmation

The Product Owner authorizes this choice as part of the Module 0 architecture. It does not change product scope.

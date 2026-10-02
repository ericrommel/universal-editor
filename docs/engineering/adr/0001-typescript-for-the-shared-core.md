# ADR-0001: TypeScript for the shared core

**Status:** Proposed  
**Date:** 2026-10-02  
**Decider:** Tech Lead  
**Consulted:** Senior Core / Platform Engineer, Senior DevOps / Platform Engineer, Senior 3D / Rendering Engineer

## Context

The product must run on the web and on desktop, and the project model must not depend on one operating system or one presentation layer (product overview, P-08; M0-NFR-007). Module 0 must provide a platform-neutral core that tests without a graphical window (M0-FR-002, M0-NFR-003). The core must not import a desktop shell, a UI framework, or platform filesystem APIs (M0-NFR-002).

Module 0 does not implement a scene graph. The language decision still matters, because the scene, persistence, and undo in later modules should not begin life on the wrong side of a foreign-function boundary.

## Decision

Implement the authoritative domain and the persistence codec in TypeScript. Compile to ordinary JavaScript. Web and any later desktop host load that same package.

Domain values are plain data. Operations are functions from one value to the next. Runtime validation of untrusted bytes stays in persistence, because TypeScript types are erased.

JavaScript numbers are IEEE 754 binary64. Domain code canonicalizes `-0` to `0` and rejects `NaN` and infinities. It does not treat `JSON.stringify` as a numeric serializer.

A later measured hot function may be replaced by WebAssembly that accepts and returns buffers or numbers. That kernel must not own hierarchy, identity, or persisted transforms. Replacing the authoritative scene with another language is a new ADR.

## Alternatives

### Rust core, native on desktop and WebAssembly on the web

A real alternative. `cargo test` is headless, and the performance ceiling for later meshes is higher.

Rejected for Module 0, and not the default home for the scene:

- Module 0 would carry two targets and a JS glue layer before a scene exists.
- The editor would be tempted to copy the hierarchy into JavaScript, which is a second scene graph.
- Threaded Wasm needs cross-origin isolation. The performance argument does not transfer to the web for free.
- The product UI will not be a Rust widget tree. The interop boundary is paid on every inspector refresh.

Take Rust as the scene implementation only if a future host cannot run this TypeScript package, or if a pure TypeScript kernel misses a measured budget. Do not keep two authoritative scenes during a migration.

### C# and Blazor

Blazor Server needs a server circuit and is incompatible with a local editor that works without a backend. Blazor WebAssembly downloads a .NET runtime. Using C# only so a webview can host it adds a runtime the TypeScript core does not need. Rejected.

### Python as the client core

Pyodide is a real CPython-in-Wasm distribution and is hundreds of megabytes. Desktop CPython would be a second runtime. Python is the wrong home for the authoritative scene.

Python remains the future integration shape for a sidecar: versioned bytes in, validated operations out, no shared object graph. Not a Module 0 dependency.

## Consequences

- One toolchain for Module 0: Node, pnpm, and TypeScript. No Rust and no Python on the developer path.
- Headless tests use Node. They do not prove GPU behavior, and they are not required to.
- The numeric and serialization limits of JavaScript are explicit. Later geometry that cannot live with them stops and gets a new decision.
- Any desktop shell that cannot execute this package reopens this ADR before Module 1.

## Confirmation

The Product Owner authorizes this choice as part of the Module 0 architecture. It does not change product scope.

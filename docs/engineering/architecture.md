# Architecture

**Status:** Not yet approved

This document is intentionally incomplete.

The initial architecture must be proposed by the AI Tech Lead during Module 0 architecture preparation and reviewed by the Human Product Owner before Module 0 becomes READY FOR DEVELOPMENT.

The Tech Lead must base the proposal on:

- `/docs/product-overview.md`
- `/docs/engineering/development-process.md`
- `/docs/modules/module-00-foundation/specification.md`
- `/docs/modules/module-00-foundation/test-plan.md`

The archived full product specification may be consulted for long-term context only. It must not be treated as authorization to implement future modules.

## Required Architecture Topics

The proposal must address at least:

1. primary implementation language(s);
2. frontend/UI framework;
3. rendering technology;
4. Web GPU/rendering strategy;
5. desktop application strategy;
6. scene/domain architecture direction;
7. editor state architecture;
8. project persistence strategy;
9. undo/redo architecture direction;
10. monorepo/workspace structure;
11. build tooling;
12. unit testing;
13. integration testing;
14. UI/end-to-end testing;
15. rendering/visual regression testing;
16. CI strategy;
17. logging and diagnostics;
18. dependency boundaries;
19. future backend/Python integration;
20. cross-platform build/release strategy;
21. Apple/macOS distribution implications;
22. security/trust boundaries;
23. major technical risks.

For major technology choices, evaluate at least one realistic alternative and explain the trade-offs.

Do not select technologies merely because they are familiar or convenient for a prototype.

Do not implement production application code as part of the architecture proposal.

## Decisions Requiring PO Review

The proposal must end with a clearly identified list of:

- recommended decisions;
- assumptions;
- unresolved questions;
- significant risks;
- decisions requiring Product Owner approval.

Major decisions should be recorded as ADRs under `/docs/engineering/adr/`.

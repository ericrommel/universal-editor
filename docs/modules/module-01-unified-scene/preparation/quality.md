# Module 1 preparation — quality input

**Role:** Functional Quality Engineer

**Status:** Preparation input for issue #7. This is not an operational specification, not implementation authorization, and not acceptance of Module 0.

## 1. Current gate

Module 0 pull request 31 is merged as `5e994841cdfc16b426d26e735f92d9b5c9b61beb`. The Product Owner approved that pull request. Issue #1 stays open for module acceptance. Module 0 is not GREEN.

Development process sections 2 and 20 allow Module 1 implementation only after Module 0 is GREEN and the Product Owner explicitly approves the module. Research, test design, and architecture work may start earlier. This note is that earlier test-design input. It adds no scene behavior.

Issue #7 states the objective and says the issue does not authorize implementation or freeze scope:

> Prove the central product abstraction: 2D and 3D visual objects coexist in one scene, hierarchy, persistence model, and transform system.

Archive section 9.2 is context for that objective. Its identifiers are not operational requirements.

## 2. Constraints a later test plan must keep

These come from the approved Module 0 architecture and the development process. A Module 1 test plan has to satisfy them.

- `pnpm verify` stays the regression gate. Module 0 tests remain green.
- `node --test` does not execute JSX. Domain behavior is proven without opening a window. A browser session does not replace that headless proof.
- Scene correctness is a test of the model or the render snapshot. A GPU image is not that proof.
- The provisional manifest is two fields, with a 4096-byte cap. `SyntaxError` and `RangeError` from `JSON.parse` are `INVALID_JSON`. There is no nesting-depth rule. Saving a scene is a new document decision.
- `canonicalizeFiniteNumber` and `canonicalizeFiniteTriple` are the approved numeric rules. They do not choose an axis, a rotation order, or degrees versus radians.
- The foundation shell has no viewport, canvas, hierarchy, selection, or save command. Those stay out of the foundation screen until an approved Module 1 scope adds them.
- A new dependency has to pass the existing license rule and `pnpm audit --audit-level=high`. A second scene language requires a new ADR.

## 3. Decisions that block pass/fail criteria

The approved architecture leaves these open. A test that picks an answer would be a product decision.

- Whether archive section 9.2 is the scope to prepare.
- One scene per project, or more than one.
- Public format identifier, extension, one file or a folder, and whether hand-editing is supported.
- Up axis, handedness, rotation order, and degrees versus radians.
- Whether the first slice includes save and reload, and whether it includes undo.
- Whether selection is from a hierarchy, a viewport, or both.
- Which 2D primitive and which 3D primitive are in scope, if primitives are in scope.

## 4. Evidence still required before implementation

Definition of Ready is development process section 8. For Module 1 that means an operational specification, stable identifiers, a test approach for every identifier, design behavior, and the test infrastructure, each approved at the preparation gate. This note does not supply those artifacts.

No scene type, viewport, persistence format, package, or test is added here.

## 5. Product Owner decisions

Two decisions remain with the Product Owner:

1. Accept or reject Module 0.
2. Approve the operational scope of Module 1 before implementation begins.

Until both are explicit, Module 1 stays in preparation.

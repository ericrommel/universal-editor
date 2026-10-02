**Product & Engineering Specification — Version 1.0**

**Status: Initial implementation baseline  
**Product Owner: Human  
Delivery model: Progressive, gated module implementation  
Working language: English

***Professional power without professional complexity.***

# 1. Product Vision

The Universal Visual Creation Platform is a cross-platform visual creation environment for Web, Windows, macOS, and Linux. It combines accessible direct manipulation with a technical ceiling high enough to support increasingly sophisticated 2D, 2.5D, 3D, animation, composition, lighting, and rendering workflows.

The product is not intended to be a simplified clone of Blender, Canva, Feather3D, or any other existing application. Its central proposition is a unified creative space in which an object can evolve naturally from 2D to 2.5D and 3D without forcing the user to move between separate applications or unrelated editing modes.

The initial product hypothesis is that spatial and 3D creation can be made substantially more approachable without permanently removing the deeper controls required by advanced users.

# 2. Product Principles

| **ID** | **Principle**                         | **Definition**                                                                                                              |
|--------|---------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| P-01   | Unified Visual Space                  | 2D and 3D content coexist in one scene, one object hierarchy, and one editing experience.                                   |
| P-02   | Progressive Complexity                | The default workflow exposes only the controls needed for the current task. Deeper controls become available progressively. |
| P-03   | Direct Manipulation                   | Whenever practical, users manipulate the visible result rather than beginning with abstract technical parameters.           |
| P-04   | Non-Destructive Creation              | Creative operations should preserve editable source data and remain reversible whenever technically practical.              |
| P-05   | 2D → 2.5D → 3D Continuum              | 2.5D is not a separate subsystem. Depth and spatial behavior emerge from the same scene and object model.                   |
| P-06   | Simple by Default, Powerful on Demand | Simple tasks must have simple paths; advanced capabilities must not require a separate product edition or editor.           |
| P-07   | AI as an Accelerator                  | AI may create or transform native project objects, but core workflows must remain usable without AI.                        |
| P-08   | Cross-Platform Project Compatibility  | Project data must be portable across supported platforms, subject only to explicitly documented capability differences.     |

# 3. Primary Users and Product Boundaries

Primary user: a visual creator who wants to produce spatial or 3D-enhanced content but does not want to begin by learning a traditional professional 3D package.

Secondary users include illustrators, motion designers, content creators, students, and indie game creators. Professional 3D artists, architects, filmmakers, and other specialized users are long-term audiences rather than the primary optimization target for the first implementation.

## 3.1 Initial boundaries

- The first releases do not attempt to reproduce the full feature set of Blender, Maya, Cinema 4D, Houdini, Canva, or equivalent products.

- 2.5D is represented through the unified scene/object model, not through an independent editor.

- AI generation is not required to validate the core product hypothesis.

- Collaboration, marketplace, plugins, procedural node systems, and professional production management are outside the initial implementation path.

- Performance targets must be tied to defined reference workloads and environments rather than arbitrary numbers.

# 4. Core Product Model

## 4.1 Universal object model

Every visual entity participates in a common object model. Specialized object types may add capabilities, but common behaviors must not be duplicated into disconnected 2D and 3D scene systems.

- Identity and metadata

- Parent/child hierarchy

- Transform: position X/Y/Z, rotation X/Y/Z, scale X/Y/Z

- Visual representation, such as shape, image, text, stroke, curve, or mesh

- Optional material and appearance properties

- Optional animation data

- Optional behaviors or modifiers

- Persistence metadata required to reconstruct the object

## 4.2 Scene model

A project contains one or more scenes. A scene contains a unified hierarchy of objects, camera and environment information, and later animation data. The scene model is independent of the presentation layer and should be serializable without depending on the active UI.

## 4.3 Non-destructive transformation

Where supported, derived geometry should retain a relationship with editable source data. For example, a spatial stroke converted into a tube should remain editable through its source curve unless the user explicitly applies or destructively converts the operation.

# 5. Engineering Principles

- Core domain logic must be separated from platform-specific UI and packaging.

- The project format and scene model must not depend on a single operating system.

- Modules must expose stable interfaces before later modules depend on them.

- A later module may extend an earlier abstraction but must not silently bypass its contracts.

- Automated tests must exist at the lowest practical layer and at integration boundaries.

- No requirement or acceptance criterion may be weakened solely to make an implementation pass.

- Technical debt discovered during a module must be recorded and either resolved before the gate or explicitly accepted by the Product Owner.

- Security, robustness, accessibility, and performance concerns are considered throughout development rather than deferred to a final hardening phase.

# 6. AI Development Team and Governance

| **Role**                       | **Responsibility**                                                                                                                                        |
|--------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| Human Product Owner (PO)       | Owns product intent, approves requirement changes, performs final module validation, and is the only authority that marks a module accepted.              |
| AI Project Manager (PM)        | Owns delivery planning, dependencies, traceability, status, risk tracking, and preparation of PO review. Cannot approve its own module.                   |
| AI Tech Lead (TL)              | Owns architecture, technical decisions, decomposition, integration, code review orchestration, and engineering quality. Cannot waive acceptance criteria. |
| Senior Core/Platform Engineer  | Owns scene graph, universal object model, persistence, undo/redo foundations, common services, platform abstractions, and shared infrastructure.          |
| Senior 2D/Interaction Engineer | Owns 2D rendering, shapes, text, images, drawing, selection, viewport interaction, editor behavior, and accessibility of primary interactions.            |
| Senior 3D/Rendering Engineer   | Owns 3D rendering, meshes, spatial curves, materials, lighting, cameras, GPU/rendering concerns, and 3D interoperability.                                 |
| Functional QA Engineer         | Validates functional requirements, acceptance criteria, integration behavior, regression coverage, and user-visible workflows.                            |
| Non-Functional QA Engineer     | Validates performance, robustness, persistence integrity, compatibility, resource behavior, recovery, and other non-functional requirements.              |

## 6.1 Decision hierarchy

1.  The PO owns product scope and final acceptance.

2.  The PM coordinates scope and delivery but cannot override the PO or waive quality gates.

3.  The TL owns technical direction and may reject or return implementation work.

4.  Developers may challenge technical decisions with evidence; the TL resolves technical disputes unless they change product scope.

5.  QA may reject a build that fails an agreed requirement or criterion.

6.  Requirement changes discovered during implementation return to the PO for approval before the implementation is considered conformant.

# 7. Module Lifecycle and Quality Gates

Each module is implemented as a gated increment. Module N+1 must not enter implementation until Module N is GREEN and explicitly approved by the PO, except for non-implementation planning work that does not create a dependency on unapproved behavior.

| **State**                   | **Exit condition**                                                    |
|-----------------------------|-----------------------------------------------------------------------|
| PLANNED                     | Scope, dependencies, and initial risks are documented.                |
| READY FOR DEVELOPMENT       | Definition of Ready is satisfied.                                     |
| IMPLEMENTATION              | Code and developer tests are complete.                                |
| CODE REVIEW                 | TL/integration review is complete and blocking findings are resolved. |
| FUNCTIONAL VERIFICATION     | Functional QA passes all applicable FRs and ACs.                      |
| NON-FUNCTIONAL VERIFICATION | Applicable NFRs pass against the defined workload/environment.        |
| PO REVIEW                   | Evidence package is presented to the PO.                              |
| CHANGES REQUIRED            | Findings are corrected and affected gates are rerun.                  |
| APPROVED / GREEN            | PO approves the module and no blocking gate remains open.             |

## 7.1 Definition of Ready

- Module objective and scope are explicit.

- Out-of-scope behavior is explicit.

- Dependencies on earlier modules are approved and available.

- Functional and non-functional requirements have stable IDs.

- Acceptance criteria are observable and testable.

- Required reference workloads, fixtures, supported platforms, or test environments are defined where needed.

- Known architectural decisions and open questions that block implementation are resolved.

- The PO confirms that the module is ready to enter implementation.

## 7.2 Definition of Done

- All in-scope FRs and ACs pass.

- All applicable NFRs pass or have an explicit PO-approved exception.

- Automated tests required by the module are green.

- No unresolved blocker or critical defect remains.

- Regression tests for approved earlier modules remain green.

- Traceability links requirements to implementation and verification evidence.

- User-facing or engineering documentation affected by the module is updated.

- The PO has reviewed the evidence and explicitly approved the module.

# 8. Requirement and Evidence Conventions

Identifiers use M{module}-{type}-{number}, for example M1-FR-001, M1-NFR-002, and M1-AC-003. Test cases should reference the requirement or acceptance criterion they verify.

Every module review must include a traceability matrix with at least: Requirement/Criterion ID, implementation reference, automated test reference where applicable, QA result, known findings, and PO status.

# 9.1 Module 0 — Engineering Foundation

## Objective

Establish a production-oriented repository, application shell, shared engineering conventions, automated verification, and platform-neutral core boundaries before product features are built.

## Scope

- Repository and build structure

- Application shell

- Core/UI/rendering boundary definitions

- Automated unit and integration test execution

- Static analysis/linting/formatting as appropriate to the selected stack

- CI pipeline

- Basic diagnostic logging

- Developer setup documentation

## Out of Scope

- Visual authoring features

- 3D scene editing

- Final packaging/distribution

- Cloud services

- AI features

## Functional Requirements

**M0-FR-001 — Application shell.** The project shall build and launch a minimal application shell in the primary development environment.

**M0-FR-002 — Core boundary.** The repository shall provide a platform-neutral core/domain area that can be tested without launching the full graphical application.

**M0-FR-003 — Automated verification.** The project shall provide a single documented command or workflow that runs the automated test suite.

**M0-FR-004 — Continuous integration.** Changes shall be verifiable by an automated CI workflow that builds the project and runs required checks.

**M0-FR-005 — Diagnostics.** The application shall expose basic diagnostic logging sufficient to identify startup and fatal initialization failures.

## Non-Functional Requirements

**M0-NFR-001 — Reproducible setup.** A clean supported development environment shall be able to follow documented setup steps and reach a successful build without undocumented manual modifications.

**M0-NFR-002 — Separation of concerns.** Core domain code shall not depend directly on a specific desktop windowing implementation.

**M0-NFR-003 — Test isolation.** Core automated tests shall run headlessly.

**M0-NFR-004 — Failure visibility.** Build, test, and static-analysis failures shall produce actionable non-zero failures rather than silently succeeding.

**M0-NFR-005 — Maintainability.** Repository conventions, dependency boundaries, and contribution commands shall be documented.

## Acceptance Criteria

**M0-AC-001 — Acceptance.** A clean checkout can be configured, built, and launched using the documented process.

**M0-AC-002 — Acceptance.** The documented verification workflow runs successfully and includes at least one core unit test and one integration-level test.

**M0-AC-003 — Acceptance.** CI executes the required build and test checks on a representative change.

**M0-AC-004 — Acceptance.** A deliberately failing test causes the verification workflow and CI test step to fail.

**M0-AC-005 — Acceptance.** The core test suite can run without opening a graphical window.

## Required Verification Evidence

- Automated test results mapped to applicable requirement/criterion IDs.

- Functional QA report with pass/fail status and reproducible evidence for failures.

- Non-functional QA report for applicable NFRs and the defined reference workload/environment.

- Regression result for all previously approved modules.

- TL integration/code-review summary and unresolved technical-debt list.

- PM traceability matrix and PO review package.

## Exit Criteria

Module 0 is GREEN only when all blocking requirements and acceptance criteria above pass, required regression checks are green, blocking defects are closed, and the Human Product Owner explicitly approves the module.

# 9.2 Module 1 — Unified Scene

## Objective

Prove the central product abstraction: 2D and 3D visual objects coexist in one scene, hierarchy, persistence model, and transform system.

## Scope

- Scene creation

- Unified object hierarchy

- One basic 2D primitive

- One basic 3D primitive

- Common transform model

- Selection

- Deletion

- Save/reload persistence

## Out of Scope

- Advanced gizmos

- Text and images

- Materials

- Lighting authoring

- Animation

- Spatial drawing

## Functional Requirements

**M1-FR-001 — Scene creation.** The user shall be able to create a new empty scene.

**M1-FR-002 — Unified hierarchy.** A scene shall maintain 2D and 3D objects in the same object hierarchy.

**M1-FR-003 — Basic 2D object.** The user shall be able to add at least one 2D primitive.

**M1-FR-004 — Basic 3D object.** The user shall be able to add at least one 3D primitive to the same scene.

**M1-FR-005 — Universal transform.** Every visual object shall expose position X/Y/Z, rotation X/Y/Z, and scale X/Y/Z through the common transform model.

**M1-FR-006 — Selection.** The user shall be able to select an object from the viewport or object hierarchy.

**M1-FR-007 — Removal.** The user shall be able to remove a selected object without removing unrelated objects.

**M1-FR-008 — Scene persistence.** The application shall save and reload enough scene data to reconstruct in-scope objects, hierarchy, and transforms.

## Non-Functional Requirements

**M1-NFR-001 — Single scene abstraction.** 2D and 3D objects shall use the same scene abstraction rather than independent scene implementations.

**M1-NFR-002 — Extensibility.** Adding a new object type shall not require changes to unrelated existing object implementations.

**M1-NFR-003 — Deterministic persistence.** Saving and reopening an unchanged scene shall preserve in-scope hierarchy and transform values.

**M1-NFR-004 — Error isolation.** Malformed or unsupported object data shall not silently corrupt unrelated valid scene objects.

**M1-NFR-005 — Regression safety.** Module 0 verification shall remain green.

## Acceptance Criteria

**M1-AC-001 — Acceptance.** Given an empty scene, adding a 2D rectangle and a 3D cube places both in the same hierarchy and viewport.

**M1-AC-002 — Acceptance.** Selecting either object exposes the common X/Y/Z position, rotation, and scale model.

**M1-AC-003 — Acceptance.** Modified transforms survive save, close, and reload.

**M1-AC-004 — Acceptance.** Deleting one selected object leaves unrelated scene objects unchanged.

**M1-AC-005 — Acceptance.** Automated tests verify the unified scene model without requiring separate 2D-scene and 3D-scene execution paths.

## Required Verification Evidence

- Automated test results mapped to applicable requirement/criterion IDs.

- Functional QA report with pass/fail status and reproducible evidence for failures.

- Non-functional QA report for applicable NFRs and the defined reference workload/environment.

- Regression result for all previously approved modules.

- TL integration/code-review summary and unresolved technical-debt list.

- PM traceability matrix and PO review package.

## Exit Criteria

Module 1 is GREEN only when all blocking requirements and acceptance criteria above pass, required regression checks are green, blocking defects are closed, and the Human Product Owner explicitly approves the module.

# 9.3 Module 2 — Direct Manipulation

## Objective

Make the unified scene directly editable through intuitive viewport interactions while preserving the common object model.

## Scope

- Viewport hit selection

- Move/rotate/scale interaction

- Visual transform affordances

- Undo/redo foundation

- Keyboard/mouse interaction basics

## Out of Scope

- Touch-first UX

- Advanced snapping

- Constraint systems

- Animation editing

## Functional Requirements

**M2-FR-001 — Viewport selection.** The user shall be able to select an in-scope object directly in the viewport.

**M2-FR-002 — Move.** The user shall be able to move the selected object through direct viewport interaction.

**M2-FR-003 — Rotate.** The user shall be able to rotate the selected object through direct viewport interaction.

**M2-FR-004 — Scale.** The user shall be able to scale the selected object through direct viewport interaction.

**M2-FR-005 — Undo/redo.** The user shall be able to undo and redo in-scope transform operations.

**M2-FR-006 — Selection feedback.** The viewport shall visibly distinguish the currently selected object.

## Non-Functional Requirements

**M2-NFR-001 — Model consistency.** Direct manipulation shall update the same transform model used by persistence and programmatic access.

**M2-NFR-002 — Interaction stability.** Pointer capture or equivalent interaction state shall terminate cleanly on completion or cancellation.

**M2-NFR-003 — Reversibility.** Undo followed by redo shall restore the same in-scope transform state.

**M2-NFR-004 — Responsiveness.** Transform interaction shall remain interactive under the module reference scene workload.

**M2-NFR-005 — Regression safety.** All approved Module 0–1 tests shall remain green.

## Acceptance Criteria

**M2-AC-001 — Acceptance.** Clicking a visible selectable object selects it and updates selection feedback.

**M2-AC-002 — Acceptance.** Moving, rotating, and scaling through the viewport changes the common transform values.

**M2-AC-003 — Acceptance.** Undo restores the immediately preceding transform state and redo reapplies it.

**M2-AC-004 — Acceptance.** Cancelling an active manipulation does not leave a partial unintended transform.

**M2-AC-005 — Acceptance.** Saving after direct manipulation and reopening the project preserves the resulting transform.

## Required Verification Evidence

- Automated test results mapped to applicable requirement/criterion IDs.

- Functional QA report with pass/fail status and reproducible evidence for failures.

- Non-functional QA report for applicable NFRs and the defined reference workload/environment.

- Regression result for all previously approved modules.

- TL integration/code-review summary and unresolved technical-debt list.

- PM traceability matrix and PO review package.

## Exit Criteria

Module 2 is GREEN only when all blocking requirements and acceptance criteria above pass, required regression checks are green, blocking defects are closed, and the Human Product Owner explicitly approves the module.

# 9.4 Module 3 — Visual Creation

## Objective

Turn the scene into a useful basic visual composition environment by adding common 2D content and manageable object organization.

## Scope

- Multiple 2D shapes

- Text objects

- Image objects

- Object/layer ordering

- Basic appearance properties

- Duplicate/rename

## Out of Scope

- Vector path editing

- Advanced typography

- Image filters

- Templates

- Asset marketplace

## Functional Requirements

**M3-FR-001 — Shapes.** The user shall be able to create a defined set of basic 2D shapes.

**M3-FR-002 — Text.** The user shall be able to create and edit a text object.

**M3-FR-003 — Images.** The user shall be able to import a supported raster image as a scene object.

**M3-FR-004 — Ordering.** The user shall be able to change the visual/object ordering of applicable objects.

**M3-FR-005 — Appearance.** Applicable objects shall expose basic fill/color and opacity controls.

**M3-FR-006 — Object management.** The user shall be able to rename and duplicate supported objects.

## Non-Functional Requirements

**M3-NFR-001 — Unified behavior.** New visual object types shall participate in the common hierarchy, transform, selection, persistence, and undo systems.

**M3-NFR-002 — Input robustness.** Unsupported or invalid image input shall fail with a visible error and shall not corrupt the project.

**M3-NFR-003 — Text persistence.** Text content and in-scope appearance properties shall survive save/reload.

**M3-NFR-004 — Usability.** Primary creation actions shall be discoverable from the default creation interface without requiring advanced panels.

**M3-NFR-005 — Regression safety.** All approved earlier-module tests shall remain green.

## Acceptance Criteria

**M3-AC-001 — Acceptance.** A scene can contain text, an imported image, a 2D shape, and a 3D primitive simultaneously.

**M3-AC-002 — Acceptance.** Each supported new object type can be selected, transformed, renamed, duplicated, saved, and restored.

**M3-AC-003 — Acceptance.** Changing ordering produces the expected visual ordering for applicable overlapping objects.

**M3-AC-004 — Acceptance.** Invalid image input produces an error without adding a broken object to the scene.

**M3-AC-005 — Acceptance.** Undo/redo covers creation, deletion, duplication, and supported appearance changes.

## Required Verification Evidence

- Automated test results mapped to applicable requirement/criterion IDs.

- Functional QA report with pass/fail status and reproducible evidence for failures.

- Non-functional QA report for applicable NFRs and the defined reference workload/environment.

- Regression result for all previously approved modules.

- TL integration/code-review summary and unresolved technical-debt list.

- PM traceability matrix and PO review package.

## Exit Criteria

Module 3 is GREEN only when all blocking requirements and acceptance criteria above pass, required regression checks are green, blocking defects are closed, and the Human Product Owner explicitly approves the module.

# 9.5 Module 4 — Draw in Space

## Objective

Introduce the product-defining spatial drawing workflow by allowing users to create editable strokes/curves directly in the scene.

## Scope

- Freehand stroke input

- Spatial curve representation

- Editable control data

- Stroke appearance

- Persistence

- Undo/redo

## Out of Scope

- Sculpting

- Full vector illustration suite

- Automatic AI cleanup

- Solid modeling

## Functional Requirements

**M4-FR-001 — Spatial drawing.** The user shall be able to draw a stroke that becomes a native spatial curve object.

**M4-FR-002 — Editable source.** The curve shall retain editable source/control data after creation.

**M4-FR-003 — Stroke appearance.** The user shall be able to change basic stroke width and appearance.

**M4-FR-004 — Transform integration.** A spatial curve shall participate in the common transform and hierarchy systems.

**M4-FR-005 — Persistence.** Spatial curves and their editable data shall survive save/reload.

## Non-Functional Requirements

**M4-NFR-001 — Non-destructive representation.** Rendering a stroke shall not require discarding its editable source curve.

**M4-NFR-002 — Input fidelity.** Captured points shall preserve the drawn path within the tolerances defined by the selected input/smoothing algorithm.

**M4-NFR-003 — Scalability.** The reference multi-stroke scene shall remain interactively editable.

**M4-NFR-004 — Determinism.** Unchanged stored curve data shall reconstruct equivalent geometry on reload.

**M4-NFR-005 — Regression safety.** All approved earlier-module tests shall remain green.

## Acceptance Criteria

**M4-AC-001 — Acceptance.** Drawing in the viewport creates a selectable curve object in the unified hierarchy.

**M4-AC-002 — Acceptance.** The created curve can be transformed, styled, saved, closed, and restored.

**M4-AC-003 — Acceptance.** Editing supported curve control data updates the rendered stroke without replacing it with an unrelated object.

**M4-AC-004 — Acceptance.** Undo removes the completed stroke and redo restores it with its editable data.

**M4-AC-005 — Acceptance.** Multiple spatial curves coexist with existing 2D and 3D objects in one scene.

## Required Verification Evidence

- Automated test results mapped to applicable requirement/criterion IDs.

- Functional QA report with pass/fail status and reproducible evidence for failures.

- Non-functional QA report for applicable NFRs and the defined reference workload/environment.

- Regression result for all previously approved modules.

- TL integration/code-review summary and unresolved technical-debt list.

- PM traceability matrix and PO review package.

## Exit Criteria

Module 4 is GREEN only when all blocking requirements and acceptance criteria above pass, required regression checks are green, blocking defects are closed, and the Human Product Owner explicitly approves the module.

# 9.6 Module 5 — 2D → 2.5D → 3D Continuum

## Objective

Validate the key differentiator: existing visual source objects can gain depth and become spatial/3D forms without forcing a separate editor or destructive workflow.

## Scope

- Depth/Z behavior

- Extrusion of supported source geometry

- Curve-to-tube conversion

- Editable source relationship

- Apply/bake operation if needed

## Out of Scope

- Boolean modeling

- Sculpting

- Complex topology tools

- Procedural node graphs

## Functional Requirements

**M5-FR-001 — Depth.** Applicable 2D objects shall support Z position and spatial composition without conversion into a separate scene.

**M5-FR-002 — Extrusion.** The user shall be able to extrude at least one supported 2D source type into 3D geometry.

**M5-FR-003 — Curve to tube.** The user shall be able to generate tube-like 3D geometry from a supported spatial curve.

**M5-FR-004 — Source linkage.** Generated geometry shall retain a non-destructive relationship to its supported source until explicitly applied/baked.

**M5-FR-005 — Live update.** Editing supported source properties shall update derived geometry.

## Non-Functional Requirements

**M5-NFR-001 — Continuity.** The workflow shall use the existing scene and object model rather than launching a separate 3D editing subsystem.

**M5-NFR-002 — Non-destructive safety.** Derived operations shall preserve source data unless the user explicitly chooses a destructive apply/bake operation.

**M5-NFR-003 — Dependency integrity.** Deleting or modifying source/derived relationships shall follow documented predictable behavior.

**M5-NFR-004 — Performance.** Reference derived geometry shall update within the defined interactive workload target.

**M5-NFR-005 — Regression safety.** All approved earlier-module tests shall remain green.

## Acceptance Criteria

**M5-AC-001 — Acceptance.** A 2D object can be moved in Z and composed with 3D objects without mode migration.

**M5-AC-002 — Acceptance.** Extruding a supported source creates visible 3D depth while retaining editable source data.

**M5-AC-003 — Acceptance.** Changing the supported source updates the derived extruded/tube geometry.

**M5-AC-004 — Acceptance.** A spatial curve can generate a tube and later be edited to change the tube path.

**M5-AC-005 — Acceptance.** Save/reload preserves source-to-derived relationships.

## Required Verification Evidence

- Automated test results mapped to applicable requirement/criterion IDs.

- Functional QA report with pass/fail status and reproducible evidence for failures.

- Non-functional QA report for applicable NFRs and the defined reference workload/environment.

- Regression result for all previously approved modules.

- TL integration/code-review summary and unresolved technical-debt list.

- PM traceability matrix and PO review package.

## Exit Criteria

Module 5 is GREEN only when all blocking requirements and acceptance criteria above pass, required regression checks are green, blocking defects are closed, and the Human Product Owner explicitly approves the module.

# 9.7 Module 6 — Materials and Lighting

## Objective

Add controlled visual depth through a simple default material and lighting workflow that can later expand into professional controls.

## Scope

- Basic material model

- Material assignment

- Basic light types

- Light transform

- Shadows where supported

- Simple environment/default lighting

## Out of Scope

- Node materials

- Advanced physically based authoring

- Global illumination tuning

- Professional render settings

## Functional Requirements

**M6-FR-001 — Materials.** Applicable 3D objects shall accept a basic material.

**M6-FR-002 — Material properties.** The user shall be able to edit a minimal defined set of material properties.

**M6-FR-003 — Lights.** The user shall be able to create and transform at least one supported light type.

**M6-FR-004 — Lighting effect.** Supported lights shall visibly affect supported scene geometry.

**M6-FR-005 — Shadows.** The user shall be able to enable/disable supported shadow behavior where available.

## Non-Functional Requirements

**M6-NFR-001 — Simple defaults.** A newly created 3D object shall be visible without requiring manual shader or node configuration.

**M6-NFR-002 — Progressive complexity.** Advanced rendering concepts shall not be required for the basic material/light workflow.

**M6-NFR-003 — Resource stability.** Repeated material/light edits shall not cause unbounded resource growth in the reference workload.

**M6-NFR-004 — Persistence.** Material assignments, properties, and supported lights shall survive save/reload.

**M6-NFR-005 — Regression safety.** All approved earlier-module tests shall remain green.

## Acceptance Criteria

**M6-AC-001 — Acceptance.** A new 3D object is visible with a default appearance.

**M6-AC-002 — Acceptance.** Assigning and editing a basic material visibly changes the supported object.

**M6-AC-003 — Acceptance.** Creating and moving a supported light changes illumination of supported geometry.

**M6-AC-004 — Acceptance.** Material and lighting state survives save/reload.

**M6-AC-005 — Acceptance.** The basic workflow is achievable without opening an advanced shader/node editor.

## Required Verification Evidence

- Automated test results mapped to applicable requirement/criterion IDs.

- Functional QA report with pass/fail status and reproducible evidence for failures.

- Non-functional QA report for applicable NFRs and the defined reference workload/environment.

- Regression result for all previously approved modules.

- TL integration/code-review summary and unresolved technical-debt list.

- PM traceability matrix and PO review package.

## Exit Criteria

Module 6 is GREEN only when all blocking requirements and acceptance criteria above pass, required regression checks are green, blocking defects are closed, and the Human Product Owner explicitly approves the module.

# 9.8 Module 7 — Camera and Composition

## Objective

Allow users to author a deliberate view of the unified scene and produce repeatable compositions.

## Scope

- Camera object

- Active camera

- Camera transform

- Basic projection settings

- Viewport-to-camera workflow

- Composition preview

## Out of Scope

- Multi-camera editing suite

- Cinematic camera rigs

- Depth-of-field animation

- Virtual production

## Functional Requirements

**M7-FR-001 — Camera creation.** The user shall be able to create a camera object.

**M7-FR-002 — Active camera.** The user shall be able to designate the active camera used for composition/output.

**M7-FR-003 — Camera manipulation.** The active camera shall support common transform behavior.

**M7-FR-004 — Projection.** The user shall be able to configure the supported basic projection mode/settings.

**M7-FR-005 — Camera preview.** The user shall be able to preview the scene through the active camera.

## Non-Functional Requirements

**M7-NFR-001 — Scene integration.** Camera objects shall participate in the common hierarchy and persistence model.

**M7-NFR-002 — Predictability.** A saved active camera and its supported settings shall reproduce the same composition after reload within rendering tolerances.

**M7-NFR-003 — Usability.** Switching between editing view and active-camera preview shall not require destructive scene changes.

**M7-NFR-004 — Performance.** Camera navigation shall remain interactive under the reference scene workload.

**M7-NFR-005 — Regression safety.** All approved earlier-module tests shall remain green.

## Acceptance Criteria

**M7-AC-001 — Acceptance.** A camera can be created, selected, transformed, and set active.

**M7-AC-002 — Acceptance.** Camera preview reflects the active camera transform and supported projection settings.

**M7-AC-003 — Acceptance.** Switching out of camera preview does not alter scene object transforms.

**M7-AC-004 — Acceptance.** The active camera and composition survive save/reload.

**M7-AC-005 — Acceptance.** Existing 2D, spatial, and 3D content can be composed through the same camera.

## Required Verification Evidence

- Automated test results mapped to applicable requirement/criterion IDs.

- Functional QA report with pass/fail status and reproducible evidence for failures.

- Non-functional QA report for applicable NFRs and the defined reference workload/environment.

- Regression result for all previously approved modules.

- TL integration/code-review summary and unresolved technical-debt list.

- PM traceability matrix and PO review package.

## Exit Criteria

Module 7 is GREEN only when all blocking requirements and acceptance criteria above pass, required regression checks are green, blocking defects are closed, and the Human Product Owner explicitly approves the module.

# 9.9 Module 8 — Animation

## Objective

Introduce time without abandoning the direct-manipulation model: users animate familiar object properties using a simple timeline and keyframes.

## Scope

- Timeline

- Playhead

- Keyframes for core transform properties

- Basic interpolation

- Playback

- Persistence

- Undo/redo

## Out of Scope

- Graph editor

- Rigging

- Character animation

- Constraints

- Procedural animation

## Functional Requirements

**M8-FR-001 — Timeline.** The application shall provide a timeline with a movable playhead.

**M8-FR-002 — Keyframes.** The user shall be able to create keyframes for supported transform properties.

**M8-FR-003 — Playback.** The application shall evaluate and play supported animation over time.

**M8-FR-004 — Keyframe editing.** The user shall be able to move or delete supported keyframes.

**M8-FR-005 — Interpolation.** The system shall provide at least one documented interpolation behavior between supported keyframes.

**M8-FR-006 — Persistence.** Animation data shall survive save/reload.

## Non-Functional Requirements

**M8-NFR-001 — Unified property model.** Animation shall target existing object properties rather than duplicate them into a disconnected animation state.

**M8-NFR-002 — Deterministic evaluation.** The same timeline time and unchanged animation data shall evaluate to equivalent supported property values.

**M8-NFR-003 — Interactive playback.** The reference animation scene shall meet the module's defined interactive playback target.

**M8-NFR-004 — Reversibility.** Keyframe creation, movement, and deletion shall integrate with undo/redo.

**M8-NFR-005 — Regression safety.** All approved earlier-module tests shall remain green.

## Acceptance Criteria

**M8-AC-001 — Acceptance.** Two transform keyframes on an object produce visible interpolated motion during playback.

**M8-AC-002 — Acceptance.** Moving the playhead evaluates the supported animated property at that time.

**M8-AC-003 — Acceptance.** Deleting a keyframe changes the resulting animation and can be undone.

**M8-AC-004 — Acceptance.** Animated state survives save/reload.

**M8-AC-005 — Acceptance.** A scene can animate an object while retaining its existing material, hierarchy, and derived-geometry relationships.

## Required Verification Evidence

- Automated test results mapped to applicable requirement/criterion IDs.

- Functional QA report with pass/fail status and reproducible evidence for failures.

- Non-functional QA report for applicable NFRs and the defined reference workload/environment.

- Regression result for all previously approved modules.

- TL integration/code-review summary and unresolved technical-debt list.

- PM traceability matrix and PO review package.

## Exit Criteria

Module 8 is GREEN only when all blocking requirements and acceptance criteria above pass, required regression checks are green, blocking defects are closed, and the Human Product Owner explicitly approves the module.

# 9.10 Module 9 — Export and Interchange

## Objective

Allow users to produce useful outputs from approved scene capabilities and exchange supported 3D content with other tools.

## Scope

- PNG export

- JPEG export

- GLB export

- Export validation

- Clear error reporting

## Out of Scope

- SVG if semantics are not yet stable

- Video encoding

- USD

- FBX

- Professional color management

## Functional Requirements

**M9-FR-001 — PNG export.** The user shall be able to export the active camera composition to PNG.

**M9-FR-002 — JPEG export.** The user shall be able to export the active camera composition to JPEG.

**M9-FR-003 — GLB export.** The user shall be able to export supported 3D scene content to GLB.

**M9-FR-004 — Export settings.** The user shall be able to select the defined basic output settings for each supported format.

**M9-FR-005 — Export errors.** Unsupported content or export failures shall produce actionable feedback.

## Non-Functional Requirements

**M9-NFR-001 — Output validity.** Generated files shall be parseable by independent standards-compliant readers used by the test suite.

**M9-NFR-002 — No project mutation.** Exporting shall not modify the saved project state.

**M9-NFR-003 — Repeatability.** Repeated export of unchanged supported content and settings shall be functionally equivalent.

**M9-NFR-004 — Resource cleanup.** Failed or cancelled export shall not leave locked temporary resources or corrupt the project.

**M9-NFR-005 — Regression safety.** All approved earlier-module tests shall remain green.

## Acceptance Criteria

**M9-AC-001 — Acceptance.** A PNG exported from the active camera has the requested supported dimensions and can be opened by the independent test reader.

**M9-AC-002 — Acceptance.** A JPEG export is valid and reflects the active camera composition.

**M9-AC-003 — Acceptance.** A GLB export can be parsed by the independent test reader and contains the supported exported scene objects.

**M9-AC-004 — Acceptance.** Export does not change object transforms, hierarchy, animation data, or dirty state except where explicitly documented.

**M9-AC-005 — Acceptance.** A forced/known export failure reports an error and leaves the project usable.

## Required Verification Evidence

- Automated test results mapped to applicable requirement/criterion IDs.

- Functional QA report with pass/fail status and reproducible evidence for failures.

- Non-functional QA report for applicable NFRs and the defined reference workload/environment.

- Regression result for all previously approved modules.

- TL integration/code-review summary and unresolved technical-debt list.

- PM traceability matrix and PO review package.

## Exit Criteria

Module 9 is GREEN only when all blocking requirements and acceptance criteria above pass, required regression checks are green, blocking defects are closed, and the Human Product Owner explicitly approves the module.

# 9.11 Module 10 — Advanced Modeling

## Objective

Raise the technical ceiling with a small, coherent set of modeling operations while preserving the non-destructive and progressive-complexity principles.

## Scope

- Bevel

- Boolean operation

- Expanded extrusion controls

- Apply/bake semantics

- Modifier ordering foundation

## Out of Scope

- Full mesh-edit mode

- Sculpting suite

- Retopology

- Geometry nodes

## Functional Requirements

**M10-FR-001 — Bevel.** The user shall be able to apply a supported bevel operation to compatible geometry.

**M10-FR-002 — Boolean.** The user shall be able to perform at least the defined union/difference/intersection operations on compatible geometry.

**M10-FR-003 — Modifier stack.** Supported non-destructive modeling operations shall have an explicit evaluation order.

**M10-FR-004 — Edit parameters.** The user shall be able to change supported operation parameters after creation.

**M10-FR-005 — Apply operation.** The user shall be able to explicitly bake/apply a supported non-destructive operation when needed.

## Non-Functional Requirements

**M10-NFR-001 — Non-destructive default.** Supported advanced modeling operations shall remain editable until explicitly applied.

**M10-NFR-002 — Failure safety.** Invalid modeling inputs shall fail without destroying the last valid source state.

**M10-NFR-003 — Determinism.** Unchanged modifier inputs and parameters shall reconstruct equivalent supported geometry.

**M10-NFR-004 — Complexity isolation.** Advanced controls shall not clutter the default basic-creation workflow.

**M10-NFR-005 — Regression safety.** All approved earlier-module tests shall remain green.

## Acceptance Criteria

**M10-AC-001 — Acceptance.** A supported bevel can be added, edited, reordered where applicable, and removed without losing the source object.

**M10-AC-002 — Acceptance.** A supported boolean operation produces the expected defined result for reference fixtures.

**M10-AC-003 — Acceptance.** Invalid boolean input leaves source objects recoverable and reports the failure.

**M10-AC-004 — Acceptance.** Applying a supported operation follows the documented destructive boundary and is undoable within the active history.

**M10-AC-005 — Acceptance.** Save/reload preserves unapplied supported modifier state.

## Required Verification Evidence

- Automated test results mapped to applicable requirement/criterion IDs.

- Functional QA report with pass/fail status and reproducible evidence for failures.

- Non-functional QA report for applicable NFRs and the defined reference workload/environment.

- Regression result for all previously approved modules.

- TL integration/code-review summary and unresolved technical-debt list.

- PM traceability matrix and PO review package.

## Exit Criteria

Module 10 is GREEN only when all blocking requirements and acceptance criteria above pass, required regression checks are green, blocking defects are closed, and the Human Product Owner explicitly approves the module.

# 9.12 Module 11 — AI-Assisted Creation

## Objective

Integrate AI as an accelerator that creates or edits native project objects rather than acting as an isolated chatbot or opaque side channel.

## Scope

- Natural-language edit command

- At least one generation workflow

- Preview/confirm behavior for destructive or broad changes

- Native object output

- Provenance/operation metadata as appropriate

## Out of Scope

- Autonomous project ownership

- Unreviewed destructive actions

- Marketplace models

- Provider-specific lock-in as a product requirement

## Functional Requirements

**M11-FR-001 — Native edits.** AI-assisted edits shall operate on or produce native scene objects compatible with manual editing.

**M11-FR-002 — Text-directed edit.** The user shall be able to request at least one defined scene/object edit through natural language.

**M11-FR-003 — Generation.** The user shall be able to invoke at least one defined AI generation workflow that results in editable project content.

**M11-FR-004 — Review.** Broad or destructive AI changes shall provide an appropriate review/confirmation boundary before irreversible application.

**M11-FR-005 — Manual continuation.** AI-produced supported content shall remain editable through the normal manual tools.

## Non-Functional Requirements

**M11-NFR-001 — Optionality.** Core creation, scene editing, save/reload, and export workflows shall remain usable without AI availability.

**M11-NFR-002 — Failure isolation.** AI provider/network/model failure shall not corrupt the current project.

**M11-NFR-003 — Transparency.** The UI shall distinguish pending AI work, completed results, and failures.

**M11-NFR-004 — Provider abstraction.** Core scene semantics shall not depend on provider-specific response formats.

**M11-NFR-005 — Regression safety.** All approved earlier-module tests shall remain green.

## Acceptance Criteria

**M11-AC-001 — Acceptance.** A supported AI edit changes native object properties that can subsequently be modified manually.

**M11-AC-002 — Acceptance.** A supported generation workflow creates editable native content in the unified hierarchy.

**M11-AC-003 — Acceptance.** Simulated AI failure leaves the pre-request project state intact and usable.

**M11-AC-004 — Acceptance.** Disabling/unavailable AI does not block manual creation, editing, persistence, animation, or export.

**M11-AC-005 — Acceptance.** An AI-produced supported object survives normal save/reload without requiring the AI service to reconstruct it.

## Required Verification Evidence

- Automated test results mapped to applicable requirement/criterion IDs.

- Functional QA report with pass/fail status and reproducible evidence for failures.

- Non-functional QA report for applicable NFRs and the defined reference workload/environment.

- Regression result for all previously approved modules.

- TL integration/code-review summary and unresolved technical-debt list.

- PM traceability matrix and PO review package.

## Exit Criteria

Module 11 is GREEN only when all blocking requirements and acceptance criteria above pass, required regression checks are green, blocking defects are closed, and the Human Product Owner explicitly approves the module.

# 9.13 Module 12 — Professional Extension Layer

## Objective

Establish controlled extension points for expert workflows without forcing professional complexity into the default experience.

## Scope

- Extension/plugin boundary

- Scripting foundation

- Advanced property exposure

- Procedural/node architecture foundation

- Compatibility/versioning rules

## Out of Scope

- A complete Blender-equivalent node ecosystem

- Unrestricted unsafe execution by default

- Marketplace governance

- Enterprise collaboration

## Functional Requirements

**M12-FR-001 — Extension discovery.** The application shall provide a defined mechanism to discover/load supported extensions or scripts.

**M12-FR-002 — Controlled API.** Extensions shall interact with the project through a documented supported API boundary.

**M12-FR-003 — Version compatibility.** Extensions shall declare compatible API/version requirements.

**M12-FR-004 — Failure containment.** A failing extension shall be identifiable and shall not silently corrupt unrelated project state.

**M12-FR-005 — Advanced access.** Expert capabilities shall be accessible without replacing the default simple workflow.

## Non-Functional Requirements

**M12-NFR-001 — Security boundary.** Extension execution permissions and trust assumptions shall be explicitly documented and enforced by the chosen architecture.

**M12-NFR-002 — Compatibility.** Extension API evolution shall follow a documented versioning/deprecation policy.

**M12-NFR-003 — Isolation.** Extension failures shall be contained to the practical extent supported by the runtime architecture.

**M12-NFR-004 — Observability.** Extension load, failure, and compatibility problems shall be diagnosable.

**M12-NFR-005 — Regression safety.** All approved earlier-module tests shall remain green.

## Acceptance Criteria

**M12-AC-001 — Acceptance.** A reference extension can be discovered and use the documented API to perform one supported non-destructive project operation.

**M12-AC-002 — Acceptance.** An incompatible extension is rejected with an actionable compatibility message.

**M12-AC-003 — Acceptance.** A deliberately failing reference extension is reported without corrupting the reference project.

**M12-AC-004 — Acceptance.** The application remains fully usable for basic workflows with no extensions installed.

**M12-AC-005 — Acceptance.** Extension API documentation and reference tests match the implemented boundary.

## Required Verification Evidence

- Automated test results mapped to applicable requirement/criterion IDs.

- Functional QA report with pass/fail status and reproducible evidence for failures.

- Non-functional QA report for applicable NFRs and the defined reference workload/environment.

- Regression result for all previously approved modules.

- TL integration/code-review summary and unresolved technical-debt list.

- PM traceability matrix and PO review package.

## Exit Criteria

Module 12 is GREEN only when all blocking requirements and acceptance criteria above pass, required regression checks are green, blocking defects are closed, and the Human Product Owner explicitly approves the module.

# 10. Cross-Cutting Non-Functional Quality Model

Module-specific NFRs are complemented by cross-cutting quality concerns. Concrete numeric thresholds are introduced only when a reference environment and workload are defined.

| **Area**              | **Policy**                                                                                                                                             |
|-----------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| Performance           | Measure representative workloads. Avoid unsupported arbitrary targets. Record hardware, platform, scene complexity, and measurement method.            |
| Reliability           | Project operations must fail visibly and preserve the last valid recoverable state where practical.                                                    |
| Persistence integrity | Round-trip tests must cover supported scene data as modules add new object types and relationships.                                                    |
| Compatibility         | Supported OS/browser/GPU matrices are versioned and tested progressively as platform packaging matures.                                                |
| Accessibility         | Primary editor actions should support keyboard-accessible paths where practical; UI semantics and contrast requirements are tracked as the UI matures. |
| Security              | Untrusted files, AI responses, scripts, extensions, and external assets are treated as trust boundaries.                                               |
| Privacy               | Telemetry or AI data transfer, if introduced, must be explicit and documented.                                                                         |
| Maintainability       | Public/internal module boundaries, testability, diagnostics, and dependency direction are reviewed continuously.                                       |
| Observability         | Failures should identify the affected subsystem and provide enough context for reproduction without leaking sensitive data.                            |

# 11. Test Strategy

- Unit tests for deterministic domain logic, serialization, geometry/math helpers, and state transitions.

- Integration tests for scene/object/rendering boundaries, persistence, imports/exports, and cross-module behavior.

- UI/interaction tests for critical editor workflows where stable automation is practical.

- Golden/reference fixtures for persistence and geometry behaviors when appropriate, with explicit update review.

- Independent readers/parsers for exported standard formats where possible.

- Performance/reference workload tests introduced with the module that needs them.

- Regression suites remain cumulative: approval of a new module must not invalidate earlier accepted behavior.

- Manual exploratory testing remains part of PO/QA review for visual and interaction behavior that automated checks cannot adequately judge.

# 12. PO Review Package

Before every PO gate, the PM must provide a compact evidence package rather than only a statement that implementation is complete.

- Module objective and scope.

- Traceability matrix.

- List of implemented requirements.

- Automated test summary.

- Functional QA result.

- Non-functional QA result.

- Regression result.

- Known limitations and technical debt.

- Screenshots/video/demo steps where visual behavior is relevant.

- Explicit list of any proposed requirement changes requiring PO decision.

# 13. Traceability Matrix Template

| **ID**     | **Implementation reference** | **Automated test** | **QA result** | **Finding/exception** | **PO status** |
|------------|------------------------------|--------------------|---------------|-----------------------|---------------|
| M?-FR-???  |                              |                    |               |                       |               |
| M?-NFR-??? |                              |                    |               |                       |               |
| M?-AC-???  |                              |                    |               |                       |               |

# 14. Product Roadmap Beyond the Initial Modules

After Module 12, possible product directions include advanced animation curves and constraints, sculpting, particles and physics, richer procedural systems, compositor workflows, collaboration, templates, shared asset libraries, marketplace capabilities, professional project management, and additional interchange/rendering formats. These are roadmap candidates, not commitments in this specification.

Monetization remains a hypothesis until product usage, infrastructure costs, AI/rendering costs, and target-user willingness to pay are validated. Potential models include Free, Pro, Teams, and a future marketplace, but pricing is intentionally not fixed in this engineering baseline.

# 15. Project Rules for AI-Driven Implementation

- Treat this as a real software product, not a toy implementation or demonstration-only codebase.

- Do not invent contradictory constraints, destructive traps, or artificial failure scenarios merely to create issues.

- Do not change a requirement or acceptance criterion to match an implementation. Escalate the mismatch to the TL/PM and PO.

- Do not mark a requirement implemented without verifiable evidence.

- Prefer the simplest architecture that satisfies the current approved module while preserving explicitly known extension points.

- Do not prematurely implement later modules unless required by an approved architectural dependency.

- When a false assumption or requirement conflict emerges naturally during real implementation, document it and escalate it rather than hiding it.

- Keep human PO approval as the final gate between modules.

# 16. Initial Execution Plan

7.  PO reviews and approves this specification baseline.

8.  PM and TL prepare Module 0 only, including technology-selection decisions and any blocking ADRs.

9.  PO approves Module 0 Definition of Ready.

10. Team implements Module 0 and runs code review, functional verification, non-functional verification, and regression checks.

11. PM presents the Module 0 evidence package to the PO.

12. Findings are corrected and affected verification is rerun.

13. Only after Module 0 is GREEN and PO-approved does Module 1 enter implementation.

14. The same gated flow repeats for every subsequent module.

# 17. Open Decisions Before Module 0

- Primary implementation language(s) and UI/application framework.

- Rendering/GPU abstraction and Web versus desktop strategy.

- Desktop packaging strategy and the exact meaning of first-class desktop support.

- Initial project-file format and versioning strategy.

- Primary supported development OS and initial CI matrix.

- Initial browser support target for Web.

- Testing frameworks and UI automation approach.

- Repository strategy and code ownership conventions.

- Reference hardware/workloads for the first performance-sensitive module.

- Licensing model for the application and third-party dependencies.

# 18. Versioning and Change Control

This document is the baseline Product & Engineering Specification v1.0. Requirement changes after approval should be recorded with a version change or change log entry. Changes that affect an already approved module require impact analysis and regression review. The PO approves product-scope changes; the TL approves implementation-level decisions that do not change product behavior or acceptance.

End of specification.

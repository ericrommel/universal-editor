# Universal Visual Creation Platform

## Product Overview

**Status:** Product vision baseline\
**Working language:** English\
**Product Owner:** Human\
**Implementation model:** Progressive, module-gated delivery

> **Professional power without professional complexity.**

------------------------------------------------------------------------

## 1. Product Vision

The Universal Visual Creation Platform is a cross-platform visual
creation environment for **Web, Windows, macOS, and Linux**.

The product combines the accessibility and directness of modern visual
design tools with the spatial and technical capabilities normally
associated with professional 3D software.

The goal is **not** to build a simplified Blender, a Canva clone with 3D
features, or several editors placed inside the same application.

The goal is to create **one visual creation environment** where users
can begin with familiar concepts such as shapes, text, images, and
drawing, then progressively introduce depth, spatial composition, 3D
geometry, materials, lighting, cameras, and animation without abandoning
the original workflow.

A user should be able to start creating without understanding
traditional computer-graphics terminology, while advanced capabilities
remain available as their needs grow.

------------------------------------------------------------------------

## 2. Product Problem

Visual creation software commonly falls into two groups.

Accessible tools are easy to start using, but their technical ceiling is
often reached quickly when users need spatial composition, 3D geometry,
advanced animation, lighting, or rendering.

Professional 3D tools provide deep technical capability, but users are
immediately exposed to concepts such as topology, vertices, faces,
normals, UVs, shaders, modifiers, nodes, armatures, render settings, and
complex editor layouts.

The product targets the space between those extremes:

> **A visual creation tool that is simple enough to start immediately,
> but powerful enough that users do not quickly outgrow it.**

------------------------------------------------------------------------

## 3. Core Product Principles

### P-01 --- Unified Visual Space

2D and 3D content coexist in the same scene, object hierarchy, and
editing experience.

The product must not evolve into separate 2D, 2.5D, and 3D editors
connected only at the UI level.

### P-02 --- Progressive Complexity

The product exposes only the complexity needed for the current task.

Basic workflows remain simple. More advanced controls become available
progressively as the user needs them.

### P-03 --- Direct Manipulation

Whenever practical, users interact with the visible result itself
instead of beginning with abstract technical parameters.

For example, moving an object or light directly in the viewport is
preferred over requiring the user to enter coordinates before they can
manipulate it.

### P-04 --- Non-Destructive Creation

Creative operations should remain editable and reversible whenever
technically practical.

Derived geometry should preserve its editable source until the user
explicitly chooses a destructive conversion.

### P-05 --- 2D → 2.5D → 3D Continuum

2.5D is not a separate subsystem.

A visual object can progressively gain spatial properties such as Z
position, depth, extrusion, material, lighting response, or other 3D
characteristics while remaining part of the same scene and object model.

### P-06 --- Simple by Default, Powerful on Demand

Simple tasks must have simple workflows.

Advanced users should be able to access deeper capabilities without
requiring a separate product edition or abandoning the original project.

### P-07 --- AI as an Accelerator

AI is integrated into the creative workflow rather than added as an
isolated chatbot.

AI may generate or transform native project objects, but the core editor
must remain fully usable without AI.

### P-08 --- Cross-Platform Project Compatibility

Projects should remain portable across supported platforms.

Platform-specific capabilities may exist, but the core scene and project
model must not depend on one operating system or presentation layer.

------------------------------------------------------------------------

## 4. Core Product Concept

The central abstraction is a **unified scene containing universal visual
objects**.

A visual object may represent:

-   a shape;
-   text;
-   an image;
-   a drawing or stroke;
-   a spatial curve;
-   a mesh;
-   a camera;
-   a light;
-   or future visual types.

Common object capabilities include:

``` text
Object
├── Identity / Metadata
├── Hierarchy
├── Transform
│   ├── Position X / Y / Z
│   ├── Rotation X / Y / Z
│   └── Scale X / Y / Z
├── Visual Representation
├── Appearance / Material
├── Animation
└── Behaviors / Modifiers
```

Not every object needs every capability, but compatible objects
participate in the same scene architecture rather than being stored in
disconnected editing systems.

------------------------------------------------------------------------

## 5. Draw in Space

Spatial drawing is a defining product capability.

The user should be able to draw naturally and allow the resulting stroke
to become a native spatial object.

A conceptual workflow is:

``` text
Draw
  ↓
Editable Curve
  ↓
Stroke / Tube / Surface / Extrusion / Other Derived Geometry
```

The user thinks first about the shape they want to create rather than
being forced to begin with topology.

Where possible, derived geometry remains linked to the editable source
curve.

------------------------------------------------------------------------

## 6. Unified 2D, 2.5D, and 3D Composition

A single scene may contain content such as:

``` text
Background        → 2D
Text              → 2D
Illustration      → 2D
Character         → 2D / 2.5D
Spatial Drawing   → 2.5D / 3D
Mesh              → 3D
Camera            → 3D
Light             → 3D
```

These categories describe how content behaves; they must not require
separate applications or unrelated project formats.

A 2D object may progressively gain depth or spatial behavior.

For example:

``` text
2D Shape
   ↓
Z Position
   ↓
Depth / Extrusion
   ↓
Material
   ↓
Lighting
   ↓
Animation
```

This continuum is one of the product's primary differentiators.

------------------------------------------------------------------------

## 7. Interaction Philosophy

The interface should remain contextual and task-oriented.

Selecting text should expose text-related controls.

Selecting a light should expose lighting controls.

Selecting geometry should expose relevant spatial or modeling controls.

Advanced functionality should not be permanently visible merely because
the application supports it.

A possible progression is:

``` text
Level 1 — Create
Move / Rotate / Scale / Draw / Text / Color

Level 2 — Refine
Material / Lighting / Animation / Extrude

Level 3 — Advanced
Modifiers / Physics / Advanced Animation

Level 4 — Expert
Nodes / Procedural Systems / Scripting
```

These levels describe progressive exposure of capability; they are not
separate application editions.

------------------------------------------------------------------------

## 8. Target Users

### Primary user

A visual creator who wants to create spatial or 3D-enhanced content but
does not want to begin by learning a traditional professional 3D
package.

### Secondary users

Potential secondary users include:

-   illustrators;
-   motion designers;
-   content creators;
-   students;
-   indie game creators.

### Long-term audiences

The product may eventually support deeper workflows for professional 3D
artists, filmmakers, architects, educators, and other specialized users,
but those audiences do not define the initial product experience.

------------------------------------------------------------------------

## 9. Platform Vision

The target platforms are:

-   Web;
-   Windows;
-   macOS;
-   Linux.

Desktop is a first-class target, not merely a requirement to wrap the
website unchanged.

The product may share substantial technology between Web and desktop
while still using native capabilities where they provide meaningful
advantages, including:

-   local file access;
-   larger projects;
-   hardware acceleration;
-   storage;
-   device integration;
-   performance-sensitive operations.

The project model and core scene semantics should remain independent
from the platform shell.

------------------------------------------------------------------------

## 10. AI Vision

AI should operate on the same native objects and workflows used by
manual editing.

Possible future workflows include:

-   text → 3D;
-   image → 3D;
-   sketch → 3D;
-   scene generation;
-   animation instructions;
-   material or appearance changes;
-   creation of variations.

Examples:

> "Create a low-poly medieval sword."

> "Animate the camera moving slowly toward the character."

> "Make this object metallic."

> "Change the lighting to sunset."

AI-generated or AI-modified content should remain manually editable
after the operation completes.

AI availability must not be required for normal project creation,
editing, persistence, or export.

------------------------------------------------------------------------

## 11. Product Scope Strategy

The product is implemented progressively.

Each implementation module must produce a coherent, testable increment
rather than attempting to build the complete long-term vision at once.

A module is not considered complete merely because code exists.

Each module follows the project quality flow:

``` text
Planning
   ↓
Implementation
   ↓
Code Review
   ↓
Functional Verification
   ↓
Non-Functional Verification
   ↓
Product Owner Review
   ↓
Corrections, if required
   ↓
GREEN + PO APPROVED
   ↓
Next Module
```

Only the Product Owner gives final approval for a module.

Detailed implementation modules, requirements, non-functional
requirements, acceptance criteria, and quality gates are maintained
separately in the **Product & Engineering Specification**.

------------------------------------------------------------------------

## 12. Initial Product Boundaries

The initial implementation should not attempt to reproduce the complete
feature set of professional 3D or design software.

The following capabilities belong to later stages unless an approved
architectural dependency requires foundational work earlier:

-   advanced sculpting;
-   complex physics;
-   advanced particle systems;
-   procedural node systems;
-   professional compositor workflows;
-   scripting and plugins;
-   real-time collaboration;
-   marketplace;
-   professional project management;
-   advanced AI generation workflows.

The architecture should leave room for these capabilities without
prematurely implementing them.

------------------------------------------------------------------------

## 13. Product Success Hypothesis

The core hypothesis is:

> **Users can create and progressively enrich visual content from 2D
> into spatial and 3D forms through one coherent workflow, without
> needing traditional 3D knowledge at the beginning and without
> encountering an artificially low technical ceiling later.**

The earliest implementation stages should validate this hypothesis
before the product expands into advanced professional capabilities.

------------------------------------------------------------------------

## 14. One-Sentence Pitch

> **A cross-platform visual creation environment where users can move
> naturally from 2D drawing and design into spatial composition, 3D, and
> animation through direct manipulation and progressive complexity.**

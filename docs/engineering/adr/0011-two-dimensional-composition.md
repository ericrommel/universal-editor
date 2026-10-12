# ADR-0011 — Two-dimensional composition on the shared scene

**Status:** Accepted on the working line (`master`).

**Date:** 2026-10-12

## Context

The scene on `master` can hold a rectangle and a box. The product is one visual space, so raster painting, vector illustration, and 2D scene or character animation have to become kinds and capabilities of that scene. They are not three editors and not three documents.

The referenced applications do not fit that model:

- PixiEditor is an LGPL-3.0 C# application with its own document. This repository does not accept that license, and the runtime is not ours.
- Core2D is MIT and actively maintained, and it is a C# diagram application with its own project, scripting, and exporters.
- nayata/editor is a small MIT Haxe level editor, not a maintained library for this stack.
- Cadet is an unmaintained ActionScript engine and editor.
- Frame-by-frame and rigged animation suites are separate applications. Embedding one would add a second scene model and, for the usual open-source editors, a license this repository does not accept.

No new package is added.

## Decision

Schema token `1` still means a rectangle or a box and still rejects unknown keys. The reader accepts it and supplies the historical fill. The writer emits schema token `2`.

Schema `2` adds:

- `ellipse`, with the same width, height, transform, hierarchy, and fill as a rectangle;
- `text`, plain text and a font size, not HTML and not a font file;
- `fill`, a `#rrggbb` color, on rectangle, ellipse, text, and box.

Text is at most 400 Unicode scalar values, NFC, and free of ASCII controls. The font size is a finite number greater than zero and at most 512. A rejected value throws a fixed domain message and does not echo the input. Sibling order stays the paint order. `reorderNode` moves a node within its current parent.

The sheet draws these nodes in the same SVG surface. Selection, move, resize, rotate, undo, and scene.json save apply to all of them. glTF still reads and writes rectangles and boxes. An ellipse or a text node fails the whole glTF export with the existing unsupported-node message. Fill is not stored in glTF.

The assistant may create an ellipse or text, set a fill, and move, resize, or rotate any of these objects. A pixel canvas, a pen path, bones, or a timeline is still refused and does not change the scene.

Raster bytes, editable vector paths, and animation tracks are later representations on this same scene. They are not authorized by this decision. Image bytes stay out of the scene document. `renderNull` stays empty.

## Consequences

- A schema `1` file opens, and saving it writes schema `2` with the default fills.
- A scene that contains an ellipse or text cannot be exported as glTF until those objects are removed. scene.json keeps them.
- ADR-0010's action list is extended by `createEllipse`, `createText`, and `setFill`.

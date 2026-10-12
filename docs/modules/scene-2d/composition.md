# 2D composition

Rectangle, ellipse, text, and box are objects in one scene. A person creates them from the page, drags to move, and edits size, rotation, and fill on the selection. Text is plain words and a font size. Bring forward and Send backward change order among siblings. Undo and redo cover those edits. Save writes `scene.json` schema 2, and Open reads schema 1 or schema 2.

glTF import and export still carry rectangles and boxes. Export of a scene that includes an ellipse or text fails and leaves the scene in place.

Pixel painting, pen paths, and a timeline are not on this page. They belong on these same objects later, not in a second editor.

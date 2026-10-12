import type { EditorShape } from "@uvcp/editor";

export function shapeLabel(shape: EditorShape): string {
  const kind = shape.kind === "box" ? "Box" : "Rectangle";
  return `${kind} ${shape.id}`;
}

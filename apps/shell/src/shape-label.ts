import type { EditorShape } from "@uvcp/editor";

const KIND_LABEL = {
  rectangle: "Rectangle",
  ellipse: "Ellipse",
  text: "Text",
  box: "Box",
} as const;

export function shapeLabel(shape: EditorShape): string {
  return `${KIND_LABEL[shape.kind]} ${shape.id}`;
}

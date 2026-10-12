export { DomainError } from "./domain-error.ts";
export {
  canonicalizeFiniteNumber,
  canonicalizeFiniteTriple,
} from "./number.ts";
export type {
  BoxNode,
  EllipseNode,
  RectangleNode,
  Scene,
  SceneKind,
  SceneNode,
  TextNode,
  Transform,
  Triple,
} from "./scene.ts";
export {
  acceptFill,
  acceptFontSize,
  acceptText,
  createScene,
  DEFAULT_FILL,
  deleteNode,
  insertNode,
  reorderNode,
  replaceExtents,
  replaceFill,
  replaceText,
  replaceTransform,
} from "./scene.ts";

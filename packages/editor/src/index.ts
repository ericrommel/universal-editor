export type { AssistantApply } from "./assistant.ts";
export { applyAssistantActions } from "./assistant.ts";
export { initializeFoundation } from "./compose.ts";
export type {
  EditorDocument,
  EditorHistory,
  EditorShape,
  Frame,
  ResizeHandle,
  ShapeKind,
} from "./document.ts";
export {
  addShape,
  boxShift,
  commitPresent,
  containedPosition,
  createHistory,
  deleteSelected,
  dragPosition,
  editorErrorMessage,
  exportDocument,
  moveShape,
  openDocument,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  placeShape,
  redo,
  replacePresent,
  resizedDepth,
  resizedFrame,
  resizeShape,
  rotateShape,
  SCENE_BYTE_LIMIT,
  SCENE_TOO_LARGE,
  selectShape,
  shapeAt,
  shapesOf,
  undo,
} from "./document.ts";
export type {
  EditorSession,
  SettledSession,
  StartingSession,
} from "./session.ts";
export { InitializationError, startSession } from "./session.ts";

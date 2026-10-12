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
  canDelete,
  canRedo,
  canUndo,
  commitPresent,
  containedPosition,
  createHistory,
  deleteSelected,
  dragPosition,
  editorErrorMessage,
  exportDocument,
  exportReadableDocument,
  moveShape,
  openDocument,
  placeShape,
  redo,
  replacePresent,
  resizedDepth,
  resizedFrame,
  resizeShape,
  rotateShape,
  SCENE_BYTE_LIMIT,
  SCENE_TOO_LARGE,
  SHEET_HEIGHT,
  SHEET_WIDTH,
  selectShape,
  shapeAt,
  shapesOf,
  sheetShapes,
  undo,
} from "./document.ts";
export {
  exportGltfFile,
  exportSelectedGltf,
  GLTF_BYTE_LIMIT,
  GLTF_TOO_LARGE,
  importGltfFile,
} from "./gltf-file.ts";
export type {
  EditorSession,
  SettledSession,
  StartingSession,
} from "./session.ts";
export { InitializationError, startSession } from "./session.ts";

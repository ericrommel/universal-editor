import { assistantMessages, parseActions, type SceneAction } from "@uvcp/ai";
import {
  DomainError,
  insertNode,
  replaceTransform,
  type SceneNode,
} from "@uvcp/core";
import {
  commitPresent,
  type EditorDocument,
  type EditorHistory,
  moveShape,
  placeShape,
  radiansFromDegrees,
  sheetShapes,
} from "./document.ts";

export type AssistantApply =
  | {
      readonly ok: true;
      readonly history: EditorHistory;
      readonly summary: string;
    }
  | {
      readonly ok: false;
      readonly history: EditorHistory;
      readonly message: string;
    };

class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionError";
  }
}

export function applyAssistantActions(
  history: EditorHistory,
  actions: unknown,
): AssistantApply {
  const plan = parseActions(actions);
  if (!plan.ok) {
    return { ok: false, history, message: plan.message };
  }
  try {
    let present = history.present;
    for (const action of plan.actions) {
      present = applyOne(present, action);
    }
    return {
      ok: true,
      history: commitPresent(history, present),
      summary: summaryOf(plan.actions),
    };
  } catch (error) {
    if (error instanceof ActionError) {
      return { ok: false, history, message: error.message };
    }
    if (error instanceof DomainError) {
      return {
        ok: false,
        history,
        message: `${error.message} ${assistantMessages.unchanged}`,
      };
    }
    throw error;
  }
}

function applyOne(
  document: EditorDocument,
  action: SceneAction,
): EditorDocument {
  switch (action.type) {
    case "createRectangle":
      return created(document, action, "rectangle");
    case "createBox":
      return created(document, action, "box");
    case "move": {
      requiredNode(document, action.id);
      const moved = moveShape(document, action.id, action.x, action.y);
      return { scene: moved.scene, selectedId: action.id };
    }
    case "resize":
      return resized(document, action);
    case "rotate": {
      const node = requiredNode(document, action.id);
      return {
        scene: replaceTransform(document.scene, action.id, {
          position: node.transform.position,
          rotation: [
            node.transform.rotation[0],
            node.transform.rotation[1],
            radiansFromDegrees(action.degrees),
          ],
          scale: node.transform.scale,
        }),
        selectedId: action.id,
      };
    }
  }
}

function created(
  document: EditorDocument,
  action: Extract<SceneAction, { type: "createRectangle" | "createBox" }>,
  kind: "rectangle" | "box",
): EditorDocument {
  const scene = insertNode(document.scene, {
    id: action.id,
    kind,
    parentId: null,
    index: document.scene.rootIds.length,
    width: action.width,
    height: action.height,
    ...(kind === "box" && action.type === "createBox"
      ? { depth: action.depth }
      : {}),
    transform: {
      position: [action.x, action.y, 0],
      rotation: [0, 0, radiansFromDegrees(action.rotation)],
      scale: [1, 1, 1],
    },
  });
  return { scene, selectedId: action.id };
}

function resized(
  document: EditorDocument,
  action: Extract<SceneAction, { type: "resize" }>,
): EditorDocument {
  const node = requiredNode(document, action.id);
  if (node.kind === "rectangle") {
    if (action.depth !== undefined) {
      throw new ActionError(assistantMessages.rectangleDepth);
    }
    return placed(document, action.id, action.width, action.height, null);
  }
  if (action.depth === undefined) {
    throw new ActionError(assistantMessages.boxDepth);
  }
  return placed(document, action.id, action.width, action.height, action.depth);
}

function placed(
  document: EditorDocument,
  id: string,
  width: number,
  height: number,
  depth: number | null,
): EditorDocument {
  requiredNode(document, id);
  const sheet = sheetShapes(document).find((shape) => shape.id === id);
  if (!sheet) {
    throw new DomainError("UNKNOWN_NODE", "Scene node was not found.");
  }
  const next = placeShape(
    document,
    id,
    { x: sheet.x, y: sheet.y, width, height },
    depth,
  );
  return { scene: next.scene, selectedId: id };
}

function requiredNode(document: EditorDocument, id: string): SceneNode {
  const node = document.scene.nodes[id];
  if (node) {
    return node;
  }
  replaceTransform(document.scene, id, {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  });
  throw new DomainError("UNKNOWN_NODE", "Scene node was not found.");
}

function summaryOf(actions: readonly SceneAction[]): string {
  return actions.map(sentence).join(" ");
}

function sentence(action: SceneAction): string {
  switch (action.type) {
    case "createRectangle":
      return `Created rectangle ${action.id}.`;
    case "createBox":
      return `Created box ${action.id}.`;
    case "move":
      return `Moved ${action.id}.`;
    case "resize":
      return `Resized ${action.id}.`;
    case "rotate":
      return `Rotated ${action.id}.`;
  }
}

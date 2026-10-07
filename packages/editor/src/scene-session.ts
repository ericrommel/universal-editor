import {
  assistantMessages,
  parseActions,
  type SceneAction,
  type SceneFact,
} from "@uvcp/ai";
import {
  createScene,
  DomainError,
  insertNode,
  replaceExtents,
  replaceTransform,
  type Scene,
  type SceneNode,
} from "@uvcp/core";

export type SceneHandle = {
  readonly generation: number;
  readonly facts: readonly SceneFact[];
};

export type ApplyResult =
  | {
      readonly ok: true;
      readonly handle: SceneHandle;
      readonly summary: string;
    }
  | {
      readonly ok: false;
      readonly handle: SceneHandle;
      readonly message: string;
    };

const scenes = new WeakMap<SceneHandle, Scene>();
let generation = 0;

class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionError";
  }
}

export function createSceneHandle(): SceneHandle {
  return hold(createScene());
}

export function applySceneActions(
  handle: SceneHandle,
  actions: unknown,
): ApplyResult {
  const scene = scenes.get(handle);
  if (scene === undefined) {
    return { ok: false, handle, message: assistantMessages.sceneMissing };
  }
  const plan = parseActions(actions);
  if (!plan.ok) {
    return { ok: false, handle, message: plan.message };
  }
  try {
    const next = commit(scene, plan.actions);
    return {
      ok: true,
      handle: hold(next),
      summary: summaryOf(plan.actions),
    };
  } catch (error) {
    if (error instanceof ActionError) {
      return { ok: false, handle, message: error.message };
    }
    if (error instanceof DomainError) {
      return {
        ok: false,
        handle,
        message: `${error.message} ${assistantMessages.unchanged}`,
      };
    }
    throw error;
  }
}

function commit(scene: Scene, actions: readonly SceneAction[]): Scene {
  let next = scene;
  for (const action of actions) {
    next = applyOne(next, action);
  }
  return next;
}

function applyOne(scene: Scene, action: SceneAction): Scene {
  switch (action.type) {
    case "createRectangle":
      return insertNode(scene, {
        id: action.id,
        kind: "rectangle",
        parentId: null,
        index: scene.rootIds.length,
        width: action.width,
        height: action.height,
        transform: {
          position: action.position,
          rotation: action.rotation,
          scale: [1, 1, 1],
        },
      });
    case "createBox":
      return insertNode(scene, {
        id: action.id,
        kind: "box",
        parentId: null,
        index: scene.rootIds.length,
        width: action.width,
        height: action.height,
        depth: action.depth,
        transform: {
          position: action.position,
          rotation: action.rotation,
          scale: [1, 1, 1],
        },
      });
    case "move": {
      const node = requiredNode(scene, action.id);
      return replaceTransform(scene, action.id, {
        position: action.position,
        rotation: node.transform.rotation,
        scale: node.transform.scale,
      });
    }
    case "rotate": {
      const node = requiredNode(scene, action.id);
      return replaceTransform(scene, action.id, {
        position: node.transform.position,
        rotation: action.rotation,
        scale: node.transform.scale,
      });
    }
    case "resize":
      return resize(scene, action);
  }
}

function resize(
  scene: Scene,
  action: Extract<SceneAction, { type: "resize" }>,
): Scene {
  const node = requiredNode(scene, action.id);
  if (node.kind === "rectangle") {
    if (action.depth !== undefined) {
      throw new ActionError(assistantMessages.rectangleDepth);
    }
    return replaceExtents(scene, action.id, {
      width: action.width,
      height: action.height,
    });
  }
  if (action.depth === undefined) {
    throw new ActionError(assistantMessages.boxDepth);
  }
  return replaceExtents(scene, action.id, {
    width: action.width,
    height: action.height,
    depth: action.depth,
  });
}

function requiredNode(scene: Scene, id: string): SceneNode {
  const node = scene.nodes[id];
  if (node) {
    return node;
  }
  replaceTransform(scene, id, {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  });
  throw new DomainError("UNKNOWN_NODE", "Scene node was not found.");
}

function hold(scene: Scene): SceneHandle {
  const handle: SceneHandle = {
    generation,
    facts: factsOf(scene),
  };
  generation += 1;
  scenes.set(handle, scene);
  return handle;
}

function factsOf(scene: Scene): readonly SceneFact[] {
  const facts: SceneFact[] = [];
  const seen = new Set<string>();
  for (const id of scene.rootIds) {
    const node = scene.nodes[id];
    if (node) {
      collect(scene, node, facts, seen);
    }
  }
  return facts;
}

function collect(
  scene: Scene,
  node: SceneNode,
  facts: SceneFact[],
  seen: Set<string>,
): void {
  if (seen.has(node.id)) {
    return;
  }
  seen.add(node.id);
  const shared = {
    id: node.id,
    position: node.transform.position,
    rotation: node.transform.rotation,
    scale: node.transform.scale,
    width: node.width,
    height: node.height,
  };
  facts.push(
    node.kind === "box"
      ? { ...shared, kind: "box", depth: node.depth }
      : { ...shared, kind: "rectangle", depth: null },
  );
  for (const childId of node.childIds) {
    const child = scene.nodes[childId];
    if (child) {
      collect(scene, child, facts, seen);
    }
  }
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

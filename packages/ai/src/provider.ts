import OpenAI from "openai";
import {
  type ActionPlan,
  actionsFromCalls,
  type ProposedCall,
  type SceneFact,
} from "./actions.ts";
import { type EntitlementPort, includedEntitlement } from "./entitlement.ts";
import { assistantMessages } from "./messages.ts";
import { scenePrompt } from "./prompt.ts";
import { type ProviderSetup, providerSettings } from "./provider-settings.ts";

const triple = {
  type: "array",
  items: { type: "number" },
  minItems: 3,
  maxItems: 3,
};

const toolDefinitions = [
  {
    name: "createRectangle",
    description:
      "Create a rectangle. Position is its center. Rotation is degrees. Width and height are greater than zero.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        id: { type: "string" },
        width: { type: "number" },
        height: { type: "number" },
        position: triple,
        rotation: triple,
      },
      required: ["id", "width", "height"],
    },
  },
  {
    name: "createBox",
    description:
      "Create a box. Position is its center. Rotation is degrees. Width, height, and depth are greater than zero.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        id: { type: "string" },
        width: { type: "number" },
        height: { type: "number" },
        depth: { type: "number" },
        position: triple,
        rotation: triple,
      },
      required: ["id", "width", "height", "depth"],
    },
  },
  {
    name: "move",
    description: "Move an existing object by replacing its center position.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        id: { type: "string" },
        position: triple,
      },
      required: ["id", "position"],
    },
  },
  {
    name: "resize",
    description:
      "Replace an object's width and height. Include depth only for a box. Use this for a change of size.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        id: { type: "string" },
        width: { type: "number" },
        height: { type: "number" },
        depth: { type: "number" },
      },
      required: ["id", "width", "height"],
    },
  },
  {
    name: "rotate",
    description: "Replace an object's rotation in degrees, intrinsic XYZ.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        id: { type: "string" },
        rotation: triple,
      },
      required: ["id", "rotation"],
    },
  },
] as const;

export type SceneModel = {
  propose(input: {
    readonly instruction: string;
    readonly facts: readonly SceneFact[];
  }): Promise<ActionPlan>;
};

export type SceneModelResult =
  | { readonly ok: true; readonly model: SceneModel }
  | { readonly ok: false; readonly message: string };

export function sceneModel(
  env: Readonly<Record<string, string | undefined>>,
  entitlement: EntitlementPort = includedEntitlement,
): SceneModelResult {
  const setup = providerSettings(env);
  if (!setup.ok) {
    return setup;
  }
  return { ok: true, model: modelFor(setup, entitlement) };
}

export function modelFor(
  setup: Extract<ProviderSetup, { ok: true }>,
  entitlement: EntitlementPort = includedEntitlement,
): SceneModel {
  const settings = setup.settings;
  const client = new OpenAI({
    apiKey: settings.apiKey,
    baseURL: settings.baseURL,
    timeout: 30_000,
    maxRetries: 0,
  });
  return {
    async propose(input) {
      try {
        const calls =
          settings.kind === "xai"
            ? await xaiCalls(client, settings.model, input)
            : await compatibleCalls(client, settings.model, input);
        return actionsFromCalls(calls, entitlement);
      } catch {
        return { ok: false, message: assistantMessages.providerDown };
      }
    },
  };
}

async function xaiCalls(
  client: OpenAI,
  model: string,
  input: { readonly instruction: string; readonly facts: readonly SceneFact[] },
): Promise<readonly ProposedCall[]> {
  const response = await client.responses.create({
    model,
    input: scenePrompt(input.facts, input.instruction),
    tools: toolDefinitions.map((definition) => ({
      type: "function" as const,
      name: definition.name,
      description: definition.description,
      parameters: definition.parameters,
      strict: false,
    })),
  });
  const calls: ProposedCall[] = [];
  for (const item of response.output) {
    if (item.type !== "function_call") {
      continue;
    }
    calls.push({ name: item.name, input: readArguments(item.arguments) });
  }
  return calls;
}

async function compatibleCalls(
  client: OpenAI,
  model: string,
  input: { readonly instruction: string; readonly facts: readonly SceneFact[] },
): Promise<readonly ProposedCall[]> {
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "user", content: scenePrompt(input.facts, input.instruction) },
    ],
    tools: toolDefinitions.map((definition) => ({
      type: "function" as const,
      function: {
        name: definition.name,
        description: definition.description,
        parameters: definition.parameters,
      },
    })),
  });
  const calls: ProposedCall[] = [];
  for (const call of response.choices[0]?.message.tool_calls ?? []) {
    if (call.type !== "function") {
      continue;
    }
    calls.push({
      name: call.function.name,
      input: readArguments(call.function.arguments),
    });
  }
  return calls;
}

function readArguments(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

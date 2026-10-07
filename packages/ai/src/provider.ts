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

const toolDefinitions = [
  {
    name: "createRectangle",
    description:
      "Create a rectangle. x and y are its top-left. Width and height are greater than zero. rotation is degrees clockwise.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        id: { type: "string" },
        x: { type: "number" },
        y: { type: "number" },
        width: { type: "number" },
        height: { type: "number" },
        rotation: { type: "number" },
      },
      required: ["id", "width", "height"],
    },
  },
  {
    name: "createBox",
    description:
      "Create a box. x and y are its top-left. Width, height, and depth are greater than zero. rotation is degrees clockwise.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        id: { type: "string" },
        x: { type: "number" },
        y: { type: "number" },
        width: { type: "number" },
        height: { type: "number" },
        depth: { type: "number" },
        rotation: { type: "number" },
      },
      required: ["id", "width", "height", "depth"],
    },
  },
  {
    name: "move",
    description: "Move an existing object by replacing its top-left x and y.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        id: { type: "string" },
        x: { type: "number" },
        y: { type: "number" },
      },
      required: ["id", "x", "y"],
    },
  },
  {
    name: "resize",
    description:
      "Replace an object's width and height. Include depth only for a box.",
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
    description:
      "Set an object's rotation in degrees clockwise around its center.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        id: { type: "string" },
        degrees: { type: "number" },
      },
      required: ["id", "degrees"],
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

import type { SceneFact } from "./actions.ts";

const INSTRUCTIONS = [
  "You edit the open scene by calling tools.",
  "The only objects are rectangles and boxes.",
  "Position is the center. Rotation is degrees, intrinsic XYZ.",
  "Size is width and height. A box also has depth. Sizes must be greater than zero.",
  "Change size with resize. Do not invent a scale action.",
  "Use an existing id to change an object. Choose a new short id to create one.",
  "A simple composition is several create, move, resize, or rotate calls in this turn.",
  "If the request cannot be done with these tools, call none.",
].join(" ");

export function scenePrompt(
  facts: readonly SceneFact[],
  instruction: string,
): string {
  return `${INSTRUCTIONS}\nScene:\n${JSON.stringify(facts)}\nRequest:\n${instruction}`;
}

import type { SceneFact } from "./actions.ts";

const INSTRUCTIONS = [
  "You edit the open scene by calling tools.",
  "Objects are rectangles and boxes.",
  "x increases right and y increases down. x and y are the top-left of the shape.",
  "Width, height, and box depth are greater than zero, in the same units as the current scene.",
  "Existing shapes are often about 80 to 200 units across.",
  "Rotation is degrees clockwise around the shape center.",
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

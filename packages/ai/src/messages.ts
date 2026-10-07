export const assistantMessages = {
  emptyInstruction: "Describe what to create or change.",
  instructionTooLong:
    "Describe the change in 2000 characters or fewer. Nothing was changed.",
  noChange: "The assistant did not change the scene.",
  unavailable:
    "The assistant asked for an action that is not available. Nothing was changed.",
  badValue:
    "The assistant sent a value this scene cannot accept. Nothing was changed.",
  missingSize: "The assistant left out a size. Nothing was changed.",
  badId:
    "The assistant used an id this scene cannot accept. Nothing was changed.",
  tooMany: "The assistant sent too many actions. Nothing was changed.",
  paidArrange: "Automatic layout is a paid capability. Nothing was changed.",
  arrangeUnavailable:
    "Automatic layout is not available in this build. Nothing was changed.",
  basicDenied:
    "Scene editing is not available for this account. Nothing was changed.",
  rectangleDepth: "A rectangle has no depth. Nothing was changed.",
  boxDepth: "A box resize needs depth. Nothing was changed.",
  unchanged: "Nothing was changed.",
  providerDown: "The model provider could not complete the request.",
  missingXaiKey:
    "Set XAI_API_KEY to use the default model provider, or set UVCP_AI_PROVIDER to ollama for a local model.",
  missingLocalModel: "Set UVCP_AI_MODEL to the local model name.",
  missingCompatible:
    "Set UVCP_AI_BASE_URL and UVCP_AI_MODEL for the model provider.",
  badBaseUrl: "The model provider address must be https, or http on localhost.",
  badModel: "The model name is not accepted.",
  badKey: "The API key is not accepted.",
  badProvider: "The model provider name is not accepted.",
  badRequest: "The assistant request was not understood.",
  tooLarge: "The assistant request is too large.",
  wrongOrigin: "The assistant request was refused.",
  sceneMissing: "The scene is no longer available. Nothing was changed.",
  reachServer: "The assistant could not reach the local server.",
  working: "The assistant is editing the scene.",
  finiteNumber: "Enter a finite number.",
  emptyScene: "This scene has no objects.",
  selectObject: "Select an object to edit it.",
} as const;

export const LIMITS = {
  instruction: 2000,
  actions: 8,
  facts: 64,
  bodyBytes: 32768,
  keyLength: 512,
} as const;

export const assistantMessages = {
  emptyInstruction: "Describe what to create or change.",
  instructionTooLong:
    "Describe the change in 2000 characters or fewer. Nothing was changed.",
  noChange: "The assistant did not change the scene.",
  unavailable:
    "That request is not available. The assistant can create a rectangle or a box, or move, resize, or rotate a shape. Nothing was changed.",
  unsupportedShape:
    "That shape is not available. The assistant can create a rectangle or a box. Nothing was changed.",
  unsupportedCommand:
    "That action is not available. The assistant can create a rectangle or a box, or move, resize, or rotate a shape. Nothing was changed.",
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
  needsSetup: "Choose a hosted provider or a local model to use the assistant.",
  missingLocalModel: "Name the local model to use.",
  missingCompatible: "The hosted provider needs an address and a model name.",
  needKey: "Enter the API key for this provider.",
  needModel: "Enter the model name.",
  needAddress: "Enter the https address of the hosted provider.",
  hostedAddress: "A hosted provider address must use https.",
  localNotRunning:
    "Ollama is not running on this computer. Start Ollama, then look again. This application does not install it.",
  localNoModels:
    "Ollama is running, but it has no models yet. Add a model in Ollama, then look again.",
  localUnusable: "Ollama is running, but none of its models can be used here.",
  ready: "The assistant is ready.",
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

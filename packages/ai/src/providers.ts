export const assistantProviders = [
  {
    id: "openai",
    label: "OpenAI",
    defaultModel: "gpt-6-astra",
    keyUrl: "https://platform.openai.com/api-keys",
    keyLabel: "Create an OpenAI API key",
    hint: "Enter the model and API key. The address stays with OpenAI.",
    local: false,
    address: false,
  },
  {
    id: "anthropic",
    label: "Anthropic",
    defaultModel: "claude-sonnet-5-5",
    keyUrl: "https://platform.claude.com/settings/keys",
    keyLabel: "Create an Anthropic API key",
    hint: "Enter the model and API key. The address stays with Anthropic.",
    local: false,
    address: false,
  },
  {
    id: "gemini",
    label: "Gemini",
    defaultModel: "gemini-3.8-flash",
    keyUrl: "https://aistudio.google.com/apikey",
    keyLabel: "Create a Gemini API key",
    hint: "Enter the model and API key. The address stays with Gemini.",
    local: false,
    address: false,
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    defaultModel: "openrouter/auto",
    keyUrl: "https://openrouter.ai/settings/keys",
    keyLabel: "Create an OpenRouter API key",
    hint: "Enter the model and API key. A model id can include a prefix, such as openai/gpt-6-astra, or leave openrouter/auto. The address stays with OpenRouter.",
    local: false,
    address: false,
  },
  {
    id: "xai",
    label: "xAI",
    defaultModel: "grok-4.7",
    keyUrl: "https://console.x.ai/team/default/api-keys",
    keyLabel: "Create an xAI API key",
    hint: "Enter the model and API key. The address stays with xAI.",
    local: false,
    address: false,
  },
  {
    id: "ollama",
    label: "Ollama",
    defaultModel: null,
    keyUrl: null,
    keyLabel: null,
    hint: "This looks for Ollama already running on this computer. It does not install or configure Ollama.",
    local: true,
    address: false,
  },
  {
    id: "compatible",
    label: "Other provider",
    defaultModel: null,
    keyUrl: null,
    keyLabel: null,
    hint: "Enter the https address, model name, and API key that provider requires.",
    local: false,
    address: true,
  },
] as const;

export type ProviderId = (typeof assistantProviders)[number]["id"];

export function isProviderId(value: string): value is ProviderId {
  return assistantProviders.some((item) => item.id === value);
}

export function defaultModelFor(id: ProviderId): string | null {
  const found = assistantProviders.find((item) => item.id === id);
  return found?.defaultModel ?? null;
}

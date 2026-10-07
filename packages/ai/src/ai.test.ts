import assert from "node:assert/strict";
import test from "node:test";
import { actionsFromCalls, parseActions, readFacts } from "./actions.ts";
import {
  capabilities,
  type EntitlementPort,
  includedEntitlement,
} from "./entitlement.ts";
import { detectLocalModels } from "./local-models.ts";
import { assistantMessages } from "./messages.ts";
import {
  acceptedModelName,
  baseUrlAllowed,
  emptyProviderSession,
  providerSettings,
  providerView,
  resolveProvider,
  settingsFromChoice,
} from "./provider-settings.ts";
import { assistantProviders } from "./providers.ts";
import { handleAiRoutes, handleAssistantRequest } from "./request.ts";

const entitlement: EntitlementPort = includedEntitlement;

test("a create request becomes scene actions", () => {
  const plan = actionsFromCalls(
    [
      {
        name: "createRectangle",
        input: { id: "r1", width: 160, height: 100 },
      },
      {
        name: "createBox",
        input: {
          id: "b1",
          width: 120,
          height: 80,
          depth: 48,
          x: 200,
          y: 40,
        },
      },
    ],
    entitlement,
  );
  assert.equal(plan.ok, true);
  if (!plan.ok) {
    return;
  }
  assert.deepEqual(plan.actions, [
    {
      type: "createRectangle",
      id: "r1",
      x: 0,
      y: 0,
      width: 160,
      height: 100,
      rotation: 0,
    },
    {
      type: "createBox",
      id: "b1",
      x: 200,
      y: 40,
      width: 120,
      height: 80,
      depth: 48,
      rotation: 0,
    },
  ]);
});

test("an unknown or extra field rejects the whole plan", () => {
  const unknown = actionsFromCalls(
    [{ name: "deleteEverything", input: {} }],
    entitlement,
  );
  assert.deepEqual(unknown, {
    ok: false,
    message: assistantMessages.unavailable,
  });
  const extra = parseActions([
    { type: "move", id: "r1", x: 1, y: 2, scale: 2 },
  ]);
  assert.deepEqual(extra, { ok: false, message: assistantMessages.badValue });
});

test("automatic layout stays behind the entitlement port", () => {
  const denied = actionsFromCalls(
    [{ name: "arrange", input: {} }],
    entitlement,
  );
  assert.deepEqual(denied, {
    ok: false,
    message: assistantMessages.paidArrange,
  });
  const allowed = actionsFromCalls([{ name: "arrange", input: {} }], {
    allows(id) {
      return id === "ai.scene.arrange" ? "allowed" : "denied";
    },
  });
  assert.deepEqual(allowed, {
    ok: false,
    message: assistantMessages.arrangeUnavailable,
  });
  assert.equal(capabilities["ai.scene.basic"].tier, "included");
  assert.equal(capabilities["ai.scene.arrange"].tier, "paid");
});

test("more than eight actions are refused", () => {
  const calls = Array.from({ length: 9 }, (_, index) => ({
    name: "createRectangle",
    input: { id: `r${index}`, width: 1, height: 1 },
  }));
  const plan = actionsFromCalls(calls, entitlement);
  assert.deepEqual(plan, { ok: false, message: assistantMessages.tooMany });
});

test("provider settings keep the xAI key on the xAI endpoint", () => {
  const missing = providerSettings({});
  assert.deepEqual(missing, {
    ok: false,
    message: assistantMessages.needsSetup,
  });
  const ready = providerSettings({ XAI_API_KEY: "test-key-not-real" });
  assert.equal(ready.ok, true);
  if (!ready.ok) {
    return;
  }
  assert.equal(ready.settings.kind, "xai");
  assert.equal(ready.settings.baseURL, "https://api.x.ai/v1");
  assert.equal(ready.settings.model, "grok-4.7");
  const leaked = providerSettings({
    UVCP_AI_PROVIDER: "xai",
    XAI_API_KEY: "test-key-not-real",
    UVCP_AI_BASE_URL: "http://169.254.169.254/latest",
  });
  assert.equal(leaked.ok, true);
  if (leaked.ok) {
    assert.equal(leaked.settings.baseURL, "https://api.x.ai/v1");
  }
});

test("local and compatible providers accept only safe addresses", () => {
  assert.equal(baseUrlAllowed("http://127.0.0.1:11434/v1"), true);
  assert.equal(baseUrlAllowed("http://localhost:11434/v1"), true);
  assert.equal(baseUrlAllowed("https://example.invalid/v1"), true);
  assert.equal(baseUrlAllowed("http://169.254.169.254/"), false);
  assert.equal(baseUrlAllowed("http://example.invalid/v1"), false);
  assert.equal(baseUrlAllowed("https://user:secret@example.invalid/v1"), false);
  const local = providerSettings({
    UVCP_AI_PROVIDER: "ollama",
    UVCP_AI_MODEL: "qwen2.5:7b",
  });
  assert.equal(local.ok, true);
  if (local.ok) {
    assert.equal(local.settings.baseURL, "http://127.0.0.1:11434/v1");
  }
  const blocked = providerSettings({
    UVCP_AI_PROVIDER: "compatible",
    UVCP_AI_MODEL: "example-model",
    UVCP_AI_BASE_URL: "http://10.1.1.1/v1",
  });
  assert.deepEqual(blocked, {
    ok: false,
    message: assistantMessages.badBaseUrl,
  });
});

test("the assistant request refuses another origin and a bad summary", async () => {
  const refused = await handleAssistantRequest({
    method: "POST",
    url: "/api/ai",
    origin: "https://evil.example",
    host: "127.0.0.1:5173",
    contentType: "application/json",
    body: JSON.stringify({ instruction: "create a box", facts: [] }),
    run: async () => ({ ok: true, actions: [] }),
  });
  assert.equal(refused?.status, 403);
  const facts = readFacts([
    {
      id: "r1",
      kind: "rectangle",
      x: 0,
      y: 0,
      width: 160,
      height: 100,
      depth: null,
      rotation: 0,
    },
  ]);
  assert.equal(facts?.length, 1);
  const accepted = await handleAssistantRequest({
    method: "POST",
    url: "/api/ai",
    origin: "http://127.0.0.1:5173",
    host: "127.0.0.1:5173",
    contentType: "application/json",
    body: JSON.stringify({
      instruction: "move r1",
      facts,
    }),
    run: async () => ({
      ok: true,
      actions: [{ type: "move", id: "r1", x: 20, y: 30 }],
    }),
  });
  assert.equal(accepted?.status, 200);
  assert.equal(accepted?.body.ok, true);
});

test("a request outside the action set is explained and does not apply", () => {
  assert.deepEqual(actionsFromCalls([], entitlement), {
    ok: false,
    message: assistantMessages.unavailable,
  });
  const shape = actionsFromCalls(
    [{ name: "explainLimit", input: { reason: "shape" } }],
    entitlement,
  );
  assert.deepEqual(shape, {
    ok: false,
    message: assistantMessages.unsupportedShape,
  });
  const mixed = actionsFromCalls(
    [
      {
        name: "createRectangle",
        input: { id: "r1", width: 20, height: 20 },
      },
      { name: "explainLimit", input: { reason: "command" } },
    ],
    entitlement,
  );
  assert.deepEqual(mixed, {
    ok: false,
    message: assistantMessages.unsupportedCommand,
  });
  const echoed = actionsFromCalls(
    [
      {
        name: "explainLimit",
        input: { reason: "delete the private note" },
      },
    ],
    entitlement,
  );
  assert.equal(echoed.ok, false);
  if (!echoed.ok) {
    assert.equal(echoed.message, assistantMessages.unavailable);
    assert.equal(echoed.message.includes("private"), false);
  }
});

test("assistant text does not name developer variables", () => {
  const text = Object.values(assistantMessages).join("\n");
  assert.equal(text.includes("XAI_API_KEY"), false);
  assert.equal(text.includes("UVCP_AI_"), false);
});

test("an in-app choice overrides developer settings and hides the key", async () => {
  const key = "test-key-not-real";
  const session = emptyProviderSession();
  const rejected = await handleAiRoutes({
    method: "POST",
    url: "/api/ai/setup",
    origin: "http://127.0.0.1:5173",
    host: "127.0.0.1:5173",
    contentType: "application/json",
    body: JSON.stringify({
      provider: "xai",
      apiKey: key,
      baseUrl: "http://169.254.169.254/",
    }),
    session,
    env: {},
    run: async () => ({ ok: true, actions: [] }),
  });
  assert.equal(rejected?.body.ok, false);
  assert.equal(session.current, null);
  assert.equal(JSON.stringify(rejected).includes(key), false);

  const refused = await handleAiRoutes({
    method: "POST",
    url: "/api/ai/setup",
    origin: "https://evil.example",
    host: "127.0.0.1:5173",
    contentType: "application/json",
    body: JSON.stringify({ provider: "xai", apiKey: key }),
    session,
    env: {},
    run: async () => ({ ok: true, actions: [] }),
  });
  assert.equal(refused?.status, 403);
  assert.equal(session.current, null);

  const saved = await handleAiRoutes({
    method: "POST",
    url: "/api/ai/setup",
    origin: undefined,
    host: "127.0.0.1:5173",
    contentType: "application/json",
    body: JSON.stringify({ provider: "xai", apiKey: key }),
    session,
    env: { UVCP_AI_PROVIDER: "ollama", UVCP_AI_MODEL: "other:7b" },
    run: async () => ({ ok: true, actions: [] }),
  });
  assert.equal(saved?.body.ok, true);
  assert.equal(saved?.body.source, "session");
  assert.equal(saved?.body.mode, "hosted");
  assert.equal(saved?.body.provider, "xai");
  assert.equal(saved?.body.model, "grok-4.7");
  assert.equal(saved?.body.credential, true);
  assert.equal(JSON.stringify(saved).includes(key), false);
  assert.equal(JSON.stringify(saved).includes("api.x.ai"), false);
  assert.equal(JSON.stringify(saved).includes("baseURL"), false);
  assert.equal(session.current?.kind, "xai");
  if (session.current?.kind === "xai") {
    assert.equal(session.current.baseURL, "https://api.x.ai/v1");
  }

  const status = await handleAiRoutes({
    method: "GET",
    url: "/api/ai/status",
    origin: undefined,
    host: undefined,
    contentType: undefined,
    body: "",
    session,
    env: {},
    run: async () => ({ ok: true, actions: [] }),
  });
  assert.equal(status?.body.configured, true);
  assert.equal(JSON.stringify(status).includes(key), false);
  const unset = resolveProvider(null, {});
  assert.equal(unset.ok, false);
  if (!unset.ok) {
    assert.equal(unset.message, assistantMessages.needsSetup);
  }
  const fromEnv = providerView(null, { XAI_API_KEY: key });
  assert.equal(fromEnv.source, "environment");
  assert.equal(fromEnv.credential, false);
  assert.equal(JSON.stringify(fromEnv).includes(key), false);
});

test("hosted and local choices follow each provider's requirements", () => {
  const key = "test-key-not-real";
  const loopback = settingsFromChoice({
    provider: "compatible",
    model: "example-model",
    baseUrl: "http://127.0.0.1:11434/v1",
    apiKey: key,
  });
  assert.deepEqual(loopback, {
    ok: false,
    message: assistantMessages.hostedAddress,
  });
  const hosted = settingsFromChoice({
    provider: "compatible",
    model: "example-model",
    baseUrl: "https://example.invalid/v1",
    apiKey: key,
  });
  assert.equal(hosted.ok, true);
  if (hosted.ok) {
    assert.equal(hosted.settings.kind, "compatible");
    assert.equal(hosted.settings.baseURL, "https://example.invalid/v1");
  }
  const steered = settingsFromChoice({
    provider: "ollama",
    model: "qwen2.5:7b",
    baseUrl: "http://169.254.169.254/",
  });
  assert.equal(steered.ok, false);
  const local = settingsFromChoice({
    provider: "ollama",
    model: "qwen2.5:7b",
  });
  assert.equal(local.ok, true);
  if (local.ok) {
    assert.equal(local.settings.baseURL, "http://127.0.0.1:11434/v1");
    assert.equal(local.settings.apiKey, "local");
  }
});

test("local detection reads Ollama and does not follow a redirect", async () => {
  const calls: string[] = [];
  const redirected = await detectLocalModels(async (url, init) => {
    calls.push(String(url));
    assert.equal(init?.redirect, "manual");
    return new Response(null, {
      status: 302,
      headers: { location: "http://169.254.169.254/" },
    });
  });
  assert.deepEqual(calls, [
    "http://127.0.0.1:11434/api/tags",
    "http://127.0.0.1:11434/v1/models",
  ]);
  assert.deepEqual(redirected, {
    ok: false,
    message: assistantMessages.localNotRunning,
  });
  const found = await detectLocalModels(async (url) => {
    assert.equal(String(url), "http://127.0.0.1:11434/api/tags");
    return Response.json({
      models: [
        { name: "qwen2.5:7b" },
        { name: "not a model" },
        { name: "qwen2.5:7b" },
      ],
    });
  });
  assert.deepEqual(found, { ok: true, models: ["qwen2.5:7b"] });
});

test("named providers lock their address and do not reveal a key", () => {
  const key = "test-key-not-real";
  const xaiKey = "xai-key-not-real";
  const locked = {
    openai: ["https://api.openai.com/v1", "gpt-6-astra"],
    anthropic: ["https://api.anthropic.com/v1/", "claude-sonnet-5-5"],
    gemini: [
      "https://generativelanguage.googleapis.com/v1beta/openai/",
      "gemini-3.8-flash",
    ],
    openrouter: ["https://openrouter.ai/api/v1", "openrouter/auto"],
    xai: ["https://api.x.ai/v1", "grok-4.7"],
  } as const;
  assert.deepEqual(
    assistantProviders.map((item) => item.id),
    [
      "openai",
      "anthropic",
      "gemini",
      "openrouter",
      "xai",
      "ollama",
      "compatible",
    ],
  );
  for (const [provider, expected] of Object.entries(locked)) {
    const setup = settingsFromChoice({ provider, apiKey: key });
    assert.equal(setup.ok, true, provider);
    if (!setup.ok) {
      continue;
    }
    assert.equal(setup.settings.baseURL, expected[0], provider);
    assert.equal(setup.settings.model, expected[1], provider);
    const view = providerView(setup.settings, {});
    assert.equal(view.credential, true);
    assert.equal(view.provider, provider);
    assert.equal(JSON.stringify(view).includes(key), false);
    const steered = settingsFromChoice({
      provider,
      apiKey: key,
      baseUrl: "https://evil.example/v1",
    });
    assert.equal(steered.ok, false, provider);
    assert.equal(JSON.stringify(steered).includes(key), false);
    const fromEnv = providerSettings({
      UVCP_AI_PROVIDER: provider,
      UVCP_AI_API_KEY: key,
      XAI_API_KEY: xaiKey,
      UVCP_AI_BASE_URL: "http://169.254.169.254/latest",
    });
    assert.equal(fromEnv.ok, true, provider);
    if (!fromEnv.ok) {
      continue;
    }
    assert.equal(fromEnv.settings.baseURL, expected[0], provider);
    if (provider === "xai") {
      assert.equal(fromEnv.settings.apiKey, xaiKey);
    } else {
      assert.equal(fromEnv.settings.apiKey, key);
    }
  }
  const ignored = providerSettings({
    UVCP_AI_PROVIDER: "openai",
    XAI_API_KEY: xaiKey,
  });
  assert.equal(ignored.ok, false);
  assert.equal(JSON.stringify(ignored).includes(xaiKey), false);
  const catalog = JSON.stringify(assistantProviders);
  assert.equal(catalog.includes("api.openai.com"), false);
  assert.equal(catalog.includes("api.anthropic.com"), false);
  assert.equal(catalog.includes("generativelanguage.googleapis.com"), false);
  assert.equal(catalog.includes("openrouter.ai/api"), false);
  assert.equal(catalog.includes("api.x.ai"), false);
  assert.equal(catalog.includes("127.0.0.1"), false);
  assert.equal(catalog.includes("XAI_API_KEY"), false);
  assert.equal(catalog.includes("UVCP_AI_"), false);
  assert.equal(acceptedModelName("openrouter/auto"), true);
  assert.equal(acceptedModelName("openai/gpt-6-astra"), true);
  assert.equal(acceptedModelName("qwen2.5:7b"), true);
  assert.equal(acceptedModelName("/hidden"), false);
  assert.equal(acceptedModelName(".hidden"), false);
  assert.equal(acceptedModelName("a".repeat(128)), true);
  assert.equal(acceptedModelName("a".repeat(129)), false);
});

test("a saved key is reused only for the same provider", async () => {
  const xaiKey = "xai-key-not-real";
  const openaiKey = "openai-key-not-real";
  const compatKey = "compat-key-not-real";
  const session = emptyProviderSession();
  const post = (body: unknown) =>
    handleAiRoutes({
      method: "POST",
      url: "/api/ai/setup",
      origin: undefined,
      host: "127.0.0.1:5173",
      contentType: "application/json",
      body: JSON.stringify(body),
      session,
      env: { XAI_API_KEY: xaiKey, UVCP_AI_PROVIDER: "xai" },
      run: async () => ({ ok: true, actions: [] }),
    });

  const saved = await post({ provider: "xai", apiKey: xaiKey });
  assert.equal(saved?.body.credential, true);
  assert.equal(JSON.stringify(saved).includes(xaiKey), false);

  const switched = await post({ provider: "openai", apiKey: openaiKey });
  assert.equal(switched?.body.ok, true);
  assert.equal(switched?.body.provider, "openai");
  assert.equal(switched?.body.model, "gpt-6-astra");
  assert.equal(session.current?.kind, "openai");
  assert.equal(session.current?.apiKey, openaiKey);
  assert.equal(session.current?.baseURL, "https://api.openai.com/v1");
  assert.equal(JSON.stringify(switched).includes(openaiKey), false);
  assert.equal(JSON.stringify(switched).includes(xaiKey), false);

  const renamed = await post({ provider: "openai", model: "gpt-6-custom" });
  assert.equal(renamed?.body.ok, true);
  assert.equal(renamed?.body.model, "gpt-6-custom");
  assert.equal(session.current?.apiKey, openaiKey);
  assert.equal(JSON.stringify(renamed).includes(openaiKey), false);

  const blocked = await post({ provider: "anthropic" });
  assert.equal(blocked?.body.ok, false);
  assert.equal(blocked?.body.message, assistantMessages.needKey);
  assert.equal(session.current?.kind, "openai");
  assert.equal(session.current?.apiKey, openaiKey);
  assert.equal(JSON.stringify(blocked).includes(openaiKey), false);

  const compatible = await post({
    provider: "compatible",
    model: "example-model",
    baseUrl: "https://example.invalid/v1",
    apiKey: compatKey,
  });
  assert.equal(compatible?.body.ok, true);
  assert.equal(session.current?.baseURL, "https://example.invalid/v1");
  assert.equal(JSON.stringify(compatible).includes(compatKey), false);
  assert.equal(JSON.stringify(compatible).includes("example.invalid"), false);

  const moved = await post({
    provider: "compatible",
    model: "example-model",
    baseUrl: "https://other.example/v1",
  });
  assert.equal(moved?.body.ok, false);
  assert.equal(moved?.body.message, assistantMessages.needKey);
  assert.equal(session.current?.baseURL, "https://example.invalid/v1");
  assert.equal(session.current?.apiKey, compatKey);
  assert.equal(JSON.stringify(moved).includes(compatKey), false);

  const kept = await post({
    provider: "compatible",
    model: "example-model-2",
  });
  assert.equal(kept?.body.ok, true);
  assert.equal(kept?.body.model, "example-model-2");
  assert.equal(session.current?.apiKey, compatKey);
  assert.equal(session.current?.baseURL, "https://example.invalid/v1");
  assert.equal(JSON.stringify(kept).includes(compatKey), false);

  const local = await post({ provider: "ollama", model: "qwen2.5:7b" });
  assert.equal(local?.body.ok, true);
  assert.equal(local?.body.provider, "ollama");
  assert.equal(local?.body.mode, "local");
  assert.equal(local?.body.credential, false);
  assert.equal(session.current?.apiKey, "local");
  assert.equal(session.current?.baseURL, "http://127.0.0.1:11434/v1");
  assert.equal(JSON.stringify(local).includes(compatKey), false);
  assert.equal(JSON.stringify(local).includes("127.0.0.1"), false);
});

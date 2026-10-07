import assert from "node:assert/strict";
import test from "node:test";
import { actionsFromCalls, parseActions, readFacts } from "./actions.ts";
import {
  capabilities,
  type EntitlementPort,
  includedEntitlement,
} from "./entitlement.ts";
import { assistantMessages } from "./messages.ts";
import { baseUrlAllowed, providerSettings } from "./provider-settings.ts";
import { handleAssistantRequest } from "./request.ts";

const entitlement: EntitlementPort = includedEntitlement;

test("a create request becomes scene actions", () => {
  const plan = actionsFromCalls(
    [
      {
        name: "createRectangle",
        input: { id: "r1", width: 2, height: 1 },
      },
      {
        name: "createBox",
        input: {
          id: "b1",
          width: 1,
          height: 1,
          depth: 1,
          position: [4, 0, 0],
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
      width: 2,
      height: 1,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
    {
      type: "createBox",
      id: "b1",
      width: 1,
      height: 1,
      depth: 1,
      position: [4, 0, 0],
      rotation: [0, 0, 0],
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
    { type: "move", id: "r1", position: [1, 2, 3], scale: [2, 2, 2] },
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
    message: assistantMessages.missingXaiKey,
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
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      width: 1,
      height: 1,
      depth: null,
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
      actions: [{ type: "move", id: "r1", position: [1, 0, 0] }],
    }),
  });
  assert.equal(accepted?.status, 200);
  assert.equal(accepted?.body.ok, true);
});

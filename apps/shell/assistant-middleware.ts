import type { IncomingMessage, ServerResponse } from "node:http";
import { assistantMessages } from "@uvcp/ai";
import {
  emptyProviderSession,
  modelFor,
  type ProviderSession,
  resolveProvider,
} from "@uvcp/ai/provider";
import { handleAiRoutes } from "@uvcp/ai/request";
import type { Plugin } from "vite";

// Credentials stay in this loopback process for the session. The browser
// receives the provider and model names, not the key, and nothing is written
// into the scene or the static build.
export function assistantApi(): Plugin {
  const session = emptyProviderSession();
  return {
    name: "uvcp-assistant-api",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        void dispatch(session, request, response, next);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((request, response, next) => {
        void dispatch(session, request, response, next);
      });
    },
  };
}

async function dispatch(
  session: ProviderSession,
  request: IncomingMessage,
  response: ServerResponse,
  next: () => void,
): Promise<void> {
  const url = request.url ?? "";
  const path = url.split("?", 1)[0] ?? "";
  if (path !== "/api/ai" && !path.startsWith("/api/ai/")) {
    next();
    return;
  }
  const body = await readBody(request);
  if (body === null) {
    write(response, 413, {
      ok: false,
      message: assistantMessages.tooLarge,
    });
    return;
  }
  try {
    await respond(session, request, response, body);
  } catch {
    write(response, 200, {
      ok: false,
      message: assistantMessages.providerDown,
    });
  }
}

async function respond(
  session: ProviderSession,
  request: IncomingMessage,
  response: ServerResponse,
  body: string,
): Promise<void> {
  const result = await handleAiRoutes({
    method: request.method ?? "GET",
    url: request.url ?? "",
    origin: header(request, "origin"),
    host: header(request, "host"),
    contentType: header(request, "content-type"),
    body,
    session,
    env: process.env,
    run: async (input) => {
      const setup = resolveProvider(session.current, process.env);
      if (!setup.ok) {
        return { ok: false, message: setup.message };
      }
      return modelFor(setup).propose(input);
    },
  });
  if (result === null) {
    write(response, 400, {
      ok: false,
      message: assistantMessages.badRequest,
    });
    return;
  }
  write(response, result.status, result.body);
}

async function readBody(request: IncomingMessage): Promise<string | null> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > 32768) {
      return null;
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function header(request: IncomingMessage, name: string): string | undefined {
  const value = request.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function write(response: ServerResponse, status: number, body: object): void {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(JSON.stringify(body));
}

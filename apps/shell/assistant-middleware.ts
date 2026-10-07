import type { IncomingMessage, ServerResponse } from "node:http";
import { assistantMessages } from "@uvcp/ai";
import { sceneModel } from "@uvcp/ai/provider";
import { handleAssistantRequest } from "@uvcp/ai/request";
import type { Plugin } from "vite";

// The model call stays in the loopback process. The browser never receives
// the provider key, and the static file build does not contain one.
export function assistantApi(): Plugin {
  return {
    name: "uvcp-assistant-api",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        void dispatch(request, response, next);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((request, response, next) => {
        void dispatch(request, response, next);
      });
    },
  };
}

async function dispatch(
  request: IncomingMessage,
  response: ServerResponse,
  next: () => void,
): Promise<void> {
  const url = request.url ?? "";
  if ((url.split("?", 1)[0] ?? "") !== "/api/ai") {
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
    await respond(request, response, body);
  } catch {
    write(response, 200, {
      ok: false,
      message: assistantMessages.providerDown,
    });
  }
}

async function respond(
  request: IncomingMessage,
  response: ServerResponse,
  body: string,
): Promise<void> {
  const result = await handleAssistantRequest({
    method: request.method ?? "GET",
    url: request.url ?? "",
    origin: header(request, "origin"),
    host: header(request, "host"),
    contentType: header(request, "content-type"),
    body,
    run: async (input) => {
      const setup = sceneModel(process.env);
      if (!setup.ok) {
        return { ok: false, message: setup.message };
      }
      return setup.model.propose(input);
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

function write(
  response: ServerResponse,
  status: number,
  body: {
    readonly ok: boolean;
    readonly message?: string;
    readonly actions?: unknown;
  },
): void {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(JSON.stringify(body));
}

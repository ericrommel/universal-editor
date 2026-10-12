import fs, { createReadStream } from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { productionPolicy } from "../apps/shell/content-security-policy.mjs";

const TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".json", "application/json"],
  [".map", "application/json"],
  [".txt", "text/plain; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".woff2", "font/woff2"],
  [".glb", "model/gltf-binary"],
]);

export function securityHeaders(extension) {
  return {
    "Content-Security-Policy": productionPolicy,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    // HTML and the stable-named sample glb are not fingerprinted. A
    // year-long immutable cache would keep a replaced sample.
    "Cache-Control":
      extension === ".html" || extension === ".glb"
        ? "no-cache"
        : "public, max-age=31536000, immutable",
  };
}

// Returns a file inside root, or null. Rejects traversal, a missing file,
// a symlink that leaves root, and an extension this server will not serve.
export function resolveStaticFile(rootDir, requestPath) {
  let pathname = requestPath;
  try {
    pathname = decodeURIComponent(requestPath.split("?", 1)[0] ?? "");
  } catch {
    return null;
  }
  if (pathname.includes("\0")) {
    return null;
  }
  if (pathname === "" || pathname === "/") {
    pathname = "/index.html";
  } else if (pathname.endsWith("/")) {
    pathname += "index.html";
  }
  const segments = pathname.split("/");
  if (segments.includes("..") || segments.includes(".")) {
    return null;
  }
  const root = fs.realpathSync(rootDir);
  const relative = pathname.replace(/^\/+/, "");
  const candidate = path.resolve(root, relative);
  const fromRoot = path.relative(root, candidate);
  if (fromRoot.startsWith("..") || path.isAbsolute(fromRoot)) {
    return null;
  }
  if (!fs.existsSync(candidate)) {
    return null;
  }
  const stat = fs.statSync(candidate);
  if (!stat.isFile()) {
    return null;
  }
  const real = fs.realpathSync(candidate);
  const realFromRoot = path.relative(root, real);
  if (realFromRoot.startsWith("..") || path.isAbsolute(realFromRoot)) {
    return null;
  }
  const extension = path.extname(real).toLowerCase();
  const type = TYPES.get(extension);
  if (type === undefined) {
    return null;
  }
  return { file: real, type, extension };
}

export function createStaticServer(rootDir) {
  const root = path.resolve(rootDir);
  return http.createServer((request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      writeText(response, 405, "Method not allowed.");
      return;
    }
    const resolved = resolveStaticFile(root, request.url ?? "/");
    if (resolved === null) {
      writeText(response, 404, "Not found.");
      return;
    }
    const headers = {
      ...securityHeaders(resolved.extension),
      "Content-Type": resolved.type,
    };
    if (request.method === "HEAD") {
      response.writeHead(200, headers);
      response.end();
      return;
    }
    const stream = createReadStream(resolved.file);
    stream.on("error", () => {
      if (!response.headersSent) {
        writeText(response, 500, "The file could not be read.");
        return;
      }
      response.destroy();
    });
    response.writeHead(200, headers);
    stream.pipe(response);
  });
}

function writeText(response, status, text) {
  response.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Security-Policy": productionPolicy,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store",
  });
  response.end(text);
}

function listenPort(value) {
  if (value === undefined || value === "") {
    return 4173;
  }
  if (!/^\d+$/.test(value)) {
    throw new Error("UVCP_STATIC_PORT must be an integer from 0 to 65535.");
  }
  const port = Number(value);
  if (port > 65535) {
    throw new Error("UVCP_STATIC_PORT must be an integer from 0 to 65535.");
  }
  return port;
}

const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  const dist = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../apps/shell/dist",
  );
  if (!fs.existsSync(path.join(dist, "index.html"))) {
    console.error("Build the shell before serving it: pnpm build");
    process.exit(1);
  }
  // Loopback unless a host is set. This process serves built files only
  // and has no assistant session, unlike the Vite dev and preview servers.
  const host = process.env.UVCP_STATIC_HOST || "127.0.0.1";
  let port = 4173;
  try {
    port = listenPort(process.env.UVCP_STATIC_PORT);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Bad port.");
    process.exit(1);
  }
  const server = createStaticServer(dist);
  server.listen(port, host, () => {
    const address = server.address();
    const bound =
      typeof address === "object" && address !== null ? address.port : port;
    console.log(`Serving http://${host}:${bound}/`);
  });
}

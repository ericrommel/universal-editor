import { createReadStream } from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import { assistantApi } from "./assistant-middleware.ts";

const productionPolicy =
  "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'";

// Vite's dev client inserts CSS by creating a style element. The shell
// policy has no unsafe-inline, so development serves the same files as
// stylesheets. The production build already emits linked CSS and does
// not use this path.
function cspStyles(): Plugin {
  const files = new Map<string, string>();
  let workspaceRoot = "";
  return {
    name: "uvcp-csp-styles",
    apply: "serve",
    enforce: "post",
    configResolved(config) {
      workspaceRoot = path.resolve(config.root, "../..");
    },
    transform(code, id) {
      const file = path.resolve(id.split("?", 1)[0] ?? id);
      if (
        path.extname(file) !== ".css" ||
        !code.includes("__vite__updateStyle")
      ) {
        return null;
      }
      const relative = path.relative(workspaceRoot, file);
      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        return null;
      }
      let token = "";
      for (const [knownToken, knownFile] of files) {
        if (knownFile === file) {
          token = knownToken;
          break;
        }
      }
      if (token === "") {
        token = String(files.size + 1);
        files.set(token, file);
      }
      return {
        code: [
          "const link = document.createElement('link');",
          "link.rel = 'stylesheet';",
          `link.href = ${JSON.stringify(`/@uvcp-css/${token}`)};`,
          "document.head.appendChild(link);",
        ].join("\n"),
        map: null,
      };
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const raw = req.url ?? "";
        const pathOnly = raw.split("?", 1)[0] ?? "";
        const prefix = "/@uvcp-css/";
        if (!pathOnly.startsWith(prefix)) {
          next();
          return;
        }
        const file = files.get(pathOnly.slice(prefix.length));
        if (file === undefined) {
          res.statusCode = 404;
          res.end();
          return;
        }
        res.setHeader("Content-Type", "text/css; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        createReadStream(file).pipe(res);
      });
    },
  };
}

declare const process: {
  readonly env: {
    readonly UVCP_FORCE_INIT_FAILURE?: string;
  };
};

export default defineConfig(({ command, isPreview }) => {
  // Preview uses command "serve" as well. Only the dev server may read this.
  const devFailure =
    command === "serve" && !isPreview
      ? (process.env.UVCP_FORCE_INIT_FAILURE ?? "")
      : "";
  return {
    base: "./",
    plugins: [cspStyles(), assistantApi()],
    // Vite compiles the JSX. The React refresh plugin injects an inline
    // preamble, and this policy does not allow unsafe-inline.
    esbuild: {
      jsx: "automatic",
    },
    define: {
      __UVCP_DEV_FAILURE__: JSON.stringify(devFailure),
    },
    server: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true,
      headers: {
        // Same-origin WebSocket is the only development exception.
        "Content-Security-Policy": `${productionPolicy}; connect-src 'self'`,
      },
    },
    preview: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true,
      headers: {
        "Content-Security-Policy": productionPolicy,
      },
    },
  };
});

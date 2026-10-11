import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { productionPolicy } from "../apps/shell/content-security-policy.mjs";
import { runFirstUse } from "./browser/first-use.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distIndex = path.join(root, "apps", "shell", "dist", "index.html");

if (!fs.existsSync(distIndex)) {
  console.error("Build the shell before the browser check: pnpm build");
  process.exit(1);
}

const server = spawn(
  process.execPath,
  [path.join(root, "scripts", "serve-static.mjs")],
  {
    cwd: root,
    env: {
      ...process.env,
      UVCP_STATIC_HOST: "127.0.0.1",
      UVCP_STATIC_PORT: "0",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);

let stderr = "";
server.stderr.setEncoding("utf8");
server.stderr.on("data", (chunk) => {
  stderr += chunk;
});

function stopServer() {
  if (server.exitCode === null && !server.killed) {
    server.kill();
  }
}

try {
  const origin = await waitForOrigin(server, 20_000);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
    });
    page.setDefaultTimeout(15_000);
    await runFirstUse(page, origin, productionPolicy, root);
  } finally {
    await browser.close();
  }
} catch (error) {
  if (error instanceof Error) {
    console.error(error.stack ?? error.message);
  } else {
    console.error("Browser check failed.");
  }
  if (stderr.trim() !== "") {
    console.error(stderr.trim());
  }
  process.exitCode = 1;
} finally {
  stopServer();
}

function waitForOrigin(child, timeoutMs) {
  return new Promise((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => {
      reject(new Error("The static server did not report a URL."));
    }, timeoutMs);
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      output += chunk;
      const match = /Serving (http:\/\/127\.0\.0\.1:\d+\/)/.exec(output);
      if (match?.[1] !== undefined) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`The static server exited (${code ?? "unknown"}).`));
    });
  });
}

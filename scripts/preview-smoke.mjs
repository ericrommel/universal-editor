import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const previewUrl = "http://127.0.0.1:5173/";
const readyTimeoutMs = 60_000;

// The production preview header. Development adds connect-src, and this
// check rejects that so a dev server cannot satisfy the smoke.
export const productionPolicy =
  "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'";

export function previewAccepted(statusCode, contentSecurityPolicy) {
  return statusCode === 200 && contentSecurityPolicy === productionPolicy;
}

function isDirectRun() {
  const entry = process.argv[1];
  if (entry === undefined) {
    return false;
  }
  const launched = path.resolve(entry);
  const self = fileURLToPath(import.meta.url);
  if (process.platform === "win32") {
    return launched.toLowerCase() === self.toLowerCase();
  }
  return launched === self;
}

function headerValue(headers) {
  const value = headers["content-security-policy"];
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  return value;
}

function requestOnce() {
  return new Promise((resolve, reject) => {
    const request = http.get(previewUrl, { timeout: 2_000 }, (response) => {
      response.resume();
      resolve({
        statusCode: response.statusCode ?? 0,
        contentSecurityPolicy: headerValue(response.headers),
      });
    });
    request.on("timeout", () => {
      request.destroy();
      reject(new Error("timed out"));
    });
    request.on("error", reject);
  });
}

function startPreview() {
  const options = {
    cwd: root,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  };
  if (process.platform === "win32") {
    return spawn(
      process.env.ComSpec ?? "cmd.exe",
      ["/d", "/s", "/c", "pnpm --filter @uvcp/shell preview"],
      options,
    );
  }
  return spawn("pnpm", ["--filter", "@uvcp/shell", "preview"], {
    ...options,
    detached: true,
  });
}

function watchOutput(child) {
  let output = "";
  const append = (chunk) => {
    process.stdout.write(chunk);
    if (output.length < 100_000) {
      output += chunk.toString();
    }
  };
  child.stdout?.on("data", append);
  child.stderr?.on("data", append);
  return () => output;
}

function stopPreview(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }
  if (process.platform === "win32") {
    // cmd.exe is the spawned process. /t stops pnpm and Vite with it.
    spawnSync("taskkill.exe", ["/pid", String(child.pid), "/t", "/f"], {
      windowsHide: true,
      stdio: "ignore",
    });
    return;
  }
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
}

function waitForExit(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (process.platform !== "win32") {
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch {
          child.kill("SIGKILL");
        }
      }
      resolve();
    }, 5_000);
    child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function smoke() {
  const indexPath = path.join(root, "apps", "shell", "dist", "index.html");
  if (!fs.existsSync(indexPath)) {
    console.error("Preview smoke failed. The shell build output is absent.");
    return 1;
  }
  const child = startPreview();
  const output = watchOutput(child);
  let exitStatus = null;
  child.on("exit", (code) => {
    exitStatus = code ?? 1;
  });
  child.on("error", () => {
    exitStatus = 1;
  });
  const deadline = Date.now() + readyTimeoutMs;
  let status = 1;
  try {
    while (Date.now() < deadline) {
      if (exitStatus !== null) {
        console.error(
          "Preview smoke failed. The preview server exited before it was ready.",
        );
        return exitStatus === 0 ? 1 : exitStatus;
      }
      const text = output();
      // "Local:" is the ready line. An address-in-use error can name the
      // same host and port before the process exits.
      if (!text.includes("Local:") || !text.includes("127.0.0.1:5173")) {
        await delay(200);
        continue;
      }
      try {
        const response = await requestOnce();
        if (exitStatus !== null) {
          console.error(
            "Preview smoke failed. The preview server exited before it was ready.",
          );
          return 1;
        }
        if (
          previewAccepted(response.statusCode, response.contentSecurityPolicy)
        ) {
          console.log(`preview smoke: HTTP 200 ${previewUrl}`);
          status = 0;
          return status;
        }
        console.error(
          `Preview smoke failed. Status ${response.statusCode}. Content-Security-Policy: ${response.contentSecurityPolicy ?? "absent"}.`,
        );
        return 1;
      } catch {
        await delay(200);
      }
    }
    console.error(
      "Preview smoke failed. Timed out waiting for the loopback preview server.",
    );
    return 1;
  } finally {
    stopPreview(child);
    await waitForExit(child);
  }
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

if (isDirectRun()) {
  const status = await smoke();
  process.exit(status);
}

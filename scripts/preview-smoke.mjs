import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { strings } from "../packages/ui/src/strings.ts";
import { tokens } from "../packages/ui/src/tokens.ts";

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

// Vite colors the ready line when CI forces color, which splits "Local:"
// and "127.0.0.1:5173" with escape sequences. ESC is built here so the
// pattern is not a regex literal containing a control character.
const ansiPattern = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

export function previewReady(text) {
  ansiPattern.lastIndex = 0;
  const plain = text.replace(ansiPattern, "");
  return plain.includes("Local:") && plain.includes("127.0.0.1:5173");
}

const FAILURE_SWITCH = [
  "UVCP_FORCE_INIT_FAILURE",
  "forced-initialization-failure",
  "INVALID_INITIALIZATION_VALUE",
];

const CANVAS_ELEMENT = /<canvas(?:\s|>|\/)/i;

const REQUIRED_COPY = [
  strings.productName,
  strings.purpose,
  strings.statusLabel,
  strings.statusStarting,
  strings.statusReady,
  strings.statusNotReady,
  strings.detailStarting,
  strings.detailReady,
  strings.detailNotReady,
  strings.showDetails,
  strings.hideDetails,
  strings.diagnosticEmpty,
  strings.webDocumentTitle,
];

// The smoke serves these bytes. Callers compare the HTTP body to them.
export function readProductionBuild(distDir) {
  const problems = [];
  const empty = { problems, indexHtml: "", assets: [] };
  if (!fs.existsSync(distDir)) {
    problems.push("build directory is absent");
    return empty;
  }
  const indexPath = path.join(distDir, "index.html");
  if (!fs.existsSync(indexPath) || !fs.statSync(indexPath).isFile()) {
    problems.push("index.html is absent");
    return empty;
  }
  const indexHtml = fs.readFileSync(indexPath, "utf8");
  if (!indexHtml.includes(`<title>${strings.webDocumentTitle}</title>`)) {
    problems.push("index.html title is not the foundation document title");
  }
  if (!indexHtml.includes('id="root"')) {
    problems.push('index.html has no root element id "root"');
  }
  const scripts = sources(indexHtml, /<script\b[^>]*\ssrc="([^"]+)"/gi);
  const styles = sources(indexHtml, /<link\b[^>]*\shref="([^"]+\.css)"/gi);
  if (scripts.length !== 1) {
    problems.push(`index.html has ${scripts.length} module scripts`);
  }
  if (styles.length !== 1) {
    problems.push(`index.html has ${styles.length} stylesheets`);
  }
  const assets = [];
  if (scripts.length === 1) {
    const script = readAsset(distDir, scripts[0], "module script");
    if (script.problem) {
      problems.push(script.problem);
    } else {
      assets.push(script.asset);
      for (const copy of REQUIRED_COPY) {
        if (!script.asset.text.includes(copy)) {
          problems.push(`built script is missing foundation copy: ${copy}`);
        }
      }
    }
  }
  if (styles.length === 1) {
    const style = readAsset(distDir, styles[0], "stylesheet");
    if (style.problem) {
      problems.push(style.problem);
    } else {
      assets.push(style.asset);
      const css = style.asset.text;
      for (const hex of paletteHexes()) {
        if (!css.toLowerCase().includes(hex.toLowerCase())) {
          problems.push(`built stylesheet is missing palette value ${hex}`);
        }
      }
      for (const marker of [
        "CanvasText",
        "Highlight",
        "36rem",
        "user-select:text",
        "--uvcp-canvas",
      ]) {
        if (!css.includes(marker)) {
          problems.push(`built stylesheet is missing ${marker}`);
        }
      }
    }
  }
  for (const file of walkFiles(distDir)) {
    const text = fs.readFileSync(file, "utf8");
    const relative = path.relative(distDir, file);
    for (const token of FAILURE_SWITCH) {
      if (text.includes(token)) {
        problems.push(`${relative} contains ${token}`);
      }
    }
    if (CANVAS_ELEMENT.test(text)) {
      problems.push(`${relative} contains a canvas element`);
    }
    if (
      !file.endsWith(".map") &&
      (text.includes("node:fs") ||
        text.includes("node:path") ||
        text.includes("__vite-browser-external"))
    ) {
      problems.push(`${relative} references a Node file module`);
    }
  }
  return { problems, indexHtml, assets };
}

function sources(html, pattern) {
  return [...html.matchAll(pattern)].map((match) => match[1]);
}

function readAsset(distDir, urlPath, label) {
  if (!urlPath.startsWith("./")) {
    return { problem: `${label} is not a relative build path: ${urlPath}` };
  }
  const file = path.resolve(distDir, urlPath);
  const relative = path.relative(distDir, file);
  if (
    relative === "" ||
    relative.startsWith("..") ||
    path.isAbsolute(relative)
  ) {
    return { problem: `${label} resolves outside the build: ${urlPath}` };
  }
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    return { problem: `${label} is missing: ${urlPath}` };
  }
  return {
    asset: {
      urlPath,
      text: fs.readFileSync(file, "utf8"),
    },
  };
}

function paletteHexes() {
  const values = [];
  for (const palette of [tokens.color.light, tokens.color.dark]) {
    values.push(
      palette.canvas,
      palette.surface,
      palette.text.primary,
      palette.text.secondary,
      palette.border,
      palette.focus,
      palette.status.ready,
      palette.status.failed,
    );
  }
  return values;
}

function walkFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(full));
      continue;
    }
    if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
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

function requestOnce(url) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (settle) => {
      if (settled) {
        return;
      }
      settled = true;
      settle();
    };
    const request = http.get(url, { timeout: 2_000 }, (response) => {
      const chunks = [];
      let size = 0;
      let tooLarge = false;
      response.on("data", (chunk) => {
        size += chunk.length;
        if (size > 2_000_000) {
          tooLarge = true;
          response.destroy();
        } else {
          chunks.push(chunk);
        }
      });
      response.on("end", () => {
        if (tooLarge) {
          finish(() => {
            reject(new Error("response exceeded 2 MB"));
          });
          return;
        }
        finish(() => {
          resolve({
            statusCode: response.statusCode ?? 0,
            contentSecurityPolicy: headerValue(response.headers),
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      });
      response.on("error", (error) => {
        finish(() => {
          reject(error);
        });
      });
    });
    request.on("timeout", () => {
      request.destroy();
      finish(() => {
        reject(new Error("timed out"));
      });
    });
    request.on("error", (error) => {
      finish(() => {
        reject(error);
      });
    });
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
  const build = readProductionBuild(path.join(root, "apps", "shell", "dist"));
  if (build.problems.length > 0) {
    for (const problem of build.problems) {
      console.error(`Preview smoke failed. ${problem}`);
    }
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
      // "Local:" is the ready line. An address-in-use error can name the
      // same host and port before the process exits.
      if (!previewReady(output())) {
        await delay(200);
        continue;
      }
      try {
        const response = await requestOnce(previewUrl);
        if (exitStatus !== null) {
          console.error(
            "Preview smoke failed. The preview server exited before it was ready.",
          );
          return 1;
        }
        if (
          previewAccepted(response.statusCode, response.contentSecurityPolicy)
        ) {
          if (response.body !== build.indexHtml) {
            console.error(
              "Preview smoke failed. The served document is not the built index.html.",
            );
            return 1;
          }
          for (const asset of build.assets) {
            const assetUrl = new URL(asset.urlPath, previewUrl);
            const served = await requestOnce(assetUrl);
            if (served.statusCode !== 200 || served.body !== asset.text) {
              console.error(
                `Preview smoke failed. Served ${asset.urlPath} did not match the build.`,
              );
              return 1;
            }
          }
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

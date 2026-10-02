import { spawnSync } from "node:child_process";
import fs from "node:fs";

const requiredNode = `v${fs.readFileSync(new URL("../.node-version", import.meta.url), "utf8").trim()}`;
if (process.version !== requiredNode) {
  console.error(
    `Node ${requiredNode} is required. This process is ${process.version}.`,
  );
  process.exit(1);
}

// The production build and the preview smoke wait until the shell exists.
// WP-5 adds those steps. Omitting them here is not a passing substitute.

const steps = [
  ["node", ["scripts/check-boundaries.mjs"]],
  ["pnpm", ["exec", "tsc", "-b"]],
  ["pnpm", ["exec", "biome", "check", "."]],
  ["node", ["scripts/check-licenses.mjs"]],
  ["pnpm", ["audit", "--audit-level=high"]],
  ["pnpm", ["test"]],
];

for (const [command, args] of steps) {
  const result = run(command, args);
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  const status = result.status ?? 1;
  if (status !== 0) {
    process.exit(status);
  }
}

function run(command, args) {
  if (process.platform === "win32" && command === "pnpm") {
    // pnpm.cmd cannot be spawned directly. cmd.exe /c avoids Node's
    // shell:true argument concatenation (DEP0190). The tokens are fixed.
    const line = [command, ...args].map(quoteCmdArg).join(" ");
    return spawnSync(
      process.env.ComSpec ?? "cmd.exe",
      ["/d", "/s", "/c", line],
      {
        stdio: "inherit",
        windowsHide: true,
      },
    );
  }
  return spawnSync(command, args, {
    stdio: "inherit",
    windowsHide: true,
  });
}

function quoteCmdArg(value) {
  if (/[\s"&|<>^%]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

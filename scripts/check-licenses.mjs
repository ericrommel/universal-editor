import fs from "node:fs";
import path from "node:path";
import { ALLOWED } from "./boundaries.mjs";
import { expressionAllowed, licenseText } from "./license-expression.mjs";

const workspacePackages = new Set(Object.keys(ALLOWED));

const root = process.cwd();
const store = path.join(root, "node_modules", ".pnpm");
if (!fs.existsSync(store)) {
  console.error(
    "node_modules/.pnpm is missing. Run pnpm install before the license check.",
  );
  process.exit(1);
}

const failures = [];
let checked = 0;
for (const manifestPath of installedManifests(store)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (typeof manifest.name !== "string" || manifest.name === "") {
    failures.push(`${manifestPath}: missing package name`);
    continue;
  }
  if (workspacePackages.has(manifest.name)) {
    continue;
  }
  checked += 1;
  const expression = licenseText(manifest);
  if (!expressionAllowed(expression)) {
    failures.push(
      `${manifest.name}@${manifest.version ?? "unknown"}: ${expression || "missing license"}`,
    );
  }
}

if (checked === 0) {
  failures.push("No third-party packages were found in node_modules/.pnpm.");
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(failure);
  }
  process.exit(1);
}

function installedManifests(pnpmDir) {
  const manifests = [];
  for (const entry of fs.readdirSync(pnpmDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const modules = path.join(pnpmDir, entry.name, "node_modules");
    if (!fs.existsSync(modules)) {
      continue;
    }
    collect(modules, manifests, 0);
  }
  return manifests;
}

function collect(directory, manifests, depth) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    const stat = fs.statSync(full);
    if (!stat.isDirectory() || entry.name === ".bin") {
      continue;
    }
    const manifestPath = path.join(full, "package.json");
    if (fs.existsSync(manifestPath)) {
      manifests.push(manifestPath);
      continue;
    }
    if (entry.name.startsWith("@") && depth === 0) {
      collect(full, manifests, depth + 1);
    }
  }
}

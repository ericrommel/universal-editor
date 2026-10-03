import fs from "node:fs";
import path from "node:path";
import {
  ALLOWED,
  boundaryViolation,
  exoticDependency,
  NO_DOM_LIB,
  scanSource,
} from "./boundaries.mjs";

const root = process.cwd();
const sourceExtensions = new Set([
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".mjs",
  ".cjs",
  ".jsx",
]);
const dependencyFields = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];
const violations = [];

for (const packageDir of packageDirs(root)) {
  const manifestPath = path.join(packageDir, "package.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const fromPackage = manifest.name;
  if (!Object.hasOwn(ALLOWED, fromPackage)) {
    violations.push(
      `${manifestPath}: ${fromPackage} is not in the import table`,
    );
    continue;
  }
  for (const field of dependencyFields) {
    const entries = manifest[field] ?? {};
    for (const [name, value] of Object.entries(entries)) {
      if (exoticDependency(value)) {
        violations.push(
          `${manifestPath}: ${field} ${name} uses a non-registry specifier`,
        );
      }
      const violation = boundaryViolation(fromPackage, name);
      if (violation) {
        violations.push(`${manifestPath}: ${violation}`);
      }
    }
  }
  const tsconfigPath = path.join(packageDir, "tsconfig.json");
  if (NO_DOM_LIB.has(fromPackage) && fs.existsSync(tsconfigPath)) {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"));
    const lib = tsconfig.compilerOptions?.lib ?? [];
    if (lib.some((item) => String(item).toLowerCase().startsWith("dom"))) {
      violations.push(
        `${path.relative(root, tsconfigPath)}: ${fromPackage} must not enable the DOM lib`,
      );
    }
  }
  for (const file of sourceFiles(packageDir)) {
    const source = fs.readFileSync(file, "utf8");
    const extension = path.extname(file);
    const scanned = scanSource(source, {
      jsx: extension === ".tsx" || extension === ".jsx",
    });
    if (scanned.failure) {
      violations.push(`${path.relative(root, file)}: ${scanned.failure}`);
      continue;
    }
    for (const specifier of scanned.specifiers) {
      if (specifier.startsWith(".")) {
        if (!staysInside(packageDir, file, specifier)) {
          violations.push(
            `${path.relative(root, file)}: import leaves ${fromPackage}`,
          );
        }
        continue;
      }
      const violation = boundaryViolation(fromPackage, specifier);
      if (violation) {
        violations.push(`${path.relative(root, file)}: ${violation}`);
      }
    }
  }
}

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(violation);
  }
  process.exit(1);
}

function packageDirs(workspace) {
  const dirs = [];
  for (const parent of ["packages", "apps"]) {
    const absolute = path.join(workspace, parent);
    if (!fs.existsSync(absolute)) {
      continue;
    }
    for (const name of fs.readdirSync(absolute)) {
      const dir = path.join(absolute, name);
      if (fs.existsSync(path.join(dir, "package.json"))) {
        dirs.push(dir);
      }
    }
  }
  return dirs;
}

function sourceFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist") {
      continue;
    }
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...sourceFiles(full));
      continue;
    }
    if (sourceExtensions.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

function staysInside(packageDir, file, specifier) {
  const resolved = path.resolve(path.dirname(file), specifier);
  const relative = path.relative(packageDir, resolved);
  return (
    relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative)
  );
}

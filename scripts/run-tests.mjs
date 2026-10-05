import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findTestFiles } from "./test-files.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { found, rejected } = findTestFiles(root);

if (rejected.length > 0) {
  console.error(
    "pnpm test does not run these files. Name tests .test.ts or .test.mjs, or delete them.",
  );
  for (const file of rejected) {
    console.error(path.relative(root, file));
  }
  process.exit(1);
}

if (found.length === 0) {
  console.error("pnpm test found no test files.");
  process.exit(1);
}

const result = spawnSync(process.execPath, ["--test", ...found], {
  cwd: root,
  stdio: "inherit",
  windowsHide: true,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { findTestFiles } from "./test-files.mjs";

const SKIP = new Set(["node_modules", "dist", "ts-out", "build", ".git"]);

test("pnpm test discovers every test file and rejects a suffix it cannot run", () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const { found, rejected } = findTestFiles(root);
  const oracleFound = [];
  const oracleRejected = [];
  walk(root, oracleFound, oracleRejected);
  oracleFound.sort();
  oracleRejected.sort();
  assert.deepEqual(found, oracleFound);
  assert.deepEqual(rejected, oracleRejected);
  assert.deepEqual(rejected, []);
  assert.ok(
    found.some((file) =>
      file.endsWith(path.join("packages", "core", "src", "core.test.ts")),
    ),
  );
  assert.ok(found.some((file) => file.endsWith("preview-smoke.test.mjs")));
  assert.equal(
    found.some((file) => file.includes(`${path.sep}node_modules${path.sep}`)),
    false,
  );
});

function walk(directory, found, rejected) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) {
      continue;
    }
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(full, found, rejected);
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    if (/\.test\.(ts|mjs)$/.test(entry.name)) {
      found.push(full);
      continue;
    }
    if (/\.test\./.test(entry.name) || /\.spec\./.test(entry.name)) {
      rejected.push(full);
    }
  }
}

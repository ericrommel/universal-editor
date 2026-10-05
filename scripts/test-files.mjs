import fs from "node:fs";
import path from "node:path";

const SKIP = new Set(["node_modules", "dist", "ts-out", "build", ".git"]);

// Every Module 0 test is one of these two suffixes. Another test suffix is
// reported instead of skipped, because node --test would not run it.
export function findTestFiles(root) {
  const found = [];
  const rejected = [];
  walk(root, found, rejected);
  found.sort();
  rejected.sort();
  return { found, rejected };
}

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

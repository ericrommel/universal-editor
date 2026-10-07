import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("client sources do not import the model provider", () => {
  const root = path.resolve(import.meta.dirname, ".");
  const offenders: string[] = [];
  for (const file of walk(root)) {
    const source = fs.readFileSync(file, "utf8");
    if (
      source.includes("@uvcp/ai/provider") ||
      source.includes("@uvcp/ai/request") ||
      source.includes('from "ai"') ||
      source.includes('from "@ai-sdk/') ||
      source.includes('from "openai"') ||
      source.includes('from "node:url"')
    ) {
      offenders.push(path.relative(root, file));
    }
  }
  assert.deepEqual(offenders, []);
});

function walk(directory: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
      continue;
    }
    if (
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
      !entry.name.endsWith(".test.ts")
    ) {
      files.push(full);
    }
  }
  return files;
}

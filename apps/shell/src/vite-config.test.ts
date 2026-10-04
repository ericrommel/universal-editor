import assert from "node:assert/strict";
import test from "node:test";
import config from "../vite.config.ts";

const sentinel = "SENTINEL_INPUT_BYTES_9f3a";

test("the dev failure variable is inlined only for the dev server", () => {
  const previous = process.env.UVCP_FORCE_INIT_FAILURE;
  try {
    delete process.env.UVCP_FORCE_INIT_FAILURE;
    assert.equal(defined("serve", false), quoted(""));

    process.env.UVCP_FORCE_INIT_FAILURE = "0";
    assert.equal(defined("serve", false), quoted("0"));

    process.env.UVCP_FORCE_INIT_FAILURE = "1";
    assert.equal(defined("serve", false), quoted("1"));

    process.env.UVCP_FORCE_INIT_FAILURE = sentinel;
    assert.equal(defined("build", false), quoted(""));
    assert.equal(defined("serve", true), quoted(""));
    assert.equal(defined("serve", false), quoted(sentinel));
  } finally {
    if (previous === undefined) {
      delete process.env.UVCP_FORCE_INIT_FAILURE;
    } else {
      process.env.UVCP_FORCE_INIT_FAILURE = previous;
    }
  }
});

function defined(command: "build" | "serve", isPreview: boolean): string {
  if (typeof config !== "function") {
    throw new Error("The shell Vite config must be a function.");
  }
  const resolved = config({
    command,
    mode: "production",
    isPreview,
  });
  if (resolved instanceof Promise) {
    throw new Error("The shell Vite config must be synchronous.");
  }
  const value = resolved.define?.__UVCP_DEV_FAILURE__;
  if (typeof value !== "string") {
    throw new Error("The dev failure define must be a string.");
  }
  return value;
}

function quoted(value: string): string {
  return JSON.stringify(value);
}

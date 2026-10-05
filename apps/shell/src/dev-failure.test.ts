import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { InitializationError, type StartingSession } from "@uvcp/editor";
import { applyDevFailure, devFailureDecision } from "./dev-failure.ts";

const SENTINEL = "SENTINEL_INPUT_BYTES_9f3a";

test("an empty value and 0 let startup succeed", () => {
  assert.equal(devFailureDecision(""), "succeed");
  assert.equal(devFailureDecision("0"), "succeed");
});

test("1 forces failure and every other string is invalid", () => {
  assert.equal(devFailureDecision("1"), "force");
  assert.equal(devFailureDecision("2"), "invalid");
  assert.equal(devFailureDecision(" 1"), "invalid");
  assert.equal(devFailureDecision("1 "), "invalid");
  assert.equal(devFailureDecision("01"), "invalid");
  assert.equal(devFailureDecision("true"), "invalid");
});

test("applyDevFailure succeeds only for empty and 0", () => {
  assert.doesNotThrow(() => applyDevFailure(startingSession(), ""));
  assert.doesNotThrow(() => applyDevFailure(startingSession(), "0"));
});

test("1 throws the forced initialization failure", () => {
  assert.throws(
    () => applyDevFailure(startingSession(), "1"),
    (error: unknown) => {
      assert.ok(error instanceof InitializationError);
      assert.equal(error.name, "InitializationError");
      assert.equal(error.step, "forced-initialization-failure");
      assert.equal(error.code, "FORCED_INITIALIZATION_FAILURE");
      assert.equal(error.message, "Initialization failed.");
      return true;
    },
  );
});

test("any other value fails closed and does not echo the value", () => {
  for (const value of ["2", " 1", "1 ", "01", "true", SENTINEL]) {
    assert.throws(
      () => applyDevFailure(startingSession(), value),
      (error: unknown) => {
        assert.ok(error instanceof InitializationError);
        assert.equal(error.step, "initialize");
        assert.equal(error.code, "INVALID_INITIALIZATION_VALUE");
        assert.equal(error.message, "Initialization failed.");
        assert.equal(error.message.includes(value), false);
        assert.equal(error.message.includes(SENTINEL), false);
        assert.equal((error.stack ?? "").includes(SENTINEL), false);
        return true;
      },
    );
  }
});

test("a session that is not starting fails closed", () => {
  assert.throws(
    () =>
      applyDevFailure(
        // The parameter type is Starting. This proves the runtime check
        // still rejects a settled session.
        Object.freeze({ status: "ready" }) as unknown as StartingSession,
        "0",
      ),
    (error: unknown) => {
      assert.ok(error instanceof InitializationError);
      assert.equal(error.code, "INVALID_INITIALIZATION_VALUE");
      return true;
    },
  );
});

test("client sources do not name the dev failure variable", () => {
  const srcDir = fileURLToPath(new URL(".", import.meta.url));
  for (const name of fs.readdirSync(srcDir)) {
    if (name.endsWith(".test.ts")) {
      continue;
    }
    const text = fs.readFileSync(path.join(srcDir, name), "utf8");
    assert.equal(text.includes("UVCP_FORCE_INIT_FAILURE"), false, name);
  }
  const config = fs.readFileSync(
    new URL("../vite.config.ts", import.meta.url),
    "utf8",
  );
  assert.equal(config.includes("UVCP_FORCE_INIT_FAILURE"), true);
});

test("shell declarations are not emitted into the production directory", () => {
  const tsconfig = JSON.parse(
    fs.readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8"),
  ) as { compilerOptions?: { outDir?: string; emitDeclarationOnly?: boolean } };
  assert.equal(tsconfig.compilerOptions?.outDir, "ts-out");
  assert.equal(tsconfig.compilerOptions?.emitDeclarationOnly, true);
});

function startingSession(): StartingSession {
  return Object.freeze({ status: "starting" });
}

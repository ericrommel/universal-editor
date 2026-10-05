import assert from "node:assert/strict";
import test from "node:test";
import { InitializationError, startSession } from "@uvcp/editor";
import { foundationProps } from "./foundation-props.ts";

test("ready startup passes no diagnostic", () => {
  const session = startSession({
    initialize() {},
    write() {},
  });
  const props = foundationProps(session);
  assert.deepEqual(props, { status: "ready" });
  assert.equal("diagnostic" in props, false);
});

test("failed startup passes the application message", () => {
  const session = startSession({
    initialize() {
      throw new InitializationError(
        "forced-initialization-failure",
        "FORCED_INITIALIZATION_FAILURE",
        "Initialization failed.",
      );
    },
    write() {},
  });
  assert.deepEqual(foundationProps(session), {
    status: "failed",
    diagnostic: "Initialization failed.",
  });
});

test("a diagnostic that looks like markup is passed through unchanged", () => {
  const message = "<img src=x onerror=alert(1)>\nline";
  const props = foundationProps({
    status: "failed",
    step: "initialize",
    code: "INITIALIZATION_FAILED",
    message,
  });
  assert.equal(props.status, "failed");
  assert.equal(props.diagnostic, message);
});

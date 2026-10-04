import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { DomainError } from "@uvcp/core";
import { readManifest } from "@uvcp/persistence";
import { initializeFoundation } from "./compose.ts";
import { InitializationError, startSession } from "./session.ts";

const SENTINEL = "SENTINEL_INPUT_BYTES_9f3a";
const SCRIPT_PATH = fileURLToPath(new URL("./headless.ts", import.meta.url));
const HARNESS_TIMEOUT_MS = 60_000;

test("startup reaches ready without a shell", () => {
  const lines: string[] = [];
  const session = startSession({
    initialize: initializeFoundation,
    write: (line) => {
      lines.push(line);
    },
  });
  assert.equal(session.status, "ready");
  assert.deepEqual(
    lines.map((line) => JSON.parse(line)),
    [
      {
        event: "startup.beginning",
        shell: "browser",
        version: "0.0.0",
        step: "initialize",
      },
      {
        event: "startup.ready",
        shell: "browser",
        version: "0.0.0",
        step: "initialize",
      },
    ],
  );
});

test("the session is starting until initialization finishes", () => {
  const readyLines: string[] = [];
  let readySeen: { readonly status: string } | undefined;
  const ready = startSession({
    initialize: (session) => {
      // Assert during initialize. A later mutation of the same object
      // must not be able to satisfy this check.
      readySeen = session;
      assert.equal(Object.isFrozen(session), true);
      assert.deepEqual(session, { status: "starting" });
      assert.equal(readyLines.length, 1);
      assert.equal(JSON.parse(readyLines[0] ?? "").event, "startup.beginning");
    },
    write: (line) => {
      readyLines.push(line);
    },
  });
  assert.equal(readySeen?.status, "starting");
  assert.equal(ready.status, "ready");
  assert.equal(JSON.parse(readyLines[1] ?? "").event, "startup.ready");

  const failedLines: string[] = [];
  let failedSeen: { readonly status: string } | undefined;
  const failed = startSession({
    initialize: (session) => {
      failedSeen = session;
      assert.equal(Object.isFrozen(session), true);
      assert.deepEqual(session, { status: "starting" });
      assert.equal(failedLines.length, 1);
      assert.equal(JSON.parse(failedLines[0] ?? "").event, "startup.beginning");
      throw new InitializationError(
        "injected-initialization-failure",
        "INJECTED_INITIALIZATION_FAILURE",
        "Initialization failed.",
      );
    },
    write: (line) => {
      failedLines.push(line);
    },
  });
  assert.equal(failedSeen?.status, "starting");
  assert.equal(failed.status, "failed");
  if (failed.status !== "failed") {
    assert.fail("startup should have failed");
  }
  assert.equal(failed.step, "injected-initialization-failure");
  assert.equal(JSON.parse(failedLines[1] ?? "").event, "startup.failed");
});

test("a rejected manifest is diagnosable without a shell", () => {
  const lines: string[] = [];
  const session = startSession({
    initialize: () => {
      readManifest(new Uint8Array());
    },
    write: (line) => {
      lines.push(line);
    },
  });
  if (session.status !== "failed") {
    assert.fail("startup should have failed");
  }
  const domain = new DomainError("EMPTY", "Manifest is empty.");
  assert.equal(session.step, "initialize");
  assert.equal(session.code, domain.code);
  assert.equal(session.message, domain.message);
  const rendered = lines.join("\n");
  assert.equal(rendered.includes("formatId"), false);
  assert.equal(JSON.parse(lines[1] ?? "").event, "startup.failed");
});

test("a safe application error stays diagnosable", () => {
  const lines: string[] = [];
  const session = startSession({
    initialize: () => {
      throw new InitializationError(
        "forced-initialization-failure",
        "FORCED_INITIALIZATION_FAILURE",
        "Initialization failed.",
      );
    },
    write: (line) => {
      lines.push(line);
    },
  });
  assert.equal(session.status, "failed");
  if (session.status !== "failed") {
    assert.fail("startup should have failed");
  }
  assert.equal(session.step, "forced-initialization-failure");
  assert.equal(session.code, "FORCED_INITIALIZATION_FAILURE");
  assert.equal(session.message, "Initialization failed.");
  assert.equal(
    new InitializationError(
      "forced-initialization-failure",
      "FORCED_INITIALIZATION_FAILURE",
      "Initialization failed.",
    ) instanceof DomainError,
    false,
  );
  assert.deepEqual(JSON.parse(lines[1] ?? ""), {
    event: "startup.failed",
    shell: "browser",
    version: "0.0.0",
    step: "forced-initialization-failure",
    code: "FORCED_INITIALIZATION_FAILURE",
    message: "Initialization failed.",
  });

  const codecErrors = [
    ["EMPTY", "Manifest is empty."],
    ["INVALID_ENCODING", "Manifest is not UTF-8 text."],
  ] as const;
  for (const [code, message] of codecErrors) {
    const codecLines: string[] = [];
    const codecFailure = startSession({
      initialize: () => {
        throw new DomainError(code, message);
      },
      write: (line) => {
        codecLines.push(line);
      },
    });
    if (codecFailure.status !== "failed") {
      assert.fail("startup should have failed");
    }
    assert.equal(codecFailure.step, "initialize");
    assert.equal(codecFailure.code, code);
    assert.equal(codecFailure.message, message);
    assert.equal(JSON.parse(codecLines[0] ?? "").event, "startup.beginning");
  }
});

test("an unsafe failure is replaced and is not echoed", () => {
  const attacks = [
    () => {
      throw new DomainError("LEAKED", SENTINEL);
    },
    () => {
      throw new Error(SENTINEL);
    },
    () => {
      throw new InitializationError(
        SENTINEL,
        "NOT CLOSED",
        `C:\\Users\\ericr\\${SENTINEL}`,
      );
    },
    () => {
      throw new DomainError(
        "EMPTY",
        `Manifest is empty.\n{"event":"startup.ready","secret":"${SENTINEL}"}`,
      );
    },
    () => {
      const error = new InitializationError(
        "initialize",
        "INITIALIZATION_FAILED",
        "Initialization failed.",
      );
      Object.defineProperty(error, "code", { value: { marker: SENTINEL } });
      throw error;
    },
  ];
  for (const initialize of attacks) {
    const lines: string[] = [];
    const session = startSession({
      initialize,
      write: (line) => {
        lines.push(line);
      },
    });
    if (session.status !== "failed") {
      assert.fail("startup should have failed");
    }
    assert.equal(session.step, "initialize");
    assert.equal(session.code, "INITIALIZATION_FAILED");
    assert.equal(session.message, "Initialization failed.");
    const rendered = lines.join("\n");
    assert.equal(rendered.includes(SENTINEL), false);
    assert.equal(rendered.includes("LEAKED"), false);
    assert.equal(rendered.includes("Users"), false);
    assert.equal(rendered.includes("editor.test.ts"), false);
    assert.equal(lines.length, 2);
    assert.equal(JSON.parse(lines[1] ?? "").event, "startup.failed");
  }
});

test("the headless script reports ready and ignores the dev failure variable", {
  timeout: HARNESS_TIMEOUT_MS,
}, async () => {
  for (const value of ["1", "2", SENTINEL]) {
    const result = await runScript([], {
      UVCP_FORCE_INIT_FAILURE: value,
    });
    assert.equal(result.code, 0);
    assert.equal(result.stdout, "");
    assert.equal(result.stderr.includes(value), false);
    assert.equal(result.stderr.includes("UVCP_FORCE_INIT_FAILURE"), false);
    assert.deepEqual(records(result.stderr), [
      {
        event: "startup.beginning",
        shell: "browser",
        version: "0.0.0",
        step: "initialize",
      },
      {
        event: "startup.ready",
        shell: "browser",
        version: "0.0.0",
        step: "initialize",
      },
    ]);
  }
});

test("the headless script reports injected failure with a non-zero exit", {
  timeout: HARNESS_TIMEOUT_MS,
}, async () => {
  const result = await runScript(["--inject-failure"], {
    UVCP_FORCE_INIT_FAILURE: SENTINEL,
  });
  assert.equal(result.code, 1);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr.includes(SENTINEL), false);
  assert.equal(result.stderr.includes("UVCP_FORCE_INIT_FAILURE"), false);
  assert.deepEqual(records(result.stderr), [
    {
      event: "startup.beginning",
      shell: "browser",
      version: "0.0.0",
      step: "initialize",
    },
    {
      event: "startup.failed",
      shell: "browser",
      version: "0.0.0",
      step: "injected-initialization-failure",
      code: "INJECTED_INITIALIZATION_FAILURE",
      message: "Initialization failed.",
    },
  ]);
});

test("an unexpected headless argument fails closed without echoing it", {
  timeout: HARNESS_TIMEOUT_MS,
}, async () => {
  const result = await runScript([`--inject-${SENTINEL}`], {});
  assert.equal(result.code, 2);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr.includes(SENTINEL), false);
  assert.equal(result.stderr.includes("startup.beginning"), false);
  assert.match(
    result.stderr,
    /^Usage: node packages\/editor\/src\/headless\.ts \[--inject-failure\]\r?\n$/,
  );
});

function records(stderr: string): unknown[] {
  return stderr
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line.replace(/\r$/, "")));
}

function runScript(
  args: readonly string[],
  extra: Record<string, string>,
): Promise<{ code: number; stdout: string; stderr: string }> {
  // Node on Windows needs SYSTEMROOT to start. The child does not
  // receive the rest of the parent environment.
  const env: Record<string, string> = {};
  for (const key of ["PATH", "PATHEXT", "SYSTEMROOT", "COMSPEC", "WINDIR"]) {
    const value = process.env[key];
    if (typeof value === "string") {
      env[key] = value;
    }
  }
  for (const [key, value] of Object.entries(extra)) {
    env[key] = value;
  }
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SCRIPT_PATH, ...args], {
      env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const timer = setTimeout(() => {
      child.kill();
      finish(() => {
        reject(new Error("Headless startup exceeded 60 seconds."));
      });
    }, HARNESS_TIMEOUT_MS);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      finish(() => {
        reject(error);
      });
    });
    child.on("close", (code) => {
      finish(() => {
        resolve({ code: code ?? 1, stdout, stderr });
      });
    });

    function finish(settle: () => void): void {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      settle();
    }
  });
}

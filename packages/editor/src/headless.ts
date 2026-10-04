import { runHeadless } from "./compose.ts";

type HeadlessProcess = {
  readonly argv: readonly string[];
  readonly stderr: { write(chunk: string): void };
  exitCode?: number;
};

function currentProcess(): HeadlessProcess {
  // Node provides process. This package does not enable the DOM lib,
  // and the script does not justify a Node types dependency.
  const host = globalThis as unknown as { process?: HeadlessProcess };
  if (host.process === undefined) {
    throw new Error("Headless startup requires a process.");
  }
  return host.process;
}

const hostProcess = currentProcess();
const argument = hostProcess.argv[2];
const extra = hostProcess.argv[3];

if (
  extra !== undefined ||
  (argument !== undefined && argument !== "--inject-failure")
) {
  hostProcess.stderr.write(
    "Usage: node packages/editor/src/headless.ts [--inject-failure]\n",
  );
  hostProcess.exitCode = 2;
} else {
  const session = runHeadless(
    argument === undefined ? "success" : "failure",
    (line) => {
      hostProcess.stderr.write(`${line}\n`);
    },
  );
  hostProcess.exitCode = session.status === "ready" ? 0 : 1;
}

// Module 0 has one shell value. The headless script records that same
// startup. It does not open a browser, and it is not a second shell.

const SHELL = "browser";
const VERSION = "0.0.0";
const STEP = "initialize";

export function beginningLine(): string {
  return JSON.stringify({
    event: "startup.beginning",
    shell: SHELL,
    version: VERSION,
    step: STEP,
  });
}

export function readyLine(): string {
  return JSON.stringify({
    event: "startup.ready",
    shell: SHELL,
    version: VERSION,
    step: STEP,
  });
}

export function failedLine(failure: {
  readonly step: string;
  readonly code: string;
  readonly message: string;
}): string {
  return JSON.stringify({
    event: "startup.failed",
    shell: SHELL,
    version: VERSION,
    step: failure.step,
    code: failure.code,
    message: failure.message,
  });
}

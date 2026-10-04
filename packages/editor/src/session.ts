import { DomainError } from "@uvcp/core";
import { beginningLine, failedLine, readyLine } from "./diagnostics.ts";

const FIXED_STEP = "initialize";
const FIXED_CODE = "INITIALIZATION_FAILED";
const FIXED_MESSAGE = "Initialization failed.";

const STEP_PATTERN = /^[a-z][a-z0-9-]{0,63}$/;
const CODE_PATTERN = /^[A-Z][A-Z0-9_]{0,63}$/;
const MESSAGE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 .'-]{0,159}$/;

// Startup failures are application diagnostics. DomainError stays the
// domain invariant type, so an injected failure is not a domain error.
export class InitializationError extends Error {
  readonly step: string;
  readonly code: string;

  constructor(step: string, code: string, message: string) {
    super(message);
    this.name = "InitializationError";
    this.step = step;
    this.code = code;
  }
}

export type EditorSession =
  | { readonly status: "ready" }
  | {
      readonly status: "failed";
      readonly step: string;
      readonly code: string;
      readonly message: string;
    };

export type DiagnosticSink = (line: string) => void;

export type StartSessionOptions = {
  readonly initialize: () => void;
  readonly write: DiagnosticSink;
};

export function startSession(options: StartSessionOptions): EditorSession {
  // Startup is synchronous. The beginning record is the starting state.
  // The caller observes ready or failed.
  options.write(beginningLine());
  try {
    options.initialize();
  } catch (error) {
    const failure = failureOf(error);
    options.write(failedLine(failure));
    return { status: "failed", ...failure };
  }
  options.write(readyLine());
  return { status: "ready" };
}

function failureOf(error: unknown): {
  readonly step: string;
  readonly code: string;
  readonly message: string;
} {
  if (error instanceof InitializationError) {
    return closedFailure(error.step, error.code, error.message);
  }
  if (error instanceof DomainError) {
    return closedFailure(FIXED_STEP, error.code, error.message);
  }
  return fixedFailure();
}

// Diagnostic text is an application message, not the thrown value.
// A step, code, or message outside this closed set is replaced so the
// line cannot carry input, a stack, or a second JSON record.
function closedFailure(
  step: unknown,
  code: unknown,
  message: unknown,
): {
  readonly step: string;
  readonly code: string;
  readonly message: string;
} {
  // RegExp.test coerces other types. Only actual strings may be logged.
  if (
    isClosedText(step, STEP_PATTERN) &&
    isClosedText(code, CODE_PATTERN) &&
    isClosedText(message, MESSAGE_PATTERN)
  ) {
    return { step, code, message };
  }
  return fixedFailure();
}

function isClosedText(value: unknown, pattern: RegExp): value is string {
  return typeof value === "string" && pattern.test(value);
}

function fixedFailure(): {
  readonly step: string;
  readonly code: string;
  readonly message: string;
} {
  return {
    step: FIXED_STEP,
    code: FIXED_CODE,
    message: FIXED_MESSAGE,
  };
}

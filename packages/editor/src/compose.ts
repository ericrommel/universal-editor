import {
  type DiagnosticSink,
  type EditorSession,
  InitializationError,
  startSession,
} from "./session.ts";

// Module 0 has no project, scene, or save to load. Ready means this
// initializer returned. The shell still cannot import persistence.
export function initializeFoundation(): void {}

export function runHeadless(
  mode: "success" | "failure",
  write: DiagnosticSink,
): EditorSession {
  return startSession({
    initialize:
      mode === "failure" ? injectedInitializationFailure : initializeFoundation,
    write,
  });
}

function injectedInitializationFailure(): void {
  throw new InitializationError(
    "injected-initialization-failure",
    "INJECTED_INITIALIZATION_FAILURE",
    "Initialization failed.",
  );
}

import { InitializationError, type StartingSession } from "@uvcp/editor";

export type DevFailureDecision = "succeed" | "force" | "invalid";

// Unset and empty arrive as "". Whitespace is not trimmed into a success.
export function devFailureDecision(value: string): DevFailureDecision {
  if (value === "" || value === "0") {
    return "succeed";
  }
  if (value === "1") {
    return "force";
  }
  return "invalid";
}

export function applyDevFailure(session: StartingSession, value: string): void {
  if (session.status !== "starting") {
    throw new InitializationError(
      "initialize",
      "INVALID_INITIALIZATION_VALUE",
      "Initialization failed.",
    );
  }
  const decision = devFailureDecision(value);
  if (decision === "succeed") {
    return;
  }
  if (decision === "force") {
    throw new InitializationError(
      "forced-initialization-failure",
      "FORCED_INITIALIZATION_FAILURE",
      "Initialization failed.",
    );
  }
  throw new InitializationError(
    "initialize",
    "INVALID_INITIALIZATION_VALUE",
    "Initialization failed.",
  );
}

import type { SettledSession } from "@uvcp/editor";

export type FoundationShellProps = {
  readonly status: "ready" | "failed";
  readonly diagnostic?: string;
};

// Startup finishes before the first paint, so the shell never passes Starting.
// Failure text is the application message. Step ids stay in the diagnostic log.
export function foundationProps(session: SettledSession): FoundationShellProps {
  if (session.status === "failed") {
    return { status: "failed", diagnostic: session.message };
  }
  return { status: "ready" };
}

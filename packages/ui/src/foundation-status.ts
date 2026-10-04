import { strings } from "./strings.ts";

export type FoundationStatus = "starting" | "ready" | "failed";

export type FoundationPresentation = {
  readonly statusWord: string;
  readonly detail: string;
  readonly diagnosticText: string | null;
  readonly detailsOpen: boolean;
  readonly detailsControl: "Details" | "Hide details" | null;
};

// Absent means missing or only whitespace. A real message keeps its interior spaces.
function usableDiagnostic(diagnostic: string | undefined): string | undefined {
  if (diagnostic === undefined || diagnostic.trim() === "") {
    return undefined;
  }
  return diagnostic;
}

export function foundationStatus(
  status: FoundationStatus,
  diagnostic: string | undefined,
): FoundationPresentation {
  const message = usableDiagnostic(diagnostic);
  switch (status) {
    case "starting":
      if (message === undefined) {
        return {
          statusWord: strings.statusStarting,
          detail: strings.detailStarting,
          diagnosticText: null,
          detailsOpen: false,
          detailsControl: null,
        };
      }
      return {
        statusWord: strings.statusStarting,
        detail: strings.detailStarting,
        diagnosticText: message,
        detailsOpen: true,
        detailsControl: strings.hideDetails,
      };
    case "ready":
      if (message === undefined) {
        return {
          statusWord: strings.statusReady,
          detail: strings.detailReady,
          diagnosticText: null,
          detailsOpen: false,
          detailsControl: null,
        };
      }
      return {
        statusWord: strings.statusReady,
        detail: strings.detailReady,
        diagnosticText: message,
        detailsOpen: false,
        detailsControl: strings.showDetails,
      };
    case "failed":
      return {
        statusWord: strings.statusNotReady,
        detail: strings.detailNotReady,
        diagnosticText: message ?? strings.diagnosticEmpty,
        detailsOpen: true,
        detailsControl: strings.hideDetails,
      };
    default:
      throw new Error("Unexpected foundation status.");
  }
}

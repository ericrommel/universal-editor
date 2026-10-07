import { useEffect, useId, useState } from "react";
import "./foundation-screen.css";
import {
  type FoundationStatus,
  foundationStatus,
} from "./foundation-status.ts";
import { strings } from "./strings.ts";

export type { FoundationStatus } from "./foundation-status.ts";

export type FoundationScreenProps = {
  readonly status: FoundationStatus;
  readonly diagnostic?: string;
};

export type Appearance = "light" | "dark" | "forced";

export function FoundationScreen({
  status,
  diagnostic,
}: FoundationScreenProps) {
  const appearance = useAppearance();
  const labelId = useId();
  useDocumentTitle(strings.webDocumentTitle);
  const presentation = foundationStatus(status, diagnostic);
  const signature = disclosureSignature(status, diagnostic);
  const [disclosure, setDisclosure] = useState({
    signature,
    open: presentation.detailsOpen,
  });
  // Ready starts collapsed even when Starting was expanded in this same mount.
  if (disclosure.signature !== signature) {
    setDisclosure({
      signature,
      open: presentation.detailsOpen,
    });
  }
  const open =
    disclosure.signature === signature
      ? disclosure.open
      : presentation.detailsOpen;
  const expanded = presentation.detailsControl !== null && open;
  // A diagnostic is application text. A text child keeps a leading "<" from becoming HTML.
  const diagnosticText = expanded ? presentation.diagnosticText : null;

  return (
    <div className="uvcp-foundation" data-appearance={appearance}>
      <div className="uvcp-foundation-frame">
        <div className="uvcp-foundation-pad">
          <div className="uvcp-foundation-column">
            <h1 className="uvcp-foundation-name">{strings.productName}</h1>
            <p className="uvcp-foundation-purpose">{strings.purpose}</p>
            <section
              className="uvcp-foundation-status"
              aria-labelledby={labelId}
            >
              <p className="uvcp-foundation-label" id={labelId}>
                {strings.statusLabel}
              </p>
              <p className="uvcp-foundation-value">
                {status === "starting" ? null : (
                  <span
                    aria-hidden="true"
                    className={
                      status === "ready"
                        ? "uvcp-foundation-dot uvcp-foundation-dot-ready"
                        : "uvcp-foundation-dot uvcp-foundation-dot-failed"
                    }
                  />
                )}
                {presentation.statusWord}
              </p>
              <p className="uvcp-foundation-detail">{presentation.detail}</p>
              {diagnosticText !== null ? (
                <p className="uvcp-foundation-diagnostic">{diagnosticText}</p>
              ) : null}
              {presentation.detailsControl !== null ? (
                <button
                  type="button"
                  onClick={() => {
                    setDisclosure((current) => ({
                      signature,
                      open: !current.open,
                    }));
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Escape" || !open) {
                      return;
                    }
                    event.preventDefault();
                    setDisclosure({ signature, open: false });
                  }}
                >
                  {open ? strings.hideDetails : strings.showDetails}
                </button>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function disclosureSignature(
  status: FoundationStatus,
  diagnostic: string | undefined,
): string {
  return `${status}\u0000${diagnostic ?? ""}`;
}

function useDocumentTitle(title: string): void {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    document.title = title;
  }, [title]);
}

export function useAppearance(): Appearance {
  const [appearance, setAppearance] = useState(readAppearance);
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }
    let queries: MediaQueryList[];
    try {
      queries = [
        window.matchMedia("(forced-colors: active)"),
        window.matchMedia("(prefers-contrast: more)"),
        window.matchMedia("(prefers-color-scheme: dark)"),
      ];
    } catch {
      return;
    }
    const onChange = (): void => {
      setAppearance(readAppearance());
    };
    for (const query of queries) {
      query.addEventListener("change", onChange);
    }
    onChange();
    return () => {
      for (const query of queries) {
        query.removeEventListener("change", onChange);
      }
    };
  }, []);
  return appearance;
}

// Light is the missing-preference fallback, not a second theme.
function readAppearance(): Appearance {
  const forced = queryMatches("(forced-colors: active)");
  const contrast = queryMatches("(prefers-contrast: more)");
  const dark = queryMatches("(prefers-color-scheme: dark)");
  if (forced === null || contrast === null || dark === null) {
    return "light";
  }
  if (forced || contrast) {
    return "forced";
  }
  if (dark) {
    return "dark";
  }
  return "light";
}

function queryMatches(query: string): boolean | null {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return null;
  }
  try {
    return window.matchMedia(query).matches;
  } catch {
    return null;
  }
}

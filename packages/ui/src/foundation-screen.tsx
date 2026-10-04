import { useEffect, useId, useState } from "react";
import {
  type FoundationStatus,
  foundationStatus,
} from "./foundation-status.ts";
import { strings } from "./strings.ts";
import { tokens } from "./tokens.ts";

export type { FoundationStatus } from "./foundation-status.ts";

export type FoundationScreenProps = {
  readonly status: FoundationStatus;
  readonly diagnostic?: string;
};

type Appearance = "light" | "dark" | "forced";

// The column is top-weighted. Vertically centering it would make a splash.
// 36rem is the specified column measure. It is not a step on the space scale.
// 640px is the viewport height for the larger top inset.
// 720px is the content-area width for the larger inline inset.
// The scrollport is not the container: inline-size containment must not block vertical scrolling.
const foundationCss = `
.uvcp-foundation,
.uvcp-foundation *,
.uvcp-foundation *::before,
.uvcp-foundation *::after {
  box-sizing: border-box;
}
.uvcp-foundation {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background-color: var(--uvcp-canvas);
  color: var(--uvcp-text);
  font-family: ${tokens.font.family.ui};
  font-weight: 400;
  text-align: start;
}
.uvcp-foundation-frame {
  container-name: uvcp-foundation;
  container-type: inline-size;
}
.uvcp-foundation[data-appearance="light"] {
  color-scheme: light;
  --uvcp-canvas: ${tokens.color.light.canvas};
  --uvcp-surface: ${tokens.color.light.surface};
  --uvcp-text: ${tokens.color.light.text.primary};
  --uvcp-text-secondary: ${tokens.color.light.text.secondary};
  --uvcp-border: ${tokens.color.light.border};
  --uvcp-focus: ${tokens.color.light.focus};
  --uvcp-status-ready: ${tokens.color.light.status.ready};
  --uvcp-status-failed: ${tokens.color.light.status.failed};
}
.uvcp-foundation[data-appearance="dark"] {
  color-scheme: dark;
  --uvcp-canvas: ${tokens.color.dark.canvas};
  --uvcp-surface: ${tokens.color.dark.surface};
  --uvcp-text: ${tokens.color.dark.text.primary};
  --uvcp-text-secondary: ${tokens.color.dark.text.secondary};
  --uvcp-border: ${tokens.color.dark.border};
  --uvcp-focus: ${tokens.color.dark.focus};
  --uvcp-status-ready: ${tokens.color.dark.status.ready};
  --uvcp-status-failed: ${tokens.color.dark.status.failed};
}
.uvcp-foundation[data-appearance="forced"] {
  --uvcp-canvas: Canvas;
  --uvcp-surface: Canvas;
  --uvcp-text: CanvasText;
  --uvcp-text-secondary: CanvasText;
  --uvcp-border: CanvasText;
  --uvcp-focus: Highlight;
  --uvcp-status-ready: Highlight;
  --uvcp-status-failed: Highlight;
}
.uvcp-foundation-pad {
  padding-top: ${tokens.space[6]};
  padding-bottom: ${tokens.space[7]};
  padding-inline: ${tokens.space[5]};
}
@media (min-height: 640px) {
  .uvcp-foundation-pad {
    padding-top: ${tokens.space[8]};
  }
}
@container uvcp-foundation (min-width: 720px) {
  .uvcp-foundation-pad {
    padding-inline: ${tokens.space[7]};
  }
}
.uvcp-foundation-column {
  max-width: 36rem;
  margin-inline: auto;
  text-align: start;
  overflow-wrap: break-word;
}
.uvcp-foundation-name {
  margin: 0;
  font-size: ${tokens.type.display.size};
  font-weight: ${tokens.type.display.weight};
  line-height: ${tokens.type.display.lineHeight};
}
.uvcp-foundation-purpose {
  margin: ${tokens.space[3]} 0 0;
  font-size: ${tokens.type.body.size};
  font-weight: ${tokens.type.body.weight};
  line-height: ${tokens.type.body.lineHeight};
}
.uvcp-foundation-status {
  margin-top: ${tokens.space[6]};
  background-color: var(--uvcp-surface);
  border: 1px solid var(--uvcp-border);
  border-radius: ${tokens.radius.surface};
  padding: ${tokens.space[4]};
}
.uvcp-foundation-label,
.uvcp-foundation-value,
.uvcp-foundation-detail,
.uvcp-foundation-diagnostic {
  margin: 0;
}
.uvcp-foundation-status > * + * {
  margin-top: ${tokens.space[2]};
}
.uvcp-foundation-label {
  font-size: ${tokens.type.label.size};
  font-weight: ${tokens.type.label.weight};
  line-height: ${tokens.type.label.lineHeight};
  color: var(--uvcp-text-secondary);
}
.uvcp-foundation-value {
  display: flex;
  align-items: center;
  gap: ${tokens.space[2]};
  font-size: ${tokens.type.status.size};
  font-weight: ${tokens.type.status.weight};
  line-height: ${tokens.type.status.lineHeight};
  color: var(--uvcp-text);
}
.uvcp-foundation-dot {
  display: block;
  width: ${tokens.space[2]};
  height: ${tokens.space[2]};
  flex: none;
}
.uvcp-foundation-dot-ready {
  background-color: var(--uvcp-status-ready);
}
.uvcp-foundation-dot-failed {
  background-color: var(--uvcp-status-failed);
}
.uvcp-foundation-detail,
.uvcp-foundation-diagnostic {
  font-size: ${tokens.type.body.size};
  font-weight: ${tokens.type.body.weight};
  line-height: ${tokens.type.body.lineHeight};
  color: var(--uvcp-text);
}
.uvcp-foundation-diagnostic {
  white-space: pre-wrap;
  user-select: text;
}
.uvcp-foundation button {
  /* Block, at its content width, so the 8px stack gap is exact and the control is not a full-width bar. Platform chrome stays. */
  display: block;
  width: fit-content;
  font-family: ${tokens.font.family.ui};
  font-size: ${tokens.type.body.size};
  font-weight: 600;
  line-height: ${tokens.type.body.lineHeight};
}
.uvcp-foundation button:focus-visible {
  outline: ${tokens.focus.ring.width} solid var(--uvcp-focus);
  outline-offset: ${tokens.focus.ring.offset};
}
`;

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
      <style>{foundationCss}</style>
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

function useAppearance(): Appearance {
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

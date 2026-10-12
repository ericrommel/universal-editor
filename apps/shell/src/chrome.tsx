import type { EditorShape } from "@uvcp/editor";
import type { KeyboardEvent, ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";

const FILE_MENU_ID = "uvcp-file-menu";

export function ProductMark() {
  return (
    <svg
      className="uvcp-product-mark"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <rect x="1" y="3.5" width="9" height="11" />
      <rect x="5" y="1.5" width="9" height="11" />
    </svg>
  );
}

export function KindMark({ kind }: { readonly kind: EditorShape["kind"] }) {
  if (kind === "ellipse") {
    return <EllipseMark />;
  }
  if (kind === "text") {
    return <TextMark />;
  }
  if (kind === "box") {
    return <BoxMark />;
  }
  return <RectangleMark />;
}

export function RectangleMark() {
  return (
    <Mark>
      <rect x="2.25" y="4.25" width="11.5" height="7.5" rx="0.5" />
    </Mark>
  );
}

export function EllipseMark() {
  return (
    <Mark>
      <ellipse cx="8" cy="8" rx="5.75" ry="3.5" />
    </Mark>
  );
}

export function TextMark() {
  return (
    <Mark>
      <path d="M3.5 4.25h9M8 4.25v8" />
    </Mark>
  );
}

export function BoxMark() {
  return (
    <Mark>
      <path d="M3 6.5 8 4l5 2.5v5.5L8 14.5 3 12Z" />
      <path d="M3 6.5 8 9l5-2.5M8 9v5.5" />
    </Mark>
  );
}

export function UndoMark() {
  return (
    <Mark>
      <path d="M6.5 4.5 3.5 7.5 6.5 10.5" />
      <path d="M4 7.5h6.25a2.75 2.75 0 0 1 0 5.5H8" />
    </Mark>
  );
}

export function RedoMark() {
  return (
    <Mark>
      <path d="M9.5 4.5 12.5 7.5 9.5 10.5" />
      <path d="M12 7.5H5.75a2.75 2.75 0 0 0 0 5.5H8" />
    </Mark>
  );
}

export function DeleteMark() {
  return (
    <Mark>
      <path d="M3.5 5h9M6.25 5V3.75h3.5V5M5.25 6.25 6 13h4l.75-6.75" />
    </Mark>
  );
}

function Mark({ children }: { readonly children: ReactNode }) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      {children}
    </svg>
  );
}

export function ToolButton({
  label,
  tip,
  disabled,
  onClick,
  children,
}: {
  readonly label: string;
  readonly tip?: string;
  readonly disabled?: boolean;
  readonly onClick: () => void;
  readonly children: ReactNode;
}) {
  const text = tip ?? label;
  return (
    <Tip text={text}>
      {(id) => (
        <button
          type="button"
          className="uvcp-tool"
          aria-label={label}
          aria-describedby={text === label ? undefined : id}
          disabled={disabled}
          onClick={onClick}
        >
          {children}
        </button>
      )}
    </Tip>
  );
}

export function FileButton({
  label,
  tip,
  accept,
  inputLabel,
  disabled,
  onFile,
}: {
  readonly label: string;
  readonly tip: string;
  readonly accept: string;
  readonly inputLabel: string;
  readonly disabled: boolean;
  readonly onFile: (file: File) => void;
}) {
  const input = useRef<HTMLInputElement | null>(null);
  return (
    <Tip text={tip}>
      {(id) => (
        <>
          <button
            type="button"
            aria-describedby={id}
            disabled={disabled}
            onClick={() => input.current?.click()}
          >
            {label}
          </button>
          {/* The button opens the dialog. The clipped input stays out of
              the tab order so focus does not land on it. */}
          <input
            ref={input}
            className="uvcp-file-input"
            type="file"
            accept={accept}
            aria-label={inputLabel}
            tabIndex={-1}
            disabled={disabled}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (file) {
                onFile(file);
              }
            }}
          />
        </>
      )}
    </Tip>
  );
}

export function FileMenu({
  disabled,
  canExportSelection,
  onImport,
  onExport,
  onExportSelection,
  onSample,
}: {
  readonly disabled: boolean;
  readonly canExportSelection: boolean;
  readonly onImport: (file: File) => void;
  readonly onExport: () => void;
  readonly onExportSelection: () => void;
  readonly onSample: () => void;
}) {
  const importInput = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const fromKeyboard = useRef(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const place = () => placeMenu(buttonRef.current, menuRef.current);
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        popoverTarget={FILE_MENU_ID}
        aria-haspopup="menu"
        aria-controls={FILE_MENU_ID}
        aria-expanded={open}
        disabled={disabled}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown" || disabled) {
            return;
          }
          event.preventDefault();
          const menu = menuRef.current;
          if (menu === null) {
            return;
          }
          if (menu.matches(":popover-open")) {
            menu
              .querySelector<HTMLButtonElement>(
                '[role="menuitem"]:not(:disabled)',
              )
              ?.focus();
            return;
          }
          fromKeyboard.current = true;
          menu.showPopover();
        }}
      >
        3D file
      </button>
      <div
        id={FILE_MENU_ID}
        ref={menuRef}
        popover="auto"
        role="menu"
        aria-label="3D file"
        className="uvcp-menu"
        onToggle={(event) => {
          const next = event.newState === "open";
          setOpen(next);
          if (!next) {
            fromKeyboard.current = false;
            return;
          }
          placeMenu(buttonRef.current, menuRef.current);
          if (!fromKeyboard.current) {
            return;
          }
          fromKeyboard.current = false;
          menuRef.current
            ?.querySelector<HTMLButtonElement>(
              '[role="menuitem"]:not(:disabled)',
            )
            ?.focus();
        }}
        onKeyDown={moveMenuFocus}
      >
        <p className="uvcp-menu-note">
          Import or export rectangles and boxes. Drawing does not need this.
        </p>
        <Tip text="Add rectangles and boxes from a glTF file.">
          {(id) => (
            <button
              type="button"
              role="menuitem"
              aria-describedby={id}
              disabled={disabled}
              onClick={() => {
                importInput.current?.click();
                menuRef.current?.hidePopover();
              }}
            >
              Import glTF
            </button>
          )}
        </Tip>
        <button
          type="button"
          role="menuitem"
          disabled={disabled}
          onClick={() => {
            menuRef.current?.hidePopover();
            onExport();
          }}
        >
          Export glTF
        </button>
        <button
          type="button"
          role="menuitem"
          disabled={disabled || !canExportSelection}
          onClick={() => {
            menuRef.current?.hidePopover();
            onExportSelection();
          }}
        >
          Export selection
        </button>
        <button
          type="button"
          role="menuitem"
          disabled={disabled}
          onClick={() => {
            menuRef.current?.hidePopover();
            onSample();
          }}
        >
          Load sample
        </button>
      </div>
      <input
        ref={importInput}
        className="uvcp-file-input"
        type="file"
        accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
        aria-label="glTF file"
        tabIndex={-1}
        disabled={disabled}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) {
            onImport(file);
          }
        }}
      />
    </>
  );
}

// A pointer click hides the bubble and leaves focus in the tip. Escape
// dismisses only a bubble the user can see. Keep this aligned with openTip.
function tipIsOpen(tip: HTMLElement): boolean {
  if (tip.hasAttribute("data-dismissed")) {
    return false;
  }
  if (tip.matches(":hover")) {
    return true;
  }
  return (
    tip.matches(":focus-within") && !tip.hasAttribute("data-pointer-focus")
  );
}

function placeMenu(
  button: HTMLButtonElement | null,
  menu: HTMLDivElement | null,
) {
  if (button === null || menu === null) {
    return;
  }
  const box = button.getBoundingClientRect();
  const width = menu.offsetWidth;
  const height = menu.offsetHeight;
  const margin = 8;
  let left = box.right - width;
  if (left < margin) {
    left = margin;
  }
  if (left + width > window.innerWidth - margin) {
    left = Math.max(margin, window.innerWidth - margin - width);
  }
  let top = box.bottom + 4;
  if (top + height > window.innerHeight - margin) {
    top = Math.max(margin, box.top - height - 4);
  }
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
}

function moveMenuFocus(event: KeyboardEvent<HTMLDivElement>) {
  if (
    event.key !== "ArrowDown" &&
    event.key !== "ArrowUp" &&
    event.key !== "Home" &&
    event.key !== "End"
  ) {
    return;
  }
  const enabled = [
    ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
      '[role="menuitem"]:not(:disabled)',
    ),
  ];
  if (enabled.length === 0) {
    return;
  }
  event.preventDefault();
  const index = enabled.indexOf(document.activeElement as HTMLButtonElement);
  if (event.key === "Home") {
    enabled[0]?.focus();
    return;
  }
  if (event.key === "End") {
    enabled[enabled.length - 1]?.focus();
    return;
  }
  const step = event.key === "ArrowDown" ? 1 : -1;
  const next =
    index === -1 ? 0 : (index + step + enabled.length) % enabled.length;
  enabled[next]?.focus();
}

export function Tip({
  text,
  children,
}: {
  readonly text: string;
  readonly children: (describedBy: string) => ReactNode;
}) {
  const id = useId();
  const host = useRef<HTMLSpanElement | null>(null);
  const bubble = useRef<HTMLSpanElement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const current = host.current;
    if (current === null) {
      return;
    }
    const anchor: HTMLSpanElement = current;
    function place() {
      const tip = bubble.current;
      if (tip === null) {
        return;
      }
      const anchorBox = anchor.getBoundingClientRect();
      const box = tip.getBoundingClientRect();
      const margin = 8;
      const inRail = anchor.closest(".uvcp-rail") !== null;
      const inMenu = anchor.closest(".uvcp-menu") !== null;
      let left = anchorBox.left;
      let top = anchorBox.bottom - 2;
      if (inRail) {
        left = anchorBox.right - 2;
        top = anchorBox.top;
      } else if (inMenu) {
        left = anchorBox.left - box.width + 2;
        top = anchorBox.top;
      }
      if (left + box.width > window.innerWidth - margin) {
        left =
          inRail || inMenu
            ? anchorBox.left - box.width + 2
            : anchorBox.right - box.width;
      }
      if (left < margin) {
        left = margin;
      }
      if (top + box.height > window.innerHeight - margin) {
        top = Math.max(margin, anchorBox.top - box.height + 2);
      }
      tip.style.left = `${left}px`;
      tip.style.top = `${top}px`;
    }
    function onPointerDown() {
      anchor.dataset.pointerFocus = "";
    }
    function clearDismissed() {
      setDismissed(false);
    }
    function onFocusOut(event: FocusEvent) {
      const next = event.relatedTarget;
      if (!(next instanceof Node) || !anchor.contains(next)) {
        delete anchor.dataset.pointerFocus;
        setDismissed(false);
      }
    }
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape" || !tipIsOpen(anchor)) {
        return;
      }
      setDismissed(true);
      if (anchor.closest(".uvcp-menu") === null) {
        event.stopPropagation();
      }
    }
    anchor.addEventListener("pointerenter", place);
    anchor.addEventListener("focusin", place);
    anchor.addEventListener("pointerdown", onPointerDown);
    anchor.addEventListener("pointerleave", clearDismissed);
    anchor.addEventListener("focusout", onFocusOut);
    anchor.addEventListener("keydown", onKeyDown);
    return () => {
      anchor.removeEventListener("pointerenter", place);
      anchor.removeEventListener("focusin", place);
      anchor.removeEventListener("pointerdown", onPointerDown);
      anchor.removeEventListener("pointerleave", clearDismissed);
      anchor.removeEventListener("focusout", onFocusOut);
      anchor.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <span
      className="uvcp-tip"
      ref={host}
      data-dismissed={dismissed ? "" : undefined}
    >
      {children(id)}
      <span ref={bubble} id={id} role="tooltip" className="uvcp-tip-bubble">
        {text}
      </span>
    </span>
  );
}

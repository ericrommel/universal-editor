import type { EditorShape } from "@uvcp/editor";
import { useEffect, useRef, useState } from "react";
import { shapeLabel } from "./shape-label.ts";

export function ObjectList({
  shapes,
  selectedId,
  onSelect,
}: {
  readonly shapes: readonly EditorShape[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
}) {
  const rows = [...shapes].reverse();
  return (
    <aside className="uvcp-objects">
      <h2>Objects</h2>
      {rows.length === 0 ? (
        <p className="uvcp-muted">No shapes yet.</p>
      ) : (
        <div className="uvcp-object-list" role="listbox" aria-label="Objects">
          {rows.map((shape) => {
            const selected = shape.id === selectedId;
            return (
              <button
                key={shape.id}
                type="button"
                role="option"
                aria-selected={selected}
                className="uvcp-object"
                onClick={() => onSelect(shape.id)}
              >
                {shapeLabel(shape)}
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}

export function Inspector({
  hasShapes,
  selected,
  sizeError,
  onCommit,
  onClearError,
}: {
  readonly hasShapes: boolean;
  readonly selected: EditorShape | null;
  readonly sizeError: string | null;
  readonly onCommit: (
    part: "width" | "height" | "depth",
    value: number,
  ) => boolean;
  readonly onClearError: () => void;
}) {
  if (!selected) {
    return (
      <aside className="uvcp-inspector">
        <p className="uvcp-inspector-empty">
          {hasShapes ? "Select a shape." : "Add a rectangle or a box."}
        </p>
      </aside>
    );
  }
  return (
    <aside className="uvcp-inspector">
      <h2>{shapeLabel(selected)}</h2>
      <p className="uvcp-units">Scene units.</p>
      <div className="uvcp-fields">
        <MeasureField
          label="Width"
          value={selected.width}
          onCommit={(value) => onCommit("width", value)}
          onClearError={onClearError}
        />
        <MeasureField
          label="Height"
          value={selected.height}
          onCommit={(value) => onCommit("height", value)}
          onClearError={onClearError}
        />
        {selected.depth === null ? null : (
          <MeasureField
            label="Depth"
            value={selected.depth}
            onCommit={(value) => onCommit("depth", value)}
            onClearError={onClearError}
          />
        )}
      </div>
      {sizeError ? (
        <p id="uvcp-size-error" className="uvcp-size-error" role="alert">
          {sizeError}
        </p>
      ) : null}
    </aside>
  );
}

function MeasureField({
  label,
  value,
  onCommit,
  onClearError,
}: {
  readonly label: string;
  readonly value: number;
  readonly onCommit: (value: number) => boolean;
  readonly onClearError: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const dirty = useRef(false);
  const commit = useRef<(current: string) => boolean>(() => true);
  const [text, setText] = useState(() => formatMeasure(value));

  useEffect(() => {
    dirty.current = false;
    setText(formatMeasure(value));
  }, [value]);

  commit.current = (current: string) => {
    if (!dirty.current) {
      return true;
    }
    dirty.current = false;
    const parsed = readMeasure(current);
    if (parsed === "invalid") {
      setText(formatMeasure(value));
      return onCommit(Number.NaN);
    }
    if (parsed === value) {
      setText(formatMeasure(value));
      onClearError();
      return true;
    }
    const accepted = onCommit(parsed);
    if (!accepted) {
      setText(formatMeasure(value));
    }
    return accepted;
  };

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const field = input.current;
      if (
        !field ||
        document.activeElement !== field ||
        event.target === field
      ) {
        return;
      }
      if (!commit.current(field.value)) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  return (
    <label
      className={
        label === "Depth" ? "uvcp-field uvcp-field-depth" : "uvcp-field"
      }
    >
      <span>{label}</span>
      <input
        ref={input}
        value={text}
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        onFocus={onClearError}
        onChange={(event) => {
          dirty.current = true;
          setText(event.target.value);
        }}
        onBlur={(event) => {
          commit.current(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit.current(event.currentTarget.value);
          } else if (event.key === "Escape") {
            event.preventDefault();
            dirty.current = false;
            setText(formatMeasure(value));
            onClearError();
            event.currentTarget.blur();
          }
        }}
      />
    </label>
  );
}

function readMeasure(text: string): number | "invalid" {
  const trimmed = text.trim();
  if (trimmed === "") {
    return "invalid";
  }
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : "invalid";
}

function formatMeasure(value: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }
  const normal = value === 0 ? 0 : value;
  // Thousandths are finer than a pixel on the page, and raw pointer
  // values are unreadable in the field.
  return String(Math.round(normal * 1000) / 1000);
}

import { assistantMessages } from "@uvcp/ai";
import {
  addShape,
  applyAssistantActions,
  boxShift,
  commitPresent,
  createHistory,
  deleteSelected,
  dragPosition,
  type EditorHistory,
  type EditorShape,
  editorErrorMessage,
  exportDocument,
  moveShape,
  openDocument,
  redo,
  replacePresent,
  resizeShape,
  rotateShape,
  SCENE_BYTE_LIMIT,
  SCENE_TOO_LARGE,
  selectShape,
  shapesOf,
  undo,
} from "@uvcp/editor";
import { strings } from "@uvcp/ui";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import {
  AssistantSetup,
  loadAssistantStatus,
  type SavedAssistant,
} from "./assistant-setup.tsx";

const VIEW_WIDTH = 960;
const VIEW_HEIGHT = 600;

type AssistantGate =
  | { readonly kind: "checking" }
  | ({ readonly kind: "ready" } & SavedAssistant)
  | { readonly kind: "needed" };

type Gesture = {
  readonly base: EditorHistory;
  readonly id: string;
  readonly originX: number;
  readonly originY: number;
  readonly startX: number;
  readonly startY: number;
  x: number;
  y: number;
};

export function CreationApp() {
  const [history, setHistory] = useState<EditorHistory>(createHistory);
  const [notice, setNotice] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [pending, setPending] = useState(false);
  const [gate, setGate] = useState<AssistantGate>({ kind: "checking" });
  const [setupOpen, setSetupOpen] = useState(false);
  const surface = useRef<SVGSVGElement | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const historyRef = useRef(history);
  const pendingRef = useRef(false);
  historyRef.current = history;
  const shapes = shapesOf(history.present);
  const assistantReady = gate.kind === "ready" && !setupOpen;
  const showSetup = gate.kind === "needed" || setupOpen;
  const selected =
    shapes.find((shape) => shape.id === history.present.selectedId) ?? null;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (pendingRef.current || isTyping(event.target)) {
        return;
      }
      const current = historyRef.current;
      if (event.key === "Delete" || event.key === "Backspace") {
        setHistory(commitPresent(current, deleteSelected(current.present)));
        setNotice(null);
      } else if (
        event.ctrlKey &&
        event.key.toLowerCase() === "z" &&
        !event.shiftKey
      ) {
        setHistory(undo(current));
        setNotice(null);
      } else if (
        event.ctrlKey &&
        (event.key.toLowerCase() === "y" ||
          (event.shiftKey && event.key.toLowerCase() === "z"))
      ) {
        setHistory(redo(current));
        setNotice(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    let live = true;
    loadAssistantStatus()
      .then((status) => {
        if (!live) {
          return;
        }
        setGate(
          status.configured
            ? {
                kind: "ready",
                provider: status.provider,
                model: status.model,
                credential: status.credential,
              }
            : { kind: "needed" },
        );
      })
      .catch(() => {
        if (!live) {
          return;
        }
        setGate({ kind: "needed" });
        setNotice(assistantMessages.reachServer);
      });
    return () => {
      live = false;
    };
  }, []);

  function show(next: EditorHistory, message: string | null = null) {
    setHistory(next);
    setNotice(message);
  }

  async function ask(event: { preventDefault(): void }) {
    event.preventDefault();
    const text = instruction.trim();
    if (text.length === 0) {
      setNotice(assistantMessages.emptyInstruction);
      return;
    }
    pendingRef.current = true;
    gesture.current = null;
    setPending(true);
    setNotice(assistantMessages.working);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          instruction: text,
          facts: shapes.map((shape) => ({
            id: shape.id,
            kind: shape.kind,
            x: shape.x,
            y: shape.y,
            width: shape.width,
            height: shape.height,
            depth: shape.depth,
            rotation: shape.rotation,
          })),
        }),
      });
      const body: unknown = await response.json();
      if (!isAssistantResult(body)) {
        setNotice(assistantMessages.badRequest);
        return;
      }
      if (!body.ok) {
        if (body.message === assistantMessages.needsSetup) {
          setGate({ kind: "needed" });
          setSetupOpen(true);
        }
        setNotice(body.message ?? assistantMessages.providerDown);
        return;
      }
      const applied = applyAssistantActions(historyRef.current, body.actions);
      show(applied.history, applied.ok ? applied.summary : applied.message);
    } catch {
      setNotice(assistantMessages.reachServer);
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  return (
    <div className="uvcp-editor">
      <header className="uvcp-editor-bar">
        <h1>{strings.productName}</h1>
        {assistantReady ? (
          <form
            className="uvcp-editor-ask"
            onSubmit={(event) => void ask(event)}
          >
            <label>
              Describe a change
              <textarea
                rows={2}
                value={instruction}
                disabled={pending}
                onChange={(event) => setInstruction(event.target.value)}
              />
            </label>
            <button type="submit" disabled={pending}>
              Apply
            </button>
          </form>
        ) : (
          <p className="uvcp-editor-ask">
            {gate.kind === "checking"
              ? "Checking the assistant."
              : gate.kind === "ready"
                ? "The current choice stays in use until you save or cancel."
                : "Choose a provider below before describing a change."}
          </p>
        )}
        {gate.kind === "ready" && !setupOpen ? (
          <button type="button" onClick={() => setSetupOpen(true)}>
            AI setup
          </button>
        ) : null}
        <button
          type="button"
          disabled={pending}
          onClick={() => show(addShape(history, "rectangle"))}
        >
          Rectangle
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => show(addShape(history, "box"))}
        >
          Box
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            show(commitPresent(history, deleteSelected(history.present)))
          }
        >
          Delete
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => show(undo(history))}
        >
          Undo
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => show(redo(history))}
        >
          Redo
        </button>
        <button type="button" disabled={pending} onClick={() => save(history)}>
          Save
        </button>
        <label className="uvcp-editor-open">
          Open
          <input
            type="file"
            accept="application/json,.json"
            disabled={pending}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (file) {
                void readFile(history, file).then((opened) => {
                  show(opened.history, opened.message);
                });
              }
            }}
          />
        </label>
      </header>
      {showSetup ? (
        <AssistantSetup
          saved={
            gate.kind === "ready"
              ? {
                  provider: gate.provider,
                  model: gate.model,
                  credential: gate.credential,
                }
              : null
          }
          onConfigured={(choice) => {
            setGate({ kind: "ready", ...choice });
            setSetupOpen(false);
            setNotice(assistantMessages.ready);
          }}
          onClose={gate.kind === "ready" ? () => setSetupOpen(false) : null}
        />
      ) : null}
      <div className="uvcp-editor-body">
        <svg
          ref={surface}
          className="uvcp-editor-surface"
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          role="application"
          aria-label="Scene"
          onPointerDown={(event) => {
            if (pendingRef.current) {
              return;
            }
            if (event.target === event.currentTarget) {
              gesture.current = null;
              show(replacePresent(history, selectShape(history.present, null)));
            }
          }}
        >
          {shapes.map((shape) => (
            <ShapeView
              key={shape.id}
              shape={shape}
              selected={shape.id === history.present.selectedId}
              onPointerDown={(event) => {
                if (pendingRef.current) {
                  return;
                }
                const point = svgPoint(surface.current, event);
                const base = replacePresent(
                  history,
                  selectShape(history.present, shape.id),
                );
                gesture.current = {
                  base,
                  id: shape.id,
                  originX: shape.x,
                  originY: shape.y,
                  startX: point.x,
                  startY: point.y,
                  x: shape.x,
                  y: shape.y,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
                show(base);
              }}
              onPointerMove={(event) => {
                const active = gesture.current;
                if (pendingRef.current || !active || active.id !== shape.id) {
                  return;
                }
                const point = svgPoint(surface.current, event);
                const next = dragPosition(
                  { x: active.originX, y: active.originY },
                  { x: active.startX, y: active.startY },
                  point,
                );
                active.x = next.x;
                active.y = next.y;
                show(
                  replacePresent(
                    active.base,
                    moveShape(active.base.present, active.id, next.x, next.y),
                  ),
                );
              }}
              onPointerUp={() => {
                const active = gesture.current;
                gesture.current = null;
                if (!active || pendingRef.current) {
                  return;
                }
                if (
                  active.x === active.originX &&
                  active.y === active.originY
                ) {
                  return;
                }
                const current = historyRef.current;
                show(
                  commitPresent(
                    current,
                    moveShape(current.present, active.id, active.x, active.y),
                  ),
                );
              }}
            />
          ))}
        </svg>
        <aside className="uvcp-editor-properties">
          {selected ? (
            <ShapeFields
              key={`${selected.id}:${selected.width}:${selected.height}:${selected.depth ?? ""}:${selected.rotation}`}
              shape={selected}
              disabled={pending}
              onResize={(id, width, height, depth, degrees) => {
                try {
                  const resized = resizeShape(
                    history.present,
                    id,
                    width,
                    height,
                    depth,
                  );
                  show(
                    commitPresent(history, rotateShape(resized, id, degrees)),
                  );
                } catch (error) {
                  setNotice(editorErrorMessage(error));
                }
              }}
            />
          ) : (
            <p>Select a shape.</p>
          )}
          {notice ? <p role="status">{notice}</p> : null}
        </aside>
      </div>
    </div>
  );
}

function ShapeView({
  shape,
  selected,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  readonly shape: EditorShape;
  readonly selected: boolean;
  readonly onPointerDown: (event: ReactPointerEvent<SVGGElement>) => void;
  readonly onPointerMove: (event: ReactPointerEvent<SVGGElement>) => void;
  readonly onPointerUp: () => void;
}) {
  const shift = shape.depth === null ? null : boxShift(shape.depth);
  const centerX = shape.x + shape.width / 2;
  const centerY = shape.y + shape.height / 2;
  return (
    <g
      transform={`rotate(${shape.rotation} ${centerX} ${centerY})`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {shift ? (
        <rect
          x={shape.x + shift.dx}
          y={shape.y + shift.dy}
          width={shape.width}
          height={shape.height}
          className="uvcp-shape-depth"
        />
      ) : null}
      <rect
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        className={selected ? "uvcp-shape uvcp-shape-selected" : "uvcp-shape"}
      >
        <title>{shape.id}</title>
      </rect>
    </g>
  );
}

function ShapeFields({
  shape,
  disabled,
  onResize,
}: {
  readonly shape: EditorShape;
  readonly disabled: boolean;
  readonly onResize: (
    id: string,
    width: number,
    height: number,
    depth: number | null,
    degrees: number,
  ) => void;
}) {
  const [width, setWidth] = useState(String(shape.width));
  const [height, setHeight] = useState(String(shape.height));
  const [depth, setDepth] = useState(
    shape.depth === null ? "" : String(shape.depth),
  );
  const [rotation, setRotation] = useState(String(shape.rotation));
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onResize(
          shape.id,
          Number(width),
          Number(height),
          shape.depth === null ? null : Number(depth),
          Number(rotation),
        );
      }}
    >
      <p>{shape.kind}</p>
      <label>
        Width
        <input
          value={width}
          disabled={disabled}
          onChange={(event) => setWidth(event.target.value)}
        />
      </label>
      <label>
        Height
        <input
          value={height}
          disabled={disabled}
          onChange={(event) => setHeight(event.target.value)}
        />
      </label>
      {shape.depth === null ? null : (
        <label>
          Depth
          <input
            value={depth}
            disabled={disabled}
            onChange={(event) => setDepth(event.target.value)}
          />
        </label>
      )}
      <label>
        Rotation
        <input
          value={rotation}
          disabled={disabled}
          onChange={(event) => setRotation(event.target.value)}
        />
      </label>
      <button type="submit" disabled={disabled}>
        Apply size
      </button>
    </form>
  );
}

function svgPoint(
  svg: SVGSVGElement | null,
  event: ReactPointerEvent<SVGElement>,
): { readonly x: number; readonly y: number } {
  if (!svg) {
    return { x: 0, y: 0 };
  }
  const matrix = svg.getScreenCTM();
  if (!matrix) {
    return { x: 0, y: 0 };
  }
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const local = point.matrixTransform(matrix.inverse());
  return { x: local.x, y: local.y };
}

function save(history: EditorHistory) {
  const bytes = exportDocument(history.present);
  const body = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(body).set(bytes);
  const url = URL.createObjectURL(
    new Blob([body], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "scene.json";
  link.click();
  URL.revokeObjectURL(url);
}

async function readFile(history: EditorHistory, file: File) {
  if (file.size > SCENE_BYTE_LIMIT) {
    return { history, message: SCENE_TOO_LARGE };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  return openDocument(history, bytes.byteLength, () => bytes);
}

function isAssistantResult(value: unknown): value is {
  readonly ok: boolean;
  readonly message?: string;
  readonly actions?: unknown;
} {
  return (
    value !== null &&
    typeof value === "object" &&
    "ok" in value &&
    typeof value.ok === "boolean"
  );
}

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

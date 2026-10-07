import {
  addShape,
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
  SCENE_BYTE_LIMIT,
  SCENE_TOO_LARGE,
  selectShape,
  shapesOf,
  undo,
} from "@uvcp/editor";
import { strings } from "@uvcp/ui";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";

const VIEW_WIDTH = 960;
const VIEW_HEIGHT = 600;

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
  const surface = useRef<SVGSVGElement | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const historyRef = useRef(history);
  historyRef.current = history;
  const shapes = shapesOf(history.present);
  const selected =
    shapes.find((shape) => shape.id === history.present.selectedId) ?? null;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTyping(event.target)) {
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

  function show(next: EditorHistory, message: string | null = null) {
    setHistory(next);
    setNotice(message);
  }

  return (
    <div className="uvcp-editor">
      <header className="uvcp-editor-bar">
        <h1>{strings.productName}</h1>
        <button
          type="button"
          onClick={() => show(addShape(history, "rectangle"))}
        >
          Rectangle
        </button>
        <button type="button" onClick={() => show(addShape(history, "box"))}>
          Box
        </button>
        <button
          type="button"
          onClick={() =>
            show(commitPresent(history, deleteSelected(history.present)))
          }
        >
          Delete
        </button>
        <button type="button" onClick={() => show(undo(history))}>
          Undo
        </button>
        <button type="button" onClick={() => show(redo(history))}>
          Redo
        </button>
        <button type="button" onClick={() => save(history)}>
          Save
        </button>
        <label className="uvcp-editor-open">
          Open
          <input
            type="file"
            accept="application/json,.json"
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
      <div className="uvcp-editor-body">
        <svg
          ref={surface}
          className="uvcp-editor-surface"
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          role="application"
          aria-label="Scene"
          onPointerDown={(event) => {
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
                const point = svgPoint(surface.current, event);
                gesture.current = {
                  base: history,
                  id: shape.id,
                  originX: shape.x,
                  originY: shape.y,
                  startX: point.x,
                  startY: point.y,
                  x: shape.x,
                  y: shape.y,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
                show(
                  replacePresent(
                    history,
                    selectShape(history.present, shape.id),
                  ),
                );
              }}
              onPointerMove={(event) => {
                const active = gesture.current;
                if (!active || active.id !== shape.id) {
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
                if (!active) {
                  return;
                }
                if (
                  active.x === active.originX &&
                  active.y === active.originY
                ) {
                  return;
                }
                show(
                  commitPresent(
                    active.base,
                    moveShape(
                      active.base.present,
                      active.id,
                      active.x,
                      active.y,
                    ),
                  ),
                );
              }}
            />
          ))}
        </svg>
        <aside className="uvcp-editor-properties">
          {selected ? (
            <ShapeFields
              key={selected.id}
              shape={selected}
              onResize={(id, width, height, depth) => {
                try {
                  show(
                    commitPresent(
                      history,
                      resizeShape(history.present, id, width, height, depth),
                    ),
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
  return (
    <g
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
  onResize,
}: {
  readonly shape: EditorShape;
  readonly onResize: (
    id: string,
    width: number,
    height: number,
    depth: number | null,
  ) => void;
}) {
  const [width, setWidth] = useState(String(shape.width));
  const [height, setHeight] = useState(String(shape.height));
  const [depth, setDepth] = useState(
    shape.depth === null ? "" : String(shape.depth),
  );
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onResize(
          shape.id,
          Number(width),
          Number(height),
          shape.depth === null ? null : Number(depth),
        );
      }}
    >
      <p>{shape.kind}</p>
      <label>
        Width
        <input
          value={width}
          onChange={(event) => setWidth(event.target.value)}
        />
      </label>
      <label>
        Height
        <input
          value={height}
          onChange={(event) => setHeight(event.target.value)}
        />
      </label>
      {shape.depth === null ? null : (
        <label>
          Depth
          <input
            value={depth}
            onChange={(event) => setDepth(event.target.value)}
          />
        </label>
      )}
      <button type="submit">Apply size</button>
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

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
  );
}

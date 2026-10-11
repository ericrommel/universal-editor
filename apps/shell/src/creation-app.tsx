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
  exportGltfFile,
  exportSelectedGltf,
  GLTF_BYTE_LIMIT,
  GLTF_TOO_LARGE,
  importGltfFile,
  moveShape,
  openDocument,
  redo,
  replacePresent,
  resizeShape,
  rotateShape,
  SCENE_BYTE_LIMIT,
  SCENE_TOO_LARGE,
  SHEET_HEIGHT,
  SHEET_WIDTH,
  selectShape,
  shapesOf,
  sheetShapes,
  undo,
} from "@uvcp/editor";
import { strings } from "@uvcp/ui";
import type { ReactNode, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { AssistantSetup, loadAssistantStatus } from "./assistant-setup.tsx";

const GUIDE_KEY = "uvcp-guide-v1";
const FILE_UNREADABLE =
  "That file could not be read. The scene was not changed.";

type AssistantGate =
  | { readonly kind: "checking" }
  | { readonly kind: "unavailable" }
  | { readonly kind: "off" }
  | { readonly kind: "ready"; readonly model: string };

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
  const [savedText, setSavedText] = useState(() => sceneText(createHistory()));
  const [anchored, setAnchored] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [pending, setPending] = useState(false);
  const [gate, setGate] = useState<AssistantGate>({ kind: "checking" });
  const [setupOpen, setSetupOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(guideIsOpen);
  const surface = useRef<SVGSVGElement | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const historyRef = useRef(history);
  const pendingRef = useRef(false);
  const readGeneration = useRef(0);
  const dirtyRef = useRef(false);
  historyRef.current = history;
  const shapes = shapesOf(history.present);
  const sheet = sheetShapes(history.present);
  const dirty = sceneText(history) !== savedText;
  dirtyRef.current = dirty;
  const assistantReady = gate.kind === "ready" && !setupOpen;
  const selected =
    shapes.find((shape) => shape.id === history.present.selectedId) ?? null;

  useEffect(() => {
    document.title = strings.productName;
  }, []);

  useEffect(() => {
    function onLeave(event: BeforeUnloadEvent) {
      if (!dirtyRef.current) {
        return;
      }
      event.preventDefault();
      // Current browsers prompt only when returnValue is set as well.
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, []);

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
            ? { kind: "ready", model: status.model }
            : { kind: "off" },
        );
      })
      .catch(() => {
        if (!live) {
          return;
        }
        setGate({ kind: "unavailable" });
      });
    return () => {
      live = false;
    };
  }, []);

  function show(next: EditorHistory, message: string | null = null) {
    setHistory(next);
    setNotice(message);
  }

  function currentRead(): number {
    readGeneration.current += 1;
    return readGeneration.current;
  }

  function readIsCurrent(generation: number): boolean {
    return generation === readGeneration.current;
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
          setGate({ kind: "off" });
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
            <Command
              label="Apply"
              tip="Ask the assistant to create, move, resize, or rotate."
              disabled={pending}
              onClick={() => undefined}
              submit
            />
          </form>
        ) : (
          <p className="uvcp-editor-ask">
            {gate.kind === "checking"
              ? "Checking the assistant."
              : "Add a shape with the buttons. AI is optional."}
          </p>
        )}
        <Command
          label="AI setup"
          tip={assistantTip(gate)}
          disabled={pending || gate.kind === "checking"}
          onClick={() => setSetupOpen(true)}
        />
        <Command
          label="Guide"
          tip="Show the short introduction again."
          disabled={pending}
          onClick={() => setGuideOpen(true)}
        />
        <Command
          label="Rectangle"
          tip="Add a rectangle to the page."
          disabled={pending}
          onClick={() => show(addShape(history, "rectangle"))}
        />
        <Command
          label="Box"
          tip="Add a box to the page."
          disabled={pending}
          onClick={() => show(addShape(history, "box"))}
        />
        <Command
          label="Delete"
          tip="Delete the selected shape."
          disabled={pending}
          onClick={() =>
            show(commitPresent(history, deleteSelected(history.present)))
          }
        />
        <Command
          label="Undo"
          tip="Undo the last change."
          disabled={pending}
          onClick={() => show(undo(history))}
        />
        <Command
          label="Redo"
          tip="Redo the change you undid."
          disabled={pending}
          onClick={() => show(redo(history))}
        />
        <Command
          label="Save"
          tip="Download the project as scene.json."
          disabled={pending}
          onClick={() =>
            saveProject(history, setSavedText, setAnchored, setNotice)
          }
        />
        <FileButton
          label="Open"
          tip="Open a scene.json file into this tab."
          accept="application/json,.json"
          inputLabel="Scene file"
          disabled={pending}
          onFile={(file) => {
            const generation = currentRead();
            void readSceneFile(
              file,
              generation,
              readIsCurrent,
              () => historyRef.current,
              show,
              setNotice,
              setSavedText,
              setAnchored,
            );
          }}
        />
        <FileButton
          label="Import glTF"
          tip="Add rectangles and boxes from a glTF file."
          accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
          inputLabel="glTF file"
          disabled={pending}
          onFile={(file) => {
            const generation = currentRead();
            void readGltfFile(
              file,
              generation,
              readIsCurrent,
              () => historyRef.current,
              show,
              setNotice,
            );
          }}
        />
        <Command
          label="Export glTF"
          tip="Download the project as scene.glb."
          disabled={pending}
          onClick={() => {
            void deliverGltf(history, false, setNotice);
          }}
        />
        <Command
          label="Export selection"
          tip={
            history.present.selectedId === null
              ? "Select a shape to export it."
              : "Download the selected shape as selection.glb."
          }
          disabled={pending || history.present.selectedId === null}
          onClick={() => {
            void deliverGltf(history, true, setNotice);
          }}
        />
      </header>
      <p className="uvcp-keep">{keepMessage(dirty, anchored)}</p>
      {guideOpen ? (
        <FirstGuide
          onDismiss={() => {
            rememberGuideDismissed();
            setGuideOpen(false);
          }}
        />
      ) : null}
      {setupOpen && gate.kind === "unavailable" ? (
        <AssistantUnavailable onClose={() => setSetupOpen(false)} />
      ) : null}
      {setupOpen && (gate.kind === "off" || gate.kind === "ready") ? (
        <AssistantSetup
          currentModel={gate.kind === "ready" ? gate.model : null}
          onConfigured={(model) => {
            setGate({ kind: "ready", model });
            setSetupOpen(false);
            setNotice(assistantMessages.ready);
          }}
          onClose={() => setSetupOpen(false)}
        />
      ) : null}
      <div className="uvcp-editor-body">
        <svg
          ref={surface}
          className="uvcp-editor-surface"
          viewBox={`0 0 ${SHEET_WIDTH} ${SHEET_HEIGHT}`}
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
          {sheet.map((shape) => (
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
            <p>
              {shapes.length === 0
                ? "Add a rectangle or a box."
                : "Select a shape."}
            </p>
          )}
          {notice ? <p role="status">{notice}</p> : null}
        </aside>
      </div>
    </div>
  );
}

function Command({
  label,
  tip,
  disabled,
  onClick,
  submit = false,
}: {
  readonly label: string;
  readonly tip: string;
  readonly disabled: boolean;
  readonly onClick: () => void;
  readonly submit?: boolean;
}) {
  return (
    <Tip text={tip}>
      {(id) => (
        <button
          type={submit ? "submit" : "button"}
          aria-describedby={id}
          disabled={disabled}
          onClick={submit ? undefined : onClick}
        >
          {label}
        </button>
      )}
    </Tip>
  );
}

function FileButton({
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
          <input
            ref={input}
            className="uvcp-file-input"
            type="file"
            accept={accept}
            aria-label={inputLabel}
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

function Tip({
  text,
  children,
}: {
  readonly text: string;
  readonly children: (describedBy: string) => ReactNode;
}) {
  const id = useId();
  return (
    <span className="uvcp-tip">
      {children(id)}
      <span id={id} role="tooltip" className="uvcp-tip-bubble">
        {text}
      </span>
    </span>
  );
}

function FirstGuide({ onDismiss }: { readonly onDismiss: () => void }) {
  return (
    <section className="uvcp-guide" aria-labelledby="uvcp-guide-title">
      <h2 id="uvcp-guide-title">Start with a shape</h2>
      <ol>
        <li>Choose Rectangle or Box, then drag the shape to move it.</li>
        <li>Select a shape and edit its size. Rotation is in degrees.</li>
        <li>
          Save downloads scene.json. This tab keeps the project until you leave
          or refresh. Open reads a scene file back.
        </li>
        <li>
          Import glTF and Export glTF move rectangles and boxes to another tool.
        </li>
        <li>
          AI setup is optional. On the hosted page it stays off. In the local
          application you can choose a provider.
        </li>
      </ol>
      <button type="button" onClick={onDismiss}>
        Start creating
      </button>
    </section>
  );
}

function AssistantUnavailable({ onClose }: { readonly onClose: () => void }) {
  return (
    <section className="uvcp-ai-setup" aria-labelledby="uvcp-ai-unavailable">
      <h2 id="uvcp-ai-unavailable">Assistant</h2>
      <p>
        The assistant runs in the local application on this computer. This page
        does not ask for a provider key. Rectangle, Box, Save, Open, and glTF
        keep working.
      </p>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </section>
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
  const [rotation, setRotation] = useState(formatDegrees(shape.rotation));
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
        Rotation (degrees)
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

function saveProject(
  history: EditorHistory,
  setSavedText: (text: string) => void,
  setAnchored: (anchored: boolean) => void,
  setNotice: (message: string | null) => void,
) {
  const bytes = exportDocument(history.present);
  download(bytes, "scene.json", "application/json");
  setSavedText(new TextDecoder().decode(bytes));
  setAnchored(true);
  setNotice(
    "Downloaded scene.json. Keep that file. This page does not store the project.",
  );
}

async function readSceneFile(
  file: File,
  generation: number,
  readIsCurrent: (generation: number) => boolean,
  latest: () => EditorHistory,
  show: (next: EditorHistory, message?: string | null) => void,
  setNotice: (message: string | null) => void,
  setSavedText: (text: string) => void,
  setAnchored: (anchored: boolean) => void,
) {
  try {
    if (file.size > SCENE_BYTE_LIMIT) {
      if (readIsCurrent(generation)) {
        setNotice(SCENE_TOO_LARGE);
      }
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!readIsCurrent(generation)) {
      return;
    }
    const opened = openDocument(latest(), bytes.byteLength, () => bytes);
    if (!readIsCurrent(generation)) {
      return;
    }
    if (opened.message !== null) {
      setNotice(opened.message);
      return;
    }
    setSavedText(sceneText(opened.history));
    setAnchored(true);
    show(opened.history, "Opened the scene.");
  } catch {
    if (readIsCurrent(generation)) {
      setNotice(FILE_UNREADABLE);
    }
  }
}

async function readGltfFile(
  file: File,
  generation: number,
  readIsCurrent: (generation: number) => boolean,
  latest: () => EditorHistory,
  show: (next: EditorHistory, message?: string | null) => void,
  setNotice: (message: string | null) => void,
) {
  try {
    if (file.size > GLTF_BYTE_LIMIT) {
      if (readIsCurrent(generation)) {
        setNotice(GLTF_TOO_LARGE);
      }
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!readIsCurrent(generation)) {
      return;
    }
    // The parser yields. If the scene changed during that wait, commit
    // the imported document onto the newer history.
    const base = latest();
    const imported = await importGltfFile(base, bytes);
    if (!readIsCurrent(generation)) {
      return;
    }
    if (imported.history === base) {
      setNotice(imported.message);
      return;
    }
    const current = latest();
    const next =
      current === base
        ? imported.history
        : commitPresent(current, imported.history.present);
    show(next, imported.message);
  } catch {
    if (readIsCurrent(generation)) {
      setNotice(FILE_UNREADABLE);
    }
  }
}

async function deliverGltf(
  history: EditorHistory,
  selection: boolean,
  setNotice: (message: string | null) => void,
) {
  const result = selection
    ? await exportSelectedGltf(history.present)
    : await exportGltfFile(history.present);
  if (result.bytes === null) {
    setNotice(result.message);
    return;
  }
  const name = selection ? "selection.glb" : "scene.glb";
  download(result.bytes, name, "model/gltf-binary");
  setNotice(`Downloaded ${name}. Save still downloads the project.`);
}

function sceneText(history: EditorHistory): string {
  return new TextDecoder().decode(exportDocument(history.present));
}

function keepMessage(dirty: boolean, anchored: boolean): string {
  if (dirty) {
    return "Unsaved changes stay in this tab until you download them.";
  }
  if (anchored) {
    return "This tab matches the scene file you opened or downloaded. The page does not store the project.";
  }
  return "Save downloads scene.json. Until then, the project stays in this tab.";
}

function guideIsOpen(): boolean {
  try {
    return localStorage.getItem(GUIDE_KEY) !== "dismissed";
  } catch {
    // Private mode can throw. Show the guide for this visit.
    return true;
  }
}

function rememberGuideDismissed(): void {
  try {
    localStorage.setItem(GUIDE_KEY, "dismissed");
  } catch {
    // The guide can still close in this tab when storage is blocked.
  }
}

function assistantTip(gate: AssistantGate): string {
  switch (gate.kind) {
    case "checking":
      return "Checking whether the assistant is available.";
    case "unavailable":
      return "The assistant runs only in the local application.";
    case "off":
      return "Choose a provider. The editor still works without one.";
    case "ready":
      return "Change the assistant provider. The editor still works without one.";
  }
}

function formatDegrees(degrees: number): string {
  const rounded = Math.round(degrees * 1000) / 1000;
  return String(rounded);
}

function download(bytes: Uint8Array, name: string, type: string) {
  const body = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(body).set(bytes);
  const url = URL.createObjectURL(new Blob([body], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
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

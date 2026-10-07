import { assistantMessages } from "@uvcp/ai";
import {
  addShape,
  applyAssistantActions,
  commitPresent,
  createHistory,
  deleteSelected,
  type EditorHistory,
  type EditorShape,
  editorErrorMessage,
  exportDocument,
  openDocument,
  placeShape,
  redo,
  replacePresent,
  rotateShape,
  SCENE_BYTE_LIMIT,
  SCENE_TOO_LARGE,
  type ShapeKind,
  selectShape,
  shapesOf,
  undo,
} from "@uvcp/editor";
import { strings } from "@uvcp/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { Inspector, ObjectList } from "./inspector.tsx";
import { SceneStage } from "./scene-stage.tsx";

type BarMessage = {
  readonly tone: "error" | "status";
  readonly text: string;
};

type MeasurePart = "width" | "height" | "depth" | "rotation";

export function CreationApp() {
  const [history, setHistory] = useState<EditorHistory>(createHistory);
  const [sizeNotice, setSizeNotice] = useState<string | null>(null);
  const [fileMessage, setFileMessage] = useState<BarMessage | null>(null);
  const [instruction, setInstruction] = useState("");
  const [askNotice, setAskNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const historyRef = useRef(history);
  const pendingRef = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const openGeneration = useRef(0);
  historyRef.current = history;
  pendingRef.current = pending;
  const shapes = shapesOf(history.present);
  const selected =
    shapes.find((shape) => shape.id === history.present.selectedId) ?? null;

  const show = useCallback((next: EditorHistory) => {
    const sceneChanged =
      next.present.scene !== historyRef.current.present.scene;
    historyRef.current = next;
    setHistory(next);
    if (sceneChanged) {
      setSizeNotice(null);
      setFileMessage(null);
      setAskNotice(null);
    }
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (pendingRef.current || isTyping(event.target)) {
        return;
      }
      const current = historyRef.current;
      const key = event.key.toLowerCase();
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        show(commitPresent(current, deleteSelected(current.present)));
      } else if (event.key === "Escape") {
        show(replacePresent(current, selectShape(current.present, null)));
      } else if (event.ctrlKey && key === "z" && !event.shiftKey) {
        event.preventDefault();
        show(undo(current));
      } else if (
        event.ctrlKey &&
        (key === "y" || (event.shiftKey && key === "z"))
      ) {
        event.preventDefault();
        show(redo(current));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [show]);

  function create(kind: ShapeKind) {
    if (pendingRef.current) {
      return;
    }
    show(addShape(historyRef.current, kind));
  }

  function commitMeasure(part: MeasurePart, value: number): boolean {
    const current = historyRef.current;
    const shape = shapesOf(current.present).find(
      (item) => item.id === current.present.selectedId,
    );
    if (!shape) {
      return false;
    }
    if (!Number.isFinite(value)) {
      setSizeNotice("Enter a number.");
      return false;
    }
    if (part === "rotation") {
      if (value === shape.rotation) {
        setSizeNotice(null);
        return true;
      }
      try {
        show(
          commitPresent(current, rotateShape(current.present, shape.id, value)),
        );
        return true;
      } catch (error) {
        setSizeNotice(editorErrorMessage(error));
        return false;
      }
    }
    if (!(value > 0)) {
      setSizeNotice(extentMessage(shape));
      return false;
    }
    const frame = {
      x: shape.x,
      y: shape.y,
      width: part === "width" ? value : shape.width,
      height: part === "height" ? value : shape.height,
    };
    const depth = part === "depth" ? value : shape.depth;
    try {
      const next = placeShape(current.present, shape.id, frame, depth);
      if (next.scene === current.present.scene) {
        setSizeNotice(null);
        return true;
      }
      show(commitPresent(current, next));
      return true;
    } catch (error) {
      setSizeNotice(extentMessage(shape, error));
      return false;
    }
  }

  async function ask(event: { preventDefault(): void }) {
    event.preventDefault();
    const text = instruction.trim();
    if (text.length === 0) {
      setAskNotice(assistantMessages.emptyInstruction);
      return;
    }
    const facts = shapesOf(historyRef.current.present).map((shape) => ({
      id: shape.id,
      kind: shape.kind,
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
      depth: shape.depth,
      rotation: shape.rotation,
    }));
    pendingRef.current = true;
    setPending(true);
    setAskNotice(assistantMessages.working);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ instruction: text, facts }),
      });
      const body: unknown = await response.json();
      if (!isAssistantResult(body)) {
        setAskNotice(assistantMessages.badRequest);
        return;
      }
      if (!body.ok) {
        setAskNotice(body.message ?? assistantMessages.providerDown);
        return;
      }
      const applied = applyAssistantActions(historyRef.current, body.actions);
      if (!applied.ok) {
        setAskNotice(applied.message);
        return;
      }
      show(applied.history);
      setAskNotice(applied.summary);
    } catch {
      setAskNotice(assistantMessages.reachServer);
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  return (
    <div className="uvcp-editor">
      <header className="uvcp-command">
        <p className="uvcp-product" title={strings.productName}>
          {strings.productName}
        </p>
        <div className="uvcp-command-group" role="toolbar" aria-label="Create">
          <button
            type="button"
            disabled={pending}
            onClick={() => create("rectangle")}
          >
            Rectangle
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => create("box")}
          >
            Box
          </button>
        </div>
        <div className="uvcp-command-group" role="toolbar" aria-label="History">
          <button
            type="button"
            title="Undo (Ctrl+Z)"
            disabled={pending || history.past.length === 0}
            onClick={() => show(undo(historyRef.current))}
          >
            Undo
          </button>
          <button
            type="button"
            title="Redo (Ctrl+Y)"
            disabled={pending || history.future.length === 0}
            onClick={() => show(redo(historyRef.current))}
          >
            Redo
          </button>
        </div>
        <div className="uvcp-command-group">
          <button
            type="button"
            title="Delete (Delete)"
            disabled={pending || selected === null}
            onClick={() =>
              show(
                commitPresent(
                  historyRef.current,
                  deleteSelected(historyRef.current.present),
                ),
              )
            }
          >
            Delete
          </button>
        </div>
        <div className="uvcp-command-group uvcp-file-group">
          {fileMessage ? (
            <p
              className={
                fileMessage.tone === "error"
                  ? "uvcp-file-message is-error"
                  : "uvcp-file-message"
              }
              role={fileMessage.tone === "error" ? "alert" : "status"}
              title={fileMessage.text}
            >
              {fileMessage.text}
            </p>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              const input = fileInput.current;
              input?.click();
              input?.blur();
            }}
          >
            Open
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              save(historyRef.current);
              setFileMessage({ tone: "status", text: "Saved scene.json" });
            }}
          >
            Save
          </button>
          <input
            ref={fileInput}
            className="uvcp-file-input"
            type="file"
            accept="application/json,.json"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (!file) {
                return;
              }
              const generation = openGeneration.current + 1;
              openGeneration.current = generation;
              void readFile(historyRef.current, file)
                .then((opened) => {
                  if (generation !== openGeneration.current) {
                    return;
                  }
                  if (opened.message) {
                    setFileMessage({
                      tone: "error",
                      text: fileError(opened.message),
                    });
                    return;
                  }
                  show(opened.history);
                  setFileMessage({
                    tone: "status",
                    text: `Opened ${file.name}`,
                  });
                })
                .catch(() => {
                  if (generation !== openGeneration.current) {
                    return;
                  }
                  setFileMessage({
                    tone: "error",
                    text: "That file isn't valid scene JSON. The scene was not changed.",
                  });
                });
            }}
          />
        </div>
      </header>
      <form className="uvcp-ask" onSubmit={(event) => void ask(event)}>
        <label>
          Describe a change
          <textarea
            rows={1}
            value={instruction}
            disabled={pending}
            onChange={(event) => setInstruction(event.target.value)}
          />
        </label>
        <button type="submit" disabled={pending}>
          Apply
        </button>
        {askNotice ? (
          <p className="uvcp-ask-status" role="status" title={askNotice}>
            {askNotice}
          </p>
        ) : null}
      </form>
      <div className="uvcp-workspace">
        <ObjectList
          shapes={shapes}
          selectedId={history.present.selectedId}
          disabled={pending}
          onSelect={(id) =>
            show(
              replacePresent(
                historyRef.current,
                selectShape(historyRef.current.present, id),
              ),
            )
          }
        />
        <SceneStage
          shapes={shapes}
          selectedId={history.present.selectedId}
          isBlocked={() => pendingRef.current}
          getHistory={() => historyRef.current}
          onShow={show}
        />
        <Inspector
          hasShapes={shapes.length > 0}
          selected={selected}
          disabled={pending}
          sizeError={sizeNotice}
          onCommit={commitMeasure}
          onClearError={() => setSizeNotice(null)}
        />
      </div>
    </div>
  );
}

function extentMessage(shape: EditorShape, error?: unknown): string {
  if (error !== undefined && !isExtentOrNumber(error)) {
    return editorErrorMessage(error);
  }
  return shape.kind === "box"
    ? "Width, height, and depth have to be greater than zero."
    : "Width and height have to be greater than zero.";
}

function isExtentOrNumber(error: unknown): boolean {
  const message = editorErrorMessage(error);
  return (
    message === "Scene extent is not accepted." ||
    message === "Expected a finite number."
  );
}

function fileError(message: string): string {
  if (
    message === "Scene document is not valid JSON." ||
    message === "Scene document contains a duplicate key." ||
    message === "Scene document is not UTF-8 text."
  ) {
    return "That file isn't valid scene JSON. The scene was not changed.";
  }
  if (message === "Scene document is empty.") {
    return "That file is empty. The scene was not changed.";
  }
  if (message === SCENE_TOO_LARGE) {
    return message;
  }
  return "That file doesn't contain shapes this editor can read. The scene was not changed.";
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
    target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
  );
}

import { assistantMessages } from "@uvcp/ai";
import {
  addShape,
  applyAssistantActions,
  canDelete,
  canRedo,
  canUndo,
  commitPresent,
  createHistory,
  deleteSelected,
  type EditorHistory,
  type EditorShape,
  editorErrorMessage,
  exportDocument,
  exportGltfFile,
  exportReadableDocument,
  exportSelectedGltf,
  GLTF_BYTE_LIMIT,
  GLTF_TOO_LARGE,
  importGltfFile,
  openDocument,
  placeShape,
  redo,
  replacePresent,
  rotateShape,
  SCENE_BYTE_LIMIT,
  SCENE_TOO_LARGE,
  selectShape,
  sheetShapes,
  undo,
} from "@uvcp/editor";
import { strings } from "@uvcp/ui";
import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AssistantSetup, loadAssistantStatus } from "./assistant-setup.tsx";
import { Inspector, ObjectList } from "./inspector.tsx";
import { SceneStage } from "./scene-stage.tsx";
import { shapeLabel } from "./shape-label.ts";

const GUIDE_KEY = "uvcp-guide-v2";
const FILE_UNREADABLE =
  "That file could not be read. The scene was not changed.";
const SAMPLE_FAILED =
  "The sample file could not be loaded. The scene was not changed.";
const AI_CHECKING = "Checking whether AI is available in this session.";
const AI_UNAVAILABLE =
  "AI is not available on this page. Drawing, save, and open still work. To use AI, run the local application.";
const AI_OFF =
  "AI is off. Open AI setup and choose a provider, or keep drawing without it.";
const AI_SETUP_OPEN = "AI setup is open. Drawing still works.";

type AssistantGate =
  | { readonly kind: "checking" }
  | { readonly kind: "unavailable" }
  | { readonly kind: "off" }
  | { readonly kind: "ready"; readonly model: string };

type Notice = {
  readonly tone: "error" | "status";
  readonly text: string;
};

type Panel = "guide" | "setup";

type MeasurePart = "width" | "height" | "depth" | "rotation";

export function CreationApp() {
  const [history, setHistory] = useState<EditorHistory>(createHistory);
  const [savedText, setSavedText] = useState(() => sceneText(createHistory()));
  const [notice, setNotice] = useState<Notice | null>(null);
  const [sizeNotice, setSizeNotice] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [pending, setPending] = useState(false);
  const [gate, setGate] = useState<AssistantGate>({ kind: "checking" });
  const [panel, setPanel] = useState<Panel | null>(
    guideIsOpen() ? "guide" : null,
  );
  const pendingRef = useRef(false);
  const historyRef = useRef(history);
  const readGeneration = useRef(0);
  const dirtyRef = useRef(false);
  historyRef.current = history;
  const shapes = sheetShapes(history.present);
  const dirty = sceneText(history) !== savedText;
  dirtyRef.current = dirty;
  const selected =
    shapes.find((shape) => shape.id === history.present.selectedId) ?? null;
  const undoable = canUndo(history);
  const redoable = canRedo(history);
  const removable = canDelete(history.present);

  const show = useCallback((next: EditorHistory) => {
    const sceneChanged =
      next.present.scene !== historyRef.current.present.scene;
    historyRef.current = next;
    setHistory(next);
    if (sceneChanged) {
      setSizeNotice(null);
    }
  }, []);

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
      const key = event.key.toLowerCase();
      if (event.key === "Delete" || event.key === "Backspace") {
        if (!canDelete(current.present)) {
          return;
        }
        event.preventDefault();
        show(commitPresent(current, deleteSelected(current.present)));
        setNotice(null);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        show(replacePresent(current, selectShape(current.present, null)));
        return;
      }
      if (!event.ctrlKey) {
        return;
      }
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        if (canUndo(current)) {
          show(undo(current));
          setNotice(null);
        }
        return;
      }
      if (key === "y" || (event.shiftKey && key === "z")) {
        event.preventDefault();
        if (canRedo(current)) {
          show(redo(current));
          setNotice(null);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [show]);

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

  function currentRead(): number {
    readGeneration.current += 1;
    return readGeneration.current;
  }

  function readIsCurrent(generation: number): boolean {
    return generation === readGeneration.current;
  }

  function report(tone: Notice["tone"], text: string) {
    setNotice({ tone, text });
  }

  function openGuide() {
    setPanel("guide");
  }

  function openSetup() {
    setPanel("setup");
  }

  function closeGuide() {
    rememberGuideDismissed();
    setPanel((current) => (current === "guide" ? null : current));
  }

  function commitMeasure(part: MeasurePart, value: number): boolean {
    const current = historyRef.current;
    const shape = sheetShapes(current.present).find(
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
      report("error", assistantMessages.emptyInstruction);
      return;
    }
    pendingRef.current = true;
    setPending(true);
    report("status", assistantMessages.working);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          instruction: text,
          // The same sheet numbers the page and the inspector show.
          facts: sheetShapes(historyRef.current.present).map((shape) => ({
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
        report("error", assistantMessages.badRequest);
        return;
      }
      if (!body.ok) {
        if (body.message === assistantMessages.needsSetup) {
          setGate({ kind: "off" });
          setPanel("setup");
        }
        report("error", body.message ?? assistantMessages.providerDown);
        return;
      }
      const applied = applyAssistantActions(historyRef.current, body.actions);
      if (!applied.ok) {
        report("error", applied.message);
        return;
      }
      show(applied.history);
      report("status", applied.summary);
    } catch {
      report("error", assistantMessages.reachServer);
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  return (
    <div className="uvcp-editor">
      <header className="uvcp-command">
        <h1 className="uvcp-product">{strings.productName}</h1>
        <div className="uvcp-command-group" role="toolbar" aria-label="Create">
          <span className="uvcp-group-label">Create</span>
          <button
            type="button"
            disabled={pending}
            onClick={() => show(addShape(historyRef.current, "rectangle"))}
          >
            Rectangle
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => show(addShape(historyRef.current, "box"))}
          >
            Box
          </button>
        </div>
        <div className="uvcp-command-group" role="toolbar" aria-label="Edit">
          <span className="uvcp-group-label">Edit</span>
          <button
            type="button"
            title="Undo (Ctrl+Z)"
            disabled={pending || !undoable}
            onClick={() => {
              show(undo(historyRef.current));
              setNotice(null);
            }}
          >
            Undo
          </button>
          <button
            type="button"
            title="Redo (Ctrl+Y)"
            disabled={pending || !redoable}
            onClick={() => {
              show(redo(historyRef.current));
              setNotice(null);
            }}
          >
            Redo
          </button>
          <button
            type="button"
            title={
              selected
                ? `Delete ${shapeLabel(selected)}`
                : "Select an object to delete it."
            }
            disabled={pending || !removable}
            onClick={() => {
              show(
                commitPresent(
                  historyRef.current,
                  deleteSelected(historyRef.current.present),
                ),
              );
              setNotice(null);
            }}
          >
            Delete
          </button>
        </div>
        <div
          className="uvcp-command-group uvcp-file-group"
          role="toolbar"
          aria-label="File"
        >
          <span className="uvcp-group-label">File</span>
          <Tip text="Download the project as scene.json.">
            {(id) => (
              <button
                type="button"
                aria-describedby={id}
                disabled={pending}
                onClick={() => {
                  saveProject(historyRef.current, setSavedText);
                  report(
                    "status",
                    "Downloaded scene.json. Keep that file. This page does not store the project.",
                  );
                }}
              >
                Save
              </button>
            )}
          </Tip>
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
                report,
                setSavedText,
              );
            }}
          />
          <details className="uvcp-disclosure">
            <summary>3D file</summary>
            <div className="uvcp-disclosure-panel">
              <p>
                Moves rectangles and boxes to another tool. Drawing does not
                need this.
              </p>
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
                    report,
                  );
                }}
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  void deliverGltf(historyRef.current, false, report);
                }}
              >
                Export glTF
              </button>
              <button
                type="button"
                title={
                  selected
                    ? "Download the selected object as selection.glb."
                    : "Select an object to export it."
                }
                disabled={pending || !removable}
                onClick={() => {
                  void deliverGltf(historyRef.current, true, report);
                }}
              >
                Export selection
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  const generation = currentRead();
                  void loadSample(
                    generation,
                    readIsCurrent,
                    () => historyRef.current,
                    show,
                    report,
                  );
                }}
              >
                Load sample
              </button>
            </div>
          </details>
        </div>
        <button type="button" disabled={pending} onClick={openGuide}>
          Guide
        </button>
      </header>
      <div className="uvcp-ai-bar">
        {gate.kind === "ready" && panel !== "setup" ? (
          <form className="uvcp-ask" onSubmit={(event) => void ask(event)}>
            <p className="uvcp-ai-state" role="status">
              AI is on. Using {gate.model}.
            </p>
            <label>
              Describe a change
              <textarea
                rows={1}
                value={instruction}
                disabled={pending}
                placeholder="Create, move, resize, or rotate"
                onChange={(event) => setInstruction(event.target.value)}
              />
            </label>
            <button type="submit" disabled={pending}>
              Apply
            </button>
          </form>
        ) : (
          <p className="uvcp-ai-state" role="status">
            {aiStatus(gate, panel === "setup")}
          </p>
        )}
        <button
          type="button"
          disabled={pending || gate.kind === "checking"}
          onClick={openSetup}
        >
          AI setup
        </button>
      </div>
      {notice ? (
        <p
          className={
            notice.tone === "error" ? "uvcp-notice is-error" : "uvcp-notice"
          }
          role={notice.tone === "error" ? "alert" : "status"}
        >
          {notice.text}
        </p>
      ) : dirty ? (
        <p className="uvcp-notice" role="status">
          Unsaved changes stay in this tab until you download them.
        </p>
      ) : null}
      <div className="uvcp-body">
        {panel === "guide" ? <FirstGuide onDismiss={closeGuide} /> : null}
        {panel === "setup" && gate.kind === "unavailable" ? (
          <AssistantUnavailable onClose={() => setPanel(null)} />
        ) : null}
        {panel === "setup" && (gate.kind === "off" || gate.kind === "ready") ? (
          <AssistantSetup
            currentModel={gate.kind === "ready" ? gate.model : null}
            onConfigured={(model) => {
              setGate({ kind: "ready", model });
              setPanel(null);
              report("status", assistantMessages.ready);
            }}
            onClose={() => setPanel(null)}
          />
        ) : null}
        {panel === "setup" && gate.kind === "checking" ? (
          <section className="uvcp-guide" aria-labelledby="uvcp-ai-checking">
            <h2 id="uvcp-ai-checking">Assistant</h2>
            <p>{AI_CHECKING}</p>
          </section>
        ) : null}
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
    </div>
  );
}

function aiStatus(gate: AssistantGate, setupOpen: boolean): string {
  if (gate.kind === "checking") {
    return AI_CHECKING;
  }
  if (setupOpen && gate.kind === "ready") {
    return AI_SETUP_OPEN;
  }
  if (gate.kind === "unavailable") {
    return AI_UNAVAILABLE;
  }
  if (gate.kind === "off") {
    return AI_OFF;
  }
  return `AI is on. Using ${gate.model}.`;
}

function FirstGuide({ onDismiss }: { readonly onDismiss: () => void }) {
  return (
    <section className="uvcp-guide" aria-labelledby="uvcp-guide-title">
      <h2 id="uvcp-guide-title">Start with a shape</h2>
      <ol>
        <li>
          Choose Rectangle or Box. Drag a shape to move it, and use the handles
          to change its size. A box has a depth handle.
        </li>
        <li>
          The object list shows which object is selected. Delete removes that
          object. Undo and Redo step through changes.
        </li>
        <li>
          Save downloads a readable scene.json. This tab keeps the project until
          you leave or refresh.
        </li>
        <li>
          The bar under the tools says whether AI is available in this session.
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
        AI is not available on this page. This page does not ask for a provider
        key. Drawing, save, and open keep working. To use AI, run the local
        application on this computer.
      </p>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </section>
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

function Tip({
  text,
  children,
}: {
  readonly text: string;
  readonly children: (describedBy: string) => ReactNode;
}) {
  const id = useId();
  const host = useRef<HTMLSpanElement | null>(null);
  const bubble = useRef<HTMLSpanElement | null>(null);

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
      const width = tip.getBoundingClientRect().width;
      const margin = 8;
      let left = anchorBox.left;
      if (left + width > window.innerWidth - margin) {
        left = anchorBox.right - width;
      }
      if (left < margin) {
        left = margin;
      }
      tip.style.left = `${left}px`;
      tip.style.top = `${anchorBox.bottom + 6}px`;
    }
    anchor.addEventListener("pointerenter", place);
    anchor.addEventListener("focusin", place);
    return () => {
      anchor.removeEventListener("pointerenter", place);
      anchor.removeEventListener("focusin", place);
    };
  }, []);

  return (
    <span className="uvcp-tip" ref={host}>
      {children(id)}
      <span ref={bubble} id={id} role="tooltip" className="uvcp-tip-bubble">
        {text}
      </span>
    </span>
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

function saveProject(
  history: EditorHistory,
  setSavedText: (text: string) => void,
) {
  const canonical = exportDocument(history.present);
  download(
    exportReadableDocument(history.present),
    "scene.json",
    "application/json",
  );
  setSavedText(new TextDecoder().decode(canonical));
}

async function readSceneFile(
  file: File,
  generation: number,
  readIsCurrent: (generation: number) => boolean,
  latest: () => EditorHistory,
  show: (next: EditorHistory) => void,
  report: (tone: Notice["tone"], text: string) => void,
  setSavedText: (text: string) => void,
) {
  try {
    if (file.size > SCENE_BYTE_LIMIT) {
      if (readIsCurrent(generation)) {
        report("error", SCENE_TOO_LARGE);
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
      report("error", opened.message);
      return;
    }
    setSavedText(sceneText(opened.history));
    show(opened.history);
    report("status", "Opened the scene.");
  } catch {
    if (readIsCurrent(generation)) {
      report("error", FILE_UNREADABLE);
    }
  }
}

async function readGltfFile(
  file: File,
  generation: number,
  readIsCurrent: (generation: number) => boolean,
  latest: () => EditorHistory,
  show: (next: EditorHistory) => void,
  report: (tone: Notice["tone"], text: string) => void,
) {
  try {
    if (file.size > GLTF_BYTE_LIMIT) {
      if (readIsCurrent(generation)) {
        report("error", GLTF_TOO_LARGE);
      }
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!readIsCurrent(generation)) {
      return;
    }
    await applyGltfBytes(
      bytes,
      generation,
      readIsCurrent,
      latest,
      show,
      report,
    );
  } catch {
    if (readIsCurrent(generation)) {
      report("error", FILE_UNREADABLE);
    }
  }
}

async function loadSample(
  generation: number,
  readIsCurrent: (generation: number) => boolean,
  latest: () => EditorHistory,
  show: (next: EditorHistory) => void,
  report: (tone: Notice["tone"], text: string) => void,
) {
  try {
    const response = await fetch(
      new URL("samples/crate-and-card.glb", document.baseURI),
      { redirect: "error", cache: "no-store" },
    );
    if (!readIsCurrent(generation)) {
      return;
    }
    if (!response.ok) {
      report("error", SAMPLE_FAILED);
      return;
    }
    const declared = Number(response.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > GLTF_BYTE_LIMIT) {
      report("error", GLTF_TOO_LARGE);
      return;
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!readIsCurrent(generation)) {
      return;
    }
    if (bytes.byteLength > GLTF_BYTE_LIMIT) {
      report("error", GLTF_TOO_LARGE);
      return;
    }
    await applyGltfBytes(
      bytes,
      generation,
      readIsCurrent,
      latest,
      show,
      report,
    );
  } catch {
    if (readIsCurrent(generation)) {
      report("error", SAMPLE_FAILED);
    }
  }
}

async function applyGltfBytes(
  bytes: Uint8Array,
  generation: number,
  readIsCurrent: (generation: number) => boolean,
  latest: () => EditorHistory,
  show: (next: EditorHistory) => void,
  report: (tone: Notice["tone"], text: string) => void,
) {
  const base = latest();
  const imported = await importGltfFile(base, bytes);
  if (!readIsCurrent(generation)) {
    return;
  }
  if (imported.history === base) {
    report("error", imported.message ?? FILE_UNREADABLE);
    return;
  }
  const current = latest();
  const next =
    current === base
      ? imported.history
      : commitPresent(current, imported.history.present);
  show(next);
  report("status", imported.message ?? "Imported into the project.");
}

async function deliverGltf(
  history: EditorHistory,
  selection: boolean,
  report: (tone: Notice["tone"], text: string) => void,
) {
  const result = selection
    ? await exportSelectedGltf(history.present)
    : await exportGltfFile(history.present);
  if (result.bytes === null) {
    report("error", result.message ?? FILE_UNREADABLE);
    return;
  }
  const name = selection ? "selection.glb" : "scene.glb";
  download(result.bytes, name, "model/gltf-binary");
  report("status", `Downloaded ${name}. Save still downloads the project.`);
}

function sceneText(history: EditorHistory): string {
  return new TextDecoder().decode(exportDocument(history.present));
}

function guideIsOpen(): boolean {
  try {
    return localStorage.getItem(GUIDE_KEY) !== "dismissed";
  } catch {
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

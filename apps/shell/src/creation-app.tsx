import { assistantMessages } from "@uvcp/ai";
import {
  addShape,
  applyAssistantActions,
  canDelete,
  canOrder,
  canRedo,
  canUndo,
  commitPresent,
  createHistory,
  deleteSelected,
  type EditorHistory,
  type EditorShape,
  editorErrorMessage,
  editText,
  exportDocument,
  exportGltfFile,
  exportReadableDocument,
  exportSelectedGltf,
  GLTF_BYTE_LIMIT,
  GLTF_TOO_LARGE,
  importGltfFile,
  openDocument,
  orderShape,
  paintShape,
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
import { strings, useAppearance } from "@uvcp/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { AssistantSetup, loadAssistantStatus } from "./assistant-setup.tsx";
import {
  BoxMark,
  DeleteMark,
  EllipseMark,
  FileButton,
  FileMenu,
  ProductMark,
  RectangleMark,
  RedoMark,
  TextMark,
  Tip,
  ToolButton,
  UndoMark,
} from "./chrome.tsx";
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
  const appearance = useAppearance();
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
    const previous = historyRef.current.present;
    historyRef.current = next;
    setHistory(next);
    if (
      next.present.scene !== previous.scene ||
      next.present.selectedId !== previous.selectedId
    ) {
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
        const target = event.target;
        const menu = document.getElementById("uvcp-file-menu");
        if (menu instanceof HTMLElement && menu.matches(":popover-open")) {
          menu.hidePopover();
          return;
        }
        if (target instanceof Element && openTip(target)) {
          return;
        }
        event.preventDefault();
        const settled =
          current.present.scene === current.anchor.scene
            ? current
            : undo(current);
        show(replacePresent(settled, selectShape(settled.present, null)));
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
            fill: shape.fill,
            text: shape.text,
            fontSize: shape.fontSize,
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
    <div className="uvcp-editor" data-appearance={appearance}>
      <header className="uvcp-top">
        <div className="uvcp-identity">
          <ProductMark />
          <h1 className="uvcp-product">{strings.productName}</h1>
        </div>
        <div className="uvcp-status">
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
        </div>
        <div className="uvcp-edit" role="toolbar" aria-label="Edit">
          <ToolButton
            label="Undo"
            tip="Undo (Ctrl+Z)"
            disabled={pending || !undoable}
            onClick={() => {
              show(undo(historyRef.current));
              setNotice(null);
            }}
          >
            <UndoMark />
          </ToolButton>
          <ToolButton
            label="Redo"
            tip="Redo (Ctrl+Y)"
            disabled={pending || !redoable}
            onClick={() => {
              show(redo(historyRef.current));
              setNotice(null);
            }}
          >
            <RedoMark />
          </ToolButton>
          <ToolButton
            label="Delete"
            tip={
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
            <DeleteMark />
          </ToolButton>
        </div>
        <div className="uvcp-top-actions">
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
          <FileMenu
            disabled={pending}
            canExportSelection={removable}
            onImport={(file) => {
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
            onExport={() => {
              void deliverGltf(historyRef.current, false, report);
            }}
            onExportSelection={() => {
              void deliverGltf(historyRef.current, true, report);
            }}
            onSample={() => {
              const generation = currentRead();
              void loadSample(
                generation,
                readIsCurrent,
                () => historyRef.current,
                show,
                report,
              );
            }}
          />
          <button type="button" disabled={pending} onClick={openGuide}>
            Guide
          </button>
          <button
            type="button"
            disabled={pending || gate.kind === "checking"}
            onClick={openSetup}
          >
            AI setup
          </button>
        </div>
      </header>
      <div className="uvcp-workspace">
        <div className="uvcp-rail" role="toolbar" aria-label="Create">
          <ToolButton
            label="Rectangle"
            disabled={pending}
            onClick={() => show(addShape(historyRef.current, "rectangle"))}
          >
            <RectangleMark />
          </ToolButton>
          <ToolButton
            label="Ellipse"
            disabled={pending}
            onClick={() => show(addShape(historyRef.current, "ellipse"))}
          >
            <EllipseMark />
          </ToolButton>
          <ToolButton
            label="Text"
            disabled={pending}
            onClick={() => show(addShape(historyRef.current, "text"))}
          >
            <TextMark />
          </ToolButton>
          <ToolButton
            label="Box"
            disabled={pending}
            onClick={() => show(addShape(historyRef.current, "box"))}
          >
            <BoxMark />
          </ToolButton>
        </div>
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
        <div className="uvcp-side">
          {panel === "guide" ? <FirstGuide onDismiss={closeGuide} /> : null}
          {panel === "setup" && gate.kind === "unavailable" ? (
            <AssistantUnavailable onClose={() => setPanel(null)} />
          ) : null}
          {panel === "setup" &&
          (gate.kind === "off" || gate.kind === "ready") ? (
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
            <section
              className="uvcp-ai-setup"
              aria-labelledby="uvcp-ai-checking"
            >
              <h2 id="uvcp-ai-checking">Assistant</h2>
              <p>{AI_CHECKING}</p>
            </section>
          ) : null}
          <Inspector
            hasShapes={shapes.length > 0}
            selected={selected}
            disabled={pending}
            sizeError={sizeNotice}
            onCommit={commitMeasure}
            onClearError={() => setSizeNotice(null)}
            onFill={(fill) => {
              const current = historyRef.current;
              const id = current.present.selectedId;
              if (id === null) {
                return;
              }
              try {
                show(
                  commitPresent(current, paintShape(current.present, id, fill)),
                );
              } catch (error) {
                setSizeNotice(editorErrorMessage(error));
              }
            }}
            onText={(words, fontSize) => {
              const current = historyRef.current;
              const id = current.present.selectedId;
              if (id === null) {
                return false;
              }
              try {
                show(
                  commitPresent(
                    current,
                    editText(current.present, id, words, fontSize),
                  ),
                );
                return true;
              } catch (error) {
                setSizeNotice(editorErrorMessage(error));
                return false;
              }
            }}
            canSendBackward={canOrder(history.present, "backward")}
            canBringForward={canOrder(history.present, "forward")}
            onOrder={(direction) => {
              const current = historyRef.current;
              const id = current.present.selectedId;
              if (id === null || !canOrder(current.present, direction)) {
                return;
              }
              show(
                commitPresent(
                  current,
                  orderShape(current.present, id, direction),
                ),
              );
            }}
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
          Choose Rectangle, Ellipse, Text, or Box. Drag a shape to move it, and
          use the handles to change its size. A box has a depth handle. Fill,
          words, and order are in the inspector.
        </li>
        <li>
          The object list shows which object is selected. Delete removes that
          object. Undo and Redo step through changes.
        </li>
        <li>
          Save downloads a readable scene.json. This tab keeps the project until
          you leave or refresh.
        </li>
        <li>The top bar says whether AI is available in this session.</li>
      </ol>
      <button type="button" className="uvcp-commit" onClick={onDismiss}>
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

// A pointer click hides the bubble and leaves focus in the tip. Escape
// dismisses only a bubble the user can see. Keep this aligned with tipIsOpen.
function openTip(target: Element): boolean {
  const tip = target.closest(".uvcp-tip");
  if (!(tip instanceof HTMLElement) || tip.hasAttribute("data-dismissed")) {
    return false;
  }
  if (tip.matches(":hover")) {
    return true;
  }
  return (
    tip.matches(":focus-within") && !tip.hasAttribute("data-pointer-focus")
  );
}

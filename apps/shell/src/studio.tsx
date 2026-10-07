import type { SceneFact } from "@uvcp/ai";
import { assistantMessages } from "@uvcp/ai";
import { applySceneActions, createSceneHandle } from "@uvcp/editor";
import { strings, useAppearance } from "@uvcp/ui";
import { useEffect, useId, useRef, useState } from "react";
import "@uvcp/ui/foundation.css";
import {
  hitTest,
  projectScene,
  VIEW_HEIGHT,
  VIEW_WIDTH,
} from "./project-view.ts";
import "./studio.css";

export function Studio() {
  const appearance = useAppearance();
  const instructionId = useId();
  const statusId = useId();
  const [handle, setHandle] = useState(createSceneHandle);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [message, setMessage] = useState<string>(assistantMessages.emptyScene);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const selected = handle.facts.find((fact) => fact.id === selectedId) ?? null;

  useEffect(() => {
    document.title = strings.webDocumentTitle;
  }, []);

  if (selectedId !== null && selected === null) {
    setSelectedId(null);
  }

  async function onApply(event: { preventDefault(): void }): Promise<void> {
    event.preventDefault();
    if (pendingRef.current) {
      return;
    }
    const text = instruction.trim();
    if (text.length === 0) {
      setMessage(assistantMessages.emptyInstruction);
      return;
    }
    pendingRef.current = true;
    setPending(true);
    setMessage(assistantMessages.working);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ instruction: text, facts: handle.facts }),
      });
      const body: unknown = await response.json();
      if (!isResult(body)) {
        setMessage(assistantMessages.badRequest);
        return;
      }
      if (!body.ok) {
        setMessage(body.message ?? assistantMessages.providerDown);
        return;
      }
      const applied = applySceneActions(handle, body.actions);
      setHandle(applied.handle);
      setMessage(applied.ok ? applied.summary : applied.message);
    } catch {
      setMessage(assistantMessages.reachServer);
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  function onUpdate(actions: unknown[]): void {
    const applied = applySceneActions(handle, actions);
    setHandle(applied.handle);
    setMessage(applied.ok ? applied.summary : applied.message);
  }

  const projected = projectScene(handle.facts)
    .slice()
    .sort((left, right) => left.z - right.z);

  return (
    <div className="uvcp-foundation uvcp-studio" data-appearance={appearance}>
      <header className="uvcp-studio-bar">
        <h1>{strings.productName}</h1>
        <form onSubmit={(event) => void onApply(event)}>
          <label htmlFor={instructionId}>Describe a change</label>
          <textarea
            id={instructionId}
            rows={2}
            value={instruction}
            disabled={pending}
            onChange={(event) => setInstruction(event.target.value)}
          />
          <button type="submit" disabled={pending}>
            Apply
          </button>
        </form>
        <p id={statusId} role="status">
          {message}
        </p>
      </header>
      <div className="uvcp-studio-body">
        <div className="uvcp-studio-stage">
          {handle.facts.length === 0 ? (
            <p>{assistantMessages.emptyScene}</p>
          ) : (
            <svg
              viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
              role="img"
              aria-label="Scene"
              onPointerDown={(event) => {
                const point = eventPoint(event);
                if (point === null) {
                  return;
                }
                setSelectedId(hitTest(projected, point.x, point.y));
              }}
            >
              {projected.map((object) =>
                object.faces.map((face) => (
                  <polygon
                    key={`${object.id}-${face.name}`}
                    points={face.points
                      .map((point) => `${point.x},${point.y}`)
                      .join(" ")}
                    className={
                      object.id === selectedId
                        ? "uvcp-studio-shape uvcp-studio-selected"
                        : "uvcp-studio-shape"
                    }
                  />
                )),
              )}
            </svg>
          )}
        </div>
        <aside className="uvcp-studio-edit" aria-describedby={statusId}>
          <h2>Objects</h2>
          {handle.facts.length === 0 ? (
            <p>{assistantMessages.selectObject}</p>
          ) : (
            <ul>
              {handle.facts.map((fact) => (
                <li key={fact.id}>
                  <button
                    type="button"
                    aria-pressed={fact.id === selectedId}
                    onClick={() => setSelectedId(fact.id)}
                  >
                    {fact.kind} {fact.id}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {selected === null ? null : (
            <ObjectFields
              key={selected.id}
              fact={selected}
              disabled={pending}
              onUpdate={onUpdate}
              onReject={setMessage}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

function ObjectFields({
  fact,
  disabled,
  onUpdate,
  onReject,
}: {
  readonly fact: SceneFact;
  readonly disabled: boolean;
  readonly onUpdate: (actions: unknown[]) => void;
  readonly onReject: (message: string) => void;
}) {
  const [position, setPosition] = useState(tripleText(fact.position));
  const [rotation, setRotation] = useState(tripleText(fact.rotation));
  const [width, setWidth] = useState(String(fact.width));
  const [height, setHeight] = useState(String(fact.height));
  const [depth, setDepth] = useState(
    fact.depth === null ? "" : String(fact.depth),
  );

  function commit(event: { preventDefault(): void }): void {
    event.preventDefault();
    const nextPosition = readTriple(position);
    const nextRotation = readTriple(rotation);
    const nextWidth = readNumber(width);
    const nextHeight = readNumber(height);
    const nextDepth = fact.kind === "box" ? readNumber(depth) : null;
    if (
      nextPosition === null ||
      nextRotation === null ||
      nextWidth === null ||
      nextHeight === null ||
      (fact.kind === "box" && nextDepth === null)
    ) {
      onReject(assistantMessages.finiteNumber);
      return;
    }
    const actions: unknown[] = [];
    if (!sameTriple(nextPosition, fact.position)) {
      actions.push({ type: "move", id: fact.id, position: nextPosition });
    }
    if (!sameTriple(nextRotation, fact.rotation)) {
      actions.push({ type: "rotate", id: fact.id, rotation: nextRotation });
    }
    const sizeChanged =
      nextWidth !== fact.width ||
      nextHeight !== fact.height ||
      (fact.kind === "box" && nextDepth !== fact.depth);
    if (sizeChanged) {
      actions.push(
        fact.kind === "box"
          ? {
              type: "resize",
              id: fact.id,
              width: nextWidth,
              height: nextHeight,
              depth: nextDepth,
            }
          : {
              type: "resize",
              id: fact.id,
              width: nextWidth,
              height: nextHeight,
            },
      );
    }
    if (actions.length === 0) {
      onReject(assistantMessages.unchanged);
      return;
    }
    onUpdate(actions);
  }

  return (
    <form onSubmit={commit}>
      <h2>Edit {fact.id}</h2>
      <TripleFields label="Position" values={position} onChange={setPosition} />
      <TripleFields label="Rotation" values={rotation} onChange={setRotation} />
      <NumberField label="Width" value={width} onChange={setWidth} />
      <NumberField label="Height" value={height} onChange={setHeight} />
      {fact.kind === "box" ? (
        <NumberField label="Depth" value={depth} onChange={setDepth} />
      ) : null}
      <button type="submit" disabled={disabled}>
        Update
      </button>
    </form>
  );
}

function TripleFields({
  label,
  values,
  onChange,
}: {
  readonly label: string;
  readonly values: readonly [string, string, string];
  readonly onChange: (values: [string, string, string]) => void;
}) {
  const names = ["X", "Y", "Z"] as const;
  return (
    <fieldset>
      <legend>{label}</legend>
      {names.map((name, index) => (
        <NumberField
          key={name}
          label={name}
          value={values[index] ?? ""}
          onChange={(value) => {
            const next: [string, string, string] = [...values];
            next[index] = value;
            onChange(next);
          }}
        />
      ))}
    </fieldset>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <label htmlFor={id}>
      {label}
      <input
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function eventPoint(event: {
  currentTarget: SVGSVGElement;
  clientX: number;
  clientY: number;
}): { readonly x: number; readonly y: number } | null {
  const matrix = event.currentTarget.getScreenCTM();
  if (matrix === null) {
    return null;
  }
  const point = event.currentTarget.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const local = point.matrixTransform(matrix.inverse());
  return { x: local.x, y: local.y };
}

function isResult(value: unknown): value is {
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

function tripleText(
  value: readonly [number, number, number],
): [string, string, string] {
  return [String(value[0]), String(value[1]), String(value[2])];
}

function readTriple(
  values: readonly [string, string, string],
): [number, number, number] | null {
  const x = readNumber(values[0]);
  const y = readNumber(values[1]);
  const z = readNumber(values[2]);
  if (x === null || y === null || z === null) {
    return null;
  }
  return [x, y, z];
}

function readNumber(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return null;
  }
  return number;
}

function sameTriple(
  left: readonly [number, number, number],
  right: readonly [number, number, number],
): boolean {
  return left[0] === right[0] && left[1] === right[1] && left[2] === right[2];
}

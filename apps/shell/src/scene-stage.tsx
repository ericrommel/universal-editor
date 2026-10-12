import {
  boxShift,
  commitPresent,
  containedPosition,
  dragPosition,
  type EditorHistory,
  type EditorShape,
  type Frame,
  placeShape,
  type ResizeHandle,
  replacePresent,
  resizedDepth,
  resizedRotatedFrame,
  SHEET_HEIGHT,
  SHEET_WIDTH,
  selectShape,
  sheetShapes,
} from "@uvcp/editor";
import {
  type PointerEvent as ReactPointerEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { shapeLabel } from "./shape-label.ts";

// A smaller movement is a click. It selects and does not write history,
// so a click cannot clear Redo.
const CLICK_SLOP_PX = 4;
const HANDLES: readonly ResizeHandle[] = [
  "nw",
  "n",
  "ne",
  "e",
  "se",
  "s",
  "sw",
  "w",
];

type MoveGesture = {
  readonly kind: "move";
  readonly base: EditorHistory;
  readonly id: string;
  readonly originX: number;
  readonly originY: number;
  readonly width: number;
  readonly height: number;
  readonly startX: number;
  readonly startY: number;
  readonly startClientX: number;
  readonly startClientY: number;
  x: number;
  y: number;
  moved: boolean;
};

type ResizeGesture = {
  readonly kind: "resize";
  readonly base: EditorHistory;
  readonly id: string;
  readonly handle: ResizeHandle;
  readonly startX: number;
  readonly startY: number;
  readonly origin: Frame;
  readonly depth: number | null;
  readonly centerX: number;
  readonly centerY: number;
  readonly rotation: number;
  frame: Frame;
};

type DepthGesture = {
  readonly kind: "depth";
  readonly base: EditorHistory;
  readonly id: string;
  readonly startX: number;
  readonly startY: number;
  readonly originDepth: number;
  readonly frame: Frame;
  readonly centerX: number;
  readonly centerY: number;
  readonly rotation: number;
  depth: number;
};

type Gesture = MoveGesture | ResizeGesture | DepthGesture;

export function SceneStage({
  shapes,
  selectedId,
  isBlocked,
  getHistory,
  onShow,
}: {
  readonly shapes: readonly EditorShape[];
  readonly selectedId: string | null;
  readonly isBlocked: () => boolean;
  readonly getHistory: () => EditorHistory;
  readonly onShow: (next: EditorHistory) => void;
}) {
  const surface = useRef<SVGSVGElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const shown = useRef<EditorHistory | null>(null);
  const [scale, setScale] = useState(1);
  const [holding, setHolding] = useState(false);
  const selected = shapes.find((shape) => shape.id === selectedId) ?? null;

  useLayoutEffect(() => {
    const svg = surface.current;
    if (!svg) {
      return;
    }
    const measure = () => {
      const matrix = svg.getScreenCTM();
      const next = matrix ? Math.hypot(matrix.a, matrix.b) : 1;
      setScale((current) =>
        Math.abs(current - (next || 1)) < 0.001 ? current : next || 1,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  function publish(next: EditorHistory) {
    shown.current = next;
    onShow(next);
  }

  function historyStillOwnsGesture(base: EditorHistory): boolean {
    const current = getHistory();
    return current === shown.current || current === base;
  }

  function beginMove(shape: EditorShape, event: ReactPointerEvent) {
    if (isBlocked() || event.button !== 0) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    const current = getHistory();
    const live = liveShape(current, shape.id) ?? shape;
    const point = svgPoint(surface.current, event);
    const base = replacePresent(current, selectShape(current.present, live.id));
    gesture.current = {
      kind: "move",
      base,
      id: live.id,
      originX: live.x,
      originY: live.y,
      width: live.width,
      height: live.height,
      startX: point.x,
      startY: point.y,
      startClientX: event.clientX,
      startClientY: event.clientY,
      x: live.x,
      y: live.y,
      moved: false,
    };
    surface.current?.setPointerCapture(event.pointerId);
    publish(base);
  }

  function beginResize(
    shape: EditorShape,
    handle: ResizeHandle,
    event: ReactPointerEvent,
  ) {
    if (isBlocked() || event.button !== 0) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    const current = getHistory();
    const live = liveShape(current, shape.id) ?? shape;
    const center = centerOf(live);
    const point = pageToLocal(
      svgPoint(surface.current, event),
      center.x,
      center.y,
      live.rotation,
    );
    const origin = frameOf(live);
    const base = replacePresent(current, selectShape(current.present, live.id));
    gesture.current = {
      kind: "resize",
      base,
      id: live.id,
      handle,
      startX: point.x,
      startY: point.y,
      origin,
      depth: live.depth,
      centerX: center.x,
      centerY: center.y,
      rotation: live.rotation,
      frame: origin,
    };
    surface.current?.setPointerCapture(event.pointerId);
    publish(base);
  }

  function beginDepth(shape: EditorShape, event: ReactPointerEvent) {
    if (isBlocked() || event.button !== 0 || shape.depth === null) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    const current = getHistory();
    const live = liveShape(current, shape.id) ?? shape;
    if (live.depth === null) {
      return;
    }
    const center = centerOf(live);
    const point = pageToLocal(
      svgPoint(surface.current, event),
      center.x,
      center.y,
      live.rotation,
    );
    const origin = frameOf(live);
    const base = replacePresent(current, selectShape(current.present, live.id));
    gesture.current = {
      kind: "depth",
      base,
      id: live.id,
      startX: point.x,
      startY: point.y,
      originDepth: live.depth,
      frame: origin,
      centerX: center.x,
      centerY: center.y,
      rotation: live.rotation,
      depth: live.depth,
    };
    surface.current?.setPointerCapture(event.pointerId);
    publish(base);
  }

  function onPointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    const active = gesture.current;
    if (!active || !historyStillOwnsGesture(active.base)) {
      return;
    }
    const pagePoint = svgPoint(surface.current, event);
    if (active.kind === "move") {
      if (isBlocked()) {
        return;
      }
      const distance = Math.hypot(
        event.clientX - active.startClientX,
        event.clientY - active.startClientY,
      );
      if (distance < CLICK_SLOP_PX) {
        return;
      }
      const dragged = dragPosition(
        { x: active.originX, y: active.originY },
        { x: active.startX, y: active.startY },
        pagePoint,
      );
      const next = roundPoint(
        containedPosition(
          { width: active.width, height: active.height },
          dragged.x,
          dragged.y,
        ),
      );
      active.x = next.x;
      active.y = next.y;
      if (!active.moved) {
        setHolding(true);
      }
      active.moved = true;
      publish(
        replacePresent(
          active.base,
          placeShape(
            active.base.present,
            active.id,
            {
              x: next.x,
              y: next.y,
              width: active.width,
              height: active.height,
            },
            null,
          ),
        ),
      );
      return;
    }
    const point = pageToLocal(
      pagePoint,
      active.centerX,
      active.centerY,
      active.rotation,
    );
    if (active.kind === "resize") {
      if (isBlocked()) {
        return;
      }
      const frame = resizedRotatedFrame(
        active.origin,
        active.rotation,
        active.handle,
        pagePoint,
      );
      active.frame = frame;
      publish(
        replacePresent(
          active.base,
          placeShape(active.base.present, active.id, frame, active.depth),
        ),
      );
      return;
    }
    if (isBlocked()) {
      return;
    }
    const depth = roundExtent(
      resizedDepth(
        active.originDepth,
        point.x - active.startX,
        point.y - active.startY,
      ),
    );
    active.depth = depth;
    publish(
      replacePresent(
        active.base,
        placeShape(active.base.present, active.id, active.frame, depth),
      ),
    );
  }

  function onPointerUp() {
    const active = gesture.current;
    gesture.current = null;
    setHolding(false);
    if (!active) {
      return;
    }
    const owns = historyStillOwnsGesture(active.base);
    // A file read or assistant request can start while the button is down.
    // That preview is not a step, so release puts the page back.
    if (isBlocked() || !owns) {
      if (isBlocked() && owns) {
        publish(active.base);
      }
      return;
    }
    if (active.kind === "move") {
      if (
        !active.moved ||
        (active.x === active.originX && active.y === active.originY)
      ) {
        publish(active.base);
        return;
      }
      publish(
        commitPresent(
          active.base,
          placeShape(
            active.base.present,
            active.id,
            {
              x: active.x,
              y: active.y,
              width: active.width,
              height: active.height,
            },
            null,
          ),
        ),
      );
      return;
    }
    if (active.kind === "resize") {
      if (sameFrame(active.frame, active.origin)) {
        publish(active.base);
        return;
      }
      publish(
        commitPresent(
          active.base,
          placeShape(
            active.base.present,
            active.id,
            active.frame,
            active.depth,
          ),
        ),
      );
      return;
    }
    if (active.depth === active.originDepth) {
      publish(active.base);
      return;
    }
    publish(
      commitPresent(
        active.base,
        placeShape(active.base.present, active.id, active.frame, active.depth),
      ),
    );
  }

  function clearSelection(event: ReactPointerEvent) {
    if (isBlocked() || event.target !== event.currentTarget) {
      return;
    }
    gesture.current = null;
    publish(
      replacePresent(getHistory(), selectShape(getHistory().present, null)),
    );
  }

  return (
    <div className="uvcp-stage" onPointerDown={clearSelection}>
      <svg
        ref={surface}
        className={holding ? "uvcp-page is-holding" : "uvcp-page"}
        viewBox={`0 0 ${SHEET_WIDTH} ${SHEET_HEIGHT}`}
        role="application"
        aria-label="Page"
        onPointerDown={clearSelection}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {shapes.map((shape) => (
          <g
            key={shape.id}
            className="uvcp-shape"
            data-shape-id={shape.id}
            transform={shapeTransform(shape)}
            onPointerDown={(event) => beginMove(shape, event)}
          >
            <ShapeFigure shape={shape} />
            <title>{shapeLabel(shape)}</title>
          </g>
        ))}
        {shapes.length === 0 ? (
          <text
            className="uvcp-empty"
            x={SHEET_WIDTH / 2}
            y={SHEET_HEIGHT / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            pointerEvents="none"
          >
            Add a rectangle, an ellipse, text, or a box.
          </text>
        ) : null}
        {selected ? (
          <g
            className="uvcp-selection-layer"
            transform={shapeTransform(selected)}
          >
            <polygon
              className="uvcp-selection"
              points={selectionPoints(selected, 2 / scale)}
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
            <SelectionHandles
              shape={selected}
              scale={scale}
              onResize={beginResize}
              onDepth={beginDepth}
            />
          </g>
        ) : null}
      </svg>
    </div>
  );
}

function ShapeFigure({ shape }: { readonly shape: EditorShape }) {
  const clipId = useId();
  if (shape.kind === "ellipse") {
    return (
      <ellipse
        className="uvcp-face uvcp-face-front"
        cx={shape.x + shape.width / 2}
        cy={shape.y + shape.height / 2}
        rx={shape.width / 2}
        ry={shape.height / 2}
        fill={shape.fill}
        vectorEffect="non-scaling-stroke"
      />
    );
  }
  if (shape.kind === "text") {
    return (
      <>
        <rect
          className="uvcp-face uvcp-face-front"
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          fill="none"
          pointerEvents="all"
          vectorEffect="non-scaling-stroke"
        />
        {shape.text !== null && shape.fontSize !== null ? (
          <>
            <clipPath id={clipId}>
              <rect
                x={shape.x}
                y={shape.y}
                width={shape.width}
                height={shape.height}
              />
            </clipPath>
            <text
              className="uvcp-text"
              x={shape.x + 8}
              y={shape.y + shape.fontSize}
              fill={shape.fill}
              fontSize={shape.fontSize}
              clipPath={`url(#${clipId})`}
            >
              {shape.text}
            </text>
          </>
        ) : null}
      </>
    );
  }
  if (shape.depth === null) {
    return (
      <rect
        className="uvcp-face uvcp-face-front"
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        fill={shape.fill}
        vectorEffect="non-scaling-stroke"
      />
    );
  }
  const shift = boxShift(shape.depth);
  const backX = shape.x + shift.dx;
  const backY = shape.y + shift.dy;
  const right = shape.x + shape.width;
  const bottom = shape.y + shape.height;
  const top = [
    `${shape.x},${shape.y}`,
    `${right},${shape.y}`,
    `${right + shift.dx},${backY}`,
    `${backX},${backY}`,
  ].join(" ");
  const side = [
    `${right},${shape.y}`,
    `${right},${bottom}`,
    `${right + shift.dx},${bottom + shift.dy}`,
    `${right + shift.dx},${backY}`,
  ].join(" ");
  return (
    <>
      <rect
        className="uvcp-face uvcp-face-back"
        x={backX}
        y={backY}
        width={shape.width}
        height={shape.height}
        fill={shape.fill}
        vectorEffect="non-scaling-stroke"
      />
      <polygon
        className="uvcp-face uvcp-face-top"
        points={top}
        fill={shape.fill}
        vectorEffect="non-scaling-stroke"
      />
      <polygon
        className="uvcp-face uvcp-face-side"
        points={side}
        fill={shape.fill}
        vectorEffect="non-scaling-stroke"
      />
      <rect
        className="uvcp-face uvcp-face-front"
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        fill={shape.fill}
        vectorEffect="non-scaling-stroke"
      />
    </>
  );
}

function SelectionHandles({
  shape,
  scale,
  onResize,
  onDepth,
}: {
  readonly shape: EditorShape;
  readonly scale: number;
  readonly onResize: (
    shape: EditorShape,
    handle: ResizeHandle,
    event: ReactPointerEvent,
  ) => void;
  readonly onDepth: (shape: EditorShape, event: ReactPointerEvent) => void;
}) {
  const hit = 12 / scale;
  const mark = 8 / scale;
  return (
    <g className="uvcp-handles">
      {HANDLES.map((handle) => {
        const point = handlePoint(shape, handle);
        return (
          <g key={handle}>
            <rect
              className="uvcp-handle"
              x={point.x - mark / 2}
              y={point.y - mark / 2}
              width={mark}
              height={mark}
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
            <rect
              className="uvcp-handle-hit"
              data-handle={handle}
              x={point.x - hit / 2}
              y={point.y - hit / 2}
              width={hit}
              height={hit}
              style={{ cursor: HANDLE_CURSOR[handle] }}
              onPointerDown={(event) => onResize(shape, handle, event)}
            >
              <title>{handleTitle(handle)}</title>
            </rect>
          </g>
        );
      })}
      {shape.depth === null ? null : (
        <DepthHandle shape={shape} scale={scale} onDepth={onDepth} />
      )}
    </g>
  );
}

function DepthHandle({
  shape,
  scale,
  onDepth,
}: {
  readonly shape: EditorShape;
  readonly scale: number;
  readonly onDepth: (shape: EditorShape, event: ReactPointerEvent) => void;
}) {
  if (shape.depth === null) {
    return null;
  }
  const shift = boxShift(shape.depth);
  const point = {
    x: shape.x + shape.width + shift.dx,
    y: shape.y + shift.dy,
  };
  const hit = 12 / scale;
  const mark = 8 / scale;
  return (
    <g>
      <text
        className="uvcp-depth-label"
        x={point.x + 10 / scale}
        y={point.y - 8 / scale}
        fontSize={11 / scale}
        pointerEvents="none"
      >
        Depth
      </text>
      <rect
        className="uvcp-handle uvcp-handle-depth"
        x={point.x - mark / 2}
        y={point.y - mark / 2}
        width={mark}
        height={mark}
        vectorEffect="non-scaling-stroke"
        pointerEvents="none"
      />
      <rect
        className="uvcp-handle-hit"
        data-handle="depth"
        x={point.x - hit / 2}
        y={point.y - hit / 2}
        width={hit}
        height={hit}
        style={{ cursor: "nesw-resize" }}
        onPointerDown={(event) => onDepth(shape, event)}
      >
        <title>Depth</title>
      </rect>
    </g>
  );
}

function selectionPoints(shape: EditorShape, outset: number): string {
  if (shape.depth === null) {
    const x = shape.x - outset;
    const y = shape.y - outset;
    const width = shape.width + outset * 2;
    const height = shape.height + outset * 2;
    return `${x},${y} ${x + width},${y} ${x + width},${y + height} ${x},${y + height}`;
  }
  const shift = boxShift(shape.depth);
  const right = shape.x + shape.width;
  const bottom = shape.y + shape.height;
  const points: readonly (readonly [number, number])[] = [
    [shape.x, bottom],
    [right, bottom],
    [right + shift.dx, bottom + shift.dy],
    [right + shift.dx, shape.y + shift.dy],
    [shape.x + shift.dx, shape.y + shift.dy],
    [shape.x, shape.y],
  ];
  const centerX =
    points.reduce((sum, point) => sum + point[0], 0) / points.length;
  const centerY =
    points.reduce((sum, point) => sum + point[1], 0) / points.length;
  return points
    .map(([x, y]) => {
      const dx = x - centerX;
      const dy = y - centerY;
      const length = Math.hypot(dx, dy) || 1;
      return `${x + (dx / length) * outset},${y + (dy / length) * outset}`;
    })
    .join(" ");
}

function handlePoint(
  shape: EditorShape,
  handle: ResizeHandle,
): { readonly x: number; readonly y: number } {
  const right = shape.x + shape.width;
  const bottom = shape.y + shape.height;
  const midX = shape.x + shape.width / 2;
  const midY = shape.y + shape.height / 2;
  switch (handle) {
    case "nw":
      return { x: shape.x, y: shape.y };
    case "n":
      return { x: midX, y: shape.y };
    case "ne":
      return { x: right, y: shape.y };
    case "e":
      return { x: right, y: midY };
    case "se":
      return { x: right, y: bottom };
    case "s":
      return { x: midX, y: bottom };
    case "sw":
      return { x: shape.x, y: bottom };
    case "w":
      return { x: shape.x, y: midY };
    default: {
      const unreachable: never = handle;
      return unreachable;
    }
  }
}

function handleTitle(handle: ResizeHandle): string {
  if (handle === "n" || handle === "s") {
    return "Resize height";
  }
  if (handle === "e" || handle === "w") {
    return "Resize width";
  }
  return "Resize width and height";
}

const HANDLE_CURSOR: Record<ResizeHandle, string> = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
};

function roundUnit(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function roundExtent(value: number): number {
  return Math.max(roundUnit(value), 0.001);
}

function roundPoint(point: { readonly x: number; readonly y: number }): {
  readonly x: number;
  readonly y: number;
} {
  return { x: roundUnit(point.x), y: roundUnit(point.y) };
}

function shapeTransform(shape: EditorShape): string | undefined {
  if (shape.rotation === 0) {
    return undefined;
  }
  const center = centerOf(shape);
  return `rotate(${shape.rotation} ${center.x} ${center.y})`;
}

function centerOf(shape: EditorShape): {
  readonly x: number;
  readonly y: number;
} {
  return {
    x: shape.x + shape.width / 2,
    y: shape.y + shape.height / 2,
  };
}

function pageToLocal(
  point: { readonly x: number; readonly y: number },
  centerX: number,
  centerY: number,
  rotation: number,
): { readonly x: number; readonly y: number } {
  if (rotation === 0) {
    return point;
  }
  const angle = (rotation * Math.PI) / 180;
  const dx = point.x - centerX;
  const dy = point.y - centerY;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: dx * cos + dy * sin + centerX,
    y: -dx * sin + dy * cos + centerY,
  };
}

function frameOf(shape: EditorShape): Frame {
  return {
    x: shape.x,
    y: shape.y,
    width: shape.width,
    height: shape.height,
  };
}

function sameFrame(left: Frame, right: Frame): boolean {
  return (
    left.x === right.x &&
    left.y === right.y &&
    left.width === right.width &&
    left.height === right.height
  );
}

function liveShape(history: EditorHistory, id: string): EditorShape | null {
  return sheetShapes(history.present).find((shape) => shape.id === id) ?? null;
}

function svgPoint(
  svg: SVGSVGElement | null,
  event: ReactPointerEvent,
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

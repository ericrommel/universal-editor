import assert from "node:assert/strict";
import test from "node:test";
import type { SceneFact } from "@uvcp/ai";
import {
  hitTest,
  projectObject,
  projectWorldPoint,
  VIEW_WIDTH,
} from "./project-view.ts";

test("the fixed view places a unit of height on the known screen point", () => {
  const point = projectWorldPoint(0, 1, 0);
  assert.ok(Math.abs(point.x - VIEW_WIDTH / 2) < 0.01);
  assert.ok(Math.abs(point.y - 238.1807) < 0.01);
});

test("an identity box shows the -X, +Y, and +Z faces", () => {
  const box = projectObject(fact("b1", "box"));
  assert.deepEqual(box.faces.map((face) => face.name).sort(), [
    "+Y",
    "+Z",
    "-X",
  ]);
});

test("rotation about Z moves the rectangle's right edge upward", () => {
  const rectangle = projectObject({
    ...fact("r1", "rectangle"),
    width: 2,
    height: 2,
    rotation: [0, 0, 90],
  });
  const face = rectangle.faces[0];
  assert.ok(face);
  const moved = face.points.some(
    (point) =>
      Math.abs(point.x - 455.4256) < 0.05 &&
      Math.abs(point.y - 229.8985) < 0.05,
  );
  assert.equal(moved, true);
});

test("the nearer object wins a shared screen point", () => {
  const far = {
    id: "far",
    z: 1,
    faces: [
      {
        name: "face",
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ],
      },
    ],
  };
  const near = { ...far, id: "near", z: 2 };
  assert.equal(hitTest([far, near], 5, 5), "near");
  assert.equal(hitTest([far], 20, 20), null);
});

function fact(id: string, kind: "rectangle" | "box"): SceneFact {
  const shared = {
    id,
    position: [0, 0, 0] as const,
    rotation: [0, 0, 0] as const,
    scale: [1, 1, 1] as const,
    width: 1,
    height: 1,
  };
  if (kind === "box") {
    return { ...shared, kind, depth: 1 };
  }
  return { ...shared, kind, depth: null };
}

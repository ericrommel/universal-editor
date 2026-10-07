import type { SceneFact } from "@uvcp/ai";

export const VIEW_WIDTH = 800;
export const VIEW_HEIGHT = 600;
const PIXELS_PER_UNIT = 64;
const YAW = (30 * Math.PI) / 180;
const PITCH = (15 * Math.PI) / 180;

export type ScreenPoint = {
  readonly x: number;
  readonly y: number;
};

export type ProjectedFace = {
  readonly name: string;
  readonly points: readonly ScreenPoint[];
};

export type ProjectedObject = {
  readonly id: string;
  readonly faces: readonly ProjectedFace[];
  readonly z: number;
};

type World = readonly [number, number, number];

const BOX_FACES: readonly {
  readonly name: string;
  readonly normal: World;
  readonly corners: readonly World[];
}[] = [
  {
    name: "+X",
    normal: [1, 0, 0],
    corners: [
      [1, -1, -1],
      [1, -1, 1],
      [1, 1, 1],
      [1, 1, -1],
    ],
  },
  {
    name: "-X",
    normal: [-1, 0, 0],
    corners: [
      [-1, -1, 1],
      [-1, -1, -1],
      [-1, 1, -1],
      [-1, 1, 1],
    ],
  },
  {
    name: "+Y",
    normal: [0, 1, 0],
    corners: [
      [-1, 1, -1],
      [1, 1, -1],
      [1, 1, 1],
      [-1, 1, 1],
    ],
  },
  {
    name: "-Y",
    normal: [0, -1, 0],
    corners: [
      [-1, -1, 1],
      [1, -1, 1],
      [1, -1, -1],
      [-1, -1, -1],
    ],
  },
  {
    name: "+Z",
    normal: [0, 0, 1],
    corners: [
      [-1, -1, 1],
      [-1, 1, 1],
      [1, 1, 1],
      [1, -1, 1],
    ],
  },
  {
    name: "-Z",
    normal: [0, 0, -1],
    corners: [
      [1, -1, -1],
      [1, 1, -1],
      [-1, 1, -1],
      [-1, -1, -1],
    ],
  },
];

export function projectScene(
  facts: readonly SceneFact[],
): readonly ProjectedObject[] {
  return facts.map(projectObject);
}

export function projectObject(fact: SceneFact): ProjectedObject {
  const center = cameraOf(place(fact, [0, 0, 0]));
  if (fact.kind === "rectangle") {
    const points = [
      world(-fact.width / 2, -fact.height / 2, 0),
      world(fact.width / 2, -fact.height / 2, 0),
      world(fact.width / 2, fact.height / 2, 0),
      world(-fact.width / 2, fact.height / 2, 0),
    ].map((corner) => toScreen(cameraOf(place(fact, corner))));
    return {
      id: fact.id,
      z: center[2],
      faces: [{ name: "face", points }],
    };
  }
  const faces: ProjectedFace[] = [];
  for (const face of BOX_FACES) {
    const normal = rotate(fact, scaleNormal(fact, face.normal));
    if (cameraOf(normal)[2] <= 0) {
      continue;
    }
    const points = face.corners.map((corner) =>
      toScreen(
        cameraOf(
          place(fact, [
            corner[0] * (fact.width / 2),
            corner[1] * (fact.height / 2),
            corner[2] * (fact.depth / 2),
          ]),
        ),
      ),
    );
    faces.push({ name: face.name, points });
  }
  return { id: fact.id, z: center[2], faces };
}

export function projectWorldPoint(
  x: number,
  y: number,
  z: number,
): ScreenPoint {
  return toScreen(cameraOf(world(x, y, z)));
}

export function hitTest(
  objects: readonly ProjectedObject[],
  x: number,
  y: number,
): string | null {
  let found: {
    readonly id: string;
    readonly z: number;
    readonly index: number;
  } | null = null;
  for (let index = 0; index < objects.length; index += 1) {
    const object = objects[index];
    if (object === undefined) {
      continue;
    }
    const hit = object.faces.some((face) => pointInPolygon(x, y, face.points));
    if (!hit) {
      continue;
    }
    if (
      found === null ||
      object.z > found.z ||
      (object.z === found.z && index > found.index)
    ) {
      found = { id: object.id, z: object.z, index };
    }
  }
  return found === null ? null : found.id;
}

function place(fact: SceneFact, local: World): World {
  const rotated = rotate(fact, [
    local[0] * fact.scale[0],
    local[1] * fact.scale[1],
    local[2] * fact.scale[2],
  ]);
  return [
    rotated[0] + fact.position[0],
    rotated[1] + fact.position[1],
    rotated[2] + fact.position[2],
  ];
}

function scaleNormal(fact: SceneFact, normal: World): World {
  return [
    fact.scale[0] < 0 ? -normal[0] : normal[0],
    fact.scale[1] < 0 ? -normal[1] : normal[1],
    fact.scale[2] < 0 ? -normal[2] : normal[2],
  ];
}

function rotate(fact: SceneFact, point: World): World {
  const rx = radians(fact.rotation[0]);
  const ry = radians(fact.rotation[1]);
  const rz = radians(fact.rotation[2]);
  let x = point[0];
  let y = point[1];
  let z = point[2];
  const yx = y * Math.cos(rx) - z * Math.sin(rx);
  const zx = y * Math.sin(rx) + z * Math.cos(rx);
  y = yx;
  z = zx;
  const xy = x * Math.cos(ry) + z * Math.sin(ry);
  const zy = -x * Math.sin(ry) + z * Math.cos(ry);
  x = xy;
  z = zy;
  const xz = x * Math.cos(rz) - y * Math.sin(rz);
  const yz = x * Math.sin(rz) + y * Math.cos(rz);
  return [xz, yz, z];
}

function cameraOf(point: World): World {
  const x1 = point[0] * Math.cos(YAW) + point[2] * Math.sin(YAW);
  const y1 = point[1];
  const z1 = -point[0] * Math.sin(YAW) + point[2] * Math.cos(YAW);
  return [
    x1,
    y1 * Math.cos(PITCH) - z1 * Math.sin(PITCH),
    y1 * Math.sin(PITCH) + z1 * Math.cos(PITCH),
  ];
}

function toScreen(point: World): ScreenPoint {
  return {
    x: VIEW_WIDTH / 2 + point[0] * PIXELS_PER_UNIT,
    y: VIEW_HEIGHT / 2 - point[1] * PIXELS_PER_UNIT,
  };
}

function pointInPolygon(
  x: number,
  y: number,
  points: readonly ScreenPoint[],
): boolean {
  let inside = false;
  for (
    let index = 0, previous = points.length - 1;
    index < points.length;
    previous = index++
  ) {
    const current = points[index];
    const prior = points[previous];
    if (current === undefined || prior === undefined || prior.y === current.y) {
      continue;
    }
    const crosses = current.y > y !== prior.y > y;
    if (!crosses) {
      continue;
    }
    const edge =
      ((prior.x - current.x) * (y - current.y)) / (prior.y - current.y) +
      current.x;
    if (x < edge) {
      inside = !inside;
    }
  }
  return inside;
}

function world(x: number, y: number, z: number): World {
  return [x, y, z];
}

function radians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

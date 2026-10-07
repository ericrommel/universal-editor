import {
  create as createQuat,
  fromEuler,
  normalize,
} from "gl-matrix/esm/quat.js";
import { create as createVec3, transformQuat } from "gl-matrix/esm/vec3.js";

const RADIANS_TO_DEGREES = 180 / Math.PI;

// gl-matrix quat.fromEuler takes degrees and builds an intrinsic XYZ quaternion.
// The scene rotation triple is radians in that same order. The conversion back
// is the inverse of that library function, pinned by the round-trip test.

export function eulerRadiansToQuaternion(
  rotation: readonly [number, number, number],
): readonly [number, number, number, number] {
  const quat = createQuat();
  fromEuler(
    quat,
    rotation[0] * RADIANS_TO_DEGREES,
    rotation[1] * RADIANS_TO_DEGREES,
    rotation[2] * RADIANS_TO_DEGREES,
  );
  return [quat[0] ?? 0, quat[1] ?? 0, quat[2] ?? 0, quat[3] ?? 0];
}

export function quaternionToEulerRadians(
  rotation: readonly [number, number, number, number],
): readonly [number, number, number] {
  const quat = createQuat();
  quat[0] = rotation[0];
  quat[1] = rotation[1];
  quat[2] = rotation[2];
  quat[3] = rotation[3];
  normalize(quat, quat);
  const x = quat[0];
  const y = quat[1];
  const z = quat[2];
  const w = quat[3];
  const sinX = 2 * (w * x + y * z);
  const cosX = 1 - 2 * (x * x + y * y);
  const ex = Math.atan2(sinX, cosX);
  const sinY = 2 * (w * y - z * x);
  let ey: number;
  if (sinY >= 1) {
    ey = Math.PI / 2;
  } else if (sinY <= -1) {
    ey = -Math.PI / 2;
  } else {
    ey = Math.asin(sinY);
  }
  const sinZ = 2 * (w * z + x * y);
  const cosZ = 1 - 2 * (y * y + z * z);
  const ez = Math.atan2(sinZ, cosZ);
  return [ex, ey, ez];
}

export function rotateScaledCenter(
  translation: readonly [number, number, number],
  rotation: readonly [number, number, number, number],
  scale: readonly [number, number, number],
  center: readonly [number, number, number],
): readonly [number, number, number] {
  const quat = createQuat();
  quat[0] = rotation[0];
  quat[1] = rotation[1];
  quat[2] = rotation[2];
  quat[3] = rotation[3];
  const offset = createVec3();
  offset[0] = center[0] * scale[0];
  offset[1] = center[1] * scale[1];
  offset[2] = center[2] * scale[2];
  const rotated = createVec3();
  transformQuat(rotated, offset, quat);
  return [
    translation[0] + (rotated[0] ?? 0),
    translation[1] + (rotated[1] ?? 0),
    translation[2] + (rotated[2] ?? 0),
  ];
}

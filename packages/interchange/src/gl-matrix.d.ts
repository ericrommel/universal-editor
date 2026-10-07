declare module "gl-matrix/esm/quat.js" {
  export type Quat = Float32Array;
  export function create(): Quat;
  export function fromEuler(out: Quat, x: number, y: number, z: number): Quat;
  export function normalize(out: Quat, a: Quat): Quat;
}

declare module "gl-matrix/esm/vec3.js" {
  export type Vec3 = Float32Array;
  export function create(): Vec3;
  export function transformQuat(out: Vec3, a: Vec3, q: Float32Array): Vec3;
}

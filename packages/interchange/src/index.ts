import type { Scene } from "@uvcp/core";
import { registerFormat, requireFormat } from "./format.ts";
import { gltfFormat } from "./gltf.ts";

registerFormat(gltfFormat);

export async function importDocument(
  formatId: string,
  bytes: Uint8Array,
): Promise<Scene> {
  return requireFormat(formatId).read(bytes);
}

export async function exportDocument(
  formatId: string,
  scene: Scene,
): Promise<Uint8Array> {
  return requireFormat(formatId).write(scene);
}

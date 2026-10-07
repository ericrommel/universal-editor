import { DomainError, type Scene } from "@uvcp/core";

const UNSUPPORTED_FORMAT = "Interchange document format is not supported.";

export type SceneFormat = {
  readonly id: string;
  read(bytes: Uint8Array): Promise<Scene>;
  write(scene: Scene): Promise<Uint8Array>;
};

const formats = new Map<string, SceneFormat>();

export function registerFormat(format: SceneFormat): void {
  if (formats.has(format.id)) {
    throw new Error(`Interchange format is already registered: ${format.id}`);
  }
  formats.set(format.id, format);
}

export function requireFormat(id: string): SceneFormat {
  const format = formats.get(id);
  if (!format) {
    throw new DomainError("UNSUPPORTED_FORMAT", UNSUPPORTED_FORMAT);
  }
  return format;
}

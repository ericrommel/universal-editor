import { DomainError } from "@uvcp/core";
import { encodeUtf8 } from "./utf8.ts";

const ENTRY_NAME_REJECTED = "Entry name is not accepted.";
const ENTRY_NAME_CONFLICT = "Entry names collide.";

export function checkEntryNames(names: readonly string[]): void {
  if (!Array.isArray(names)) {
    rejectName();
  }
  // A traversal name is rejected before a case collision is reported.
  const seen = new Set<string>();
  for (const name of names) {
    rejectUnlessAccepted(name);
    const folded = asciiFold(name);
    if (seen.has(folded)) {
      throw new DomainError("ENTRY_NAME_CONFLICT", ENTRY_NAME_CONFLICT);
    }
    seen.add(folded);
  }
}

function rejectUnlessAccepted(name: unknown): void {
  if (typeof name !== "string") {
    rejectName();
  }
  if (name !== name.normalize("NFC")) {
    rejectName();
  }
  const size = encodeUtf8(name).byteLength;
  if (size < 1 || size > 255) {
    rejectName();
  }
  for (let index = 0; index < name.length; index += 1) {
    const code = name.charCodeAt(index);
    if (code <= 0x1f || code === 0x7f || code === 0x5c || code === 0x3a) {
      rejectName();
    }
  }
  for (const segment of name.split("/")) {
    if (segment === "" || segment === "." || segment === "..") {
      rejectName();
    }
  }
}

function asciiFold(name: string): string {
  // String.toLowerCase folds more than ASCII A-Z. This module must not
  // treat those extra folds as collisions, because it extracts nothing.
  let folded = "";
  for (let index = 0; index < name.length; index += 1) {
    const code = name.charCodeAt(index);
    folded += String.fromCharCode(code >= 65 && code <= 90 ? code + 32 : code);
  }
  return folded;
}

function rejectName(): never {
  throw new DomainError("ENTRY_NAME_REJECTED", ENTRY_NAME_REJECTED);
}

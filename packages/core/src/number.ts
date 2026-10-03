import { DomainError } from "./domain-error.ts";

const NON_FINITE_NUMBER = "Expected a finite number.";

export function canonicalizeFiniteNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new DomainError("NON_FINITE_NUMBER", NON_FINITE_NUMBER);
  }
  // === treats -0 and 0 as equal, and the number literal 0 is +0.
  return value === 0 ? 0 : value;
}

export function canonicalizeFiniteTriple(
  value: unknown,
): readonly [number, number, number] {
  // ADR-0006 names one code for this helper. A value that is not three
  // finite numbers fails the same way a non-finite component does.
  if (!Array.isArray(value) || value.length !== 3) {
    throw new DomainError("NON_FINITE_NUMBER", NON_FINITE_NUMBER);
  }
  const components: readonly unknown[] = value;
  return [
    canonicalizeFiniteNumber(components[0]),
    canonicalizeFiniteNumber(components[1]),
    canonicalizeFiniteNumber(components[2]),
  ];
}

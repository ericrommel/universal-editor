export const capabilities = {
  "ai.scene.basic": {
    tier: "included",
    summary: "Create rectangles and boxes, and move, resize, or rotate them.",
  },
  "ai.scene.arrange": {
    tier: "paid",
    summary: "Arrange many objects automatically.",
  },
} as const;

export type CapabilityId = keyof typeof capabilities;

export type EntitlementDecision = "allowed" | "denied";

// A billing provider implements this. This build does not call a payment service.
export type EntitlementPort = {
  allows(capabilityId: CapabilityId): EntitlementDecision;
};

export const includedEntitlement: EntitlementPort = {
  allows(capabilityId) {
    return capabilities[capabilityId].tier === "included"
      ? "allowed"
      : "denied";
  },
};

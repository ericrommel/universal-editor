export type SrgbClearColor = {
  readonly space: "srgb";
  readonly red: number;
  readonly green: number;
  readonly blue: number;
  readonly alpha: number;
};

export type RenderSnapshot = {
  readonly width: number;
  readonly height: number;
  readonly devicePixelRatio: number;
  readonly clear: SrgbClearColor;
  readonly drawList: readonly [];
};

export type NullRenderResult = {
  readonly snapshot: RenderSnapshot;
  readonly backend: null;
  readonly device: "not-requested";
};

// No scene background exists in Module 0. Opaque sRGB black is the test double.
// Frozen and shared: a caller must not be able to store a scene by writing
// into the object the next call would otherwise reuse.
const CLEAR: SrgbClearColor = Object.freeze({
  space: "srgb",
  red: 0,
  green: 0,
  blue: 0,
  alpha: 1,
});

const EMPTY_DRAW_LIST: readonly [] = Object.freeze([]);

export function renderNull(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
): NullRenderResult {
  // There is no framebuffer to snap. The product is the physical size, and
  // the ratio is the one used to compute it, including a fractional ratio.
  return Object.freeze({
    snapshot: Object.freeze({
      width: cssWidth * devicePixelRatio,
      height: cssHeight * devicePixelRatio,
      devicePixelRatio,
      clear: CLEAR,
      drawList: EMPTY_DRAW_LIST,
    }),
    backend: null,
    device: "not-requested",
  });
}

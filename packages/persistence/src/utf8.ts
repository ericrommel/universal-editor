type Utf8Encoder = new () => {
  encode(input: string): Uint8Array;
};

type Utf8Decoder = new (
  label: "utf-8",
  options: { readonly fatal: true },
) => {
  decode(input: Uint8Array): string;
};

type Utf8Globals = {
  TextEncoder: Utf8Encoder;
  TextDecoder: Utf8Decoder;
};

function utf8Globals(): Utf8Globals {
  // Node provides these constructors. The DOM lib is forbidden in this
  // package, and the two globals do not justify a Node types dependency.
  return globalThis as unknown as Utf8Globals;
}

export function encodeUtf8(text: string): Uint8Array {
  const Encoder = utf8Globals().TextEncoder;
  return new Encoder().encode(text);
}

export function decodeUtf8Fatal(bytes: Uint8Array): string {
  const Decoder = utf8Globals().TextDecoder;
  return new Decoder("utf-8", { fatal: true }).decode(bytes);
}

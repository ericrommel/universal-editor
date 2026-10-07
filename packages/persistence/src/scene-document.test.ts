import assert from "node:assert/strict";
import test from "node:test";
import { createScene, DomainError, insertNode, type Scene } from "@uvcp/core";
import { readManifest, writeManifest } from "./manifest.ts";
import { readScene, writeScene } from "./scene-document.ts";

const SENTINEL = "SENTINEL_INPUT_BYTES_9f3a";
const FORMAT_ID = "universal-visual-creation-scene";
const MANIFEST =
  '{"formatId":"universal-visual-creation-project","schemaVersion":1}';

function bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function text(value: Uint8Array): string {
  return new TextDecoder().decode(value);
}

function expectError(run: () => void): DomainError {
  try {
    run();
  } catch (error) {
    assert.ok(error instanceof DomainError);
    assert.equal(error.cause, undefined);
    assert.equal(String(error.message).includes(SENTINEL), false);
    assert.equal(String(error.code).includes(SENTINEL), false);
    return error;
  }
  assert.fail("expected DomainError");
}

function rectangle(id: string, parentId: string | null, index: number) {
  return {
    id,
    kind: "rectangle" as const,
    parentId,
    index,
    transform: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    width: 2,
    height: 3,
  };
}

function sample(): Scene {
  let scene = insertNode(createScene(), {
    ...rectangle("a", null, 0),
    width: 2,
    height: 3,
  });
  scene = insertNode(scene, {
    id: "b",
    kind: "box",
    parentId: "a",
    index: 0,
    transform: {
      position: [-0, 1, 2],
      rotation: [0, 0, 0],
      scale: [-1, 1, 1],
    },
    width: 4,
    height: 5,
    depth: 6,
  });
  scene = insertNode(scene, rectangle("c", "a", 1));
  return scene;
}

test("an empty scene is not empty bytes", () => {
  const scene = createScene();
  const written = writeScene(scene);
  assert.equal(
    text(written),
    `{"formatId":"${FORMAT_ID}","schemaVersion":1,"roots":[],"nodes":[]}`,
  );
  assert.deepEqual(readScene(written).rootIds, []);
  const empty = expectError(() => readScene(new Uint8Array()));
  assert.equal(empty.code, "EMPTY");
  assert.equal(empty.message, "Scene document is empty.");
});

test("the writer is canonical and the reader ignores order", () => {
  const scene = sample();
  const first = writeScene(scene);
  const second = writeScene(scene);
  assert.deepEqual(first, second);
  const body = text(first);
  assert.equal(body.includes(" "), false);
  assert.equal(body.includes("\n"), false);
  assert.equal(body.charCodeAt(0), 0x7b);
  assert.equal(
    body,
    `{"formatId":"${FORMAT_ID}","schemaVersion":1,"roots":["a"],"nodes":[{"id":"a","kind":"rectangle","children":["b","c"],"transform":{"position":[0,0,0],"rotation":[0,0,0],"scale":[1,1,1]},"width":2,"height":3},{"id":"b","kind":"box","children":[],"transform":{"position":[0,1,2],"rotation":[0,0,0],"scale":[-1,1,1]},"width":4,"height":5,"depth":6},{"id":"c","kind":"rectangle","children":[],"transform":{"position":[0,0,0],"rotation":[0,0,0],"scale":[1,1,1]},"width":2,"height":3}]}`,
  );
  const read = readScene(first);
  assert.deepEqual(read.rootIds, ["a"]);
  assert.deepEqual(read.nodes.a?.childIds, ["b", "c"]);
  assert.equal(read.nodes.b?.kind, "box");
  assert.equal(Object.is(read.nodes.b?.transform.position[0], 0), true);
  assert.equal(read.nodes.b?.kind === "box" && read.nodes.b.depth, 6);
  assert.equal(Object.hasOwn(read, "selection"), false);

  const shuffled = `{"nodes":[{"id":"c","height":3,"width":2,"kind":"rectangle","transform":{"position":[0,0,0],"scale":[1,1,1],"rotation":[0,0,0]},"children":[]},{"depth":6,"height":5,"width":4,"transform":{"scale":[-1,1,1],"position":[0,1,2],"rotation":[0,0,0]},"children":[],"kind":"box","id":"b"},{"height":3,"width":2,"children":["b","c"],"kind":"rectangle","id":"a","transform":{"scale":[1,1,1],"rotation":[0,0,0],"position":[0,0,0]}}],"roots":["a"],"schemaVersion":1,"formatId":"${FORMAT_ID}"}`;
  assert.equal(text(writeScene(readScene(bytes(shuffled)))), body);
});

test("the scene codec stays separate from the manifest", () => {
  const manifest = writeManifest();
  assert.equal(text(manifest), MANIFEST);
  assert.equal(
    expectError(() => readScene(manifest)).code,
    "UNSUPPORTED_FORMAT",
  );
  const sceneBytes = writeScene(sample());
  assert.equal(
    expectError(() => readManifest(sceneBytes)).code,
    "INVALID_SHAPE",
  );
  const names = Object.getOwnPropertyNames(readManifest);
  assert.equal(names.includes("readScene"), false);
});

test("document failures use the first matching code and do not echo input", () => {
  const names = Object.getOwnPropertyNames(Object.prototype);
  const cases: { text: string; code: string }[] = [
    { text: "{", code: "INVALID_JSON" },
    {
      text: `{"formatId":"${FORMAT_ID}","formatId":"${FORMAT_ID}","schemaVersion":1,"roots":[],"nodes":[]}`,
      code: "DUPLICATE_KEY",
    },
    {
      text: `{"formatId":"${FORMAT_ID}","schemaVersion":1,"roots":[],"nodes":[{"id":"a","id":"a","kind":"rectangle","children":[],"transform":{"position":[0,0,0],"rotation":[0,0,0],"scale":[1,1,1]},"width":1,"height":1}]}`,
      code: "DUPLICATE_KEY",
    },
    {
      text: `{"\\u0066ormatId":"${FORMAT_ID}","formatId":"${SENTINEL}","schemaVersion":1,"roots":[],"nodes":[]}`,
      code: "DUPLICATE_KEY",
    },
    {
      text: `{"formatId":"${FORMAT_ID}","schemaVersion":1,"roots":[],"nodes":[],"selection":"${SENTINEL}"}`,
      code: "INVALID_SHAPE",
    },
    {
      text: `{"formatId":"${FORMAT_ID}","schemaVersion":1,"roots":[],"nodes":[],"__proto__":{"polluted":"${SENTINEL}"}}`,
      code: "INVALID_SHAPE",
    },
    {
      text: `{"formatId":"${FORMAT_ID}","schemaVersion":1,"roots":[],"nodes":[],"constructor":{"x":"${SENTINEL}"}}`,
      code: "INVALID_SHAPE",
    },
    {
      text: `{"formatId":"other-${SENTINEL}","schemaVersion":1,"roots":[],"nodes":[]}`,
      code: "UNSUPPORTED_FORMAT",
    },
    {
      text: `{"formatId":"${FORMAT_ID}","schemaVersion":1.0,"roots":[],"nodes":[]}`,
      code: "UNSUPPORTED_SCHEMA_VERSION",
    },
    {
      text: `{"formatId":"${FORMAT_ID}","schemaVersion":1e0,"roots":[],"nodes":[]}`,
      code: "UNSUPPORTED_SCHEMA_VERSION",
    },
    {
      text: `{"formatId":"${FORMAT_ID}","schemaVersion":"1","roots":[],"nodes":[]}`,
      code: "UNSUPPORTED_SCHEMA_VERSION",
    },
    {
      text: `{"formatId":"${FORMAT_ID}","schemaVersion":1,"roots":[],"nodes":[{"id":"a","kind":"${SENTINEL}","children":[],"transform":{"position":[0,0,0],"rotation":[0,0,0],"scale":[1,1,1]},"width":1,"height":1}]}`,
      code: "INVALID_SHAPE",
    },
    {
      text: `{"formatId":"${FORMAT_ID}","schemaVersion":1,"roots":["a","a"],"nodes":[{"id":"a","kind":"rectangle","children":[],"transform":{"position":[0,0,0],"rotation":[0,0,0],"scale":[1,1,1]},"width":1,"height":1},{"id":"a","kind":"box","children":[],"transform":{"position":[0,0,0],"rotation":[0,0,0],"scale":[1,1,1]},"width":1,"height":1,"depth":1}]}`,
      code: "DUPLICATE_ID",
    },
    {
      text: `{"formatId":"${FORMAT_ID}","schemaVersion":1,"roots":["a"],"nodes":[{"id":"a","kind":"rectangle","children":["a"],"transform":{"position":[0,0,0],"rotation":[0,0,0],"scale":[1,1,1]},"width":1,"height":1}]}`,
      code: "INVALID_HIERARCHY",
    },
    {
      text: `{"formatId":"${FORMAT_ID}","schemaVersion":1,"roots":["a"],"nodes":[{"id":"a","kind":"rectangle","children":["missing"],"transform":{"position":[0,0,0],"rotation":[0,0,0],"scale":[1,1,1]},"width":1,"height":1}]}`,
      code: "INVALID_HIERARCHY",
    },
    {
      text: `{"formatId":"${FORMAT_ID}","schemaVersion":1,"roots":["a","b"],"nodes":[{"id":"a","kind":"rectangle","children":["c"],"transform":{"position":[0,0,0],"rotation":[0,0,0],"scale":[1,1,1]},"width":1,"height":1},{"id":"b","kind":"rectangle","children":["c"],"transform":{"position":[0,0,0],"rotation":[0,0,0],"scale":[1,1,1]},"width":1,"height":1},{"id":"c","kind":"box","children":[],"transform":{"position":[0,0,0],"rotation":[0,0,0],"scale":[1,1,1]},"width":1,"height":1,"depth":1}]}`,
      code: "INVALID_HIERARCHY",
    },
    {
      text: `{"formatId":"${FORMAT_ID}","schemaVersion":1,"roots":[],"nodes":[{"id":"orphan","kind":"rectangle","children":[],"transform":{"position":[0,0,0],"rotation":[0,0,0],"scale":[1,1,1]},"width":1,"height":1}]}`,
      code: "INVALID_HIERARCHY",
    },
  ];
  for (const item of cases) {
    const error = expectError(() => readScene(bytes(item.text)));
    assert.equal(error.code, item.code, item.text.slice(0, 80));
  }
  assert.equal(expectError(() => readScene(bytes(""))).code, "EMPTY");
  assert.deepEqual(Object.getOwnPropertyNames(Object.prototype), names);
  const notBytes = expectError(() =>
    readScene(SENTINEL as unknown as Uint8Array),
  );
  assert.equal(notBytes.code, "INVALID_SHAPE");
});

test("the byte cap is applied before decode", () => {
  const over = new Uint8Array(1048577);
  over[over.length - 1] = 0xff;
  const tooLarge = expectError(() => readScene(over));
  assert.equal(tooLarge.code, "TOO_LARGE");
  assert.equal(tooLarge.message, "Scene document exceeds the size limit.");

  const exact = new Uint8Array(1048576);
  exact.fill(0x20);
  const notLength = expectError(() => readScene(exact));
  assert.notEqual(notLength.code, "TOO_LARGE");
  assert.equal(notLength.code, "INVALID_JSON");

  const bom = new Uint8Array([0xef, 0xbb, 0xbf, 0x7b]);
  assert.equal(expectError(() => readScene(bom)).code, "INVALID_ENCODING");
  assert.equal(
    expectError(() => readScene(new Uint8Array([0xff]))).code,
    "INVALID_ENCODING",
  );
});

test("a finite zero extent is rejected after non-finite checks", () => {
  const zero = `{"formatId":"${FORMAT_ID}","schemaVersion":1,"roots":["a"],"nodes":[{"id":"a","kind":"rectangle","children":[],"transform":{"position":[0,0,0],"rotation":[0,0,0],"scale":[1,1,1]},"width":0,"height":1}]}`;
  assert.equal(
    expectError(() => readScene(bytes(zero))).code,
    "INVALID_EXTENT",
  );
  const negativeZero = `{"formatId":"${FORMAT_ID}","schemaVersion":1,"roots":["a"],"nodes":[{"id":"a","kind":"rectangle","children":[],"transform":{"position":[0,0,0],"rotation":[0,0,0],"scale":[1,1,1]},"width":-0,"height":1}]}`;
  assert.equal(
    expectError(() => readScene(bytes(negativeZero))).code,
    "INVALID_EXTENT",
  );
  const nonFinite = `{"formatId":"${FORMAT_ID}","schemaVersion":1,"roots":["a"],"nodes":[{"id":"a","kind":"rectangle","children":[],"transform":{"position":[0,0,0],"rotation":[0,0,0],"scale":[1,1,1]},"width":"1","height":1}]}`;
  assert.equal(
    expectError(() => readScene(bytes(nonFinite))).code,
    "NON_FINITE_NUMBER",
  );
  const both = `{"formatId":"${FORMAT_ID}","schemaVersion":1,"roots":["a"],"nodes":[{"id":"a","kind":"rectangle","children":[],"transform":{"position":[1e309,0,0],"rotation":[0,0,0],"scale":[1,1,1]},"width":0,"height":1}]}`;
  assert.equal(
    expectError(() => readScene(bytes(both))).code,
    "NON_FINITE_NUMBER",
  );
});

test("deep nesting does not escape as a host error", () => {
  const depth = 20000;
  const nested =
    "[".repeat(depth) + JSON.stringify(SENTINEL) + "]".repeat(depth);
  assert.ok(nested.length < 1048576);
  const error = expectError(() => readScene(bytes(nested)));
  assert.ok(error.code === "INVALID_JSON" || error.code === "INVALID_SHAPE");
});

test("a scene whose canonical bytes exceed the cap is not written", () => {
  let scene = createScene();
  const count = 8000;
  for (let index = 0; index < count; index += 1) {
    scene = insertNode(scene, rectangle(`n${index}`, null, index));
  }
  const error = expectError(() => writeScene(scene));
  assert.equal(error.code, "TOO_LARGE");
});

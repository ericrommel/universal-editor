import assert from "node:assert/strict";
import test from "node:test";
import { DomainError } from "./domain-error.ts";
import {
  createScene,
  deleteNode,
  insertNode,
  replaceExtents,
  replaceTransform,
} from "./scene.ts";

const SENTINEL = "SENTINEL_INPUT_BYTES_9f3a";

function transform(scale: readonly number[] = [1, 1, 1]) {
  return {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale,
  };
}

function rectangle(
  id: string,
  parentId: string | null,
  index: number,
  fields: Record<string, unknown> = {},
) {
  return {
    id,
    kind: "rectangle",
    parentId,
    index,
    transform: transform(),
    width: 2,
    height: 3,
    ...fields,
  };
}

function box(
  id: string,
  parentId: string | null,
  index: number,
  fields: Record<string, unknown> = {},
) {
  return {
    ...rectangle(id, parentId, index),
    kind: "box",
    depth: 4,
    ...fields,
  };
}

function expectError(run: () => void): DomainError {
  try {
    run();
  } catch (error) {
    assert.ok(error instanceof DomainError);
    assert.equal(error.cause, undefined);
    assert.equal(error.message.includes(SENTINEL), false);
    assert.equal(error.code.includes(SENTINEL), false);
    return error;
  }
  assert.fail("expected DomainError");
}

test("createScene returns one frozen empty scene", () => {
  const scene = createScene();
  assert.deepEqual(Object.keys(scene).sort(), ["nodes", "rootIds"]);
  assert.deepEqual(scene.rootIds, []);
  assert.deepEqual(Object.keys(scene.nodes), []);
  assert.equal(Object.hasOwn(scene, "selection"), false);
  assert.equal(Object.isFrozen(scene), true);
  assert.equal(Object.isFrozen(scene.rootIds), true);
  assert.equal(Object.isFrozen(scene.nodes), true);
});

test("rectangle and box share one hierarchy", () => {
  const boxParent = insertNode(createScene(), box("box", null, 0));
  const withRectangle = insertNode(boxParent, rectangle("rect", "box", 0));
  assert.deepEqual(withRectangle.rootIds, ["box"]);
  assert.equal(withRectangle.nodes.box?.kind, "box");
  assert.equal(withRectangle.nodes.rect?.kind, "rectangle");
  assert.deepEqual(withRectangle.nodes.box?.childIds, ["rect"]);

  const rectParent = insertNode(createScene(), rectangle("rect", null, 0));
  const withBox = insertNode(rectParent, box("box", "rect", 0));
  assert.deepEqual(withBox.nodes.rect?.childIds, ["box"]);
  assert.equal(withBox.nodes.box?.kind, "box");
  assert.equal(Object.hasOwn(withBox.nodes.rect ?? {}, "depth"), false);
  assert.equal(withBox.nodes.box?.kind === "box" && withBox.nodes.box.depth, 4);
});

test("insert at an index and a missing parent wins", () => {
  const first = insertNode(createScene(), rectangle("a", null, 0));
  const second = insertNode(first, rectangle("b", null, 1));
  const third = insertNode(second, rectangle("c", null, 1));
  assert.deepEqual(third.rootIds, ["a", "c", "b"]);

  const appended = insertNode(third, rectangle("d", null, 3));
  assert.deepEqual(appended.rootIds, ["a", "c", "b", "d"]);

  const parent = insertNode(createScene(), rectangle("p", null, 0));
  const child = insertNode(parent, rectangle("c", "p", 0));
  const firstChild = insertNode(child, rectangle("d", "p", 0));
  assert.deepEqual(firstChild.nodes.p?.childIds, ["d", "c"]);

  const badIndex = expectError(() => {
    insertNode(firstChild, rectangle("e", "p", -1));
  });
  assert.equal(badIndex.code, "INVALID_HIERARCHY");
  assert.equal(
    expectError(() => insertNode(firstChild, rectangle("e", "p", 1.5))).code,
    "INVALID_HIERARCHY",
  );
  assert.equal(
    expectError(() => insertNode(firstChild, rectangle("e", "p", 3))).code,
    "INVALID_HIERARCHY",
  );
  const missing = expectError(() => {
    insertNode(firstChild, rectangle("e", `missing-${SENTINEL}`, 1.5));
  });
  assert.equal(missing.code, "UNKNOWN_NODE");
  assert.equal(missing.message, "Scene node was not found.");
  assert.deepEqual(firstChild.nodes.p?.childIds, ["d", "c"]);
});

test("triples canonicalize -0 and reject non-finite values", () => {
  const scene = insertNode(
    createScene(),
    rectangle("a", null, 0, {
      transform: {
        position: [-0, 1, 2],
        rotation: [0, -0, 4],
        scale: [-1, 1, -0],
      },
    }),
  );
  const node = scene.nodes.a;
  assert.ok(node);
  assert.equal(Object.is(node.transform.position[0], 0), true);
  assert.equal(Object.is(node.transform.position[0], -0), false);
  assert.equal(Object.is(node.transform.scale[0], -1), true);
  assert.equal(Object.is(node.transform.scale[2], 0), true);
  assert.equal(Object.isFrozen(node.transform.position), true);
  assert.equal(Object.isFrozen(node.transform), true);

  const nan = expectError(() => {
    insertNode(
      scene,
      rectangle("b", null, 1, {
        transform: {
          position: [Number.NaN, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
      }),
    );
  });
  assert.equal(nan.code, "NON_FINITE_NUMBER");
  assert.equal(nan.message, "Expected a finite number.");
  assert.equal(scene.nodes.b, undefined);

  const replaced = replaceTransform(scene, "a", {
    position: [3, 4, 5],
    rotation: [0, 0, 0],
    scale: [2, 2, 2],
  });
  assert.deepEqual(replaced.nodes.a?.transform.position, [3, 4, 5]);
  assert.equal(replaced.nodes.a?.kind, "rectangle");
  assert.deepEqual(scene.nodes.a?.transform.position, [0, 1, 2]);
  const unknown = expectError(() => {
    replaceTransform(scene, SENTINEL, {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    });
  });
  assert.equal(unknown.code, "UNKNOWN_NODE");
});

test("extents are strictly positive and depth stays on the box", () => {
  const scene = insertNode(createScene(), rectangle("a", null, 0));
  const zero = expectError(() => {
    insertNode(scene, rectangle("b", null, 1, { width: 0 }));
  });
  assert.equal(zero.code, "INVALID_EXTENT");
  assert.equal(zero.message, "Scene extent is not accepted.");
  assert.equal(
    expectError(() =>
      insertNode(scene, rectangle("b", null, 1, { height: -1 })),
    ).code,
    "INVALID_EXTENT",
  );
  assert.equal(
    expectError(() => insertNode(scene, rectangle("b", null, 1, { width: -0 })))
      .code,
    "INVALID_EXTENT",
  );
  assert.equal(
    expectError(() => insertNode(scene, rectangle("b", null, 1, { depth: 1 })))
      .code,
    "INVALID_SHAPE",
  );
  assert.equal(
    expectError(() =>
      insertNode(scene, box("b", null, 1, { depth: undefined })),
    ).code,
    "NON_FINITE_NUMBER",
  );
  const changed = replaceExtents(scene, "a", { width: 8, height: 9 });
  assert.equal(changed.nodes.a?.width, 8);
  assert.equal(scene.nodes.a?.width, 2);
  assert.equal(
    expectError(() =>
      replaceExtents(scene, "a", { width: 1, height: 1, depth: 1 }),
    ).code,
    "INVALID_SHAPE",
  );
  assert.equal(scene.nodes.b, undefined);
});

test("delete removes one subtree and leaves the rest", () => {
  let scene = insertNode(createScene(), rectangle("root", null, 0));
  scene = insertNode(scene, rectangle("keep", "root", 0));
  scene = insertNode(scene, rectangle("mid", "root", 1));
  scene = insertNode(scene, box("leaf", "mid", 0));
  const deleted = deleteNode(scene, "mid");
  assert.equal(deleted.nodes.mid, undefined);
  assert.equal(deleted.nodes.leaf, undefined);
  assert.deepEqual(deleted.nodes.root?.childIds, ["keep"]);
  assert.equal(deleted.nodes.keep?.kind, "rectangle");
  assert.deepEqual(scene.nodes.root?.childIds, ["keep", "mid"]);
  const unknown = expectError(() => deleteNode(deleted, SENTINEL));
  assert.equal(unknown.code, "UNKNOWN_NODE");
  assert.equal(
    deleteNode(deleteNode(deleted, "keep"), "root").rootIds.length,
    0,
  );
  assert.deepEqual(Object.keys(deleteNode(deleted, "root").nodes), []);
});

test("ids are caller-supplied and closed", () => {
  const scene = insertNode(createScene(), rectangle("A", null, 0));
  assert.equal(insertNode(scene, rectangle("a", null, 1)).nodes.a?.id, "a");
  assert.equal(
    insertNode(scene, rectangle(`${"a".repeat(63)} `, null, 1)).nodes[
      `${"a".repeat(63)} `
    ]?.id,
    `${"a".repeat(63)} `,
  );
  assert.equal(
    insertNode(createScene(), rectangle("a".repeat(64), null, 0)).rootIds[0],
    "a".repeat(64),
  );
  assert.equal(
    expectError(() => insertNode(scene, rectangle("", null, 1))).code,
    "INVALID_ID",
  );
  assert.equal(
    expectError(() => insertNode(scene, rectangle("a".repeat(65), null, 1)))
      .code,
    "INVALID_ID",
  );
  assert.equal(
    expectError(() => insertNode(scene, rectangle("e\u0301", null, 1))).code,
    "INVALID_ID",
  );
  assert.equal(
    expectError(() =>
      insertNode(scene, rectangle(`a\u0000${SENTINEL}`, null, 1)),
    ).code,
    "INVALID_ID",
  );
  assert.equal(
    expectError(() => insertNode(scene, rectangle("\u007f", null, 1))).code,
    "INVALID_ID",
  );
  const named = insertNode(createScene(), rectangle(SENTINEL, null, 0));
  const duplicate = expectError(() =>
    insertNode(named, rectangle(SENTINEL, null, 1)),
  );
  assert.equal(duplicate.code, "DUPLICATE_ID");
  assert.equal(duplicate.message, "Scene contains a duplicate id.");
  const omitted = { ...rectangle("a", null, 1) };
  delete omitted.id;
  assert.equal(
    expectError(() => insertNode(scene, omitted)).code,
    "INVALID_SHAPE",
  );
  assert.equal(
    insertNode(createScene(), rectangle("\u00e9", null, 0)).rootIds[0],
    "\u00e9",
  );
});

test("a rejected insert does not mutate the scene or Object.prototype", () => {
  const names = Object.getOwnPropertyNames(Object.prototype);
  const scene = insertNode(createScene(), rectangle("a", null, 0));
  expectError(() => insertNode(scene, rectangle("b", null, 0, { width: 0 })));
  assert.deepEqual(scene.rootIds, ["a"]);
  assert.equal(scene.nodes.b, undefined);
  assert.deepEqual(Object.getOwnPropertyNames(Object.prototype), names);
  const protoId = "__proto__";
  const stored = insertNode(createScene(), rectangle(protoId, null, 0));
  assert.equal(Object.hasOwn(stored.nodes, protoId), true);
  assert.equal(stored.nodes[protoId]?.id, protoId);
  assert.deepEqual(Object.getOwnPropertyNames(Object.prototype), names);
});

test("operations return a new scene", () => {
  const scene = insertNode(createScene(), box("a", null, 0));
  const next = replaceExtents(scene, "a", { width: 5, height: 6, depth: 7 });
  assert.notEqual(next, scene);
  assert.equal(scene.nodes.a?.kind === "box" && scene.nodes.a.depth, 4);
  assert.equal(next.nodes.a?.kind === "box" && next.nodes.a.depth, 7);
  assert.equal(Object.isFrozen(next.nodes.a), true);
});

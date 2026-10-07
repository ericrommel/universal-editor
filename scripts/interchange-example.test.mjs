import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { importDocument } from "../packages/interchange/src/index.ts";

test("the committed crate example imports", async () => {
  const bytes = new Uint8Array(
    await readFile("examples/interchange/crate-and-card.glb"),
  );
  const scene = await importDocument("gltf", bytes);
  assert.deepEqual(scene.rootIds, ["crate"]);
  assert.equal(scene.nodes.crate?.kind, "box");
  assert.deepEqual(scene.nodes.crate?.childIds, ["card"]);
  assert.equal(scene.nodes.card?.kind, "rectangle");
});

test("the committed external cube imports", async () => {
  const bytes = new Uint8Array(
    await readFile("examples/interchange/unit-cube.glb"),
  );
  const scene = await importDocument("gltf", bytes);
  const cube = scene.nodes.cube;
  assert.equal(scene.rootIds.length, 1);
  assert.equal(cube?.kind, "box");
  if (cube?.kind === "box") {
    assert.equal(cube.width, 1);
    assert.equal(cube.height, 1);
    assert.equal(cube.depth, 1);
  }
});

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { importDocument } from "../packages/interchange/src/index.ts";
import {
  crateAndCardBytes,
  unitCubeBytes,
} from "../packages/interchange/src/sample-files.ts";

const samplePath = "examples/interchange/crate-and-card.glb";
const cubePath = "examples/interchange/unit-cube.glb";

const command = process.argv[2];
if (command === "--write-examples") {
  await mkdir("examples/interchange", { recursive: true });
  await writeFile(samplePath, await crateAndCardBytes());
  await writeFile(cubePath, await unitCubeBytes());
  console.log(`wrote ${samplePath}`);
  console.log(`wrote ${cubePath}`);
} else {
  const path = command ?? samplePath;
  const bytes = new Uint8Array(await readFile(path));
  printScene(await importDocument("gltf", bytes));
}

function printScene(scene) {
  const pending = scene.rootIds.map((id) => [id, 0]);
  while (pending.length > 0) {
    const next = pending.shift();
    if (!next) {
      break;
    }
    const [id, depth] = next;
    const node = scene.nodes[id];
    if (!node) {
      continue;
    }
    const pad = "  ".repeat(depth);
    const size =
      node.kind === "box"
        ? `${node.width} x ${node.height} x ${node.depth}`
        : `${node.width} x ${node.height}`;
    console.log(`${pad}${node.kind} ${node.id} ${size}`);
    for (let index = node.childIds.length - 1; index >= 0; index -= 1) {
      pending.unshift([node.childIds[index], depth + 1]);
    }
  }
}

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { strings } from "../packages/ui/src/strings.ts";
import { tokens } from "../packages/ui/src/tokens.ts";
import {
  previewAccepted,
  previewReady,
  productionPolicy,
  readProductionBuild,
} from "./preview-smoke.mjs";

test("the preview smoke accepts only HTTP 200 with the production policy", () => {
  assert.equal(previewAccepted(200, productionPolicy), true);
  assert.equal(
    previewAccepted(200, `${productionPolicy}; connect-src 'self'`),
    false,
  );
  assert.equal(
    previewAccepted(200, `${productionPolicy}; style-src 'unsafe-inline'`),
    false,
  );
  assert.equal(previewAccepted(404, productionPolicy), false);
  assert.equal(previewAccepted(200, undefined), false);
});

test("the production build keeps foundation copy and excludes the dev failure switch", () => {
  withBuild((dir) => {
    const build = readProductionBuild(dir);
    assert.deepEqual(build.problems, []);
    assert.equal(build.assets.length, 2);
  });
});

test("the production build check names a canvas, an escaped asset, and the failure switch", () => {
  const missing = fs.mkdtempSync(path.join(os.tmpdir(), "uvcp-missing-"));
  fs.rmSync(missing, { recursive: true, force: true });
  assert.deepEqual(readProductionBuild(missing).problems, [
    "build directory is absent",
  ]);
  withBuild((dir) => {
    fs.appendFileSync(path.join(dir, "assets", "app.js"), "\nnode:fs");
    const problems = readProductionBuild(dir).problems;
    assert.ok(problems.some((problem) => problem.includes("Node file module")));
  });
  withBuild((dir) => {
    fs.appendFileSync(
      path.join(dir, "assets", "app.js"),
      "\nUVCP_FORCE_INIT_FAILURE",
    );
    const problems = readProductionBuild(dir).problems;
    assert.ok(
      problems.some((problem) => problem.includes("UVCP_FORCE_INIT_FAILURE")),
    );
  });
  withBuild((dir) => {
    const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
    fs.writeFileSync(
      path.join(dir, "index.html"),
      html.replace('id="root"', 'id="root"></div><canvas id="probe"'),
    );
    const problems = readProductionBuild(dir).problems;
    assert.ok(problems.some((problem) => problem.includes("canvas element")));
  });
  withBuild((dir) => {
    replaceScript(dir, "/assets/app.js");
    const problems = readProductionBuild(dir).problems;
    assert.ok(
      problems.some((problem) => problem.includes("not a relative build path")),
    );
  });
  withBuild((dir) => {
    replaceScript(dir, "./../outside.js");
    const problems = readProductionBuild(dir).problems;
    assert.ok(problems.some((problem) => problem.includes("resolves outside")));
  });
  withBuild((dir) => {
    fs.writeFileSync(path.join(dir, "assets", "app.js"), "not the foundation");
    const problems = readProductionBuild(dir).problems;
    assert.ok(
      problems.some((problem) => problem.includes(strings.productName)),
    );
  });
});

function withBuild(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "uvcp-build-"));
  try {
    fs.mkdirSync(path.join(dir, "assets"));
    fs.writeFileSync(path.join(dir, "assets", "app.js"), foundationScript());
    fs.writeFileSync(path.join(dir, "assets", "app.css"), foundationCss());
    fs.writeFileSync(path.join(dir, "index.html"), foundationHtml());
    run(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function replaceScript(dir, src) {
  const html = fs
    .readFileSync(path.join(dir, "index.html"), "utf8")
    .replace('src="./assets/app.js"', `src="${src}"`);
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

function foundationScript() {
  return [
    strings.productName,
    strings.purpose,
    strings.statusLabel,
    strings.statusStarting,
    strings.statusReady,
    strings.statusNotReady,
    strings.detailStarting,
    strings.detailReady,
    strings.detailNotReady,
    strings.showDetails,
    strings.hideDetails,
    strings.diagnosticEmpty,
    strings.webDocumentTitle,
  ].join("\n");
}

function foundationCss() {
  const hexes = [];
  for (const palette of [tokens.color.light, tokens.color.dark]) {
    hexes.push(
      palette.canvas,
      palette.surface,
      palette.text.primary,
      palette.text.secondary,
      palette.border,
      palette.focus,
      palette.status.ready,
      palette.status.failed,
    );
  }
  return `${hexes.join(";")};--uvcp-canvas:${tokens.color.light.canvas};CanvasText;Highlight;36rem;user-select:text;`;
}

function foundationHtml() {
  return `<!doctype html>
<html lang="en">
<head>
<title>${strings.webDocumentTitle}</title>
</head>
<body>
<div id="root"></div>
<script type="module" src="./assets/app.js"></script>
<link rel="stylesheet" href="./assets/app.css">
</body>
</html>`;
}

test("a colored ready line still counts and an in-use error does not", () => {
  const colored =
    "\u001b[32m➜\u001b[39m  \u001b[1mLocal\u001b[22m:   \u001b[36mhttp://127.0.0.1:\u001b[1m5173\u001b[22m/\u001b[39m";
  assert.equal(previewReady(colored), true);
  assert.equal(previewReady("  ➜  Local:   http://127.0.0.1:5173/"), true);
  assert.equal(previewReady("Port 5173 is already in use"), false);
  assert.equal(previewReady("http://127.0.0.1:5173/ is already in use"), false);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const PRODUCT = "Universal Visual Creation Platform";
const AI_UNAVAILABLE =
  "AI is not available on this page. Drawing, save, and open still work. To use AI, run the local application.";

export async function runFirstUse(page, origin, productionPolicy, root) {
  const response = await page.goto(origin);
  assert.ok(response !== null);
  assert.equal(response.status(), 200);
  assert.equal(response.headers()["content-security-policy"], productionPolicy);
  assert.equal(response.headers()["x-content-type-options"], "nosniff");
  assert.equal(response.headers()["referrer-policy"], "no-referrer");

  await page.waitForFunction((title) => document.title === title, PRODUCT);
  await page.getByRole("heading", { level: 1, name: PRODUCT }).waitFor();
  await page.getByRole("heading", { name: "Start with a shape" }).waitFor();
  await page.getByText(AI_UNAVAILABLE).waitFor();
  await page.getByRole("button", { name: "Rectangle", exact: true }).click();
  await page.locator('[data-shape-id="s1"] rect.uvcp-face-front').waitFor();
  const guideCoversShape = await page.evaluate(() => {
    const rect = document.querySelector(
      '[data-shape-id="s1"] rect.uvcp-face-front',
    );
    const guide = document.querySelector(".uvcp-guide");
    if (rect === null || guide === null) {
      return true;
    }
    const box = rect.getBoundingClientRect();
    const hit = document.elementFromPoint(
      box.x + box.width / 2,
      box.y + box.height / 2,
    );
    return hit !== null && guide.contains(hit);
  });
  assert.equal(guideCoversShape, false);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.locator('[data-shape-id="s1"]').waitFor({ state: "hidden" });
  await page.getByRole("heading", { name: "Assistant" }).waitFor({
    state: "hidden",
  });
  assert.equal(await page.locator('input[type="password"]').count(), 0);
  assert.equal(await page.locator("canvas").count(), 0);
  await page
    .locator(".uvcp-inspector")
    .getByText("Add a rectangle, an ellipse, text, or a box.")
    .waitFor();

  await page.getByRole("button", { name: "AI setup", exact: true }).click();
  await page.getByRole("heading", { name: "Assistant" }).waitFor();
  await page.getByText("does not ask for a provider key").waitFor();
  await page.getByRole("heading", { name: "Start with a shape" }).waitFor({
    state: "hidden",
  });
  assert.equal(await page.locator('input[type="password"]').count(), 0);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("heading", { name: "Assistant" }).waitFor({
    state: "hidden",
  });

  await page.getByRole("button", { name: "Guide", exact: true }).click();
  await page.getByRole("heading", { name: "Start with a shape" }).waitFor();
  await page.getByRole("heading", { name: "Assistant" }).waitFor({
    state: "hidden",
  });
  await page.getByRole("button", { name: "Start creating" }).click();
  await page.getByRole("heading", { name: "Start with a shape" }).waitFor({
    state: "hidden",
  });
  await page.reload();
  await page.getByText(AI_UNAVAILABLE).waitFor();
  await page.getByRole("heading", { name: "Start with a shape" }).waitFor({
    state: "hidden",
  });

  await page.setViewportSize({ width: 1280, height: 800 });
  await assertNoHorizontalOverflow(page, [800, 1280, 1366, 1920]);
  await assertToolbarTips(page);

  const undo = page.getByRole("button", { name: "Undo", exact: true });
  const redo = page.getByRole("button", { name: "Redo", exact: true });
  const remove = page.getByRole("button", { name: "Delete", exact: true });
  assert.equal(await undo.isDisabled(), true);
  assert.equal(await redo.isDisabled(), true);
  assert.equal(await remove.isDisabled(), true);

  await page.getByRole("button", { name: "Rectangle", exact: true }).click();
  const rectangle = page.locator('[data-shape-id="s1"] rect.uvcp-face-front');
  await rectangle.waitFor();
  assert.equal(await undo.isDisabled(), false);
  assert.equal(await redo.isDisabled(), true);
  assert.equal(await remove.isDisabled(), false);
  assert.equal(
    await page.getByRole("button", { name: "Send backward" }).isDisabled(),
    true,
  );
  assert.equal(
    await page.getByRole("button", { name: "Bring forward" }).isDisabled(),
    true,
  );

  // The pointer has left, so the create-tool bubble is hidden. Escape clears
  // the selection on that key instead of dismissing an invisible tooltip.
  await page.mouse.move(640, 400);
  await page
    .getByRole("tooltip", { name: "Rectangle", exact: true })
    .waitFor({ state: "hidden" });
  await page.keyboard.press("Escape");
  assert.equal(await remove.isDisabled(), true);
  await page.getByRole("option", { name: "Rectangle s1" }).click();
  assert.equal(await remove.isDisabled(), false);

  // A tooltip that is actually showing still takes the first Escape.
  await undo.focus();
  const undoTip = page.getByRole("tooltip", { name: "Undo (Ctrl+Z)" });
  await undoTip.waitFor();
  await page.keyboard.press("Escape");
  await undoTip.waitFor({ state: "hidden" });
  assert.equal(await remove.isDisabled(), false);

  await page.getByRole("button", { name: "Box", exact: true }).click();
  await page.locator('[data-shape-id="s2"] polygon.uvcp-face-top').waitFor();
  await page.locator('[data-shape-id="s2"] polygon.uvcp-face-side').waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Bring forward" }).isDisabled(),
    true,
  );
  assert.equal(
    await page.getByRole("button", { name: "Send backward" }).isDisabled(),
    false,
  );
  assert.equal(
    await page.locator('[data-shape-id="s2"] rect.uvcp-face-front').count(),
    1,
  );

  await page.getByRole("option", { name: "Rectangle s1" }).click();
  await remove.click();
  await page.getByRole("option", { name: "Rectangle s1" }).waitFor({
    state: "hidden",
  });
  await page.getByRole("option", { name: "Box s2" }).waitFor();
  await undo.click();
  await page.getByRole("option", { name: "Rectangle s1" }).waitFor();
  assert.equal(await redo.isDisabled(), false);

  const front = page.locator('[data-shape-id="s1"] rect.uvcp-face-front');
  const clicked = await front.boundingBox();
  assert.ok(clicked !== null);
  await page.mouse.click(clicked.x + 24, clicked.y + 24);
  assert.equal(await redo.isDisabled(), false);
  await redo.click();
  await page.getByRole("option", { name: "Rectangle s1" }).waitFor({
    state: "hidden",
  });
  await undo.click();
  await page.getByRole("option", { name: "Box s2" }).click();
  await remove.click();
  await page.getByRole("option", { name: "Box s2" }).waitFor({
    state: "hidden",
  });

  const shape = page.locator('[data-shape-id="s1"] rect.uvcp-face-front');
  await shape.waitFor();
  const startX = Number(await shape.getAttribute("x"));
  const before = await shape.boundingBox();
  assert.ok(before !== null);
  await page.mouse.move(before.x + 30, before.y + 30);
  await page.mouse.down();
  await page.mouse.move(before.x + 140, before.y + 80);
  await page.mouse.up();
  await page.waitForFunction((start) => {
    const rect = document.querySelector(
      '[data-shape-id="s1"] rect.uvcp-face-front',
    );
    return rect !== null && Number(rect.getAttribute("x")) !== start;
  }, startX);
  const movedX = Number(await shape.getAttribute("x"));
  assert.ok(Math.abs(movedX - startX) > 1);

  await undo.click();
  await page.waitForFunction((start) => {
    const rect = document.querySelector(
      '[data-shape-id="s1"] rect.uvcp-face-front',
    );
    return rect !== null && Number(rect.getAttribute("x")) === start;
  }, startX);
  const again = await shape.boundingBox();
  assert.ok(again !== null);
  await page.mouse.click(again.x + 20, again.y + 20);
  assert.equal(await redo.isDisabled(), false);
  await redo.click();
  await page.waitForFunction((moved) => {
    const rect = document.querySelector(
      '[data-shape-id="s1"] rect.uvcp-face-front',
    );
    return (
      rect !== null && Math.abs(Number(rect.getAttribute("x")) - moved) < 0.05
    );
  }, movedX);

  const handle = page.locator('[data-handle="se"]');
  const handleBox = await handle.boundingBox();
  assert.ok(handleBox !== null);
  const widthBefore = Number(await shape.getAttribute("width"));
  await page.mouse.move(
    handleBox.x + handleBox.width / 2,
    handleBox.y + handleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    handleBox.x + handleBox.width / 2 + 40,
    handleBox.y + handleBox.height / 2 + 20,
  );
  await page.mouse.up();
  await page.waitForFunction((width) => {
    const rect = document.querySelector(
      '[data-shape-id="s1"] rect.uvcp-face-front',
    );
    return rect !== null && Number(rect.getAttribute("width")) > width + 1;
  }, widthBefore);

  await page.getByRole("textbox", { name: "Rotation" }).fill("90");
  await page.getByRole("textbox", { name: "Rotation" }).press("Enter");
  await page.waitForFunction(() => {
    const turned = document.querySelector('[data-shape-id="s1"]');
    const transform = turned?.getAttribute("transform") ?? "";
    const match = /rotate\(([-\d.]+)/.exec(transform);
    return match !== null && Math.abs(Number(match[1]) - 90) < 0.05;
  });
  const east = page.locator('[data-handle="e"]');
  const eastBox = await east.boundingBox();
  assert.ok(eastBox !== null);
  const releaseX = eastBox.x + eastBox.width / 2;
  const releaseY = eastBox.y + eastBox.height / 2 + 48;
  await page.mouse.move(releaseX, releaseY - 48);
  await page.mouse.down();
  await page.mouse.move(releaseX, releaseY);
  await page.mouse.up();
  const landed = await east.boundingBox();
  assert.ok(landed !== null);
  const handleX = landed.x + landed.width / 2;
  const handleY = landed.y + landed.height / 2;
  assert.ok(
    Math.abs(handleX - releaseX) < 3,
    `east handle x ${handleX} expected ${releaseX}`,
  );
  assert.ok(
    Math.abs(handleY - releaseY) < 3,
    `east handle y ${handleY} expected ${releaseY}`,
  );
  await undo.click();
  await undo.click();
  await page.waitForFunction(() => {
    const turned = document.querySelector('[data-shape-id="s1"]');
    return turned !== null && turned.getAttribute("transform") === null;
  });

  const sceneDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const sceneFile = await sceneDownload;
  assert.equal(sceneFile.suggestedFilename(), "scene.json");
  await page
    .getByText(
      "Downloaded scene.json. Keep that file. This page does not store the project.",
    )
    .waitFor();
  const scenePath = await sceneFile.path();
  assert.ok(scenePath !== null);
  const saved = fs.readFileSync(scenePath, "utf8");
  assert.equal(saved.includes("\n"), true);
  assert.equal(saved.includes('  "formatId"'), true);
  assert.equal(saved.includes("universal-visual-creation-scene"), true);
  const savedX = Number(await shape.getAttribute("x"));

  await remove.click();
  await page
    .locator(".uvcp-inspector")
    .getByText("Add a rectangle, an ellipse, text, or a box.")
    .waitFor();
  await page.getByLabel("Scene file").setInputFiles(scenePath);
  await page.getByText("Opened the scene.").waitFor();
  const restored = page.locator('[data-shape-id="s1"] rect.uvcp-face-front');
  await restored.waitFor();
  const restoredX = Number(await restored.getAttribute("x"));
  assert.ok(Math.abs(restoredX - savedX) < 0.05);

  await openThreeD(page);
  await page
    .getByRole("menuitem", { name: "Load sample", exact: true })
    .click();
  await page.getByText("Imported into the project.").waitFor();
  await page.getByRole("option", { name: "Box crate" }).waitFor();
  await page.getByRole("option", { name: "Rectangle card" }).waitFor();

  const beforeImport = await page.locator("[data-shape-id]").count();
  await page
    .getByLabel("glTF file")
    .setInputFiles(path.join(root, "examples", "interchange", "unit-cube.glb"));
  await page.getByText("Imported into the project.").waitFor();
  const afterImport = await page.locator("[data-shape-id]").count();
  assert.ok(afterImport > beforeImport);

  const glbDownload = page.waitForEvent("download");
  await openThreeD(page);
  await page
    .getByRole("menuitem", { name: "Export glTF", exact: true })
    .click();
  const glbFile = await glbDownload;
  assert.equal(glbFile.suggestedFilename(), "scene.glb");
  const glbPath = await glbFile.path();
  assert.ok(glbPath !== null);
  const glb = fs.readFileSync(glbPath);
  assert.equal(glb.subarray(0, 4).toString("utf8"), "glTF");
  assert.ok(glb.byteLength > 20);
  await page
    .getByText("Downloaded scene.glb. Save still downloads the project.")
    .waitFor();

  const badPath = path.join(os.tmpdir(), `uvcp-bad-scene-${process.pid}.json`);
  fs.writeFileSync(badPath, "{");
  try {
    await page.getByLabel("Scene file").setInputFiles(badPath);
    await page.getByText("Scene document is not valid JSON.").waitFor();
    assert.equal(await page.locator("[data-shape-id]").count(), afterImport);
  } finally {
    fs.rmSync(badPath, { force: true });
  }

  await page.getByRole("button", { name: "Ellipse", exact: true }).click();
  await page.locator("svg ellipse.uvcp-face-front").waitFor();
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await page
    .locator("svg text.uvcp-text")
    .filter({ hasText: "Text" })
    .waitFor();
  await page.getByLabel("Fill").fill("#ff0000");
  await page.waitForFunction(() => {
    const node = document.querySelector("svg text.uvcp-text");
    return node !== null && node.getAttribute("fill") === "#ff0000";
  });
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.waitForFunction(() => {
    const node = document.querySelector("svg text.uvcp-text");
    return node !== null && node.getAttribute("fill") === "#1e293b";
  });
  await page
    .getByRole("textbox", { name: "Text", exact: true })
    .fill("Hello <b>");
  await page.getByRole("button", { name: "Apply text", exact: true }).click();
  await page
    .locator("svg text.uvcp-text")
    .filter({ hasText: "Hello <b>" })
    .waitFor();
  assert.equal(await page.locator("svg script").count(), 0);
  await page.getByRole("option", { name: /^Ellipse / }).click();
  await page.getByLabel("Fill").fill("#00ff00");
  await page.waitForFunction(() => {
    const node = document.querySelector("svg ellipse.uvcp-face-front");
    return node !== null && getComputedStyle(node).fill === "rgb(0, 255, 0)";
  });

  let dialogType = "";
  page.once("dialog", async (dialog) => {
    dialogType = dialog.type();
    await dialog.accept();
  });
  await page.reload();
  assert.equal(dialogType, "beforeunload");
}

async function assertNoHorizontalOverflow(page, widths) {
  assert.equal(await page.locator(".uvcp-menu").isHidden(), true);
  for (const width of widths) {
    await page.setViewportSize({ width, height: 800 });
    const extra = await page.evaluate(() => {
      const editor = document.querySelector(".uvcp-editor");
      return editor.scrollWidth - editor.clientWidth;
    });
    assert.ok(extra <= 1, `horizontal overflow ${extra} at ${width}`);
    const title = await page.getByRole("heading", { level: 1 }).boundingBox();
    assert.ok(title !== null && title.x >= -1, `title at ${width}`);
  }
}

async function assertToolbarTips(page) {
  const tips = [
    ["Save", "Download the project as scene.json."],
    ["Open", "Open a scene.json file into this tab."],
  ];
  for (const width of [800, 1280, 1366, 1920]) {
    await page.setViewportSize({ width, height: 800 });
    for (const [name, text] of tips) {
      const button = page.getByRole("button", { name, exact: true });
      await button.hover();
      await tipInside(page, name, text, width);
      await button.focus();
      await tipInside(page, name, text, width);
      await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      });
      await page.mouse.move(0, 0);
    }
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  await openThreeD(page);
  const importButton = page.getByRole("menuitem", {
    name: "Import glTF",
    exact: true,
  });
  await importButton.hover();
  await tipInside(
    page,
    "Import glTF",
    "Add rectangles and boxes from a glTF file.",
    1280,
  );
  await page.keyboard.press("Escape");
  await page
    .getByRole("menu", { name: "3D file" })
    .waitFor({ state: "hidden" });
}

async function openThreeD(page) {
  const menu = page.getByRole("menu", { name: "3D file" });
  if (!(await menu.isVisible())) {
    await page.getByRole("button", { name: "3D file", exact: true }).click();
  }
  await menu.waitFor();
}

async function tipInside(page, name, text, width) {
  const tip = page.getByRole("tooltip", { name: text });
  await tip.waitFor();
  const box = await tip.boundingBox();
  assert.ok(box !== null, name);
  assert.ok(box.x >= -1, `${name} at ${width} starts at ${box.x}`);
  assert.ok(
    box.x + box.width <= width + 1,
    `${name} at ${width} ends at ${box.x + box.width}`,
  );
}

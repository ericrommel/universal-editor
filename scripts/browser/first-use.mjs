import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const PRODUCT = "Universal Visual Creation Platform";

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
  await page
    .getByText("Add a shape with the buttons. AI is optional.")
    .waitFor();
  await page.getByText("Add a rectangle or a box.").waitFor();
  assert.equal(await page.locator('input[type="password"]').count(), 0);
  assert.equal(await page.locator("canvas").count(), 0);
  const exportSelection = page.locator(".uvcp-tip").filter({
    has: page.getByRole("button", { name: "Export selection" }),
  });
  await exportSelection.hover();
  await page
    .getByRole("tooltip", { name: "Select a shape to export it." })
    .waitFor();

  await page.getByRole("button", { name: "Start creating" }).click();
  await page.getByRole("heading", { name: "Start with a shape" }).waitFor({
    state: "hidden",
  });
  await page.reload();
  await page
    .getByText("Add a shape with the buttons. AI is optional.")
    .waitFor();
  await page.getByRole("heading", { name: "Start with a shape" }).waitFor({
    state: "hidden",
  });

  await page.getByRole("button", { name: "Guide", exact: true }).click();
  await page.getByRole("heading", { name: "Start with a shape" }).waitFor();
  await page.getByRole("button", { name: "Start creating" }).click();

  const rectangle = page.getByRole("button", {
    name: "Rectangle",
    exact: true,
  });
  await rectangle.hover();
  await page
    .getByRole("tooltip", { name: "Add a rectangle to the page." })
    .waitFor();

  await rectangle.click();
  await page
    .getByText("Add a rectangle or a box.")
    .waitFor({ state: "hidden" });
  const shape = page.locator("svg rect.uvcp-shape").first();
  await shape.waitFor();
  const startX = Number(await shape.getAttribute("x"));
  const before = await shape.boundingBox();
  assert.ok(before !== null);
  await page.mouse.move(before.x + 30, before.y + 30);
  await page.mouse.down();
  await page.mouse.move(before.x + 120, before.y + 70);
  await page.mouse.up();
  await page.waitForFunction((start) => {
    const rect = document.querySelector("svg rect.uvcp-shape");
    return rect !== null && Number(rect.getAttribute("x")) !== start;
  }, startX);

  await page.getByRole("textbox", { name: "Rotation (degrees)" }).fill("90");
  await page.getByRole("button", { name: "Apply size" }).click();
  await page.waitForFunction(() => {
    const turned = document.querySelector("svg g");
    const transform = turned?.getAttribute("transform") ?? "";
    const match = /rotate\(([-\d.]+)/.exec(transform);
    return match !== null && Math.abs(Number(match[1]) - 90) < 0.05;
  });

  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.waitForFunction(() => {
    const turned = document.querySelector("svg g");
    const transform = turned?.getAttribute("transform") ?? "";
    const match = /rotate\(([-\d.]+)/.exec(transform);
    return match !== null && Math.abs(Number(match[1])) < 0.05;
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

  const shapesBeforeOpen = await page.locator("svg g").count();
  await page.getByLabel("Scene file").setInputFiles(scenePath);
  await page.getByText("Opened the scene.").waitFor();
  assert.equal(await page.locator("svg g").count(), shapesBeforeOpen);

  const beforeImport = await page.locator("svg g").count();
  await page
    .getByLabel("glTF file")
    .setInputFiles(path.join(root, "examples", "interchange", "unit-cube.glb"));
  await page.getByText("Imported into the project.").waitFor();
  const afterImport = await page.locator("svg g").count();
  assert.ok(afterImport > beforeImport);

  const glbDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export glTF", exact: true }).click();
  const glbFile = await glbDownload;
  assert.equal(glbFile.suggestedFilename(), "scene.glb");
  await page
    .getByText("Downloaded scene.glb. Save still downloads the project.")
    .waitFor();

  const badPath = path.join(os.tmpdir(), `uvcp-bad-scene-${process.pid}.json`);
  fs.writeFileSync(badPath, "{");
  try {
    await page.getByLabel("Scene file").setInputFiles(badPath);
    await page.getByText("Scene document is not valid JSON.").waitFor();
    assert.equal(await page.locator("svg g").count(), afterImport);
  } finally {
    fs.rmSync(badPath, { force: true });
  }

  await page.getByRole("button", { name: "AI setup", exact: true }).click();
  await page.getByRole("heading", { name: "Assistant" }).waitFor();
  await page.getByText("does not ask for a provider key").waitFor();
  assert.equal(await page.locator('input[type="password"]').count(), 0);
  await page.getByRole("button", { name: "Close", exact: true }).click();

  let dialogType = "";
  page.once("dialog", async (dialog) => {
    dialogType = dialog.type();
    await dialog.accept();
  });
  await page.reload();
  assert.equal(dialogType, "beforeunload");
}

import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { productionPolicy } from "../apps/shell/content-security-policy.mjs";
import {
  createStaticServer,
  resolveStaticFile,
  securityHeaders,
} from "./serve-static.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("the published header file repeats the production policy", () => {
  const headers = fs.readFileSync(
    path.join(root, "apps", "shell", "public", "_headers"),
    "utf8",
  );
  assert.equal(
    headers.includes(`Content-Security-Policy: ${productionPolicy}`),
    true,
  );
  assert.equal(headers.includes("unsafe-inline"), false);
  assert.equal(
    securityHeaders(".html")["Content-Security-Policy"],
    productionPolicy,
  );
});

test("the static server stays inside the build and sends the policy", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "uvcp-static-"));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "uvcp-outside-"));
  fs.writeFileSync(path.join(directory, "index.html"), "<p>editor</p>");
  fs.writeFileSync(path.join(directory, "app.js"), "export {};");
  fs.writeFileSync(path.join(outside, "secret.txt"), "secret");
  fs.writeFileSync(path.join(directory, "_headers"), "ignored");
  try {
    assert.equal(resolveStaticFile(directory, "/../secret.txt"), null);
    assert.equal(resolveStaticFile(directory, "/%2e%2e/secret.txt"), null);
    assert.equal(resolveStaticFile(directory, "/_headers"), null);
    assert.equal(resolveStaticFile(directory, "/missing.js"), null);
    assert.ok(resolveStaticFile(directory, "/")?.file.endsWith("index.html"));

    const server = createStaticServer(directory);
    await new Promise((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve());
    });
    const address = server.address();
    if (address === null || typeof address === "string") {
      throw new Error("The static server did not bind a port.");
    }
    try {
      const page = await get(`http://127.0.0.1:${address.port}/`);
      assert.equal(page.status, 200);
      assert.equal(page.csp, productionPolicy);
      assert.equal(page.nosniff, "nosniff");
      assert.equal(page.body.includes("editor"), true);
      const hidden = await get(
        `http://127.0.0.1:${address.port}/%2e%2e/${path.basename(outside)}/secret.txt`,
      );
      assert.equal(hidden.status, 404);
      assert.equal(hidden.body.includes("secret"), false);
      const posted = await get(`http://127.0.0.1:${address.port}/`, "POST");
      assert.equal(posted.status, 405);
    } finally {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

function get(url, method = "GET") {
  return new Promise((resolve, reject) => {
    const request = http.request(url, { method }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        resolve({
          status: response.statusCode,
          csp: response.headers["content-security-policy"],
          nosniff: response.headers["x-content-type-options"],
          body: Buffer.concat(chunks).toString("utf8"),
        });
      });
    });
    request.on("error", reject);
    request.end();
  });
}

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { strings } from "../packages/ui/src/strings.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("the shell document title is the foundation title and the page is not a canvas", () => {
  const html = fs.readFileSync(
    path.join(root, "apps", "shell", "index.html"),
    "utf8",
  );
  assert.equal(
    html.includes(`<title>${strings.webDocumentTitle}</title>`),
    true,
  );
  assert.match(html, /<html lang="en">/);
  assert.match(html, /id="root"/);
  assert.equal(/<canvas(?:\s|>|\/)/i.test(html), false);
  assert.equal(html.includes("UVCP_FORCE_INIT_FAILURE"), false);
  assert.equal(html.includes(strings.productName), true);
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  previewAccepted,
  previewReady,
  productionPolicy,
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

test("a colored ready line still counts and an in-use error does not", () => {
  const colored =
    "\u001b[32m➜\u001b[39m  \u001b[1mLocal\u001b[22m:   \u001b[36mhttp://127.0.0.1:\u001b[1m5173\u001b[22m/\u001b[39m";
  assert.equal(previewReady(colored), true);
  assert.equal(previewReady("  ➜  Local:   http://127.0.0.1:5173/"), true);
  assert.equal(previewReady("Port 5173 is already in use"), false);
  assert.equal(previewReady("http://127.0.0.1:5173/ is already in use"), false);
});

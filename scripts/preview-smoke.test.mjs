import assert from "node:assert/strict";
import test from "node:test";
import { previewAccepted, productionPolicy } from "./preview-smoke.mjs";

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

import assert from "node:assert/strict";
import test from "node:test";
import {
  boundaryViolation,
  exoticDependency,
  extractSpecifiers,
} from "./boundaries.mjs";

test("shell may import the UI package and must not import core", () => {
  assert.equal(boundaryViolation("@uvcp/shell", "@uvcp/ui"), null);
  assert.match(
    boundaryViolation("@uvcp/shell", "@uvcp/core"),
    /must not import @uvcp\/core/,
  );
  assert.match(
    boundaryViolation("@uvcp/shell", "@uvcp/core/internal"),
    /must not import/,
  );
});

test("editor may import core and persistence, not React or the renderer", () => {
  assert.equal(boundaryViolation("@uvcp/editor", "@uvcp/core"), null);
  assert.equal(boundaryViolation("@uvcp/editor", "@uvcp/persistence"), null);
  assert.match(
    boundaryViolation("@uvcp/editor", "react"),
    /must not import react/,
  );
  assert.match(
    boundaryViolation("@uvcp/editor", "@uvcp/rendering"),
    /must not import/,
  );
});

test("core and persistence stay free of filesystem and workspace imports", () => {
  assert.match(
    boundaryViolation("@uvcp/core", "node:fs"),
    /must not import node:fs/,
  );
  assert.match(
    boundaryViolation("@uvcp/core", "node:fs/promises"),
    /must not import/,
  );
  assert.match(boundaryViolation("@uvcp/core", "fs"), /must not import fs/);
  assert.match(
    boundaryViolation("@uvcp/persistence", "node:path"),
    /must not import/,
  );
  assert.match(
    boundaryViolation("@uvcp/persistence", "path"),
    /must not import path/,
  );
  assert.match(
    boundaryViolation("@uvcp/core", "@uvcp/editor"),
    /must not import @uvcp\/editor/,
  );
});

test("editor and platform stay free of host and network imports", () => {
  assert.match(
    boundaryViolation("@uvcp/editor", "node:fs"),
    /must not import node:fs/,
  );
  assert.match(
    boundaryViolation("@uvcp/editor", "electron"),
    /must not import electron/,
  );
  assert.match(
    boundaryViolation("@uvcp/rendering", "node:fs"),
    /must not import node:fs/,
  );
  assert.match(
    boundaryViolation("@uvcp/platform", "node:http"),
    /must not import node:http/,
  );
  assert.match(
    boundaryViolation("@uvcp/platform", "node:fs"),
    /must not import node:fs/,
  );
  assert.match(
    boundaryViolation("@uvcp/platform", "node:dgram"),
    /must not import node:dgram/,
  );
  assert.match(
    boundaryViolation("@uvcp/platform", "node:child_process"),
    /must not import node:child_process/,
  );
});

test("rendering must not take a GPU library", () => {
  assert.match(
    boundaryViolation("@uvcp/rendering", "three"),
    /must not import three/,
  );
  assert.match(
    boundaryViolation("@uvcp/rendering", "three/addons"),
    /must not import/,
  );
  assert.equal(boundaryViolation("@uvcp/rendering", "@uvcp/core"), null);
});

test("a type import and a require are both specifiers", () => {
  const source = `
    import type { Ready } from "@uvcp/core";
    import { readFile } from "node:fs";
    const dynamic = import("@uvcp/ui");
    const required = require("react");
    // import "electron" is a comment
  `;
  assert.deepEqual(extractSpecifiers(source), [
    "@uvcp/core",
    "node:fs",
    "@uvcp/ui",
    "react",
  ]);
});

test("git and URL dependencies are exotic", () => {
  assert.equal(exoticDependency("workspace:*"), false);
  assert.equal(exoticDependency("^7.0.2"), false);
  assert.equal(exoticDependency("git+https://example.invalid/repo.git"), true);
  assert.equal(exoticDependency("file:../outside"), true);
});

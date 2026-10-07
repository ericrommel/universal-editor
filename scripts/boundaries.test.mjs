import assert from "node:assert/strict";
import test from "node:test";
import {
  boundaryViolation,
  exoticDependency,
  scanSource,
} from "./boundaries.mjs";

test("shell may import the UI package and must not import core", () => {
  assert.equal(boundaryViolation("@uvcp/shell", "@uvcp/ui"), null);
  assert.equal(boundaryViolation("@uvcp/shell", "@uvcp/ai"), null);
  assert.equal(boundaryViolation("@uvcp/editor", "@uvcp/ai"), null);
  assert.equal(
    boundaryViolation("@uvcp/ai", "@uvcp/editor"),
    "@uvcp/ai must not import @uvcp/editor",
  );
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

test("interchange may import core and must not import files or the shell", () => {
  assert.equal(boundaryViolation("@uvcp/interchange", "@uvcp/core"), null);
  assert.equal(
    boundaryViolation("@uvcp/interchange", "@gltf-transform/core"),
    null,
  );
  assert.match(
    boundaryViolation("@uvcp/interchange", "node:fs"),
    /must not import node:fs/,
  );
  assert.match(
    boundaryViolation("@uvcp/interchange", "node:https"),
    /must not import/,
  );
  assert.match(
    boundaryViolation("@uvcp/shell", "@uvcp/interchange"),
    /must not import/,
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
  assert.deepEqual(specifiersOf(source), [
    "@uvcp/core",
    "node:fs",
    "@uvcp/ui",
    "react",
  ]);
});

test("static import forms yield their specifiers", () => {
  assert.deepEqual(specifiersOf('import type { Ready } from "@uvcp/core";'), [
    "@uvcp/core",
  ]);
  assert.deepEqual(specifiersOf('export { x } from "react";'), ["react"]);
  assert.deepEqual(specifiersOf('export type { A } from "react";'), ["react"]);
  assert.deepEqual(specifiersOf('export * from "react";'), ["react"]);
  assert.deepEqual(specifiersOf('export * as ns from "react";'), ["react"]);
  assert.deepEqual(specifiersOf('import type * as ns from "react";'), [
    "react",
  ]);
  assert.deepEqual(specifiersOf('import "node:fs";'), ["node:fs"]);
  assert.deepEqual(specifiersOf('import {\n  a\n} from "react";'), ["react"]);
  assert.deepEqual(specifiersOf('import(/* c */ "react");'), ["react"]);
  assert.deepEqual(specifiersOf('import/*c*/"react";'), ["react"]);
  assert.deepEqual(specifiersOf('import/*c*/("react");'), ["react"]);
  assert.deepEqual(specifiersOf('import x = require("react");'), ["react"]);
  assert.deepEqual(
    specifiersOf(
      'import fs from "node:fs"; import * as path from "node:path"; import fs2, { readFile } from "node:fs";',
    ),
    ["node:fs", "node:path", "node:fs"],
  );
  assert.deepEqual(
    specifiersOf('import"react"; import{x}from"react"; export{x}from"react";'),
    ["react", "react", "react"],
  );
  assert.deepEqual(
    specifiersOf('import data from "react" with { type: "json" };'),
    ["react"],
  );
});

test("template literals and escapes are cooked before the boundary compare", () => {
  assert.deepEqual(specifiersOf("import(`react`);"), ["react"]);
  assert.deepEqual(specifiersOf("require(`node:fs`);"), ["node:fs"]);
  assert.deepEqual(specifiersOf(String.raw`import("\u0072eact")`), ["react"]);
  assert.deepEqual(specifiersOf(String.raw`import x from "@uvcp\u002Fcore";`), [
    "@uvcp/core",
  ]);
  assert.deepEqual(specifiersOf(String.raw`import x from "\u{72}eact";`), [
    "react",
  ]);
  assert.deepEqual(specifiersOf('import x from "rea\\\nct";'), ["react"]);
  assert.deepEqual(specifiersOf('import x from "rea\\\r\nct";'), ["react"]);
  assert.deepEqual(
    specifiersOf(String.raw`import x from "node:fs\\promises";`),
    ["node:fs\\promises"],
  );
  assert.deepEqual(specifiersOf(String.raw`\u0072equire("node:fs")`), [
    "node:fs",
  ]);
});

test("comments, strings, templates, and regex text are not imports", () => {
  assert.deepEqual(specifiersOf('// import "electron"\nexport {};'), []);
  assert.deepEqual(specifiersOf('/* import "electron" */\nexport {};'), []);
  assert.deepEqual(specifiersOf('const a = 1; /* import "fs" */'), []);
  assert.deepEqual(specifiersOf(`const s = "import x from 'react'";`), []);
  assert.deepEqual(specifiersOf(`const s = 'import x from "react"';`), []);
  assert.deepEqual(specifiersOf('const s = `require("node:fs")`;'), []);
  assert.deepEqual(specifiersOf("import.meta.url;"), []);
  assert.deepEqual(specifiersOf('import.meta.resolve("react");'), []);
  assert.deepEqual(specifiersOf('const pattern = /import("electron")/;'), []);
  assert.deepEqual(
    specifiersOf(`const s = "import x from 'react'"; import "electron";`),
    ["electron"],
  );
  assert.deepEqual(
    specifiersOf('const re = /http:\\/\\//; import "electron";'),
    ["electron"],
  );
  assert.deepEqual(specifiersOf("const cmp = a < b;"), []);
  assert.deepEqual(specifiersOf("export {};"), []);
});

test("template interpolation is code and template text is not", () => {
  // Split so the test source keeps the characters `$` `{` for the scanner.
  // A template literal here would interpolate before scanSource sees them.
  assert.deepEqual(
    specifiersOf("const live = `pre $" + '{import("react")} post`;'),
    ["react"],
  );
  assert.deepEqual(
    specifiersOf("const dead = `pre $" + '{`import("react")`} post`;'),
    [],
  );
  assert.deepEqual(
    specifiersOf("const note = `pre $" + '{/* import("react") */ 1} post`;'),
    [],
  );
});

test("JSX text is not an import and a JSX expression is", () => {
  assert.deepEqual(
    specifiersOf("<p>import x from 'react'</p>", { jsx: true }),
    [],
  );
  assert.deepEqual(specifiersOf('<p>{import("react")}</p>', { jsx: true }), [
    "react",
  ]);
  const comparison = scanSource("const cmp = a < b;", { jsx: false });
  assert.equal(comparison.failure, null);
  assert.deepEqual(comparison.specifiers, []);
});

test("parenthesized require calls keep a literal specifier", () => {
  assert.deepEqual(specifiersOf('(require)("react");'), ["react"]);
  assert.deepEqual(specifiersOf('(0, require)("react");'), ["react"]);
  assert.deepEqual(specifiersOf('require?.("react");'), ["react"]);
  assert.deepEqual(specifiersOf('require("react",);'), ["react"]);
  assert.deepEqual(specifiersOf('import("react",);'), ["react"]);
  assert.deepEqual(specifiersOf('require("node:fs", "utf8");'), ["node:fs"]);
  assert.deepEqual(specifiersOf('obj.require("react");'), []);
});

test("nested loads, type-position imports, and constructed require count", () => {
  assert.deepEqual(
    specifiersOf(
      'function load() { require("react"); return import("electron"); }',
    ),
    ["react", "electron"],
  );
  assert.deepEqual(specifiersOf('type Ready = import("@uvcp/core").Ready;'), [
    "@uvcp/core",
  ]);
  assert.deepEqual(specifiersOf('new require("node:fs");'), ["node:fs"]);
  failsClosed("new require(name);");
});

test("a non-literal import or require fails closed", () => {
  failsClosed('const name = "node:fs"; import(name);');
  failsClosed("require(name);");
  failsClosed("import(`node:$" + "{name}`);");
  failsClosed('/* import "electron"');
});

function specifiersOf(source, options) {
  const result = scanSource(source, options);
  assert.equal(result.failure, null, result.failure ?? "");
  return result.specifiers;
}

function failsClosed(source, options) {
  const result = scanSource(source, options);
  assert.ok(result.failure, "expected the scan to fail");
}

test("git and URL dependencies are exotic", () => {
  assert.equal(exoticDependency("workspace:*"), false);
  assert.equal(exoticDependency("^7.0.2"), false);
  assert.equal(exoticDependency("git+https://example.invalid/repo.git"), true);
  assert.equal(exoticDependency("file:../outside"), true);
});

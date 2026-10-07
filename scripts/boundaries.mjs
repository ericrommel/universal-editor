// Architecture section 10. A type-only import and a test import both count.
// TypeScript 7 exposes no parser, and Biome's import rule misses cooked
// escapes, static templates, and parenthesized require without failing closed.
// @babel/parser owns that grammar. This script still owns the import table.

import { parse } from "@babel/parser";

export const ALLOWED = {
  "@uvcp/core": new Set(),
  "@uvcp/persistence": new Set(["@uvcp/core"]),
  "@uvcp/platform": new Set(),
  "@uvcp/rendering": new Set(["@uvcp/core"]),
  "@uvcp/ai": new Set(),
  "@uvcp/editor": new Set(["@uvcp/ai", "@uvcp/core", "@uvcp/persistence"]),
  "@uvcp/ui": new Set(),
  "@uvcp/shell": new Set([
    "@uvcp/ai",
    "@uvcp/ui",
    "@uvcp/editor",
    "@uvcp/platform",
  ]),
};

// Sections 18 and 20. Bare "fs" and "path" are the same modules as node:fs and node:path.
// Platform also has no network API in Module 0.
const FILESYSTEM = ["node:fs", "fs", "node:path", "path"];
const DESKTOP = ["electron", "@tauri-apps/"];
const REACT = ["react", "react-dom"];
const NETWORK = [
  "node:http",
  "node:https",
  "node:http2",
  "node:net",
  "node:dns",
  "node:tls",
  "node:dgram",
];

const BANNED = {
  "@uvcp/core": [...REACT, ...DESKTOP, ...FILESYSTEM],
  "@uvcp/persistence": [...REACT, ...DESKTOP, ...FILESYSTEM],
  "@uvcp/platform": [
    ...DESKTOP,
    ...FILESYSTEM,
    ...NETWORK,
    "node:child_process",
  ],
  "@uvcp/ai": [
    ...REACT,
    ...DESKTOP,
    ...FILESYSTEM,
    ...NETWORK,
    "@uvcp/core",
    "@uvcp/persistence",
    "@uvcp/editor",
    "@uvcp/ui",
    "@uvcp/rendering",
    "@uvcp/platform",
    "@uvcp/shell",
  ],
  "@uvcp/editor": [
    ...REACT,
    ...DESKTOP,
    ...FILESYSTEM,
    "@uvcp/ui",
    "@uvcp/rendering",
    "@uvcp/platform",
  ],
  "@uvcp/rendering": [
    ...REACT,
    ...DESKTOP,
    ...FILESYSTEM,
    "@uvcp/ui",
    "@uvcp/editor",
    "@uvcp/platform",
    "three",
    "@babylonjs/",
    "wgpu",
  ],
  "@uvcp/shell": ["@uvcp/core", "@uvcp/persistence", "@uvcp/rendering"],
};

export const NO_DOM_LIB = new Set([
  "@uvcp/ai",
  "@uvcp/core",
  "@uvcp/persistence",
  "@uvcp/platform",
  "@uvcp/rendering",
  "@uvcp/editor",
]);

const EXOTIC = /^(?:git\+|git:|github:|http:|https:|file:|link:|portal:)/;

const SKIP = new Set([
  "loc",
  "start",
  "end",
  "range",
  "extra",
  "comments",
  "leadingComments",
  "trailingComments",
  "innerComments",
]);

export function workspaceTarget(specifier) {
  if (!specifier.startsWith("@uvcp/")) {
    return null;
  }
  const slash = specifier.indexOf("/", "@uvcp/".length);
  return slash === -1 ? specifier : specifier.slice(0, slash);
}

function matchesBan(specifier, rule) {
  if (rule.endsWith("/")) {
    return specifier.startsWith(rule);
  }
  return specifier === rule || specifier.startsWith(`${rule}/`);
}

export function boundaryViolation(fromPackage, specifier) {
  if (!Object.hasOwn(ALLOWED, fromPackage)) {
    return `unknown package ${fromPackage}`;
  }
  const banned = (BANNED[fromPackage] ?? []).find((rule) =>
    matchesBan(specifier, rule),
  );
  if (banned) {
    return `${fromPackage} must not import ${specifier}`;
  }
  const target = workspaceTarget(specifier);
  if (target === null) {
    return null;
  }
  if (!Object.hasOwn(ALLOWED, target)) {
    return `${fromPackage} imports unknown workspace package ${target}`;
  }
  if (!ALLOWED[fromPackage].has(target)) {
    return `${fromPackage} must not import ${target}`;
  }
  return null;
}

export function exoticDependency(value) {
  return typeof value === "string" && EXOTIC.test(value);
}

// Specifiers are cooked. failure is set when a file cannot be parsed or a
// dynamic specifier is not a static string. This does not execute code.
export function scanSource(source, options = {}) {
  let ast;
  try {
    ast = parse(String(source), {
      sourceType: "module",
      plugins: options.jsx === true ? ["typescript", "jsx"] : ["typescript"],
      errorRecovery: false,
      createParenthesizedExpressions: false,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { specifiers: [], failure: firstLine(error.message) };
    }
    throw error;
  }
  if (Array.isArray(ast.errors) && ast.errors.length > 0) {
    return { specifiers: [], failure: firstLine(ast.errors[0].message) };
  }
  try {
    const specifiers = [];
    walk(ast.program, specifiers);
    return { specifiers, failure: null };
  } catch (error) {
    if (error instanceof ScanFailure) {
      return { specifiers: [], failure: error.message };
    }
    throw error;
  }
}

class ScanFailure extends Error {
  constructor(message) {
    super(message);
    this.name = "ScanFailure";
  }
}

function walk(node, specifiers) {
  if (!node || typeof node.type !== "string") {
    return;
  }
  if (
    node.type === "ImportDeclaration" ||
    node.type === "ExportAllDeclaration"
  ) {
    recordModuleSource(node.source, specifiers);
  } else if (node.type === "ExportNamedDeclaration") {
    if (node.source) {
      recordModuleSource(node.source, specifiers);
    }
  } else if (node.type === "TSImportEqualsDeclaration") {
    if (node.moduleReference?.type === "TSExternalModuleReference") {
      recordModuleSource(node.moduleReference.expression, specifiers);
    }
  } else if (node.type === "TSImportType" || node.type === "ImportExpression") {
    specifiers.push(staticSpecifier(node.argument ?? node.source));
  } else if (
    node.type === "CallExpression" ||
    node.type === "OptionalCallExpression" ||
    node.type === "NewExpression"
  ) {
    if (node.callee?.type === "Import" || isRequireCallee(node.callee)) {
      specifiers.push(staticSpecifier(node.arguments[0]));
    }
  }
  for (const [key, value] of Object.entries(node)) {
    if (SKIP.has(key)) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        walk(item, specifiers);
      }
      continue;
    }
    if (value && typeof value.type === "string") {
      walk(value, specifiers);
    }
  }
}

function recordModuleSource(node, specifiers) {
  if (node?.type !== "StringLiteral" || typeof node.value !== "string") {
    throw new ScanFailure("module specifier is not a string literal");
  }
  specifiers.push(node.value);
}

function staticSpecifier(node) {
  let current = node;
  while (
    current &&
    (current.type === "TSAsExpression" ||
      current.type === "TSSatisfiesExpression" ||
      current.type === "TSNonNullExpression" ||
      current.type === "ParenthesizedExpression")
  ) {
    current = current.expression;
  }
  if (current?.type === "StringLiteral" && typeof current.value === "string") {
    return current.value;
  }
  if (current?.type === "TemplateLiteral") {
    if (
      current.expressions.length > 0 ||
      current.quasis.some((quasi) => quasi.value.cooked == null)
    ) {
      throw new ScanFailure("dynamic import specifier is not a string literal");
    }
    return current.quasis.map((quasi) => quasi.value.cooked).join("");
  }
  throw new ScanFailure("dynamic import specifier is not a string literal");
}

function isRequireCallee(node) {
  let current = node;
  while (
    current &&
    (current.type === "TSAsExpression" ||
      current.type === "TSSatisfiesExpression" ||
      current.type === "TSNonNullExpression" ||
      current.type === "ParenthesizedExpression")
  ) {
    current = current.expression;
  }
  if (current?.type === "SequenceExpression") {
    return isRequireCallee(current.expressions.at(-1));
  }
  return current?.type === "Identifier" && current.name === "require";
}

function firstLine(message) {
  const line = String(message).split("\n", 1)[0];
  return line || "source could not be parsed";
}

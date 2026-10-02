// Architecture section 10. A type-only import and a test import both count.

export const ALLOWED = {
  "@uvcp/core": new Set(),
  "@uvcp/persistence": new Set(["@uvcp/core"]),
  "@uvcp/platform": new Set(),
  "@uvcp/rendering": new Set(["@uvcp/core"]),
  "@uvcp/editor": new Set(["@uvcp/core", "@uvcp/persistence"]),
  "@uvcp/ui": new Set(),
  "@uvcp/shell": new Set(["@uvcp/ui", "@uvcp/editor", "@uvcp/platform"]),
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
  "@uvcp/core",
  "@uvcp/persistence",
  "@uvcp/platform",
  "@uvcp/rendering",
  "@uvcp/editor",
]);

const EXOTIC = /^(?:git\+|git:|github:|http:|https:|file:|link:|portal:)/;

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

export function extractSpecifiers(source) {
  const code = stripComments(source);
  const found = [];
  const patterns = [
    /\bimport\s+(?:type\s+)?(?:[^"'`]*?\sfrom\s+)?["']([^"']+)["']/g,
    /\bexport\s+(?:type\s+)?[^"'`]*?\sfrom\s+["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of code.matchAll(pattern)) {
      found.push(match[1]);
    }
  }
  return found;
}

function stripComments(source) {
  let result = "";
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (char === "/" && next === "/") {
      index += 2;
      while (index < source.length && source[index] !== "\n") {
        index += 1;
      }
      continue;
    }
    if (char === "/" && next === "*") {
      index += 2;
      while (
        index < source.length &&
        !(source[index] === "*" && source[index + 1] === "/")
      ) {
        index += 1;
      }
      index += 2;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      result += char;
      index += 1;
      while (index < source.length && source[index] !== char) {
        if (source[index] === "\\") {
          result += source[index];
          index += 1;
        }
        if (index < source.length) {
          result += source[index];
          index += 1;
        }
      }
      if (index < source.length) {
        result += source[index];
        index += 1;
      }
      continue;
    }
    result += char;
    index += 1;
  }
  return result;
}

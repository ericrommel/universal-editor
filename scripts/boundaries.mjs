// Architecture section 10. A type-only import and a test import both count.
// scanSource tokenizes source. A text search treated comments, strings, and
// regex literals as code, so valid syntax could hide an import or invent one.

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

// Specifiers are cooked. failure is set when a file cannot be scanned or a
// dynamic specifier is not a static string. This does not execute code.
export function scanSource(source, options = {}) {
  const lexer = lexSource(String(source), options.jsx === true);
  if (lexer.failure) {
    return { specifiers: [], failure: lexer.failure };
  }
  return parseSpecifiers(lexer.tokens);
}

const EXPRESSION_KEYWORDS = new Set([
  "return",
  "throw",
  "case",
  "typeof",
  "void",
  "delete",
  "new",
  "in",
  "of",
  "instanceof",
  "yield",
  "await",
]);

function lexSource(source, jsx) {
  let index = 0;
  let failure = null;
  let exprAllowed = true;
  let afterArrow = false;
  const tokens = [];
  const braceStack = [];
  const length = source.length;

  if (source.charCodeAt(0) === 0xfeff) {
    index = 1;
  }
  if (source.startsWith("#!", index)) {
    while (index < length && source[index] !== "\n") {
      index += 1;
    }
  }

  while (index < length && !failure) {
    const before = index;
    skipTrivia();
    if (failure || index >= length) {
      break;
    }
    lexOne();
    if (!failure && index === before) {
      fail("scanner did not advance");
    }
  }

  return { tokens, failure };

  function fail(message) {
    if (!failure) {
      failure = `${message} at ${index}`;
    }
  }

  function isLineTerm(char) {
    return (
      char === "\n" || char === "\r" || char === "\u2028" || char === "\u2029"
    );
  }

  function isWhitespace(char) {
    if (!char) {
      return false;
    }
    const code = char.charCodeAt(0);
    return (
      code === 9 ||
      code === 10 ||
      code === 11 ||
      code === 12 ||
      code === 13 ||
      code === 32 ||
      code === 0xa0 ||
      code === 0xfeff ||
      code === 0x1680 ||
      code === 0x2028 ||
      code === 0x2029 ||
      code === 0x202f ||
      code === 0x205f ||
      code === 0x3000 ||
      (code >= 0x2000 && code <= 0x200a)
    );
  }

  function isIdentStart(char) {
    return Boolean(char) && /[A-Za-z_$]/.test(char);
  }

  function isIdentPart(char) {
    return Boolean(char) && /[A-Za-z0-9_$]/.test(char);
  }

  function skipTrivia() {
    while (index < length && !failure) {
      const char = source[index];
      if (isWhitespace(char)) {
        index += 1;
        continue;
      }
      if (char === "/" && source[index + 1] === "/") {
        index += 2;
        while (index < length && !isLineTerm(source[index])) {
          index += 1;
        }
        continue;
      }
      if (char === "/" && source[index + 1] === "*") {
        index += 2;
        while (
          index < length &&
          !(source[index] === "*" && source[index + 1] === "/")
        ) {
          index += 1;
        }
        if (index >= length) {
          fail("unterminated block comment");
          return;
        }
        index += 2;
        continue;
      }
      return;
    }
  }

  function emit(token, allowsExpression) {
    tokens.push(token);
    exprAllowed = allowsExpression;
    afterArrow = token.t === "punct" && token.v === "=>";
  }

  function lexOne() {
    const char = source[index];
    if (char === "'" || char === '"') {
      const value = readQuoted(char);
      if (!failure) {
        emit({ t: "str", v: value }, false);
      }
      return;
    }
    if (char === "`") {
      readTemplate();
      return;
    }
    if (char === "/" && exprAllowed) {
      readRegex();
      return;
    }
    if (isIdentStart(char) || (char === "\\" && source[index + 1] === "u")) {
      const name = readIdent();
      if (failure) {
        return;
      }
      const previous = tokens.at(-1);
      const member =
        previous?.t === "punct" && (previous.v === "." || previous.v === "?.");
      emit({ t: "id", v: name }, EXPRESSION_KEYWORDS.has(name) && !member);
      return;
    }
    if (isDigit(char) || (char === "." && isDigit(source[index + 1]))) {
      readNumber();
      exprAllowed = false;
      afterArrow = false;
      return;
    }
    if (char === "<" && jsx && exprAllowed && looksLikeJsx()) {
      scanJsxElement();
      exprAllowed = false;
      afterArrow = false;
      return;
    }
    readPunct();
  }

  function looksLikeJsx() {
    const next = source[index + 1];
    return next === ">" || isIdentStart(next);
  }

  function readPunct() {
    const char = source[index];
    const three = source.slice(index, index + 3);
    const two = source.slice(index, index + 2);
    const triple = [
      "===",
      "!==",
      ">>>",
      ">>=",
      "<<=",
      "**=",
      "&&=",
      "||=",
      "??=",
    ];
    const pair = [
      "=>",
      "==",
      "!=",
      "<=",
      ">=",
      "&&",
      "||",
      "??",
      "?.",
      "++",
      "--",
      "**",
      "<<",
      ">>",
      "+=",
      "-=",
      "*=",
      "/=",
      "%=",
      "&=",
      "|=",
      "^=",
    ];
    if (triple.includes(three)) {
      index += 3;
      emit({ t: "punct", v: three }, true);
      return;
    }
    if (pair.includes(two)) {
      index += 2;
      if (two === "?.") {
        emit({ t: "punct", v: two }, false);
        return;
      }
      if (two === "++" || two === "--") {
        emit({ t: "punct", v: two }, exprAllowed);
        return;
      }
      emit({ t: "punct", v: two }, true);
      return;
    }
    if (char === "{") {
      const kind = afterArrow ? "block" : exprAllowed ? "object" : "block";
      braceStack.push(kind);
      index += 1;
      emit({ t: "punct", v: "{" }, true);
      return;
    }
    if (char === "}") {
      const kind = braceStack.pop() ?? "expr";
      index += 1;
      emit({ t: "punct", v: "}" }, kind === "block");
      return;
    }
    if (char === "(" || char === "[") {
      index += 1;
      emit({ t: "punct", v: char }, true);
      return;
    }
    if (char === ")" || char === "]") {
      index += 1;
      emit({ t: "punct", v: char }, false);
      return;
    }
    if (
      char === "." &&
      source[index + 1] === "." &&
      source[index + 2] === "."
    ) {
      index += 3;
      emit({ t: "punct", v: "..." }, true);
      return;
    }
    if (".,;:?+-*%&|^!~<>/=@#".includes(char)) {
      index += 1;
      const startsExpression = char !== "." && char !== "#";
      emit({ t: "punct", v: char }, startsExpression);
      return;
    }
    fail("unexpected character");
    index += 1;
  }

  function readQuoted(quote) {
    index += 1;
    let value = "";
    while (index < length) {
      const char = source[index];
      if (char === quote) {
        index += 1;
        return value;
      }
      if (isLineTerm(char)) {
        fail("unterminated string");
        return "";
      }
      if (char === "\\") {
        const part = readEscape();
        if (part == null) {
          fail("invalid string escape");
          return "";
        }
        value += part;
        continue;
      }
      value += char;
      index += 1;
    }
    fail("unterminated string");
    return "";
  }

  function readTemplate() {
    index += 1;
    let value = "";
    let interpolated = false;
    while (index < length && !failure) {
      const char = source[index];
      if (char === "`") {
        index += 1;
        if (!interpolated) {
          emit({ t: "str", v: value }, false);
        } else {
          exprAllowed = false;
          afterArrow = false;
        }
        return;
      }
      if (char === "\\") {
        const part = readEscape();
        if (part == null) {
          fail("invalid string escape");
          return;
        }
        value += part;
        continue;
      }
      if (char === "$" && source[index + 1] === "{") {
        interpolated = true;
        value = "";
        index += 2;
        consumeBraced("unterminated template");
        continue;
      }
      value += char;
      index += 1;
    }
    fail("unterminated template");
  }

  function consumeBraced(message) {
    braceStack.push("expr");
    exprAllowed = true;
    afterArrow = false;
    let depth = 1;
    while (depth > 0 && !failure) {
      const before = index;
      skipTrivia();
      if (failure) {
        return;
      }
      if (index >= length) {
        fail(message);
        return;
      }
      lexOne();
      if (index === before) {
        fail("scanner did not advance");
        return;
      }
      const last = tokens.at(-1);
      if (last?.t === "punct" && last.v === "{") {
        depth += 1;
      } else if (last?.t === "punct" && last.v === "}") {
        depth -= 1;
        if (depth === 0) {
          tokens.pop();
        }
      }
    }
    exprAllowed = false;
  }

  function readEscape() {
    index += 1;
    if (index >= length) {
      return null;
    }
    const char = source[index];
    index += 1;
    switch (char) {
      case "n":
        return "\n";
      case "r":
        return "\r";
      case "t":
        return "\t";
      case "b":
        return "\b";
      case "f":
        return "\f";
      case "v":
        return "\v";
      case "\\":
      case "'":
      case '"':
      case "`":
      case "$":
        return char;
      case "0":
        if (isDigit(source[index])) {
          return null;
        }
        return "\0";
      case "x":
        return readHex(2);
      case "u":
        return readUnicode();
      case "\n":
        return "";
      case "\r":
        if (source[index] === "\n") {
          index += 1;
        }
        return "";
      case "\u2028":
      case "\u2029":
        return "";
      default:
        if (isDigit(char) || isLineTerm(char)) {
          return null;
        }
        return char;
    }
  }

  function readHex(count) {
    const hex = source.slice(index, index + count);
    if (hex.length !== count || !/^[0-9a-fA-F]+$/.test(hex)) {
      return null;
    }
    index += count;
    return String.fromCharCode(Number.parseInt(hex, 16));
  }

  function readUnicode() {
    if (source[index] === "{") {
      index += 1;
      const start = index;
      while (index < length && source[index] !== "}") {
        index += 1;
      }
      if (source[index] !== "}") {
        return null;
      }
      const hex = source.slice(start, index);
      index += 1;
      if (!/^[0-9a-fA-F]{1,6}$/.test(hex)) {
        return null;
      }
      const code = Number.parseInt(hex, 16);
      if (code > 0x10ffff) {
        return null;
      }
      return String.fromCodePoint(code);
    }
    return readHex(4);
  }

  function readIdent() {
    let name = "";
    while (index < length && !failure) {
      const char = source[index];
      if (char === "\\") {
        if (source[index + 1] !== "u") {
          fail("invalid identifier escape");
          return name;
        }
        index += 2;
        const decoded = readUnicode();
        if (decoded == null || !/^[\s\S]$/u.test(decoded)) {
          fail("invalid identifier escape");
          return name;
        }
        name += decoded;
        continue;
      }
      if ((name.length === 0 ? isIdentStart : isIdentPart)(char)) {
        name += char;
        index += 1;
        continue;
      }
      break;
    }
    if (name.length === 0) {
      fail("invalid identifier");
    }
    return name;
  }

  function readNumber() {
    if (
      source[index] === "0" &&
      (source[index + 1] === "x" ||
        source[index + 1] === "X" ||
        source[index + 1] === "b" ||
        source[index + 1] === "B" ||
        source[index + 1] === "o" ||
        source[index + 1] === "O")
    ) {
      index += 2;
      while (index < length && /[0-9a-fA-F_]/.test(source[index])) {
        index += 1;
      }
    } else {
      while (index < length && /[0-9_]/.test(source[index])) {
        index += 1;
      }
      if (source[index] === "." && isDigit(source[index + 1])) {
        index += 1;
        while (index < length && /[0-9_]/.test(source[index])) {
          index += 1;
        }
      }
      if (source[index] === "e" || source[index] === "E") {
        index += 1;
        if (source[index] === "+" || source[index] === "-") {
          index += 1;
        }
        while (index < length && /[0-9_]/.test(source[index])) {
          index += 1;
        }
      }
    }
    if (source[index] === "n") {
      index += 1;
    }
    tokens.push({ t: "num" });
    afterArrow = false;
  }

  function readRegex() {
    index += 1;
    let inClass = false;
    while (index < length) {
      const char = source[index];
      if (isLineTerm(char)) {
        fail("unterminated regular expression");
        return;
      }
      if (char === "\\") {
        index += 1;
        if (index >= length || isLineTerm(source[index])) {
          fail("unterminated regular expression");
          return;
        }
        index += 1;
        continue;
      }
      if (char === "[" && !inClass) {
        inClass = true;
        index += 1;
        continue;
      }
      if (char === "]" && inClass) {
        inClass = false;
        index += 1;
        continue;
      }
      if (char === "/" && !inClass) {
        index += 1;
        while (index < length && /[a-zA-Z]/.test(source[index])) {
          index += 1;
        }
        emit({ t: "regex" }, false);
        return;
      }
      index += 1;
    }
    fail("unterminated regular expression");
  }

  function scanJsxElement() {
    index += 1;
    skipTrivia();
    if (source[index] === ">") {
      index += 1;
      scanJsxChildren();
      return;
    }
    if (!isIdentStart(source[index]) && source[index] !== "\\") {
      fail("unterminated JSX");
      return;
    }
    readIdent();
    while (!failure && source[index] === ".") {
      index += 1;
      readIdent();
    }
    while (!failure) {
      skipTrivia();
      if (index >= length) {
        fail("unterminated JSX");
        return;
      }
      if (source[index] === "/" && source[index + 1] === ">") {
        index += 2;
        return;
      }
      if (source[index] === ">") {
        index += 1;
        scanJsxChildren();
        return;
      }
      if (source[index] === "{") {
        index += 1;
        consumeBraced("unterminated JSX");
        continue;
      }
      if (isIdentStart(source[index]) || source[index] === "\\") {
        readIdent();
        skipTrivia();
        if (source[index] === "=") {
          index += 1;
          skipTrivia();
          if (source[index] === '"' || source[index] === "'") {
            readQuoted(source[index]);
          } else if (source[index] === "{") {
            index += 1;
            consumeBraced("unterminated JSX");
          } else {
            fail("unterminated JSX");
          }
        }
        continue;
      }
      fail("unterminated JSX");
      return;
    }
  }

  function scanJsxChildren() {
    while (!failure) {
      if (index >= length) {
        fail("unterminated JSX");
        return;
      }
      if (source[index] === "<") {
        if (source[index + 1] === "/") {
          index += 2;
          while (index < length && source[index] !== ">") {
            index += 1;
          }
          if (source[index] !== ">") {
            fail("unterminated JSX");
            return;
          }
          index += 1;
          return;
        }
        scanJsxElement();
        continue;
      }
      if (source[index] === "{") {
        index += 1;
        consumeBraced("unterminated JSX");
        continue;
      }
      index += 1;
    }
  }

  function isDigit(char) {
    return Boolean(char) && char >= "0" && char <= "9";
  }
}

function parseSpecifiers(tokens) {
  const specifiers = [];
  let failure = null;
  let index = 0;

  while (index < tokens.length) {
    const next = step(index);
    if (next <= index) {
      failure = failure ?? "scanner did not advance";
      index += 1;
    } else {
      index = next;
    }
  }

  return {
    specifiers: failure ? [] : specifiers,
    failure,
  };

  function step(at) {
    const token = tokens[at];
    if (token?.t === "id" && token.v === "import" && !memberName(at)) {
      return parseImport(at);
    }
    if (token?.t === "id" && token.v === "export" && !memberName(at)) {
      return parseExport(at);
    }
    const paren = requireCallParen(at);
    if (paren >= 0) {
      return parseCallSpecifier(
        paren,
        "require specifier is not a string literal",
      );
    }
    return at + 1;
  }

  function memberName(at) {
    const previous = tokens[at - 1];
    return (
      previous?.t === "punct" && (previous.v === "." || previous.v === "?.")
    );
  }

  function punct(at, value) {
    const token = tokens[at];
    return token?.t === "punct" && token.v === value;
  }

  function findMatch(openAt) {
    const open = tokens[openAt]?.v;
    const close =
      open === "(" ? ")" : open === "{" ? "}" : open === "[" ? "]" : "";
    if (!close) {
      return -1;
    }
    let depth = 0;
    for (let cursor = openAt; cursor < tokens.length; cursor += 1) {
      const token = tokens[cursor];
      if (token.t !== "punct") {
        continue;
      }
      if (token.v === open) {
        depth += 1;
      } else if (token.v === close) {
        depth -= 1;
        if (depth === 0) {
          return cursor;
        }
      }
    }
    return -1;
  }

  function parseCallSpecifier(parenAt, message) {
    const argument = parenAt + 1;
    if (tokens[argument]?.t === "str") {
      specifiers.push(tokens[argument].v);
      return argument + 1;
    }
    failure = message;
    return argument;
  }

  function parseImport(at) {
    if (punct(at + 1, ".")) {
      return at + 1;
    }
    if (punct(at + 1, "(")) {
      return parseCallSpecifier(
        at + 1,
        "dynamic import specifier is not a string literal",
      );
    }
    let cursor = at + 1;
    if (tokens[cursor]?.t === "str") {
      specifiers.push(tokens[cursor].v);
      return cursor + 1;
    }
    if (tokens[cursor]?.t === "id" && tokens[cursor].v === "type") {
      const next = tokens[cursor + 1];
      const bindingNamedType =
        (next?.t === "id" && next.v === "from") ||
        (next?.t === "punct" && (next.v === "=" || next.v === "."));
      if (!bindingNamedType) {
        cursor += 1;
      }
    }
    if (tokens[cursor]?.t === "id" && punct(cursor + 1, "=")) {
      cursor += 2;
      if (!(tokens[cursor]?.t === "id" && tokens[cursor].v === "require")) {
        failure = "import equals does not call require";
        return Math.max(cursor, at + 1);
      }
      let call = cursor + 1;
      if (punct(call, "?.")) {
        call += 1;
      }
      if (!punct(call, "(")) {
        failure = "import equals does not call require";
        return call;
      }
      return parseCallSpecifier(
        call,
        "require specifier is not a string literal",
      );
    }
    if (
      tokens[cursor]?.t === "id" &&
      (punct(cursor + 1, "*") || punct(cursor + 1, "{"))
    ) {
      cursor += 1;
    }
    if (tokens[cursor]?.t === "id") {
      cursor += 1;
      if (punct(cursor, ",")) {
        cursor += 1;
      }
    }
    if (punct(cursor, "*")) {
      cursor += 1;
      if (tokens[cursor]?.t === "id" && tokens[cursor].v === "as") {
        cursor += 1;
      }
      if (tokens[cursor]?.t === "id") {
        cursor += 1;
      }
    }
    if (punct(cursor, "{")) {
      const close = findMatch(cursor);
      if (close < 0) {
        failure = "unbalanced delimiter";
        return tokens.length;
      }
      cursor = close + 1;
    }
    if (tokens[cursor]?.t === "id" && tokens[cursor].v === "from") {
      if (tokens[cursor + 1]?.t === "str") {
        specifiers.push(tokens[cursor + 1].v);
        return cursor + 2;
      }
      failure = "import source is not a string literal";
      return cursor + 1;
    }
    failure = "import clause has no source";
    return Math.max(cursor, at + 1);
  }

  function parseExport(at) {
    let cursor = at + 1;
    let clause = false;
    if (tokens[cursor]?.t === "id" && tokens[cursor].v === "type") {
      const next = tokens[cursor + 1];
      if (next?.t === "punct" && (next.v === "{" || next.v === "*")) {
        cursor += 1;
        clause = true;
      }
    }
    if (punct(cursor, "*") || punct(cursor, "{")) {
      clause = true;
    }
    if (!clause) {
      return at + 1;
    }
    if (punct(cursor, "*")) {
      cursor += 1;
      if (tokens[cursor]?.t === "id" && tokens[cursor].v === "as") {
        cursor += 1;
        if (tokens[cursor]?.t === "id") {
          cursor += 1;
        }
      }
    }
    if (punct(cursor, "{")) {
      const close = findMatch(cursor);
      if (close < 0) {
        failure = "unbalanced delimiter";
        return tokens.length;
      }
      cursor = close + 1;
    }
    if (tokens[cursor]?.t === "id" && tokens[cursor].v === "from") {
      if (tokens[cursor + 1]?.t === "str") {
        specifiers.push(tokens[cursor + 1].v);
        return cursor + 2;
      }
      failure = "export source is not a string literal";
      return cursor + 1;
    }
    return cursor;
  }

  function requireCallParen(at) {
    const token = tokens[at];
    if (token?.t === "id" && token.v === "require" && !memberName(at)) {
      let call = at + 1;
      if (punct(call, "?.")) {
        call += 1;
      }
      return punct(call, "(") ? call : -1;
    }
    if (!punct(at, "(")) {
      return -1;
    }
    const close = findMatch(at);
    if (close < 0 || !punct(close + 1, "(")) {
      return -1;
    }
    return endsWithRequire(at + 1, close) ? close + 1 : -1;
  }

  function endsWithRequire(from, toExclusive) {
    let start = from;
    let depth = 0;
    for (let cursor = from; cursor < toExclusive; cursor += 1) {
      const token = tokens[cursor];
      if (token.t !== "punct") {
        continue;
      }
      if (token.v === "(" || token.v === "{" || token.v === "[") {
        depth += 1;
      } else if (token.v === ")" || token.v === "}" || token.v === "]") {
        depth -= 1;
      } else if (token.v === "," && depth === 0) {
        start = cursor + 1;
      }
    }
    let left = start;
    let right = toExclusive;
    while (
      right - left >= 3 &&
      punct(left, "(") &&
      punct(right - 1, ")") &&
      findMatch(left) === right - 1
    ) {
      left += 1;
      right -= 1;
    }
    return (
      right - left === 1 &&
      tokens[left]?.t === "id" &&
      tokens[left].v === "require"
    );
  }
}

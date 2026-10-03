// ADR-0007. An OR passes only when every disjunct is on this list.
// Electing the permissive side is not a substitute.

export const ALLOWED_LICENSES = new Set([
  "MIT",
  "MIT-0",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "0BSD",
  "Zlib",
  "Unlicense",
  "CC0-1.0",
  "BlueOak-1.0.0",
]);

export function expressionAllowed(input) {
  if (typeof input !== "string") {
    return false;
  }
  const source = input.trim();
  if (source === "") {
    return false;
  }
  let index = 0;

  function skip() {
    while (source[index] === " " || source[index] === "\t") {
      index += 1;
    }
  }

  function peekWord() {
    skip();
    const match = /^[A-Za-z0-9.+-]+/.exec(source.slice(index));
    return match ? match[0] : "";
  }

  function consumeWord() {
    const word = peekWord();
    index += word.length;
    return word;
  }

  function parseOr() {
    let allowed = parseAnd();
    for (;;) {
      if (peekWord() !== "OR") {
        break;
      }
      consumeWord();
      allowed = parseAnd() && allowed;
    }
    return allowed;
  }

  function parseAnd() {
    let allowed = parsePrimary();
    for (;;) {
      if (peekWord() !== "AND") {
        break;
      }
      consumeWord();
      allowed = parsePrimary() && allowed;
    }
    return allowed;
  }

  function parsePrimary() {
    skip();
    if (source[index] === "(") {
      index += 1;
      const allowed = parseOr();
      skip();
      if (source[index] !== ")") {
        throw new Error("unclosed");
      }
      index += 1;
      return allowed;
    }
    const word = consumeWord();
    if (word === "" || word === "AND" || word === "OR" || word === "WITH") {
      throw new Error("identifier");
    }
    if (peekWord() === "WITH") {
      throw new Error("exception");
    }
    return ALLOWED_LICENSES.has(word);
  }

  try {
    const allowed = parseOr();
    skip();
    if (index !== source.length) {
      return false;
    }
    return allowed;
  } catch {
    // A malformed expression is not on the allow-list.
    return false;
  }
}

export function licenseText(manifest) {
  if (typeof manifest.license === "string") {
    return manifest.license;
  }
  if (manifest.license && typeof manifest.license.type === "string") {
    return manifest.license.type;
  }
  return "";
}

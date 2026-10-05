import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { foundationStatus } from "./foundation-status.ts";
import { strings } from "./strings.ts";
import { tokens } from "./tokens.ts";

// node --test cannot strip JSX, so this file does not import the screen.

const sessionIds = ["starting", "ready", "failed"] as const;

test("foundation strings are the exact screen copy", () => {
  assert.deepEqual(strings, {
    windowTitle: "Foundation",
    productName: "Universal Visual Creation Platform",
    webDocumentTitle: "Foundation — Universal Visual Creation Platform",
    purpose:
      "A cross-platform environment for visual creation. This build only proves the application foundation. Creation tools are not part of it.",
    statusLabel: "Status",
    statusStarting: "Starting",
    statusReady: "Ready",
    statusNotReady: "Not ready",
    detailStarting: "The foundation is still starting.",
    detailReady: "The foundation started successfully.",
    detailNotReady: "The foundation did not finish starting.",
    showDetails: "Details",
    hideDetails: "Hide details",
    diagnosticEmpty: "No diagnostic message was provided.",
  });
  assert.equal(strings.webDocumentTitle.includes("\u2014"), true);
  assert.equal("version" in strings, false);
});

test("light and dark colors use the specified hex values", () => {
  assert.deepEqual(tokens.color.light, {
    canvas: "#F4F5F7",
    surface: "#FFFFFF",
    text: {
      primary: "#1C1F26",
      secondary: "#3A4150",
    },
    border: "#7A8496",
    focus: "#1D4ED8",
    status: {
      ready: "#146C43",
      failed: "#B42318",
    },
  });
  assert.deepEqual(tokens.color.dark, {
    canvas: "#14161C",
    surface: "#1E2128",
    text: {
      primary: "#F4F5F7",
      secondary: "#C5CAD3",
    },
    border: "#9AA3B5",
    focus: "#93C5FD",
    status: {
      ready: "#9BD4B0",
      failed: "#F0B4AE",
    },
  });
  assert.deepEqual(Object.keys(tokens.color.light.status).sort(), [
    "failed",
    "ready",
  ]);
  assert.deepEqual(Object.keys(tokens.color.dark.status).sort(), [
    "failed",
    "ready",
  ]);
  assertNoStartingKey(tokens);
});

test("type, space, radius, focus, motion, and the web font are the foundation tokens", () => {
  assert.equal(
    tokens.font.family.ui,
    'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif',
  );
  assert.deepEqual(tokens.space, {
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "24px",
    6: "32px",
    7: "48px",
    8: "64px",
  });
  assert.deepEqual(tokens.type, {
    display: { size: "1.75rem", weight: 600, lineHeight: 1.25 },
    status: { size: "1.375rem", weight: 600, lineHeight: 1.3 },
    body: { size: "1.0625rem", weight: 400, lineHeight: 1.5 },
    label: { size: "0.875rem", weight: 600, lineHeight: 1.4 },
  });
  assert.deepEqual(tokens.radius, { surface: "12px", control: "8px" });
  assert.deepEqual(tokens.focus.ring, { width: "2px", offset: "2px" });
  assert.equal(tokens.motion.duration.instant, 0);
  for (const role of Object.values(tokens.type)) {
    assert.equal(role.weight === 400 || role.weight === 600, true);
  }
});

test("starting without a diagnostic shows the detail and no Details control", () => {
  for (const diagnostic of [undefined, "", "   ", "\n\t"]) {
    assert.deepEqual(foundationStatus("starting", diagnostic), {
      statusWord: "Starting",
      detail: "The foundation is still starting.",
      diagnosticText: null,
      detailsOpen: false,
      detailsControl: null,
    });
  }
});

test("starting with a diagnostic shows it expanded", () => {
  const message = "  waiting for the host  ";
  assert.deepEqual(foundationStatus("starting", message), {
    statusWord: "Starting",
    detail: "The foundation is still starting.",
    diagnosticText: message,
    detailsOpen: true,
    detailsControl: "Hide details",
  });
});

test("ready without a diagnostic shows the detail and no Details control", () => {
  for (const diagnostic of [undefined, "", "   ", "\n\t"]) {
    assert.deepEqual(foundationStatus("ready", diagnostic), {
      statusWord: "Ready",
      detail: "The foundation started successfully.",
      diagnosticText: null,
      detailsOpen: false,
      detailsControl: null,
    });
  }
});

test("ready with a diagnostic starts collapsed", () => {
  const message = "note  kept";
  assert.deepEqual(foundationStatus("ready", message), {
    statusWord: "Ready",
    detail: "The foundation started successfully.",
    diagnosticText: message,
    detailsOpen: false,
    detailsControl: "Details",
  });
});

test("failed without a usable diagnostic shows the empty sentence expanded", () => {
  for (const diagnostic of [undefined, "", "   ", "\n\t"]) {
    assert.deepEqual(foundationStatus("failed", diagnostic), {
      statusWord: "Not ready",
      detail: "The foundation did not finish starting.",
      diagnosticText: "No diagnostic message was provided.",
      detailsOpen: true,
      detailsControl: "Hide details",
    });
  }
});

test("failed with a diagnostic shows that exact string expanded", () => {
  const message = "disk full\n  path kept";
  assert.deepEqual(foundationStatus("failed", message), {
    statusWord: "Not ready",
    detail: "The foundation did not finish starting.",
    diagnosticText: message,
    detailsOpen: true,
    detailsControl: "Hide details",
  });
  assert.notEqual(
    foundationStatus("failed", message).diagnosticText,
    strings.diagnosticEmpty,
  );
});

test("visible status words are Starting, Ready, and Not ready", () => {
  assert.equal(foundationStatus("starting", undefined).statusWord, "Starting");
  assert.equal(foundationStatus("ready", undefined).statusWord, "Ready");
  assert.equal(foundationStatus("failed", undefined).statusWord, "Not ready");
  const echoed = foundationStatus("failed", "failed");
  assert.equal(echoed.statusWord, "Not ready");
  assert.equal(echoed.diagnosticText, "failed");
  for (const status of sessionIds) {
    for (const diagnostic of [
      undefined,
      "",
      " ",
      "failed",
      "starting",
      "ready",
    ]) {
      const view = foundationStatus(status, diagnostic);
      assert.equal(view.statusWord.includes("failed"), false);
      assert.equal(view.detail.includes("failed"), false);
      assert.equal(
        sessionIds.some((id) => id === view.statusWord),
        false,
      );
      if (view.detailsControl !== null) {
        assert.equal(view.detailsControl.includes("failed"), false);
      }
    }
  }
});

test("the foundation stylesheet uses the token palette, type, and space scale", () => {
  const css = fs.readFileSync(
    new URL("./foundation-screen.css", import.meta.url),
    "utf8",
  );
  const flat = css.replace(/\s+/g, " ");
  assert.equal(flat.includes(tokens.font.family.ui), true);
  for (const palette of [tokens.color.light, tokens.color.dark]) {
    for (const hex of [
      palette.canvas,
      palette.surface,
      palette.text.primary,
      palette.text.secondary,
      palette.border,
      palette.focus,
      palette.status.ready,
      palette.status.failed,
    ]) {
      assert.equal(css.toLowerCase().includes(hex.toLowerCase()), true, hex);
    }
  }
  assert.match(
    css,
    new RegExp(`font-size:\\s*${escapeRegExp(tokens.type.display.size)}`),
  );
  assert.match(
    css,
    new RegExp(`font-size:\\s*${escapeRegExp(tokens.type.status.size)}`),
  );
  assert.match(
    css,
    new RegExp(`font-size:\\s*${escapeRegExp(tokens.type.body.size)}`),
  );
  assert.match(
    css,
    new RegExp(`font-size:\\s*${escapeRegExp(tokens.type.label.size)}`),
  );
  assert.match(
    css,
    new RegExp(`padding-top:\\s*${escapeRegExp(tokens.space[6])}`),
  );
  assert.match(
    css,
    new RegExp(`padding-top:\\s*${escapeRegExp(tokens.space[8])}`),
  );
  assert.match(
    css,
    new RegExp(`padding-bottom:\\s*${escapeRegExp(tokens.space[7])}`),
  );
  assert.match(
    css,
    new RegExp(`padding-inline:\\s*${escapeRegExp(tokens.space[5])}`),
  );
  assert.match(
    css,
    new RegExp(`padding-inline:\\s*${escapeRegExp(tokens.space[7])}`),
  );
  assert.match(
    css,
    new RegExp(`margin:\\s*${escapeRegExp(tokens.space[3])} 0 0`),
  );
  assert.match(
    css,
    new RegExp(`margin-top:\\s*${escapeRegExp(tokens.space[6])}`),
  );
  assert.match(css, new RegExp(`padding:\\s*${escapeRegExp(tokens.space[4])}`));
  assert.match(
    css,
    new RegExp(`margin-top:\\s*${escapeRegExp(tokens.space[2])}`),
  );
  assert.match(css, new RegExp(`gap:\\s*${escapeRegExp(tokens.space[2])}`));
  assert.match(
    css,
    new RegExp(`border-radius:\\s*${escapeRegExp(tokens.radius.surface)}`),
  );
  assert.match(
    css,
    new RegExp(`outline:\\s*${escapeRegExp(tokens.focus.ring.width)} solid`),
  );
  assert.match(
    css,
    new RegExp(`outline-offset:\\s*${escapeRegExp(tokens.focus.ring.offset)}`),
  );
  assert.match(css, /max-width:\s*36rem/);
  assert.match(css, /width:\s*8px/);
  assert.match(css, /height:\s*8px/);
  assert.equal(css.includes("gradient"), false);
  assert.equal(css.includes("@keyframes"), false);
  assert.equal(css.includes("animation:"), false);
  assert.equal(css.includes("text-overflow"), false);
  assert.equal(css.includes("ellipsis"), false);
  assert.equal(css.includes("<canvas"), false);
  assert.match(css, /user-select:\s*text/);
  assert.match(css, /white-space:\s*pre-wrap/);
});

test("the foundation screen source is one text column and not a markup sink", () => {
  const source = fs.readFileSync(
    new URL("./foundation-screen.tsx", import.meta.url),
    "utf8",
  );
  assert.equal(source.match(/<h1\b/g)?.length, 1);
  assert.match(
    source,
    /<h1 className="uvcp-foundation-name">\{strings\.productName\}<\/h1>/,
  );
  assert.match(
    source,
    /<p className="uvcp-foundation-purpose">\{strings\.purpose\}<\/p>/,
  );
  assert.match(source, /\{presentation\.statusWord\}/);
  assert.match(
    source,
    /<p className="uvcp-foundation-diagnostic">\{diagnosticText\}<\/p>/,
  );
  assert.match(source, /aria-hidden="true"/);
  assert.match(source, /type="button"/);
  assert.equal(source.includes("dangerouslySetInnerHTML"), false);
  assert.equal(source.includes("<canvas"), false);
  assert.equal(source.includes("<img"), false);
  assert.equal(source.includes("autoFocus"), false);
  assert.equal(source.includes("autofocus"), false);
  assert.equal(source.includes("UVCP_FORCE_INIT_FAILURE"), false);
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertNoStartingKey(value: unknown): void {
  if (typeof value !== "object" || value === null) {
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    assert.notEqual(key, "starting");
    assertNoStartingKey(nested);
  }
}

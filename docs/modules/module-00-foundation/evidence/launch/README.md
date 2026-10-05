# Module 0 launch evidence

This record is the headed browser launch for M0-AC-002 and the on-screen half of TP-M0-F-004. It is not module acceptance, not GREEN, and not a browser-support matrix.

## Environment

- Date: 2026-10-05
- Commit of the shell: `3cfa957e46baef128059243430a62fe02576ef66`
- Host: 64-bit Windows on x64. `AppliedDPI` is 120, which is 125% display scaling.
- Toolchain: Node.js 24.21.0 and pnpm 12.8.2, as pinned.
- Command: `corepack pnpm dev` from the repository root. The server reported `http://127.0.0.1:5173/`.
- Browser: headed Microsoft Edge 154.0.4258.53 (`Edg/154.0.4258.53`). A temporary profile was used and extensions were disabled, so the page was not altered by a personal extension. The process was not started with a headless flag.
- Window argument: `--window-size=880,640`. The layout viewport was 858 by 550. The browser frame owns that difference. The page does not set the native window size.

## Ready

`UVCP_FORCE_INIT_FAILURE` was unset. The document title was `Foundation — Universal Visual Creation Platform`. The visible text was the product name, the purpose sentence, `Status`, `Ready`, and `The foundation started successfully.` There was no Details control, no canvas, no image, and no button.

The console recorded `startup.beginning` and `startup.ready` as single-line JSON on `console.error`. The JSON files contain those lines more than once because the capture reloaded the page to apply dark and forced-colors emulation. Those repeats are not extra product startups.

The dev response content security policy was the production policy plus `connect-src 'self'`.

## Not ready

The server was restarted with `UVCP_FORCE_INIT_FAILURE=1`. The screen showed `Not ready`, `The foundation did not finish starting.`, the plain text `Initialization failed.`, and a native `Hide details` button. Escape, with that button focused, changed the label to `Details` and removed the diagnostic. The detail sentence stayed. The diagnostic's `user-select` was `text`.

The console recorded `startup.failed` with step `forced-initialization-failure`, code `FORCED_INITIALIZATION_FAILURE`, and message `Initialization failed.`

## Appearance and text size

Dark mode and forced colors were emulated in the same Edge process. The screen's `data-appearance` value followed them, and the computed colors followed the light, dark, or system-color roles.

At a 640 by 480 layout viewport with the root font size set to 32px (200% of 16px), both the ready screen and the failure screen had `scrollHeight` greater than `clientHeight`, and `scrollWidth` equal to `clientWidth`. The name, purpose, status, and diagnostic stayed in the text, with `text-overflow: clip`.

The stylesheet sets a 2px focus outline and a 2px offset in `color.focus`. `getComputedStyle` reported `1.6px` for both. `AppliedDPI` 120 is 125% scaling, and 2 / 1.25 = 1.6, so the reported number is the specified width divided by that scale. The stylesheet value is still 2px. The outline color was `rgb(29, 78, 216)`, which is `color.focus` (`#1D4ED8`).

## Files

- `ready-light.png`, `ready-dark.png`, `ready-forced.png`, `ready-text-200.png`, `ready-record.json`
- `failed-light.png`, `failed-dark.png`, `failed-forced.png`, `failed-text-200.png`, `failed-focus.png`, `failed-record.json`

## Limits

This is the primary development environment and one of the two browsers named for that evidence. It is not macOS, Linux desktop, or a browser matrix. The Node preview smoke remains build evidence. It is not this launch.

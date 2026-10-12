# ADR-0012 — Studio chrome

**Status:** Accepted on the working line (`master`).

**Date:** 2026-10-12

## Context

The scene editor on `master` can create a rectangle, an ellipse, text, and a box, and it can select, move, resize, rotate, fill, order, undo, save, and open. That behavior stays. The screen around it still reads as an internal prototype.

The production build of `fd778f8`, opened in Chromium at 1440×900 and at 820×720, shows why:

- Create, edit, file, guide, and AI setup are the same bordered buttons. Uppercase group labels are the only hierarchy.
- The guide and the AI sentence are full-width bands, so the page gets shorter instead of the chrome getting quieter.
- The 3D file disclosure is another button. Open, it covers the inspector at 1440px and covers the status line and the object list at 820px.
- Every shape is stroked in the focus blue, so the artwork looks selected before anyone selects it.
- `prefers-color-scheme: dark` changes nothing. The foundation screen already has light, dark, and forced-color tokens. The editor does not use them.

The product is one visual creation environment for the web and for Windows, macOS, and Linux desktops ([product overview](../../product-overview.md)). Professional power without professional complexity. The chrome has to feel like a desktop tool in a browser, on all three desktops, without wearing one vendor's skin.

### What the established systems are for

Fluent 2, Material 3, and Apple's Human Interface Guidelines agree on a few things this product should keep, and they disagree on the skin.

Fluent 2 (layout, typography, elevation, design principles; fluent2.microsoft.design):

- Space in steps of 4px, and group by proximity rather than by boxes.
- Sentence case. All caps is harder to read and worse to translate.
- Elevation is a shadow ramp. Windows often uses a stroke instead of a key shadow, which is the right weight for a dense tool.
- Type, focus, and high contrast follow the platform. The Windows type ramp (Segoe UI, 12–14px body) is a desktop density, not a marketing page.
- "Natural on every platform" means reuse the platform's behavior and spend the signature on the product. It does not mean every app should look like Windows.

Material 3 (density and adaptive layout; m3.material.io):

- Density 0 is the default. Compact density (about −2, roughly 8px shorter) is for data-rich desktop surfaces.
- Material's own density note still asks for large touch targets on components that are actually touched. A mouse tool does not need 48px buttons. WCAG 2.2 success criterion 2.5.8, at AA, asks for a 24 CSS pixel target.
- Material layouts now start from mobile and adapt upward, including large containers and an expressive shape. That is the wrong default for a desktop creative tool, and the visual language is recognizable as Google's.

Apple's Human Interface Guidelines (design principles and layout, including the macOS platform note):

- Hierarchy: controls elevate the content. They are not the content.
- Familiarity and consistency: people bring other software with them. Keep a behavior in one place once it exists.
- Simplicity: include what the task needs.
- Input: keyboard as well as pointer. Do not design a desktop tool as if the only pointer were a finger.
- macOS specifically: do not put critical controls only at the bottom of a window. People park the bottom edge off the screen.
- Harmony with Apple hardware, vibrancy, and Liquid Glass is guidance for Apple platforms. Painting that in a browser looks like a fake Mac on macOS and like the wrong operating system on Windows and Linux.

None of these systems is the product's visual identity. Fluent would make it a Windows app. Material would make it a Google app. The HIG's materials would make it a Mac app. The useful part is the shared advice: neutral chrome, desktop density, sentence case, one focus treatment, platform light and dark and forced colors, and no critical status parked only on the bottom edge.

### How creative tools use those ideas

The applications below were read for interaction structure, not for a skin to copy.

- Figma and Penpot are browser-native design tools. A narrow tool rail, a layers list, the canvas, and an inspector are persistent. File commands live in a menu. The canvas is the colored surface. Chrome is neutral. One accent marks selection and focus. Penpot's interface is its own system; it is not Material and not Fluent. Penpot is not added as a dependency.
- Affinity, Photoshop, and Illustrator use the same regions: tools, a contextual options strip, the document, and docked studio panels. Infrequent commands are in menus. Affinity's personas are several editors in one shell. This product is one space (P-01), so it does not grow personas or modes it does not have.
- Blender's regions show how far density can go. Its editor-switching chrome is the professional complexity this product is not trying to front-load.
- Photomator and Pixelmator Pro keep an inspector beside the image and edit the image directly. They are Mac and iPad applications. Their vibrancy, window traffic lights, and touch-sized iPad controls are platform chrome, not something a cross-platform browser tool should imitate.
- Feather (feather.art) is an iPad drawing tool: a small tool set and the artwork in front. It is touch-first. The lesson is the small tool set. The iPad joystick and Apple Pencil chrome are not this screen.
- VS Code's workbench is a useful desktop-browser layout: a quiet title row, regions that stay put, and overflow that moves panels instead of covering the work. It is an IDE. This product does not gain an activity bar of modes.
- PixiEditor is a dense pixel editor with a tool rail, a canvas, and layers. ADR-0011 already refuses it as a dependency because of its license and its own document. Only the region pattern is relevant.

The pattern people already know, and the one this editor should use:

- The artwork carries the color. Chrome is quiet.
- Creation tools are a rail of actions, not a second copy of the file commands.
- The object list and the inspector stay docked. The inspector is grouped (appearance, text, arrange, geometry) instead of one flat form.
- Save and open stay visible. They are how a beginner keeps the work. glTF stays under 3D file, in a menu, because drawing does not need it.
- The guide and AI setup do not stack as banners. They share the side column, and only one is open.
- AI availability and unsaved work stay in the top bar, where a window can still be read if its bottom edge is off the screen.
- Selection and keyboard focus are the accent. An unselected shape is not drawn in that accent.
- The sheet stays a light page in light and dark chrome, so the object's fill is seen on paper. Forced colors are the exception, below.

Creation is a click, not a mode. The rail does not show a "current tool" the product does not have.

### Component foundations that were considered

Checked on 2026-10-12 from the npm registry, without installing them. Licenses below are the packages' own licenses. A later adoption still has to pass `scripts/check-licenses.mjs` and `pnpm audit --audit-level=high` on the lockfile that would actually ship. This decision does not claim that audit was run.

| Package | Version | License | What it is |
| --- | --- | --- | --- |
| `@base-ui/react` | 1.9.0 | MIT | Unstyled React primitives. React 17–19. Runtime dependencies `@babel/runtime`, `@base-ui/utils` 0.5.0, `@floating-ui/react-dom` 2.1.9, `@floating-ui/utils` 0.2.12, and `use-sync-external-store` 1.7.0 are MIT. `date-fns` is an optional peer and is not needed here. Released through 1.9.0 on 2026-10-09. |
| `@radix-ui/react-dropdown-menu` | 2.2.0 | MIT | Unstyled menu. Pulls a wide graph of `@radix-ui/*` packages plus `aria-hidden` 1.2.6 (MIT) and `react-remove-scroll` 2.7.2 (MIT). Maintained by WorkOS. Not deprecated. New work in the surrounding ecosystem has moved toward Base UI; Radix itself is still maintained. |
| `@ariakit/react` | 0.4.41 | MIT | Unstyled, accessibility-focused. Smaller maintenance surface than the two above. |
| `react-aria-components` | 1.22.1 | Apache-2.0 | Unstyled components with keyboard behavior and internationalization. Dependencies checked: `react-aria` 3.53.1, `react-stately` 3.51.0, `@react-types/shared` 3.37.0, `@internationalized/date` 3.12.4, `@internationalized/string` 3.2.10, and `@swc/helpers` 0.5.23 are Apache-2.0. `client-only` 0.0.1 and `use-sync-external-store` are MIT. The matching visual kit is React Spectrum. That kit is not a candidate. |
| `@fluentui/react-components` | 9.74.9 | MIT | Fluent's look and behavior. |
| `@mui/material` | 9.5.0 | MIT | Material's look, and a styling engine with it. |

`@fluentui/react-components` and `@mui/material` are rejected. They would make the product look like Windows or like Material, which is the outcome this decision exists to avoid. React Spectrum is rejected for the same reason. Per-platform widget toolkits stay rejected, as in ADR-0002.

The headless libraries are a real option. Their licenses sit inside the allow-list as far as the packages above were checked. They are maintained. They implement menus, dialogs, tooltips, focus, and keyboard behavior carefully, and React Aria also ships translations and right-to-left behavior. A lower-level foundation would let us keep our own CSS.

They are not adopted for this chrome. The behaviors this screen needs are smaller than those libraries, and two of them must not be modal:

- Buttons, fields, and the color input are native.
- The guide stays open while the first shape is created, and it must not cover that shape. AI setup says drawing still works. A modal dialog, whether from a library or from `showModal()`, would make the page inert and contradict that. Both panels are sections in the side column. One is open at a time.
- 3D file is one non-nested menu: top layer, light dismiss, and Escape from the Popover API, plus arrow keys, Home, and End between the items. The Popover API has been Baseline Newly available since January 2025. The dialog element has been Baseline Widely available since March 2022. A blocking dialog, when this product eventually needs one, uses `<dialog>` and `showModal()` before any library.
- Tooltips already have a role, a position inside the window, and show on hover and focus. This change lets Escape dismiss one and lets the pointer move onto it. That is the gap, not a reason to take on Floating UI.
- There is no tab set, no menubar, no nested menu, and no combobox.
- The interface is English. Layout uses logical CSS (`text-align: start`, `margin-inline`, `padding-inline`) and the foundation font stack, which already includes Segoe UI, the Apple system font, Roboto, and Noto Sans. A catalog of translations we do not display is a dependency without a user.

Adding Base UI or Radix for this menu would pull a positioning and focus graph into a shell whose runtime dependencies are React and the workspace packages. React Aria would add that graph and an internationalization runtime. The control we would give up is small, because the CSS would still be ours. The cost that is not small is the supply chain, the bundle, and a keyboard model we would then have to keep aligned with a library for a handful of buttons.

Revisit a foundation when the screen gains any of these: a nested menu, a combobox, a translated interface, or a control whose focus model does not fit the Popover API and a short roving tabindex. The first candidate is `react-aria-components` (Apache-2.0, unstyled, internationalization included), and only the components that are used. `@base-ui/react` (MIT) is the alternative when we will own translation ourselves. Either adoption has to pass the license check and the audit on the lockfile it produces. Ariakit stays on that list as a smaller MIT option. Fluent UI and Material UI stay rejected as skins.

## Decision

The editor uses studio chrome.

- Tokens come from the foundation screen. `.uvcp-editor[data-appearance]` uses the same custom properties as `.uvcp-foundation[data-appearance]`. The editor reads the appearance with `useAppearance` from `@uvcp/ui`: light, dark, or forced when forced colors or increased contrast is on. No second palette.
- The sheet is light paper in light and dark chrome (`#ffffff`, ink `#1c1f26`). In forced colors the sheet uses `Canvas` and `CanvasText`. The sheet opts out of forced-color adjustment so a chosen fill stays that color. Selection and the shape stroke on the sheet use system colors in forced colors so they remain visible. Chrome outside the sheet does not opt out.
- The desk is `--uvcp-canvas`. Panels are `--uvcp-surface`. Dividers are a hairline mixed from the text color, not a new gray. Inputs use `--uvcp-border`. Focus and the selection accent use `--uvcp-focus` on chrome. On the light sheet the selection stays `#1d4ed8` in both light and dark chrome, because that sheet did not become dark. Forced colors use `Highlight`.
- One shadow, on the sheet and on the 3D file menu. Panels are flat and separated by the hairline.
- Type is the foundation UI stack at 13px. Labels are sentence case. The product mark is a sheet, drawn in the text color. It is not a Windows, Material, or Apple glyph, and it is not an icon font.
- Controls are 28px, and the tool-rail buttons are 32px. Both clear the 24px AA target. They are quiet: no border, a hover wash, and the focus ring. The guide's "Start creating" is the one filled button, in the focus color, because it is the way out of the only first-run prompt.
- Regions, from the outside in: a top bar (name, AI status, unsaved or notice text, undo, redo, delete, save, open, 3D file, guide, AI setup), a create rail, the object list, the page, and a side column. Below 960px the rail and the page stay side by side and the list and the side column stack on the right.
- The create rail holds rectangle, ellipse, text, and box, as marks with those accessible names. Undo, redo, and delete are marks with the same accessible names and shortcuts in the tooltip.
- The 3D file menu holds import, export, export selection, and the sample. Save and open stay buttons.
- The inspector groups fill, text, order, and geometry under Appearance, Text, Arrange, and Geometry. The object list shows the same kind of mark as the rail. Accessible names stay "Rectangle s1" and the rest.
- Unselected shapes use a quiet ink stroke. The accent stroke is the selection and the handles. Box faces keep the object's fill. The depth handle is a diamond so it is not another resize square.
- Motion stays instant, matching the foundation token. Hover does not animate. `prefers-reduced-motion` has nothing to disable until a transition exists.
- Strings stay in the shell, in English. No i18n library is added.

No component library is added. ADR-0002's "no component library" was about the Module 0 foundation screen. This decision is the later chrome, and it reaches the same practical result for a stated reason: the behaviors on this screen are covered by HTML, the Popover API, and the controls already in the shell.

## Consequences

- The editor follows the operating system's light, dark, and forced-color settings. The page stays paper-colored unless forced colors are on.
- Guide and AI setup no longer shorten the page. They share the side column and still cannot be open together.
- The 3D file menu closes on Escape and on a click outside. It does not stay open over the inspector.
- The browser check's button names stay: Rectangle, Ellipse, Text, Box, Undo, Redo, Delete, Save, Open, Guide, AI setup, Start creating, Close, Apply text, Send backward, Bring forward. "3D file" becomes a menu button. Import glTF, Export glTF, Export selection, and Load sample become menu items. The closed menu is hidden.
- A future blocking prompt uses `<dialog>` before a dependency is proposed. A nested menu, a combobox, or a translation is the point at which React Aria or Base UI is reconsidered, under the license and audit gates.
- Schema, history, fill, glTF, package boundaries, `renderNull`, and the verify workflow are unchanged.

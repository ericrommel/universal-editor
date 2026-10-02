# Module 0 — Foundation screen

**Status:** Module 0 design intent. Normative specification of the foundation screen. Not an implemented screen, not a visual mock, and not the M0-AC-012 review.
**Role:** Senior Product Designer / UX Architect
**Date:** 2026-10-02

Engineers implement the Module 0 shell from this document. It specifies that screen and the tokens the screen uses. It does not design the production editor, a component library, or a later module. The operational Module 0 specification wins over any archived product specification.

The shell proves the architecture and toolchain (M0-FR-001) and carries the design foundation that shell needs (M0-FR-009). It preserves Progressive Complexity, contextual interaction, and cross-platform adaptation without pixel-identical platforms (M0-NFR-008).

This document does not approve a final product name, icon, or brand system. Module 0 does not ship to the App Store. The Human Product Owner owns the product name, the icon, and any change to the appearance fallback or the purpose sentence. Implementation uses the rules below and does not invent a substitute.

There is no icon and no editor chrome. There is no editor frame.

---

## Screen

The window opens on one foundation screen. The screen has three jobs, in this order: identity, purpose, status. A person must be able to tell what opened, why this build exists, and whether startup succeeded, without reading a log and without mistaking the window for an editor.

There is one content root. It is not a docking frame. Do not leave empty regions for a future toolbar, hierarchy, viewport, inspector, or timeline.

```text
+--------------------------------------------------------------+
| Foundation                                      platform chrome |
+--------------------------------------------------------------+
|                                                              |
|   Universal Visual Creation Platform                         |
|                                                              |
|   A cross-platform environment for visual creation. This     |
|   build only proves the application foundation. Creation     |
|   tools are not part of it.                                  |
|                                                              |
|   +------------------------------------------------------+   |
|   | Status                                               |   |
|   | * Ready                                              |   |
|   | The foundation started successfully.                 |   |
|   +------------------------------------------------------+   |
|                                                              |
+--------------------------------------------------------------+
```

The asterisk in the sketch is a status dot, not a bullet in the product copy. The outer title is platform or browser chrome. This screen does not draw that bar. On the Web shell the browser shows `string.webDocumentTitle`. The page starts at the product name.

Text inside the column is start-aligned (left in English). The column is centered horizontally in the window. It is top-weighted, not vertically centered. Do not center it vertically. A vertically centered block is a splash. This is the application screen.

`color.canvas` fills the window content area. That is a background color, not a `<canvas>` element and not a viewport. The status region is the only inset surface. Its fill is `color.surface`. Do not stick the status region to the bottom edge of the window.

The window must be resizable. Resizing changes the margins and wraps text. It does not scale the screen like a poster and does not reveal hidden panels. Below the minimum size, keep the same column, reduce inset as specified, and scroll vertically. Never clip or ellipsize the name, purpose, or status sentences.

Layout at the default text scale:

| Property | Value |
|---|---|
| Content column max width | 36rem (576px at a 16px root) |
| Preferred initial window | 880 × 640 logical px |
| Minimum window | 640 × 480 logical px |
| Top inset | `space.8` (64px) when content height allows; otherwise `space.6` (32px) |
| Bottom inset | `space.7` (48px) |
| Inline inset | `space.7` (48px) when the content area is at least 720px wide; otherwise `space.5` (24px) |
| Gap, name to purpose | `space.3` (12px) |
| Gap, purpose to status | `space.6` (32px) |
| Status region padding | `space.4` (16px) |
| Stack gap inside status | `space.2` (8px) |
| Status region radius | `radius.surface` (12px) |
| Status border | 1px solid `color.border` |

The initial and minimum sizes are layout sizes, not brand requirements. Use them.

This screen does not require a named toolkit. A stack that cannot draw these strings, or cannot show Not ready in the open shell, does not meet this specification.

---

## Strings

Keep these strings together in the UI layer as named constants. Working language is English. Do not build a localization system.

| Constant | Exact string |
|---|---|
| `string.windowTitle` | `Foundation` |
| `string.productName` | `Universal Visual Creation Platform` |
| `string.webDocumentTitle` | `Foundation — Universal Visual Creation Platform` |
| `string.purpose` | `A cross-platform environment for visual creation. This build only proves the application foundation. Creation tools are not part of it.` |
| `string.statusLabel` | `Status` |
| `string.statusStarting` | `Starting` |
| `string.statusReady` | `Ready` |
| `string.statusNotReady` | `Not ready` |
| `string.detailStarting` | `The foundation is still starting.` |
| `string.detailReady` | `The foundation started successfully.` |
| `string.detailNotReady` | `The foundation did not finish starting.` |
| `string.showDetails` | `Details` |
| `string.hideDetails` | `Hide details` |
| `string.diagnosticEmpty` | `No diagnostic message was provided.` |

`string.productName` is the only on-screen heading. It is live text, once. It is not an image, wordmark, or monogram.

`string.windowTitle` (`Foundation`) is the native window title. It is a purpose label, not the product name, not the on-screen heading, not the bundle display name, and not the icon label. Do not invent a shorter name or an acronym.

`string.webDocumentTitle` is the document title. Module 0 launches in the browser, so the browser shows that title. `string.windowTitle` does not replace the document title. The document title does not replace the on-screen heading.

No icon asset exists. Do not draw a placeholder logo, monogram, or wordmark. Do not block the shell on an icon. The toolkit or OS default window icon is acceptable until the Product Owner supplies an icon.

Do not show a version, a build number, or a git hash. Do not invent `0.0.1`. Omit version from this screen. The diagnostic field `0.0.0` is a log field, not screen copy. If the Product Owner later supplies a real product version, show it only as secondary text inside the status region, in `type.label`, at least 4.5:1. It is not a heading and not the window title.

Copy stays in product language. The screen is not a log window. The diagnostic remains available under the status rules below.

---

## Status

Three states, one region. On-screen status words are only Starting, Ready, and Not ready. Do not show session ids, including `starting`, `ready`, or `failed`.

| State | Value | Detail | Diagnostic |
|---|---|---|---|
| Starting | `Starting` | `The foundation is still starting.` | Hidden unless a message already exists |
| Ready | `Ready` | `The foundation started successfully.` | Collapsed if a message exists; otherwise no Details control |
| Not ready | `Not ready` | `The foundation did not finish starting.` | Shown expanded, as plain text, under the detail sentence |

Rules:

- If the window is shown only after initialization finishes, skip Starting. Do not flash an empty window while waiting.
- If the window is shown before initialization finishes, show Starting immediately, with no spinner and no progress animation, then replace it in place with Ready or Not ready.
- Not ready is visible in the open shell for initialization failure, including the controlled initialization-failure path (M0-FR-006, test plan TP-M0-F-004). Do not report that failure only in a console. Do not dismiss it into a blank window. A headless run with no window does not replace this on-screen state.
- The detail sentence stays visible even if the user later collapses the diagnostic.
- The application message is the diagnostic. It is not a new status word and it does not replace the detail sentence.
- A diagnostic is plain text from the application, wrapped, selectable, and copyable. Preserve intentional line breaks. Do not render it as HTML or Markdown. Do not style it as a terminal. Do not add a log viewer, filter, or copy button. Native text selection is the copy path. Do not interpret the message as markup.
- If Not ready has no message, show `string.diagnosticEmpty` in the same place. Do not leave a blank hole.
- Ready with no extra message has no Details control. Do not show a control that does nothing.
- When a diagnostic exists and is collapsed, the control reads `Details`. When expanded, it reads `Hide details`.
- Not ready starts expanded. Ready starts collapsed.
- The status word carries the meaning. The word uses `color.text.primary`, not a status color. A dot may sit 8px square, vertically centered with the status value, with `space.2` between the dot and the word. Ready uses `color.status.ready` for the dot. Not ready uses `color.status.failed` for the dot. Starting has no dot and no amber or warning color. There is no `color.status.starting`. The dot is `aria-hidden` and is not an accessibility element. Color is never the only signal.
- No modal is required to understand failure. Platform quit and close remain available. Escape does not quit. Escape collapses an expanded diagnostic when focus is on its control; otherwise Escape does nothing.

Visible order inside the status region:

1. Label `string.statusLabel`, in `type.label` and `color.text.secondary`
2. Status value, with the optional dot
3. Detail sentence
4. Diagnostic text when visible
5. Details control when it exists

---

## Reading order

Reading order is the visual order:

1. Heading level 1: `string.productName`
2. Paragraph: `string.purpose`
3. Group named `Status`, containing the value, the detail sentence, the diagnostic text when visible, and the details control when it exists

Use the visible Status label as the group name so the word Status is exposed once. Do not announce the decorative dot. The heading is the product name, not `Foundation`.

---

## Details control

The only product control is Details / Hide details. Do not add a second control. `UVCP_FORCE_INIT_FAILURE` is not a visible control. Do not add a failure switch, button, or field.

Prefer the platform standard push button. On the Web shell, that is a native HTML `button`. Do not invent a button family. A native button will not match these hex values. Do not restyle it into a pill or a marketing call to action.

If the stack cannot provide a native button, draw one quiet button:

- label in `type.body`, weight 600, `color.text.primary`
- fill `color.surface`
- 1px border `color.border`
- radius `radius.control` (8px)
- minimum height 28px
- horizontal padding `space.3` (12px)
- no shadow, no gradient, no motion

Hit area is at least the platform minimum and not below 28 × 28 px. The 44 pt iOS target is not a Module 0 requirement.

Hover, if drawn, may darken the border to `color.text.secondary`. It must not move the layout.

Do not autofocus the button on launch. Focus behavior is specified under Focus.

---

## Chrome

Use the platform window frame. Do not draw a custom title bar, traffic lights, or caption buttons.

Remove template commands that author content. A File menu that contains New, Open, Save, or Export is a blocking defect even if the items are disabled. The same is true of any other authoring command.

The table is what platform chrome may show. It does not authorize drawing that chrome inside the page.

| Platform | What may appear | Verb |
|---|---|---|
| macOS | The system application menu, using the full `string.productName`. About focuses this same window, or, if the OS requires a separate panel, that panel repeats the product name, purpose sentence, and current status value as text with no icon. Keep Hide / Hide Others / Show All / Quit when the system inserts them. No Settings item. There are no settings. | Quit |
| Windows | System caption buttons. Add a menu only if the toolkit cannot quit without one: one menu, About and Exit. | Exit |
| Linux | Desktop window controls. Same menu rule as Windows if a menu is required. | Quit, unless the active desktop convention for that toolkit is a different single verb |
| Web | No application menu bar. The document title is `string.webDocumentTitle`. The page is this foundation screen, not a copy of desktop chrome. No site header, footer, or marketing nav. | Close is the browser's own control |

About must not open a second branded experience. No license screen, sign-in, or update check. About and Quit are not painted into the Web page to imitate a desktop menu.

Module 0 implements the Web row. The desktop rows are the chrome contract for a later host that mounts the same UI. They are not a Module 0 desktop shell, not a second visual language, and not an editor layout. Pixel-identical desktop chrome is not required.

---

## What must not appear

Blocking if present:

- a viewport, a `<canvas>`, a canvas grid, a frame probe, a gizmo, or an empty "drop objects here" area
- toolbars or tool palettes, including disabled select, move, rotate, scale, draw, text, or shape tools
- a layers or objects hierarchy, inspector, properties list, timeline, or material/light/camera panel
- splitters, docks, or empty panel slots held open for later modules
- fake menus or disabled commands for authoring
- a Get Started, New Project, or other action that does nothing
- onboarding, carousels, feature promises, or illustrations of later capabilities
- a launch splash used as branding
- gradients, blur, glass, noise textures, or background images
- any image asset the repository does not already have
- a sample shape, transform field, or other direct-manipulation control
- contextual controls (there is no selection)
- a project file, recent document, or project model

Do not add a panel host or a toolbar registry. The only structural allowance for later work is that a later module replaces this content root. It must not inherit a frame of empty regions from Module 0. This specification does not define that later layout.

---

## Boundary

Colors, type, and these strings live in the UI foundation. Core and domain code do not import them (M0-NFR-002). A startup diagnostic crosses that boundary as plain text, not as a widget.

This is a token foundation for one screen, not a component library. Do not add iconography, input themes, tooltip themes, menu themes, elevation, or a second button style.

---

## Color

Two appearances. Semantic roles, not a palette of brand hues. No gradients. No accent beyond `color.focus`. Status words use `color.text.primary`.

Custom-drawn surfaces use the hex values below. Ratios are WCAG 2.x relative luminance for these sRGB values. They are not rounded up to meet a threshold. The later review checks that implementation uses these values, or a documented system-color mapping that still meets the contrast targets.

**Light**

| Role | Hex | Contrast |
|---|---|---|
| `color.canvas` | `#F4F5F7` | background |
| `color.surface` | `#FFFFFF` | background of the status region |
| `color.text.primary` | `#1C1F26` | 15.12:1 on canvas, 16.49:1 on surface |
| `color.text.secondary` | `#3A4150` | 9.38:1 on canvas, 10.23:1 on surface |
| `color.border` | `#7A8496` | 3.46:1 on canvas, 3.77:1 on surface |
| `color.focus` | `#1D4ED8` | 6.14:1 on canvas, 6.70:1 on surface |
| `color.status.ready` | `#146C43` | 5.91:1 on canvas, 6.45:1 on surface |
| `color.status.failed` | `#B42318` | 6.03:1 on canvas, 6.57:1 on surface |

**Dark**

| Role | Hex | Contrast |
|---|---|---|
| `color.canvas` | `#14161C` | background |
| `color.surface` | `#1E2128` | background of the status region |
| `color.text.primary` | `#F4F5F7` | 16.58:1 on canvas, 14.77:1 on surface |
| `color.text.secondary` | `#C5CAD3` | 10.99:1 on canvas, 9.79:1 on surface |
| `color.border` | `#9AA3B5` | 7.13:1 on canvas, 6.35:1 on surface |
| `color.focus` | `#93C5FD` | 10.03:1 on canvas, 8.93:1 on surface |
| `color.status.ready` | `#9BD4B0` | 10.71:1 on canvas, 9.54:1 on surface |
| `color.status.failed` | `#F0B4AE` | 10.20:1 on canvas, 9.09:1 on surface |

---

## Type

One UI font, four roles. Weights are 400 and 600 only. Do not use thin or light weights. Do not bundle a font. Do not set a custom brand face.

Sizes are logical pixels at 100% text scale. Rem values assume a 16px root so Web text zoom still works. Line height is unitless.

| Role | Size | Weight | Line height | Use |
|---|---|---|---|---|
| `type.display` | 28px / 1.75rem | 600 | 1.25 | Product name, once |
| `type.status` | 22px / 1.375rem | 600 | 1.30 | Starting, Ready, Not ready |
| `type.body` | 17px / 1.0625rem | 400 | 1.50 | Purpose, detail sentence, diagnostic |
| `type.label` | 14px / 0.875rem | 600 | 1.40 | The word Status, in `color.text.secondary` |

Do not go below 14px for any visible string on this screen at 100% scale. The product name may wrap to two lines. Do not shrink type to keep it on one line.

`type.body` and `type.label` are below WCAG large text. `type.display` and `type.status` are large enough for a 3:1 large-text exception. Do not use that exception. Every visible string uses the 4.5:1 target.

---

## Space

A 4px base. Define every step. This screen uses `space.2` through `space.8` only. Do not invent off-scale gaps.

| Token | px |
|---|---|
| `space.1` | 4 |
| `space.2` | 8 |
| `space.3` | 12 |
| `space.4` | 16 |
| `space.5` | 24 |
| `space.6` | 32 |
| `space.7` | 48 |
| `space.8` | 64 |

---

## Other tokens

| Token | Value | Use |
|---|---|---|
| `radius.surface` | 12px | Status region only |
| `radius.control` | 8px | Custom details button only, if a native button is unavailable |
| `focus.ring.width` | 2px | Custom focus ring |
| `focus.ring.offset` | 2px | Outside the control |
| `motion.duration.instant` | 0ms | The only duration. There is no other motion token. |

No shadow, blur, opacity stack, or z-index scale. Fills are opaque so contrast stays measurable. Do not use desktop tinting, vibrancy, or material effects on this surface.

---

## Font

`font.family.ui` is one parameter, resolved per platform to that platform's UI font. Do not ship three visual designs.

| Platform | Stack |
|---|---|
| macOS | System font (SF Pro via the platform UI font). Do not bundle SF Pro. |
| Windows | `Segoe UI`, then the toolkit UI font |
| Linux | The toolkit or desktop UI font, then `system-ui`, `sans-serif` |
| Web | `system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif` |

---

## Appearance

Appearance is system appearance with a light fallback. Follow the operating system or browser appearance. Map the light and dark roles to that setting. Do not add an in-app light/dark control. The shell is not dark-only.

If the host exposes no preference, use the light roles. Light is the missing-preference fallback, not a separate theme and not a statement that the product is a light-only tool.

When forced colors or high contrast is active (Windows forced colors, `prefers-contrast: more`, or the platform equivalent), use the system colors for text, background, border, and focus instead of the hex palette. Do not paint the custom palette over that theme.

Every text pair in the tables is above 7:1. Do not add a third increase-contrast palette. Opaque surfaces are required so transparency cannot drop the specified contrast.

---

## Contrast

Every visible string on this shell meets WCAG 2.2 SC 1.4.3 Level AA: at least 4.5:1 against its immediate background, in both default appearances.

Do not use the large-text or bold exceptions. The product name is ordinary text, not a logotype. Do not put the name in an image to avoid the contrast requirement.

Non-text marks that communicate state or focus meet at least 3:1 against adjacent colors (WCAG 2.2 SC 1.4.11). That applies to `color.border`, `color.focus`, and the status dot, unless forced-colors mode has taken over.

WCAG evaluates the specified colors, not antialiased pixels. The later review uses the implemented token values. If a platform font renders a thin weight despite the specified weight, that is a defect. Do not lower contrast to compensate.

---

## Focus

- The details control is in the tab order when it exists. Nothing else on the foundation screen is a tab stop.
- A focused control shows a visible indicator, including when focus arrives from the keyboard.
- Custom drawing uses a 2px outline in `color.focus`, offset 2px outside the control (`focus.ring.width`, `focus.ring.offset`).
- The platform focus ring is acceptable when it is actually visible against `color.canvas` and `color.surface`. Do not rely on a color change of the label alone.
- The ring is not clipped and not hidden under the window edge. At 200% text, scrolling must be able to bring the focused control fully into view.
- Do not trap focus. Do not move focus on a timer.
- Do not autofocus the details control on launch.

---

## Reduced motion

The shell has no entrance animation, no pulsing dot, no spinner, and no animated disclosure. Showing or hiding the diagnostic is instantaneous (`motion.duration.instant`).

Do not add an in-app motion toggle in Module 0. Platform window open and close animation is operating-system chrome. Do not restyle it.

If any custom animation is later added to this shell, it must honor the platform signal:

- macOS Reduce Motion
- Web `prefers-reduced-motion: reduce`
- Windows animation settings when the toolkit exposes them
- Linux: honor the toolkit signal when it exists; otherwise keep custom motion off

---

## Text scaling

At 200% text size, the name, purpose, status, and diagnostic remain readable and reachable by vertical scroll (WCAG 2.2 SC 1.4.4). Nothing essential may require horizontal scroll. Do not truncate those strings with an ellipsis. Do not reorder them to save space. The product name remains the first text, then the purpose, then status.

| Platform | Requirement |
|---|---|
| Web | Relative units from a 100% root. Browser zoom and text-only zoom both work. |
| Windows | Respect DPI and OS text scale. |
| macOS | Use the system UI font at the sizes above. Do not ship the screen as a bitmap. Do not disable OS zoom. Do not add a separate macOS text-size system. If the toolkit exposes an accessibility text size, scale these roles with it. |
| Linux | Follow the desktop font size and DPI when the toolkit provides them. |

---

## Platform parameters

Shared rules are the same roles, strings, state names, column, and contrast targets. They are not the same pixels, the same menu bar, or a copied macOS frame on Windows.

Parameterize:

- `font.family.ui`
- window chrome (the OS or browser owns it)
- `string.windowTitle`, `string.productName`, and `string.webDocumentTitle`
- the quit verb (Quit or Exit)
- light, dark, and forced-colors selection
- reduced-motion and text-scale signals

DV-14 calls this list, the chrome table, and the font table the parameter table.

Out of Module 0 scope:

- pixel matching, including spacing to the exact system control metric
- custom title bars and imitation of Liquid Glass, vibrancy, or materials
- a drawn app icon, SF Symbols, or Icon Composer assets
- menu-bar extras, Touch Bar, widgets, snap layouts, and dock behavior
- multiple windows, fullscreen authoring, and drag and drop
- iOS, iPadOS, watchOS, and visionOS layouts
- an internationalization framework

Module 0 does not have to launch every target platform (M0-NFR-007). The shell that launches uses this screen. A later port does not get a new visual language.

---

## Replacements the Product Owner may make

Implementation does not make these choices. A Product Owner replacement changes the named string or the fallback only. It does not change the layout.

1. **Product name.** Replace `string.productName` with an approved name, and use that same name inside `string.webDocumentTitle`. Do not invent a short menu name or an acronym. The macOS application menu uses the full product name.
2. **Icon.** Module 0 uses the toolkit default and no designed icon, unless the Product Owner supplies one. Do not draw a placeholder.
3. **Appearance.** System appearance, with both role sets, and a light fallback when no preference is exposed. Not dark-only. No in-app theme control.
4. **Purpose sentence.** Replace `string.purpose` only with approved wording that still states this build is the foundation and that creation tools are not part of it.

No other product-identity choice is made in implementation.

---

## M0-AC-012 checklist

The later review is a design review of the running shell against this document. Writing this document does not complete that review. It is not a pixel diff across Windows, macOS, Linux, and Web. Automated visual regression is not required for Module 0.

A finding is blocking when the Blocking if condition is true. Non-blocking differences: native button chrome that does not match the custom-button fallback; platform font metrics that change wrapping; a minimum window size the toolkit cannot honor exactly, provided the default-size strings are not clipped.

M0-AC-012 passes only when every blocking condition below is false for the shell that actually launches. The review record lists each DV id, the evidence (the running shell and the token values used), and any waived non-blocking difference.

DV-01 through DV-20 map to the seven design-verification bullets in test plan section 6.

| ID | Test-plan bullet | Review | Blocking if |
|---|---|---|---|
| DV-01 | Product identity direction | The heading is exactly `string.productName`, as text, once. The native title is `Foundation`. Web title is `string.webDocumentTitle`. No invented logo, monogram, or icon file. | A different name is shown without a Product Owner decision, or a fake brand mark is drawn. |
| DV-02 | Product identity direction | The purpose sentence is exactly `string.purpose`, or a PO-approved replacement recorded as a decision. | The screen claims creation tools exist, or it does not say this build is only the foundation. |
| DV-03 | Interaction consistency | Status is Starting, Ready, or Not ready, with the matching detail sentence. Not ready shows a plain-text diagnostic, expanded. Ready does not show a dead Details button. | Failure is silent, console-only, or hidden behind a click with no visible Not ready sentence. |
| DV-04 | Avoidance of unnecessary editor complexity | The screen is the column described above. | Any viewport, canvas, frame probe, tool, fake hierarchy, inspector, timeline, grid, gizmo, or disabled authoring command is present. |
| DV-05 | Visual hierarchy | Order is name, purpose, status. Name uses `type.display`, status value uses `type.status`, body copy uses `type.body`, the label uses `type.label`. The column is top-weighted and start-aligned. | Text is vertically centered as a splash, center-aligned as a poster, or the status competes with a second heading. |
| DV-06 | Typography foundation | Only `font.family.ui` and the four type roles. Weights 400 and 600. No bundled font. Nothing below 14px at 100% scale. | A brand font, a fifth text style, light/thin weight, or type smaller than 14px. |
| DV-07 | Spacing foundation | Spacing uses the space scale and the insets in this document. | Ad hoc padding or a second spacing system. |
| DV-08 | Visual hierarchy / identity | Both light and dark role sets exist. Custom surfaces use the specified hex values, or a documented system-color map. No gradient, glass, blur, or image. | One appearance only, an in-app theme switch, or decorative treatment that replaces the roles. |
| DV-09 | Accessibility basics | Text meets 4.5:1. Border, focus, and status dot meet 3:1, unless forced-colors mode has taken over. | Any shell string below 4.5:1 in either default appearance, or a focus ring below 3:1 against the surface it sits on. |
| DV-10 | Accessibility basics | Details is reachable by keyboard when present. Focus is visible and not trapped. | No visible focus, or the control cannot be reached and activated from the keyboard. |
| DV-11 | Accessibility basics | No custom animation. Disclosure does not animate. | A spinner, pulse, entrance animation, or disclosure animation that ignores reduced motion. |
| DV-12 | Accessibility basics | At 200% text, name, purpose, status, and diagnostic can be read via vertical scroll. No essential horizontal scroll. No ellipsis on those strings. | Clipped text or a layout that only works at 100%. |
| DV-13 | Accessibility basics | Ready and Not ready are words. The dot is optional and not the accessible name. | Status is communicated only by color or icon. |
| DV-14 | Platform adaptation | Chrome, font, title, and quit verb follow the parameter table. High-contrast / forced-colors mode is not painted over. Platforms are not required to match pixels. | A custom window frame, a copied macOS menu on every platform, or a requirement of pixel equality. |
| DV-15 | Avoidance of unnecessary editor complexity | One content root. No splitters or reserved panel slots. | Layout structure added so later modules can "drop in" tools. |
| DV-16 | Interaction consistency | Nothing is draggable. No transform or parameter fields. | A sample object or fake direct-manipulation control. |
| DV-17 | Platform adaptation / architecture boundary | Tokens and these strings live in the UI foundation, not in core/domain. | Core imports UI colors, fonts, or presentation strings. |
| DV-18 | Interaction consistency | Diagnostic text is plain, selectable, and not HTML. The controlled vocabulary is unchanged. | Markup injection surface, a console theme, or new status words. |
| DV-19 | Interaction consistency | Menus, if any, are only About and Quit/Exit, plus system-supplied app-menu items on macOS. | New, Open, Save, or any authoring command, including disabled. |
| DV-20 | Accessibility basics | The diagnostic can be selected and copied. | The only copy of a failure cannot be selected. |

---

## Traceability

| Requirement | How this specification addresses it |
|---|---|
| M0-FR-001 | Specifies the shell that launches, and excludes the editor. |
| M0-FR-006 | Ready and Not ready are visible in the open shell. Failure text is on screen. |
| M0-FR-009 | Defines the token categories the shell uses, and refuses a premature editor UI. |
| M0-NFR-002 | Tokens and these strings stay in the UI foundation. |
| M0-NFR-007 | The shell that launches uses this screen. Module 0 does not have to launch every platform. |
| M0-NFR-008 | Preserves Progressive Complexity, contextual interaction, and adaptation that is not pixel-identical. |
| M0-AC-012 | The checklist above is the later design review. This document is not that review. |
| Test plan §6 | DV-01 through DV-20 map onto the seven design-verification bullets. |



# Module 0 — Design Intent

**Status:** Preparation design intent. Not an implemented design, not a visual mock, and not the later M0-AC-012 review.  
**Role:** Senior Product Designer / UX Architect  
**Date:** 2026-10-02  
**Audience:** Engineers implementing the minimal shell, and the later design review against this intent.

This document defines only the Module 0 shell and the small design foundation it needs. It does not design the production editor, a component library, or later modules. The operational Module 0 specification wins over the archived product specification.

---

## Role and status

The Designer owns interaction and visual language. Engineers implement this intent. The Human Product Owner still owns product identity: name, icon, and any departure from the appearance assumption below.

Module 0 launches a minimal application shell to prove the architecture and toolchain (M0-FR-001). It also introduces the design foundation that shell needs, and no production editor UI (M0-FR-009). The shell and that foundation must preserve Progressive Complexity, contextual interaction, and cross-platform adaptation without requiring pixel-identical platforms (M0-NFR-008; development process §5.4 and §16).

Passing M0-AC-012 later means a review of the built shell against this document, with no blocking design-quality finding. Writing this file does not complete that review.

What this intent is not:

- approval of a final product name, icon, or brand system;
- a design system or component library;
- authorization to reserve editor panels, tools, or a viewport;
- an App Store submission. Module 0 does not ship to the App Store.

---

## Documents read

Authoritative for this intent:

- `AGENTS.md`
- `docs/product-overview.md`, especially P-02 Progressive Complexity, P-03 Direct Manipulation, P-06 Simple by Default, Powerful on Demand, P-08 Cross-Platform Project Compatibility, and §7 Interaction Philosophy
- `docs/engineering/development-process.md`, §5.4 and §16, with surrounding role and gate context
- `docs/engineering/architecture.md` (still incomplete; technology is not yet chosen)
- `docs/modules/module-00-foundation/specification.md`, especially M0-FR-001, M0-FR-006, M0-FR-009, M0-NFR-002, M0-NFR-007, M0-NFR-008, and M0-AC-012
- `docs/modules/module-00-foundation/test-plan.md`, §6 Design Verification, plus the startup and failure scenarios this shell must make visible

Context only, not authorization:

- `docs/archive/product-engineering-specification-v1.0.md`. Its Module 0 has no design-foundation requirement. The operational specification adds M0-FR-009, M0-NFR-008, and M0-AC-012. Those operational requirements win. Nothing in the archive was used as permission to design later modules.

Checked against current Apple guidance on 2026-10-02, for the points cited below:

- [Design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles) (change log: principles reintroduced 8 June 2026)
- [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- [Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)
- [Motion](https://developer.apple.com/design/human-interface-guidelines/motion) (change log includes Liquid Glass guidance, 9 September 2025)
- [Layout](https://developer.apple.com/design/human-interface-guidelines/layout) (change log: 9 September 2026)
- [Windows](https://developer.apple.com/design/human-interface-guidelines/windows)
- [Toolbars](https://developer.apple.com/design/human-interface-guidelines/navigation-bars) (documentation page titled Toolbars; title guidance updated 16 December 2025)
- [The menu bar](https://developer.apple.com/design/human-interface-guidelines/the-menu-bar)
- [Branding](https://developer.apple.com/design/human-interface-guidelines/branding)
- [Labels](https://developer.apple.com/design/human-interface-guidelines/labels)
- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) (page last updated 8 June 2026)
- [Reduce Motion evaluation criteria](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/reduced-motion-evaluation-criteria/) (App Store Connect Help, 17 September 2026)
- [`accessibilityReduceMotion`](https://developer.apple.com/documentation/swiftui/environmentvalues/accessibilityreducemotion)

Contrast target is also grounded in [WCAG 2.2 SC 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

---

## Shell design intent

### What launch shows

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

The asterisk in the sketch is a status dot, not a bullet in the product copy. Text inside the column is start-aligned (left in English). The column is centered horizontally in the window. It is top-weighted, not vertically centered. A vertically centered block reads as a splash. This is the application screen.

Layout numbers, at the default text scale:

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

The canvas color fills the window content area. The status region is the only inset surface. Do not put the status on a footer glued to the bottom edge. macOS layout guidance says not to place critical information at the bottom of a window, because people park that edge below the screen ([Layout](https://developer.apple.com/design/human-interface-guidelines/layout)).

The window must be resizable. Resizing changes the margins and wraps text. It does not scale the screen like a poster and does not reveal hidden panels. Below the minimum size, keep the same column, reduce inset as specified, and scroll vertically. Never clip or ellipsize the name, purpose, or status sentences.

### Required strings

Keep these strings together in the UI layer as named constants. Do not build a localization system. Working language is English.

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

`Foundation` is a window-purpose title, not a product name. It is 10 characters, under the HIG request for a concise window title of under 15 characters, and it is not the app name. Apple’s toolbar guidance says to give each window a useful title, not to title windows with the app name, and to keep that title short ([Toolbars](https://developer.apple.com/design/human-interface-guidelines/navigation-bars)). The product name is the on-screen heading.

The product name is the only heading. It is live text, not an image, wordmark file, or monogram. No icon asset exists. Do not draw a placeholder logo, and do not block the shell on one. The toolkit or OS default window icon is acceptable until the Product Owner supplies an icon.

### Status behavior

Three states, one region:

| State | Value | Detail | Diagnostic |
|---|---|---|---|
| Starting | `Starting` | `The foundation is still starting.` | Hidden unless a message already exists |
| Ready | `Ready` | `The foundation started successfully.` | Collapsed if a message exists; otherwise no details control |
| Not ready | `Not ready` | `The foundation did not finish starting.` | Shown expanded, as plain text, under the detail sentence |

Rules:

- If the window is shown only after initialization finishes, skip Starting. Do not flash an empty window while waiting.
- If the window is shown before initialization finishes, show Starting immediately, with no spinner and no progress animation, then replace it in place with Ready or Not ready.
- Not ready is visible in the shell for the controlled initialization-failure path (M0-FR-006, test plan TP-M0-F-004). Do not report that failure only in a console, and do not dismiss it into a blank window.
- The detail sentence stays visible even if the user later collapses the diagnostic.
- A diagnostic is plain text from the application, wrapped, selectable, and copyable ([Labels](https://developer.apple.com/design/human-interface-guidelines/labels): useful text such as an error should be selectable). Preserve intentional line breaks. Do not render it as HTML or Markdown. Do not style it as a terminal. Do not add a log viewer, filter, or copy button; native text selection is the copy path.
- If the failure state has no message, show `string.diagnosticEmpty` in the same place. Do not leave a blank hole.
- Ready with no extra message has no Details control. Do not show a control that does nothing.
- When a diagnostic exists and is collapsed, the control reads `Details`. When expanded, it reads `Hide details`.
- Not ready starts expanded. Ready starts collapsed.
- The status word carries the meaning. A dot may sit 8px square, vertically centered with the status value, with `space.2` between dot and word. Ready uses `color.status.ready`. Not ready uses `color.status.failed`. Starting has no dot and no amber or warning color. The dot is `aria-hidden` / not an accessibility element. Color is never the only signal ([Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)).

No modal is required to understand failure. Platform quit/close remains available. Escape does not quit. Escape collapses an expanded diagnostic when focus is on its control; otherwise Escape does nothing.

### Structure for assistive technology

Reading order is the visual order:

1. Heading level 1: `string.productName`
2. Paragraph: `string.purpose`
3. Group named `Status`, containing the value, the detail sentence, the diagnostic text when visible, and the details control when it exists

Do not announce the decorative dot. The heading is the product name, not `Foundation`.

### The only product control

Prefer the platform’s standard push button for Details / Hide details. Do not invent a button family. A native button will not match these hex values, and it should not be restyled into a pill or a marketing call to action.

If the stack cannot provide a native button, draw one quiet button:

- label in `type.body` weight 600, `color.text.primary`
- fill `color.surface`
- 1px border `color.border`
- radius `radius.control` (8px)
- minimum height 28px, horizontal padding `space.3` (12px)
- no shadow, no gradient, no motion

Focus, for native or custom: a visible indicator when the control is focused by keyboard. Custom drawing uses a 2px outline in `color.focus`, offset 2px outside the control. The platform focus ring is acceptable when it is actually visible against `color.canvas` and `color.surface`. Do not rely on color change of the label alone. Do not autofocus the button on launch.

Hit area is at least the platform minimum and not below 28 × 28 px. macOS default control size is 28 × 28 pt; the documented minimum is 20 × 20 pt ([Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)). This product does not target iPhone in Module 0, so the 44pt iOS target is not a Module 0 requirement.

Hover, if drawn, may darken the border to `color.text.secondary`. It must not move the layout.

### Menus and chrome

Use the platform window frame. Do not draw a custom title bar, traffic lights, or caption buttons. Apple’s window guidance says to avoid custom window UI because an imperfect copy feels broken ([Windows](https://developer.apple.com/design/human-interface-guidelines/windows)).

Remove template commands that author content. A generated File menu with New, Open, Save, or Export is a blocking defect even if the items are disabled. The menu bar guidance says an app that does not handle files can eliminate the File menu ([The menu bar](https://developer.apple.com/design/human-interface-guidelines/the-menu-bar)).

Allowed commands:

| Platform | What may appear | Verb |
|---|---|---|
| macOS | The system application menu. About focuses this same window, or, if the OS requires a separate panel, that panel repeats the product name, purpose sentence, and current status value as text with no icon. Keep Hide / Hide Others / Show All / Quit when the system inserts them. No Settings item; there are no settings. | Quit |
| Windows | Caption buttons. Add a menu only if the toolkit cannot quit without one: one menu, About and Exit. | Exit |
| Linux | Desktop window controls. Same menu rule as Windows if a menu is required. | Quit, unless the active desktop convention for that toolkit is a different single verb |
| Web | No application menu bar. The document title is `string.webDocumentTitle`. The page is this foundation screen, not a copy of desktop chrome. | Close is the browser’s own control |

About must not open a second branded experience. No license screen, sign-in, or update check. Those would also be the wrong launch behavior for a later Mac App Store binary ([App Review Guidelines 2.4.5](https://developer.apple.com/app-store/review/guidelines/): no license screen at launch).

### What must not appear

Blocking if present:

- a viewport, canvas grid, gizmo, or empty “drop objects here” area
- toolbars or tool palettes, including disabled select, move, rotate, scale, draw, text, or shape tools
- a layers or objects hierarchy, inspector, properties list, timeline, or material/light/camera panel
- splitters, docks, or empty panel slots held open for later modules
- fake menus or disabled commands for authoring
- a Get Started, New Project, or other action that does nothing
- onboarding, carousels, feature promises, or illustrations of later capabilities
- a launch splash used as branding
- gradients, blur, glass, noise textures, or background images
- any image asset the repository does not already have

Direct manipulation (P-03) has nothing to manipulate here. Do not place a sample shape or transform fields to suggest it. Contextual interaction (product overview §7) has no selection, so it has no contextual controls. That absence is the correct Module 0 expression of the principle.

Progressive complexity (P-02, P-06) constrains the layout, not only the copy. Later panels are added when a real task needs them. They are not permanently visible because the product will eventually support them. Module 0 therefore has no panel host and no toolbar registry. The only structural allowance for the future is that a later module may replace this content root. It must not inherit a frame of empty regions from Module 0.

P-08 is preserved by keeping this screen free of project files, recent documents, and platform-specific document assumptions. The shell displays no project model.

Design values live in the UI / design-foundation boundary. Core and domain code must not import colors, fonts, or these strings (M0-NFR-002). A startup diagnostic crosses that boundary as plain text, not as a widget.

---

## Design foundation scope

This is a token foundation for one screen, not a component library. Implement these categories. Do not add iconography, input themes, tooltip themes, menu themes, elevation, or a second button style.

### Color roles

Two appearances. Semantic roles, not a palette of brand hues. No gradients.

Custom-drawn surfaces use the hex values below. Ratios are WCAG 2.x relative luminance for these sRGB values, computed for this intent. They are not rounded up to meet a threshold. The later review checks that implementation uses these values, or a documented system-color mapping that still meets the contrast target.

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

There is no `color.status.starting` and no accent beyond `color.focus`. Status words use `color.text.primary`.

### Type scale

One UI font, four roles. Weights are 400 and 600 only. Do not use thin or light weights ([Typography](https://developer.apple.com/design/human-interface-guidelines/typography)). Do not bundle a font. Do not set a custom brand face.

Sizes are logical pixels at 100% text scale. Rem values assume a 16px root so Web text zoom still works. Line height is unitless.

| Role | Size | Weight | Line height | Use |
|---|---|---|---|---|
| `type.display` | 28px / 1.75rem | 600 | 1.25 | Product name, once |
| `type.status` | 22px / 1.375rem | 600 | 1.30 | Starting, Ready, Not ready |
| `type.body` | 17px / 1.0625rem | 400 | 1.50 | Purpose, detail sentence, diagnostic |
| `type.label` | 14px / 0.875rem | 600 | 1.40 | The word Status, in `color.text.secondary` |

Body is 17px so it meets the macOS default of 13pt rather than sitting under it. The label is 14px, above the macOS minimum of 10pt ([Typography](https://developer.apple.com/design/human-interface-guidelines/typography)). Do not go below 14px for any visible string on this screen. The product name may wrap to two lines. Do not shrink type to keep it on one line.

`type.body` at 17px and `type.label` at 14px are both below WCAG large text (18pt / 24px, or 14pt bold). They use the 4.5:1 text target, not the large-text exception. The display and status sizes are large enough for the 3:1 exception; they still use `color.text.primary`, which is far above 4.5:1, so the exception is not relied on.

### Space scale

A 4px base. Module 0 may define the whole scale so later UI does not invent one-off gaps. This screen uses 2, 3, 4, 5, 6, 7, and 8 only.

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

### Other tokens

| Token | Value | Use |
|---|---|---|
| `radius.surface` | 12px | Status region only |
| `radius.control` | 8px | Custom details button only, if native button is unavailable |
| `focus.ring.width` | 2px | Custom focus ring |
| `focus.ring.offset` | 2px | Outside the control |
| `motion.duration.instant` | 0ms | The only duration. There is no other motion token. |

No shadow, blur, opacity stack, or z-index scale. Opaque fills keep contrast measurable. Desktop tinting and vibrancy are not goals for this custom surface; recheck them when real macOS chrome is designed.

### Font stack parameter

`font.family.ui` is one parameter, resolved per platform to that platform’s UI font. Do not ship three visual designs.

| Platform | Stack |
|---|---|
| macOS | System font (SF Pro via the platform UI font). Do not bundle SF Pro. |
| Windows | `Segoe UI`, then the toolkit UI font |
| Linux | The toolkit or desktop UI font, then `system-ui`, `sans-serif` |
| Web | `system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif` |

### Appearance parameter

Follow the operating system or browser appearance. Map light and dark roles to that setting. Do not add an in-app light/dark control. Apple’s Dark Mode guidance says an app-specific appearance setting fights the system choice, and that apps should look right in both appearances ([Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)).

If the host exposes no preference, use the light roles. That fallback is an assumption, recorded below.

When a forced-colors or high-contrast mode is active (Windows forced colors, `prefers-contrast: more`, or the platform equivalent), use the system colors for text, background, border, and focus instead of the hex palette. Do not paint the custom palette over a high-contrast theme.

The default pairs already exceed 7:1 for text, so Module 0 does not add a third “increase contrast” palette. Opaque surfaces are required so transparency cannot drop that contrast.

---

## Accessibility and platform adaptation

### Contrast target

**Target for every visible string on this shell: WCAG 2.2 SC 1.4.3 Level AA, at least 4.5:1 against the immediate background.**

Do not use the large-text or bold exceptions, even where Apple’s Accessibility Inspector table would allow 3:1 for 18pt text or for bold text. Apple’s accessibility guidance points inspectors at WCAG AA: up to 17pt at 4.5:1, 18pt at 3:1, and bold at 3:1 ([Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)). The Dark Mode page sets a floor of 4.5:1 and asks custom small text to strive for 7:1. The pairs specified here are all above 7:1 for text, in both appearances.

**Target for non-text marks that communicate state or focus: at least 3:1 against adjacent colors.** That applies to `color.border`, `color.focus`, and the status dot. This matches WCAG 2.2 SC 1.4.11 and keeps the status region’s edge visible without relying on a shadow.

WCAG evaluates the specified colors, not antialiased pixels. The later review uses the implemented token values. If a platform font renders a thin weight despite the specified weight, that is a defect; do not “fix” it by lowering contrast.

Logotypes are exempt from SC 1.4.3. This screen has no logotype. The product name is ordinary text and must meet 4.5:1. Do not put the name in an image to avoid the requirement.

### Focus

- The details control is in the tab order when it exists. Nothing else on the foundation screen is a tab stop.
- A focused control shows a visible ring, including when focus arrives from the keyboard.
- The ring is not clipped and not hidden under the window edge. The content inset is enough at default size; at 200% text, scrolling must be able to bring the focused control fully into view.
- Do not trap focus. Do not move focus on a timer.

### Reduced motion

The shell has no entrance animation, no pulsing dot, no spinner, and no animated disclosure. Showing or hiding the diagnostic is instantaneous (`motion.duration.instant`).

That satisfies reduced motion by not creating motion, which is the right Module 0 behavior:

- HIG Motion: add motion only with a purpose, and make motion optional ([Motion](https://developer.apple.com/design/human-interface-guidelines/motion)).
- HIG Accessibility: when Reduce Motion is on, reduce automatic and repetitive animation ([Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)).
- `accessibilityReduceMotion`: if true, avoid large animations, especially ones that simulate depth.

If a later change adds any custom animation to this shell, it must honor the platform signal: macOS Reduce Motion, Web `prefers-reduced-motion: reduce`, and Windows animation settings when the toolkit exposes them. Linux has no single switch; honor the toolkit signal when it exists, and otherwise keep custom motion off. Do not add an in-app motion toggle in Module 0.

Platform window open/close animation is operating-system chrome. Do not restyle it.

### Text scaling

At 200% text size the name, purpose, status, and diagnostic remain readable and reachable by vertical scroll. Nothing essential may require horizontal scroll. Do not truncate with an ellipsis. This matches the HIG request to support enlarging text by at least 200% ([Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)) and WCAG 2.2 SC 1.4.4.

How scaling is honored:

| Platform | Requirement |
|---|---|
| Web | Relative units from a 100% root. Browser zoom and text-only zoom both work. |
| Windows | Respect DPI and OS text scale. |
| macOS | Dynamic Type is not a macOS feature ([Typography](https://developer.apple.com/design/human-interface-guidelines/typography)). Use the system UI font at the sizes above. Do not ship the screen as a bitmap. Do not disable OS zoom. If the toolkit exposes an accessibility text size, scale these roles with it. |
| Linux | Follow the desktop font size and DPI when the toolkit provides them. |

Hierarchy stays the same at larger sizes: the product name remains the first text, then purpose, then status. Do not reorder to save space.

### Platform adaptation

Shared identity means the same roles, strings, state names, column, and contrast target. It does not mean the same pixels, the same menu bar, or a copied macOS frame on Windows.

Parameterize:

- `font.family.ui`
- window chrome (the OS or browser owns it)
- `string.windowTitle` versus `string.productName` versus `string.webDocumentTitle`
- the quit verb (Quit or Exit)
- light, dark, and forced-colors selection
- reduced-motion and text-scale signals

Ignore in Module 0:

- pixel matching, including spacing to the exact system control metric
- custom title bars and imitation of Liquid Glass, vibrancy, or materials
- a drawn app icon, SF Symbols, or Icon Composer assets
- menu-bar extras, Touch Bar, widgets, snap layouts, and dock behavior
- multiple windows, fullscreen authoring, and drag and drop
- iOS, iPadOS, watchOS, and visionOS layouts. They are not Module 0 targets. Recheck the HIG if a later module ever adds them.
- an internationalization framework. Strings are centralized only so the Product Owner can replace them in one place.

Module 0 does not have to launch every target platform (M0-NFR-007). The first shell uses this same screen. A later port does not get a new visual language.

### What Apple guidance matters now versus later

Module 0 is an engineering build. It is not submitted to the App Store. Process §16 still requires HIG to be considered when platform-facing behavior is introduced, and rechecked when that behavior changes. The points that matter **now**:

- Accessibility is part of the first screen: contrast, text size, reduced motion, keyboard focus, and more than color ([Design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles), reintroduced 8 June 2026; [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)).
- Both appearances, following the system, with no in-app theme switch ([Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)).
- System window chrome, not a custom frame ([Windows](https://developer.apple.com/design/human-interface-guidelines/windows)).
- A short, useful window title that is not the app name ([Toolbars](https://developer.apple.com/design/human-interface-guidelines/navigation-bars)).
- No File menu of authoring commands ([The menu bar](https://developer.apple.com/design/human-interface-guidelines/the-menu-bar)).
- No motion that the screen does not need ([Motion](https://developer.apple.com/design/human-interface-guidelines/motion)).
- Critical status is not pinned to the bottom edge ([Layout](https://developer.apple.com/design/human-interface-guidelines/layout)).
- The product name is text on the working screen, not a launch-screen logo ([Branding](https://developer.apple.com/design/human-interface-guidelines/branding)).

The points that matter **later**, when a distributable Mac or iOS build exists. Do not implement them in Module 0. Recheck the live documents at that time, because this guidance changes:

- The full [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) (last updated 8 June 2026). Before submission, section 2.1 rejects placeholder and temporary content, and the Design section is reviewed against the HIG. This foundation screen is honest for an engineering build and is temporary content for a store binary. It must be gone before any submission. Also relevant later, not now: 2.3.7 (app name length, currently 30 characters), 2.4.5 (Mac App Store sandbox, packaging, no launch license wall, no auto-launch), screenshots that show the app in use, and Accessibility Nutrition Labels.
- [Reduced Motion evaluation criteria](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/reduced-motion-evaluation-criteria/) if the product claims that support. The criteria prefer following the system setting rather than only an in-app switch.
- Liquid Glass, materials, SF Symbols, and icon production. Do not imitate them on this screen.
- A full macOS menu bar (File, Edit, View, Window, Help) only once those commands exist.
- Toolbars, once any exist: HIG expects toolbar commands to also live in the menu bar. Module 0 has no toolbar, so it must not add one “for later.”
- Desktop tinting on custom macOS controls, once custom Mac chrome exists.

A dark-only interface is an explicit HIG exception for rare immersive cases such as media viewing. This shell is not that case. Do not use a dark-only shell to look like a professional 3D tool.

---

## Alternatives considered

### Chosen: a foundation screen

One column states identity, purpose, and status, using a real but small token set. It can be reviewed for hierarchy, contrast, and platform fit. It cannot be mistaken for a broken editor. Startup failure has a designed place to appear. Later modules replace the content root instead of filling pre-drawn holes.

### Rejected: a blank window and a menu

A titled window with only the platform menu, and an empty client area, would prove that a process can open. It would not meet M0-FR-009 or M0-NFR-008. There is no identity, purpose, status, type, spacing, or color to review, so M0-AC-012 would have nothing honest to accept. Success and failure look the same, which fights M0-FR-006. An empty client area also reads as a crash or as an editor that failed to load its tools, and the next change tends to “fill the blank” with panels. A menu of disabled editor commands makes that failure worse. Platform chrome alone is not a design foundation.

### Rejected: an empty production-editor frame

A gray viewport, a tool strip (select, move, shape, text), a layers column, and an inspector, with the tools disabled, is the wrong shell. It fixes the permanent layout before any creation task exists. That contradicts P-02 and P-06, and it contradicts contextual interaction: controls would be visible because the product might someday need them, not because a selection needs them. P-03 is not served by a viewport with nothing to manipulate. Disabled tools look broken rather than intentionally out of scope. The test plan’s design review explicitly checks avoidance of unnecessary editor complexity. This alternative is that complexity.

### Rejected: a marketing or onboarding splash

A centered illustration, a feature list (draw in space, 2D to 3D), and a Get Started button would spend the only screen on promises Module 0 cannot keep. There is no illustration asset and this intent must not require one. There is no action to start. HIG branding guidance says not to use a launch screen as a brand billboard and not to spend space on brand that does not help the task. The copy would also be temporary placeholder content of the kind App Review Guidelines 2.1 tell developers to remove before submission. Motion and a carousel would add accessibility work for no Module 0 job.

---

## Review checklist for later M0-AC-012

The later review is a design review of the running shell against this document. It is not a pixel diff across Windows, macOS, Linux, and Web. Automated visual regression is not required for Module 0.

A finding is blocking when the “Blocking if” condition is true. Non-blocking differences: native button chrome that does not match the custom-button fallback; platform font metrics that change wrapping; a minimum window size the toolkit cannot honor exactly, provided the default-size strings are not clipped.

Map to test plan §6:

| ID | Test-plan bullet | Review | Blocking if |
|---|---|---|---|
| DV-01 | Product identity direction | The heading is exactly `string.productName`, as text, once. The native title is `Foundation`. Web title is `string.webDocumentTitle`. No invented logo, monogram, or icon file. | A different name is shown without a Product Owner decision, or a fake brand mark is drawn. |
| DV-02 | Product identity direction | The purpose sentence is exactly `string.purpose`, or a PO-approved replacement recorded as a decision. | The screen claims creation tools exist, or it does not say this build is only the foundation. |
| DV-03 | Interaction consistency | Status is Starting, Ready, or Not ready, with the matching detail sentence. Not ready shows a plain-text diagnostic, expanded. Ready does not show a dead Details button. | Failure is silent, console-only, or hidden behind a click with no visible Not ready sentence. |
| DV-04 | Avoidance of unnecessary editor complexity | The screen is the column described above. | Any viewport, tool, fake hierarchy, inspector, timeline, grid, gizmo, or disabled authoring command is visible. |
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
| DV-15 | Avoidance of unnecessary editor complexity | One content root. No splitters or reserved panel slots. | Layout structure added so later modules can “drop in” tools. |
| DV-16 | Interaction consistency | Nothing is draggable. No transform or parameter fields. | A sample object or fake direct-manipulation control. |
| DV-17 | Platform adaptation / architecture boundary | Tokens and these strings live in the UI foundation, not in core/domain. | Core imports UI colors, fonts, or presentation strings. |
| DV-18 | Interaction consistency | Diagnostic text is plain, selectable, and not HTML. The controlled vocabulary is unchanged. | Markup injection surface, a console theme, or new status words. |
| DV-19 | Interaction consistency | Menus, if any, are only About and Quit/Exit, plus system-supplied app-menu items on macOS. | New, Open, Save, or any authoring command, including disabled. |
| DV-20 | Accessibility basics | The diagnostic can be selected and copied. | The only copy of a failure cannot be selected. |

M0-AC-012 passes only when every blocking condition above is false for the shell that actually launches. The review record should list each DV id, the evidence (running shell, and the token values used), and any waived non-blocking difference.

---

## Risks, assumptions, PO decisions, open questions

### Risks

- The highest risk is an editor-shaped shell. Toolkit templates often ship a menu and a client area that invite tools. DV-04, DV-15, and DV-19 exist to catch that at review.
- `Foundation` can be mistaken for the product name, or confused with Apple’s Foundation framework, if it leaks into the bundle display name, the icon label, or later marketing. It is specified only as the window-purpose title.
- The long working name exceeds the menu-bar guidance that prefers a short name of 16 characters or fewer for About. That is accepted only until the Product Owner chooses a short name. Do not invent an acronym to paper over it.
- Startup diagnostics can contain local paths. The design shows them as plain text because developers must be able to diagnose startup (M0-FR-006). It does not decide which details are safe to show. Security review owns secret and environment leakage. The UI must not interpret the message as markup.
- Implementing only light mode would fail Dark Mode guidance and DV-08. Implementing dark-only to “look like a 3D tool” would also fail this intent.
- Tokens can sprawl into a component library during Module 0. Anything outside the categories in this document is out of scope.
- This intent was written while `docs/engineering/architecture.md` is still incomplete. The screen does not depend on a specific UI toolkit. A stack that cannot draw text, or cannot show a failure inside the window, cannot satisfy the intent and should be rejected on design grounds as well as technical ones.

### Assumptions

These are recommendations where the repository is silent. They are not Product Owner approvals.

| ID | Assumption | Why |
|---|---|---|
| A-01 | On-screen identity uses the working name `Universal Visual Creation Platform`. | That is the name in `docs/product-overview.md` and `README.md`. No shorter name is approved. README’s product line is still “TBD”. |
| A-02 | The native window title is `Foundation`, not the product name and not “Untitled”. | There is no document. HIG asks for a short purpose title and says not to title the window with the app name. |
| A-03 | The macOS application menu uses the full working name even though it is longer than 16 characters. | A fake short name would be a brand decision. Length is a known temporary exception. |
| A-04 | No icon is designed or required. The toolkit default is used. | No icon asset exists. Module 0 must not depend on illustration. |
| A-05 | Appearance follows the system. Missing preference falls back to light. There is no in-app switch and the shell is not dark-only. | Matches Dark Mode guidance. The repo does not pick a theme. Light is the fallback, not a statement that the product is a light-themed tool. |
| A-06 | The purpose sentence in this document is the Module 0 copy. | The product pitch is longer and describes capabilities this build does not have. The shorter sentence keeps the screen honest. |
| A-07 | The Module 0 audience for this screen is the person proving the toolchain, including the Product Owner at review. Copy stays in product language rather than a stack trace, and the diagnostic remains available. | The shell is not a consumer release, and it is also not a log window. |
| A-08 | Initial size 880 × 640 and minimum 640 × 480 are layout guidance, not brand requirements. | Enough room for the column at 100% text scale. |
| A-09 | Web, if it is the shell that launches, uses the same column inside the page and does not add a site header, footer, or marketing nav. | A browser page is still this shell, not a website. |

### Decisions needed from the Human Product Owner

Implementation can proceed on the assumptions above. These decisions are still the Product Owner’s, and a change replaces strings or the fallback rather than the layout:

1. **Product name.** Confirm the working name as the only public name for now, or replace `string.productName` with an approved name. A short menu name of 16 characters or fewer is optional and must not be invented by the team. App Store name limits (currently 30 characters under guideline 2.3.7) matter only at submission; do not shorten the engineering build just to meet them.
2. **Icon.** Confirm that Module 0 ships with the toolkit default and no designed icon. Supply an icon later if one is wanted. Do not request illustrated branding for this module.
3. **Appearance.** Confirm system-following with a light fallback, rather than a dark-only creative tool or an in-app theme control.
4. **Purpose copy.** Confirm `string.purpose`, or replace it with approved wording that still states this build is not the creation workspace.

No other product-identity choice should be made inside implementation.

### Open questions

These do not block the shell. Defaults above apply until they are answered.

- Which toolkit and which primary development OS will launch first is an architecture decision. The screen is the same either way.
- Whether Module 0 opens a desktop window, a browser page, or both. Only one is required. A second platform later reuses this intent.
- Whether a build version exists. Do not invent `0.0.1` or a git hash on the screen. Omit version until a real version is already part of the build, and then show it only as secondary text inside the status region, in `type.label`, still meeting 4.5:1.
- The final short application name, icon, and any future dark-brand direction. Those are Product Owner decisions, not engineering leftovers to improvise.

---

## Traceability

| Requirement | How this intent addresses it |
|---|---|
| M0-FR-001 | Specifies the shell that launches, and excludes the editor. |
| M0-FR-006 | Ready and Not ready are visible in the shell; failure text is on screen. |
| M0-FR-009 | Defines the token categories the shell actually uses, and refuses a premature editor UI. |
| M0-NFR-008 | Ties the screen to P-02, contextual interaction, and non-identical cross-platform adaptation. |
| M0-AC-012 | Provides the checklist the later design review uses. This document is not that review. |
| Test plan §6 | DV-01 through DV-20 map onto the seven design-verification bullets. |

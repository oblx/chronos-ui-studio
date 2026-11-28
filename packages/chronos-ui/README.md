# `@chronos-ui/svelte` (`v0.1.3`)

Author: `Oblx <code@oblx.dev>` | License: `MIT` | Runtime Dependencies: `0` | Peer: `svelte ^5.0.0`

## Overview

`@chronos-ui/svelte` is a zero-dependency Svelte 5 Runes perimeter HUD presentation framework built around parametric chamfer and concentric round true-stroke vector borders (`UiVectorBorder`) with SVG-native 5-state interactive contours (`data-ui-contour-path` + `data-ui-focus-halo`, zero rectangular CSS borders/outlines), a unified declarative keyboard shortcut registry (`CANONICAL_SHORTCUTS`, zero collisions, `Ctrl/Cmd+K` Global Search, `Ctrl/Cmd+Shift+H` Studio HUD, `attachGlobalShortcutDispatcher`), an 11-zone bilateral HUD shell (`UiPerimeterHud`) with 250ms ASC sequential boot choreography (`createHudBootChoreographer`), a reusable event-driven `UiEventGraph` organism (`@chronos-ui/svelte/graph`) with zero-overlap swimlane headers and true-ratio Human Time-Scale slow-motion signal packets (`timescale.math.ts`), pure-CSS hover-marquee overflow guards (`UiOverflowText`), tip-clean frameless `32x32` concrete-hex 21-state CSS cursor silhouettes, a unified `HORIZONTAL | VERTICAL` `OVERLAY_HOVER` fold engine (`0px` workspace displacement), thin themed scrollbars, priority `infoLevel (0–100)` bounded tooltips, 4-phase modals, 14 UML/diagram shapes, an acyclic DAG wire broker with microsecond `performance.now()` telemetry, and Voice + Xbox/PS5 DualSense Gamepad input ports.

## Semantic Theme Polarity & Root Attributes

Set theme, polarity, and corner style declaratively on `<html>` or any `[data-ui-root]` container:

- `data-ui-theme` — One of 6 WCAG AA+ theme packs (`obsidian-brass`, `phosphor-crt`, `tokyo-phosphor`, `alabaster-lab`, `archival-vellum`, `daylight-blueprint`).
- `data-ui-polarity` — `dark` or `light` polarity driving semantic `--ui-*` tokens, thin scrollbars, and live 21-state frameless cursor SVG recoloring.
- `data-ui-corners` — `STRAIGHT`, `CHAMFER`, or `ROUND` global corner geometry across all 14 shapes (`BOX`, `UML_NOTE`, `UML_PACKAGE`, `UML_COMPONENT`, `UML_DATABASE`, `UML_NODE_3D`, `HEXAGON`, `CAPSULE`, `DIAMOND`, `PARALLELOGRAM`, `TRAPEZOID`, `OCTAGON`, `DOCUMENT`, `SIGNAL_SEND`).

## Subpath Exports (All 14 Library Barrels + Manifest + Styles)

- `@chronos-ui/svelte` — Complete library entry point and `VERSION` (`"0.1.3"`).
- `@chronos-ui/svelte/styles.css` — Tailwind CSS v4 tokens, universal thin themed scrollbars, SVG-native 5-state `.ui-ctl` contour/focus-halo rules, `@keyframes ui-marquee-pingpong`, `CALM_SLOW` motion variables, and accessible utility classes.
- `@chronos-ui/svelte/manifest` — Declarative `UI_FRAMEWORK_MANIFEST` for AI agents and visual builders.
- `@chronos-ui/svelte/tokens` — 6 WCAG theme packs, `geometry/` (3-tier corners + 14 shapes), `control.tokens.ts`, `STUDIO_KNOB_DEFAULTS`, safe-corridor math, and HUD constants.
- `@chronos-ui/svelte/wire` — Acyclic `UiWireBroker`, `createHeadlessWireBroker`, `core/` microsecond `performance.now()` pipeline & UUID v7, and entity registry.
- `@chronos-ui/svelte/input` — Declarative keyboard shortcut registry (`CANONICAL_SHORTCUTS`, `validateShortcutRegistry`, `resolveShortcutForEvent`, `attachGlobalShortcutDispatcher`), pointer, Web Speech Voice (`createVoiceInputAdapter`), and `gamepad/` Xbox/PS5 DualSense (`GAMEPAD_PROFILES`) input ports.
- `@chronos-ui/svelte/motion` — `CALM_SLOW` / `BALANCED` / `SNAPPY` / `REDUCED_ZERO` sensory profiles, true-ratio `timescale.math.ts` (`computeHumanScaledDurationMs`, `formatSubMsDuration`, `computeMarqueeDurationMs`), `createHudBootChoreographer`, and `uiTransition`.
- `@chronos-ui/svelte/cursor` — Tip-clean frameless 21-state `32x32` concrete-hex SVG cursor silhouettes (`cursor.silhouettes.ts`, `CURSOR_DRAG_TARGET_STATES`, `buildCursorPackCss`) and live polarity cascade runtime.
- `@chronos-ui/svelte/machines` — Unified `createFoldOverlayMachine` / `uiFoldGrip`, `overlays/` (4-phase `createModalMachine`, `infoLevel` `createTooltipController`, spotlight tour), and `OVERLAY_HOVER` spatial governor.
- `@chronos-ui/svelte/atoms` — `controls/` (`UiChamferButton`, `UiUtilityIconButton`, `UiBadge`), `UiOverflowText`, `UiChamferFrame`, SVG-native 5-state `UiVectorBorder`, `UiIcon`, `UiMathFormula`.
- `@chronos-ui/svelte/forms` — SVG-native 5-state `UiInput`, `UiSelect`, `UiSlider`, `UiPopover`.
- `@chronos-ui/svelte/molecules` — `overlays/` (`UiCyberTooltip`, `UiContextMenu`), `UiSubTabBar`, `UiHorizontalDeck`, `UiAccordionSection`.
- `@chronos-ui/svelte/organisms` — `UiPerimeterHud`, `UiEdgeDrawer`, `UiInteractiveCanvasStage`, `wire-observatory/`, `graph/`, `overlays/`, `UiSpotlightVeil`.
- `@chronos-ui/svelte/graph` — Standalone reusable `UiEventGraph` organism, `computeGraphLayout` (`LANE_HEADER_BAND_PX` zero-overlap guarantee), `buildGraphEdgePath`, and `computeGraphFitTransform`.
- `@chronos-ui/svelte/modals` — Pure-Flex centered 4-phase `UiModalShell` with universal state-preserving Grow/Shrink (`Alt+M`), header, and footer.
- `@chronos-ui/svelte/assistant` — `OVERLAY_HOVER` `UiAssistantDock` with sticky header, discrete tool chips, deterministic `Build`/`Send` CTA, voice capture, and `use:uiFoldGrip`.
- `@chronos-ui/svelte/canvas` — Declarative `COMPONENT_CATALOG` metadata (including `UiEventGraph`) and live canvas `UiNode` type definitions.

## Installation & Quick Usage

1. Install alongside Svelte 5: `bun add @chronos-ui/svelte` (or `npm install @chronos-ui/svelte`).
2. Import `@chronos-ui/svelte/styles.css` once in your application root entry.
3. Import components, `CANONICAL_SHORTCUTS`, `UiEventGraph`, `UiOverflowText`, `computeHumanScaledDurationMs`, `UiWireBroker`, or 21-state cursors from `@chronos-ui/svelte` or any subpath barrel above.

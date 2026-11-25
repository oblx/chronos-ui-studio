# `@chronos-ui/svelte` (`v0.1.0`)

Author: `Oblx <code@oblx.dev>` | License: `MIT` | Runtime Dependencies: `0` | Peer: `svelte ^5.0.0`

## Overview

`@chronos-ui/svelte` is a zero-dependency Svelte 5 Runes perimeter HUD presentation framework built around parametric chamfer and concentric round true-stroke vector borders (`UiVectorBorder`), an 11-zone bilateral HUD shell (`UiPerimeterHud`), a unified configurable `HORIZONTAL | VERTICAL` `OVERLAY_HOVER` fold engine (`createFoldOverlayMachine` + `use:uiFoldGrip`) powering both `UiEdgeDrawer` and `UiAssistantDock` with $0\text{px}$ workspace displacement, bounded multi-paragraph vector tooltips (`UiCyberTooltip`), 14 UML/diagram frame shapes (`UI_FRAME_SHAPES`), an acyclic DAG wire broker (`createUiWireBroker` / `createHeadlessWireBroker`), an ADHD-friendly `CALM_SLOW` motion token engine, a 21-state concrete-hex CSS cursor runtime, and Voice + Xbox/PS5 DualSense Gamepad input ports.

## Semantic Theme Polarity & Root Attributes

Set theme, polarity, and corner style declaratively on `<html>` or any `[data-ui-root]` container:

- `data-ui-theme` — One of 6 WCAG AA+ theme packs (`obsidian-brass`, `phosphor-crt`, `tokyo-phosphor`, `alabaster-lab`, `archival-vellum`, `daylight-blueprint`).
- `data-ui-polarity` — `dark` or `light` polarity driving semantic `--ui-*` tokens and live 21-state cursor SVG recoloring.
- `data-ui-corners` — `STRAIGHT`, `CHAMFER`, or `ROUND` global corner geometry across all 14 shapes (`BOX`, `UML_NOTE`, `UML_PACKAGE`, `UML_COMPONENT`, `UML_DATABASE`, `UML_NODE_3D`, `HEXAGON`, `CAPSULE`, `DIAMOND`, `PARALLELOGRAM`, `TRAPEZOID`, `OCTAGON`, `DOCUMENT`, `SIGNAL_SEND`).

## Subpath Exports (All 13 Library Barrels + Manifest + Styles)

- `@chronos-ui/svelte` — Complete library entry point and `VERSION` (`"0.1.0"`).
- `@chronos-ui/svelte/styles.css` — Tailwind CSS v4 tokens, `CALM_SLOW` motion variables, and accessible utility classes.
- `@chronos-ui/svelte/manifest` — Declarative `UI_FRAMEWORK_MANIFEST` for AI agents and visual builders.
- `@chronos-ui/svelte/tokens` — 6 WCAG theme packs, `geometry/` (3-tier corners + 14 shapes), safe-corridor math, and HUD constants.
- `@chronos-ui/svelte/wire` — Acyclic `UiWireBroker`, `createHeadlessWireBroker`, `core/` pipeline & UUID v7, and entity registry.
- `@chronos-ui/svelte/input` — Unified pointer, keyboard, Web Speech Voice (`createVoiceInputAdapter`), and Xbox/PS5 DualSense Gamepad (`GAMEPAD_PROFILES`) input ports.
- `@chronos-ui/svelte/motion` — `CALM_SLOW` / `BALANCED` / `SNAPPY` / `REDUCED_ZERO` sensory profiles and `uiTransition`.
- `@chronos-ui/svelte/cursor` — 21-state concrete-hex SVG data-URI cursor packs (`buildCursorPackCss`) and live polarity cascade runtime.
- `@chronos-ui/svelte/machines` — Unified `createFoldOverlayMachine` / `uiFoldGrip`, multi-paragraph `parseTooltipContent`, spotlight tour, modal Grow/Shrink, and `OVERLAY_HOVER` spatial governor.
- `@chronos-ui/svelte/atoms` — `UiChamferFrame`, `UiChamferButton`, `UiVectorBorder`, `UiBadge`, `UiIcon`, `UiMathFormula`.
- `@chronos-ui/svelte/forms` — `UiInput`, `UiSelect`, `UiSlider`, `UiPopover`.
- `@chronos-ui/svelte/molecules` — Bounded multi-paragraph `UiCyberTooltip`, `UiSubTabBar`, `UiHorizontalDeck`, `UiAccordionSection`, `UiContextMenu`.
- `@chronos-ui/svelte/organisms` — `UiPerimeterHud`, `UiEdgeDrawer`, `UiInteractiveCanvasStage`, `wire-observatory/` (`UiWireDagGraph`, `UiWireInspector`), `overlays/` (`UiToastStack`, `UiVirtualCursors`), `UiSpotlightVeil`.
- `@chronos-ui/svelte/modals` — Pure-Flex centered `UiModalShell` with universal state-preserving Grow/Shrink (`Alt+M`), header, and footer.
- `@chronos-ui/svelte/assistant` — `OVERLAY_HOVER` `UiAssistantDock` with sticky header, discrete tool chips, deterministic `Build`/`Send` CTA, voice capture, and `use:uiFoldGrip`.
- `@chronos-ui/svelte/canvas` — Declarative `COMPONENT_CATALOG` metadata and live canvas `UiNode` type definitions.

## Installation & Quick Usage

1. Install alongside Svelte 5: `bun add @chronos-ui/svelte` (or `npm install @chronos-ui/svelte`).
2. Import `@chronos-ui/svelte/styles.css` once in your application root entry.
3. Import components, `createFoldOverlayMachine`, `UiWireBroker`, 21-state cursors, or Voice/Gamepad adapters from `@chronos-ui/svelte` or any subpath barrel above.

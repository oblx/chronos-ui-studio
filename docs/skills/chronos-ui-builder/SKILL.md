---
name: chronos-ui-builder
description: Compose, theme, animate, and drive @chronos-ui/svelte v0.0.9 11-zone perimeter interfaces, 3-tier parametric corner cuts (0.5/0.75/0.3125rem with <=28% anti-pinch cap), 5x3 shape-locked embellishments + pathLength=100 traces, Pure-Flex modals, Station Builder, Zone Edition, and 35-tool Dual-Spine MCP canvases. Use when building UI layouts, samples, shapes, or motion flows in packages/chronos-ui or studio/src/client.
license: MIT
compatibility: Svelte 5 Runes, Tailwind CSS v4, Zero Runtime Dependencies
metadata:
  author: Oblx <code@oblx.dev>
  version: "0.0.9"
allowed-tools: view_file replace_file_content write_to_file run_command
---

# Chronos UI Builder (`@chronos-ui/svelte` v0.0.9)

Compose sovereign Svelte 5 Runes interfaces inside `studio/src/client/` using primitives imported strictly from `@chronos-ui/svelte`.

## Architectural Rules

1. **Strict Package Firewall & Canonical Aliases**: Never import `studio/` modules inside `packages/chronos-ui/`; use `@ui/*` / `@studio/*` / `@chronos-ui/svelte/*` instead of `../..`.
2. **Humble Svelte Views**: `.svelte` views perform zero `fetch()`, storage I/O, or domain math; dispatch typed `DagEnvelope` intents through `createUiWireBroker`.
3. **3-Tier Parametric Geometry**: Assign `cutTier="station"` (`0.75rem`) to perimeter pods & modals, default `0.5rem` to base frames, and `0.3125rem` (`CONTROL_MAX_CUT_RATIO = 0.28`) to compact buttons, icon triggers, badges, inputs, and selects.
4. **14 Contour-Locked Shapes & 5x3 Embellishments**: Plot all `9` `CORNER_EMBELLISHMENTS` (`+DIAMOND`, `DOUBLE_LINE`, `CROSSHAIR`) on `anchorVertices` or concentric `ROUND` `A` arcs, and pair `6` `CORNER_ANIMATIONS` (`+ORBIT_TRACE`, `SCAN_GLINT` on `pathLength="100"` perimeter trace).
5. **Phase-Locked Motion & Self-Filtered Collab**: Pair `IRIS_EXPAND` / `SCAN_WIPE` with `use:uiSwipeDeck`, `Z_LAYERS.overlays` (`90`) clamped `UiCyberTooltip`, and `localSessionId`-filtered `UiVirtualCursors`.

## Workspace Workflow

1. Inspect capabilities and primitives via `GET /api/mcp/manifest` or `ui_list_primitives`.
2. Verify custom color palettes with `ui_validate_theme_wcag` ($C \ge 4.5$) and stage nodes via `ui_spawn_node` / `ui_load_sample` (`Shape Matrix Lab`, `Neon Ops Command Deck`, etc.).
3. Persist explicit workspace state via `[ Save ]` (`UI_PROJECT_SAVE`) or recover via `[ Reset ]` (`UI_WORKSPACE_RESET_DEFAULT` / `UI_PROJECT_CLEAN`), preserving undo history (`Cmd/Ctrl+Z`).
4. Compile standalone apps cleanly with `ui_export_static` (`static-site-build` Vite bundle).

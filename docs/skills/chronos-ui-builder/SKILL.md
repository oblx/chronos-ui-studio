---
name: chronos-ui-builder
description: Compose, theme, animate, and drive @chronos-ui/svelte v0.0.7 11-zone perimeter interfaces, true-stroke chamfer/round vector borders, configurable cornerRadiusRem, concentric ROUND arcs, Pure-Flex modals, Station Builder, Zone Edition, and 33-tool Dual-Spine MCP canvases. Use when building UI layouts, samples, shapes, or motion flows in packages/chronos-ui or studio/src/client.
license: MIT
compatibility: Svelte 5 Runes, Tailwind CSS v4, Zero Runtime Dependencies
metadata:
  author: Oblx <code@oblx.dev>
  version: "0.0.7"
allowed-tools: view_file replace_file_content write_to_file run_command
---

# Chronos UI Builder (`@chronos-ui/svelte` v0.0.7)

Compose sovereign Svelte 5 Runes interfaces inside `studio/src/client/` using primitives imported strictly from `@chronos-ui/svelte`.

## Architectural Rules

1. **Strict Package Firewall**: Never import `studio/` modules inside `packages/chronos-ui/`.
2. **Humble Svelte Views**: `.svelte` views perform zero `fetch()`, storage I/O, or domain math; dispatch typed `DagEnvelope` intents through `createUiWireBroker`.
3. **Bilateral & Safe-Corridor Symmetry**: Mirror perimeter tuples via `mirrorCornerTuple` across $X = 50\text{vw}$ and bind `DEFAULT_VIEWPORT`, `Z_LAYERS`, and `SAFE_CORRIDOR_REM` tokens rather than magic numerals.
4. **14 Contour-Locked Shapes**: Plot `CORNER_EMBELLISHMENTS` strictly on `anchorVertices` from `buildShapeGeometry` and render nested `node.children` inside parent `UiChamferFrame` containers (`items-start` grids).
5. **Phase-Locked Motion & Swipe**: Pair `IRIS_EXPAND` / `SCAN_WIPE` parent clipping with single-timeline Grid `0fr <-> 1fr` accordions, `Z_LAYERS.overlays` (`90`) clamped `UiCyberTooltip`, and `use:uiSwipeDeck` across multi-tab modals.

## Workspace Workflow

1. Inspect capabilities and primitives via `GET /api/mcp/manifest` or `ui_list_primitives`.
2. Verify custom color palettes with `ui_validate_theme_wcag` ($C \ge 4.5$) and stage nodes via `ui_spawn_node` / `ui_load_sample` (`Shape Matrix Lab`, `Neon Ops Command Deck`, etc.).
3. Persist explicit workspace state via `[ Save ]` (`UI_PROJECT_SAVE`) or recover via `[ Reset ]` (`UI_WORKSPACE_RESET_DEFAULT` / `UI_PROJECT_CLEAN`), preserving undo history (`Cmd/Ctrl+Z`).
4. Compile standalone apps cleanly with `ui_export_static` (`static-site-build` Vite bundle).

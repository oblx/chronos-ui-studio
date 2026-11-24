---
name: chronos-ui-builder
description: Compose, theme, animate, and drive @chronos-ui/svelte v0.0.12 11-zone perimeter interfaces, unconditional Calm boot with mirrored chamfered LEFT_EDGE/RIGHT_EDGE icon rails, safe-corridor auto-framing, CALM_SLOW ADHD-friendly motion tokens, universal modal Grow/Shrink, 2D Wire DAG Observatory, CS6 Wireframe Workbench, and 42-tool Dual-Spine MCP canvases. Use when building UI layouts, samples, shapes, or motion flows in packages/chronos-ui or studio/src/client.
license: MIT
compatibility: Svelte 5 Runes, Tailwind CSS v4, Zero Runtime Dependencies
metadata:
  author: Oblx <code@oblx.dev>
  version: "0.0.12"
allowed-tools: view_file replace_file_content write_to_file run_command
---

# Chronos UI Builder (`@chronos-ui/svelte` v0.0.12)

Compose sovereign Svelte 5 Runes interfaces inside `studio/src/client/` using primitives imported strictly from `@chronos-ui/svelte`.

## Architectural Rules

1. **Strict Package Firewall & Canonical Aliases**: Never import `studio/` modules inside `packages/chronos-ui/`; use `@ui/*` / `@studio/*` / `@chronos-ui/svelte/*` instead of `../..`.
2. **Humble Svelte Views**: `.svelte` views perform zero `fetch()`, storage I/O, or domain math; dispatch typed `DagEnvelope` intents through `createUiWireBroker`.
3. **3-Tier Parametric Geometry**: Assign `cutTier="station"` (`0.75rem`) to perimeter pods & modals, default `0.5rem` to base frames, and `0.3125rem` (`CONTROL_MAX_CUT_RATIO = 0.28`) to compact buttons, icon triggers, badges, inputs, and selects.
4. **14 Contour-Locked Shapes & 5x3 Embellishments**: Plot all `9` `CORNER_EMBELLISHMENTS` (`+DIAMOND`, `DOUBLE_LINE`, `CROSSHAIR`) on `anchorVertices` or concentric `ROUND` `A` arcs, and pair `6` `CORNER_ANIMATIONS` (`+ORBIT_TRACE`, `SCAN_GLINT` on `pathLength="100"` perimeter trace).
5. **High-Scale Indexing & Spatial Constancy**: Use O(1) indexed `createUiEntityRegistry`, batched `dispatchBatch`, invariant `--ui-safe-left`/`--ui-safe-right` (`72px` desktop) overlay-only `UiEdgeDrawer` panels (`0px` workspace width shift), and reciprocal `Studio HUD <-> Calm View` alignment.

## Workspace Workflow

1. Inspect capabilities and primitives via `GET /api/mcp/manifest` or `ui_list_primitives`.
2. Verify custom color palettes with `ui_validate_theme_wcag` ($C \ge 4.5$) and compose across the 11 zones via the CS6 Wireframe Skeleton Workbench (`ui_open_wireframe_skeleton`).
3. Persist explicit workspace state via `[ Save ]` (`UI_PROJECT_SAVE`) or recover via `[ Reset ]` (`UI_WORKSPACE_RESET_DEFAULT` / `UI_PROJECT_CLEAN`), preserving undo history (`Cmd/Ctrl+Z`).
4. Compile standalone static clients (`ui_export_static`) or self-contained Bun/Drizzle full-stack bundles (`ui_export_fullstack_bundle`).

# `@chronos-ui/svelte` & AI-Agent UI Builder Studio

Author: `Oblx <code@oblx.dev>` | Package Lock: `@chronos-ui/svelte` (`v0.1.3`, MIT License)

## Overview

`@chronos-ui/svelte` is a zero-dependency Svelte 5 Runes perimeter HUD presentation framework featuring a 3-tier parametric corner-cut hierarchy (`0.5rem` base, `0.75rem` stations/modals, `0.3125rem` compact controls with $\le 28\%$ anti-pinch height clamping), continuous true-stroke SVG vector borders (`UiVectorBorder`) with SVG-native 5-state interactive contours (`data-ui-contour-path` + `data-ui-focus-halo`, zero rectangular CSS borders/outlines), a unified declarative keyboard shortcut registry (`CANONICAL_SHORTCUTS`, zero collisions, `Ctrl/Cmd+K` Global Search & Command Palette, `Ctrl/Cmd+Shift+H` Studio HUD toggle, `UI_REBIND_SHORTCUT` overrides), concentric circular SVG `A` arc embellishments in `ROUND` mode, `9` corner ornaments x `6` shape-locked perimeter animations across all `14` UML/diagram shapes, a reusable event-driven `UiEventGraph` organism (`@chronos-ui/svelte/graph`) with zero-overlap `LANE_HEADER_BAND_PX` swimlanes, `BEZIER | ORTHOGONAL | STEP` edge routing, and true-ratio Human Time-Scale slow-motion signal packets (`timescale.math.ts`, `100x..25000x`, `4.0x` linear scaling from `2500x -> 10000x`), pure-CSS hover-marquee overflow guards (`UiOverflowText` + `.ui-marquee-track`), tip-clean frameless `32x32` concrete-hex 21-state CSS UI Level 4 cursors, microsecond-accurate `performance.now()` wire telemetry (`formatSubMsDuration`), unified `HORIZONTAL | VERTICAL` `OVERLAY_HOVER` fold panels (`0px` workspace displacement), 4-phase modals, 250ms ASC HUD boot choreography, IndexedDB Undo/Redo (`default: 5`, `max: 128`), and `14` tree-shakeable library subpath exports with verified `.d.ts` declarations. Companion Studio delivers `52`-tool Dual-Spine MCP parity (`ui_list_shortcuts`, `ui_open_global_search`, `ui_configure_graph`, `ui_set_wire_timescale`) and static + vendored SQLite/Drizzle full-stack exports.

## 5-Minute Newcomer Setup

1. Install & Run: `bun install && bun run dev` -> open `http://localhost:3000` (zero API keys required; boots unconditionally in Calm Mode with tip-clean frameless 21-state `Cyber Reticle` cursors, thin themed scrollbars, `CALM_SLOW` motion tokens, and permanent Undo/Redo controls).
2. Press `Ctrl+K` (or `Cmd+K` on macOS) from anywhere—including inside inputs—to open the unified Global Search & Command Palette across Commands, Components, Field Tome Chapters, MCP Tools, Live Nodes, and Presets; press `Ctrl+Shift+H` (`Cmd+Shift+H`) to toggle `Studio HUD`.
3. Adjust `Time-Scale (100x..25000x)`, `LINEAR / LOG` curves, `Hover-Marquee Speed (16..120 px/s)`, `Drag-Target Frames`, and custom `Shortcut Rebinds` directly from `UiWireInspector`, `CursorStudioModal`, or `Settings -> Input & Modality`.
4. Use `bun run qa:fast` ($\le 3\text{s}$ warm incremental check) and `bun run qa:harness -- --scenario=latest --viewports=1440x900,1280x800,390x844 --json` (`0` screenshots) during development; run `bun run qa:release` for final pre-signoff.

## Architecture Tiers (All Directories `<= 8` Files, `100%` Barrelled)

1. `packages/chronos-ui/` — Publish-ready zero-dependency Svelte 5 library (`MIT`, `17` exports including `./graph`, `input/shortcuts.registry.ts`, `input/shortcuts.engine.ts`, `input/gamepad/`, `organisms/graph/`, `atoms/UiOverflowText.svelte`, `motion/timescale.math.ts`, `cursor/cursor.silhouettes.ts`, `tsconfig.build.json` `.d.ts` emit).
2. `studio/src/config/` — App constants, unified `STUDIO_LEFT_TABS` / `STUDIO_RIGHT_TABS`, 7-step `STUDIO_SPOTLIGHT_STEPS`, 5 starter samples, `STUDIO_UI_COPY`, and compiled AST `tome.ssg.ts`.
3. `studio/src/core/` — Schemas, codegen, HLC/RBAC/SSRF, `assistant/` (local/provider AI planners), and `engine/` (`tools/`, RFC 6902 patcher, Governance Gate, silhouette-aware cursor synthesizer, `52`-tool `STUDIO_TOOL_REGISTRY`).
4. `studio/src/lib/` — Drizzle `bun:sqlite` WAL schema, AEAD vault, IndexedDB mirror, and dedicated IndexedDB-only `history.idb.ts` (`chronos_ui_history_v1`, default `5`, max `128`).
5. `studio/src/server/` — Bun HTTP router, auth middleware, `catalog/` theme/blueprint routes, project/lifecycle/entity/AI/env/pipeline routes, sub-ms telemetry ring, and realtime collab hub.
6. `studio/src/mcp/` — Dual-Spine MCP (`stdio`, `/api/mcp`, `/api/mcp/twin`, `/api/mcp/manifest`) with modular `tools/` barrel (`mcp.v011.tools.ts` with `ui_list_shortcuts` & `ui_open_global_search`) generated 1:1 from `STUDIO_TOOL_REGISTRY`.
7. `studio/src/plugins/` — 6 Input Connectors and 6 Output Adapters (Svelte 5 W3C landmarks, CSS Tokens, JSON, W3C/WebMCP `static-site-build`, standalone vendored `fullstack-bundle`, PKZIP).
8. `studio/src/workers/` — AST SSG Tome compiler, CLI PAT minter, atomic `qa:timer` (`sprint --fresh`), `qa_audit.ts` (`NO_RECTANGULAR_BORDER_ON_CORNERED_CTL`), sub-3s warm `qa_verify.ts`, and `harness/` multi-viewport Playwright runner.
9. `studio/src/client/` — Humble 3-layer Svelte 5 Studio SPA with `modals/search/GlobalSearchModal.svelte`, zero-clip `TOP_LEFT` `TopPerimeterPods` + `ProjectLifecyclePod`, lazy-chunked `UiLiveNodeWidget` (`UiEventGraph`), and lazy 4-phase `StudioModalStack`.
10. `docs/` — 6 handbook chapters (`01`–`06`), 6 synced `v0.1.3` skills (`docs/skills/`), and sprint logs (`docs/08-sprints/` with `archive/v0.0.x/`).

## Quick Commands

- `bun run dev` — Start Bun server + Vite dev bridge on port `3000`.
- `bun run build` — Build AST SSG Tome and code-split production Vite bundle (`index-*.js < 175 kB`).
- `bun run qa:fast` — Scoped-default inner-loop gate ($\le 3\text{s}$ warm: cached `qa_audit` + incremental `--skipLibCheck` `tsc --noEmit` + `v0103_shortcuts_states_closing.test.ts`).
- `bun run qa:harness` — Scoped-default headless Chromium E2E CLI (`--scenario=latest` across `1440x900,1280x800,390x844`, inline console capture, `0` screenshots).
- `bun run qa:release` — Single pre-signoff full battery across all test suites, uncached `qa_audit`, SSG Tome, package `.d.ts` emit check, and production Vite build.

# `@chronos-ui/svelte` & AI-Agent UI Builder Studio

Author: `Oblx <code@oblx.dev>` | Package Lock: `@chronos-ui/svelte` (`v0.1.2`, MIT License)

## Overview

`@chronos-ui/svelte` is a zero-dependency Svelte 5 Runes perimeter HUD presentation framework featuring a 3-tier parametric corner-cut hierarchy (`0.5rem` base, `0.75rem` stations/modals, `0.3125rem` compact controls with $\le 28\%$ anti-pinch height clamping), continuous true-stroke SVG vector borders (`UiVectorBorder`), concentric circular SVG `A` arc embellishments in `ROUND` mode, `9` corner ornaments x `6` shape-locked perimeter animations across all `14` UML/diagram shapes, a reusable event-driven `UiEventGraph` organism (`@chronos-ui/svelte/graph`) with zero-overlap `LANE_HEADER_BAND_PX` swimlanes, `BEZIER | ORTHOGONAL | STEP` edge routing, and real-number Human Time-Scale slow-motion signal packets (`timescale.math.ts`, `100x..25000x`, `LINEAR | LOGARITHMIC`), pure-CSS hover-marquee overflow guards (`UiOverflowText` + `.ui-marquee-track`) ensuring zero text clipping across `TOP_LEFT` Studio HUD and `FieldTomeModal` TOC buttons, tip-clean frameless `32x32` concrete-hex 21-state CSS UI Level 4 cursors (with optional `cursorDragTargetFrames` gated strictly to drag states), microsecond-accurate `performance.now()` wire telemetry (`formatSubMsDuration`), unified `HORIZONTAL | VERTICAL` `OVERLAY_HOVER` fold panels (`0px` workspace displacement), 4-phase modals, 250ms ASC HUD boot choreography, IndexedDB Undo/Redo (`default: 5`, `max: 128`), and `14` tree-shakeable library subpath exports with verified `.d.ts` declarations. Companion Studio delivers `50`-tool Dual-Spine MCP parity (`ui_configure_graph`, `ui_set_wire_timescale`) and static + vendored SQLite/Drizzle full-stack exports.

## 5-Minute Newcomer Setup

1. Install & Run: `bun install && bun run dev` -> open `http://localhost:3000` (zero API keys required; boots unconditionally in Calm Mode with tip-clean frameless 21-state `Cyber Reticle` cursors, thin themed scrollbars, `CALM_SLOW` motion tokens, and permanent Undo/Redo controls).
2. Prompt `"add a live event graph with hexagon nodes"` in `UiAssistantDock` (or click `Studio HUD` -> `DAG`) to inspect or spawn live reusable `UiEventGraph` topologies powered by `computeHumanScaledDurationMs`.
3. Adjust `Time-Scale (100x..25000x)`, `LINEAR / LOG` curves, `Hover-Marquee Speed (16..120 px/s)`, and `Drag-Target Frames` directly from `UiWireInspector`, `CursorStudioModal`, or `Settings -> Visuals & Motion`.
4. Use `bun run qa:fast` ($\le 3\text{s}$ warm incremental check) and `bun run qa:harness --json` (scoped `--scenario=latest`, inline console capture, `0` screenshots) during development; run `bun run qa:release` for final pre-signoff.

## Architecture Tiers (All Directories `< 10` Files, `100%` Barrelled)

1. `packages/chronos-ui/` — Publish-ready zero-dependency Svelte 5 library (`MIT`, `17` exports including `./graph`, `organisms/graph/`, `atoms/UiOverflowText.svelte`, `motion/timescale.math.ts`, `cursor/cursor.silhouettes.ts`, `tsconfig.build.json` `.d.ts` emit).
2. `studio/src/config/` — App constants, unified `STUDIO_LEFT_TABS` / `STUDIO_RIGHT_TABS`, 7-step `STUDIO_SPOTLIGHT_STEPS`, 5 starter samples, `STUDIO_UI_COPY`, and compiled AST `tome.ssg.ts`.
3. `studio/src/core/` — Schemas, codegen, HLC/RBAC/SSRF, `assistant/` (local/provider AI planners supporting `UiEventGraph`), and `engine/` (`tools/`, RFC 6902 patcher, Governance Gate, silhouette-aware cursor synthesizer, `50`-tool `STUDIO_TOOL_REGISTRY`).
4. `studio/src/lib/` — Drizzle `bun:sqlite` WAL schema, AEAD vault, IndexedDB mirror, and dedicated IndexedDB-only `history.idb.ts` (`chronos_ui_history_v1`, default `5`, max `128`).
5. `studio/src/server/` — Bun HTTP router, auth middleware, `catalog/` theme/blueprint routes, project/lifecycle/entity/AI/env/pipeline routes, sub-ms telemetry ring, and realtime collab hub.
6. `studio/src/mcp/` — Dual-Spine MCP (`stdio`, `/api/mcp`, `/api/mcp/twin`, `/api/mcp/manifest`) with modular `tools/` barrel (`mcp.v011.tools.ts` with `ui_configure_graph` & `ui_set_wire_timescale`) generated 1:1 from `STUDIO_TOOL_REGISTRY`.
7. `studio/src/plugins/` — 6 Input Connectors and 6 Output Adapters (Svelte 5 W3C landmarks, CSS Tokens emitting `--ui-wire-timescale` & `--ui-marquee-speed`, JSON, W3C/WebMCP `static-site-build`, standalone vendored `fullstack-bundle`, PKZIP).
8. `studio/src/workers/` — AST SSG Tome compiler, CLI PAT minter, `25m / 32m / 38m` `qa:timer`, `qa_audit.ts`, sub-3s warm `qa_verify.ts`, and `harness/` batched Playwright runner.
9. `studio/src/client/` — Humble 3-layer Svelte 5 Studio SPA with zero-clip `TOP_LEFT` `TopPerimeterPods` + `ProjectLifecyclePod`, `UiLiveNodeWidget` (`UiEventGraph`), `FieldTomeModal`, and lazy 4-phase `StudioModalStack`.
10. `docs/` — 6 handbook chapters (`01`–`06`), 6 synced `v0.1.2` skills (`docs/skills/`), and sprint logs (`docs/08-sprints/`).

## Quick Commands

- `bun run dev` — Start Bun server + Vite dev bridge on port `3000`.
- `bun run build` — Build AST SSG Tome and code-split production Vite bundle.
- `bun run qa:fast` — Scoped-default inner-loop gate ($\le 3\text{s}$ warm: cached `qa_audit` + incremental `--skipLibCheck` `tsc --noEmit` + `v0102_graph_timescale_marquee.test.ts`).
- `bun run qa:harness` — Scoped-default headless Chromium E2E CLI (`--scenario=latest` @ `1440x900`, inline console capture, `0` screenshots); add `--scenario=all --json` for all 8 scenarios across desktop + mobile.
- `bun run qa:release` — Single pre-signoff full battery across all test suites, uncached `qa_audit`, SSG Tome, package `.d.ts` emit check, and production Vite build.

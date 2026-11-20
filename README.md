# `@chronos-ui/svelte` & AI-Agent UI Builder Studio

Author: `Oblx <code@oblx.dev>` | Package Lock: `@chronos-ui/svelte` (`v0.0.7`)

## Overview

`@chronos-ui/svelte` is a zero-dependency Svelte 5 Runes presentation framework featuring continuous true-stroke SVG vector borders (`UiVectorBorder`) eliminating clipped 45-degree chamfer gaps, concentric circular SVG `A` arc embellishments in `ROUND` mode, runtime configurable `--ui-corner-cut` (`0.25rem` to `1.5rem`), pure-Flex viewport-centered swipe-ready modals (`COMPACT | STANDARD | WIDE | FULL_STAGE`), 14 contour-locked UML/diagram shapes with vertex-normal `DIAGONAL_DRIFT`, an 8-preset phase-locked Svelte 5 transition engine (`motion/`), a hardened 21-state CSS UI Level 4 cursor cascade (`@chronos-ui/svelte/cursor` auto-hydrated to `Cyber Reticle` on boot), RFC 9562 UUID v7 entity telemetry (`UiEntityRegistry` + `UiBentoRadar`), and multimodal input ports (Keyboard, Voice, Xbox & PS5 DualSense). Companion Studio delivers a Tri-Column `Visuals & Motion` Calibration Console (`5x2 | Live Preview | 5x2`), 4-layer `StationBuilderModal`, 11-zone interactive `ZoneEditionModal` with bilateral $X = 50\text{vw}$ mirroring, synced Active Runtime vs Draft AI profile clarity, 33-tool Twin User/Agent Parity, transactional Drizzle SQLite WAL persistence, and Vite static app export.

## 5-Minute Newcomer Setup

1. Install & Run: `bun install && bun run dev` -> open `http://localhost:3000` (zero API keys required; auto-hydrates the 21-state `Cyber Reticle` cursor pack and probes AI Studio Gemini or Harbor `window.ai`).
2. Open `Settings -> Visuals & Motion` to dial `Corner Radius` (`0.25rem–1.5rem`), switch `STRAIGHT | CHAMFER | ROUND` live, and compare 10 left embellishment/animation controls and 10 right motion/kinetic controls around the centered Live Preview Cartridge.
3. Open `Station Builder` or `Zone Edition` (top bar or `Bento Radar -> Edit Zone`) to tune architectural layers, toggle bilateral mirroring across $X = 50\text{vw}$, and relocate entities across all 11 HUD perimeter zones.
4. See `docs/06_quickstart_5min.md` for onboarding and `bun run mcp:stdio` for headless 33-tool MCP integration.

## Architecture Tiers

1. `packages/chronos-ui/` — Pure tree-shakeable Svelte 5 library (`sideEffects: ["*.css"]`, subpath exports across `tokens/`, `motion/`, `cursor/`, `machines/`, `wire/`, `atoms/`, `forms/`, `molecules/`, `organisms/`, `modals/`, `canvas/`, `assistant/`, `input/`).
2. `studio/src/config/` — App constants, starter blueprints, 5 starter samples incl. `sample.matrix.ts` (14 shapes), viewport presets, and SSG Tome module.
3. `studio/src/core/` — Project/node validation, schema-driven local assistant, AI capability probes, HLC/RBAC/SSRF, plus `engine/` (RFC 6902 patcher, sparse prototype inheritance, Governance Gate, declarative 21-state cursor synthesizer, 33-tool `STUDIO_TOOL_REGISTRY`).
4. `studio/src/lib/` — Drizzle `bun:sqlite` WAL schema (`ui_projects` with `corner_radius_rem`, `ui_project_revisions`, `ui_entities`, `cursor_packs`, 21-state `cursor_state_assets`, AI profiles, connectors, exports), AEAD vault, and IndexedDB mirror.
5. `studio/src/server/` — Bun HTTP router, auth middleware, atomic transactional cursor/project/lifecycle/entity/AI/env/pipeline routes, and WebSocket collab hub.
6. `studio/src/mcp/` — Dual-Spine MCP (`stdio`, `/api/mcp`, `/api/mcp/twin`, `/api/mcp/manifest`) generated 1:1 from the 33-tool `STUDIO_TOOL_REGISTRY`.
7. `studio/src/plugins/` — 6 Input Connectors and 5 Output Adapters (emitting `--ui-corner-cut`, 21-state cursor CSS, and Vite `static-site-build`).
8. `studio/src/workers/` — SSG Tome compiler, CLI PAT minter, edge-timed `qa:timer`, and 3-tier incremental QA harness (`qa:fast`, `qa:delta`, `qa:release`).
9. `studio/src/client/` — Humble 3-layer Svelte 5 Studio SPA with Pure-Flex viewport-centered modals, Tri-Column Calibration Console, `StationBuilderModal`, `ZoneEditionModal`, `CursorStudioModal`, and unclipped HUD pods.
10. `docs/08-sprints/` — Sealed evolutionary sprint archive (`v0.0.1` through `v0.0.7`).

## Quick Commands

- `bun install` — Install workspace dependencies.
- `bun run dev` — Start Bun server + Vite dev bridge on port `3000`.
- `bun run build` — Build SSG Tome and production Vite bundle.
- `bun run qa:fast` — Inner-loop gate (`tsc --noEmit` + incremental cached `qa_audit` + scoped `v007` test).
- `bun run qa:delta` — Pre-close gate (`qa_audit --full` + `v007` suite + `svelte-check` + `vite build`).
- `bun run qa:release` — Full release verification across all 9 test suites, static audit, SSG Tome, and production Vite build.

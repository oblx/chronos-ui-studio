# `@chronos-ui/svelte` & AI-Agent UI Builder Studio

Author: `Oblx <code@oblx.dev>` | Package Lock: `@chronos-ui/svelte` (`v0.0.9`)

## Overview

`@chronos-ui/svelte` is a zero-dependency Svelte 5 Runes presentation framework featuring a 3-tier parametric corner-cut hierarchy (`0.5rem` base, `0.75rem` stations/modals, `0.3125rem` compact controls with $\le 28\%$ anti-pinch height clamping), continuous true-stroke SVG vector borders (`UiVectorBorder`), concentric circular SVG `A` arc embellishments in `ROUND` mode, `9` corner ornaments x `6` shape-locked perimeter animations (`pathLength="100"`) across all `14` UML/diagram shapes, pure-Flex viewport-centered swipe-ready modals, an 8-preset Svelte 5 transition engine, a hardened 21-state CSS UI Level 4 cursor cascade, native `<math>` MathML formulas (`UiMathFormula`), RFC 9562 UUID v7 entity telemetry, and multimodal input ports. Companion Studio delivers reactive `CALM | BALANCED | TACTICAL` layout density transitions, reload-persisted workspace & `Build -> Send` assistant lifecycle with click-to-dock dotted grip, a live-preview `StationBuilderModal`, an authentic dual-page open-book AST `FieldTomeModal`, `ZoneEditionModal` with bilateral $X = 50\text{vw}$ mirroring, 35-tool Twin User/Agent Parity with realtime collab event broadcast, lazy code-split modals (`< 350 kB` primary entry chunk), transactional Drizzle SQLite WAL persistence, and Vite static app export.

## 5-Minute Newcomer Setup

1. Install & Run: `bun install && bun run dev` -> open `http://localhost:3000` (zero API keys required; auto-hydrates the 21-state `Cyber Reticle` cursor pack and restores persisted workspace state across reloads).
2. Cycle `CALM | BALANCED | TACTICAL` in the top strip or HUD crown to toggle Calm Empty Stage, Build Palette, and dual tactical edge drawers; click the dotted grip (`⋮⋮`) on the Assistant dock to toggle `FLOATING <-> DOCKED` or drag to reposition.
3. Open `Station Builder` for live real-time architectural preview across all 8 motion presets and live modal hull geometry, or press `F1` to browse the dual-page open-book `Field Tome`.
4. Run `bun run qa:harness --scenario=all --viewports=1440x900,390x844 --json` for zero-screenshot headless Chromium verification, or `bun run mcp:stdio` for headless 35-tool MCP integration.

## Architecture Tiers

1. `packages/chronos-ui/` — Pure tree-shakeable Svelte 5 library (`0` runtime deps, canonical `@chronos-ui/svelte/*` & `@ui/*` aliases, zero `../..` imports, native `<math>` MathML `UiMathFormula`).
2. `studio/src/config/` — App constants, starter blueprints, 5 starter samples (`sample.matrix.ts`, Bio-Lab native MathML `N_0 e^{rt}`), declarative `STUDIO_UI_COPY`, and compiled AST `tome.ssg.ts`.
3. `studio/src/core/` — Project/node validation, schema-driven local assistant, AI capability probes, HLC/RBAC/SSRF, plus `engine/` (RFC 6902 patcher, sparse prototype inheritance, Governance Gate, 21-state cursor synthesizer, 35-tool `STUDIO_TOOL_REGISTRY`).
4. `studio/src/lib/` — Drizzle `bun:sqlite` WAL schema (`ui_projects` with `has_built_once`, `corner_radius_rem` & `studio_defaults_json` + `defaultsVersion: 2` legacy `0.75rem -> 0.5rem` auto-migration), AEAD vault, and IndexedDB mirror.
5. `studio/src/server/` — Bun HTTP router, auth middleware, atomic transactional cursor/project/lifecycle/entity/AI/env/pipeline routes, and realtime collab broadcast hub (`ws.collab.ts`).
6. `studio/src/mcp/` — Dual-Spine MCP (`stdio`, `/api/mcp`, `/api/mcp/twin`, `/api/mcp/manifest`) generated 1:1 from the 35-tool `STUDIO_TOOL_REGISTRY`.
7. `studio/src/plugins/` — 6 Input Connectors and 5 Output Adapters (emitting full 3-tier CSS vars, 21-state cursor CSS, and Vite `static-site-build`).
8. `studio/src/workers/` — AST SSG Tome compiler (`compile_tome_ssg.ts`), CLI PAT minter, `25m / 32m / 38m` `qa:timer`, 3-tier `qa_verify.ts`, and zero-screenshot `qa_harness.ts` (`playwright-cli`).
9. `studio/src/client/` — Humble 3-layer Svelte 5 Studio SPA with `session.persist.ts`, `StationLivePreview`, dual-page `FieldTomeModal`, and lazy dynamic-import `StudioModalStack`.
10. `docs/08-sprints/` — Sealed evolutionary sprint archive (`v0.0.1` through `v0.0.9`).

## Quick Commands

- `bun run dev` — Start Bun server + Vite dev bridge on port `3000`.
- `bun run build` — Build AST SSG Tome and code-split production Vite bundle.
- `bun run qa:fast` — Inner-loop gate (`tsc --noEmit` + incremental cached `qa_audit` + scoped `v009` test).
- `bun run qa:harness` — Zero-screenshot headless Chromium E2E CLI (`--scenario=all --viewports=1440x900,390x844 --json`).
- `bun run qa:release` — Full release verification across all 11 test suites, static audit, SSG Tome, and production Vite build.

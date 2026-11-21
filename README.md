# `@chronos-ui/svelte` & AI-Agent UI Builder Studio

Author: `Oblx <code@oblx.dev>` | Package Lock: `@chronos-ui/svelte` (`v0.0.12`)

## Overview

`@chronos-ui/svelte` is a zero-dependency Svelte 5 Runes presentation framework featuring a 3-tier parametric corner-cut hierarchy (`0.5rem` base, `0.75rem` stations/modals, `0.3125rem` compact controls with $\le 28\%$ anti-pinch height clamping), continuous true-stroke SVG vector borders (`UiVectorBorder`), concentric circular SVG `A` arc embellishments in `ROUND` mode, `9` corner ornaments x `6` shape-locked perimeter animations across all `14` UML/diagram shapes, pure-Flex viewport-centered modals with universal state-preserving Grow/Shrink (`Alt+M`), an ADHD-friendly `CALM_SLOW` global motion token system (`280/440/580/4200ms`, `cubic-bezier(0.16, 1, 0.3, 1)`), a concrete-hex 21-state CSS UI Level 4 cursor cascade, native `<math>` MathML formulas (`UiMathFormula`), `$state.raw` O(1) multi-indexed RFC 9562 UUID v7 entity telemetry, gesture-coalesced stage pan/zoom (`createStagePanZoomCoalescer`), and strict safe-corridor viewport containment. Companion Studio boots unconditionally in Calm Mode with a symmetric `X = 50vw` `Studio HUD` toggle, mirrored chamfered `LEFT_EDGE` / `RIGHT_EDGE` icon mini-rails, flush `BOTTOM_CENTER` `UiAssistantDock`, collision-free CS6 `WireframeSkeletonModal`, a 7-step Spotlight Tour with interactive assistant drill, a 15-node 4-column 2D Virtual DAG `Live Wire Observatory`, live-preview `StationBuilderModal`, dual-page open-book AST `FieldTomeModal`, 42-tool Dual-Spine MCP parity, W3C/WebMCP static exports, and standalone vendored SQLite + Drizzle full-stack bundles.

## 5-Minute Newcomer Setup

1. Install & Run: `bun install && bun run dev` -> open `http://localhost:3000` (zero API keys required; boots unconditionally in Calm Mode with live 21-state concrete-hex `Cyber Reticle` cursor, `CALM_SLOW` motion tokens, and framed bilateral edge mini-rails).
2. Click any icon on the folded left (`Build | Zones | Blueprints | Tour`) or right (`Inspector | Themes | Export`) mini-rail directly from Calm Canvas, or toggle `Studio HUD` / `Calm View` while keeping center-anchored canvas framing ($\Delta x \le 12\text{px}, \Delta y \le 12\text{px}$).
3. Pan/zoom strictly inside the safe-corridor stage (coalesced to 1 wire trace per gesture), open `Live Wire Observatory` to inspect the 15-node interactive 2D DAG graph, or launch `Wireframe Skeleton Workbench` / `Field Tome` (`F1`) and toggle Grow/Shrink (`Alt+M`) on any modal.
4. Open `Settings -> Visuals & Motion` or run `/motion BALANCED` to tune sensory profiles, export W3C/WebMCP static sites or full-stack bundles from `RIGHT_EDGE -> Export`, run `bun run qa:harness --scenario=all --viewports=1440x900,390x844 --json`, or connect via `bun run mcp:stdio` (42 tools).

## Architecture Tiers

1. `packages/chronos-ui/` — Pure tree-shakeable Svelte 5 library (`0` runtime deps, `CALM_SLOW` motion tokens, universal modal Grow/Shrink, 2D Wire DAG Graph, concrete-hex 21-state cursor runtime, `$state.raw` O(1) entity index + `dispatchBatch` broker, safe-corridor stage, zero `../..` imports).
2. `studio/src/config/` — App constants, unified `STUDIO_LEFT_TABS` / `STUDIO_RIGHT_TABS`, 7-step `STUDIO_SPOTLIGHT_STEPS` (Step 4 `hud-assistant-dock` drill), 5 starter samples, declarative `STUDIO_UI_COPY`, and compiled AST `tome.ssg.ts`.
3. `studio/src/core/` — Project/node validation, local assistant (`/motion`, `/reject`, natural language), AI capability probes, HLC/RBAC/SSRF, plus `engine/` (RFC 6902 patcher, Governance Gate, agentic WebMCP manifest generator, 21-state cursor synthesizer, 42-tool `STUDIO_TOOL_REGISTRY`).
4. `studio/src/lib/` — Drizzle `bun:sqlite` WAL schema (`ui_projects` with `has_built_once`, `corner_radius_rem` & `studio_defaults_json`), AEAD vault, and IndexedDB mirror.
5. `studio/src/server/` — Bun HTTP router, auth middleware, transactional cursor/project/lifecycle/entity/AI/env/pipeline routes (`static-site-build`, `fullstack-bundle`, `zip-bundle`), and realtime collab hub.
6. `studio/src/mcp/` — Dual-Spine MCP (`stdio`, `/api/mcp`, `/api/mcp/twin`, `/api/mcp/manifest`) generated 1:1 from the 42-tool `STUDIO_TOOL_REGISTRY` with `GOVERNANCE_LOCKED` guards.
7. `studio/src/plugins/` — 6 Input Connectors and 6 Output Adapters (Svelte 5 W3C landmarks, CSS Tokens, JSON, W3C/WebMCP `static-site-build`, standalone vendored `fullstack-bundle`, PKZIP).
8. `studio/src/workers/` — AST SSG Tome compiler, CLI PAT minter, `25m / 32m / 38m` `qa:timer`, 3-tier `qa_verify.ts`, and zero-screenshot zero-pollution 8-scenario `qa_harness.ts`.
9. `studio/src/client/` — Humble 3-layer Svelte 5 Studio SPA with unconditional Calm boot, mirrored chamfered edge rails, flush `BOTTOM_CENTER` `UiAssistantDock`, CS6 `WireframeSkeletonModal`, 2D DAG `WireTapModal`, `StationLivePreview`, dual-page `FieldTomeModal`, and lazy dynamic-import `StudioModalStack`.
10. `docs/08-sprints/` — Active sprint tracker (`current.md`) and sealed archive (`sprint-10..15` + rotated `archive/sprint-04..09`).

## Quick Commands

- `bun run dev` — Start Bun server + Vite dev bridge on port `3000`.
- `bun run build` — Build AST SSG Tome and code-split production Vite bundle.
- `bun run qa:fast` — Inner-loop gate (`tsc --noEmit` + cached `qa_audit` + scoped `v012` test).
- `bun run qa:harness` — Zero-screenshot zero-pollution headless Chromium E2E CLI (`--scenario=all --viewports=1440x900,390x844 --json`).
- `bun run qa:release` — Full release verification across all 14 test suites, static audit, SSG Tome, and production Vite build.

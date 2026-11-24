# `@chronos-ui/svelte` & AI-Agent UI Builder Studio

Author: `Oblx <code@oblx.dev>` | Package Lock: `@chronos-ui/svelte` (`v0.1.0`, MIT License)

## Overview

`@chronos-ui/svelte` is a zero-dependency Svelte 5 Runes perimeter HUD presentation framework featuring a 3-tier parametric corner-cut hierarchy (`0.5rem` base, `0.75rem` stations/modals, `0.3125rem` compact controls with $\le 28\%$ anti-pinch height clamping), continuous true-stroke SVG vector borders (`UiVectorBorder`), concentric circular SVG `A` arc embellishments in `ROUND` mode, `9` corner ornaments x `6` shape-locked perimeter animations across all `14` UML/diagram shapes, pure-Flex viewport-centered modals with universal state-preserving Grow/Shrink (`Alt+M`), an ADHD-friendly `CALM_SLOW` global motion token system (`280/440/580/4200ms`, `cubic-bezier(0.16, 1, 0.3, 1)`), a concrete-hex 21-state CSS UI Level 4 cursor cascade, native `<math>` MathML formulas (`UiMathFormula`), `$state.raw` O(1) multi-indexed RFC 9562 UUID v7 entity telemetry, gesture-coalesced stage pan/zoom, and all `13` tree-shakeable library subpath exports with verified `.d.ts` declarations. Companion Studio boots unconditionally in Calm Mode with a unified `X = 50vw` reciprocal `Studio HUD` / `Calm View` toggle ($\Delta x \le 16\text{px}, \Delta y \le 8\text{px}$), shared `ProjectLifecyclePod` (`Save` + `Reset` recovery popover across both modes), unambiguous chamfered `LEFT_EDGE` / `RIGHT_EDGE` overlay mini-rails (hairline divider above `⋮⋮` grip, `0px` workspace width shrinkage), flush `BOTTOM_CENTER` `UiAssistantDock`, collision-free CS6 `WireframeSkeletonModal`, a 7-step Spotlight Tour with interactive assistant drill, a 15-node 4-column 2D Virtual DAG `Live Wire Observatory`, live-preview `StationBuilderModal`, dual-page open-book AST `FieldTomeModal`, 42-tool Dual-Spine MCP parity, W3C/WebMCP static exports, and standalone vendored SQLite + Drizzle full-stack bundles.

## 5-Minute Newcomer Setup

1. Install & Run: `bun install && bun run dev` -> open `http://localhost:3000` (zero API keys required; boots unconditionally in Calm Mode with live 21-state concrete-hex `Cyber Reticle` cursor, `CALM_SLOW` motion tokens, and framed bilateral edge mini-rails).
2. Click any icon on the folded left (`Build | Zones | Blueprints | Tour`) or right (`Inspector | Themes | Export`) mini-rail directly from Calm Canvas (drawers open strictly as flush `z-[36]` overlays with `0px` workspace width change), or double-click the centered `Studio HUD` / `Calm View` anchor in place ($\Delta x \le 16\text{px}, \Delta y \le 8\text{px}$).
3. Pan/zoom strictly inside the safe-corridor stage (coalesced to 1 wire trace per gesture), open `Live Wire Observatory` to inspect the 15-node interactive 2D DAG graph, or launch `Wireframe Skeleton Workbench` / `Field Tome` (`F1`) and toggle Grow/Shrink (`Alt+M`) on any modal.
4. Use `bun run qa:fast` and `bun run qa:harness` for `< 8s` scoped delta verification during iteration, reserve `bun run qa:release` / `bun run qa:harness --full-battery --json` for final pre-signoff, or connect via `bun run mcp:stdio` (42 tools).

## Architecture Tiers

1. `packages/chronos-ui/` — Publish-ready zero-dependency Svelte 5 library (`MIT`, standalone `README.md`, `13` subpath barrel exports + `./manifest` + `./styles.css`, `tsconfig.build.json` `.d.ts` emit, `CALM_SLOW` motion tokens, universal modal Grow/Shrink, 2D Wire DAG Graph, 21-state cursor runtime, zero `../..` imports).
2. `studio/src/config/` — App constants, unified `STUDIO_LEFT_TABS` / `STUDIO_RIGHT_TABS`, 7-step `STUDIO_SPOTLIGHT_STEPS`, 5 starter samples, declarative `STUDIO_UI_COPY`, and compiled AST `tome.ssg.ts`.
3. `studio/src/core/` — Project/node validation, local assistant (`/motion`, `/reject`, natural language), AI capability probes, HLC/RBAC/SSRF, plus `engine/` (RFC 6902 patcher, Governance Gate, WebMCP manifest generator, 21-state cursor synthesizer, 42-tool `STUDIO_TOOL_REGISTRY`).
4. `studio/src/lib/` — Drizzle `bun:sqlite` WAL schema (`ui_projects` with `has_built_once`, `corner_radius_rem` & `studio_defaults_json`), AEAD vault, and IndexedDB mirror.
5. `studio/src/server/` — Bun HTTP router, auth middleware, transactional cursor/project/lifecycle/entity/AI/env/pipeline routes (`static-site-build`, `fullstack-bundle`, `zip-bundle`), and realtime collab hub.
6. `studio/src/mcp/` — Dual-Spine MCP (`stdio`, `/api/mcp`, `/api/mcp/twin`, `/api/mcp/manifest`) with modular `tools/` sub-barrel generated 1:1 from the 42-tool `STUDIO_TOOL_REGISTRY`.
7. `studio/src/plugins/` — 6 Input Connectors and 6 Output Adapters (Svelte 5 W3C landmarks, CSS Tokens, JSON, W3C/WebMCP `static-site-build`, standalone vendored `fullstack-bundle`, PKZIP).
8. `studio/src/workers/` — AST SSG Tome compiler, CLI PAT minter, `25m / 32m / 38m` `qa:timer`, scoped-default `qa_verify.ts`, and scoped-default zero-screenshot `qa_harness.ts`.
9. `studio/src/client/` — Humble 3-layer Svelte 5 Studio SPA with unconditional Calm boot, unified `ProjectLifecyclePod`, centered reciprocal `Studio HUD` / `Calm View` toggle, overlay edge rails, flush `BOTTOM_CENTER` `UiAssistantDock`, CS6 `WireframeSkeletonModal`, 2D DAG `WireTapModal`, and lazy `StudioModalStack`.
10. `docs/08-sprints/` — Active sprint tracker (`current.md`) and sealed archive (`sprint-10..16` + rotated `archive/sprint-04..09`).

## Quick Commands

- `bun run dev` — Start Bun server + Vite dev bridge on port `3000`.
- `bun run build` — Build AST SSG Tome and code-split production Vite bundle.
- `bun run qa:fast` — Scoped-default inner-loop gate (`< 8s`: cached `qa_audit` + `tsc --noEmit` + `v0_1_0_release_seal.test.ts`).
- `bun run qa:harness` — Scoped-default `< 8s` headless Chromium E2E CLI (`calm-density @ 1440x900`); add `--full-battery --json` for all 8 scenarios across desktop + mobile.
- `bun run qa:release` — Single pre-signoff full battery across all 15 test suites, uncached `qa_audit`, SSG Tome, package `.d.ts` emit check, and production Vite build.

# `@chronos-ui/svelte` & AI-Agent UI Builder Studio

Author: `Oblx <code@oblx.dev>` | Package Lock: `@chronos-ui/svelte` (`v0.1.0`, MIT License)

## Overview

`@chronos-ui/svelte` is a zero-dependency Svelte 5 Runes perimeter HUD presentation framework featuring a 3-tier parametric corner-cut hierarchy (`0.5rem` base, `0.75rem` stations/modals, `0.3125rem` compact controls with $\le 28\%$ anti-pinch height clamping), continuous true-stroke SVG vector borders (`UiVectorBorder`), concentric circular SVG `A` arc embellishments in `ROUND` mode, `9` corner ornaments x `6` shape-locked perimeter animations across all `14` UML/diagram shapes, a unified configurable `HORIZONTAL | VERTICAL` `OVERLAY_HOVER` fold engine (`createFoldOverlayMachine` + `use:uiFoldGrip`) ensuring $0\text{px}$ workspace displacement across edge drawers and `UiAssistantDock`, bounded multi-paragraph vector tooltips (`UiCyberTooltip`, $0\text{px}$ overflow), pure-Flex viewport-centered modals with universal state-preserving Grow/Shrink (`Alt+M`), `CALM_SLOW` motion tokens, a concrete-hex 21-state CSS UI Level 4 cursor cascade, native `<math>` MathML formulas (`UiMathFormula`), `$state.raw` O(1) RFC 9562 UUID v7 telemetry, and all `13` tree-shakeable library subpath exports with verified `.d.ts` declarations. Companion Studio boots unconditionally in Calm Mode with a unified $X = 50\text{vw}$ reciprocal `Studio HUD` / `Calm View` toggle ($\Delta x \le 16\text{px}, \Delta y \le 8\text{px}$), shared `ProjectLifecyclePod` (`Save` + `Reset`), unambiguous chamfered edge mini-rails, sticky-header `UiAssistantDock` (discrete `[OK]` tool chips + deterministic `Build` / `Send` CTA), collision-free CS6 `WireframeSkeletonModal`, 7-step Spotlight Tour, 15-node 2D Virtual DAG `Live Wire Observatory`, live-preview `StationBuilderModal`, dual-page AST `FieldTomeModal`, 42-tool Dual-Spine MCP parity, and static + vendored SQLite/Drizzle full-stack exports.

## 5-Minute Newcomer Setup

1. Install & Run: `bun install && bun run dev` -> open `http://localhost:3000` (zero API keys required; boots unconditionally in Calm Mode with live 21-state concrete-hex `Cyber Reticle` cursor, `CALM_SLOW` motion tokens, and framed bilateral edge mini-rails).
2. Click any icon on the folded left (`Build | Zones | Blueprints | Tour`) or right (`Inspector | Themes | Export`) mini-rail, or unfold `UiAssistantDock` directly from Calm Canvas — all three fold overlays hover cleanly (`z-[36]` / `z-[38]`) with `0px` workspace width or height displacement.
3. Double-click the centered `Studio HUD` / `Calm View` anchor in place ($\Delta x \le 16\text{px}, \Delta y \le 8\text{px}$), hover starter chips for bounded multi-paragraph tooltips, or open `Wireframe Skeleton Workbench`, `Live Wire Observatory`, or `Field Tome` (`F1`, `Alt+M` Grow/Shrink).
4. Use `bun run qa:fast` ($\le 2.5\text{s}$ warm incremental check) and `bun run qa:harness --json` (scoped `--scenario=latest`, inline console capture) during development; reserve `bun run qa:release` / `bun run qa:harness --scenario=all --json` for final pre-signoff.

## Architecture Tiers (All Directories `< 10` Files, `100%` Barrelled)

1. `packages/chronos-ui/` — Publish-ready zero-dependency Svelte 5 library (`MIT`, `16` exports, `tokens/geometry/`, `wire/core/`, `machines/fold.overlay.svelte.ts`, `organisms/{overlays,wire-observatory}/`, `tsconfig.build.json` `.d.ts` emit, zero `../..` imports).
2. `studio/src/config/` — App constants, unified `STUDIO_LEFT_TABS` / `STUDIO_RIGHT_TABS`, 7-step `STUDIO_SPOTLIGHT_STEPS`, 5 starter samples with multi-paragraph tooltips, `STUDIO_UI_COPY`, and compiled AST `tome.ssg.ts`.
3. `studio/src/core/` — Schemas, codegen, HLC/RBAC/SSRF, `assistant/` (local/provider AI planners & env probe), and `engine/` (RFC 6902 patcher, Governance Gate, WebMCP manifest, 21-state cursor synthesizer, 42-tool `STUDIO_TOOL_REGISTRY`).
4. `studio/src/lib/` — Drizzle `bun:sqlite` WAL schema (`ui_projects` with `has_built_once`, `corner_radius_rem` & `studio_defaults_json`), AEAD vault, and IndexedDB mirror.
5. `studio/src/server/` — Bun HTTP router, auth middleware, transactional cursor/project/lifecycle/entity/AI/env/pipeline routes, and realtime collab hub.
6. `studio/src/mcp/` — Dual-Spine MCP (`stdio`, `/api/mcp`, `/api/mcp/twin`, `/api/mcp/manifest`) with modular `tools/` barrel generated 1:1 from `STUDIO_TOOL_REGISTRY`.
7. `studio/src/plugins/` — 6 Input Connectors and 6 Output Adapters (Svelte 5 W3C landmarks, CSS Tokens, JSON, W3C/WebMCP `static-site-build`, standalone vendored `fullstack-bundle`, PKZIP).
8. `studio/src/workers/` — AST SSG Tome compiler, CLI PAT minter, `25m / 32m / 38m` `qa:timer`, `DOCS_AND_SKILL_FRESHNESS` `qa_audit.ts`, sub-2.5s warm `qa_verify.ts`, and batched-console `qa_harness.ts`.
9. `studio/src/client/` — Humble 3-layer Svelte 5 Studio SPA with `panels/perimeter/`, `state/{handlers,lifecycle}/`, `canvas/` (`ProjectLifecyclePod`, `CalmTopStrip`), and lazy `StudioModalStack`.
10. `docs/` — 6 handbook chapters (`01`–`06`), 5 synced `v0.1.0` domain skills (`docs/skills/`), and sprint logs (`docs/08-sprints/`).

## Quick Commands

- `bun run dev` — Start Bun server + Vite dev bridge on port `3000`.
- `bun run build` — Build AST SSG Tome and code-split production Vite bundle.
- `bun run qa:fast` — Scoped-default inner-loop gate ($\le 2.5\text{s}$ warm: cached `qa_audit` + incremental `tsc --noEmit` + `v0100_public_release.test.ts`).
- `bun run qa:harness` — Scoped-default headless Chromium E2E CLI (`--scenario=latest` @ `1440x900`, inline console capture, `0` screenshots); add `--scenario=all --json` for all 8 scenarios across desktop + mobile.
- `bun run qa:release` — Single pre-signoff full battery across all 15 test suites, uncached `qa_audit`, SSG Tome, package `.d.ts` emit check, and production Vite build.

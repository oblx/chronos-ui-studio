# `@chronos-ui/svelte` & AI-Agent UI Builder Studio

Author: `Oblx <code@oblx.dev>` | Package Lock: `@chronos-ui/svelte` (`v0.1.1`, MIT License)

## Overview

`@chronos-ui/svelte` is a zero-dependency Svelte 5 Runes perimeter HUD presentation framework featuring a 3-tier parametric corner-cut hierarchy (`0.5rem` base, `0.75rem` stations/modals, `0.3125rem` compact controls with $\le 28\%$ anti-pinch height clamping), continuous true-stroke SVG vector borders (`UiVectorBorder`), concentric circular SVG `A` arc embellishments in `ROUND` mode, `9` corner ornaments x `6` shape-locked perimeter animations across all `14` UML/diagram shapes, a unified configurable `HORIZONTAL | VERTICAL` `OVERLAY_HOVER` fold engine (`createFoldOverlayMachine` + `use:uiFoldGrip`) ensuring $0\text{px}$ workspace displacement across edge drawers and `UiAssistantDock`, universal thin theme-bound scrollbars + `.ui-ctl` interactive state matrix (`controlConfig`), bounded multi-paragraph priority `infoLevel (0–100)` tooltips (`UiCyberTooltip`), 4-phase event-driven modals (`CLOSED -> OPENING -> OPEN -> CLOSING -> CLOSED`) with state-preserving Grow/Shrink (`Alt+M`), 250ms ASC sequential HUD boot choreography (`createHudBootChoreographer`), `CALM_SLOW` motion tokens, 21 bespoke `32x32` concrete-hex CSS UI Level 4 cursor silhouettes, native `<math>` MathML formulas (`UiMathFormula`), `$state.raw` O(1) RFC 9562 UUID v7 telemetry, and all `13` tree-shakeable library subpath exports with verified `.d.ts` declarations. Companion Studio boots unconditionally in Calm Mode with a unified $X = 50\text{vw}$ reciprocal `Studio HUD` / `Calm View` toggle ($\Delta x \le 16\text{px}, \Delta y \le 8\text{px}$), shared `ProjectLifecyclePod` (`Undo`/`Redo` backed by IndexedDB `default: 5`, `max: 128` + `Save` + `Reset`), real-action `Workbench`/`Tokens`/`Decks`/`Twin MCP` tabs, `48`-tool Dual-Spine MCP parity, and static + vendored SQLite/Drizzle full-stack exports.

## 5-Minute Newcomer Setup

1. Install & Run: `bun install && bun run dev` -> open `http://localhost:3000` (zero API keys required; boots unconditionally in Calm Mode with bespoke 21-state concrete-hex `Cyber Reticle` cursors, thin themed scrollbars, `CALM_SLOW` motion tokens, and permanent Undo/Redo controls).
2. Click any icon on the folded left (`Build | Zones | Blueprints | Tour`) or right (`Inspector | Themes | Export`) mini-rail, or unfold `UiAssistantDock` directly from Calm Canvas — all three fold overlays hover cleanly (`z-[36]` / `z-[38]`) with `0px` workspace width or height displacement.
3. Click `Studio HUD` to experience the 250ms ASC sequential perimeter reveal (replayable anytime from Settings), switch between `Workbench`, `Tokens`, `Decks`, and `Twin MCP`, or calibrate tooltip `infoLevel (0–100)`, button/form `controlConfig`, and IndexedDB history depth (`1..128`).
4. Use `bun run qa:fast` ($\le 3\text{s}$ warm incremental check) and `bun run qa:harness --json` (scoped `--scenario=latest`, inline console capture) during development; reserve `bun run qa:release` / `bun run qa:harness --scenario=all --json` for final pre-signoff.

## Architecture Tiers (All Directories `< 10` Files, `100%` Barrelled)

1. `packages/chronos-ui/` — Publish-ready zero-dependency Svelte 5 library (`MIT`, `16` exports, `tokens/geometry/`, `wire/core/`, `machines/overlays/`, `atoms/controls/`, `molecules/overlays/`, `organisms/{overlays,wire-observatory}/`, `cursor/cursor.silhouettes.ts`, `motion/hud.sequence.svelte.ts`, `tsconfig.build.json` `.d.ts` emit).
2. `studio/src/config/` — App constants, unified `STUDIO_LEFT_TABS` / `STUDIO_RIGHT_TABS`, 7-step `STUDIO_SPOTLIGHT_STEPS`, 5 starter samples, `STUDIO_UI_COPY`, and compiled AST `tome.ssg.ts`.
3. `studio/src/core/` — Schemas, codegen, HLC/RBAC/SSRF, `assistant/` (local/provider AI planners & env probe), and `engine/` (`tools/`, RFC 6902 patcher, Governance Gate, silhouette-aware cursor synthesizer, 48-tool `STUDIO_TOOL_REGISTRY`).
4. `studio/src/lib/` — Drizzle `bun:sqlite` WAL schema, AEAD vault, IndexedDB mirror, and dedicated IndexedDB-only `history.idb.ts` (`chronos_ui_history_v1`, default `5`, max `128`).
5. `studio/src/server/` — Bun HTTP router, auth middleware, `catalog/` theme/blueprint routes, project/lifecycle/entity/AI/env/pipeline routes, and realtime collab hub.
6. `studio/src/mcp/` — Dual-Spine MCP (`stdio`, `/api/mcp`, `/api/mcp/twin`, `/api/mcp/manifest`) with modular `tools/` barrel (`mcp.v011.tools.ts`) generated 1:1 from `STUDIO_TOOL_REGISTRY`.
7. `studio/src/plugins/` — 6 Input Connectors and 6 Output Adapters (Svelte 5 W3C landmarks, CSS Tokens, JSON, W3C/WebMCP `static-site-build`, standalone vendored `fullstack-bundle`, PKZIP).
8. `studio/src/workers/` — AST SSG Tome compiler, CLI PAT minter, `25m / 32m / 38m` `qa:timer`, `qa_audit.ts`, sub-3s warm `qa_verify.ts`, and `harness/` batched Playwright runner.
9. `studio/src/client/` — Humble 3-layer Svelte 5 Studio SPA with `panels/perimeter/`, `state/{handlers,lifecycle}/`, `canvas/chrome/` (`ProjectLifecyclePod`, `CalmTopStrip`), and lazy 4-phase `StudioModalStack`.
10. `docs/` — 6 handbook chapters (`01`–`06`), 6 synced `v0.1.1` skills (`docs/skills/`), and sprint logs (`docs/08-sprints/`).

## Quick Commands

- `bun run dev` — Start Bun server + Vite dev bridge on port `3000`.
- `bun run build` — Build AST SSG Tome and code-split production Vite bundle.
- `bun run qa:fast` — Scoped-default inner-loop gate ($\le 3\text{s}$ warm: cached `qa_audit` + incremental `--skipLibCheck` `tsc --noEmit` + `v0101_motion_cursors_history.test.ts`).
- `bun run qa:harness` — Scoped-default headless Chromium E2E CLI (`--scenario=latest` @ `1440x900`, inline console capture, `0` screenshots); add `--scenario=all --json` for all 8 scenarios across desktop + mobile.
- `bun run qa:release` — Single pre-signoff full battery across all 16 test suites, uncached `qa_audit`, SSG Tome, package `.d.ts` emit check, and production Vite build.

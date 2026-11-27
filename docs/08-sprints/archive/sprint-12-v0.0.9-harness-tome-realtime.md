# Sprint 12 — `v0.0.9` Zero-Screenshot `qa:harness`, Reactive Density, Dual-Page Field Tome & Lazy Modal Split

Author: `Oblx <code@oblx.dev>` | Release Target: `@chronos-ui/svelte` (`VERSION = "0.0.9"`)

## Bounded-Context Lineage (`v0.0.1` – `v0.0.9`)

1. `v0.0.1` – `v0.0.4`: Zero-dep Svelte 5 Runes library, Drizzle WAL/IDB mirror, Dual-Spine MCP, Calm Empty-Stage Genesis, RFC 6902 patcher, Governance Gate, Voice/Gamepad ports, 8-preset Svelte 5 motion engine, and live `UiInteractiveCanvasStage`.
2. `v0.0.5` – `v0.0.8`: RFC 9562 UUID v7 `UiEntityRegistry`, 14 true-contour UML/diagram shapes, 21-state CSS UI Level 4 cursor studio, continuous `UiVectorBorder`, Pure-Flex modals, 3-tier parametric corner cuts (`0.5 / 0.75 / 0.3125rem` with $\le 28\%$ anti-pinch clamp), `5x3` shape-locked perimeter animations (`pathLength="100"`), persistent `studioDefaults`, 35-tool MCP parity, and zero `../..` canonical aliases.
3. `v0.0.9` (Sprint 12): Zero-screenshot reusable `qa:harness` CLI, `25m / 32m / 38m` clock guard, reactive `CALM | BALANCED | TACTICAL` density transitions, persisted `Build -> Send` assistant lifecycle + click-to-dock dotted grip, persistent Live-Preview `StationBuilderModal`, true dual-page open-book AST `FieldTomeModal`, native MathML Bio-Lab formula, and Vite lazy modal code-splitting (`< 350 kB` primary entry chunk).

## Deliverables & Verification Criteria

- **25m Clock Guard & Zero-Screenshot `qa:harness`**: Re-calibrated `qa_timer.ts` (`SOFT_TARGET_MIN = 25`, `FREEZE_SCOPE_MIN = 32`, `HARD_STOP_MIN = 38`, `formatClockBanner()`), plus `studio/src/workers/qa_harness.ts` (`bun run qa:harness`) driving pre-installed `playwright-cli` (`open --browser=chromium`, `resize`, `run-code`, `console`, guaranteed `close`) across `calm-density`, `assistant-dock`, `station-preview`, `field-tome`, `persistence`, and `responsive` with `0` PNG screenshots by default.
- **Reactive Density, Build -> Send & Click-to-Dock Grip**: `UI_SET_LAYOUT_DENSITY` mutates HUD chrome, build palette, edge drawers, and safe corridors; `hasBuiltOnce` persists across Drizzle `ui_projects.has_built_once` and `session.persist.ts`; clicking `assistant-drag-grip` dispatches `UI_ASSISTANT_TOGGLE_FLOAT` (`DOCKED <-> FLOATING`); realtime events broadcast via `/api/ws/collab`.
- **Live-Preview Station Builder & Legacy `0.75rem` Auto-Migration**: `StationLivePreview.svelte` remains mounted across all 4 tabs, all 8 `MOTION_PRESETS` are exposed, `StationBuilderModal` self-applies live geometry to its `UiModalShell`, and `migrateLegacyStudioDefaults` (`STUDIO_DEFAULTS_VERSION = 2`) upgrades legacy `0.75rem` rows to `0.5rem`.
- **Dual-Page Open-Book Field Tome & Lazy Modals**: `compile_tome_ssg.ts` emits typed AST blocks/tokens + balanced folios (`0` raw backticks, `0` duplicated intro), `FieldTomeModal.svelte` renders dual-page book with keyboard/swipe pagination and zero `Test 3s Zero-CLS Lock`, `UiMathFormula.svelte` renders native `<math>` MathML (`N_0 e^{rt}`), and `StudioModalStack.svelte` lazy-imports all 9 modals via Svelte 5 `{#await import(...)}` alongside Vite `manualChunks`.

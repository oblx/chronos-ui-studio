# Sprint 14 Record — `@chronos-ui/svelte` `v0.0.11` (Pre-0.1.0 Stabilization Seal)

Author: `Oblx <code@oblx.dev>` | Release Lock: `0.0.11` | Status: `SEALED (superseded by v0.0.12)`

## Bounded-Context Lineage (`v0.0.1` – `v0.0.10`)

- `v0.0.1` – `v0.0.6`: Zero-dep Svelte 5 presentation library (`packages/chronos-ui/`), Drizzle WAL + IDB mirror, Dual-Spine MCP, RFC 6902 patcher, 14 contour-locked UML shapes, RFC 9562 UUID v7 entities, and 21-state CSS Cursor Studio.
- `v0.0.7` – `v0.0.9`: True-stroke SVG borders (`UiVectorBorder`), concentric `ROUND` arcs, 3-tier parametric corner cuts (`0.5 / 0.75 / 0.3125rem`, $\le 28\%$ anti-pinch clamp), `25m / 32m / 38m` `qa:timer`, zero-screenshot `qa:harness`, dual-page AST `FieldTomeModal`, and lazy modal code-splitting.
- `v0.0.10`: `$state.raw` O(1) multi-indexed `UiEntityRegistry`, microtask-coalesced `dispatchBatch` (`11.01ms` for 1,000 entities + 500 intents), 5-panel CS6 `WireframeSkeletonModal`, 7-step Spotlight Tour, W3C/WebMCP static exports, and vendored full-stack SQLite + Drizzle bundle.

## S0 / S1 / S2 Defect Eradication (`v0.0.11`)

1. **Minimal Calm Default Launch**: Fresh boot and `Reset -> Default View` open with `studioChromeVisible === false`, both drawers closed, `0` staged nodes, and $\le 5$ top-right controls (`Studio HUD`, `Wireframe`, `Polarity`, `Settings`, `Help`).
2. **Unified Edge-Rail Architecture (Zero Panel Overlap)**: Persistent folded `3rem` `LEFT_EDGE` (`build | zones | blueprints | tour`) and `RIGHT_EDGE` (`inspector | themes | export`) icon rails mount in both Calm and Studio HUD modes. Floating `StudioToolPalettePanel` and `NodeInspectorFloat` overlays are retired into edge tabs; clicking any canvas node opens `RIGHT_EDGE -> Inspector`.
3. **Retired `TOP_CENTER` Density Switcher & Unclipped Scroll**: Removed the redundant `BALANCED | TACTICAL` button from `TOP_CENTER` (kept `UI_SET_LAYOUT_DENSITY` as internal/MCP alias), freeing $\ge 100\text{px}$ so `Twin MCP` never truncates while locking reciprocal `Studio HUD <-> Calm View` alignment ($\Delta x \le 24\text{px}, \Delta y \le 12\text{px}$). Fixed `RIGHT_EDGE` flex scroll + bottom padding (`pb-5`) so the final WCAG Contrast Audit row never clips.
4. **Strict Safe-Corridor Containment & Atomic Reject All**: Bounded `UiInteractiveCanvasStage` (Layer B) and `StagingBuildLayer` (Layer C) inside `--ui-safe-top/bottom/left/right` (`overflow-y: auto; contain: layout style`) with dock clearance (`5.25rem` Calm / `12.75rem` HUD), sticky staging header (`[ Commit All ]` + `[ Reject All ]`), duplicate-spawn guard, and relative-contained canvas `UiBentoRadar`.
5. **Concrete-Hex 21-State Root/Body Cursor Engine**: `resolveThemeCursorPalette()` + `buildCursorPackCss()` emit zero `var(--...)` inside `data:image/svg+xml,` URIs, concrete `%23rrggbb` colors, explicit `xmlns` & `32x32` dimensions, full viewport coverage (`html, body, #app`), all 21 `.cursor-*` overrides, and live re-emit on theme/polarity switch.
6. **40-Tool MCP Parity & Zero-Pollution `qa:harness`**: Added `ui_reject_all_staged` (`UI_REJECT_ALL_STAGED`, `/reject`) bringing `STUDIO_TOOL_REGISTRY` to `40` tools, and wrapped `qa:harness` in deterministic `finally` cleanup (`POST /api/projects/proj-genesis/clean` + `localStorage.clear()`).

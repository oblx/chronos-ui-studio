# Sprint 18 — `v0.1.2` Frameless Cursors, Hover-Marquee, Reusable `UiEventGraph` & Human Time-Scale

Author: `Oblx <code@oblx.dev>` | Target: `@chronos-ui/svelte` & Companion Builder Studio (`VERSION = "0.1.2"`)

## Objectives Sealed

1. **Tip-Clean Frameless 21-State Cursors**: Removed stray top-left tip pixels and all decorative corner brackets from the 17 non-drag cursor states across all 4 built-in packs; gated optional drag-target corner brackets (`data-drag-target-frame="true"`) strictly to `grab | grabbing | copy | alias` via `cursorDragTargetFrames` (`CursorStudioModal` + `Settings`).
2. **Zero-Clip `TOP_LEFT` Studio HUD**: Moved `v0.1.2` onto Row 1 beside `Chronos UI Studio` inside `TopPerimeterPods.svelte` and balanced `Undo | Redo | Save | Reset` inside `ProjectLifecyclePod.svelte` with `min-w-0 flex-1` (`0px` slicing).
3. **Pure-CSS Hover-Marquee Overflow Guard (`UiOverflowText`)**: Added `@keyframes ui-marquee-pingpong` and `UiOverflowText.svelte` across `UiChamferButton`, `UiBadge`, `FieldTomeModal` TOC, `WireframeRightStack`, and `UiEventGraph` labels, honoring `marqueeSpeedPxPerSec`, `marqueePauseRatio`, and reduced-motion static collapse.
4. **Reusable `UiEventGraph` Organism (`@chronos-ui/svelte/graph`)**: Extracted a standalone multi-lane SVG graph organism with `LANE_HEADER_BAND_PX + LANE_HEADER_PAD_PX` clearance (`0` header overlaps), all `14` `UI_FRAME_SHAPES`, `BEZIER | ORTHOGONAL | STEP` edge routing, live canvas spawn via `COMPONENT_CATALOG` + local assistant, and direct adoption by `UiWireDagGraph` / `UiWireInspector`.
5. **Microsecond Telemetry & Human Time-Scale Engine**: Preserved 3-decimal `performance.now()` timings (`realDurationMs`, `observedAtMs`) formatted via `formatSubMsDuration` (`< 0.01ms`, never `0.0ms`), driving monotonic `LINEAR | LOGARITHMIC` slow-motion packets (`100x..25000x`, default `2500x`) with live `UiWireInspector` + `Settings` controls.
6. **Real-Number Knobs & 50-Tool MCP Parity**: Consolidated `STUDIO_KNOB_DEFAULTS` in `studioDefaults` (`STUDIO_DEFAULTS_VERSION = 3`, Drizzle SQLite + CSS token export) and added `ui_configure_graph` + `ui_set_wire_timescale` for `50`-tool Dual-Spine MCP parity.

## Verification Gates

- Stage 1 Static Audit (`qa_audit.ts`): `0` violations, max folder `<= 8/10`, `14` subpaths + `6` skills at `v0.1.2`.
- Stage 2 Full Test Battery (`bun test`): all legacy + release suites including `v0102_graph_timescale_marquee.test.ts`.
- Stage 3 Build & Type Check: package `.d.ts` emit, SSG Tome, production Vite bundle, `compile_applet` + `lint_applet`.
- Stage 4 Headless Browser Harness (`qa:harness --scenario=latest --json`): `0` console/page errors, `screenshotsTaken: 0`, `cleanTeardown: true`.

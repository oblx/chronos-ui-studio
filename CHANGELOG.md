# Changelog — `@chronos-ui/svelte` & Companion Builder Studio

All notable releases follow Semantic Versioning (`0.1.0` marks the first public minor release).

## `0.1.3` — Unified Shortcut Registry & `Ctrl/Cmd+K` Global Search, SVG-Native 5-State Cornered Controls, True-Ratio Time-Scale & Main-Chunk Slimming

- **Unified Declarative Shortcut Registry & `Ctrl/Cmd+K` Global Search Palette**: Consolidated all keyboard bindings into `CANONICAL_SHORTCUTS` (`13` bindings, `0` collisions, `origin: 'KEYBOARD_SHORTCUT'`, editable-input guard `allowInInput`, localized `formatShortcutBadge`); bound `Ctrl/Cmd+K` to lazy-loaded `GlobalSearchModal.svelte` (`6` searchable categories) and `Ctrl/Cmd+Shift+H` to `Studio HUD`; added collision-checked `UI_REBIND_SHORTCUT` overrides in `Settings -> Input & Modality` plus `ui_list_shortcuts` and `ui_open_global_search` (`52` MCP tools).
- **SVG-Native 5-State Interactive Controls (`UiVectorBorder.svelte` & `styles.css`)**: Eliminated rectangular CSS `border`, `outline`, and rectangular `box-shadow` rings from cornered `.ui-ctl` hosts (`NO_RECTANGULAR_BORDER_ON_CORNERED_CTL` static audit rule); all 5 interactive states (`inactive`, `hover`, `active`, `focus-visible`, `disabled`) render inside parametric SVG `<path data-ui-contour-path="true">` and `<path data-ui-focus-halo="true">`.
- **True-Ratio Human Time-Scale Calibration (`timescale.math.ts` & `UiWireDagGraph.svelte`)**: Restored true linear scaling (`clamp(realDurationMs * multiplier, minVisibleMs, maxTravelMs)`, `4.0x` travel ratio from `2500x -> 10000x` at `0.15ms`), widened `LOGARITHMIC` curve separation (`>= 1.6x`), and excluded meta slider/boot intents from diluting live packet hop durations.
- **Main Entry Bundle Slimming (`< 175 kB`), Sub-Archive Hygiene & Atomic `qa:timer`**: Lazy-chunked `UiEventGraph` in `UiLiveNodeWidget.svelte`, split `chronos-graph` and `studio-engine` in `vite.config.ts`, rotated `v0.0.x` sprint logs and legacy tests so `0` folders reach `9–10` files, added atomic `qa:timer -- sprint --fresh`, and verified 3 viewports (`1440x900,1280x800,390x844`) in `qa:harness`.

## `0.1.2` — Frameless 21-State Cursors, Pure-CSS Hover-Marquee, Reusable `UiEventGraph` & Human Time-Scale Engine

- **Tip-Clean Frameless 21-State Cursors**: Removed stray top-left tip geometry and all decorative corner brackets from the 17 non-drag cursor states across all 4 built-in packs; gated optional corner-bracket targets strictly to `grab | grabbing | copy | alias` via `cursorDragTargetFrames`.
- **Zero-Clip `TOP_LEFT` Studio HUD & Pure-CSS Hover-Marquee (`UiOverflowText`)**: Moved `v0.1.2` onto Row 1 beside `Chronos UI Studio`, balanced `Undo | Redo | Save | Reset` inside `ProjectLifecyclePod` (`0px` slicing), and added pure-CSS `@keyframes ui-marquee-pingpong` overflow guarding (`UiOverflowText`) across `UiChamferButton`, `UiBadge`, `FieldTomeModal` TOC, `WireframeRightStack`, and `UiEventGraph` labels.
- **Reusable Event-Driven `UiEventGraph` Organism (`@chronos-ui/svelte/graph`)**: Built standalone `UiEventGraph` with guaranteed `LANE_HEADER_BAND_PX + LANE_HEADER_PAD_PX` clearance (`0` header-to-node overlaps), all `14` `UI_FRAME_SHAPES`, `BEZIER | ORTHOGONAL | STEP` routing, and live canvas spawn/registration via `COMPONENT_CATALOG` and local assistant (`"add a live event graph with hexagon nodes"`).
- **Microsecond Telemetry & Human Time-Scale Engine (`timescale.math.ts`)**: Upgraded `wire.pipeline.ts` and `server.telemetry.ts` to 3-decimal `performance.now()` timings formatted truthfully via `formatSubMsDuration` (`< 0.01ms`, never `0.0ms`), driving monotonic `LINEAR | LOGARITHMIC` slow-motion signal packets (`100x..25000x`, default `2500x`) with live controls in `UiWireInspector` and `Settings`.
- **Real-Number Knobs & 50-Tool MCP Parity**: Added `STUDIO_KNOB_DEFAULTS`, persisted all 7 new knobs in `studioDefaults` (Drizzle SQLite + CSS token export), and added `ui_configure_graph` + `ui_set_wire_timescale` for `50`-tool Dual-Spine MCP parity.

## `0.1.1` — Bespoke 21-State Cursors, Motion Choreography, IDB History & Control Matrix

- **Bespoke 21-State CSS Cursor Silhouettes**: Replaced recycled arrow+badge stamps with 21 distinct `32x32` architectural SVG silhouettes and calibrated hotspots across all 4 built-in packs and `cursor.synthesizer.ts`.
- **Universal Thin Themed Scrollbars & `.ui-ctl` State Matrix**: Added theme-bound thin scrollbars, explicit `inactive/hover/active/focus-visible/disabled` progressions, and persisted `controlConfig` (`buttonConfig`, `formConfig`) via Settings and `ui_configure_controls`.
- **IndexedDB-Only Undo/Redo (`default: 5`, `max: 128`)**: Added permanent disabled-aware `[ Undo ]` / `[ Redo ]` triggers to `ProjectLifecyclePod`, dedicated `chronos_ui_history_v1` IndexedDB store, `Ctrl+Y` redo shortcut, Settings limit slider, and `ui_undo`/`ui_redo`/`ui_set_history_limit`.
- **4-Phase Event-Driven Modal Lifecycle & 250ms ASC HUD Boot**: Upgraded `UiModalShell` + `createModalMachine` to `CLOSED -> OPENING -> OPEN -> CLOSING -> CLOSED` (`UI_MODAL_OPENED`/`UI_MODAL_CLOSED`), added lazy-mounted 9-zone ASC `createHudBootChoreographer`, Settings `[ Replay HUD Boot Sequence ]`, and `ui_replay_hud_sequence`.
- **Priority `infoLevel (0–100)` Tooltips & 100% Real-Action Intents**: Added configurable `tooltipInfoLevel` filtering (`Silent`..`Verbose`), wired live `Workbench`/`Tokens`/`Decks`/`Twin MCP` (`/api/mcp/manifest` + `SERVER_MANIFEST_SYNCED`) intents, expanded Dual-Spine MCP to `48` parity tools, decongested all 7 near-cap folders (`<= 8` files), and accelerated `qa:fast` with `--skipLibCheck`.

## `0.1.0` — First Public Minor Release

- **Scoped-Default QA Engine**: Switched `qa:fast`, default `verify`, and default `qa:harness` CLI runs to execute only the latest scoped delta (`< 8s`), reserving `--full-battery` / `qa:release` for a single pre-signoff full pass across all suites and viewports.
- **Reciprocal Toggle Constancy**: Centered `Calm View` at $X = 50\text{vw}$ inside a symmetric 3-column `TOP_CENTER` grid so `Studio HUD` and `Calm View` share the exact same desktop coordinate anchor ($\Delta x \le 16\text{px}, \Delta y \le 8\text{px}$) with zero `Twin MCP` clipping.
- **Unified `ProjectLifecyclePod`**: Replaced duplicated top-left recovery markup across `CalmTopStrip` and `TopPerimeterPods` with one shared `ProjectLifecyclePod` providing identical `Save` + `Reset` (`Default View` / `Clean Workspace`) controls in both modes.
- **Unambiguous Edge Rails**: Removed redundant trailing layers icon beneath the `⋮⋮` grip on `LEFT_EDGE` and `RIGHT_EDGE` mini-rails and added a hairline divider separating panel tabs from the float/reposition grip.
- **Complete Subpath Exports & Folder Hygiene**: Exported all 13 `@chronos-ui/svelte` library barrels plus `.`, `./manifest`, and `./styles.css`; partitioned `studio/src/mcp/tools/` and `studio/src/tests/{legacy,releases}/` well below the 10-file directory cap.
- **Public Packaging Seal**: Added root and package MIT `LICENSE`, standalone `packages/chronos-ui/README.md`, `CHANGELOG.md`, `.d.ts` declaration build verification, and an automated external-consumer import smoke test across all subpath exports.

## `0.0.1` – `0.0.12` — Pre-0.1.0 Architecture & Perimeter HUD Foundation

- Established zero-dependency Svelte 5 Runes perimeter HUD, 3-tier parametric chamfer/round vector borders, 14 frame shapes, CS6 Wireframe Workbench, `$state.raw` O(1) entity index, AST SSG Field Tome, Dual-Spine MCP parity, and `25m/32m/38m` `qa:timer`.

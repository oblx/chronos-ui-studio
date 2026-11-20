# Active Sprint Tracker (`v0.0.7` — `current.md`)

Author: `Oblx <code@oblx.dev>` | Release Lock: `@chronos-ui/svelte` (`v0.0.7`)
Archive Spec: `docs/08-sprints/sprint-10-v0.0.7-geometry-cursor-stations.md`

## Hard Invariants (Zero Tolerance)

1. Tabs (`\t`) only; function $\le 42\text{ LoC}$; code $\le 150\text{ LoC}$; docs $\le 100\text{ LoC}$ (zero fenced code blocks).
2. Folders $\le 10$ files; 100% barrelled (`index.ts`); `0` runtime deps in `packages/chronos-ui/`.
3. `0` hardcoded literals/numerals/colors; `0` Unicode emojis; humble `.svelte` views; strict acyclic event DAG.
4. Verification cadence: `qa:timer`, `qa:fast` inner loop, `qa:delta`, `qa:release`, plus headless Chromium E2E (`1440x900` & `390x844`).

## Original v0.0.7 Spec Checklist

- **S0 — Core Geometry, Borders, Modals & 21-State Cursors**:
	- `UiVectorBorder` continuous SVG `<path vector-effect="non-scaling-stroke">` on `UiChamferButton`, `UiChamferFrame`, `UiBadge`, `UiInput`, `UiSelect`, `UiToastStack`, `UiModalHeader` (zero `clip-path` + CSS `border` slicing).
	- Concentric `ROUND` embellishments via `buildCurvedCornerEmbellishment` (`A` arc paths, radial `TICKS`, 45-degree arc midpoint `DOTS`, radial `DIAGONAL_DRIFT`).
	- Configurable `cornerRadiusRem` (`0.25rem`–`1.5rem`, step `0.0625rem`, default `0.75rem`) across `UiWireBroker`, `--ui-corner-cut`, per-node/per-zone overrides, Drizzle, static export, and MCP.
	- Pure-Flex viewport-centered `UiModalShell` (`fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6`, declarative `COMPACT | STANDARD | WIDE | FULL_STAGE` tiers, zero JS `ResizeObserver` height tweening).
	- Hardened 21-state CSS UI Level 4 cursor engine (`encodeSvgCursorDataUrl` with `32x32` viewBox & `%23` encoding, `!important` cascade across backdrops/grips/pan/disabled, auto-hydrated `Cyber Reticle` on boot).
- **S1 — Persistence, Declarative Synthesizer & 33-Tool Twin Parity**:
	- Atomic Drizzle SQLite WAL cursor transactions, bulk N+1 elimination, `corner_radius_rem` schema & migration, declarative 21-state `Map` synthesizer.
	- 6 new parity tools (`ui_set_corner_radius`, `ui_configure_station_layer`, `ui_edit_zone_disposition`, `ui_move_entity_to_zone`, `ui_open_station_builder`, `ui_open_zone_edition`) wired across `STUDIO_TOOL_REGISTRY`, `/api/mcp`, `UiWireBroker`, RFC 6902 undo/redo, and `local.assistant.ts`.
- **S2 — Workbenches & Ergonomic Polish**:
	- Tri-Column `Visuals & Motion` Calibration Console (`Left 5x2` embellishments/animations | `Center Live Preview Cartridge` with radius slider + Shape Cycle + Replay | `Right 5x2` transitions/kinetic/morph).
	- Swipe-ready 4-layer `StationBuilderModal` and 11-zone `ZoneEditionModal` with bilateral $X = 50\text{vw}$ mirroring and cross-zone entity migration.
	- Unclipped `TOP_RIGHT` guest badge (`GUEST · LIGHT/DARK · X=50vw`), split Active Runtime vs Unsaved Draft in `Settings -> AI & Models`, canonical `minus` zoom-out icon in `UiBentoRadar`.

## Live Gate Status

- `qa_audit --full`: PASS (`0` violations)
- `svelte-check` & `tsc --noEmit`: PASS (`0` errors, `0` warnings)
- `qa:release`: PASS (`50/50` tests, `960` assertions, Vite build PASS)
- Stage 4 Headless Chromium E2E (`1440x900` & `390x844`): PASS (`0` console/page errors, `dx <= 0.00px` / `dy <= 0.01px` Flex centering across all 4 Settings tabs + Station Builder + Zone Edition at constant `1088px` width, `4` concentric SVG `A` arcs at `1.25rem` ROUND, `44` true-stroke chamfer buttons, `url("data:image/svg+xml,...")` cursor cascade on body/buttons/inputs/backdrops/grips/pan-stage, live chat `ui_set_corner_radius` -> `0.75rem`, zero `"Gue..."` truncation, canonical `minus` Radar icon, zero horizontal overflow on `390x844`).

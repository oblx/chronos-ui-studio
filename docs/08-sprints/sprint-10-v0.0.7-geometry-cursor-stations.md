# Sprint 10 (`v0.0.7`): Pure-Flex Modal Centering, True-Stroke Chamfers, Curved ROUND Arcs, 21-State Hardened Cursors, Station Builder & Zone Edition

Author: `Oblx <code@oblx.dev>` | Release Lock: `@chronos-ui/svelte` (`v0.0.7`)

## 1. Two-Sprint Recursive Critique (`v0.0.5` – `v0.0.6`)

Auditing the rendered `v0.0.6` studio and backend surfaced six foundational defects requiring architectural root fixes before expanding workbench surface area:

1. **Unpainted 45-Degree Chamfer Gaps**: Applying CSS `border` alongside `clip-path: polygon(...)` sliced off every beveled corner on buttons, badges, inputs, selects, and `[x]` close controls.
2. **Straight 90-Degree Embellishments in `ROUND` Mode**: Corner embellishments (`BRACKET`, `CARET`, `CORNER_TICKS`, `ARC`) rendered square right-angle brackets outside rounded hulls rather than concentric circular arcs.
3. **Off-Center Modals & Fighting ResizeObservers**: `UiAnimatedResizeBody` ran JS `ResizeObserver` height-tweening loops that shifted modal geometry across `Settings` tabs instead of relying on pure viewport Flexbox centering.
4. **Native OS Pointer Leakage**: The 17-state cursor stylesheet lacked `!important` precedence, modal backdrop/drag-grip selectors, and URL-safe `32x32` percent-encoded SVG data URIs (`#` -> `%23`), leaking native OS pointers onto backdrops and buttons; boot also defaulted to native OS cursor until manual click.
5. **Missing Geometry & Spatial Workbenches**: Users had no runtime `--ui-corner-cut` slider, the Live Preview Cartridge sat crowded in a 2-column tab, and no visual modals existed for the 4 architectural Station layers or 11 perimeter HUD zones.
6. **Three Ergonomic & State-Sync Regressions**: `TOP_RIGHT` pod truncated `GUEST` to `Gue...`, `Settings -> AI & Models` conflated active runtime status with unsaved profile edits, and the `BOTTOM_RIGHT` Bento Radar rendered a chevron instead of a `minus` icon for zoom-out.

## 2. Blast-Radius Refactor & v0.0.7 Deliverables

### S0 — `@chronos-ui/svelte` Core Geometry, Borders, Modals & 21-State Cursors

- **True-Stroke Vector Borders (`UiVectorBorder`)**: Replaced CSS `border`+`clip-path` slicing on `UiChamferButton`, `UiChamferFrame`, `UiBadge`, `UiInput`, `UiSelect`, and `UiModalHeader` with a continuous `<svg>` `<path vector-effect="non-scaling-stroke">` contour matching `STRAIGHT | CHAMFER | ROUND` geometry at radius $r \in [0.25\text{rem}, 1.5\text{rem}]$.
- **Concentric `ROUND` Embellishments**: Added `buildCurvedCornerEmbellishment` in `shapes.geometry.ts` emitting true SVG elliptical arc (`A`) paths offset concentrically from rounded corners with radius $r_{\text{arc}} = r + \delta$.
- **Pure-Flex Viewport Centering**: Stripped JS `ResizeObserver` height tweening from `UiAnimatedResizeBody`; standardized `UiModalShell` on `fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6`, declarative width tiers (`COMPACT`, `STANDARD`, `WIDE: min(96vw, 68rem)`, `FULL_STAGE`), and a single `min-h-0 flex-1 overflow-y-auto` scroll body.
- **21-State Hardened CSS Cursor Engine**: Expanded `CSS_CURSOR_STATES` to 21 CSS UI Level 4 states (`alias`, `copy`, `zoom-in`, `zoom-out`), added canonical `encodeSvgCursorDataUrl()` (`32x32` viewBox + percent-encoded `#`), enforced `!important` selectors across backdrops (`[data-ui-modal-backdrop]`), drag grips (`[data-ui-drag-grip]`), pan stages (`[data-ui-pan-stage]`), and disabled controls, and auto-hydrated `Cyber Reticle` on boot.

### S1 — Transactional Persistence, Declarative Synthesizer & 33-Tool Parity

- **Schema & Static Export**: Added `corner_radius_rem` to `ui_projects` (with idempotent `ALTER TABLE` migration), auto-backfilled all 21 cursor states in Drizzle SQLite WAL, wrapped `createCustomCursorPack` in atomic `db.transaction`, and emitted `--ui-corner-cut` + 21-state cursor CSS in `css.adapter.ts` / `static.build.adapter.ts`.
- **Declarative Synthesizer & Blueprint Validation**: Replaced switch/if chains in `cursor.synthesizer.ts` with a declarative 21-state `Map`, added `'ROUND'` to `VALID_CORNERS` in `blueprint.schema.ts`, and eliminated `studio` state coupling with dedicated `station.handlers.ts`.
- **33-Tool Twin Parity**: Registered 6 new tools (`ui_set_corner_radius`, `ui_configure_station_layer`, `ui_edit_zone_disposition`, `ui_move_entity_to_zone`, `ui_open_station_builder`, `ui_open_zone_edition`) across `STUDIO_TOOL_REGISTRY`, Builder/Twin MCP, and `local.assistant.ts` (`clientIntents`).

### S2 — Calibration Console, Station Builder, Zone Edition & Ergonomics

- **Tri-Column `Visuals & Motion` Console**: Symmetrical `Left 5x2` (6 embellishments + 4 animations) | `Center Live Preview Cartridge` (Tri-mode + `Corner Radius` slider + live animated `UiChamferFrame` + Speed/Scale/Contrast/Dyslexia + Cursor Studio CTA) | `Right 5x2` (8 Svelte 5 transitions + `Kinetic` + `Corner Morph`), inside a uniform `WIDE` `SettingsModal`.
- **Station Builder & Zone Edition Modals**: Delivered 4-layer swipe-ready `StationBuilderModal` (`Layer A/B/C + Theme`) and 11-zone interactive `ZoneEditionModal` with schematic click selection, bilateral $X = 50\text{vw}$ mirroring via `mirrorCornerTuple`, per-zone corner radius/style tuning, and live entity relocation.
- **Ergonomic Polish**: Unclipped `TOP_RIGHT` `GUEST · DARK/LIGHT` badge on its own row, split Active Runtime summary from Selected Profile Editor (`Synced` / `Unsaved Draft`) in `SettingsAiTab`, and switched `BentoRadarConsole` zoom-out to `minus` (`M5 12h14`).

## 3. Verification Invariants

1. Zero static violations (`qa_audit.ts --full`: tabs only, functions $\le 42\text{ LoC}$, code $\le 150\text{ LoC}$, docs $\le 100\text{ LoC}$, folders $\le 10$ files, `100%` barrelled, `0` runtime deps in `@chronos-ui/svelte`, `0` emojis).
2. All 9 `:memory:` SQLite Bun test suites green (`v007_geometry_cursor_stations.test.ts` validating 21-state cursors, SVG `A` arcs, `ROUND` blueprints, 6 new MCP tools, and 33-tool parity).
3. Headless Chromium (`1440x900` & `390x844`) proving exact modal viewport centering across all 4 Settings tabs, `url("data:image/svg+xml,...")` cursor cascade on body/buttons/inputs/backdrops, true-stroke SVG borders, concentric `ROUND` arc paths, zero `"Gue..."` truncation, `minus` zoom-out icon, and `0` console/page errors.

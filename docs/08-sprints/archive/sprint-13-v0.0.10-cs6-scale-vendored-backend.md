# Sprint 13 — `@chronos-ui/svelte` v0.0.10 (CS6 Wireframe Workbench, Batched O(1) Scale, WebMCP Static & Vendored Backend)

Author: `Oblx <code@oblx.dev>` | Release Target: `0.0.10` | Archive Rotation: `docs/08-sprints/archive/sprint-04..09`

## Bounded-Context Lineage (v0.0.1 – v0.0.9)

- `v0.0.1`–`v0.0.4`: Zero-dep Svelte 5 presentation framework (`@chronos-ui/svelte`), Drizzle WAL + IDB mirror, Dual-Spine MCP, Calm Empty-Stage Genesis, dockable AI Assistant, RFC 6902 patcher, Governance Gate, and multimodal inputs.
- `v0.0.5`–`v0.0.7`: RFC 9562 UUID v7 telemetry, 14 contour-locked UML shapes, 21-state CSS Level 4 cursor cascade, continuous SVG `UiVectorBorder`, concentric ROUND `A` arcs, and pure-Flex modal centering.
- `v0.0.8`–`v0.0.9`: 3-tier anti-pinch corner cuts (`0.5rem / 0.75rem / 0.3125rem`, $\le 28\%$ control height), 9x6 perimeter animations, `25m / 32m / 38m` `qa:timer`, zero-screenshot `qa:harness`, dual-page AST Field Tome, live-preview Station Builder, and lazy code-split modals.

## v0.0.10 Engineering Pillars

1. **Archive Rotation & Folder-Cap Preservation**: Rotated `sprint-04` through `sprint-09` into `docs/08-sprints/archive/` so `docs/08-sprints/` remains well below the $\le 10$ files/folder invariant while preserving full release lineage.
2. **Reciprocal `Studio HUD <-> Calm View` Constancy & Zero-Overlap `TACTICAL` Corridor**:
	- Removed the redundant density pill from `CalmTopStrip`; density (`BALANCED | TACTICAL`) lives inside `TOP_CENTER` when HUD chrome is active.
	- Locked `Studio HUD` (Calm) and `Calm View` (HUD) to identical desktop coordinates ($\Delta x \le 24\text{px}, \Delta y \le 12\text{px}$ on viewports $\ge 80\text{rem}$).
	- Dynamically updates `--ui-stage-free-w` from open non-floating edge drawers so starter cards (`max-width: min(46rem, var(--ui-stage-free-w))`) maintain $0\text{px}$ drawer overlap on $1440 \times 900$.
	- Expanded Guided Spotlight Tour (`STUDIO_SPOTLIGHT_STEPS`) to 7 self-revealing steps (`spot-top-left` through `spot-export-pipeline`).
3. **Photoshop CS6–Inspired Wireframe Skeleton Workbench (`studio/src/client/modals/wireframe/`)**:
	- Guaranteed 4-path opening: `UiBentoRadar` viewport click (`radar-open-skeleton`, SVG `pointer-events-none`), radar action button, Calm/HUD wireframe icon trigger, and MCP `ui_open_wireframe_skeleton` / chat `"open wireframe"`.
	- 5-panel `FULL_STAGE` modal: Options Bar (`2.5rem`), vertical Toolbox (`2.75rem`, `[V][M][N][W][H][Z]`), interactive 11-zone Artboard with live SVG entity contours and animated DAG arcs, Right Panel Stack (`Layers` with Eye/Lock guards, `Properties`, `History`), and `2rem` Status Strip.
4. **High-Scale Batched O(1) Event Core (`packages/chronos-ui/src/wire/`)**:
	- `$state.raw` broker + `dispatchBatch(envelopes[])` + microtask coalescer (`enqueueCoalescedIntent`) + pure headless counterparts (`createHeadlessWireBroker`, `createHeadlessEntityRegistry`).
	- O(1) multi-indexed `UiEntityRegistry` (`byUuid`, `byZone`, `byParent`, `byKind`) + CSS `.ui-virtual-node` / `.ui-virtual-row` (`content-visibility: auto`).
	- Verified benchmark: $1{,}000$ UUID v7 entities + $500$ batched intents in $< 25\text{ms}$.
5. **W3C / Lighthouse 100 / Agentic WebMCP Static Builds**:
	- Semantic `<header>`, `<nav>`, `<main id="main-stage">`, `<aside>`, `<footer>`, single `<h1>`, skip-link, granular `@chronos-ui/svelte/{atoms,tokens,motion}` subpath imports, inlined critical CSS tokens, `<link rel="modulepreload">`, `robots.txt`, `manifest.webmanifest`, `llms.txt`, `/.well-known/webmcp.json`, and `webmcp.bridge.ts`.
6. **Automated Minimal Vendored Backend (`fullstack-bundle` + 39-Tool MCP Parity)**:
	- Emits standalone runnable Bun + Drizzle `bun:sqlite` WAL app (`package.json`, `.env.example`, `drizzle.config.ts`, `drizzle/0000_init.sql`, `drizzle/meta/_journal.json`, `server/{db,schema,migrate,router,index}.ts`, and `client/` static assets) with zero Studio imports.
	- Added 4 MCP tools (`ui_open_wireframe_skeleton`, `ui_toggle_entity_lock`, `ui_toggle_entity_visibility`, `ui_export_fullstack_bundle`) bringing `STUDIO_TOOL_REGISTRY` to 39 tools with `GOVERNANCE_LOCKED` enforcement.

## Verification & Clock Compliance

- Verified via 4-stage pipeline: `qa:fast`, `qa:release` (all test suites + 1,000-entity `< 25ms` benchmark + live `:memory:` SQLite vendored router E2E + code-split main entry `< 250 kB`), zero-screenshot `qa:harness --scenario=all --viewports=1440x900,390x844 --json`, and `compile_applet` + `lint_applet`.

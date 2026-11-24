# Changelog — `@chronos-ui/svelte` & Companion Builder Studio

All notable releases follow Semantic Versioning (`0.1.0` marks the first public minor release).

## `0.1.0` — First Public Minor Release

- **Scoped-Default QA Engine**: Switched `qa:fast`, default `verify`, and default `qa:harness` CLI runs to execute only the latest scoped delta (`< 8s`), reserving `--full-battery` / `qa:release` for a single pre-signoff full pass across all suites and viewports.
- **Reciprocal Toggle Constancy**: Centered `Calm View` at $X = 50\text{vw}$ inside a symmetric 3-column `TOP_CENTER` grid so `Studio HUD` and `Calm View` share the exact same desktop coordinate anchor ($\Delta x \le 16\text{px}, \Delta y \le 8\text{px}$) with zero `Twin MCP` clipping.
- **Unified `ProjectLifecyclePod`**: Replaced duplicated top-left recovery markup across `CalmTopStrip` and `TopPerimeterPods` with one shared `ProjectLifecyclePod` providing identical `Save` + `Reset` (`Default View` / `Clean Workspace`) controls in both modes.
- **Unambiguous Edge Rails**: Removed redundant trailing layers icon beneath the `⋮⋮` grip on `LEFT_EDGE` and `RIGHT_EDGE` mini-rails and added a hairline divider separating panel tabs from the float/reposition grip.
- **Complete Subpath Exports & Folder Hygiene**: Exported all 13 `@chronos-ui/svelte` library barrels plus `.`, `./manifest`, and `./styles.css`; partitioned `studio/src/mcp/tools/` and `studio/src/tests/{legacy,releases}/` well below the 10-file directory cap.
- **Public Packaging Seal**: Added root and package MIT `LICENSE`, standalone `packages/chronos-ui/README.md`, `CHANGELOG.md`, `.d.ts` declaration build verification, and an automated external-consumer import smoke test across all subpath exports.

## `0.0.12` — Pre-0.1.0 Calm Motion, Overlay Drawers & 2D Wire DAG Seal

- Locked `LEFT_EDGE` and `RIGHT_EDGE` drawers to flush `z-[36]` overlays (`0px` workspace width shrinkage).
- Added global `CALM_SLOW` motion tokens, universal `UiModalShell` Grow/Shrink (`Alt+M`), 15-node 2D `UiWireDagGraph`, gesture-coalesced stage pan/zoom, and `UiCyberTooltip` outer-anchor clamping.

## `0.0.11` — Unconditional Calm Boot, Mirrored Rails & 21-State Concrete-Hex Cursor

- Introduced unconditional Calm launch, mirrored bilateral mini-rails, concrete-hex 21-state SVG cursor cascade, and safe-corridor framing.

## `0.0.10` — CS6 Wireframe Workbench, `$state.raw` O(1) Telemetry & Vendored Full-Stack Export

- Delivered 5-panel CS6 `WireframeSkeletonModal`, `$state.raw` O(1) entity index, 7-step Spotlight Tour, and standalone vendored SQLite + Drizzle full-stack export adapter.

## `0.0.1` – `0.0.9` — Core Architecture & Perimeter HUD Foundation

- Established zero-dependency Svelte 5 Runes perimeter HUD, 3-tier parametric chamfer/round vector borders, 14 frame shapes, AST SSG Field Tome, Dual-Spine MCP parity, and `25m/32m/38m` `qa:timer`.

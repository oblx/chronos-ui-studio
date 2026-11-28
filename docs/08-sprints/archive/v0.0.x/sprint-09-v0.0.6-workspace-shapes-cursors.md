# Sprint 09 — `v0.0.6`: Workspace Lifecycle, 14 Contour-Locked Shapes, Phase-Locked Motion & AI 17-State Cursor Studio

Author: `Oblx <code@oblx.dev>` | Release Lock: `@chronos-ui/svelte` (`VERSION = "0.0.6"`)

## Sealed Lineage & Defect Closure

Builds strictly on `@chronos-ui/svelte` `v0.0.1`–`v0.0.5` (`docs/08-sprints/`) while closing every visual and kinetic defect identified in `v0.0.5`:

1. **Contour-Locked Embellishments & `DIAGONAL_DRIFT`:** Non-rectangular shapes plot embellishments strictly on true geometric `anchorVertices` $(x, y, \mathbf{n})$ rather than rectangular bounds; outward drift animates $\mathbf{p}(t) = \mathbf{v} + (\delta_0 + a\sin \omega t)\mathbf{n}$ cleanly with `--ui-nx/--ui-ny`.
2. **True Container Nesting & Content-Hugging Grids:** `UiLiveNodeWidget` renders `node.children` via `childrenSlot` inside the parent `UiChamferFrame` hull (`UML_PACKAGE` encloses `UML_COMPONENT` and gauges); `WORLD_CANVAS` uses `items-start` so sibling cards eliminate dead vertical stretch.
3. **Phase-Locked Dock Accordion & Unclipped Tooltips:** `UiAssistantDock` replaces competing transitions with a single CSS Grid row accordion (`0fr` $\leftrightarrow$ `1fr`) + `inert` collapse; `uiClampTooltipRect` clamps corner tooltips within an $8\text{px}$ viewport safety inset.
4. **Workspace Lifecycle Controls (`Save` / `Reset`):** `CalmTopStrip` and `TopPerimeterPods` add dirty-tracking `[ Save ]` (`Cmd/Ctrl+S`), zero-CLS `[ Reset ]` (`Default View | Clean Workspace`), `/api/projects/:id/{save,clean}`, and MCP parity (`+ui_save_project`, `+ui_clean_project`, `+ui_reset_workspace_view`).

## v0.0.6 Architectural Expansion

1. **14 True-Contour Primitives (`shapes.paths.ts`):** Expands from 8 to 14 shapes (`+DIAMOND`, `+PARALLELOGRAM`, `+TRAPEZOID`, `+OCTAGON`, `+DOCUMENT`, `+SIGNAL_SEND`) verified end-to-end inside `Shape Matrix Lab`.
2. **Phase-Locked Motion & Swipeable Modals:** Adds `IRIS_EXPAND` and `SCAN_WIPE` presets (8 total) plus axis-locked `use:uiSwipeDeck` across `UiHorizontalDeck` and `UiSubTabBar`.
3. **AI-Derived 17-State CSS Cursor Studio (`@chronos-ui/svelte/cursor`):** Ships 4 builtin packs, `bun:sqlite` `cursor_packs`/`cursor_state_assets`, strict `<= 128 KB` PNG validator, 16-state SVG composer, `/api/cursors*` routes, 3 Cursor MCP tools (27 tools total), live hotspot pad, 17-state hover sandbox, and CSS export emission.

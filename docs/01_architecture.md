# Chapter 1: Architecture & Humble Views

`@chronos-ui/svelte` (`v0.1.1`, MIT License) enforces a strict firewall between presentation components and host application state. Presentation components receive reactive Svelte 5 rune props and emit typed `DagEnvelope` intents through `createUiWireBroker`.

## Discipline Matrix

- **Bounded Contexts:** `packages/chronos-ui/` carries `0` runtime dependencies, exposes all `13` granular library barrels plus `.`, `./manifest`, and `./styles.css`, and never imports from `studio/`.
- **Humble Views:** `.svelte` files perform zero `fetch()`, storage writes, or domain calculations, and zero `<svelte:component>` legacy syntax.
- **Root-Relative Sizing & Scrollbars:** Layout geometry uses `rem`, `%`, `vw`, and `vh` under `font-size: calc(100% * var(--ui-font-scale, 1))`, with theme-bound thin scrollbars (`--ui-scroll-*`) and semantic `.ui-ctl` interactive state tokens.
- **21-State Vector Silhouettes:** `cursor.silhouettes.ts` synthesizes distinct `32×32` concrete-hex CSS UI Level 4 cursors across 4 curated packs with calibrated hotspots and live polarity recoloring.
- **IndexedDB History & Staged Motion:** Permanent disabled-aware `[ Undo ]` / `[ Redo ]` controls persist exclusively in browser IndexedDB (`default: 5`, `max: 128`); modals run a 4-phase `OPENING -> OPEN -> CLOSING -> CLOSED` FSM; Studio HUD reveals all 9 zones sequentially every `250ms` via `UI_REVEAL_ZONE`.
- **Unified Fold-Overlay & Caps:** `createFoldOverlayMachine` drives `UiEdgeDrawer` and `UiAssistantDock` as `OVERLAY_HOVER` panels ($0\text{px}$ canvas shrinkage). Functions stay at $\le 42\text{ LoC}$, code files at $\le 150\text{ LoC}$, docs at $\le 100\text{ LoC}$, and folders strictly $< 10$ files (`100%` `index.ts` barrels).

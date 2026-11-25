# Chapter 1: Architecture & Humble Views

`@chronos-ui/svelte` (`v0.1.0`, MIT License) enforces a strict firewall between presentation components and host application state. Presentation components receive reactive Svelte 5 rune props and emit typed `DagEnvelope` intents through `createUiWireBroker`.

## Discipline Matrix

- **Bounded Contexts:** `packages/chronos-ui/` carries `0` runtime dependencies, exposes all `13` granular library barrels plus `.`, `./manifest`, and `./styles.css`, and never imports from `studio/`.
- **Humble Views:** `.svelte` files perform zero `fetch()`, storage writes, or domain calculations, and zero `<svelte:component>` legacy syntax.
- **Root-Relative Sizing:** Layout geometry uses `rem`, `%`, `vw`, and `vh` under `font-size: calc(100% * var(--ui-font-scale, 1))`, reserving pixel hairlines for vector borders.
- **Zero-CLS Timing:** Modal countdown rings render inside an immutable $2.25\text{rem} \times 2.25\text{rem}$ container with `contain: size layout`.
- **Unified Fold-Overlay & Zero-Shrinkage Lock:** `createFoldOverlayMachine` and `use:uiFoldGrip` (`packages/chronos-ui/src/machines/fold.overlay.svelte.ts`) drive both `HORIZONTAL` (`UiEdgeDrawer`) and `VERTICAL` (`UiAssistantDock`) panels as `OVERLAY_HOVER` overlays with $0\text{px}$ `WORLD_CANVAS` displacement.
- **File & Folder Caps:** Functions stay at $\le 42\text{ LoC}$, code files at $\le 150\text{ LoC}$, docs at $\le 100\text{ LoC}$, and folders strictly $< 10$ files (target $\le 8$, hard cap $\le 10$) with `100%` `index.ts` barrels and zero `../..` deep relative imports.

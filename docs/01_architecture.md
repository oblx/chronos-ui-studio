# Chapter 1: Architecture & Humble Views

`@chronos-ui/svelte` enforces a strict firewall between presentation components and host application state. Presentation components receive reactive rune props and emit typed `DagEnvelope` intents through `createUiWireBroker`.

## Discipline Matrix

- **Bounded Contexts:** `packages/chronos-ui/` never imports from `studio/`.
- **Humble Views:** `.svelte` files perform zero `fetch()`, storage writes, or domain calculations.
- **Root-Relative Sizing:** Layout geometry uses `rem`, `%`, `vw`, and `vh` under `font-size: calc(100% * var(--ui-font-scale, 1))`, reserving pixel hairlines for vector borders.
- **Zero-CLS Timing:** Modal countdown rings render inside an immutable $2.25\text{rem} \times 2.25\text{rem}$ container with `contain: size layout`.
- **File Caps:** Functions stay at $\le 42\text{ LoC}$, code files at $\le 150\text{ LoC}$, docs at $\le 100\text{ LoC}$, and folders at $\le 10$ files with `100%` `index.ts` barrels.

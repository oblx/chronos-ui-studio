---
name: chronos-clean-onion-audit
description: Enforces Clean Onion Architecture, package firewall, decongested folder ceilings, and static quality invariants for @chronos-ui/svelte and Companion Builder Studio.
license: MIT
metadata:
  author: Oblx <code@oblx.dev>
  version: "0.1.0"
---

# Chronos Clean Onion & Firewall Audit

Use this skill whenever adding, refactoring, or relocating modules across `packages/chronos-ui/` or `studio/`.

## Hard Structural Invariants

1. **Bounded Context Firewall**: `packages/chronos-ui/` carries `0` runtime dependencies and never imports from `studio/`.
2. **File & Function Caps**: Tabs (`\t`) only; functions $\le 42\text{ LoC}$; code files $\le 150\text{ LoC}$; docs and skills $\le 100\text{ LoC}$ with zero fenced code blocks in `docs/**/*.md`.
3. **Decongested Folder Hygiene**: Hard cap $\le 10$ files per directory (target $\le 8$, near-cap warning emitted at `9–10` files by `qa_audit.ts`). Every code folder in `packages/chronos-ui/src/` and `studio/src/` requires an `index.ts` barrel.
4. **Zero Deep Relative Imports**: Never write `../..` imports. Inside `packages/chronos-ui/src/` use single-level `../` or `@ui/*`; inside `studio/src/` use `@chronos-ui/svelte`, `@chronos-ui/svelte/*`, or `@studio/*`.
5. **Humble Svelte 5 Views**: `.svelte` files perform zero `fetch()`, `localStorage`, or `indexedDB` calls, use zero `<svelte:component>`, zero Unicode emojis, and zero hardcoded non-palette hex colors.
6. **Docs & Skill Freshness**: `qa_audit.ts` enforces `DOCS_AND_SKILL_FRESHNESS` across all 13 declared subpath exports in `packages/chronos-ui/README.md` and `version: "0.1.0"` parity across all 5 domain skills.

## Decongested Barrel Topology (`v0.1.0`)

- `packages/chronos-ui/src/tokens/geometry/` — `corners.geometry.ts`, `shapes.paths.ts`, `shapes.geometry.ts`.
- `packages/chronos-ui/src/wire/core/` — `wire.types.ts`, `wire.pipeline.ts`, `uuid.ts`.
- `packages/chronos-ui/src/organisms/{overlays,wire-observatory}/` — `UiToastStack`, `UiVirtualCursors`, `UiWireDagGraph`, `UiWireInspector`.
- `studio/src/client/panels/perimeter/` — `BentoRadarConsole`, `TopPerimeterPods`, `WireTelemetryStrip`.
- `studio/src/client/state/{handlers,lifecycle}/` — modular wire intent handlers and persistence lifecycle ops.
- `studio/src/core/{assistant,engine}/` — local/provider AI planners and 42-tool studio engine.

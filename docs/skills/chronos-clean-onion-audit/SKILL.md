---
name: chronos-clean-onion-audit
description: Enforces Clean Onion Architecture, package firewall, decongested folder ceilings, and static quality invariants for @chronos-ui/svelte and Companion Builder Studio.
license: MIT
metadata:
  author: Oblx <code@oblx.dev>
  version: "0.1.1"
---

# Chronos Clean Onion & Firewall Audit

Use this skill whenever adding, refactoring, or relocating modules across `packages/chronos-ui/` or `studio/`.

## Hard Structural Invariants

1. **Bounded Context Firewall**: `packages/chronos-ui/` carries `0` runtime dependencies and never imports from `studio/`.
2. **File & Function Caps**: Tabs (`\t`) only; functions $\le 42\text{ LoC}$; code files $\le 150\text{ LoC}$; docs and skills $\le 100\text{ LoC}$ with zero fenced code blocks in `docs/**/*.md`.
3. **Decongested Folder Hygiene**: Hard cap $\le 10$ files per directory (target $\le 8$, near-cap warning emitted at `9–10` files by `qa_audit.ts`). Every code folder in `packages/chronos-ui/src/` and `studio/src/` requires an `index.ts` barrel.
4. **Zero Deep Relative Imports**: Never write `../..` imports. Inside `packages/chronos-ui/src/` use single-level `../` or `@ui/*`; inside `studio/src/` use `@chronos-ui/svelte`, `@chronos-ui/svelte/*`, or `@studio/*`.
5. **Humble Svelte 5 Views**: `.svelte` files perform zero `fetch()`, `localStorage`, or `indexedDB` calls, use zero `<svelte:component>`, zero Unicode emojis, and zero hardcoded non-palette hex colors.
6. **Docs & Skill Freshness**: `qa_audit.ts` enforces `DOCS_AND_SKILL_FRESHNESS` across all 13 declared subpath exports in `packages/chronos-ui/README.md` and `version: "0.1.1"` parity across all domain skills.

## Decongested Barrel Topology (`v0.1.1`)

- `packages/chronos-ui/src/tokens/geometry/` and `packages/chronos-ui/src/tokens/control.tokens.ts` — 3-tier corners, 14 shapes, and configurable control tokens.
- `packages/chronos-ui/src/machines/overlays/` — `modal.machine.svelte.ts` (4-phase FSM), `tooltip.machine.svelte.ts` (`infoLevel 0..100`), `spotlight.machine.svelte.ts`.
- `packages/chronos-ui/src/atoms/controls/` and `molecules/overlays/` — state-matrix buttons, badges, tooltips, context menus.
- `studio/src/client/canvas/chrome/` — `CalmTopStrip.svelte` and `ProjectLifecyclePod.svelte` (permanent Undo/Redo + Save/Reset).
- `studio/src/core/engine/tools/`, `studio/src/server/catalog/`, `studio/src/workers/harness/` — all decongested to $\le 8$ files per directory.

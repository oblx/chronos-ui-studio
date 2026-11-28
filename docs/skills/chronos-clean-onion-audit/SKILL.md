---
name: chronos-clean-onion-audit
description: Enforces Clean Onion Architecture, package firewall, decongested folder ceilings, and static quality invariants for @chronos-ui/svelte and Companion Builder Studio.
license: MIT
metadata:
  author: Oblx <code@oblx.dev>
  version: "0.1.3"
---

# Chronos Clean Onion & Firewall Audit (`v0.1.3`)

Use this skill whenever adding, refactoring, or relocating modules across `packages/chronos-ui/` or `studio/`.

## Hard Structural Invariants

1. **Bounded Context Firewall**: `packages/chronos-ui/` carries `0` runtime dependencies and never imports from `studio/`.
2. **File & Function Caps**: Tabs (`\t`) only; functions $\le 42\text{ LoC}$; code files $\le 150\text{ LoC}$; docs and skills $\le 100\text{ LoC}$ with zero fenced code blocks in `docs/**/*.md`.
3. **Decongested Folder Hygiene**: Hard cap $\le 10$ files per directory (target $\le 8$, `0` folders at `9–10` files enforced by `qa_audit.ts`). Every code folder in `packages/chronos-ui/src/` and `studio/src/` requires an `index.ts` barrel.
4. **Zero Deep Relative Imports**: Never write `../..` imports. Inside `packages/chronos-ui/src/` use single-level `../` or `@ui/*`; inside `studio/src/` use `@chronos-ui/svelte`, `@chronos-ui/svelte/*`, or `@studio/*`.
5. **Humble Svelte 5 Views & SVG-Native Controls**: `.svelte` files perform zero `fetch()`, `localStorage`, or `indexedDB` calls, use zero `<svelte:component>`, zero Unicode emojis, zero hardcoded non-palette hex colors, and zero rectangular CSS borders/outlines on cornered `.ui-ctl` controls (`NO_RECTANGULAR_BORDER_ON_CORNERED_CTL`).
6. **Docs & Skill Freshness**: `qa_audit.ts` enforces `DOCS_AND_SKILL_FRESHNESS` across all 14 declared subpath exports (including `./graph`) in `packages/chronos-ui/README.md` and `version: "0.1.3"` parity across all domain skills.

## Decongested Barrel Topology (`v0.1.3`)

- `packages/chronos-ui/src/input/` and `input/gamepad/` — declarative `shortcuts.registry.ts`, `shortcuts.engine.ts`, pointer/voice adapters, and Xbox/PS5 DualSense profiles.
- `packages/chronos-ui/src/tokens/geometry/` and `packages/chronos-ui/src/tokens/control.tokens.ts` — 3-tier corners, 14 shapes, and configurable control tokens.
- `packages/chronos-ui/src/atoms/controls/` and `molecules/overlays/` — SVG-native 5-state buttons, badges, tooltips, context menus.
- `studio/src/client/modals/search/` and `studio/src/client/canvas/chrome/` — `GlobalSearchModal.svelte`, `CalmTopStrip.svelte`, and `ProjectLifecyclePod.svelte`.
- `docs/08-sprints/archive/v0.0.x/` and `studio/src/tests/legacy/v00x/` — rotated sub-archives keeping every directory $\le 8$ files.

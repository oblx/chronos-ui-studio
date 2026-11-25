---
name: chronos-ui-builder
description: Builds and refines @chronos-ui/svelte components, unified HORIZONTAL/VERTICAL OVERLAY_HOVER fold panels, 4-phase modal motion, 250ms ASC HUD choreography, thin scrollbars, and infoLevel tooltips.
license: MIT
metadata:
  author: Oblx <code@oblx.dev>
  version: "0.1.1"
---

# Chronos UI Builder (`@chronos-ui/svelte` `v0.1.1`)

Use this skill when building or modifying `@chronos-ui/svelte` primitives, perimeter HUD zones, edge drawers, assistant dock, modals, or tooltip overlays.

## Core Design & Layout Invariants

1. **Unified Fold-Overlay Engine (`fold.overlay.svelte.ts`)**: `UiEdgeDrawer` (`HORIZONTAL`) and `UiAssistantDock` (`VERTICAL`) consume `createFoldOverlayMachine` and `use:uiFoldGrip`, locking `WORLD_CANVAS` width/height delta to strictly `0px`.
2. **Universal Thin Scrollbars & `.ui-ctl` State Matrix**: `styles.css` enforces thin theme-bound scrollbars (`scrollbar-width: thin`) and explicit `inactive / hover / active / focus-visible / disabled` state progressions via `controlConfig` (`buttonConfig`, `formConfig`).
3. **4-Phase Event-Driven Modal Lifecycle**: `createModalMachine` + `UiModalShell` transition strictly `CLOSED -> OPENING -> OPEN -> CLOSING -> CLOSED` via `ontransitionend` + safety fallback, emitting `UI_MODAL_OPENED` and `UI_MODAL_CLOSED`.
4. **250ms ASC Sequential HUD Boot Reveal**: `createHudBootChoreographer` mounts perimeter zones lazily in `HUD_BOOT_ZONE_ORDER` via `UI_REVEAL_ZONE`, persists one-time completion, collapses to `0ms` under reduced motion, and supports Settings `[ Replay HUD Boot Sequence ]`.
5. **Priority `infoLevel (0–100)` Tooltips (`UiCyberTooltip`)**: Every interactive control provides `data-ui-tip` and calibrated `data-ui-tip-level` (`0 Silent .. 100 Verbose`, default threshold `60`, safety disabled tips `<= 20` allowed).
6. **Permanent Disabled-Aware Undo/Redo**: `ProjectLifecyclePod` renders permanent `[ Undo ]` and `[ Redo ]` controls backed by IndexedDB (`chronos_ui_history_v1`, default `5`, max `128`) in both Calm and Studio HUD modes.
7. **All 16 Package Exports**: Consume `@chronos-ui/svelte` or granular subpaths (`./tokens`, `./wire`, `./input`, `./motion`, `./cursor`, `./machines`, `./atoms`, `./forms`, `./molecules`, `./organisms`, `./modals`, `./assistant`, `./canvas`, `./manifest`, `./styles.css`).

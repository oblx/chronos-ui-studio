---
name: chronos-ui-builder
description: Builds and refines @chronos-ui/svelte components, unified HORIZONTAL/VERTICAL OVERLAY_HOVER fold panels, 4-phase modal motion, 250ms ASC HUD choreography, thin scrollbars, and infoLevel tooltips.
license: MIT
metadata:
  author: Oblx <code@oblx.dev>
  version: "0.1.2"
---

# Chronos UI Builder (`@chronos-ui/svelte` `v0.1.2`)

Use this skill when building or modifying `@chronos-ui/svelte` primitives, perimeter HUD zones, `UiEventGraph`, `UiOverflowText`, edge drawers, assistant dock, modals, or tooltip overlays.

## Core Design & Layout Invariants

1. **Reusable Event-Driven `UiEventGraph` (`@chronos-ui/svelte/graph`)**: Renders multi-lane SVG topologies with guaranteed `LANE_HEADER_BAND_PX + LANE_HEADER_PAD_PX` clearance (`0` header overlaps), all `14` `UI_FRAME_SHAPES`, `BEZIER | ORTHOGONAL | STEP` edge routing, and real-number Human Time-Scale slow-motion packets (`computeHumanScaledDurationMs`).
2. **Pure-CSS Hover-Marquee Overflow Guard (`UiOverflowText`)**: Wraps bounded labels inside `.ui-marquee-wrap` + `.ui-marquee-track` (`@keyframes ui-marquee-pingpong`) with zero-clipping safety across `UiChamferButton`, `UiBadge`, `FieldTomeModal` TOC, and `TOP_LEFT` Studio HUD.
3. **Unified Fold-Overlay Engine (`fold.overlay.svelte.ts`)**: `UiEdgeDrawer` (`HORIZONTAL`) and `UiAssistantDock` (`VERTICAL`) consume `createFoldOverlayMachine` and `use:uiFoldGrip`, locking `WORLD_CANVAS` width/height delta to strictly `0px`.
4. **Universal Thin Scrollbars & `.ui-ctl` State Matrix**: `styles.css` enforces thin theme-bound scrollbars (`scrollbar-width: thin`) and explicit `inactive / hover / active / focus-visible / disabled` state progressions via `controlConfig`.
5. **4-Phase Event-Driven Modal Lifecycle & 250ms ASC HUD Boot**: `createModalMachine` + `UiModalShell` transition `CLOSED -> OPENING -> OPEN -> CLOSING -> CLOSED`; `createHudBootChoreographer` reveals 9 zones lazily in ASC order.
6. **Priority `infoLevel (0–100)` Tooltips & Permanent Undo/Redo**: Every control sets calibrated `data-ui-tip-level`; `ProjectLifecyclePod` keeps balanced `Undo | Redo | Save | Reset` with `0px` clipping.
7. **All 17 Package Exports**: Consume `@chronos-ui/svelte` or granular subpaths (`./tokens`, `./wire`, `./input`, `./motion`, `./cursor`, `./machines`, `./atoms`, `./forms`, `./molecules`, `./organisms`, `./graph`, `./modals`, `./assistant`, `./canvas`, `./manifest`, `./styles.css`).

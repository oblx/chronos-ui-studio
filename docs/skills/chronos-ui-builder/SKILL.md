---
name: chronos-ui-builder
description: Builds and refines @chronos-ui/svelte components, SVG-native 5-state cornered controls, unified shortcut registry, Global Search palette, OVERLAY_HOVER fold panels, 4-phase modals, and true-ratio time-scale graphs.
license: MIT
metadata:
  author: Oblx <code@oblx.dev>
  version: "0.1.3"
---

# Chronos UI Builder (`@chronos-ui/svelte` `v0.1.3`)

Use this skill when building or modifying `@chronos-ui/svelte` primitives, perimeter HUD zones, `CANONICAL_SHORTCUTS`, `GlobalSearchModal`, `UiEventGraph`, `UiOverflowText`, edge drawers, assistant dock, modals, or tooltip overlays.

## Core Design & Layout Invariants

1. **SVG-Native 5-State Cornered Controls (`UiVectorBorder.svelte` & `styles.css`)**: Cornered `.ui-ctl`, `.ui-field-wrap`, `.ui-field-input`, and `.ui-badge-host` elements enforce `border: 0 !important; outline: none !important; box-shadow: none !important;` and drive all 5 interactive states (`inactive`, `hover`, `active`, `focus-visible`, `disabled`) through `<path data-ui-contour-path="true">` and `<path data-ui-focus-halo="true">`.
2. **Unified Declarative Shortcut Registry (`@chronos-ui/svelte/input`)**: `CANONICAL_SHORTCUTS` defines all 13 keyboard bindings with zero collisions, editable-input guards (`allowInInput`), `Ctrl/Cmd+K` for Global Search (`UI_OPEN_MODAL` `global-search`), `Ctrl/Cmd+Shift+H` for `Studio HUD`, and localized `formatShortcutBadge` tooltips.
3. **Reusable Event-Driven `UiEventGraph` & True-Ratio Time-Scale (`@chronos-ui/svelte/graph`)**: Renders multi-lane SVG topologies with guaranteed `LANE_HEADER_BAND_PX + LANE_HEADER_PAD_PX` clearance (`0` header overlaps), all `14` `UI_FRAME_SHAPES`, `BEZIER | ORTHOGONAL | STEP` edge routing, and true-ratio Human Time-Scale slow-motion packets (`computeHumanScaledDurationMs`, `4.0x` linear scaling from `2500x -> 10000x`).
4. **Pure-CSS Hover-Marquee Overflow Guard (`UiOverflowText`)**: Wraps bounded labels inside `.ui-marquee-wrap` + `.ui-marquee-track` (`@keyframes ui-marquee-pingpong`) with zero-clipping safety across `UiChamferButton`, `UiBadge`, `FieldTomeModal` TOC, and `TOP_LEFT` Studio HUD.
5. **Unified Fold-Overlay Engine (`fold.overlay.svelte.ts`)**: `UiEdgeDrawer` (`HORIZONTAL`) and `UiAssistantDock` (`VERTICAL`) consume `createFoldOverlayMachine` and `use:uiFoldGrip`, locking `WORLD_CANVAS` width/height delta to strictly `0px`.
6. **4-Phase Modal Lifecycle, 250ms ASC HUD Boot & Priority `infoLevel` Tooltips**: `createModalMachine` + `UiModalShell` transition `CLOSED -> OPENING -> OPEN -> CLOSING -> CLOSED`; `createHudBootChoreographer` reveals 9 zones lazily in ASC order; `ProjectLifecyclePod` keeps balanced `Undo | Redo | Save | Reset` with `0px` clipping.
7. **All 17 Package Exports**: Consume `@chronos-ui/svelte` or granular subpaths (`./tokens`, `./wire`, `./input`, `./motion`, `./cursor`, `./machines`, `./atoms`, `./forms`, `./molecules`, `./organisms`, `./graph`, `./modals`, `./assistant`, `./canvas`, `./manifest`, `./styles.css`).

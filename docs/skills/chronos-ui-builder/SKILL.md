---
name: chronos-ui-builder
description: Builds and refines @chronos-ui/svelte components, unified HORIZONTAL/VERTICAL OVERLAY_HOVER fold panels, multi-paragraph vector tooltips, and Studio perimeter HUD shells.
license: MIT
metadata:
  author: Oblx <code@oblx.dev>
  version: "0.1.0"
---

# Chronos UI Builder (`@chronos-ui/svelte` `v0.1.0`)

Use this skill when building or modifying `@chronos-ui/svelte` primitives, perimeter HUD zones, edge drawers, assistant dock, or tooltip overlays.

## Core Design & Layout Invariants

1. **Unified Fold-Overlay Engine (`fold.overlay.svelte.ts`)**: Both `UiEdgeDrawer` (`axis: 'HORIZONTAL'`, `LEFT`/`RIGHT`) and `UiAssistantDock` (`axis: 'VERTICAL'`, `BOTTOM`) consume `createFoldOverlayMachine` and `use:uiFoldGrip` (`< 5px` click toggles `DOCKED <-> FLOATING`; `>= 5px` drag clamps rail slide or floating reposition with click suppression).
2. **Permanent `OVERLAY_HOVER` Corridor Lock**: Expanding `LEFT_EDGE`, `RIGHT_EDGE`, or `UiAssistantDock` (`position: fixed`, `z-[36]` / `z-[38]`, `shadow-xl`) produces strictly `0px` displacement on `--ui-safe-top/bottom/left/right` and `WORLD_CANVAS` width/height in both Calm and Studio HUD modes.
3. **Bounded Multi-Paragraph Tooltips (`UiCyberTooltip`)**: Parse `\n\n` into `<p>` blocks, `\n` into `<br />`, optional bold title header, and `[Key]` shortcut badges inside a `ResizeObserver`-synced `UiChamferFrame` (`max-w-[20rem] min-w-[8rem] whitespace-normal break-words text-left leading-[1.45]`). Post-layout viewport clamping guarantees `0px` text overflow and `>= 8px` viewport edge margin across `390px–2560px`.
4. **Assistant Transcript & CTA Discipline**: Keep sticky non-scrolling `assistant-transcript-header` cleanly separated from scrollable `assistant-timeline` (`pt-3`, `0px` top badge clip), render every `[OK]`/`[ERR]` tool execution receipt as a discrete `assistant-tool-chip`, and derive primary CTA deterministically from `hasBuiltOnce || messages.length > 0` (`Build` -> `Send`).
5. **Reciprocal Toggle & Unified Lifecycle Pod**: `CalmTopStrip` and Studio HUD `TOP_CENTER` share a centered $X = 50\text{vw}$ anchor ($\Delta x \le 16\text{px}, \Delta y \le 8\text{px}$) and consume one shared `ProjectLifecyclePod` (`Save` + `Reset` popover).
6. **Unambiguous Edge Rails**: Separate navigation tabs from `⋮⋮` (`edge-grip-*`) via `edge-rail-divider-*` with zero redundant bottom rail buttons.
7. **All 16 Package Exports**: Consume `@chronos-ui/svelte` or granular subpaths (`./tokens`, `./wire`, `./input`, `./motion`, `./cursor`, `./machines`, `./atoms`, `./forms`, `./molecules`, `./organisms`, `./modals`, `./assistant`, `./canvas`, `./manifest`, `./styles.css`).

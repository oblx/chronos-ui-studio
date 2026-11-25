# Sprint 17 — `v0.1.1` Bespoke Cursors, Motion Choreography, IDB History & Control Matrix

Author: `Oblx <code@oblx.dev>` | Release Lock: `@chronos-ui/svelte` (`v0.1.1`, MIT License)

## Delivered Scope

1. **Bespoke 21-State CSS Cursor Silhouettes (`cursor.silhouettes.ts`)**: Replaced recycled arrow+badge cursor stamps with 21 genuinely distinct `32x32` architectural silhouettes and calibrated `(hx, hy)` hotspots across all 4 built-in packs and upgraded `cursor.synthesizer.ts`.
2. **Universal Thin Themed Scrollbars, `.ui-ctl` State Matrix & Configurable Controls (`control.tokens.ts`)**: Added theme-bound thin scrollbars (`scrollbar-width: thin`, `::-webkit-scrollbar*`), explicit `inactive/hover/active/focus-visible/disabled` states, and persisted `controlConfig` (`buttonConfig`, `formConfig`) editable via Settings and `ui_configure_controls`.
3. **IndexedDB-Only Undo/Redo History Ring & Permanent Controls (`history.idb.ts`, `ProjectLifecyclePod`)**: Added dedicated `chronos_ui_history_v1` IndexedDB store (`default: 5`, bounded `1..128`), permanent disabled-aware `[ Undo ]` / `[ Redo ]` controls in Calm and Studio HUD, `Ctrl+Y` redo shortcut, Settings slider, and `ui_undo` / `ui_redo` / `ui_set_history_limit`.
4. **4-Phase Event-Driven Modal Lifecycle & 250ms ASC HUD Boot Reveal (`modal.machine.svelte.ts`, `hud.sequence.svelte.ts`)**: Implemented `CLOSED -> OPENING -> OPEN -> CLOSING -> CLOSED` exit-safe modal transitions emitting `UI_MODAL_OPENED`/`UI_MODAL_CLOSED`, lazy-mounted 9-zone ASC HUD reveal via `UI_REVEAL_ZONE`, Settings `[ Replay HUD Boot Sequence ]`, and `ui_replay_hud_sequence`.
5. **Priority `infoLevel (0–100)` Tooltip Engine (`tooltip.machine.svelte.ts`)**: Added `data-ui-tip-level` filtering (`Silent | Essential | Standard | Guided | Verbose`, default `60`, disabled safety tips `<= 20`), Settings slider, and `ui_set_tooltip_info_level`.
6. **100% Real-Action Header Intents, 9/10 Folder Decongestion & Sub-3s `qa:fast`**: Wired live `Workbench`/`Tokens`/`Decks`/`Twin MCP` (`/api/mcp/manifest` + `SERVER_MANIFEST_SYNCED`) transitions, decongested all 7 near-cap folders to `<= 8` files, and added `--skipLibCheck` to `qa:fast`.

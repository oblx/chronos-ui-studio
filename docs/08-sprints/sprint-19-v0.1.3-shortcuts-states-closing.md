# Sprint 19 — `v0.1.3` (`v0.1.x` Closing Seal: Shortcuts, SVG-Native 5-State Controls & Time-Scale Calibration)

Author: `Oblx <code@oblx.dev>` | Release: `@chronos-ui/svelte` `0.1.3` | Date: `2026-11-28`

## 1. Audited `v0.1.2` Seams Closed in `v0.1.3`

1. **Unified Declarative Shortcut Registry & `Ctrl/Cmd+K` Global Search Palette**:
	- Created `packages/chronos-ui/src/input/shortcuts.registry.ts` (`CANONICAL_SHORTCUTS` with 13 bindings, `getEffectiveShortcuts`, `findShortcutById`, `formatShortcutBadge`) and `shortcuts.engine.ts` (`canonicalizeChordString`, `normalizeKeyboardEventChord`, `isEditableInputTarget`, `validateShortcutRegistry`, `resolveShortcutForEvent`, `attachGlobalShortcutDispatcher`).
	- Reserved `Ctrl/Cmd+K` (`Mod+KeyK`, `allowInInput: true`) for `GlobalSearchModal.svelte` (`UI_OPEN_MODAL` `global-search`) across 6 categories (`COMMANDS`, `COMPONENTS`, `TOME`, `TOOLS`, `NODES`, `PRESETS`), and reassigned `Studio HUD` toggle to `Ctrl/Cmd+Shift+H` (`Mod+Shift+KeyH`, `allowInInput: false`).
	- Added collision-checked `UI_REBIND_SHORTCUT` overrides in `Settings -> Input & Modality` plus `ui_list_shortcuts` and `ui_open_global_search` (`52` Dual-Spine MCP tools).
2. **SVG-Native 5-State Interactive Controls (`NO_RECTANGULAR_BORDER_ON_CORNERED_CTL`)**:
	- Eliminated rectangular CSS `border`, `outline`, and rectangular `box-shadow` rings from `.ui-ctl`, `.ui-field-wrap`, `.ui-field-input`, and `.ui-badge-host` in `styles.css`.
	- Upgraded `UiVectorBorder.svelte` to render `<path data-ui-contour-path="true">` and `<path data-ui-focus-halo="true">` so `inactive`, `hover`, `active`, `focus-visible`, and `disabled` states follow the exact chamfered or rounded vector polygon.
3. **True-Ratio Human Time-Scale Calibration (`timescale.math.ts` & `UiWireDagGraph.svelte`)**:
	- Restored true linear scaling (`clamp(realDurationMs * multiplier, minVisibleMs, maxTravelMs)`, yielding `375ms -> 1500ms` (`4.0x`) from `2500x -> 10000x` at `0.15ms`) and widened `LOGARITHMIC` separation (`>= 1.6x`) while excluding meta slider/boot intents (`UI_SET_STUDIO_DEFAULT`, `UI_SET_WIRE_TIMESCALE`, `UI_REVEAL_ZONE`) from diluting live packet hop timings.
4. **Main Entry Bundle Slimming (`< 175 kB`), Sub-Archive Hygiene & Atomic `qa:timer`**:
	- Lazy-loaded `UiEventGraph` in `UiLiveNodeWidget.svelte`, split `chronos-graph` and `studio-engine` in `vite.config.ts`, rotated `docs/08-sprints/archive/v0.0.x/` and `studio/src/tests/legacy/v00x/` so `0` folders reach `9–10` files, added atomic `qa:timer -- sprint --fresh`, and verified `1440x900,1280x800,390x844` in Stage 4 `qa:harness`.

# Active Sprint Tracker (`v0.0.12` — `current.md`)

Author: `Oblx <code@oblx.dev>` | Release Lock: `@chronos-ui/svelte` (`v0.0.12`, Pre-0.1.0 Architecture & Sensory Polish Seal)
Archive Spec: `docs/08-sprints/sprint-15-v0.0.12-calm-motion-dag-seal.md`
Rotated Lineage: `docs/08-sprints/archive/sprint-04..09`

## Hard Invariants (Zero Tolerance)

1. Tabs (`\t`) only; function $\le 42\text{ LoC}$; code $\le 150\text{ LoC}$; docs $\le 100\text{ LoC}$ (zero fenced code blocks).
2. Folders $\le 10$ files; 100% barrelled (`index.ts`); `0` runtime deps in `packages/chronos-ui/`; `0` multi-level `../..` imports.
3. `0` hardcoded UI copy/literals/colors/transitions (`STUDIO_UI_COPY`, `--ui-dur-*`); `0` Unicode emojis; humble `.svelte` views; strict acyclic event DAG.
4. Active `qa:timer` phase checkpoints (`GREEN <= 25m`, `AMBER 25-32m`, `FREEZE_SCOPE 32-38m`, `HARD_STOP >= 38m`) and `0` agent PNG screenshots.

## v0.0.12 Pre-0.1.0 Forensic Seal Checklist

- **Calm Boot, Symmetric Top Bar & Reciprocal Framing**:
	- Unconditional Calm Mode boot (`studioChromeVisible = false`, folded bilateral `UiChamferFrame` mini-rails, `Studio HUD` centered on $X = 50\text{vw}$, `TOP_CENTER` primary fill reserved exclusively for the active view tab).
	- `fitNodesToSafeCorridor()` + balanced safe-corridor constants guaranteeing `0px` top/right clipping and $\Delta x \le 12\text{px}, \Delta y \le 12\text{px}$ center constancy.
- **Stage-Scoped Pan/Zoom, Coalesced Wire & `BOTTOM_CENTER` Assistant Dock**:
	- `uiDragPan` strictly bounded to `[data-ui-stage-viewport]` with `createStagePanZoomCoalescer()` emitting one `UI_STAGE_PAN_ZOOM` record per gesture (`pointerup` / `180ms` wheel settle).
	- Flush `BOTTOM_CENTER` `UiAssistantDock` (`bottom: 0.75rem`, zero border straddle) wired to `hud-assistant-dock` Tour Step 4 drill CTA.
- **ADHD-Friendly Motion (`CALM_SLOW`), Universal Modal Grow/Shrink, CS6 Wireframe & 2D Wire DAG**:
	- Global `CALM_SLOW` (`280/440/580/4200ms`) CSS token system with sensory toggles; zero hardcoded transition durations across `packages/chronos-ui/src/` and `studio/src/client/`.
	- State-preserving `UiModalShell` Grow/Shrink (`Alt+M` / double-click), collision-free CS6 `WireframeSkeletonModal`, 15-node 4-column `UiWireDagGraph`, and `42`-tool MCP parity (`ui_set_motion_profile`, `ui_modal_toggle_expand`).

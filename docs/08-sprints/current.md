# Active Sprint Tracker (`v0.0.9` — `current.md`)

Author: `Oblx <code@oblx.dev>` | Release Lock: `@chronos-ui/svelte` (`v0.0.9`)
Archive Spec: `docs/08-sprints/sprint-12-v0.0.9-harness-tome-realtime.md`

## Hard Invariants (Zero Tolerance)

1. Tabs (`\t`) only; function $\le 42\text{ LoC}$; code $\le 150\text{ LoC}$; docs $\le 100\text{ LoC}$ (zero fenced code blocks).
2. Folders $\le 10$ files; 100% barrelled (`index.ts`); `0` runtime deps in `packages/chronos-ui/`; `0` multi-level `../..` imports.
3. `0` hardcoded UI copy/literals/colors (`STUDIO_UI_COPY`); `0` Unicode emojis; humble `.svelte` views; strict acyclic event DAG.
4. Active `qa:timer` phase checkpoints (`GREEN <= 25m`, `AMBER 25-32m`, `FREEZE_SCOPE 32-38m`, `HARD_STOP >= 38m`) and `0` agent PNG screenshots.

## v0.0.9 Spec Checklist

- **P0/P1 — 25m Clock Guard, Zero-Screenshot `qa:harness` & Backend Persistence**:
	- Re-calibrated `qa_timer.ts` (`25m / 32m / 38m`, `formatClockBanner()`), added `bun run qa:harness` driving `playwright-cli` (`run-code`, `console`, `close` in `try/finally`, `0` screenshots).
	- Added `ui_projects.has_built_once`, `STUDIO_DEFAULTS_VERSION = 2` legacy `0.75rem -> 0.5rem` auto-migration, and realtime collab event fan-out in `ws.collab.ts`.
	- Upgraded `compile_tome_ssg.ts` to full Markdown-to-AST inline tokens + balanced folios (`0` backticks, `0` duplicated intro).
- **P2/P3 — Reactive Density, Click-to-Dock Grip, Live-Preview Station Builder, Dual-Page Tome & Lazy Modals**:
	- `UI_SET_LAYOUT_DENSITY` (`CALM | BALANCED | TACTICAL`) drives live chrome, palette, drawers & safe corridors; `session.persist.ts` restores workspace state across reload.
	- `UiAssistantDock` persists `Build -> Send` (`hasBuiltOnce`) and toggles `FLOATING <-> DOCKED` on click via `assistant-drag-grip` (`UI_ASSISTANT_TOGGLE_FLOAT`).
	- `StationBuilderModal` mounts persistent `StationLivePreview.svelte`, exposes all 8 `MOTION_PRESETS`, and binds live hull props to `UiModalShell`.
	- `FieldTomeModal` renders centered dual-page open book with TOC, MathML concept card, AST folio reader, keyboard/swipe pagination, and zero `Test 3s Zero-CLS Lock`.
	- `UiMathFormula` renders native `<math>` MathML (`N_0 e^{rt}` in Bio-Telemetry Lab); `StudioModalStack` lazy-imports all 9 modals (`< 350 kB` main Vite entry chunk).

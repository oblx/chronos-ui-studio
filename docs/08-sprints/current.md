# Active Sprint Tracker (`v0.1.0` — `current.md`)

Author: `Oblx <code@oblx.dev>` | Release Lock: `@chronos-ui/svelte` (`v0.1.0`, Public Minor Release + In-Place Review Seal)
Archive Spec: `docs/08-sprints/sprint-16-v0.1.0-public-release.md`
Rotated Lineage: `docs/08-sprints/archive/sprint-04..09`

## Hard Invariants (Zero Tolerance)

1. Tabs (`\t`) only; function $\le 42\text{ LoC}$; code $\le 150\text{ LoC}$; docs $\le 100\text{ LoC}$ (zero fenced code blocks).
2. Folders strictly $< 10$ files (target $\le 8$, hard cap $\le 10$, warning at `9–10`); 100% barrelled (`index.ts`); `0` runtime deps in `packages/chronos-ui/`; `0` multi-level `../..` imports.
3. `0` hardcoded UI copy/literals/colors/transitions (`STUDIO_UI_COPY`, `--ui-dur-*`); `0` Unicode emojis; humble `.svelte` views; strict acyclic event DAG.
4. Scoped-default QA split ($\le 15\%$ sprint budget): `qa:fast` ($\le 2.5\text{s}$ warm via `studio/data/.tsbuildinfo`) and `qa:harness` (`--scenario=latest`, inline console capture) run latest delta only; `--scenario=all` / `qa:release` reserved for one single pre-signoff pass.

## v0.1.0 In-Place Architecture & Craftsmanship Review Seal Checklist

- **Bounded Multi-Paragraph Vector Tooltips (`UiCyberTooltip` & `parseTooltipContent`)**:
	- Parses `\n\n` paragraphs, `\n` line breaks, bold headers, and `[Key]` shortcut badges inside a `ResizeObserver`-synced `UiChamferFrame` (`max-w-[20rem] min-w-[8rem] whitespace-normal break-words`), proving $0\text{px}$ overflow on `Synth Audio Console` and $\ge 8\text{px}$ viewport margin.
- **Unified Configurable `HORIZONTAL | VERTICAL` Overlay-Fold Engine (`fold.overlay.svelte.ts`)**:
	- Single `createFoldOverlayMachine` + `use:uiFoldGrip` powers `UiEdgeDrawer` (`HORIZONTAL`) and `UiAssistantDock` (`VERTICAL`, `z-[38]`, `shadow-xl`), locking `WORLD_CANVAS` width and height delta to strictly `0px` across Calm and Studio HUD modes.
- **Assistant Transcript, Tool Chips & `Build -> Send` CTA Determinism**:
	- Sticky non-scrolling `assistant-transcript-header` + `pt-3` scrollable `assistant-timeline` (`0px` top `USER` badge clip), discrete flex-wrapped `[OK]` `assistant-tool-chip` rows, and deterministic `hasBuiltOnce || messages.length > 0` CTA persisted across reloads and cleared cleanly on workspace clean.
- **Six Saturated Folders Decongested & Full Docs/Skill Freshness**:
	- `tokens/geometry/`, `wire/core/`, `organisms/{overlays,wire-observatory}/`, `panels/perimeter/`, `state/handlers/`, and `core/assistant/` drop all 6 saturated folders to `6–7` files; all 5 `docs/skills/*` and `docs/01..06` synced to `v0.1.0` with `DOCS_AND_SKILL_FRESHNESS` enforced in `qa_audit.ts`.

# Sprint 16 — `v0.1.0` Public Release & In-Place Review Seal

Author: `Oblx <code@oblx.dev>` | Release Lock: `@chronos-ui/svelte` (`v0.1.0`) | License: `MIT`

## Base `v0.1.0` Public Release Closures

1. **Scoped-Default QA Engine**: `qa_verify.ts` and `qa_harness.ts` default to scoped `v0.1.0` latest delta (`v0100_public_release.test.ts` and `--scenario=latest` @ `1440x900`), reserving `qa:release` / `--scenario=all` for one pre-signoff pass.
2. **Reciprocal Toggle Constancy & Unified `ProjectLifecyclePod`**: Symmetric 3-column Studio HUD `TOP_CENTER` aligns `Calm View` with `CalmTopStrip` `Studio HUD` at $X = 50\text{vw}$ ($\Delta x \le 16\text{px}, \Delta y \le 8\text{px}$, `0px` `Twin MCP` clip); both modes share `ProjectLifecyclePod` (`Save` + `Reset` popover).
3. **Unambiguous Edge Rails & Public Packaging Seal**: Pruned redundant rail button beneath `⋮⋮` with `edge-rail-divider-*`, added MIT `LICENSE`, standalone `packages/chronos-ui/README.md`, `CHANGELOG.md`, all `16` package exports, and `.d.ts` emit verification.

## In-Place Architecture, Fold-Overlay & Craftsmanship Review Seal (`v0.1.0`)

1. **Bounded Multi-Paragraph Tooltips (`UiCyberTooltip`)**: Replaced `whitespace-nowrap` with `parseTooltipContent` (`\n\n` paragraphs, `\n` line breaks, bold title, `[Key]` badges) inside a `ResizeObserver`-synced `UiChamferFrame` (`max-w-[20rem] min-w-[8rem]`) + post-layout viewport clamping (`0px` overflow on `Synth Audio Console`).
2. **Unified `HORIZONTAL | VERTICAL` Overlay-Fold Engine (`fold.overlay.svelte.ts`)**: Unified `UiEdgeDrawer` (`HORIZONTAL`) and `UiAssistantDock` (`VERTICAL`, `z-[38]`, `shadow-xl`) on `createFoldOverlayMachine` + `use:uiFoldGrip`, locking `--ui-safe-*` and `WORLD_CANVAS` width/height delta to strictly `0px` when unfolding chat or drawers.
3. **Assistant Transcript, Tool Chips & `Build -> Send` Sync**: Separated sticky `assistant-transcript-header` from `pt-3` scrollable `assistant-timeline` (`0px` top clip), rendered discrete `[OK]` `assistant-tool-chip` rows, and synced primary CTA (`hasBuiltOnce || messages.length > 0`) across submits, reloads, and SQLite workspace cleans.
4. **Six Saturated Folders Decongested (`10/10` -> `6–7/10`)**: Created `tokens/geometry/`, `wire/core/`, `organisms/overlays/`, `panels/perimeter/`, `state/handlers/`, and `core/assistant/` barrels — zero directories at `10/10` repository-wide.
5. **Active Skill & Core Handbook Freshness**: Updated all 5 `docs/skills/*/SKILL.md` to `version: "0.1.0"`, refreshed `docs/01`–`docs/06`, `README.md`, and `packages/chronos-ui/README.md`, and added `DOCS_AND_SKILL_FRESHNESS` + near-cap folder warnings to `qa_audit.ts`.
6. **Sub-2.5s Inner-Loop QA & Batched Console Harness**: Switched `qa_verify.ts` to local `node_modules/.bin/tsc` + `studio/data/.tsbuildinfo` (ignored in `.gitignore`) and moved Playwright console/pageerror capture inline into the single batched `run-code` pass.

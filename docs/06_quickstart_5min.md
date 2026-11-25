# 5-Minute Newcomer Quickstart

Author: Oblx <code@oblx.dev> | Package Lock: `@chronos-ui/svelte` (`v0.1.1`, MIT License)

## Minute 1 — Install and Launch Locally

1. Clone the repository and run `bun install` (zero runtime dependencies exist inside `@chronos-ui/svelte`).
2. Start the local workbench with `bun run dev` and open `http://localhost:3000`. Studio boots unconditionally in Calm Mode with bespoke 21-state `Cyber Reticle` cursor silhouettes, thin theme-bound scrollbars, permanent disabled-aware `[ Undo ]` / `[ Redo ]`, and flush `UiAssistantDock` — zero API keys required.

## Minute 2 — Launch Samples or Converse with Builder Assistant

1. Hover any starter sample chip (`Neon Ops Command Deck`, `Bio-Telemetry Lab`, `Synth Audio Console`, `Writer's Focus Cockpit`, or `Shape Matrix Lab`) to preview wrapped multi-paragraph vector tooltips gated by your `0–100` tooltip detail level, or click one to assemble live Svelte 5 components.
2. Unfold `UiAssistantDock` (`OVERLAY_HOVER`, $0\text{px}$ canvas shrinkage), use its permanent `[ Undo ]` / `[ Redo ]` triggers backed by browser IndexedDB (`default: 5`, `max: 128`), and submit prompts to inspect discrete `[OK]` tool chips.

## Minute 3 — Staged Studio HUD, Motion Engine & Controls

1. Click the centered `Studio HUD` / `Calm View` anchor ($X = 50\text{vw}$, $\Delta x \le 16\text{px}, \Delta y \le 8\text{px}$) to watch all 9 perimeter zones reveal sequentially every `250ms` via `UI_REVEAL_ZONE`, with `Workbench`, `Tokens`, `Decks`, and `Twin MCP` wired to live state and server manifest telemetry.
2. Open `Settings -> Visuals & Motion` (animated via the 4-phase `OPENING -> OPEN -> CLOSING -> CLOSED` modal FSM) to tune button/form control variants in the live sandbox, calibrate per-surface motion timing, adjust `Tooltip Detail Level (0–100)`, or click `Replay HUD Boot Sequence`.

## Minute 4 — 21-State Cursor Silhouettes & 48-Tool MCP Parity

1. Open `Cursor Studio` to switch across 4 curated 21-state silhouette packs (`Cyber Reticle`, `Archival Nib`, `Tactical Brass`, `Minimal Precision`), upload a `<= 128 KB` PNG, calibrate or reset per-state hotspots, or derive all 20 secondary states.
2. Mint a CLI PAT (`bun run mcp:token`) or run `bun run mcp:stdio` to drive all `48` parity tools headlessly or over live Twin sessions.

## Minute 5 — Granular Subpaths, Lean QA & Export

1. Import `@chronos-ui/svelte` or any of its `13` granular subpath barrels (`./tokens`, `./wire`, `./machines`, `./atoms`, `./organisms`, `./assistant`, etc.) with verified `.d.ts` declarations.
2. Run `bun run qa:fast` (`--skipLibCheck` incremental check) and `bun run qa:harness --json` (scoped `--scenario=latest`) during development, reserving `bun run qa:release` for final sign-off.

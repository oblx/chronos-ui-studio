# Active Sprint Tracker (`v0.1.1` — `current.md`)

Author: `Oblx <code@oblx.dev>` | Release Lock: `@chronos-ui/svelte` (`v0.1.1`, Motion, Bespoke Cursors & IDB History Release)
Archive Spec: `docs/08-sprints/sprint-17-v0.1.1-motion-cursors-history.md`
Rotated Lineage: `docs/08-sprints/archive/sprint-04..11`

## Hard Invariants (Zero Tolerance)

1. Tabs (`\t`) only; function $\le 42\text{ LoC}$; code $\le 150\text{ LoC}$; docs $\le 100\text{ LoC}$ (zero fenced code blocks).
2. Folders strictly $< 10$ files (target $\le 8$, hard cap $\le 10$, warning at `9–10`); 100% barrelled (`index.ts`); `0` runtime deps in `packages/chronos-ui/`; `0` multi-level `../..` imports.
3. `0` hardcoded UI copy/literals/colors/transitions (`STUDIO_UI_COPY`, `--ui-dur-*`); `0` Unicode emojis; humble `.svelte` views; strict acyclic event DAG.
4. Scoped-default QA split ($\le 15\%$ sprint budget): `qa:fast` ($\le 3\text{s}$ warm via `--skipLibCheck` + `studio/data/.tsbuildinfo`) and `qa:harness` (`--scenario=latest`) run latest delta only; `qa:release` reserved for one pre-signoff pass.

## v0.1.1 Release Checklist

- **Bespoke 21-State CSS Cursor Silhouettes (`cursor.silhouettes.ts`)**: 21 genuinely distinct `32x32` architectural silhouettes with calibrated hotspots and concrete theme hexes across 4 packs.
- **Universal Thin Scrollbars & `.ui-ctl` Interactive State Matrix**: Thin theme-bound scrollbars and persisted `controlConfig` (`buttonConfig`, `formConfig`) across Settings and `ui_configure_controls`.
- **IndexedDB-Only Undo/Redo (`default: 5`, `max: 128`)**: Permanent disabled-aware `[ Undo ]` / `[ Redo ]` in `ProjectLifecyclePod` backed by `chronos_ui_history_v1`.
- **4-Phase Modal Lifecycle & 250ms ASC HUD Boot**: `CLOSED -> OPENING -> OPEN -> CLOSING -> CLOSED` modals + lazy 9-zone ASC reveal (`UI_REVEAL_ZONE`, `[ Replay HUD Boot Sequence ]`).
- **Priority `infoLevel (0–100)` Tooltips & Real Header Actions**: Global `tooltipInfoLevel` filter + live `Workbench` / `Tokens` / `Decks` / `Twin MCP` (`SERVER_MANIFEST_SYNCED`) intents + `48` parity MCP tools.

---
name: chronos-clean-onion-audit
description: Execute deep recursive audits across packages/chronos-ui/ and studio/src/ to eradicate hardcoded hex/numeral literals, duplicate/triplicate/quadruplicate helpers, dead exports, and Clean Onion boundary violations sorted by S0->S1->S2 blast radius. Use during sprint reviews, refactoring passes, or static debt cleanup.
license: MIT
compatibility: Bun >= 1.4, TypeScript >= 5.8, Svelte 5
metadata:
  author: Oblx <code@oblx.dev>
  version: "0.0.9"
allowed-tools: view_file replace_file_content multi_replace_file_content run_command
---

# Clean Onion & Debt Eradication Audit

Review recent sprints skeptically, hunt structural shortcuts, and eliminate technical debt at the root before leaf UI edits.

## Hard Static Invariants (`studio/src/workers/qa_audit.ts`)

1. **Tabs & Size Limits**: Tabs (`\t`) only everywhere; functions $\le 42\text{ LoC}$; code files $\le 150\text{ LoC}$; docs $\le 100\text{ LoC}$ (zero fenced blocks); folders $\le 10$ files; `100%` `index.ts` barrelled.
2. **Zero-`../..` Canonical Aliases (`NO_DEEP_RELATIVE_IMPORTS`)**: Ban every multi-level `../..` relative import across `packages/chronos-ui/src/` and `studio/src/`; always import via `@chronos-ui/svelte/*`, `@ui/*`, or `@studio/*`.
3. **SSOT Tokens Over Magic Literals**: Ban non-palette hex colors outside `theme.palettes.ts` and `cursor.presets.ts`; bind viewports to `DEFAULT_VIEWPORT`, limits to `CURSOR_LIMITS`, cuts to `DEFAULT_CORNER_CUT_REM`/`DEFAULT_STATION_CORNER_CUT_REM`/`DEFAULT_CONTROL_CORNER_CUT_REM`, and clamping to `clampControlCutPx`.
4. **Single-Owner Helpers**: Never duplicate `fetch`/JSON wrappers (`http.client.ts`) or manual `Response.json`/`req.json` handling (`http.helpers.ts`).

## Recursive Audit Protocol (Blast-Radius Order)

1. **Scan**: Sweep `packages/` and `studio/` for `../..` imports, non-palette hex literals, repeated response/fetch boilerplate, magic fallback viewports, duplicated clamp math, and unreferenced exports.
2. **Triage S0 -> S1 -> S2**:
   - **S0 (Core & Tokens)**: Consolidate geometry/token/constant SSOT first (`packages/chronos-ui/src/tokens/`).
   - **S1 (APIs, Routes & Engines)**: Collapse client `http.client.ts`, server `http.helpers.ts`, Drizzle mappers, and synthesizer defaults.
   - **S2 (Leaf Views & Docs)**: Rewire Svelte modals/panels onto tokens, sync `README.md` / `docs/**/*.md` (without deleting `docs/08-sprints/`), and run `bun run qa:fast` + `bun run qa:release`.

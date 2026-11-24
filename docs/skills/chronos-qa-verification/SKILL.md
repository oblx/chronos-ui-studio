---
name: chronos-qa-verification
description: Operate the scoped-default QA engine (qa:fast, qa:delta, qa:release / --full-battery), the 25m/32m/38m qa:timer sprint clock guard, :memory: Drizzle SQLite unit suites, and the zero-screenshot scripted qa:harness browser CLI via playwright-cli. Use when verifying builds, timing sprint phases, or running release gates.
license: MIT
compatibility: Bun test, svelte-check, tsc, Vite, playwright-cli
metadata:
  author: Oblx <code@oblx.dev>
  version: "0.1.0"
allowed-tools: run_command view_file compile_applet lint_applet
---

# Scoped-Default QA Engine, 25m Clock Guard & Zero-Screenshot `qa:harness`

Validate every change inside the `25m` soft target / `32m` scope-freeze / `38m` hard stop budget while keeping QA time under `20%` of sprint duration by running scoped deltas during iteration and reserving `--full-battery` for one single pre-signoff pass.

## Phase-Gated Sprint Timer (`studio/src/workers/qa_timer.ts`)

1. Start budget clock: `bun run qa:timer -- start 25`.
2. Check phase boundaries: `bun run qa:timer -- check --phase="<phase>"` reporting `GREEN <= 25m`, `AMBER 25-32m`, `FREEZE_SCOPE 32-38m`, and `HARD_STOP >= 38m`.
3. **Edge Hook**: `qa:fast`, `qa:harness`, `qa:delta`, and `qa:release` automatically print `formatClockBanner()` and append timed laps.

## 4-Stage Scoped-Default Verification Pipeline

1. **Stage 1 (`qa_audit.ts`)**: Incremental SHA-256 cached audit in `qa:fast`; uncached full scan in `qa:delta`/`qa:release` enforcing tabs, LoC caps (`<= 150` code, `<= 42` fn, `<= 100` doc), `<= 10` files/dir, 100% barrels, all `13` package subpath exports, MIT licensing, and AgentSkills frontmatter.
2. **Stage 2 (`bun run qa:fast` — Scoped Default `< 8s`)**: Cached `qa_audit` + `tsc --noEmit` + `v0_1_0_release_seal.test.ts` (including external-consumer subpath import smoke test and `.d.ts` emit verification).
3. **Stage 3 (`bun run qa:release` / `--full-battery` — Single Pre-Signoff Pass)**: Full uncached `qa_audit`, all `15` `:memory:` SQLite test suites, AST `compile_tome_ssg.ts`, package `.d.ts` emit check, and production `vite build`.
4. **Stage 4 (`bun run qa:harness`)**: Defaults to scoped delta (`calm-density @ 1440x900`, `< 8s`) verifying reciprocal toggle anchor constancy ($\Delta x \le 16\text{px}, \Delta y \le 8\text{px}$), unified `ProjectLifecyclePod`, edge-rail grouping, overlay drawer width invariance, and `32x32` cursor decode; pass `--full-battery --json` once before signoff for all `8` scenarios across `1440x900,390x844` with `0` console errors, `0` screenshots, and clean `proj-genesis` teardown.

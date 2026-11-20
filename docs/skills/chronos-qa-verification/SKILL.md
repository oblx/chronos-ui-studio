---
name: chronos-qa-verification
description: Operate the 3-tier lean QA harness (qa:fast, qa:delta, qa:release), the edge-invocable qa:timer 45m sprint budget tracker, :memory: Drizzle SQLite unit suites, and headless Chromium visual/geometry checks via playwright-cli. Use when verifying builds, timing sprint steps, or running release gates.
license: MIT
compatibility: Bun test, svelte-check, tsc, Vite, playwright-cli
metadata:
  author: Oblx <code@oblx.dev>
  version: "0.0.7"
allowed-tools: run_command view_file compile_applet lint_applet
---

# 3-Tier Lean QA & Sprint Timer Harness

Validate every change efficiently inside the 45-50 minute sprint budget using tiered gates and live edge-invoked lap timing.

## Edge-Invocable Sprint Timer (`studio/src/workers/qa_timer.ts`)

1. Start budget clock: `bun run qa:timer -- start 45`.
2. Record explicit step laps: `bun run qa:timer -- lap <step-label>` or inspect live remaining minutes with `bun run qa:timer -- status`.
3. **Edge Hook**: While active, `bun run qa:fast`, `bun run qa:delta`, and `bun run qa:release` automatically append timed laps (`qa:fast`, `qa:delta`, `qa:release`), printing elapsed time and inter-step deltas.

## 4-Stage Verification Pipeline

1. **Stage 1 (`qa_audit.ts`)**: Incremental SHA-256 cached audit in `qa:fast`; uncached full scan in `qa:delta`/`qa:release` enforcing tabs, LoC caps, non-palette hex ban, barrel discipline, and AgentSkills YAML frontmatter checks.
2. **Stage 2 (`qa:fast` / `qa:delta`)**: `tsc --noEmit`, `svelte-check`, scoped `v007` tests, and `vite build`.
3. **Stage 3 (`qa:release`)**: All 9 `:memory:` SQLite test suites (`CHRONOS_DB_PATH=:memory:`), `compile_tome_ssg.ts`, and full production `vite build`.
4. **Stage 4 (Browser E2E)**: Headless Chromium across `390x844` and `1440x900` inspecting Pure-Flex modal centering, 21-state cursor cascade, true-stroke SVG borders, concentric `ROUND` arcs, unclipped HUD pods, and `0` console errors.

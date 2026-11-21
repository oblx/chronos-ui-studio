---
name: chronos-qa-verification
description: Operate the 3-tier lean QA harness (qa:fast, qa:delta, qa:release), the 25m/32m/38m qa:timer sprint clock guard, :memory: Drizzle SQLite unit suites, and the zero-screenshot scripted qa:harness browser CLI via playwright-cli. Use when verifying builds, timing sprint phases, or running release gates.
license: MIT
compatibility: Bun test, svelte-check, tsc, Vite, playwright-cli
metadata:
  author: Oblx <code@oblx.dev>
  version: "0.0.12"
allowed-tools: run_command view_file compile_applet lint_applet
---

# 3-Tier Lean QA, 25m Clock Guard & Zero-Screenshot `qa:harness`

Validate every change inside the `25m` soft target / `32m` scope-freeze / `38m` hard stop budget using tiered gates and zero-screenshot headless Chromium assertions.

## Phase-Gated Sprint Timer (`studio/src/workers/qa_timer.ts`)

1. Start budget clock: `bun run qa:timer -- start 25`.
2. Check phase boundaries: `bun run qa:timer -- check --phase="<phase>"` reporting `GREEN <= 25m`, `AMBER 25-32m`, `FREEZE_SCOPE 32-38m`, and `HARD_STOP >= 38m`.
3. **Edge Hook**: `qa:fast`, `qa:harness`, `qa:delta`, and `qa:release` automatically print `formatClockBanner()` and append timed laps.

## 4-Stage Zero-Screenshot Verification Pipeline

1. **Stage 1 (`qa_audit.ts`)**: Incremental SHA-256 cached audit in `qa:fast`; uncached full scan in `qa:delta`/`qa:release` enforcing tabs, LoC caps (`<= 150` code, `<= 42` fn, `<= 100` doc), `<= 10` files/dir, 100% barrels, `NO_DEEP_RELATIVE_IMPORTS`, and AgentSkills frontmatter.
2. **Stage 2 (`qa:fast` / `qa:delta`)**: `tsc --noEmit`, `svelte-check`, scoped `v011` tests, and code-split `vite build` (`< 250 kB` main entry chunk).
3. **Stage 3 (`qa:release`)**: All 13 `:memory:` SQLite test suites, AST `compile_tome_ssg.ts`, and full production `vite build`.
4. **Stage 4 (`bun run qa:harness`)**: Zero-screenshot, zero-pollution headless Chromium via pre-installed `playwright-cli` (`--scenario=all --viewports=1440x900,390x844 --json`), asserting Minimal Calm launch, unified edge rails, `Image.decode()` `32x32` concrete-hex cursor + live polarity swap, safe-corridor containment + `[ Reject All ]`, `Twin MCP` width, and `finally` `proj-genesis` teardown (`0` leftover nodes, `0` console errors, `0` PNG screenshots).

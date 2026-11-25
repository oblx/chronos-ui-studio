---
name: chronos-qa-verification
description: Operates the scoped-latest-by-default QA engine, sub-3s warm qa:fast incremental check with --skipLibCheck, batched single-session Playwright harness, and strict 85/15 sprint clock budget.
license: MIT
metadata:
  author: Oblx <code@oblx.dev>
  version: "0.1.1"
---

# Chronos Scoped-Default QA & Sprint Clock Budget (`v0.1.1`)

Use this skill to verify changes rapidly while enforcing the `>= 85%` implementation / `<= 15%` QA budget split (`25m` target, `32m` freeze, `38m` hard stop).

## Verification Tiers & Hard Invocation Caps

1. **Inner-Loop Gate (`bun run qa:fast`, target `<= 3s` warm)**: Runs cached `qa_audit` + `tsc --noEmit --incremental --skipLibCheck --tsBuildInfoFile studio/data/.tsbuildinfo` + scoped `v0101_motion_cursors_history.test.ts`. Cap at `<= 2` invocations during active implementation.
2. **Scoped Live Browser Harness (`bun run qa:harness --json`)**: Defaults to `--scenario=latest` at `1440x900` inside a single Chromium session with inline `console`/`pageerror` capture, zero agent screenshots (`screenshotsTaken === 0`), and verified `cleanTeardown === true`. Asserts permanent Undo/Redo round-trip, 4-phase modal transition duration, 250ms ASC HUD reveal replay, thin scrollbar theming, bespoke 32x32 distinct cursors, and real header view actions.
3. **Single Pre-Signoff Full Pass**: Run `bun run qa:release` (full uncached `qa_audit` including `DOCS_AND_SKILL_FRESHNESS`, all `16` test suites, AST SSG Tome, `.d.ts` emit check, and Vite build) ONCE at final sign-off, followed by `compile_applet` + `lint_applet` co-executed together.
4. **Full 8-Scenario Harness (`--scenario=all --json`)**: Reserve for major release sign-off only (`1440x900,390x844`). Never run mid-sprint.
5. **Sprint Clock Discipline**: Start with `bun run qa:timer -- start 25`; record phase laps via `bun run qa:timer -- check --phase="..."`.

---
name: chronos-qa-verification
description: Operates the scoped-latest-by-default QA engine, sub-2.5s warm qa:fast incremental check, batched single-session Playwright harness, and strict 85/15 sprint clock budget.
license: MIT
metadata:
  author: Oblx <code@oblx.dev>
  version: "0.1.0"
---

# Chronos Scoped-Default QA & Sprint Clock Budget (`v0.1.0`)

Use this skill to verify changes rapidly while enforcing the `>= 85%` implementation / `<= 15%` QA budget split (`25m` target, `32m` freeze, `38m` hard stop).

## Verification Tiers & Hard Invocation Caps

1. **Inner-Loop Gate (`bun run qa:fast`, target `<= 2.5s` warm)**: Runs cached `qa_audit` + direct local `tsc --noEmit --incremental --tsBuildInfoFile studio/data/.tsbuildinfo` + scoped `v0100_public_release.test.ts`. Cap at `<= 2` invocations during active implementation.
2. **Scoped Live Browser Harness (`bun run qa:harness --json`)**: Defaults to `--scenario=latest` at `1440x900` inside a single Chromium session with inline `console`/`pageerror` capture, zero agent screenshots (`screenshotsTaken === 0`), and verified `cleanTeardown === true`. Asserts tooltip `overflowPx === 0`, expanded chat `canvasHeightDeltaPx === 0`, unclipped transcript `topClipPx === 0`, discrete `[OK]` tool chips, `Build -> Send` reload persistence, and reciprocal toggle constancy ($\Delta x \le 16\text{px}, \Delta y \le 8\text{px}$).
3. **Single Pre-Signoff Full Pass**: Run `bun run qa:release` (full uncached `qa_audit` including `DOCS_AND_SKILL_FRESHNESS`, all `15` test suites, AST SSG Tome, `.d.ts` emit check, and Vite build) ONCE at final sign-off, followed by `compile_applet` + `lint_applet` co-executed together.
4. **Full 8-Scenario Harness (`--scenario=all --json`)**: Reserve for major release sign-off only (`1440x900,390x844`). Never run mid-sprint.
5. **Sprint Clock Discipline**: Start with `bun run qa:timer -- start 25`; record phase laps via `bun run qa:timer -- check --phase="..."`.

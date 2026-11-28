---
name: chronos-qa-verification
description: Operates the scoped-latest-by-default QA engine, sub-3s warm qa:fast incremental check with --skipLibCheck, multi-viewport Playwright harness, and atomic sprint clock budget.
license: MIT
metadata:
  author: Oblx <code@oblx.dev>
  version: "0.1.3"
---

# Chronos Scoped-Default QA & Sprint Clock Budget (`v0.1.3`)

Use this skill to verify changes rapidly while enforcing the `>= 85%` implementation / `<= 15%` QA budget split (`25m` target, `32m` freeze, `38m` hard stop).

## Verification Tiers & Hard Invocation Caps

1. **Inner-Loop Gate (`bun run qa:fast`, target `<= 3s` warm)**: Runs cached `qa_audit` (`NO_RECTANGULAR_BORDER_ON_CORNERED_CTL`) + `tsc --noEmit --incremental --skipLibCheck --tsBuildInfoFile studio/data/.tsbuildinfo` + scoped `v0103_shortcuts_states_closing.test.ts`. Cap at `<= 2` invocations during active implementation.
2. **Multi-Viewport Live Browser Harness (`bun run qa:harness -- --scenario=latest --viewports=1440x900,1280x800,390x844 --json`)**: Runs inside a single Chromium session across desktop (`1440x900`), compact laptop (`1280x800`), and mobile (`390x844`) with inline `console`/`pageerror` capture, zero agent screenshots (`screenshotsTaken === 0`), and verified `cleanTeardown === true`. Asserts SVG-native 5-state cornered controls (`borderTopWidth === '0px'`, `outlineStyle === 'none'`), `Ctrl+K` Global Search palette, `Ctrl+Shift+H` Studio HUD toggle, `FieldTomeModal` Ch 3 TOC hover-marquee, `1280x800` `TOP_LEFT` zero-clip Reset, true-ratio (`4.0x`) `WireTapModal` `Time-Scale` packet scaling, and `52 TOOLS` MCP sync.
3. **Single Pre-Signoff Full Pass**: Run `bun run qa:release` (full uncached `qa_audit` including `DOCS_AND_SKILL_FRESHNESS`, all 18 test suites, AST SSG Tome, `.d.ts` emit check, and Vite build with `index-*.js < 175 kB`) ONCE at final sign-off, followed by `compile_applet` + `lint_applet` co-executed together.
4. **Full 8-Scenario Harness (`--scenario=all --json`)**: Reserve for major release sign-off only. Never run mid-sprint.
5. **Atomic Sprint Clock Discipline**: Start every new sprint with `bun run qa:timer -- sprint --label=v0.1.3 --fresh` (`startFreshSprintTimer`); record phase laps via `bun run qa:timer -- check --phase="..."`.

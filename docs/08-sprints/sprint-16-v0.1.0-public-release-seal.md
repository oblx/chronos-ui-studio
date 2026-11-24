# Sprint 16 — `v0.1.0` First Public Minor Release Seal

Author: `Oblx <code@oblx.dev>` | Release Lock: `@chronos-ui/svelte` (`v0.1.0`) | License: `MIT`

## Six Audit Closures Shipped in `v0.1.0`

1. **Scoped-Default QA Engine**: `qa_verify.ts` (`resolveQaTier`) and `qa_harness.ts` (`parseHarnessArgs`) now default to scoped `v0.1.0` delta execution (`v0_1_0_release_seal.test.ts` and `calm-density @ 1440x900`) completing in under `8s`, reserving `--full-battery` / `qa:release` for a single pre-signoff full pass.
2. **Reciprocal Toggle Constancy (`Studio HUD` / `Calm View`)**: Refactored Studio HUD `TOP_CENTER` in `App.svelte` to a symmetric 3-column grid (`grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]`) anchoring `Calm View` at $X = 50\text{vw}$, matching `CalmTopStrip` `Studio HUD` within $\Delta x \le 16\text{px}, \Delta y \le 8\text{px}$ with `0px` `Twin MCP` clipping.
3. **Unified `ProjectLifecyclePod`**: Extracted `studio/src/client/canvas/ProjectLifecyclePod.svelte` and wired it into both `CalmTopStrip` and `TopPerimeterPods` (`TOP_LEFT`), eliminating duplicated lifecycle markup and `Reset` vs `Clean` label drift.
4. **Unambiguous Edge-Rail Grouping**: Removed redundant bottom layers button beneath `⋮⋮` in `UiEdgeDrawer.svelte` and inserted a hairline divider (`edge-rail-divider-{side}`) cleanly separating navigation tabs from the click-to-float / drag-to-reposition grip.
5. **Complete Subpath Exports & Folder-Cap Relief**: Exported all `13` library barrels (`./tokens`, `./wire`, `./input`, `./motion`, `./cursor`, `./machines`, `./atoms`, `./forms`, `./molecules`, `./organisms`, `./modals`, `./assistant`, `./canvas`) plus `.`, `./manifest`, and `./styles.css` in `packages/chronos-ui/package.json`; refactored `studio/src/mcp/tools/` and `studio/src/tests/{legacy,releases}/` well below the `10`-file folder ceiling.
6. **Public Open-Source Packaging Seal**: Added root and package MIT `LICENSE`, standalone `packages/chronos-ui/README.md`, root `CHANGELOG.md`, `packages/chronos-ui/tsconfig.build.json` `.d.ts` declaration verification, and an automated external-consumer import smoke test inside `v0_1_0_release_seal.test.ts`.

## Verification Criteria

- `bun run qa:fast`: Scoped delta static audit + `tsc --noEmit` + `v0_1_0_release_seal.test.ts` PASS (`< 8s`).
- `bun run qa:harness --json`: Scoped delta (`calm-density @ 1440x900`) PASS (`< 8s`, `0` console errors, `cleanTeardown: true`).
- `bun run qa:release`: Single pre-signoff full pass across all `15` test suites, full static audit, SSG Tome, `.d.ts` emit check, and Vite production build PASS.
- `bun run qa:harness --full-battery --json`: Full `8`-scenario dual-viewport pass (`1440x900`, `390x844`) PASS (`0` console errors, `0` screenshots, `cleanTeardown: true`).

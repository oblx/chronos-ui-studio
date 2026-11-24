# Active Sprint Tracker (`v0.1.0` — `current.md`)

Author: `Oblx <code@oblx.dev>` | Release Lock: `@chronos-ui/svelte` (`v0.1.0`, First Public Minor Release)
Archive Spec: `docs/08-sprints/sprint-16-v0.1.0-public-release-seal.md`
Rotated Lineage: `docs/08-sprints/archive/sprint-04..09`

## Hard Invariants (Zero Tolerance)

1. Tabs (`\t`) only; function $\le 42\text{ LoC}$; code $\le 150\text{ LoC}$; docs $\le 100\text{ LoC}$ (zero fenced code blocks).
2. Folders $\le 10$ files; 100% barrelled (`index.ts`); `0` runtime deps in `packages/chronos-ui/`; `0` multi-level `../..` imports.
3. `0` hardcoded UI copy/literals/colors/transitions (`STUDIO_UI_COPY`, `--ui-dur-*`); `0` Unicode emojis; humble `.svelte` views; strict acyclic event DAG.
4. Scoped-default QA split ($\le 20\%$ sprint budget): `qa:fast` and `qa:harness` default to latest delta (`< 8s`); `--full-battery` / `qa:release` reserved for one single pre-signoff pass.

## v0.1.0 First Public Minor Release Seal Checklist

- **Scoped-Default QA Engine (`qa_verify.ts` & `qa_harness.ts`)**:
	- Default `verify` / `qa:fast` executes cached `qa_audit` + `tsc --noEmit` + `v0_1_0_release_seal.test.ts` (`< 8s`).
	- Default `qa:harness` executes `calm-density` at `1440x900` (`< 8s`); `--full-battery` unlocks all 8 scenarios across `1440x900,390x844`.
- **Reciprocal Toggle Constancy & Unified `ProjectLifecyclePod`**:
	- `CalmTopStrip` (`Studio HUD`) and Studio HUD `TOP_CENTER` (`Calm View`) share a symmetric 3-column grid centering both triggers on $X = 50\text{vw}$ with $\Delta x \le 16\text{px}, \Delta y \le 8\text{px}$ and `0px` `Twin MCP` truncation.
	- `CalmTopStrip` and `TopPerimeterPods` (`TOP_LEFT`) consume one shared `ProjectLifecyclePod` (`Save` + `Reset` popover with `Default View` / `Clean Workspace`, zero `Clean` label drift).
- **Unambiguous Edge Rails & Folder-Cap Hygiene**:
	- `UiEdgeDrawer` separates panel tabs from `⋮⋮` (`edge-grip-*`) via `<hr data-testid="edge-rail-divider-*" />` with zero redundant trailing rail icons.
	- `studio/src/mcp/tools/` and `studio/src/tests/{legacy,releases}/` drop both directories well below the 10-file ceiling.
- **Public Packaging Readiness & External-Consumer Verification**:
	- MIT `LICENSE` (root + package), standalone `packages/chronos-ui/README.md`, `CHANGELOG.md`, all `13` subpath barrel exports + `./manifest` + `./styles.css`, `packages/chronos-ui/tsconfig.build.json` `.d.ts` emit verification, and automated external-consumer import smoke test.

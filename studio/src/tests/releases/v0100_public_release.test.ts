import { describe, expect, test } from 'bun:test';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { computeSafeCorridorFromRects, createFoldOverlayMachine, parseTooltipContent, VERSION } from '@chronos-ui/svelte';
import * as canvasSub from '@chronos-ui/svelte/canvas';
import * as cursorSub from '@chronos-ui/svelte/cursor';
import * as inputSub from '@chronos-ui/svelte/input';
import * as machinesSub from '@chronos-ui/svelte/machines';
import * as manifestSub from '@chronos-ui/svelte/manifest';
import * as motionSub from '@chronos-ui/svelte/motion';
import * as tokensSub from '@chronos-ui/svelte/tokens';
import * as wireSub from '@chronos-ui/svelte/wire';
import { DEFAULT_LATEST_SCENARIO, parseHarnessArgs } from '@studio/workers/qa_harness';
import { ALL_HARNESS_SCENARIOS } from '@studio/workers/qa_harness_scenarios';
import { LATEST_DELTA_TEST, resolveQaTier, resolveScopedTestFile } from '@studio/workers/qa_verify';

const ROOT = process.cwd();
const ALL_13_BARRELS = [
	'./tokens', './wire', './input', './motion', './cursor', './machines',
	'./atoms', './forms', './molecules', './organisms', './modals', './assistant', './canvas'
] as const;

function maxFilesInTree(dir: string): { maxCount: number; worstDir: string } {
	let maxCount = 0;
	let worstDir = dir;
	const walk = (cur: string): void => {
		const entries = readdirSync(cur).filter((n) => !n.startsWith('.') && n !== 'node_modules' && n !== 'dist');
		const files = entries.filter((n) => statSync(join(cur, n)).isFile());
		if (files.length > maxCount) { maxCount = files.length; worstDir = cur; }
		for (const n of entries) { const full = join(cur, n); if (statSync(full).isDirectory()) walk(full); }
	};
	walk(dir);
	return { maxCount, worstDir };
}

describe('v0.1.0 Scoped-Latest-By-Default QA Engine', () => {
	test('defaults qa_verify and qa_harness to scoped latest mode and requires explicit opt-in for full battery', () => {
		expect(VERSION).toBe('0.1.0');
		expect(LATEST_DELTA_TEST).toBe('studio/src/tests/releases/v0100_public_release.test.ts');
		expect(resolveQaTier([])).toBe('fast');
		expect(resolveQaTier(['--delta'])).toBe('delta');
		expect(resolveQaTier(['--full-battery'])).toBe('release');
		expect(resolveScopedTestFile([])).toBe(LATEST_DELTA_TEST);
		const defHarness = parseHarnessArgs([]);
		expect(defHarness.fullBattery).toBe(false);
		expect(defHarness.scenarios).toEqual([DEFAULT_LATEST_SCENARIO]);
		const allHarness = parseHarnessArgs(['--scenario=all', '--json']);
		expect(allHarness.fullBattery).toBe(true);
		expect(allHarness.scenarios).toEqual([...ALL_HARNESS_SCENARIOS]);
	});
});

describe('v0.1.0 Unified Fold-Overlay Engine, Tooltip Parser & Zero-Displacement Corridor Lock', () => {
	test('exercises createFoldOverlayMachine across HORIZONTAL and VERTICAL axes with OVERLAY_HOVER behavior', () => {
		const left = createFoldOverlayMachine({ axis: 'HORIZONTAL', edge: 'LEFT' });
		expect(left.state.behavior).toBe('OVERLAY_HOVER');
		expect(left.toggleExpand().expanded).toBe(true);
		expect(left.moveRail(48).railOffsetPx).toBe(48);
		expect(left.toggleMode().mode).toBe('FLOATING');
		expect(left.moveFloat(80, 40, 1440, 900).floatX).toBeGreaterThan(24);
		expect(left.dock().mode).toBe('DOCKED');

		const dock = createFoldOverlayMachine({ axis: 'VERTICAL', edge: 'BOTTOM' });
		expect(dock.state.axis).toBe('VERTICAL');
		expect(dock.state.behavior).toBe('OVERLAY_HOVER');
		expect(dock.toggleExpand().expanded).toBe(true);
		expect(dock.toggleMode().mode).toBe('FLOATING');
		expect(dock.dock().mode).toBe('DOCKED');
	});

	test('proves permanent 0px width and height delta when edge drawers or assistant chat expand', () => {
		for (const chrome of [false, true] as const) {
			for (const [w, h] of [[1440, 900], [820, 1080], [390, 844]] as const) {
				const base = computeSafeCorridorFromRects(w, h, chrome, [], 16, { leftOpen: false, leftFloating: false, rightOpen: false, rightFloating: false, assistantExpanded: false });
				const expanded = computeSafeCorridorFromRects(w, h, chrome, [{ slot: 'ASSISTANT_DOCK', left: 320, top: 420, right: 1120, bottom: 888 }], 16, { leftOpen: true, leftFloating: false, rightOpen: true, rightFloating: false, assistantExpanded: true });
				expect(expanded.topPx).toBe(base.topPx);
				expect(expanded.bottomPx).toBe(base.bottomPx);
				expect(expanded.leftPx).toBe(base.leftPx);
				expect(expanded.rightPx).toBe(base.rightPx);
				expect(expanded.usableHeightPx).toBe(base.usableHeightPx);
				expect(expanded.stageFreeWidthPx).toBe(base.stageFreeWidthPx);
			}
		}
	});

	test('parses multi-paragraph tooltips, line breaks, and shortcut keycap badges cleanly', () => {
		const rich = parseTooltipContent('Synth Audio Console\n\nTokyo Phosphor studio desk\nwith harmonic meters & patch triggers. [F1]');
		expect(rich.title).toBe('Synth Audio Console');
		expect(rich.shortcut).toBe('F1');
		expect(rich.paragraphs).toEqual([['Tokyo Phosphor studio desk', 'with harmonic meters & patch triggers.']]);
		const twoLine = parseTooltipContent('Click: float drawer\nDrag: slide along rail');
		expect(twoLine.title).toBeUndefined();
		expect(twoLine.paragraphs).toEqual([['Click: float drawer', 'Drag: slide along rail']]);
	});

	test('verifies ProjectLifecyclePod parity, centered Calm View toggle, pruned rails, and Build->Send CTA logic', () => {
		const calmSrc = readFileSync(join(ROOT, 'studio/src/client/canvas/CalmTopStrip.svelte'), 'utf8');
		const podSrc = readFileSync(join(ROOT, 'studio/src/client/panels/perimeter/TopPerimeterPods.svelte'), 'utf8');
		const appSrc = readFileSync(join(ROOT, 'studio/src/client/App.svelte'), 'utf8');
		const drawerSrc = readFileSync(join(ROOT, 'packages/chronos-ui/src/organisms/UiEdgeDrawer.svelte'), 'utf8');
		const dockSrc = readFileSync(join(ROOT, 'packages/chronos-ui/src/assistant/UiAssistantDock.svelte'), 'utf8');
		expect(calmSrc).toContain('ProjectLifecyclePod');
		expect(podSrc).toContain('ProjectLifecyclePod');
		expect(podSrc).not.toContain('hud-clean-btn');
		expect(appSrc).toContain('data-testid="hud-calm-anchor"');
		expect(drawerSrc).toContain('use:uiFoldGrip');
		expect(drawerSrc).toContain('data-testid="edge-rail-divider-{side.toLowerCase()}"');
		expect(dockSrc).toContain('use:uiFoldGrip');
		expect(dockSrc).toContain('hasBuiltOnce || messages.length > 0');
		expect(dockSrc).toContain('data-testid="assistant-tool-chip"');
	});
});

describe('v0.1.0 Public Packaging Seal, Decongested Folders (< 10) & Subpath Exports', () => {
	test('verifies MIT license, decongested folders (all < 10, target <= 8), and all 16 exports on disk', () => {
		const pkg = JSON.parse(readFileSync(join(ROOT, 'packages/chronos-ui/package.json'), 'utf8'));
		expect(pkg.version).toBe('0.1.0');
		expect(pkg.license).toBe('MIT');
		expect(Object.keys(pkg.dependencies ?? {}).length).toBe(0);
		expect(Object.keys(pkg.exports ?? {}).length).toBeGreaterThanOrEqual(16);
		for (const sub of ['.', './manifest', './styles.css', ...ALL_13_BARRELS]) {
			const entry = pkg.exports?.[sub];
			const target = typeof entry === 'string' ? entry : entry.default;
			expect(existsSync(join(ROOT, 'packages/chronos-ui', target))).toBe(true);
		}
		for (const rootSub of ['packages/chronos-ui/src', 'studio/src', 'docs']) {
			expect(maxFilesInTree(join(ROOT, rootSub)).maxCount).toBeLessThan(10);
		}
		for (const dir of ['packages/chronos-ui/src/organisms', 'packages/chronos-ui/src/tokens', 'packages/chronos-ui/src/wire', 'studio/src/client/panels', 'studio/src/client/state', 'studio/src/core']) {
			const count = readdirSync(join(ROOT, dir)).filter((n) => !n.startsWith('.') && statSync(join(ROOT, dir, n)).isFile()).length;
			expect(count).toBeLessThanOrEqual(8);
		}
	});

	test('imports granular @chronos-ui/svelte/* subpaths cleanly and verifies .d.ts type declarations', () => {
		expect(tokensSub.VERSION).toBe('0.1.0');
		expect(typeof wireSub.createHeadlessWireBroker).toBe('function');
		expect(typeof motionSub.buildMotionCssVars).toBe('function');
		expect(Array.isArray(canvasSub.COMPONENT_CATALOG)).toBe(true);
		expect(typeof cursorSub.buildCursorPackCss).toBe('function');
		expect(typeof inputSub.createVoiceInputAdapter).toBe('function');
		expect(typeof machinesSub.createFoldOverlayMachine).toBe('function');
		expect(manifestSub.UI_FRAMEWORK_MANIFEST.version).toBe('0.1.0');
		for (const rel of ['tokens/index.d.ts', 'wire/index.d.ts', 'machines/index.d.ts', 'manifest.d.ts']) {
			expect(existsSync(join(ROOT, 'packages/chronos-ui/dist', rel))).toBe(true);
		}
	});
});

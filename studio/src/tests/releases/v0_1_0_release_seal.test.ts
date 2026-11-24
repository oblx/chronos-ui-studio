import { describe, expect, test } from 'bun:test';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { VERSION } from '@chronos-ui/svelte';
import * as canvasSub from '@chronos-ui/svelte/canvas';
import * as cursorSub from '@chronos-ui/svelte/cursor';
import * as inputSub from '@chronos-ui/svelte/input';
import * as machinesSub from '@chronos-ui/svelte/machines';
import * as manifestSub from '@chronos-ui/svelte/manifest';
import * as motionSub from '@chronos-ui/svelte/motion';
import * as tokensSub from '@chronos-ui/svelte/tokens';
import * as wireSub from '@chronos-ui/svelte/wire';
import { DEFAULT_DELTA_SCENARIOS, parseHarnessArgs } from '@studio/workers/qa_harness';
import { ALL_HARNESS_SCENARIOS } from '@studio/workers/qa_harness_scenarios';
import { LATEST_DELTA_TEST, resolveQaTier } from '@studio/workers/qa_verify';

const ROOT = process.cwd();
const ALL_13_BARRELS = [
	'./tokens', './wire', './input', './motion', './cursor', './machines',
	'./atoms', './forms', './molecules', './organisms', './modals', './assistant', './canvas'
] as const;

describe('v0.1.0 Scoped-Default QA Engine (<= 20% QA split)', () => {
	test('defaults qa:verify and qa:harness to scoped delta and reserves --full-battery for full pass', () => {
		expect(VERSION).toBe('0.1.0');
		expect(LATEST_DELTA_TEST).toBe('studio/src/tests/releases/v0_1_0_release_seal.test.ts');
		expect(resolveQaTier([])).toBe('fast');
		expect(resolveQaTier(['--fast'])).toBe('fast');
		expect(resolveQaTier(['--delta'])).toBe('delta');
		expect(resolveQaTier(['--full-battery'])).toBe('release');
		expect(resolveQaTier(['--release'])).toBe('release');

		const defaultHarness = parseHarnessArgs([]);
		expect(defaultHarness.fullBattery).toBe(false);
		expect(defaultHarness.scenarios).toEqual([...DEFAULT_DELTA_SCENARIOS]);
		expect(defaultHarness.viewports).toEqual([{ width: 1440, height: 900 }]);

		const fullHarness = parseHarnessArgs(['--full-battery', '--json']);
		expect(fullHarness.fullBattery).toBe(true);
		expect(fullHarness.scenarios).toEqual([...ALL_HARNESS_SCENARIOS]);
		expect(fullHarness.viewports.length).toBe(2);
	});
});

describe('v0.1.0 Reciprocal Toggle, Unified ProjectLifecyclePod & Edge-Rail Hygiene', () => {
	test('CalmTopStrip and TopPerimeterPods both consume unified ProjectLifecyclePod with zero Clean drift', () => {
		const calmSrc = readFileSync(join(ROOT, 'studio/src/client/canvas/CalmTopStrip.svelte'), 'utf8');
		const podSrc = readFileSync(join(ROOT, 'studio/src/client/panels/TopPerimeterPods.svelte'), 'utf8');
		const appSrc = readFileSync(join(ROOT, 'studio/src/client/App.svelte'), 'utf8');
		const drawerSrc = readFileSync(join(ROOT, 'packages/chronos-ui/src/organisms/UiEdgeDrawer.svelte'), 'utf8');

		expect(calmSrc).toContain('ProjectLifecyclePod');
		expect(podSrc).toContain('ProjectLifecyclePod');
		expect(podSrc).not.toContain('hud-clean-btn');
		expect(podSrc).not.toContain('label="Clean"');
		expect(appSrc).toContain('grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]');
		expect(appSrc).toContain('data-testid="hud-calm-anchor"');
		expect(drawerSrc).toContain('data-testid="edge-rail-divider-{side.toLowerCase()}"');
		expect(drawerSrc).toContain('data-testid="edge-grip-{side.toLowerCase()}"');
		const gripIdx = drawerSrc.indexOf('data-testid="edge-grip-');
		const asideEnd = drawerSrc.indexOf('</aside>');
		expect(drawerSrc.slice(gripIdx, asideEnd)).not.toContain('<UiChamferButton');
	});
});

describe('v0.1.0 Public Packaging Readiness, 13 Subpath Exports & External-Consumer Smoke Test', () => {
	test('verifies MIT licensing, standalone README, CHANGELOG, folder caps, and all 13 subpath exports', () => {
		const pkg = JSON.parse(readFileSync(join(ROOT, 'packages/chronos-ui/package.json'), 'utf8'));
		expect(pkg.version).toBe('0.1.0');
		expect(pkg.license).toBe('MIT');
		expect(Object.keys(pkg.dependencies ?? {}).length).toBe(0);
		expect(existsSync(join(ROOT, 'LICENSE'))).toBe(true);
		expect(existsSync(join(ROOT, 'packages/chronos-ui/LICENSE'))).toBe(true);
		expect(existsSync(join(ROOT, 'packages/chronos-ui/README.md'))).toBe(true);
		expect(existsSync(join(ROOT, 'CHANGELOG.md'))).toBe(true);

		for (const sub of ALL_13_BARRELS) {
			const entry = pkg.exports?.[sub];
			expect(entry).toBeDefined();
			const target = typeof entry === 'string' ? entry : entry.default;
			expect(existsSync(join(ROOT, 'packages/chronos-ui', target))).toBe(true);
		}
		expect(existsSync(join(ROOT, 'packages/chronos-ui', pkg.exports['./styles.css']))).toBe(true);

		const mcpFiles = readdirSync(join(ROOT, 'studio/src/mcp')).filter((n) => statSync(join(ROOT, 'studio/src/mcp', n)).isFile());
		const testFiles = readdirSync(join(ROOT, 'studio/src/tests')).filter((n) => statSync(join(ROOT, 'studio/src/tests', n)).isFile());
		expect(mcpFiles.length).toBeLessThanOrEqual(8);
		expect(testFiles.length).toBeLessThanOrEqual(8);
	});

	test('external-consumer subpath import smoke test & .d.ts type-declaration emit', () => {
		expect(tokensSub.VERSION).toBe('0.1.0');
		expect(tokensSub.THEME_PACKS.length).toBe(6);
		expect(typeof wireSub.createHeadlessWireBroker).toBe('function');
		expect(typeof motionSub.buildMotionCssVars).toBe('function');
		expect(Array.isArray(canvasSub.COMPONENT_CATALOG)).toBe(true);
		expect(typeof cursorSub.buildCursorPackCss).toBe('function');
		expect(typeof inputSub.createVoiceInputAdapter).toBe('function');
		expect(typeof machinesSub.createModalMachine).toBe('function');
		expect(manifestSub.UI_FRAMEWORK_MANIFEST.version).toBe('0.1.0');
		expect(Array.isArray(manifestSub.UI_FRAMEWORK_MANIFEST.componentCatalog)).toBe(true);

		expect(existsSync(join(ROOT, 'packages/chronos-ui/tsconfig.build.json'))).toBe(true);
		for (const rel of ['tokens/index.d.ts', 'wire/index.d.ts', 'motion/index.d.ts', 'canvas/index.d.ts', 'manifest.d.ts']) {
			const dtsPath = join(ROOT, 'packages/chronos-ui/dist', rel);
			expect(existsSync(dtsPath)).toBe(true);
			expect(readFileSync(dtsPath, 'utf8').length).toBeGreaterThan(0);
		}
	});
});

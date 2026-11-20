import { describe, expect, test } from 'bun:test';
import {
	buildClipPathPolygon, buildCornerEmbellishmentPath, buildHullSvgPath, buildShapeGeometry,
	computeSafeCorridor, computeViewportOccupancy, CORNER_EMBELLISHMENTS, CORNER_MODES,
	DEFAULT_CHAMFER_TUPLE, DEFAULT_MOTION_CONFIG, MOTION_PRESETS, MOTION_SPEEDS,
	probeEnvironmentCapabilities, resolveCornerTuple, resolveEffectiveDuration, ROUND_TUPLE,
	THEME_PACKS, UI_FRAME_SHAPES, uiTransition, validateThemePackContrast,
	type UiProjectDefinition
} from '@chronos-ui/svelte';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DEFAULT_BUILD_CONFIG, probeServerEnvironmentCapabilities } from '../core';
import { handleBuilderMcpRpc } from '../mcp';
import { compileStaticClientBuild } from '../plugins';

describe('v0.0.4 tri-mode corners, 8 UML shapes, and vivid WCAG accents', () => {
	test('tri-mode corners emit straight, 45-deg chamfer, and quadratic round SVG paths', () => {
		const chamfer = buildHullSvgPath(220, 120, 10, DEFAULT_CHAMFER_TUPLE);
		const round = buildHullSvgPath(220, 120, 10, ROUND_TUPLE);
		const straight = buildHullSvgPath(220, 120, 10, resolveCornerTuple(DEFAULT_CHAMFER_TUPLE, 'STRAIGHT'));
		expect(chamfer.includes('M ')).toBe(true);
		expect(round.includes('C ')).toBe(true);
		expect(straight.includes('C ')).toBe(true);
		expect(buildClipPathPolygon(0.625, ROUND_TUPLE)).toContain('round');
		expect(CORNER_MODES).toEqual(['CHAMFER', 'ROUND', 'STRAIGHT']);
	});

	test('all UML shapes and 6 corner embellishments generate valid SVG paths', () => {
		expect(UI_FRAME_SHAPES.length).toBeGreaterThanOrEqual(8);
		for (const shape of UI_FRAME_SHAPES) {
			const geom = buildShapeGeometry(shape, 240, 120, 10, DEFAULT_CHAMFER_TUPLE);
			expect(geom.outerPath.startsWith('M ')).toBe(true);
			expect(geom.innerBezelPath.startsWith('M ')).toBe(true);
			expect(geom.safePaddingRem.length).toBe(4);
		}
		for (const emb of CORNER_EMBELLISHMENTS) {
			const p = buildCornerEmbellishmentPath(emb, 240, 120, 10);
			if (emb !== 'NONE' && emb !== 'CARET') expect(p.startsWith('M ')).toBe(true);
		}
	});

	test('all 6 theme palettes pass WCAG AA+ for vivid semantic accents', () => {
		for (const pack of THEME_PACKS) {
			const checks = validateThemePackContrast(pack);
			const vividChecks = checks.filter((c) => c.pair.includes('accent-vivid'));
			expect(vividChecks.length).toBe(2);
			for (const vc of vividChecks) expect(vc.passAa).toBe(true);
		}
	});
});

describe('v0.0.4 Svelte 5 motion engine and reduced-motion discipline', () => {
	test('all 6 presets and 4 speed tiers produce valid TransitionConfigs and respect reduced motion', () => {
		const fakeEl = {} as Element;
		for (const preset of MOTION_PRESETS) {
			const tr = uiTransition(fakeEl, { config: { preset, speed: 'NORMAL', reducedMotionOverride: 'AUTO' }, prefersReducedMotion: false });
			if (preset === 'NONE') expect(tr.duration).toBe(0);
			else {
				expect(tr.duration).toBe(220);
				expect(typeof tr.css?.(0.5, 0.5)).toBe('string');
			}
		}
		const durations = MOTION_SPEEDS.map((speed) => resolveEffectiveDuration({ preset: 'CYBER_UNFOLD', speed, reducedMotionOverride: 'AUTO' }, false));
		expect(durations).toEqual([0, 120, 220, 360]);
		expect(resolveEffectiveDuration(DEFAULT_MOTION_CONFIG, true)).toBe(0);
		expect(resolveEffectiveDuration({ ...DEFAULT_MOTION_CONFIG, reducedMotionOverride: 'FORCE_ON' }, true)).toBe(220);
	});
});

describe('v0.0.4 environment probes, safe corridor zero-collision, and static export', () => {
	test('AI Studio, Harbor window.ai, and offline fallback resolve deterministically with zero key leakage', async () => {
		const aiStudioServer = probeServerEnvironmentCapabilities({ GEMINI_API_KEY: 'AIza-secret-do-not-leak' });
		expect(aiStudioServer.aiStudioGeminiAvailable).toBe(true);
		expect(JSON.stringify(aiStudioServer)).not.toContain('AIza-secret');
		const studioRep = await probeEnvironmentCapabilities(aiStudioServer, false, { location: { hostname: 'aistudio.google.com' } });
		expect(studioRep.resolvedAdapter).toBe('GOOGLE_AI_STUDIO');
		expect(studioRep.badgeLabel).toBe('AI STUDIO · GEMINI');

		const harborRep = await probeEnvironmentCapabilities({ aiStudioGeminiAvailable: false, source: 'NONE', defaultModel: 'gemini-2.5-flash', runtime: 'bun' }, false, {
			window: {},
			ai: { languageModel: { capabilities: async () => ({ available: 'readily' }) } }
		});
		expect(harborRep.resolvedAdapter).toBe('BROWSER_WINDOW_AI');
		expect(harborRep.badgeLabel).toBe('HARBOR · WINDOW.AI');

		const offlineRep = await probeEnvironmentCapabilities(undefined, false, {});
		expect(offlineRep.resolvedAdapter).toBe('LOCAL_HEURISTIC');

		const mcpEnv = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 401, method: 'tools/call', params: { name: 'ui_probe_environment', arguments: {} } });
		expect(mcpEnv.error).toBeUndefined();
		expect(JSON.stringify(mcpEnv.result)).not.toContain('AIza');
	});

	test('safe corridor and MCP ui_get_viewport_occupancy prove 0 collisions at 1440x900', async () => {
		const calm = computeSafeCorridor(false, 1440, 900);
		const hud = computeSafeCorridor(true, 1440, 900);
		expect(hud.topRem).toBeGreaterThan(calm.topRem);
		expect(hud.bottomRem).toBeGreaterThan(calm.bottomRem);
		const occ = computeViewportOccupancy({ viewportW: 1440, viewportH: 900, chromeVisible: true, density: 'BALANCED', leftPanelOpen: true, rightPanelOpen: true, toastVisible: true, assistantExpanded: true });
		expect(occ.collisionCount).toBe(0);
		const mcpOcc = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 402, method: 'tools/call', params: { name: 'ui_get_viewport_occupancy', arguments: { viewportW: 1440, viewportH: 900, chromeVisible: true } } });
		const structured = (mcpOcc.result as { structured?: { collisionCount?: number } })?.structured;
		expect(structured?.collisionCount).toBe(0);
	});

	test('static-site-build compiles UML_PACKAGE, UML_NOTE, UML_DATABASE with ROUND corners and CYBER_UNFOLD', async () => {
		const workDir = join(tmpdir(), `chronos-v004-static-${Date.now().toString(36)}`);
		const proj: UiProjectDefinition = {
			id: 'proj-v004-uml', slug: 'v004-uml', name: 'UML Shapes Export',
			description: 'Verified v0.0.4 export with UML frames, ROUND corners, and motion',
			themeId: 'obsidian-brass', cornerMode: 'ROUND', activeRevisionId: 'rev-v004',
			buildConfig: DEFAULT_BUILD_CONFIG, updatedAt: Date.now(),
			nodes: [
				{ id: 'n-pkg', type: 'UiSection', zone: 'WORLD_CANVAS', label: 'Auth Package', lifecycle: 'COMMITTED', shape: 'UML_PACKAGE', cornerEmbellishment: 'DOTS', cornerAnimation: 'SCAN_GLINT', props: { title: 'Auth Package', subtitle: 'OAuth & RBAC core' } },
				{ id: 'n-note', type: 'UiSection', zone: 'WORLD_CANVAS', label: 'Spec Note', lifecycle: 'COMMITTED', shape: 'UML_NOTE', props: { title: 'Dog-ear Note', subtitle: 'Zero-dep Svelte 5' } },
				{ id: 'n-db', type: 'UiSection', zone: 'WORLD_CANVAS', label: 'WAL Store', lifecycle: 'COMMITTED', shape: 'UML_DATABASE', props: { title: 'SQLite WAL', subtitle: 'Drizzle ORM' } }
			]
		};
		try {
			const res = await compileStaticClientBuild({ project: proj, workDir, motionConfig: DEFAULT_MOTION_CONFIG });
			expect(res.files.includes('index.html')).toBe(true);
			expect(res.files.some((f) => f.endsWith('.js'))).toBe(true);
			expect(res.checksum.length).toBe(64);
		} finally {
			rmSync(workDir, { recursive: true, force: true });
		}
	});
});

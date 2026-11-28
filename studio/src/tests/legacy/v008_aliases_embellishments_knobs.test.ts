import { describe, expect, test } from 'bun:test';
import {
	buildCurvedCornerEmbellishment, buildShapeEmbellishments, buildShapeGeometry, clampControlCutPx,
	clampStudioDefaults, CONTROL_MAX_CUT_RATIO, CORNER_ANIMATIONS, CORNER_EMBELLISHMENTS, CORNER_MODES,
	DEFAULT_CONTROL_CORNER_CUT_REM, DEFAULT_CORNER_CUT_REM, DEFAULT_STATION_CORNER_CUT_REM,
	DEFAULT_STUDIO_DEFAULTS, PEER_STALE_MS, remToPx, UI_FRAME_SHAPES, VERSION
} from '@chronos-ui/svelte';
import { planLocalAssistantPrompt, STUDIO_TOOL_REGISTRY } from '@studio/core';
import { handleBuilderMcpRpc } from '@studio/mcp';
import { emitProjectCssTokens } from '@studio/plugins';
import { handleCollabHttp } from '@studio/server/ws.collab';
import { classifySprintTimeBand, SPRINT_TIME_BANDS } from '@studio/workers/qa_timer';

describe('v0.0.8 3-tier parametric corner cuts & anti-pinch geometry', () => {
	test('locks v0.0.8 defaults (0.5rem base, 0.75rem station, 0.3125rem control) and clamps <= 28% height', () => {
		expect(VERSION).toBe('0.1.3');
		expect(DEFAULT_CORNER_CUT_REM).toBe(0.5);
		expect(DEFAULT_STATION_CORNER_CUT_REM).toBe(0.75);
		expect(DEFAULT_CONTROL_CORNER_CUT_REM).toBe(0.3125);
		expect(CONTROL_MAX_CUT_RATIO).toBe(0.28);
		expect(DEFAULT_STUDIO_DEFAULTS.baseCornerCutRem).toBe(0.5);
		expect(DEFAULT_STUDIO_DEFAULTS.stationCornerCutRem).toBe(0.75);
		expect(DEFAULT_STUDIO_DEFAULTS.controlCornerCutRem).toBe(0.3125);
		const compactHeightPx = 32;
		const pinchedAttempt = clampControlCutPx(24, compactHeightPx, CONTROL_MAX_CUT_RATIO);
		expect(pinchedAttempt).toBeLessThanOrEqual(compactHeightPx * CONTROL_MAX_CUT_RATIO + 0.001);
		expect(pinchedAttempt * 2).toBeLessThan(compactHeightPx * 0.6);
		expect(clampControlCutPx(remToPx(DEFAULT_CONTROL_CORNER_CUT_REM), compactHeightPx, CONTROL_MAX_CUT_RATIO)).toBe(5);
	});

	test('clamps studioDefaults safely across all numeric & enum knobs', () => {
		const clamped = clampStudioDefaults({
			baseCornerCutRem: 9, stationCornerCutRem: 0.05, controlCornerCutRem: 2, borderStrokePx: 2,
			ornamentOffsetRem: 4, ornamentDriftAmpRem: -1, ornamentPeriodMs: 99999, perimeterGutterRem: 1, autoSaveMode: 'ON_COMMIT'
		});
		expect(clamped.baseCornerCutRem).toBe(1.5);
		expect(clamped.stationCornerCutRem).toBe(0.25);
		expect(clamped.controlCornerCutRem).toBe(0.5);
		expect(clamped.borderStrokePx).toBe(2);
		expect(clamped.ornamentOffsetRem).toBe(0.5);
		expect(clamped.ornamentDriftAmpRem).toBe(0.0625);
		expect(clamped.ornamentPeriodMs).toBe(5000);
		expect(clamped.perimeterGutterRem).toBe(1);
		expect(clamped.autoSaveMode).toBe('ON_COMMIT');
	});
});

describe('v0.0.8 5x3 embellishments & shape-locked animations across all 14 shapes and 3 corner modes', () => {
	test('exposes 9 ornaments and 6 animations (5x3 = 15) and generates valid SVG paths for every combination', () => {
		expect(CORNER_EMBELLISHMENTS.length).toBe(9);
		expect(CORNER_ANIMATIONS.length).toBe(6);
		expect(CORNER_EMBELLISHMENTS).toContain('DIAMOND');
		expect(CORNER_EMBELLISHMENTS).toContain('DOUBLE_LINE');
		expect(CORNER_EMBELLISHMENTS).toContain('CROSSHAIR');
		expect(CORNER_ANIMATIONS).toContain('ORBIT_TRACE');
		for (const shape of UI_FRAME_SHAPES) {
			for (const mode of CORNER_MODES) {
				const tuple = [mode, mode, mode, mode] as const;
				const geom = buildShapeGeometry(shape, 240, 110, 8, tuple);
				expect(geom.outerPath.length).toBeGreaterThan(8);
				for (const emb of CORNER_EMBELLISHMENTS) {
					const items = shape === 'BOX' && mode === 'ROUND'
						? buildCurvedCornerEmbellishment(emb, 240, 110, 8, tuple, 3)
						: buildShapeEmbellishments(emb, geom.anchorVertices, 8, 3);
					if (emb === 'NONE') { expect(items.length).toBe(0); continue; }
					expect(items.length).toBeGreaterThan(0);
					for (const item of items) {
						expect(item.d.startsWith('M ')).toBe(true);
						expect(Number.isFinite(item.nx) && Number.isFinite(item.ny)).toBe(true);
					}
				}
			}
		}
	});
});

describe('v0.0.8 35-tool MCP parity, studioDefaults persistence, collab filter & qa:timer bands', () => {
	test('persists and resets studioDefaults via MCP tools, emits CSS vars, and parses assistant intents', async () => {
		const listRes = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
		const tools = (listRes.result as unknown as { tools: Array<{ name: string }> }).tools;
		expect(tools.length).toBe(52);
		expect(STUDIO_TOOL_REGISTRY.length).toBe(52);
		const cfgRes = await handleBuilderMcpRpc({
			jsonrpc: '2.0', id: 2, method: 'tools/call',
			params: {
				name: 'ui_configure_studio_defaults',
				arguments: { projectId: 'proj-genesis', baseCornerCutRem: 0.625, stationCornerCutRem: 0.875, controlCornerCutRem: 0.25, borderStrokePx: 2, perimeterGutterRem: 1, autoSaveMode: 'DEBOUNCED_3S' }
			}
		});
		const cfgData = JSON.parse((cfgRes.result as unknown as { content: Array<{ text: string }> }).content[0].text);
		expect(cfgData.studioDefaults.baseCornerCutRem).toBe(0.625);
		expect(cfgData.studioDefaults.stationCornerCutRem).toBe(0.875);
		expect(cfgData.studioDefaults.controlCornerCutRem).toBe(0.25);
		expect(cfgData.project.studioDefaults.borderStrokePx).toBe(2);
		const css = emitProjectCssTokens(cfgData.project);
		expect(css.content).toContain('--ui-corner-cut: 0.625rem;');
		expect(css.content).toContain('--ui-station-cut: 0.875rem;');
		expect(css.content).toContain('--ui-control-cut: 0.25rem;');
		expect(css.content).toContain('--ui-stroke-w: 2px;');
		expect(css.content).toContain('--ui-perimeter-gutter: 1rem;');
		const resetRes = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'ui_reset_studio_defaults', arguments: { projectId: 'proj-genesis' } } });
		const resetData = JSON.parse((resetRes.result as unknown as { content: Array<{ text: string }> }).content[0].text);
		expect(resetData.studioDefaults.baseCornerCutRem).toBe(0.5);
		expect(resetData.studioDefaults.stationCornerCutRem).toBe(0.75);
		const planCfg = planLocalAssistantPrompt('set default chamfer to 0.5rem with orbit trace and diamond corners');
		expect(planCfg.actions[0]?.tool).toBe('ui_configure_studio_defaults');
		expect(planCfg.actions[0]?.args.cornerEmbellishment).toBe('DIAMOND');
		expect(planCfg.actions[0]?.args.cornerAnimation).toBe('ORBIT_TRACE');
		expect(planLocalAssistantPrompt('reset studio defaults').actions[0]?.tool).toBe('ui_reset_studio_defaults');
	});

	test('filters caller session from collab peer list and classifies qa:timer sprint bands', async () => {
		expect(PEER_STALE_MS).toBe(30_000);
		const postRes = await handleCollabHttp(
			new Request('http://localhost:3000/api/ws/collab', {
				method: 'POST', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionId: 'local-self-1', label: 'Operator', x: 360, y: 260 })
			}),
			'/api/ws/collab'
		);
		const postJson = (await postRes!.json()) as { peers: Array<{ sessionId: string }> };
		expect(postJson.peers.some((p) => p.sessionId === 'local-self-1')).toBe(false);
		expect(SPRINT_TIME_BANDS.HARD_CEILING_MIN).toBe(38);
		expect(classifySprintTimeBand(10 * 60_000)).toBe('GREEN');
		expect(classifySprintTimeBand(27 * 60_000)).toBe('AMBER');
		expect(classifySprintTimeBand(34 * 60_000)).toBe('FREEZE_SCOPE');
		expect(classifySprintTimeBand(40 * 60_000)).toBe('HARD_STOP');
	});
});

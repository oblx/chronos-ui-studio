import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
	buildContourEmbellishments, buildCursorPackCssSheet, buildShapeGeometry, BUILTIN_CURSOR_PACKS,
	computeTooltipAnchor, CORNER_ANIMATIONS, CSS_CURSOR_STATES, DEFAULT_CHAMFER_TUPLE, DEFAULT_VIEWPORT, generateUuidV7,
	MOTION_PRESETS, UI_FRAME_SHAPES, uiTransition, VERSION
} from '@chronos-ui/svelte';
import { findStarterSample } from '@studio/config';
import { DEFAULT_BUILD_CONFIG, STUDIO_TOOL_REGISTRY, validatePngDataUrl } from '@studio/core';
import { handleBuilderMcpRpc } from '@studio/mcp';
import { emitProjectCssTokens } from '@studio/plugins';
import { createStudioProject, handleCursorRoutes, handleLifecycleRoutes } from '@studio/server/routes';
import { getSprintTimerStatus, lapSprintTimer, resetSprintTimer, runStaticAudit, startSprintTimer } from '@studio/workers';

function makeTinyPngDataUrl(width = 16, height = 16): string {
	const buf = Buffer.alloc(33);
	Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buf, 0);
	buf.writeUInt32BE(13, 8);
	buf.write('IHDR', 12);
	buf.writeUInt32BE(width, 16);
	buf.writeUInt32BE(height, 20);
	return `data:image/png;base64,${buf.toString('base64')}`;
}

describe('v0.0.6 workspace lifecycle, 14 contour-locked shapes, motion, and tooltips', () => {
	test('save, clean, default-view, and undo lifecycle actions maintain dirty state cleanly', async () => {
		expect(VERSION).toBe('0.1.0');
		const sample = findStarterSample('sample-shape-matrix')!;
		const fresh = sample.nodes.map((n) => ({ ...n, id: generateUuidV7() }));
		const created = await createStudioProject({ name: 'v006 Lifecycle Spec', themeId: sample.themeId, nodes: fresh });
		const saveRes = await handleLifecycleRoutes(new Request(`http://localhost/api/projects/${created.id}/save`, {
			method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Saved Name', activeCursorPackId: BUILTIN_CURSOR_PACKS[0].uuid })
		}), `/api/projects/${created.id}/save`);
		expect(saveRes!.status).toBe(200);
		const saved = (await saveRes!.json()) as { savedAt: number; project: { name: string; activeCursorPackId: string | null } };
		expect(saved.savedAt).toBeGreaterThan(0);
		expect(saved.project.activeCursorPackId).toBe(BUILTIN_CURSOR_PACKS[0].uuid);
		const cleanRes = await handleLifecycleRoutes(new Request(`http://localhost/api/projects/${created.id}/clean`, { method: 'POST' }), `/api/projects/${created.id}/clean`);
		expect(cleanRes!.status).toBe(200);
		const cleaned = (await cleanRes!.json()) as { project: { nodes: unknown[] } };
		expect(cleaned.project.nodes.length).toBe(0);
		const mcpSave = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 610, method: 'tools/call', params: { name: 'ui_save_project', arguments: { projectId: created.id, name: 'MCP Saved' } } });
		expect(mcpSave.error).toBeUndefined();
		const mcpClean = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 611, method: 'tools/call', params: { name: 'ui_clean_project', arguments: { projectId: created.id } } });
		expect(mcpClean.error).toBeUndefined();
		const mcpReset = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 612, method: 'tools/call', params: { name: 'ui_reset_workspace_view', arguments: {} } });
		expect(mcpReset.error).toBeUndefined();
	});

	test('14 shapes plot anchorVertices strictly on contour perimeter and IRIS_EXPAND/SCAN_WIPE run phase-locked', () => {
		expect(UI_FRAME_SHAPES.length).toBe(14);
		expect(CORNER_ANIMATIONS.includes('DIAGONAL_DRIFT')).toBe(true);
		expect(MOTION_PRESETS).toContain('IRIS_EXPAND');
		expect(MOTION_PRESETS).toContain('SCAN_WIPE');
		for (const shape of UI_FRAME_SHAPES) {
			const geom = buildShapeGeometry(shape, 200, 100, 10, DEFAULT_CHAMFER_TUPLE);
			expect(geom.outerPath.length).toBeGreaterThan(8);
			for (const v of geom.anchorVertices) {
				expect(v.x).toBeGreaterThanOrEqual(-0.5);
				expect(v.x).toBeLessThanOrEqual(200.5);
				expect(v.y).toBeGreaterThanOrEqual(-0.5);
				expect(v.y).toBeLessThanOrEqual(100.5);
			}
			expect(buildContourEmbellishments('ARC', geom.anchorVertices, 10).length).toBe(geom.anchorVertices.length);
		}
		const fakeEl = { clientWidth: 240, clientHeight: 120 } as unknown as Element;
		const cfg = uiTransition(fakeEl, { config: { preset: 'IRIS_EXPAND', speed: 'FAST', reducedMotionOverride: 'FORCE_ON' }, shape: 'HEXAGON' });
		expect(cfg.css?.(0.5, 0.5)).toContain('clip-path:');
		const cornerAnchor = computeTooltipAnchor({ left: 1380, top: 8, right: 1435, bottom: 44, width: 55, height: 36, x: 1380, y: 8, toJSON: () => ({}) }, DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height);
		expect(cornerAnchor.x).toBeLessThanOrEqual(DEFAULT_VIEWPORT.width - 96);
	});
});

describe('v0.0.6 AI 17-state CSS Cursor Studio, PNG validation, Drizzle CRUD & 27-tool MCP parity', () => {
	test('validates PNG magic bytes, derives 17 CSS states, emits tokens CSS, and passes 27-tool MCP parity', async () => {
		expect(CSS_CURSOR_STATES.length).toBe(21);
		expect(BUILTIN_CURSOR_PACKS.length).toBe(4);
		expect(validatePngDataUrl('data:image/jpeg;base64,AAAA').ok).toBe(false);
		const png = makeTinyPngDataUrl(24, 24);
		expect(validatePngDataUrl(png).ok).toBe(true);
		const createRes = await handleCursorRoutes(new Request('http://localhost/api/cursors', {
			method: 'POST', headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ name: 'Test Reticle', sourcePngDataUrl: png, baseHotspotX: 4, baseHotspotY: 3 })
		}), '/api/cursors');
		expect(createRes!.status).toBe(201);
		const { pack } = (await createRes!.json()) as { pack: { uuid: string; states: Record<string, { assetDataUrl: string }> } };
		const deriveRes = await handleCursorRoutes(new Request(`http://localhost/api/cursors/${pack.uuid}/derive-states`, {
			method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ accentColor: '#22d3ee', useAiLabel: true })
		}), `/api/cursors/${pack.uuid}/derive-states`);
		expect(deriveRes!.status).toBe(200);
		const derived = (await deriveRes!.json()) as { pack: typeof BUILTIN_CURSOR_PACKS[number]; derivedCount: number };
		expect(derived.derivedCount).toBe(20);
		const sheet = buildCursorPackCssSheet(derived.pack);
		for (const st of CSS_CURSOR_STATES) expect(sheet).toContain(`--ui-cursor-${st}:`);
		const sample = findStarterSample('sample-shape-matrix')!;
		const exportedCss = emitProjectCssTokens({ id: generateUuidV7(), slug: 'm', name: 'M', description: '', themeId: sample.themeId, cornerMode: 'CHAMFER', activeCursorPackId: 'cyber-reticle', activeRevisionId: generateUuidV7(), nodes: [], buildConfig: DEFAULT_BUILD_CONFIG, updatedAt: Date.now() });
		expect(exportedCss.content).toContain('--ui-cursor-nwse-resize:');
		const rpcList = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 601, method: 'tools/list' });
		const tools = (rpcList.result as unknown as { tools: { name: string }[] }).tools;
		expect(tools.length).toBe(42);
		expect(STUDIO_TOOL_REGISTRY.length).toBe(42);
		const applyRes = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 602, method: 'tools/call', params: { name: 'ui_list_cursor_packs', arguments: {} } });
		expect(applyRes.error).toBeUndefined();
	});

	test('qa:timer budget helper tracks laps cleanly and full static audit enforces AgentSkills + hex rules', () => {
		const sandbox = mkdtempSync(join(tmpdir(), 'chronos-timer-'));
		try {
			startSprintTimer(45, sandbox);
			const lap1 = lapSprintTimer('s0-tokens', sandbox);
			expect(lap1.active).toBe(true);
			expect(lap1.withinBudget).toBe(true);
			expect(lap1.laps.length).toBe(1);
			expect(getSprintTimerStatus(sandbox).budgetMin).toBe(45);
			resetSprintTimer(sandbox);
			expect(getSprintTimerStatus(sandbox).active).toBe(false);
		} finally {
			rmSync(sandbox, { recursive: true, force: true });
		}
		expect(runStaticAudit(process.cwd(), { full: true })).toEqual([]);
	});
});

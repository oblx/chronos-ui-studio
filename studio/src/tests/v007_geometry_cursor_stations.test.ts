import { describe, expect, test } from 'bun:test';
import {
	buildContourEmbellishments, buildCurvedCornerEmbellishment, buildCursorPackCssSheet, buildShapeGeometry,
	BUILTIN_CURSOR_PACKS, clampCornerRadiusRem, CORNER_RADIUS_LIMITS, CSS_CURSOR_STATES, encodeSvgCursorDataUrl,
	findOppositeZone, generateUuidV7, mirrorCornerTuple, pxToRem, remToPx, THEME_PACKS, VERSION, type CornerTuple
} from '@chronos-ui/svelte';
import { findStarterSample, STARTER_BLUEPRINTS } from '../config';
import { DEFAULT_BUILD_CONFIG, planLocalAssistantPrompt, STUDIO_TOOL_REGISTRY, validateBlueprint } from '../core';
import { handleBuilderMcpRpc } from '../mcp';
import { emitProjectCssTokens } from '../plugins';
import { createStudioProject, listCursorPacks, updateCursorStateAsset } from '../server/routes';

describe('v0.0.7 true-stroke geometry, concentric ROUND arcs & configurable cornerRadiusRem', () => {
	test('clampCornerRadiusRem enforces 0.25rem-1.5rem bounds and emits --ui-corner-cut CSS token', () => {
		expect(VERSION).toBe('0.0.9');
		expect(CORNER_RADIUS_LIMITS.minRem).toBe(0.25);
		expect(CORNER_RADIUS_LIMITS.maxRem).toBe(1.5);
		expect(clampCornerRadiusRem(0.05)).toBe(0.25);
		expect(clampCornerRadiusRem(3.5)).toBe(1.5);
		expect(clampCornerRadiusRem(1.125)).toBe(1.125);
		const exported = emitProjectCssTokens({
			id: generateUuidV7(), slug: 'v007-rad', name: 'Radius Check', description: '',
			themeId: THEME_PACKS[0].id, cornerMode: 'ROUND', cornerRadiusRem: 1.25,
			activeCursorPackId: BUILTIN_CURSOR_PACKS[0].uuid, activeRevisionId: generateUuidV7(),
			nodes: [], buildConfig: DEFAULT_BUILD_CONFIG, updatedAt: Date.now()
		});
		expect(exported.content).toContain('--ui-corner-cut: 1.25rem;');
		expect(exported.content).toContain('--ui-cursor-zoom-in:');
		expect(exported.content).toContain('--ui-cursor-zoom-out:');
	});

	test('buildCurvedCornerEmbellishment emits concentric SVG A arcs in ROUND mode and scales with radius', () => {
		const roundCorners: CornerTuple = ['ROUND', 'ROUND', 'ROUND', 'ROUND'];
		const geom = buildShapeGeometry('BOX', 240, 120, 16, roundCorners);
		expect(geom.outerPath).toContain(' C ');
		for (const style of ['BRACKET', 'CARET', 'ARC'] as const) {
			const embs = buildCurvedCornerEmbellishment(style, 240, 120, 16, roundCorners);
			expect(embs.length).toBe(4);
			for (const emb of embs) {
				expect(emb.d).toContain(' A ');
				expect(emb.d).not.toContain(' L ');
			}
		}
		const ticks = buildCurvedCornerEmbellishment('TICKS', 240, 120, 16, roundCorners);
		expect(ticks.length).toBe(4);
		const contour = buildContourEmbellishments('BRACKET', geom.anchorVertices, 16, 1);
		expect(contour.length).toBe(4);
		expect(remToPx(1.25)).toBe(20);
		expect(pxToRem(16)).toBe(1);
		expect(findOppositeZone('TOP_RIGHT')).toBe('TOP_LEFT');
		expect(findOppositeZone('WORLD_CANVAS')).toBeNull();
		const small = buildCurvedCornerEmbellishment('BRACKET', 240, 120, 6, roundCorners);
		const large = buildCurvedCornerEmbellishment('BRACKET', 240, 120, 22, roundCorners);
		expect(small[0].d).not.toBe(large[0].d);
		expect(large[0].d).toContain('A 26.0 26.0 0 0 1');
	});

	test('validateBlueprint accepts ROUND corners alongside CHAMFER and STRAIGHT', () => {
		const base = STARTER_BLUEPRINTS[0];
		const roundBp = {
			...base,
			zones: base.zones.map((z) => ({ ...z, corners: ['ROUND', 'ROUND', 'CHAMFER', 'STRAIGHT'] as CornerTuple }))
		};
		expect(validateBlueprint(roundBp).ok).toBe(true);
	});
});

describe('v0.0.7 hardened 21-state CSS cursor engine', () => {
	test('encodeSvgCursorDataUrl enforces 32x32 viewBox with percent-encoded hex and zero raw #', () => {
		expect(CSS_CURSOR_STATES.length).toBe(21);
		for (const st of ['alias', 'copy', 'zoom-in', 'zoom-out'] as const) expect(CSS_CURSOR_STATES).toContain(st);
		const accent = THEME_PACKS[0].tokens['--ui-accent-vivid'];
		const encoded = encodeSvgCursorDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M4 4 L20 20" stroke="${accent}"/></svg>`);
		expect(encoded.startsWith('data:image/svg+xml,')).toBe(true);
		expect(encoded).toContain('width=%2232%22');
		expect(encoded).toContain('height=%2232%22');
		expect(encoded).toContain('%23');
		expect(encoded).not.toContain('#');
		expect(BUILTIN_CURSOR_PACKS[0].states.default.assetDataUrl).toContain('width=%2232%22');
	});

	test('buildCursorPackCssSheet hardens backdrop, drag-grip, pan-stage and disabled selectors with !important', () => {
		const pack = BUILTIN_CURSOR_PACKS[0];
		expect(Object.keys(pack.states).length).toBe(21);
		const css = buildCursorPackCssSheet(pack);
		expect(css).toContain('!important');
		expect(css).toContain('[data-ui-modal-backdrop]');
		expect(css).toContain(':not(:disabled):not([aria-disabled="true"])');
		expect(css).toContain('[data-ui-drag-grip]');
		expect(css).toContain('[data-ui-pan-stage]');
		expect(css).toContain(':disabled');
		for (const st of CSS_CURSOR_STATES) expect(css).toContain(`--ui-cursor-${st}:`);
	});

	test('bulk listCursorPacks & updateCursorStateAsset reject unsafe XSS data URLs', async () => {
		const packs = await listCursorPacks();
		expect(packs.length).toBeGreaterThanOrEqual(4);
		expect(Object.keys(packs[0].states).length).toBe(21);
		await expect(updateCursorStateAsset(packs[0].uuid, 'pointer', { assetDataUrl: 'data:image/svg+xml,<svg><script>alert(1)</script></svg>' })).rejects.toThrow();
	});
});

describe('v0.0.7 Station Builder, Zone Edition, 33-tool MCP parity & local assistant intents', () => {
	test('exposes 33 parity tools and executes all 6 station/zone/radius MCP tools with DB persistence', async () => {
		const listRes = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 700, method: 'tools/list' });
		const tools = (listRes.result as unknown as { tools: { name: string }[] }).tools;
		expect(tools.length).toBe(35);
		expect(STUDIO_TOOL_REGISTRY.length).toBe(35);
		const sample = findStarterSample('sample-shape-matrix')!;
		const created = await createStudioProject({ name: 'v007 Station Spec', themeId: sample.themeId, nodes: sample.nodes.slice(0, 2).map((n) => ({ ...n, id: generateUuidV7() })) });
		const radRes = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 701, method: 'tools/call', params: { name: 'ui_set_corner_radius', arguments: { projectId: created.id, cornerRadiusRem: 1.125, cornerMode: 'ROUND' } } });
		expect(radRes.error).toBeUndefined();
		const radPayload = JSON.parse((radRes.result as unknown as { content: { text: string }[] }).content[0].text);
		expect(radPayload.cornerRadiusRem).toBe(1.125);
		expect(radPayload.project.cornerRadiusRem).toBe(1.125);

		const stRes = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 702, method: 'tools/call', params: { name: 'ui_configure_station_layer', arguments: { showGrid: false, bilateralMirror: true } } });
		expect(stRes.error).toBeUndefined();

		const customCorners: CornerTuple = ['ROUND', 'STRAIGHT', 'CHAMFER', 'STRAIGHT'];
		const zoneRes = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 703, method: 'tools/call', params: { name: 'ui_edit_zone_disposition', arguments: { zoneId: 'TOP_RIGHT', corners: customCorners, cornerRadiusRem: 1.0, mirrorOpposite: true } } });
		expect(zoneRes.error).toBeUndefined();
		const zonePayload = JSON.parse((zoneRes.result as unknown as { content: { text: string }[] }).content[0].text);
		expect(zonePayload.mirroredZoneId).toBe('TOP_LEFT');
		const topLeft = zonePayload.blueprint.zones.find((z: { id: string }) => z.id === 'TOP_LEFT');
		expect(topLeft.corners).toEqual(mirrorCornerTuple(customCorners));
		expect(topLeft.cornerRadiusRem).toBe(1.0);

		const moveRes = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 704, method: 'tools/call', params: { name: 'ui_move_entity_to_zone', arguments: { projectId: created.id, nodeId: created.nodes[0].id, targetZone: 'RIGHT_EDGE' } } });
		expect(moveRes.error).toBeUndefined();
		const movePayload = JSON.parse((moveRes.result as unknown as { content: { text: string }[] }).content[0].text);
		expect(movePayload.project.nodes.find((n: { id: string }) => n.id === created.nodes[0].id).zone).toBe('RIGHT_EDGE');

		const openSt = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 705, method: 'tools/call', params: { name: 'ui_open_station_builder', arguments: { layer: 'zones' } } });
		const openZn = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 706, method: 'tools/call', params: { name: 'ui_open_zone_edition', arguments: { zoneId: 'BOTTOM_LEFT' } } });
		expect(openSt.error).toBeUndefined();
		expect(openZn.error).toBeUndefined();
	});

	test('local assistant planner maps natural language prompts to Station Builder, Zone Edition & Corner Radius tools', () => {
		expect(planLocalAssistantPrompt('open station builder').actions.some((a) => a.tool === 'ui_open_station_builder')).toBe(true);
		expect(planLocalAssistantPrompt('edit top right zone with 16px round corners').actions.some((a) => a.tool === 'ui_edit_zone_disposition')).toBe(true);
		expect(planLocalAssistantPrompt('set corner radius 1.25rem with diagonal drift').actions.some((a) => a.tool === 'ui_set_corner_radius')).toBe(true);
	});
});

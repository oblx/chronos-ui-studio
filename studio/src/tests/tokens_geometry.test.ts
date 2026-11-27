import { describe, expect, test } from 'bun:test';
import {
	buildClipPathPolygon,
	buildContourEmbellishments,
	buildPolygonPoints,
	buildShapeGeometry,
	classifyViewportTier,
	contrastRatio,
	DEFAULT_CHAMFER_TUPLE,
	mirrorCornerTuple,
	THEME_PACKS,
	UI_FRAME_SHAPES,
	validateThemePackContrast,
	VERSION
} from '@chronos-ui/svelte';

describe('tokens and corner geometry', () => {
	test('VERSION lock is 0.1.0, theme pack count is 6, and frame shape count is 14', () => {
		expect(VERSION).toBe('0.1.2');
		expect(THEME_PACKS.length).toBe(6);
		expect(UI_FRAME_SHAPES.length).toBe(14);
	});

	test('mirrorCornerTuple swaps left and right corners across X = 50vw', () => {
		const mirrored = mirrorCornerTuple(['CHAMFER', 'STRAIGHT', 'CHAMFER', 'STRAIGHT']);
		expect(mirrored).toEqual(['STRAIGHT', 'CHAMFER', 'STRAIGHT', 'CHAMFER']);
	});

	test('buildPolygonPoints and buildClipPathPolygon emit deterministic vectors', () => {
		const pts = buildPolygonPoints(200, 100, 10, ['CHAMFER', 'CHAMFER', 'CHAMFER', 'CHAMFER']);
		expect(pts.split(' ').length).toBe(8);
		const clip = buildClipPathPolygon(0.5, ['CHAMFER', 'STRAIGHT', 'STRAIGHT', 'CHAMFER']);
		expect(clip.startsWith('polygon(')).toBe(true);
	});

	test('all 14 shapes emit valid contour anchorVertices with unit outward normals', () => {
		for (const shape of UI_FRAME_SHAPES) {
			const geom = buildShapeGeometry(shape, 240, 120, 10, DEFAULT_CHAMFER_TUPLE);
			expect(geom.anchorVertices.length).toBeGreaterThanOrEqual(4);
			for (const v of geom.anchorVertices) {
				const mag = Math.hypot(v.normalX, v.normalY);
				expect(Math.abs(mag - 1)).toBeLessThan(0.05);
			}
			const embs = buildContourEmbellishments('BRACKET', geom.anchorVertices, 10, 1);
			expect(embs.length).toBe(geom.anchorVertices.length);
		}
	});

	test('all 6 built-in themes pass WCAG AA contrast', () => {
		for (const pack of THEME_PACKS) {
			for (const c of validateThemePackContrast(pack)) expect(c.passAa).toBe(true);
		}
		expect(contrastRatio('#EDF2F7', '#0B0F14')).toBeGreaterThan(14);
	});

	test('classifyViewportTier maps 5 responsive breakpoints', () => {
		expect(classifyViewportTier(390)).toBe('PHONE');
		expect(classifyViewportTier(820)).toBe('TABLET_PORTRAIT');
		expect(classifyViewportTier(1100)).toBe('TABLET_LANDSCAPE');
		expect(classifyViewportTier(1440)).toBe('DESKTOP');
		expect(classifyViewportTier(2560)).toBe('WQHD_UWQHD');
	});
});

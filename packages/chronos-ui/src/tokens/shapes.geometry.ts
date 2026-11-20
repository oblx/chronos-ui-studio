import { clampCornerCut, type CornerTuple } from './corners.geometry';
import { pxToRem } from './hud.constants';
import {
	buildCurvedOrBoxPaths, buildPolygonFlowPaths, buildUmlPaths,
	type InscribedContentBox, type ShapeAnchorVertex, type UiFrameShape
} from './shapes.paths';

export type { InscribedContentBox, ShapeAnchorVertex, UiFrameShape } from './shapes.paths';
export type CornerEmbellishment = 'NONE' | 'CARET' | 'BRACKET' | 'TICKS' | 'DOTS' | 'ARC';
export type CornerAnimation = 'NONE' | 'BREATHE' | 'SCAN_GLINT' | 'RETICLE_LOCK' | 'DIAGONAL_DRIFT';
export interface EmbellishmentConfig { readonly offsetRem: number; readonly amplitudeRem: number; readonly periodMs: number; }
export interface ContourEmbellishmentItem { readonly d: string; readonly nx: number; readonly ny: number; }
export interface FrameShapeGeometry {
	readonly outerPath: string; readonly innerBezelPath: string; readonly ornamentPath: string;
	readonly anchorVertices: readonly ShapeAnchorVertex[]; readonly safePaddingRem: readonly [number, number, number, number];
}

export const UI_FRAME_SHAPES: readonly UiFrameShape[] = [
	'BOX', 'UML_NOTE', 'UML_PACKAGE', 'UML_COMPONENT', 'UML_DATABASE', 'UML_NODE_3D',
	'HEXAGON', 'CAPSULE', 'DIAMOND', 'PARALLELOGRAM', 'TRAPEZOID', 'OCTAGON', 'DOCUMENT', 'SIGNAL_SEND'
] as const;
export const CORNER_EMBELLISHMENTS: readonly CornerEmbellishment[] = ['NONE', 'CARET', 'BRACKET', 'TICKS', 'DOTS', 'ARC'] as const;
export const CORNER_ANIMATIONS: readonly CornerAnimation[] = ['NONE', 'BREATHE', 'SCAN_GLINT', 'RETICLE_LOCK', 'DIAGONAL_DRIFT'] as const;
export const DEFAULT_EMBELLISHMENT_CONFIG: EmbellishmentConfig = { offsetRem: 0.125, amplitudeRem: 0.25, periodMs: 1800 };

const S1_2 = Math.SQRT1_2;
const n = (v: number): string => v.toFixed(1);
const toRem = (b: InscribedContentBox): readonly [number, number, number, number] => [
	pxToRem(b.topPx), pxToRem(b.rightPx), pxToRem(b.bottomPx), pxToRem(b.leftPx)
];
const UML_SET = new Set<UiFrameShape>(['UML_NOTE', 'UML_PACKAGE', 'UML_COMPONENT', 'UML_NODE_3D']);
const FLOW_SET = new Set<UiFrameShape>(['DIAMOND', 'PARALLELOGRAM', 'TRAPEZOID', 'OCTAGON', 'DOCUMENT', 'SIGNAL_SEND']);

export function computeInscribedContentBox(shape: UiFrameShape, w: number, h: number, cutPx: number): InscribedContentBox {
	const pad = Math.max(6, Math.round(cutPx * 0.7));
	if (shape === 'UML_NOTE') {
		const fold = Math.max(12, Math.min(22, cutPx * 1.5, Math.min(w, h) * 0.25));
		return { topPx: pad + 4, rightPx: Math.round(fold * 0.95) + 4, bottomPx: pad + 2, leftPx: pad + 4 };
	}
	if (shape === 'UML_PACKAGE') return { topPx: Math.round(Math.max(14, Math.min(20, h * 0.22)) + 10), rightPx: pad + 4, bottomPx: pad + 2, leftPx: pad + 4 };
	if (shape === 'UML_COMPONENT') return { topPx: pad + 3, rightPx: pad + 4, bottomPx: pad + 3, leftPx: 18 + pad };
	if (shape === 'UML_DATABASE') {
		const ry = Math.max(6, Math.min(13, h * 0.16));
		return { topPx: Math.round(ry * 2 + 6), rightPx: pad + 4, bottomPx: Math.round(ry + 6), leftPx: pad + 4 };
	}
	if (shape === 'UML_NODE_3D') {
		const d = Math.max(8, Math.min(14, Math.min(w, h) * 0.16));
		return { topPx: Math.round(d + 7), rightPx: Math.round(d + 7), bottomPx: pad + 2, leftPx: pad + 2 };
	}
	if (shape === 'HEXAGON' || shape === 'OCTAGON' || shape === 'PARALLELOGRAM' || shape === 'TRAPEZOID') {
		const dx = Math.max(12, Math.min(26, w * 0.14));
		return { topPx: pad + 2, rightPx: Math.round(dx * 0.85) + 6, bottomPx: pad + 2, leftPx: Math.round(dx * 0.85) + 6 };
	}
	if (shape === 'CAPSULE') {
		const r = Math.min(w * 0.48, (h - 2) * 0.5);
		return { topPx: Math.max(5, Math.round(pad * 0.7)), rightPx: Math.round(r * 0.45) + 6, bottomPx: Math.max(5, Math.round(pad * 0.7)), leftPx: Math.round(r * 0.45) + 6 };
	}
	if (shape === 'DIAMOND') return { topPx: Math.max(12, Math.round(h * 0.2)), rightPx: Math.max(18, Math.round(w * 0.18)), bottomPx: Math.max(12, Math.round(h * 0.2)), leftPx: Math.max(18, Math.round(w * 0.18)) };
	if (shape === 'DOCUMENT') return { topPx: pad + 2, rightPx: pad + 4, bottomPx: Math.max(14, Math.round(h * 0.16)), leftPx: pad + 4 };
	if (shape === 'SIGNAL_SEND') return { topPx: pad + 2, rightPx: Math.max(16, Math.round(w * 0.14)), bottomPx: pad + 2, leftPx: pad + 4 };
	return { topPx: Math.max(5, Math.round(cutPx * 0.6)), rightPx: Math.max(6, Math.round(cutPx * 0.8)), bottomPx: Math.max(5, Math.round(cutPx * 0.6)), leftPx: Math.max(6, Math.round(cutPx * 0.8)) };
}

export function buildShapeGeometry(shape: UiFrameShape, w: number, h: number, cutPx: number, tuple: CornerTuple): FrameShapeGeometry {
	const spec = UML_SET.has(shape)
		? buildUmlPaths(shape, w, h, cutPx, tuple)
		: FLOW_SET.has(shape) ? buildPolygonFlowPaths(shape, w, h) : buildCurvedOrBoxPaths(shape, w, h, cutPx, tuple);
	return { ...spec, safePaddingRem: toRem(computeInscribedContentBox(shape, w, h, cutPx)) };
}

function buildVertexPath(emb: CornerEmbellishment, v: ShapeAnchorVertex, arm: number, offsetPx: number): string {
	const ox = v.x + v.normalX * offsetPx;
	const oy = v.y + v.normalY * offsetPx;
	const tx = -v.normalY;
	const ty = v.normalX;
	const p1x = ox - tx * arm * 0.6 - v.normalX * arm * 0.42;
	const p1y = oy - ty * arm * 0.6 - v.normalY * arm * 0.42;
	const p2x = ox + tx * arm * 0.6 - v.normalX * arm * 0.42;
	const p2y = oy + ty * arm * 0.6 - v.normalY * arm * 0.42;
	if (emb === 'DOTS') return `M ${n(ox - 1.5)} ${n(oy)} a 1.5 1.5 0 1 0 3 0 a 1.5 1.5 0 1 0 -3 0`;
	if (emb === 'TICKS') return `M ${n(ox - tx * 4.5)} ${n(oy - ty * 4.5)} L ${n(ox + tx * 4.5)} ${n(oy + ty * 4.5)} M ${n(ox - v.normalX * 1.5)} ${n(oy - v.normalY * 1.5)} L ${n(ox + v.normalX * 3)} ${n(oy + v.normalY * 3)}`;
	if (emb === 'ARC') return `M ${n(p1x)} ${n(p1y)} Q ${n(ox + v.normalX * 3.5)} ${n(oy + v.normalY * 3.5)} ${n(p2x)} ${n(p2y)}`;
	if (emb === 'BRACKET') return `M ${n(p1x)} ${n(p1y)} L ${n(ox + v.normalX * 1.5)} ${n(oy + v.normalY * 1.5)} L ${n(p2x)} ${n(p2y)}`;
	return `M ${n(p1x)} ${n(p1y)} L ${n(ox)} ${n(oy)} L ${n(p2x)} ${n(p2y)}`;
}

function buildRoundCornerItem(
	emb: CornerEmbellishment, cx: number, cy: number, rOut: number, sdx: number, sdy: number, edx: number, edy: number, nx: number, ny: number
): ContourEmbellishmentItem {
	const mx = cx + nx * rOut;
	const my = cy + ny * rOut;
	if (emb === 'DOTS') return { d: `M ${n(mx - 1.5)} ${n(my)} a 1.5 1.5 0 1 0 3 0 a 1.5 1.5 0 1 0 -3 0`, nx, ny };
	if (emb === 'TICKS') {
		const a1x = cx + (nx * 0.924 - ny * 0.383) * rOut;
		const a1y = cy + (ny * 0.924 + nx * 0.383) * rOut;
		const a2x = cx + (nx * 0.924 + ny * 0.383) * rOut;
		const a2y = cy + (ny * 0.924 - nx * 0.383) * rOut;
		return { d: `M ${n(mx)} ${n(my)} L ${n(mx + nx * 3.5)} ${n(my + ny * 3.5)} M ${n(a1x)} ${n(a1y)} L ${n(a1x + nx * 2.4)} ${n(a1y + ny * 2.4)} M ${n(a2x)} ${n(a2y)} L ${n(a2x + nx * 2.4)} ${n(a2y + ny * 2.4)}`, nx, ny };
	}
	const rArc = emb === 'BRACKET' ? rOut + 1.5 : rOut;
	const sx = cx + sdx * rArc;
	const sy = cy + sdy * rArc;
	const ex = cx + edx * rArc;
	const ey = cy + edy * rArc;
	return { d: `M ${n(sx)} ${n(sy)} A ${n(rArc)} ${n(rArc)} 0 0 1 ${n(ex)} ${n(ey)}`, nx, ny };
}

export function buildCurvedCornerEmbellishment(
	embellishment: CornerEmbellishment, w: number, h: number, cutPx: number, tuple: CornerTuple, offsetPx = 1.5
): readonly ContourEmbellishmentItem[] {
	if (embellishment === 'NONE') return [];
	const r = Math.max(2, clampCornerCut(w, h, cutPx));
	const rOut = r + offsetPx;
	const arm = Math.max(6, Math.min(11, cutPx + 1));
	const inset = 0.75;
	const corners: readonly [number, number, number, number, number, number, number, number, 0 | 1 | 2 | 3][] = [
		[inset + r, inset + r, -1, 0, 0, -1, -S1_2, -S1_2, 0],
		[w - inset - r, inset + r, 0, -1, 1, 0, S1_2, -S1_2, 1],
		[w - inset - r, h - inset - r, 1, 0, 0, 1, S1_2, S1_2, 2],
		[inset + r, h - inset - r, 0, 1, -1, 0, -S1_2, S1_2, 3]
	];
	const geom = buildShapeGeometry('BOX', w, h, cutPx, tuple);
	return corners.map(([cx, cy, sdx, sdy, edx, edy, nx, ny, idx]) => (
		tuple[idx] === 'ROUND'
			? buildRoundCornerItem(embellishment, cx, cy, rOut, sdx, sdy, edx, edy, nx, ny)
			: { d: buildVertexPath(embellishment, geom.anchorVertices[idx], arm, offsetPx), nx, ny }
	));
}

export function buildContourEmbellishments(
	embellishment: CornerEmbellishment, vertices: readonly ShapeAnchorVertex[], cutPx: number, offsetPx = 1
): readonly ContourEmbellishmentItem[] {
	if (embellishment === 'NONE' || vertices.length === 0) return [];
	const arm = Math.max(6, Math.min(11, cutPx + 1));
	return vertices.map((v) => ({ d: buildVertexPath(embellishment, v, arm, offsetPx), nx: v.normalX, ny: v.normalY }));
}

export function buildCornerEmbellishmentPath(embellishment: CornerEmbellishment, w: number, h: number, cut: number): string {
	if (embellishment === 'NONE' || embellishment === 'CARET') return '';
	const geom = buildShapeGeometry('BOX', w, h, cut, ['STRAIGHT', 'STRAIGHT', 'STRAIGHT', 'STRAIGHT']);
	return buildContourEmbellishments(embellishment, geom.anchorVertices, cut, 1).map((item) => item.d).join(' ');
}

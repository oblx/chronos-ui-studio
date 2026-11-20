export type CornerKind = 'CHAMFER' | 'STRAIGHT' | 'ROUND';
export type CornerVertex = CornerKind;
export type CornerTuple = readonly [CornerKind, CornerKind, CornerKind, CornerKind];
export interface CaretSegment { readonly points: string; }

export const CORNER_MODES: readonly CornerKind[] = ['CHAMFER', 'ROUND', 'STRAIGHT'] as const;
export const DEFAULT_CHAMFER_TUPLE: CornerTuple = ['CHAMFER', 'CHAMFER', 'CHAMFER', 'CHAMFER'] as const;
export const ROUND_TUPLE: CornerTuple = ['ROUND', 'ROUND', 'ROUND', 'ROUND'] as const;
export const STRAIGHT_TUPLE: CornerTuple = ['STRAIGHT', 'STRAIGHT', 'STRAIGHT', 'STRAIGHT'] as const;

export function mirrorCornerTuple(tuple: CornerTuple): CornerTuple {
	return [tuple[1], tuple[0], tuple[3], tuple[2]] as const;
}

export function resolveCornerTuple(tuple: CornerTuple, mode: CornerKind): CornerTuple {
	if (mode === 'STRAIGHT') return STRAIGHT_TUPLE;
	if (mode === 'ROUND') return tuple.map((c) => (c === 'STRAIGHT' ? 'STRAIGHT' : 'ROUND')) as unknown as CornerTuple;
	return tuple;
}

const BEZIER_KAPPA = 0.55228;
const fmt = (n: number): string => n.toFixed(1);

function morphCornerSegment(kind: CornerKind, cx: number, cy: number, ix: number, iy: number, ox: number, oy: number): string {
	if (kind === 'STRAIGHT') return `L ${fmt(cx)} ${fmt(cy)} C ${fmt(cx)} ${fmt(cy)} ${fmt(cx)} ${fmt(cy)} ${fmt(cx)} ${fmt(cy)}`;
	if (kind === 'CHAMFER') {
		const c1x = ix + (ox - ix) * 0.3333;
		const c1y = iy + (oy - iy) * 0.3333;
		const c2x = ix + (ox - ix) * 0.6667;
		const c2y = iy + (oy - iy) * 0.6667;
		return `L ${fmt(ix)} ${fmt(iy)} C ${fmt(c1x)} ${fmt(c1y)} ${fmt(c2x)} ${fmt(c2y)} ${fmt(ox)} ${fmt(oy)}`;
	}
	const c1x = ix + (cx - ix) * BEZIER_KAPPA;
	const c1y = iy + (cy - iy) * BEZIER_KAPPA;
	const c2x = ox + (cx - ox) * BEZIER_KAPPA;
	const c2y = oy + (cy - oy) * BEZIER_KAPPA;
	return `L ${fmt(ix)} ${fmt(iy)} C ${fmt(c1x)} ${fmt(c1y)} ${fmt(c2x)} ${fmt(c2y)} ${fmt(ox)} ${fmt(oy)}`;
}

export const clampCornerCut = (w: number, h: number, cut: number): number => Math.max(0, Math.min(cut, Math.min(w, h) * 0.42));

export function buildMorphableCornerPath(w: number, h: number, cut: number, tuple: CornerTuple, inset = 0): string {
	const c = clampCornerCut(w, h, cut);
	const x0 = inset;
	const y0 = inset;
	const x1 = Math.max(inset + 1, w - inset);
	const y1 = Math.max(inset + 1, h - inset);
	const startX = tuple[0] === 'STRAIGHT' ? x0 : x0 + c;
	const tr = morphCornerSegment(tuple[1], x1, y0, x1 - c, y0, x1, y0 + c);
	const br = morphCornerSegment(tuple[2], x1, y1, x1, y1 - c, x1 - c, y1);
	const bl = morphCornerSegment(tuple[3], x0, y1, x0 + c, y1, x0, y1 - c);
	const tl = morphCornerSegment(tuple[0], x0, y0, x0, y0 + c, x0 + c, y0);
	return `M ${fmt(startX)} ${fmt(y0)} ${tr} ${br} ${bl} ${tl} Z`;
}

export function buildHullSvgPath(w: number, h: number, cut: number, tuple: CornerTuple, inset = 0): string {
	return buildMorphableCornerPath(w, h, cut, tuple, inset);
}

export function buildPolygonPoints(w: number, h: number, cut: number, tuple: CornerTuple, inset = 0): string {
	const c = clampCornerCut(w, h, cut);
	const x0 = inset;
	const y0 = inset;
	const x1 = Math.max(inset + 1, w - inset);
	const y1 = Math.max(inset + 1, h - inset);
	const pts: [number, number][] = [tuple[0] === 'STRAIGHT' ? [x0, y0] : [x0 + c, y0]];
	if (tuple[1] === 'STRAIGHT') pts.push([x1, y0]); else pts.push([x1 - c, y0], [x1, y0 + c]);
	if (tuple[2] === 'STRAIGHT') pts.push([x1, y1]); else pts.push([x1, y1 - c], [x1 - c, y1]);
	if (tuple[3] === 'STRAIGHT') pts.push([x0, y1]); else pts.push([x0 + c, y1], [x0, y1 - c]);
	if (tuple[0] !== 'STRAIGHT') pts.push([x0, y0 + c]);
	return pts.map(([vx, vy]) => `${fmt(vx)},${fmt(vy)}`).join(' ');
}

export function buildClipPathPolygon(cutRem: number, tuple: CornerTuple): string {
	if (tuple.includes('ROUND')) return `inset(0 round ${tuple.map((k) => (k === 'ROUND' ? `${cutRem}rem` : '0')).join(' ')})`;
	const c = `${cutRem}rem`;
	const tl = tuple[0] === 'CHAMFER' ? `${c} 0` : '0 0';
	const tr = tuple[1] === 'CHAMFER' ? `calc(100% - ${c}) 0, 100% ${c}` : '100% 0';
	const br = tuple[2] === 'CHAMFER' ? `100% calc(100% - ${c}), calc(100% - ${c}) 100%` : '100% 100%';
	const bl = tuple[3] === 'CHAMFER' ? `${c} 100%, 0 calc(100% - ${c})` : '0 100%';
	return `polygon(${tl}, ${tr}, ${br}, ${bl}${tuple[0] === 'CHAMFER' ? `, 0 ${c}` : ''})`;
}

export const ZONE_CORNER_PRESETS = {
	WORLD_CANVAS: DEFAULT_CHAMFER_TUPLE,
	TOP_LEFT: ['CHAMFER', 'CHAMFER', 'STRAIGHT', 'CHAMFER'] as CornerTuple,
	TOP_CENTER: DEFAULT_CHAMFER_TUPLE,
	TOP_RIGHT: mirrorCornerTuple(['CHAMFER', 'CHAMFER', 'STRAIGHT', 'CHAMFER']),
	PROJECT_TAB_DECK: ['STRAIGHT', 'STRAIGHT', 'CHAMFER', 'CHAMFER'] as CornerTuple,
	PROJECT_DECK: ['STRAIGHT', 'STRAIGHT', 'CHAMFER', 'CHAMFER'] as CornerTuple,
	BOTTOM_LEFT: ['CHAMFER', 'STRAIGHT', 'CHAMFER', 'CHAMFER'] as CornerTuple,
	BOTTOM_RIGHT: mirrorCornerTuple(['CHAMFER', 'STRAIGHT', 'CHAMFER', 'CHAMFER']),
	BOTTOM_CENTER: ['CHAMFER', 'CHAMFER', 'STRAIGHT', 'STRAIGHT'] as CornerTuple,
	LEFT_EDGE: ['STRAIGHT', 'CHAMFER', 'CHAMFER', 'STRAIGHT'] as CornerTuple,
	RIGHT_EDGE: mirrorCornerTuple(['STRAIGHT', 'CHAMFER', 'CHAMFER', 'STRAIGHT']),
	MODAL_OVERLAY_STACK: DEFAULT_CHAMFER_TUPLE,
	EDGE_TOP_CAP_LEFT: ['CHAMFER', 'CHAMFER', 'STRAIGHT', 'STRAIGHT'] as CornerTuple,
	EDGE_BOT_CAP_LEFT: ['STRAIGHT', 'STRAIGHT', 'CHAMFER', 'CHAMFER'] as CornerTuple
} as const;

export function buildCornerCarets(w: number, h: number, cut: number, tuple: CornerTuple, arm = 10): readonly CaretSegment[] {
	const c = clampCornerCut(w, h, cut);
	const s = Math.min(arm, c + 4);
	const specs: readonly [number, number, number, number, CornerKind][] = [
		[2, 2, 1, 1, tuple[0]], [w - 2, 2, -1, 1, tuple[1]], [w - 2, h - 2, -1, -1, tuple[2]], [2, h - 2, 1, -1, tuple[3]]
	];
	return specs.map(([x, y, sx, sy, kind]) => {
		if (kind !== 'CHAMFER') return { points: `${x + sx * s},${y} ${x},${y} ${x},${y + sy * s}` };
		const bx = x === 2 ? c : w - c;
		const by = y === 2 ? c : h - c;
		return { points: `${bx + sx * s},${y} ${bx},${y} ${x},${by} ${x},${by + sy * s}` };
	});
}

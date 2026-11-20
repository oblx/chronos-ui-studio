import { buildMorphableCornerPath, clampCornerCut, type CornerTuple } from './corners.geometry';

export type UiFrameShape = 'BOX' | 'UML_NOTE' | 'UML_PACKAGE' | 'UML_COMPONENT' | 'UML_DATABASE' | 'UML_NODE_3D' | 'HEXAGON' | 'CAPSULE' | 'DIAMOND' | 'PARALLELOGRAM' | 'TRAPEZOID' | 'OCTAGON' | 'DOCUMENT' | 'SIGNAL_SEND';
export interface InscribedContentBox { readonly topPx: number; readonly rightPx: number; readonly bottomPx: number; readonly leftPx: number; }
export interface ShapeAnchorVertex { readonly x: number; readonly y: number; readonly tangentDeg: number; readonly normalX: number; readonly normalY: number; readonly arcSweep?: boolean; }
export interface ShapePathSpec { readonly outerPath: string; readonly innerBezelPath: string; readonly ornamentPath: string; readonly anchorVertices: readonly ShapeAnchorVertex[]; }

const SQRT1_2 = Math.SQRT1_2;
const n = (v: number): string => v.toFixed(1);
const vtx = (x: number, y: number, nx: number, ny: number, arcSweep = false): ShapeAnchorVertex => ({
	x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), tangentDeg: Math.round((Math.atan2(ny, nx) * 180) / Math.PI),
	normalX: Number(nx.toFixed(3)), normalY: Number(ny.toFixed(3)), ...(arcSweep ? { arcSweep: true } : {})
});

export function buildUmlPaths(shape: UiFrameShape, w: number, h: number, cutPx: number, tuple: CornerTuple): ShapePathSpec {
	if (shape === 'UML_NOTE') {
		const fold = Math.max(12, Math.min(22, cutPx * 1.5, Math.min(w, h) * 0.25));
		return {
			outerPath: `M 1 1 L ${n(w - fold)} 1 L ${n(w - 1)} ${n(fold)} L ${n(w - 1)} ${n(h - 1)} L 1 ${n(h - 1)} Z`,
			innerBezelPath: `M 4 4 L ${n(w - fold - 1)} 4 L ${n(w - 4)} ${n(fold + 1)} L ${n(w - 4)} ${n(h - 4)} L 4 ${n(h - 4)} Z`,
			ornamentPath: `M ${n(w - fold)} 1 L ${n(w - fold)} ${n(fold)} L ${n(w - 1)} ${n(fold)}`,
			anchorVertices: [vtx(1, 1, -SQRT1_2, -SQRT1_2), vtx(w - fold * 0.5, fold * 0.5, SQRT1_2, -SQRT1_2), vtx(w - 1, h - 1, SQRT1_2, SQRT1_2), vtx(1, h - 1, -SQRT1_2, SQRT1_2)]
		};
	}
	if (shape === 'UML_PACKAGE') {
		const tabW = Math.max(44, Math.min(116, w * 0.36));
		const tabH = Math.max(14, Math.min(20, h * 0.22));
		return {
			outerPath: `M 1 ${n(tabH)} L 1 4 L 4 1 L ${n(tabW - 6)} 1 L ${n(tabW)} ${n(tabH)} L ${n(w - 1)} ${n(tabH)} L ${n(w - 1)} ${n(h - 1)} L 1 ${n(h - 1)} Z`,
			innerBezelPath: `M 4 ${n(tabH + 3)} L ${n(w - 4)} ${n(tabH + 3)} L ${n(w - 4)} ${n(h - 4)} L 4 ${n(h - 4)} Z`,
			ornamentPath: `M 1 ${n(tabH)} L ${n(tabW)} ${n(tabH)}`,
			anchorVertices: [vtx(2.5, 2.5, -SQRT1_2, -SQRT1_2), vtx(w - 1, tabH, SQRT1_2, -SQRT1_2), vtx(w - 1, h - 1, SQRT1_2, SQRT1_2), vtx(1, h - 1, -SQRT1_2, SQRT1_2)]
		};
	}
	if (shape === 'UML_COMPONENT') {
		const y1 = Math.max(8, h * 0.24);
		const y2 = Math.max(y1 + 14, h * 0.58);
		return {
			outerPath: `M 10 1 L ${n(w - 1)} 1 L ${n(w - 1)} ${n(h - 1)} L 10 ${n(h - 1)} Z`,
			innerBezelPath: buildMorphableCornerPath(w - 10, h, Math.max(4, cutPx * 0.5), tuple, 4),
			ornamentPath: `M 1 ${n(y1)} h 16 v 9 h -16 Z M 1 ${n(y2)} h 16 v 9 h -16 Z`,
			anchorVertices: [vtx(10, 1, -SQRT1_2, -SQRT1_2), vtx(w - 1, 1, SQRT1_2, -SQRT1_2), vtx(w - 1, h - 1, SQRT1_2, SQRT1_2), vtx(10, h - 1, -SQRT1_2, SQRT1_2)]
		};
	}
	const d = Math.max(8, Math.min(14, Math.min(w, h) * 0.16));
	return {
		outerPath: `M 1 ${n(d)} L ${n(d)} 1 L ${n(w - 1)} 1 L ${n(w - 1)} ${n(h - d)} L ${n(w - d)} ${n(h - 1)} L 1 ${n(h - 1)} Z`,
		innerBezelPath: `M 4 ${n(d + 3)} L ${n(w - d - 3)} ${n(d + 3)} L ${n(w - d - 3)} ${n(h - 4)} L 4 ${n(h - 4)} Z`,
		ornamentPath: `M 1 ${n(d)} L ${n(w - d)} ${n(d)} L ${n(w - d)} ${n(h - 1)} M ${n(w - d)} ${n(d)} L ${n(w - 1)} 1`,
		anchorVertices: [vtx(d * 0.5 + 0.5, d * 0.5 + 0.5, -SQRT1_2, -SQRT1_2), vtx(w - 1, 1, SQRT1_2, -SQRT1_2), vtx(w - d * 0.5 - 0.5, h - d * 0.5 - 0.5, SQRT1_2, SQRT1_2), vtx(1, h - 1, -SQRT1_2, SQRT1_2)]
	};
}

function buildQuadFlow(shape: UiFrameShape, w: number, h: number): ShapePathSpec {
	if (shape === 'DIAMOND') {
		const mx = w * 0.5;
		const my = h * 0.5;
		return {
			outerPath: `M ${n(mx)} 1 L ${n(w - 1)} ${n(my)} L ${n(mx)} ${n(h - 1)} L 1 ${n(my)} Z`,
			innerBezelPath: `M ${n(mx)} 5 L ${n(w - 6)} ${n(my)} L ${n(mx)} ${n(h - 5)} L 6 ${n(my)} Z`, ornamentPath: '',
			anchorVertices: [vtx(mx, 1, 0, -1), vtx(w - 1, my, 1, 0), vtx(mx, h - 1, 0, 1), vtx(1, my, -1, 0)]
		};
	}
	const sx = Math.max(12, Math.min(28, w * 0.14));
	if (shape === 'PARALLELOGRAM') {
		return {
			outerPath: `M ${n(sx)} 1 L ${n(w - 1)} 1 L ${n(w - sx)} ${n(h - 1)} L 1 ${n(h - 1)} Z`,
			innerBezelPath: `M ${n(sx + 3)} 4 L ${n(w - 5)} 4 L ${n(w - sx - 3)} ${n(h - 4)} L 5 ${n(h - 4)} Z`, ornamentPath: '',
			anchorVertices: [vtx(sx, 1, -SQRT1_2, -SQRT1_2), vtx(w - 1, 1, SQRT1_2, -SQRT1_2), vtx(w - sx, h - 1, SQRT1_2, SQRT1_2), vtx(1, h - 1, -SQRT1_2, SQRT1_2)]
		};
	}
	return {
		outerPath: `M ${n(sx)} 1 L ${n(w - sx)} 1 L ${n(w - 1)} ${n(h - 1)} L 1 ${n(h - 1)} Z`,
		innerBezelPath: `M ${n(sx + 3)} 4 L ${n(w - sx - 3)} 4 L ${n(w - 5)} ${n(h - 4)} L 5 ${n(h - 4)} Z`, ornamentPath: '',
		anchorVertices: [vtx(sx, 1, -SQRT1_2, -SQRT1_2), vtx(w - sx, 1, SQRT1_2, -SQRT1_2), vtx(w - 1, h - 1, SQRT1_2, SQRT1_2), vtx(1, h - 1, -SQRT1_2, SQRT1_2)]
	};
}

export function buildPolygonFlowPaths(shape: UiFrameShape, w: number, h: number): ShapePathSpec {
	if (shape === 'DIAMOND' || shape === 'PARALLELOGRAM' || shape === 'TRAPEZOID') return buildQuadFlow(shape, w, h);
	if (shape === 'OCTAGON') {
		const k = Math.max(10, Math.min(24, Math.min(w, h) * 0.24));
		const mid = 0.5 + k * 0.5;
		return {
			outerPath: `M ${n(k)} 1 L ${n(w - k)} 1 L ${n(w - 1)} ${n(k)} L ${n(w - 1)} ${n(h - k)} L ${n(w - k)} ${n(h - 1)} L ${n(k)} ${n(h - 1)} L 1 ${n(h - k)} L 1 ${n(k)} Z`,
			innerBezelPath: `M ${n(k + 2)} 4 L ${n(w - k - 2)} 4 L ${n(w - 4)} ${n(k + 2)} L ${n(w - 4)} ${n(h - k - 2)} L ${n(w - k - 2)} ${n(h - 4)} L ${n(k + 2)} ${n(h - 4)} L 4 ${n(h - k - 2)} L 4 ${n(k + 2)} Z`,
			ornamentPath: '',
			anchorVertices: [vtx(mid, mid, -SQRT1_2, -SQRT1_2), vtx(w - mid, mid, SQRT1_2, -SQRT1_2), vtx(w - mid, h - mid, SQRT1_2, SQRT1_2), vtx(mid, h - mid, -SQRT1_2, SQRT1_2)]
		};
	}
	if (shape === 'DOCUMENT') {
		const wave = Math.max(8, Math.min(16, h * 0.15));
		const yB = h - wave * 1.1;
		return {
			outerPath: `M 1 1 L ${n(w - 1)} 1 L ${n(w - 1)} ${n(yB)} Q ${n(w * 0.72)} ${n(yB - wave)} ${n(w * 0.5)} ${n(yB)} T 1 ${n(yB)} Z`,
			innerBezelPath: `M 4 4 L ${n(w - 4)} 4 L ${n(w - 4)} ${n(yB - 4)} L 4 ${n(yB - 4)} Z`, ornamentPath: '',
			anchorVertices: [vtx(1, 1, -SQRT1_2, -SQRT1_2), vtx(w - 1, 1, SQRT1_2, -SQRT1_2), vtx(w - 1, yB, SQRT1_2, SQRT1_2), vtx(1, yB, -SQRT1_2, SQRT1_2)]
		};
	}
	const tip = Math.max(14, Math.min(28, w * 0.14));
	return {
		outerPath: `M 1 1 L ${n(w - tip)} 1 L ${n(w - 1)} ${n(h * 0.5)} L ${n(w - tip)} ${n(h - 1)} L 1 ${n(h - 1)} Z`,
		innerBezelPath: `M 4 4 L ${n(w - tip - 2)} 4 L ${n(w - 5)} ${n(h * 0.5)} L ${n(w - tip - 2)} ${n(h - 4)} L 4 ${n(h - 4)} Z`, ornamentPath: '',
		anchorVertices: [vtx(1, 1, -SQRT1_2, -SQRT1_2), vtx(w - tip, 1, SQRT1_2, -SQRT1_2), vtx(w - 1, h * 0.5, 1, 0), vtx(w - tip, h - 1, SQRT1_2, SQRT1_2), vtx(1, h - 1, -SQRT1_2, SQRT1_2)]
	};
}

export function buildCurvedOrBoxPaths(shape: UiFrameShape, w: number, h: number, cutPx: number, tuple: CornerTuple): ShapePathSpec {
	if (shape === 'UML_DATABASE') {
		const rx = Math.max(10, (w - 2) * 0.5);
		const ry = Math.max(6, Math.min(13, h * 0.16));
		return {
			outerPath: `M 1 ${n(ry + 1)} A ${n(rx)} ${n(ry)} 0 0 1 ${n(w - 1)} ${n(ry + 1)} L ${n(w - 1)} ${n(h - ry - 1)} A ${n(rx)} ${n(ry)} 0 0 1 1 ${n(h - ry - 1)} Z`,
			ornamentPath: `M 1 ${n(ry + 1)} A ${n(rx)} ${n(ry)} 0 0 0 ${n(w - 1)} ${n(ry + 1)}`,
			innerBezelPath: `M 4 ${n(ry + 3)} A ${n(rx - 3)} ${n(Math.max(4, ry - 2))} 0 0 0 ${n(w - 4)} ${n(ry + 3)}`,
			anchorVertices: [vtx(1, ry + 1, -SQRT1_2, -SQRT1_2, true), vtx(w - 1, ry + 1, SQRT1_2, -SQRT1_2, true), vtx(w - 1, h - ry - 1, SQRT1_2, SQRT1_2, true), vtx(1, h - ry - 1, -SQRT1_2, SQRT1_2, true)]
		};
	}
	if (shape === 'HEXAGON') {
		const dx = Math.max(12, Math.min(26, w * 0.14));
		const mid = h * 0.5;
		return {
			outerPath: `M ${n(dx)} 1 L ${n(w - dx)} 1 L ${n(w - 1)} ${n(mid)} L ${n(w - dx)} ${n(h - 1)} L ${n(dx)} ${n(h - 1)} L 1 ${n(mid)} Z`,
			innerBezelPath: `M ${n(dx + 2)} 4 L ${n(w - dx - 2)} 4 L ${n(w - 4)} ${n(mid)} L ${n(w - dx - 2)} ${n(h - 4)} L ${n(dx + 2)} ${n(h - 4)} L 4 ${n(mid)} Z`, ornamentPath: '',
			anchorVertices: [vtx(dx, 1, -0.5, -0.866), vtx(w - dx, 1, 0.5, -0.866), vtx(w - 1, mid, 1, 0), vtx(w - dx, h - 1, 0.5, 0.866), vtx(dx, h - 1, -0.5, 0.866), vtx(1, mid, -1, 0)]
		};
	}
	if (shape === 'CAPSULE') {
		const rx = Math.max(4, Math.min(w * 0.48, (h - 2) * 0.5));
		const ry = Math.max(4, (h - 2) * 0.5);
		const cy = h * 0.5;
		return {
			outerPath: `M ${n(rx + 1)} 1 L ${n(w - rx - 1)} 1 A ${n(rx)} ${n(ry)} 0 0 1 ${n(w - rx - 1)} ${n(h - 1)} L ${n(rx + 1)} ${n(h - 1)} A ${n(rx)} ${n(ry)} 0 0 1 ${n(rx + 1)} 1 Z`,
			innerBezelPath: `M ${n(rx + 1)} 4 L ${n(w - rx - 1)} 4 A ${n(Math.max(2, rx - 3))} ${n(Math.max(2, ry - 3))} 0 0 1 ${n(w - rx - 1)} ${n(h - 4)} L ${n(rx + 1)} ${n(h - 4)} A ${n(Math.max(2, rx - 3))} ${n(Math.max(2, ry - 3))} 0 0 1 ${n(rx + 1)} 4 Z`,
			ornamentPath: '',
			anchorVertices: [vtx(rx + 1 - rx * SQRT1_2, cy - ry * SQRT1_2, -SQRT1_2, -SQRT1_2, true), vtx(w - rx - 1 + rx * SQRT1_2, cy - ry * SQRT1_2, SQRT1_2, -SQRT1_2, true), vtx(w - rx - 1 + rx * SQRT1_2, cy + ry * SQRT1_2, SQRT1_2, SQRT1_2, true), vtx(rx + 1 - rx * SQRT1_2, cy + ry * SQRT1_2, -SQRT1_2, SQRT1_2, true)]
		};
	}
	const c = clampCornerCut(w, h, cutPx);
	const boxV = (idx: 0 | 1 | 2 | 3, px: number, py: number, nx: number, ny: number): ShapeAnchorVertex => {
		const k = tuple[idx];
		const step = k === 'STRAIGHT' ? 0 : k === 'CHAMFER' ? c * 0.5 : c * (1 - SQRT1_2);
		return vtx(px - Math.sign(nx) * step, py - Math.sign(ny) * step, nx, ny, k === 'ROUND');
	};
	return {
		outerPath: buildMorphableCornerPath(w, h, cutPx, tuple, 0.75), innerBezelPath: buildMorphableCornerPath(w, h, Math.max(4, cutPx - 2), tuple, 3.5), ornamentPath: '',
		anchorVertices: [boxV(0, 0.75, 0.75, -SQRT1_2, -SQRT1_2), boxV(1, w - 0.75, 0.75, SQRT1_2, -SQRT1_2), boxV(2, w - 0.75, h - 0.75, SQRT1_2, SQRT1_2), boxV(3, 0.75, h - 0.75, -SQRT1_2, SQRT1_2)]
	};
}

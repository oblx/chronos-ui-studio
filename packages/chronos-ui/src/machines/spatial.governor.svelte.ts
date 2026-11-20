import { HUD_METRICS, pxToRem, ROOT_FONT_PX, SAFE_CORRIDOR_REM } from '../tokens';

export type LayoutDensity = 'CALM' | 'BALANCED' | 'TACTICAL';
export type CorridorBreakpointTier = 'COMPACT' | 'MEDIUM' | 'WIDE' | 'ULTRA';

export const LAYOUT_DENSITIES: readonly LayoutDensity[] = ['CALM', 'BALANCED', 'TACTICAL'] as const;

export interface SafeCorridorBounds {
	readonly topRem: number;
	readonly bottomRem: number;
	readonly sideRem: number;
	readonly topPx: number;
	readonly bottomPx: number;
	readonly sidePx: number;
	readonly usableWidthPx: number;
	readonly usableHeightPx: number;
}

export interface SlotRect {
	readonly slot: string;
	readonly left: number;
	readonly top: number;
	readonly right: number;
	readonly bottom: number;
}

export interface ViewportOccupancyReport {
	readonly viewport: { readonly width: number; readonly height: number };
	readonly chromeVisible: boolean;
	readonly density: LayoutDensity;
	readonly safeCorridor: SafeCorridorBounds;
	readonly slots: readonly SlotRect[];
	readonly collisions: readonly string[];
	readonly collisionCount: number;
}



export function classifyCorridorTier(viewportW: number): CorridorBreakpointTier {
	if (viewportW < 640) return 'COMPACT';
	if (viewportW < 1024) return 'MEDIUM';
	if (viewportW < 1920) return 'WIDE';
	return 'ULTRA';
}

export function measureActivePerimeterRects(root: ParentNode = document): readonly SlotRect[] {
	return [...root.querySelectorAll<HTMLElement>('[data-perimeter-zone]')]
		.filter((el) => el.offsetParent !== null)
		.map((el) => {
			const r = el.getBoundingClientRect();
			return { slot: el.getAttribute('data-perimeter-zone') ?? 'ZONE', left: r.left, top: r.top, right: r.right, bottom: r.bottom };
		});
}

export function computeSafeCorridorFromRects(
	viewportW: number,
	viewportH: number,
	chromeVisible: boolean,
	perimeterRects: readonly SlotRect[] = [],
	rootFontPx = ROOT_FONT_PX
): SafeCorridorBounds {
	const safeScale = Math.max(12, Math.min(24, rootFontPx));
	let topPx = Math.round((chromeVisible ? SAFE_CORRIDOR_REM.hudTop : SAFE_CORRIDOR_REM.calmTop) * safeScale);
	let bottomPx = Math.round((chromeVisible ? SAFE_CORRIDOR_REM.hudBottom : SAFE_CORRIDOR_REM.calmBottom) * safeScale);
	let leftPx = Math.round((chromeVisible ? SAFE_CORRIDOR_REM.hudSide : SAFE_CORRIDOR_REM.calmSide) * safeScale);
	let rightPx = leftPx;
	const midY = viewportH * 0.5;
	const midX = viewportW * 0.5;
	for (const rect of perimeterRects) {
		const w = rect.right - rect.left;
		const h = rect.bottom - rect.top;
		if (w <= 0 || h <= 0) continue;
		if (rect.bottom < midY && w > viewportW * 0.28) topPx = Math.max(topPx, Math.ceil(rect.bottom + 8));
		else if (rect.top > midY && w > viewportW * 0.28) bottomPx = Math.max(bottomPx, Math.ceil(viewportH - rect.top + 8));
		else if (rect.right < midX && h > viewportH * 0.25) leftPx = Math.max(leftPx, Math.ceil(rect.right + 8));
		else if (rect.left > midX && h > viewportH * 0.25) rightPx = Math.max(rightPx, Math.ceil(viewportW - rect.left + 8));
	}
	const sidePx = Math.max(leftPx, rightPx);
	return { topRem: pxToRem(topPx), bottomRem: pxToRem(bottomPx), sideRem: pxToRem(sidePx), topPx, bottomPx, sidePx, usableWidthPx: Math.max(0, viewportW - sidePx * 2), usableHeightPx: Math.max(0, viewportH - topPx - bottomPx) };
}

export function computeSafeCorridor(
	chromeVisible: boolean,
	viewportW: number,
	viewportH: number,
	rootFontPx = ROOT_FONT_PX
): SafeCorridorBounds {
	return computeSafeCorridorFromRects(viewportW, viewportH, chromeVisible, [], rootFontPx);
}

export function applySafeCorridorCssVars(
	bounds: SafeCorridorBounds,
	target: HTMLElement | null = typeof document !== 'undefined' ? document.documentElement : null
): void {
	if (!target) return;
	target.style.setProperty('--ui-safe-top', `${bounds.topRem}rem`);
	target.style.setProperty('--ui-safe-bottom', `${bounds.bottomRem}rem`);
	target.style.setProperty('--ui-safe-side', `${bounds.sideRem}rem`);
}

export function rectsIntersect(a: SlotRect, b: SlotRect): boolean {
	return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function detectSlotCollisions(slots: readonly SlotRect[]): string[] {
	const collisions: string[] = [];
	for (let i = 0; i < slots.length; i++) {
		for (let j = i + 1; j < slots.length; j++) {
			if (rectsIntersect(slots[i], slots[j])) collisions.push(`${slots[i].slot} <-> ${slots[j].slot}`);
		}
	}
	return collisions;
}

export function computeViewportOccupancy(opts: {
	readonly viewportW: number;
	readonly viewportH: number;
	readonly chromeVisible: boolean;
	readonly density: LayoutDensity;
	readonly leftPanelOpen: boolean;
	readonly rightPanelOpen: boolean;
	readonly toastVisible: boolean;
	readonly assistantExpanded: boolean;
}): ViewportOccupancyReport {
	const safeCorridor = computeSafeCorridor(opts.chromeVisible, opts.viewportW, opts.viewportH);
	const topBandH = Math.round((opts.chromeVisible ? HUD_METRICS.topBandRem : 3.5) * ROOT_FONT_PX);
	const botBandH = Math.round((opts.chromeVisible ? HUD_METRICS.bottomDockRem : 3.75) * ROOT_FONT_PX);
	const cx = Math.round(opts.viewportW / 2);
	const slots: SlotRect[] = [
		{ slot: 'TOP_PERIMETER', left: 0, top: 0, right: opts.viewportW, bottom: topBandH },
		{ slot: 'BOTTOM_PERIMETER', left: 0, top: opts.viewportH - botBandH, right: opts.viewportW, bottom: opts.viewportH }
	];
	if (opts.leftPanelOpen) slots.push({ slot: 'LEFT_PANEL', left: safeCorridor.sidePx, top: safeCorridor.topPx, right: safeCorridor.sidePx + 240, bottom: opts.viewportH - safeCorridor.bottomPx });
	if (opts.rightPanelOpen) slots.push({ slot: 'RIGHT_PANEL', left: opts.viewportW - safeCorridor.sidePx - 280, top: safeCorridor.topPx, right: opts.viewportW - safeCorridor.sidePx, bottom: opts.viewportH - safeCorridor.bottomPx });
	if (opts.toastVisible) slots.push({ slot: 'TOAST_STACK', left: cx - 180, top: safeCorridor.topPx, right: cx + 180, bottom: safeCorridor.topPx + 36 });
	if (opts.assistantExpanded) {
		const dockBottom = opts.viewportH - safeCorridor.bottomPx;
		slots.push({ slot: 'ASSISTANT_DOCK', left: cx - 260, top: Math.max(safeCorridor.topPx + 40, dockBottom - 260), right: cx + 260, bottom: dockBottom });
	}
	const collisions = detectSlotCollisions(slots);
	return { viewport: { width: opts.viewportW, height: opts.viewportH }, chromeVisible: opts.chromeVisible, density: opts.density, safeCorridor, slots, collisions, collisionCount: collisions.length };
}

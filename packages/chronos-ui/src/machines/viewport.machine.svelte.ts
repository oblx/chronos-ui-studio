import type { Action } from 'svelte/action';
import { BREAKPOINT_REM, type ViewportTier } from '../tokens';

export interface StageCamera {
	readonly panX: number;
	readonly panY: number;
	readonly zoom: number;
}

export function classifyViewportTier(widthPx: number, rootFontPx = 16): ViewportTier {
	const remWidth = widthPx / Math.max(10, rootFontPx);
	if (remWidth < BREAKPOINT_REM.phoneMax) return 'PHONE';
	if (remWidth < BREAKPOINT_REM.tabletPortraitMax) return 'TABLET_PORTRAIT';
	if (remWidth < BREAKPOINT_REM.tabletLandscapeMax) return 'TABLET_LANDSCAPE';
	if (remWidth < BREAKPOINT_REM.desktopMax) return 'DESKTOP';
	return 'WQHD_UWQHD';
}

export interface DragPanParams {
	readonly onPanDelta: (dx: number, dy: number) => void;
	readonly onZoomDelta: (delta: number) => void;
}

function makePanHandlers(node: HTMLElement, getParams: () => DragPanParams) {
	let panning = false;
	let lastX = 0;
	let lastY = 0;
	const onDown = (e: PointerEvent): void => {
		if (e.button !== 0 || (e.target as HTMLElement)?.closest('[data-ui-interactive]')) return;
		panning = true;
		lastX = e.clientX;
		lastY = e.clientY;
		node.setPointerCapture(e.pointerId);
	};
	const onMove = (e: PointerEvent): void => {
		if (!panning) return;
		getParams().onPanDelta(e.clientX - lastX, e.clientY - lastY);
		lastX = e.clientX;
		lastY = e.clientY;
	};
	const onUp = (e: PointerEvent): void => {
		if (!panning) return;
		panning = false;
		if (node.hasPointerCapture(e.pointerId)) node.releasePointerCapture(e.pointerId);
	};
	const onWheel = (e: WheelEvent): void => {
		e.preventDefault();
		getParams().onZoomDelta(e.deltaY > 0 ? -0.06 : 0.06);
	};
	return { onDown, onMove, onUp, onWheel };
}

export const uiDragPan: Action<HTMLElement, DragPanParams> = (node, initial) => {
	let params = initial;
	const { onDown, onMove, onUp, onWheel } = makePanHandlers(node, () => params);
	node.addEventListener('pointerdown', onDown);
	node.addEventListener('pointermove', onMove);
	node.addEventListener('pointerup', onUp);
	node.addEventListener('pointercancel', onUp);
	node.addEventListener('wheel', onWheel, { passive: false });
	return {
		update(next: DragPanParams) { params = next; },
		destroy() {
			node.removeEventListener('pointerdown', onDown);
			node.removeEventListener('pointermove', onMove);
			node.removeEventListener('pointerup', onUp);
			node.removeEventListener('pointercancel', onUp);
			node.removeEventListener('wheel', onWheel);
		}
	};
};

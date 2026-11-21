import type { Action } from 'svelte/action';
import { BREAKPOINT_REM, HUD_METRICS, ROOT_FONT_PX, STAGE_LIMITS, type ViewportTier } from '../tokens';

export interface StageCamera { readonly panX: number; readonly panY: number; readonly zoom: number; }
export interface StageGestureCommit extends StageCamera { readonly coalescedFrames: number; readonly durationMs: number; }
export interface BoundingRect2D { readonly left: number; readonly top: number; readonly width: number; readonly height: number; }
export interface DragPanParams { readonly onPanDelta: (dx: number, dy: number) => void; readonly onZoomDelta: (delta: number) => void; readonly onPanEnd?: () => void; }

const BLOCKED_ANCESTORS = '[data-ui-interactive], [data-testid="ui-assistant-dock"], [data-testid^="edge-rail"], [data-testid^="edge-drawer"], [role="dialog"]';

export function classifyViewportTier(widthPx: number, rootFontPx = ROOT_FONT_PX): ViewportTier {
	const remWidth = widthPx / Math.max(10, rootFontPx);
	if (remWidth < BREAKPOINT_REM.phoneMax) return 'PHONE';
	if (remWidth < BREAKPOINT_REM.tabletPortraitMax) return 'TABLET_PORTRAIT';
	if (remWidth < BREAKPOINT_REM.tabletLandscapeMax) return 'TABLET_LANDSCAPE';
	if (remWidth < BREAKPOINT_REM.desktopMax) return 'DESKTOP';
	return 'WQHD_UWQHD';
}

export function fitNodesToSafeCorridor(
	contentRect: BoundingRect2D,
	viewportRect: BoundingRect2D,
	insetRem = 2,
	rootFontPx = ROOT_FONT_PX
): StageCamera {
	const padPx = Math.max(0, insetRem * rootFontPx);
	const availW = Math.max(64, viewportRect.width - padPx * 2);
	const availH = Math.max(64, viewportRect.height - padPx * 2);
	if (contentRect.width <= 0 || contentRect.height <= 0) return { panX: 0, panY: 0, zoom: 1 };
	const fitScale = Math.min(1, availW / contentRect.width, availH / contentRect.height);
	const zoom = Number(Math.max(STAGE_LIMITS.zoomMin, Math.min(STAGE_LIMITS.zoomMax, fitScale)).toFixed(2));
	return { panX: 0, panY: 0, zoom };
}

export function isPointerInsideRect(clientX: number, clientY: number, rect: DOMRect | BoundingRect2D): boolean {
	return clientX >= rect.left && clientX <= rect.left + rect.width && clientY >= rect.top && clientY <= rect.top + rect.height;
}

function clampStageCamera(next: StageCamera): StageCamera {
	return {
		panX: Math.max(-STAGE_LIMITS.panMaxX, Math.min(STAGE_LIMITS.panMaxX, next.panX)),
		panY: Math.max(-STAGE_LIMITS.panMaxY, Math.min(STAGE_LIMITS.panMaxY, next.panY)),
		zoom: Number(Math.max(STAGE_LIMITS.zoomMin, Math.min(STAGE_LIMITS.zoomMax, next.zoom)).toFixed(2))
	};
}

export function createStagePanZoomCoalescer(
	initial: StageCamera,
	onLive: (camera: StageCamera) => void,
	onCommit: (commit: StageGestureCommit) => void,
	wheelSettleMs = HUD_METRICS.wheelSettleMs
) {
	let cam: StageCamera = clampStageCamera(initial);
	let frames = 0;
	let startedAt = 0;
	let settleTimer: ReturnType<typeof setTimeout> | null = null;

	const flush = (): void => {
		if (settleTimer) { clearTimeout(settleTimer); settleTimer = null; }
		if (frames === 0) return;
		const payload: StageGestureCommit = { ...cam, coalescedFrames: frames, durationMs: Math.max(0, Math.round(performance.now() - startedAt)) };
		frames = 0;
		startedAt = 0;
		onCommit(payload);
	};

	const tick = (dx: number, dy: number, dz: number, settle = false): StageCamera => {
		if (frames === 0) startedAt = performance.now();
		frames += 1;
		cam = clampStageCamera({ panX: cam.panX + dx, panY: cam.panY + dy, zoom: cam.zoom + dz });
		onLive(cam);
		if (settle) {
			if (settleTimer) clearTimeout(settleTimer);
			settleTimer = setTimeout(flush, wheelSettleMs);
		}
		return cam;
	};

	return {
		sync(next: StageCamera): void { cam = clampStageCamera(next); },
		tickPan(dx: number, dy: number): StageCamera { return tick(dx, dy, 0, false); },
		tickZoom(dz: number): StageCamera { return tick(0, 0, dz, true); },
		flush,
		destroy(): void { if (settleTimer) clearTimeout(settleTimer); settleTimer = null; frames = 0; }
	};
}

function makePanHandlers(node: HTMLElement, getParams: () => DragPanParams) {
	let panning = false, lastX = 0, lastY = 0;
	const onDown = (e: PointerEvent): void => {
		const target = e.target as HTMLElement | null;
		if (e.button !== 0 || !target || !node.contains(target) || target.closest(BLOCKED_ANCESTORS)) return;
		if (!isPointerInsideRect(e.clientX, e.clientY, node.getBoundingClientRect())) return;
		panning = true; lastX = e.clientX; lastY = e.clientY;
		node.dataset.uiCursor = 'grabbing';
		node.classList.add('cursor-grabbing');
		node.classList.remove('cursor-grab');
		node.setPointerCapture(e.pointerId);
	};
	const onMove = (e: PointerEvent): void => {
		if (!panning) return;
		getParams().onPanDelta(e.clientX - lastX, e.clientY - lastY);
		lastX = e.clientX; lastY = e.clientY;
	};
	const onUp = (e: PointerEvent): void => {
		if (!panning) return;
		panning = false;
		node.dataset.uiCursor = 'grab';
		node.classList.remove('cursor-grabbing');
		node.classList.add('cursor-grab');
		if (node.hasPointerCapture(e.pointerId)) node.releasePointerCapture(e.pointerId);
		getParams().onPanEnd?.();
	};
	const onWheel = (e: WheelEvent): void => {
		const target = e.target as HTMLElement | null;
		if (!target || !node.contains(target) || target.closest(BLOCKED_ANCESTORS)) return;
		if (!isPointerInsideRect(e.clientX, e.clientY, node.getBoundingClientRect())) return;
		if (!e.ctrlKey && !e.metaKey) return;
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

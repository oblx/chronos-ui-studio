import type { Action } from 'svelte/action';
import { clamp, HUD_METRICS, STAGE_LIMITS } from '../tokens';

export type FoldOverlayAxis = 'HORIZONTAL' | 'VERTICAL';
export type FoldOverlayEdge = 'LEFT' | 'RIGHT' | 'BOTTOM' | 'TOP';
export type FoldOverlayMode = 'DOCKED' | 'FLOATING';
export type FoldOverlayBehavior = 'OVERLAY_HOVER';

export interface FoldOverlayConfig {
	readonly axis: FoldOverlayAxis;
	readonly edge: FoldOverlayEdge;
	readonly mode?: FoldOverlayMode;
	readonly expanded?: boolean;
	readonly behavior?: FoldOverlayBehavior;
	readonly railOffsetPx?: number;
	readonly floatX?: number;
	readonly floatY?: number;
}

export interface FoldOverlayState {
	readonly axis: FoldOverlayAxis;
	readonly edge: FoldOverlayEdge;
	readonly mode: FoldOverlayMode;
	readonly expanded: boolean;
	readonly behavior: FoldOverlayBehavior;
	readonly railOffsetPx: number;
	readonly floatX: number;
	readonly floatY: number;
}

export interface FoldGripParams {
	readonly axis?: FoldOverlayAxis;
	readonly isFloating: boolean;
	readonly detachOnDrag?: boolean;
	readonly onToggleFloat?: () => void;
	readonly onMoveRail?: (deltaPrimary: number) => void;
	readonly onMoveFloat: (deltaX: number, deltaY: number) => void;
	readonly onDropFloat?: () => void;
}

export type DrawerGripParams = FoldGripParams;

export function clampFloatCoords(
	x: number,
	y: number,
	vw = STAGE_LIMITS.defaultMaxWidthPx + STAGE_LIMITS.floatPadRightPx,
	vh = STAGE_LIMITS.defaultMaxHeightPx + STAGE_LIMITS.floatPadBottomPx
): { floatX: number; floatY: number } {
	const maxW = Math.max(STAGE_LIMITS.floatMarginLeftPx, vw - STAGE_LIMITS.floatPadRightPx);
	const maxH = Math.max(STAGE_LIMITS.floatMarginTopPx, vh - STAGE_LIMITS.floatPadBottomPx);
	return { floatX: clamp(x, STAGE_LIMITS.floatMarginLeftPx, maxW), floatY: clamp(y, STAGE_LIMITS.floatMarginTopPx, maxH) };
}

export function createFoldOverlayMachine(config: FoldOverlayConfig) {
	let state: FoldOverlayState = {
		axis: config.axis,
		edge: config.edge,
		mode: config.mode ?? 'DOCKED',
		expanded: config.expanded ?? false,
		behavior: 'OVERLAY_HOVER',
		railOffsetPx: config.railOffsetPx ?? 0,
		floatX: config.floatX ?? STAGE_LIMITS.floatMarginLeftPx,
		floatY: config.floatY ?? STAGE_LIMITS.floatMarginTopPx
	};

	const setExpanded = (expanded: boolean): FoldOverlayState => { state = { ...state, expanded }; return state; };
	const toggleExpand = (): FoldOverlayState => setExpanded(!state.expanded);
	const toggleMode = (): FoldOverlayState => {
		const nextMode: FoldOverlayMode = state.mode === 'FLOATING' ? 'DOCKED' : 'FLOATING';
		state = { ...state, mode: nextMode, ...(nextMode === 'DOCKED' ? { railOffsetPx: 0 } : { expanded: true }) };
		return state;
	};
	const dock = (): FoldOverlayState => { state = { ...state, mode: 'DOCKED', railOffsetPx: 0 }; return state; };
	const moveRail = (deltaPrimary: number, limitPx = STAGE_LIMITS.railOffsetPx): FoldOverlayState => {
		state = { ...state, railOffsetPx: clamp(state.railOffsetPx + deltaPrimary, -limitPx, limitPx) };
		return state;
	};
	const moveFloat = (dx: number, dy: number, vw?: number, vh?: number): FoldOverlayState => {
		state = { ...state, mode: 'FLOATING', ...clampFloatCoords(state.floatX + dx, state.floatY + dy, vw, vh) };
		return state;
	};
	return {
		get state(): FoldOverlayState { return state; },
		setExpanded, toggleExpand, toggleMode, dock, moveRail, moveFloat
	};
}

interface DragTracker {
	active: boolean; moved: boolean; suppressClick: boolean;
	startX: number; startY: number; lastX: number; lastY: number;
}

function makeFoldGripHandlers(node: HTMLElement, getParams: () => FoldGripParams) {
	const drag: DragTracker = { active: false, moved: false, suppressClick: false, startX: 0, startY: 0, lastX: 0, lastY: 0 };
	const onDown = (e: PointerEvent): void => {
		if (e.button !== 0) return;
		Object.assign(drag, { active: true, moved: false, suppressClick: false, startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastY: e.clientY });
		if (node.setPointerCapture) try { node.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
	};
	const onMove = (e: PointerEvent): void => {
		if (!drag.active) return;
		if (!drag.moved && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) >= HUD_METRICS.dragThresholdPx) {
			drag.moved = true; drag.suppressClick = true;
		}
		if (!drag.moved) return;
		const dx = e.clientX - drag.lastX, dy = e.clientY - drag.lastY;
		drag.lastX = e.clientX; drag.lastY = e.clientY;
		const p = getParams();
		if (p.isFloating || p.detachOnDrag) p.onMoveFloat(dx, dy);
		else p.onMoveRail?.(p.axis === 'VERTICAL' ? dx : dy);
	};
	const onUp = (e: PointerEvent): void => {
		if (!drag.active) return;
		drag.active = false;
		if (node.hasPointerCapture && node.hasPointerCapture(e.pointerId)) node.releasePointerCapture(e.pointerId);
		const p = getParams();
		if (drag.moved) p.onDropFloat?.();
		else p.onToggleFloat?.();
	};
	const onClick = (e: MouseEvent): void => {
		if (!drag.suppressClick) return;
		drag.suppressClick = false; e.preventDefault(); e.stopPropagation();
	};
	return { onDown, onMove, onUp, onClick };
}

export const uiFoldGrip: Action<HTMLElement, FoldGripParams> = (node, initialParams) => {
	let params = initialParams;
	const { onDown, onMove, onUp, onClick } = makeFoldGripHandlers(node, () => params);
	node.addEventListener('pointerdown', onDown);
	window.addEventListener('pointermove', onMove);
	window.addEventListener('pointerup', onUp);
	window.addEventListener('pointercancel', onUp);
	node.addEventListener('click', onClick, true);
	return {
		update(nextParams: FoldGripParams) { params = nextParams; },
		destroy() {
			node.removeEventListener('pointerdown', onDown);
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('pointercancel', onUp);
			node.removeEventListener('click', onClick, true);
		}
	};
};

export const uiDrawerGrip = uiFoldGrip;

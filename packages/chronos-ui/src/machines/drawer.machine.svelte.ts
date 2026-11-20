import type { Action } from 'svelte/action';
import { HUD_METRICS } from '../tokens';

export interface DrawerGripParams {
	readonly isFloating: boolean;
	readonly detachOnDrag?: boolean;
	readonly onToggleFloat?: () => void;
	readonly onMoveRail?: (deltaY: number) => void;
	readonly onMoveFloat: (deltaX: number, deltaY: number) => void;
	readonly onDropFloat?: () => void;
}

interface DragTracker {
	active: boolean;
	moved: boolean;
	suppressClick: boolean;
	startX: number;
	startY: number;
	lastX: number;
	lastY: number;
}

function makeGripHandlers(node: HTMLElement, getParams: () => DrawerGripParams) {
	const drag: DragTracker = { active: false, moved: false, suppressClick: false, startX: 0, startY: 0, lastX: 0, lastY: 0 };
	const onDown = (e: PointerEvent): void => {
		if (e.button !== 0) return;
		Object.assign(drag, { active: true, moved: false, suppressClick: false, startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastY: e.clientY });
		if (node.setPointerCapture) try { node.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
	};
	const onMove = (e: PointerEvent): void => {
		if (!drag.active) return;
		if (!drag.moved && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) >= HUD_METRICS.dragThresholdPx) {
			drag.moved = true;
			drag.suppressClick = true;
		}
		if (!drag.moved) return;
		const dx = e.clientX - drag.lastX;
		const dy = e.clientY - drag.lastY;
		drag.lastX = e.clientX;
		drag.lastY = e.clientY;
		const p = getParams();
		if (p.isFloating || p.detachOnDrag) p.onMoveFloat(dx, dy);
		else p.onMoveRail?.(dy);
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
		drag.suppressClick = false;
		e.preventDefault();
		e.stopPropagation();
	};
	return { onDown, onMove, onUp, onClick };
}

export const uiDrawerGrip: Action<HTMLElement, DrawerGripParams> = (node, initialParams) => {
	let params = initialParams;
	const { onDown, onMove, onUp, onClick } = makeGripHandlers(node, () => params);
	node.addEventListener('pointerdown', onDown);
	window.addEventListener('pointermove', onMove);
	window.addEventListener('pointerup', onUp);
	window.addEventListener('pointercancel', onUp);
	node.addEventListener('click', onClick, true);
	return {
		update(nextParams: DrawerGripParams) { params = nextParams; },
		destroy() {
			node.removeEventListener('pointerdown', onDown);
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('pointercancel', onUp);
			node.removeEventListener('click', onClick, true);
		}
	};
};

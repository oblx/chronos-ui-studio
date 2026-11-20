import type { Action } from 'svelte/action';

export interface SwipeDeckParams {
	readonly stepPx?: number;
	readonly onStep?: (dir: -1 | 1) => void;
}

const AXIS_LOCK_PX = 8;
const INTERACTIVE_EXCLUDE = 'input, textarea, select, [data-ui-no-swipe]';

export const uiSwipeDeck: Action<HTMLElement, SwipeDeckParams | undefined> = (node, initial) => {
	let params = initial ?? {};
	let active = false;
	let startX = 0;
	let startY = 0;
	let startScroll = 0;
	let lockAxis: 'none' | 'x' | 'y' = 'none';

	const onDown = (e: PointerEvent): void => {
		if (e.button !== 0 || (e.target as HTMLElement | null)?.closest(INTERACTIVE_EXCLUDE)) return;
		active = true;
		startX = e.clientX;
		startY = e.clientY;
		startScroll = node.scrollLeft;
		lockAxis = 'none';
	};

	const onMove = (e: PointerEvent): void => {
		if (!active) return;
		const dx = e.clientX - startX;
		const dy = e.clientY - startY;
		if (lockAxis === 'none') {
			if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
			lockAxis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
		}
		if (lockAxis === 'x') node.scrollLeft = startScroll - dx;
	};

	const onUp = (): void => { active = false; lockAxis = 'none'; };
	const onGamepadStep = (e: Event): void => {
		const dir = (e as CustomEvent<-1 | 1>).detail;
		if (dir === -1 || dir === 1) params.onStep?.(dir);
	};

	node.addEventListener('pointerdown', onDown, { passive: true });
	window.addEventListener('pointermove', onMove, { passive: true });
	window.addEventListener('pointerup', onUp, { passive: true });
	window.addEventListener('pointercancel', onUp, { passive: true });
	node.addEventListener('ui:gamepad-deck-step', onGamepadStep);
	return {
		update(next) { params = next ?? {}; },
		destroy() {
			node.removeEventListener('pointerdown', onDown);
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('pointercancel', onUp);
			node.removeEventListener('ui:gamepad-deck-step', onGamepadStep);
		}
	};
};

const SCROLL_EDGE_TOLERANCE_PX = 4;
const MIN_STEP_PX = 180;
const STEP_RATIO = 0.72;

function attachScrollerListeners(node: HTMLElement, onSync: () => void): () => void {
	const onWheel = (e: WheelEvent): void => {
		if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
		e.preventDefault();
		node.scrollLeft += e.deltaY;
	};
	node.addEventListener('scroll', onSync, { passive: true });
	node.addEventListener('wheel', onWheel, { passive: false });
	const ro = new ResizeObserver(onSync);
	ro.observe(node);
	return () => {
		node.removeEventListener('scroll', onSync);
		node.removeEventListener('wheel', onWheel);
		ro.disconnect();
	};
}

export function createCarouselMachine() {
	let scroller: HTMLElement | null = null;
	let canPrev = $state(false);
	let canNext = $state(false);

	const syncBounds = (): void => {
		if (!scroller) return;
		canPrev = scroller.scrollLeft > SCROLL_EDGE_TOLERANCE_PX;
		canNext = scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - SCROLL_EDGE_TOLERANCE_PX;
	};

	const stepBy = (dir: -1 | 1): void => {
		if (!scroller) return;
		const step = Math.max(MIN_STEP_PX, Math.round(scroller.clientWidth * STEP_RATIO));
		scroller.scrollBy({ left: dir * step, behavior: 'smooth' });
	};

	return {
		get canPrev(): boolean { return canPrev; },
		get canNext(): boolean { return canNext; },
		stepPrev: () => stepBy(-1),
		stepNext: () => stepBy(1),
		bindScroller(node: HTMLElement): () => void {
			scroller = node;
			syncBounds();
			const detach = attachScrollerListeners(node, syncBounds);
			return () => { detach(); if (scroller === node) scroller = null; };
		}
	};
}

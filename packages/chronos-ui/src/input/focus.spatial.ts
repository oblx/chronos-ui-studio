import type { SemanticInputActionType } from './input.types';

export type FocusDirection = Extract<SemanticInputActionType, 'NAV_UP' | 'NAV_DOWN' | 'NAV_LEFT' | 'NAV_RIGHT'>;

export interface FocusRect {
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly height: number;
}

export interface FocusCandidate {
	readonly id: string;
	readonly rect: FocusRect;
}

export function resolveActiveFocusLayer(root: ParentNode = document): ParentNode {
	const openModal = root.querySelector('[role="dialog"][aria-modal="true"]');
	if (openModal) return openModal;
	const floating =
		root.querySelector('[data-ui-layer="floating"]') ??
		root.querySelector('[data-testid="node-inspector-float"]') ??
		root.querySelector('[data-testid="studio-tool-palette"]');
	if (floating instanceof HTMLElement && floating.offsetParent !== null) return floating;
	const stage = root.querySelector('[data-testid="client-document-root"]');
	if (stage instanceof HTMLElement && stage.offsetParent !== null) return stage;
	return root;
}

export function findNearestDirectionalCandidate(
	current: FocusRect,
	candidates: readonly FocusCandidate[],
	direction: FocusDirection
): FocusCandidate | null {
	const cx = current.x + current.width / 2;
	const cy = current.y + current.height / 2;
	let best: FocusCandidate | null = null;
	let bestScore = Number.POSITIVE_INFINITY;
	for (const item of candidates) {
		const ix = item.rect.x + item.rect.width / 2;
		const iy = item.rect.y + item.rect.height / 2;
		const dx = ix - cx;
		const dy = iy - cy;
		const aligned =
			(direction === 'NAV_RIGHT' && dx > 4) ||
			(direction === 'NAV_LEFT' && dx < -4) ||
			(direction === 'NAV_DOWN' && dy > 4) ||
			(direction === 'NAV_UP' && dy < -4);
		if (!aligned) continue;
		const primary = direction === 'NAV_LEFT' || direction === 'NAV_RIGHT' ? Math.abs(dx) : Math.abs(dy);
		const secondary = direction === 'NAV_LEFT' || direction === 'NAV_RIGHT' ? Math.abs(dy) : Math.abs(dx);
		const score = primary + secondary * 2.2;
		if (score < bestScore) {
			bestScore = score;
			best = item;
		}
	}
	return best;
}

export function moveSpatialFocusInDom(direction: FocusDirection, root: ParentNode = document): HTMLElement | null {
	const activeLayer = resolveActiveFocusLayer(root);
	const nodes = [...activeLayer.querySelectorAll<HTMLElement>('[data-ui-focusable="true"], [data-ui-interactive="true"]')]
		.filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
	if (nodes.length === 0) return null;
	const active = document.activeElement as HTMLElement | null;
	const activeIdx = active ? nodes.indexOf(active) : -1;
	if (activeIdx === -1) {
		nodes[0].setAttribute('tabindex', '0');
		nodes[0].focus();
		return nodes[0];
	}
	const curRect = nodes[activeIdx].getBoundingClientRect();
	const candidates: FocusCandidate[] = nodes
		.filter((_, i) => i !== activeIdx)
		.map((el, idx) => ({ id: String(idx), rect: el.getBoundingClientRect() }));
	const target = findNearestDirectionalCandidate(curRect, candidates, direction);
	if (!target) return null;
	const targetEl = nodes.filter((_, i) => i !== activeIdx)[Number(target.id)];
	if (!targetEl) return null;
	nodes[activeIdx].setAttribute('tabindex', '-1');
	targetEl.setAttribute('tabindex', '0');
	targetEl.focus();
	return targetEl;
}

import type { Action } from 'svelte/action';

export interface SpotlightStep {
	readonly id: string;
	readonly targetIds: readonly string[];
	readonly title: string;
	readonly body: string;
	readonly dockPlacement?: 'top' | 'bottom' | 'center';
}

export interface SpotlightRect {
	readonly targetId: string;
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly height: number;
}

const targetRegistry = new Map<string, HTMLElement>();

export function registerSpotlightTarget(id: string, node: HTMLElement): () => void {
	targetRegistry.set(id, node);
	return () => {
		if (targetRegistry.get(id) === node) {
			targetRegistry.delete(id);
		}
	};
}

export const uiSpotlight: Action<HTMLElement, string | undefined> = (node, initialId) => {
	let currentId = initialId;
	let cleanup = currentId ? registerSpotlightTarget(currentId, node) : () => {};

	return {
		update(nextId?: string) {
			if (nextId === currentId) return;
			cleanup();
			currentId = nextId;
			cleanup = currentId ? registerSpotlightTarget(currentId, node) : () => {};
		},
		destroy() {
			cleanup();
		}
	};
};

export function measureSpotlightRects(targetIds: readonly string[], pad = 6): SpotlightRect[] {
	const rects: SpotlightRect[] = [];
	for (const targetId of targetIds) {
		const el = targetRegistry.get(targetId);
		if (!el) continue;
		const r = el.getBoundingClientRect();
		if (r.width <= 0 || r.height <= 0) continue;
		rects.push({
			targetId,
			x: Math.max(0, r.left - pad),
			y: Math.max(0, r.top - pad),
			width: r.width + pad * 2,
			height: r.height + pad * 2
		});
	}
	return rects;
}

export function createSpotlightMachine() {
	let active = $state(false);
	let stepIndex = $state(0);
	let steps = $state.raw<readonly SpotlightStep[]>([]);

	return {
		get active(): boolean { return active; },
		get stepIndex(): number { return stepIndex; },
		get steps(): readonly SpotlightStep[] { return steps; },
		get currentStep(): SpotlightStep | null { return steps[stepIndex] ?? null; },
		start(nextSteps: readonly SpotlightStep[], startAt = 0): void {
			if (nextSteps.length === 0) return;
			steps = nextSteps;
			stepIndex = Math.max(0, Math.min(startAt, nextSteps.length - 1));
			active = true;
		},
		next(): void {
			if (stepIndex + 1 >= steps.length) {
				active = false;
				return;
			}
			stepIndex += 1;
		},
		prev(): void {
			stepIndex = Math.max(0, stepIndex - 1);
		},
		stop(): void {
			active = false;
		}
	};
}

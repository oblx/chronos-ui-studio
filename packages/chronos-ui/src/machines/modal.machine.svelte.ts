import { clamp, HUD_METRICS } from '../tokens';

export interface ModalOpenOptions { readonly id: string; readonly lockSeconds?: number; }
export interface ModalGeometrySnapshot { readonly widthPx: number; readonly heightPx: number; readonly leftPx: number; readonly topPx: number; }

function createCountdownRunner(onTick: (remainingMs: number) => void) {
	let handle: ReturnType<typeof setInterval> | null = null;
	const stop = (): void => { if (handle !== null) { clearInterval(handle); handle = null; } };
	const start = (seconds: number): void => {
		stop();
		if (seconds <= 0) { onTick(0); return; }
		const durationMs = seconds * 1000, startedAt = performance.now();
		onTick(durationMs);
		handle = setInterval(() => {
			const next = Math.max(0, durationMs - (performance.now() - startedAt));
			onTick(next);
			if (next <= 0) stop();
		}, HUD_METRICS.countdownTickMs);
	};
	return { start, stop };
}

export function createModalMachine() {
	let activeId = $state<string | null>(null);
	let totalSec = $state(0);
	let remainingMs = $state(0);
	let expanded = $state(false);
	let restoreSnapshot = $state<ModalGeometrySnapshot | null>(null);
	const timer = createCountdownRunner((ms) => { remainingMs = ms; });

	return {
		get activeId(): string | null { return activeId; },
		get isLocked(): boolean { return remainingMs > 0; },
		get isExpanded(): boolean { return expanded; },
		get restoreSnapshot(): ModalGeometrySnapshot | null { return restoreSnapshot; },
		get remainingSeconds(): number { return Math.ceil(remainingMs / 1000); },
		get progressRatio(): number { return totalSec <= 0 ? 0 : clamp(remainingMs / (totalSec * 1000), 0, 1); },
		open(options: ModalOpenOptions): void {
			activeId = options.id; totalSec = Math.max(0, options.lockSeconds ?? 0);
			expanded = false; restoreSnapshot = null; timer.start(totalSec);
		},
		toggleExpand(snapshot?: ModalGeometrySnapshot | null): boolean {
			if (!expanded && snapshot) restoreSnapshot = { ...snapshot };
			expanded = !expanded;
			return expanded;
		},
		setExpanded(next: boolean, snapshot?: ModalGeometrySnapshot | null): boolean {
			if (next && !expanded && snapshot) restoreSnapshot = { ...snapshot };
			expanded = next;
			return expanded;
		},
		close(force = false): boolean {
			if (!force && remainingMs > 0) return false;
			timer.stop(); activeId = null; totalSec = 0; remainingMs = 0; expanded = false; restoreSnapshot = null;
			return true;
		},
		destroy(): void { timer.stop(); }
	};
}

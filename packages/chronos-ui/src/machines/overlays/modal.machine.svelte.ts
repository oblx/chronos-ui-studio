import { clamp, HUD_METRICS } from '@ui/tokens';
import { resolveSurfaceMotionMs } from '@ui/motion';

export type ModalLifecyclePhase = 'CLOSED' | 'OPENING' | 'OPEN' | 'CLOSING';
export interface ModalOpenOptions { readonly id: string; readonly lockSeconds?: number; }
export interface ModalGeometrySnapshot { readonly widthPx: number; readonly heightPx: number; readonly leftPx: number; readonly topPx: number; }

export interface ModalMachineCallbacks {
	readonly onOpened?: (id: string) => void;
	readonly onClosed?: (id: string) => void;
	readonly onPhaseChange?: (phase: ModalLifecyclePhase, id: string | null) => void;
	readonly getDurationMs?: (dir: 'enter' | 'exit') => number;
}

interface ModalCtx {
	activeId: string | null;
	phase: ModalLifecyclePhase;
	totalSec: number;
	remainingMs: number;
	expanded: boolean;
	restoreSnapshot: ModalGeometrySnapshot | null;
	safetyTimer: ReturnType<typeof setTimeout> | null;
}

const SAFETY_PAD_MS = 40;

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

function clearModalSafety(ctx: ModalCtx): void {
	if (ctx.safetyTimer !== null) { clearTimeout(ctx.safetyTimer); ctx.safetyTimer = null; }
}

function finishModalOpen(ctx: ModalCtx, cb: ModalMachineCallbacks): void {
	if (ctx.phase !== 'OPENING' || !ctx.activeId) return;
	clearModalSafety(ctx);
	ctx.phase = 'OPEN';
	cb.onPhaseChange?.(ctx.phase, ctx.activeId);
	cb.onOpened?.(ctx.activeId);
}

function finishModalClose(ctx: ModalCtx, timer: ReturnType<typeof createCountdownRunner>, cb: ModalMachineCallbacks): void {
	if (ctx.phase !== 'CLOSING') return;
	clearModalSafety(ctx);
	timer.stop();
	const prevId = ctx.activeId;
	ctx.phase = 'CLOSED';
	ctx.activeId = null;
	ctx.totalSec = 0;
	ctx.remainingMs = 0;
	ctx.expanded = false;
	ctx.restoreSnapshot = null;
	cb.onPhaseChange?.(ctx.phase, null);
	if (prevId) cb.onClosed?.(prevId);
}

function beginModalOpen(ctx: ModalCtx, timer: ReturnType<typeof createCountdownRunner>, cb: ModalMachineCallbacks, options: ModalOpenOptions | string): void {
	const opt: ModalOpenOptions = typeof options === 'string' ? { id: options } : options;
	clearModalSafety(ctx);
	ctx.activeId = opt.id;
	ctx.totalSec = Math.max(0, opt.lockSeconds ?? 0);
	ctx.expanded = false;
	ctx.restoreSnapshot = null;
	ctx.phase = 'OPENING';
	timer.start(ctx.totalSec);
	cb.onPhaseChange?.(ctx.phase, ctx.activeId);
	const dur = cb.getDurationMs ? cb.getDurationMs('enter') : resolveSurfaceMotionMs('MODAL', 'enter');
	ctx.safetyTimer = setTimeout(() => finishModalOpen(ctx, cb), Math.max(10, dur) + SAFETY_PAD_MS);
}

function beginModalClose(ctx: ModalCtx, timer: ReturnType<typeof createCountdownRunner>, cb: ModalMachineCallbacks, force: boolean): boolean {
	if (!ctx.activeId || ctx.phase === 'CLOSED' || ctx.phase === 'CLOSING') return false;
	if (!force && ctx.remainingMs > 0) return false;
	clearModalSafety(ctx);
	ctx.phase = 'CLOSING';
	cb.onPhaseChange?.(ctx.phase, ctx.activeId);
	const dur = cb.getDurationMs ? cb.getDurationMs('exit') : resolveSurfaceMotionMs('MODAL', 'exit');
	ctx.safetyTimer = setTimeout(() => finishModalClose(ctx, timer, cb), Math.max(10, dur) + SAFETY_PAD_MS);
	return true;
}

export function createModalLifecycleEngine(cb: ModalMachineCallbacks = {}) {
	const ctx: ModalCtx = { activeId: null, phase: 'CLOSED', totalSec: 0, remainingMs: 0, expanded: false, restoreSnapshot: null, safetyTimer: null };
	const timer = createCountdownRunner((ms) => { ctx.remainingMs = ms; });
	return {
		get activeId(): string | null { return ctx.activeId; },
		get phase(): ModalLifecyclePhase { return ctx.phase; },
		get isMounted(): boolean { return ctx.activeId !== null && ctx.phase !== 'CLOSED'; },
		get isLocked(): boolean { return ctx.remainingMs > 0; },
		get isExpanded(): boolean { return ctx.expanded; },
		get restoreSnapshot(): ModalGeometrySnapshot | null { return ctx.restoreSnapshot; },
		get remainingSeconds(): number { return Math.ceil(ctx.remainingMs / 1000); },
		get progressRatio(): number { return ctx.totalSec <= 0 ? 0 : clamp(ctx.remainingMs / (ctx.totalSec * 1000), 0, 1); },
		open: (options: ModalOpenOptions | string) => beginModalOpen(ctx, timer, cb, options),
		markOpened: () => finishModalOpen(ctx, cb),
		toggleExpand: (snap?: ModalGeometrySnapshot | null) => { if (!ctx.expanded && snap) ctx.restoreSnapshot = { ...snap }; ctx.expanded = !ctx.expanded; return ctx.expanded; },
		setExpanded: (next: boolean, snap?: ModalGeometrySnapshot | null) => { if (next && !ctx.expanded && snap) ctx.restoreSnapshot = { ...snap }; ctx.expanded = next; return ctx.expanded; },
		close: (force = false) => beginModalClose(ctx, timer, cb, force),
		markClosed: () => finishModalClose(ctx, timer, cb),
		destroy: () => { clearModalSafety(ctx); timer.stop(); }
	};
}

export function createModalMachine(cb: ModalMachineCallbacks = {}) {
	let tick = $state(0);
	const bump = (): void => { tick += 1; };
	const engine = createModalLifecycleEngine({
		...cb,
		onPhaseChange: (p, id) => { bump(); cb.onPhaseChange?.(p, id); },
		onOpened: (id) => { bump(); cb.onOpened?.(id); },
		onClosed: (id) => { bump(); cb.onClosed?.(id); }
	});
	return {
		get activeId(): string | null { void tick; return engine.activeId; },
		get phase(): ModalLifecyclePhase { void tick; return engine.phase; },
		get isMounted(): boolean { void tick; return engine.isMounted; },
		get isLocked(): boolean { void tick; return engine.isLocked; },
		get isExpanded(): boolean { void tick; return engine.isExpanded; },
		get restoreSnapshot(): ModalGeometrySnapshot | null { void tick; return engine.restoreSnapshot; },
		get remainingSeconds(): number { void tick; return engine.remainingSeconds; },
		get progressRatio(): number { void tick; return engine.progressRatio; },
		open: (o: ModalOpenOptions | string) => { engine.open(o); bump(); },
		markOpened: () => { engine.markOpened(); bump(); },
		markClosed: () => { engine.markClosed(); bump(); },
		toggleExpand: (s?: ModalGeometrySnapshot | null) => { const r = engine.toggleExpand(s); bump(); return r; },
		setExpanded: (n: boolean, s?: ModalGeometrySnapshot | null) => { const r = engine.setExpanded(n, s); bump(); return r; },
		close: (f = false) => { const r = engine.close(f); bump(); return r; },
		destroy: () => engine.destroy()
	};
}

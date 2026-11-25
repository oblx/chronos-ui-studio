import type { HudZoneId } from '../tokens';
import { MOTION_DESIGN_TOKENS } from './motion.tokens';

export const HUD_BOOT_ZONE_ORDER: readonly HudZoneId[] = [
	'TOP_LEFT', 'TOP_CENTER', 'PROJECT_TAB_DECK', 'TOP_RIGHT', 'RIGHT_EDGE',
	'BOTTOM_RIGHT', 'BOTTOM_CENTER', 'BOTTOM_LEFT', 'LEFT_EDGE'
] as const;

export const HUD_BOOT_STORAGE_KEY = 'chronos_hud_boot_played_v1';

export interface HudBootChoreographerOptions {
	readonly onRevealZone: (zone: HudZoneId, index: number, total: number, immediate: boolean) => void;
	readonly onStateChange?: (revealed: ReadonlySet<HudZoneId>, running: boolean) => void;
	readonly onComplete?: (replayed: boolean) => void;
	readonly getStaggerMs?: () => number;
	readonly intervalMs?: number | (() => number);
	readonly isReducedMotion?: () => boolean;
	readonly storage?: Pick<Storage, 'getItem' | 'setItem'> | null;
}

interface BootCtx {
	revealed: Set<HudZoneId>;
	running: boolean;
	hasPlayed: boolean;
	epoch: number;
	timers: Map<HudZoneId, ReturnType<typeof setTimeout>>;
}

function readPlayedFlag(storage?: Pick<Storage, 'getItem' | 'setItem'> | null): boolean {
	try {
		const store = storage === undefined ? (typeof localStorage !== 'undefined' ? localStorage : null) : storage;
		return store?.getItem(HUD_BOOT_STORAGE_KEY) === '1';
	} catch { return false; }
}

function writePlayedFlag(storage?: Pick<Storage, 'getItem' | 'setItem'> | null): void {
	try {
		const store = storage === undefined ? (typeof localStorage !== 'undefined' ? localStorage : null) : storage;
		store?.setItem(HUD_BOOT_STORAGE_KEY, '1');
	} catch { /* sandbox storage unavailable */ }
}

function clearBootTimers(ctx: BootCtx): void {
	for (const h of ctx.timers.values()) clearTimeout(h);
	ctx.timers.clear();
}

function resolveStepMs(opts: HudBootChoreographerOptions, overrideMs?: number): number {
	if (opts.isReducedMotion?.()) return 0;
	if (typeof overrideMs === 'number' && Number.isFinite(overrideMs)) return Math.max(0, overrideMs);
	const raw = opts.getStaggerMs?.() ?? (typeof opts.intervalMs === 'function' ? opts.intervalMs() : opts.intervalMs);
	return Math.max(0, raw ?? MOTION_DESIGN_TOKENS.staggerZoneMs);
}

function finishBootImmediate(ctx: BootCtx, opts: HudBootChoreographerOptions, replayed: boolean): void {
	clearBootTimers(ctx);
	ctx.revealed = new Set<HudZoneId>(['WORLD_CANVAS', ...HUD_BOOT_ZONE_ORDER]);
	ctx.running = false;
	ctx.hasPlayed = true;
	writePlayedFlag(opts.storage);
	HUD_BOOT_ZONE_ORDER.forEach((zone, idx) => opts.onRevealZone(zone, idx, HUD_BOOT_ZONE_ORDER.length, true));
	opts.onStateChange?.(new Set(ctx.revealed), false);
	opts.onComplete?.(replayed);
}

function scheduleAscReveal(ctx: BootCtx, opts: HudBootChoreographerOptions, stepMs: number, replayed: boolean): void {
	const myEpoch = ctx.epoch;
	ctx.revealed = new Set<HudZoneId>(['WORLD_CANVAS']);
	ctx.running = true;
	opts.onStateChange?.(new Set(ctx.revealed), true);
	HUD_BOOT_ZONE_ORDER.forEach((zone, idx) => {
		const handle = setTimeout(() => {
			if (myEpoch !== ctx.epoch) return;
			ctx.timers.delete(zone);
			ctx.revealed = new Set<HudZoneId>([...ctx.revealed, zone]);
			opts.onRevealZone(zone, idx, HUD_BOOT_ZONE_ORDER.length, false);
			if (idx === HUD_BOOT_ZONE_ORDER.length - 1) {
				ctx.running = false;
				ctx.hasPlayed = true;
				writePlayedFlag(opts.storage);
				opts.onStateChange?.(new Set(ctx.revealed), false);
				opts.onComplete?.(replayed);
			} else {
				opts.onStateChange?.(new Set(ctx.revealed), true);
			}
		}, stepMs * (idx + 1));
		ctx.timers.set(zone, handle);
	});
}

export function createHudBootChoreographer(opts: HudBootChoreographerOptions) {
	const ctx: BootCtx = {
		revealed: new Set<HudZoneId>(['WORLD_CANVAS']),
		running: false,
		hasPlayed: readPlayedFlag(opts.storage),
		epoch: 0,
		timers: new Map()
	};

	const start = (forceReplay = false, overrideMs?: number): void => {
		ctx.epoch += 1;
		clearBootTimers(ctx);
		if (!forceReplay && ctx.hasPlayed) { finishBootImmediate(ctx, opts, false); return; }
		const stepMs = resolveStepMs(opts, overrideMs);
		if (stepMs <= 0) { finishBootImmediate(ctx, opts, forceReplay); return; }
		scheduleAscReveal(ctx, opts, stepMs, forceReplay);
	};

	const revealImmediate = (zone?: HudZoneId): void => {
		if (!zone) { finishBootImmediate(ctx, opts, false); return; }
		const pending = ctx.timers.get(zone);
		if (pending !== undefined) { clearTimeout(pending); ctx.timers.delete(zone); }
		if (!ctx.revealed.has(zone)) {
			ctx.revealed = new Set<HudZoneId>([...ctx.revealed, zone]);
			opts.onRevealZone(zone, HUD_BOOT_ZONE_ORDER.indexOf(zone), HUD_BOOT_ZONE_ORDER.length, true);
			opts.onStateChange?.(new Set(ctx.revealed), ctx.running);
		}
	};

	return {
		get revealedZones(): ReadonlySet<HudZoneId> { return ctx.revealed; },
		get running(): boolean { return ctx.running; },
		get hasPlayed(): boolean { return ctx.hasPlayed; },
		get epoch(): number { return ctx.epoch; },
		hasCompletedOnce: () => ctx.hasPlayed,
		start: () => start(false),
		replay: (overrideMs?: number) => start(true, overrideMs),
		revealImmediate,
		cancel: () => { ctx.epoch += 1; clearBootTimers(ctx); ctx.running = false; opts.onStateChange?.(new Set(ctx.revealed), false); }
	};
}

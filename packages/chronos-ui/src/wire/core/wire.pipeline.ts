import { WireTelemetryRing } from '../wire.ring';
import type { BatchIntentInput, DagEnvelope, IntentHandler, IntentKind, RoutingTier, WireMiddleware, WireTraceRecord } from './wire.types';

export type TimerMap = Map<IntentKind, ReturnType<typeof setTimeout>>;

export function makeEnvelope<P>(kind: IntentKind, tier: RoutingTier, payload: P, origin: DagEnvelope['origin']): DagEnvelope<P> {
	const rand = Math.random().toString(36).slice(2, 7);
	return { id: `${Date.now().toString(36)}-${rand}`, kind, tier, origin, timestamp: Date.now(), payload };
}

export function scheduleEffect<S>(handler: IntentHandler<S, unknown>, nextState: S, envelope: DagEnvelope, pending: TimerMap): void {
	if (!handler.effect) return;
	if (handler.tier !== 'TIER_1_COALESCED_PERSIST') { void handler.effect(nextState, envelope); return; }
	const prev = pending.get(envelope.kind);
	if (prev) clearTimeout(prev);
	const timer = setTimeout(() => { pending.delete(envelope.kind); void handler.effect?.(nextState, envelope); }, 150);
	pending.set(envelope.kind, timer);
}

export function recordTrace(ring: WireTelemetryRing, envelope: DagEnvelope, t0: number, ok: boolean, summary: string): readonly WireTraceRecord[] {
	ring.push({
		spine: 'CLIENT_DAG', envelopeId: envelope.id, kind: envelope.kind, tier: envelope.tier, origin: envelope.origin,
		stageMs: Number((performance.now() - t0).toFixed(2)), ok, summary, timestamp: envelope.timestamp
	});
	return ring.snapshot();
}

export function executeMiddlewareChain<S>(middlewares: readonly WireMiddleware<S>[], envelope: DagEnvelope, state: S, onTerminal: () => void): void {
	const step = (idx: number): void => {
		if (idx < middlewares.length) { middlewares[idx](envelope, state, () => step(idx + 1)); return; }
		onTerminal();
	};
	step(0);
}

export function runBatchReduction<S>(
	handlers: Map<IntentKind, IntentHandler<S, unknown>>,
	ring: WireTelemetryRing,
	pending: TimerMap,
	inputs: readonly BatchIntentInput[],
	initialState: S
): { nextState: S; applied: number; traces: readonly WireTraceRecord[]; envelopes: DagEnvelope[] } {
	const t0 = performance.now();
	let state = initialState;
	let applied = 0;
	const envelopes: DagEnvelope[] = [];
	let lastEnv: DagEnvelope | null = null;
	for (const item of inputs) {
		const handler = handlers.get(item.kind);
		if (!handler) continue;
		const env = makeEnvelope(item.kind, handler.tier, item.payload, item.origin ?? 'USER') as DagEnvelope;
		if (handler.validate && !handler.validate(state, env)) continue;
		state = handler.reduce(state, env);
		scheduleEffect(handler, state, env, pending);
		envelopes.push(env);
		lastEnv = env;
		applied += 1;
	}
	const traces = lastEnv
		? recordTrace(ring, lastEnv, t0, applied > 0, `BATCH(${applied}/${inputs.length}) ${lastEnv.kind}`)
		: ring.snapshot();
	return { nextState: state, applied, traces, envelopes };
}

export function createMicrotaskCoalescer(onFlush: (batch: readonly BatchIntentInput[]) => void) {
	const queued = new Map<string, BatchIntentInput>();
	let scheduled = false;
	const flush = (): void => {
		scheduled = false;
		if (queued.size === 0) return;
		const batch = [...queued.values()];
		queued.clear();
		onFlush(batch);
	};
	return {
		enqueue<P>(kind: IntentKind, payload: P, key = 'global', origin: DagEnvelope['origin'] = 'USER'): void {
			queued.set(`${kind}:${key}`, { kind, payload: payload as Record<string, unknown>, origin });
			if (!scheduled) { scheduled = true; queueMicrotask(flush); }
		},
		flush,
		clear(): void { queued.clear(); scheduled = false; }
	};
}

export function createHeadlessWireBroker<S>(initialState: S) {
	let current = initialState;
	let traceList: readonly WireTraceRecord[] = [];
	const handlers = new Map<IntentKind, IntentHandler<S, unknown>>();
	const middlewares: WireMiddleware<S>[] = [];
	const ring = new WireTelemetryRing();
	const pending: TimerMap = new Map();
	const dispatchBatch = (inputs: readonly BatchIntentInput[]): number => {
		const res = runBatchReduction(handlers, ring, pending, inputs, current);
		current = res.nextState; traceList = res.traces; return res.applied;
	};
	const coalescer = createMicrotaskCoalescer((batch) => { dispatchBatch(batch); });
	return {
		get state(): S { return current; },
		get traces(): readonly WireTraceRecord[] { return traceList; },
		register<P>(kind: IntentKind, h: IntentHandler<S, P>): void { handlers.set(kind, h as IntentHandler<S, unknown>); },
		use(mw: WireMiddleware<S>): void { middlewares.push(mw); },
		patchState(updater: (prev: S) => S): void { current = updater(current); },
		dispatch<P>(kind: IntentKind, payload: P, origin: DagEnvelope['origin'] = 'USER'): boolean { return dispatchBatch([{ kind, payload: payload as Record<string, unknown>, origin }]) > 0; },
		dispatchBatch,
		enqueueCoalescedIntent: coalescer.enqueue,
		flushCoalesced: coalescer.flush,
		ingestServerTraces(records: readonly WireTraceRecord[]): void { ring.mergeExternal(records); traceList = ring.snapshot(); },
		clearTraces(): void { ring.clear(); traceList = []; },
		notifyTokenRotated(): void {},
		isWithinRefreshGrace(): boolean { return false; },
		destroy(): void { coalescer.clear(); for (const t of pending.values()) clearTimeout(t); pending.clear(); }
	};
}


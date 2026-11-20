import { createMultiTabChannel } from './wire.channel';
import { executeMiddlewareChain, makeEnvelope, recordTrace, scheduleEffect, type TimerMap } from './wire.pipeline';
import { WireTelemetryRing } from './wire.ring';
import type { DagEnvelope, IntentHandler, IntentKind, WireMiddleware, WireTraceRecord } from './wire.types';

export interface UiWireBroker<S> {
	readonly state: S;
	readonly traces: readonly WireTraceRecord[];
	register: <P = Record<string, unknown>>(kind: IntentKind, handler: IntentHandler<S, P>) => void;
	use: (mw: WireMiddleware<S>) => void;
	dispatch: <P = Record<string, unknown>>(kind: IntentKind, payload: P, origin?: DagEnvelope['origin']) => boolean;
	patchState: (updater: (prev: S) => S) => void;
	ingestServerTraces: (records: readonly WireTraceRecord[]) => void;
	notifyTokenRotated: () => void;
	isWithinRefreshGrace: () => boolean;
	destroy: () => void;
}

function runHandlerStage<S>(
	handlers: Map<IntentKind, IntentHandler<S, unknown>>,
	ring: WireTelemetryRing,
	pending: TimerMap,
	envelope: DagEnvelope,
	getState: () => S,
	commit: (nextState: S, traces: readonly WireTraceRecord[]) => void
): boolean {
	const handler = handlers.get(envelope.kind);
	if (!handler) return false;
	const t0 = performance.now();
	const prev = getState();
	if (handler.validate && !handler.validate(prev, envelope)) {
		commit(prev, recordTrace(ring, envelope, t0, false, 'Validation rejected'));
		return false;
	}
	const nextState = handler.reduce(prev, envelope);
	scheduleEffect(handler, nextState, envelope, pending);
	const note = handler.summarize ? handler.summarize(envelope) : envelope.kind;
	commit(nextState, recordTrace(ring, envelope, t0, true, note));
	return true;
}

export function createUiWireBroker<S>(initialState: S, channelName = 'chronos-ui-wire'): UiWireBroker<S> {
	let current = $state<S>(initialState);
	let traceList = $state.raw<readonly WireTraceRecord[]>([]);
	let dispatching = false;
	const handlers = new Map<IntentKind, IntentHandler<S, unknown>>();
	const middlewares: WireMiddleware<S>[] = [];
	const ring = new WireTelemetryRing();
	const pending: TimerMap = new Map();

	const execute = (env: DagEnvelope): boolean =>
		runHandlerStage(handlers, ring, pending, env, () => current, (s, t) => { current = s; traceList = t; });
	const channel = createMultiTabChannel(channelName, execute);

	return {
		get state(): S { return current; },
		get traces(): readonly WireTraceRecord[] { return traceList; },
		register<P>(kind: IntentKind, h: IntentHandler<S, P>): void { handlers.set(kind, h as IntentHandler<S, unknown>); },
		use(mw: WireMiddleware<S>): void { middlewares.push(mw); },
		patchState(updater: (prev: S) => S): void { current = updater(current); },
		dispatch<P>(kind: IntentKind, payload: P, origin: DagEnvelope['origin'] = 'USER'): boolean {
			if (dispatching) return false;
			const env = makeEnvelope(kind, handlers.get(kind)?.tier ?? 'TIER_0_LOCAL_UI', payload, origin) as DagEnvelope;
			dispatching = true;
			try {
				let ok = false;
				executeMiddlewareChain(middlewares, env, current, () => { ok = execute(env); });
				if (ok && env.tier !== 'TIER_0_LOCAL_UI') channel.postIntent(env);
				return ok;
			} finally { dispatching = false; }
		},
		ingestServerTraces(records: readonly WireTraceRecord[]): void { ring.mergeExternal(records); traceList = ring.snapshot(); },
		notifyTokenRotated(): void { channel.notifyTokenRotated(Date.now()); },
		isWithinRefreshGrace(): boolean { return channel.isWithinRefreshGrace(); },
		destroy(): void {
			for (const timer of pending.values()) clearTimeout(timer);
			pending.clear();
			channel.destroy();
		}
	};
}

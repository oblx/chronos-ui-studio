import type { WireTelemetryRing } from './wire.ring';
import type { DagEnvelope, IntentHandler, IntentKind, RoutingTier, WireMiddleware, WireTraceRecord } from './wire.types';

export type TimerMap = Map<IntentKind, ReturnType<typeof setTimeout>>;

export function makeEnvelope<P>(
	kind: IntentKind,
	tier: RoutingTier,
	payload: P,
	origin: DagEnvelope['origin']
): DagEnvelope<P> {
	const rand = Math.random().toString(36).slice(2, 7);
	return { id: `${Date.now().toString(36)}-${rand}`, kind, tier, origin, timestamp: Date.now(), payload };
}

export function scheduleEffect<S>(
	handler: IntentHandler<S, unknown>,
	nextState: S,
	envelope: DagEnvelope,
	pending: TimerMap
): void {
	if (!handler.effect) return;
	if (handler.tier !== 'TIER_1_COALESCED_PERSIST') {
		void handler.effect(nextState, envelope);
		return;
	}
	const prev = pending.get(envelope.kind);
	if (prev) clearTimeout(prev);
	const timer = setTimeout(() => {
		pending.delete(envelope.kind);
		void handler.effect?.(nextState, envelope);
	}, 150);
	pending.set(envelope.kind, timer);
}

export function recordTrace(
	ring: WireTelemetryRing,
	envelope: DagEnvelope,
	t0: number,
	ok: boolean,
	summary: string
): readonly WireTraceRecord[] {
	ring.push({
		spine: 'CLIENT_DAG',
		envelopeId: envelope.id,
		kind: envelope.kind,
		tier: envelope.tier,
		origin: envelope.origin,
		stageMs: Number((performance.now() - t0).toFixed(2)),
		ok,
		summary,
		timestamp: envelope.timestamp
	});
	return ring.snapshot();
}

export function executeMiddlewareChain<S>(
	middlewares: readonly WireMiddleware<S>[],
	envelope: DagEnvelope,
	state: S,
	onTerminal: () => void
): void {
	const step = (idx: number): void => {
		if (idx < middlewares.length) {
			middlewares[idx](envelope, state, () => step(idx + 1));
			return;
		}
		onTerminal();
	};
	step(0);
}

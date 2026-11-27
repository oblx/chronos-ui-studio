import { WireTelemetryRing, type IntentKind, type RoutingTier, type WireTraceRecord } from '@chronos-ui/svelte';

const serverRing = new WireTelemetryRing(256);

export function pushServerTrace(
	kind: IntentKind,
	summary: string,
	stageMs: number,
	ok = true,
	origin: WireTraceRecord['origin'] = 'SYSTEM',
	tier: RoutingTier = 'TIER_1_COALESCED_PERSIST'
): WireTraceRecord {
	const ms = Math.max(0.001, Number(stageMs.toFixed(3)));
	return serverRing.push({
		spine: 'SERVER_DAG',
		envelopeId: `srv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
		kind,
		tier,
		origin,
		stageMs: ms,
		realDurationMs: ms,
		observedAtMs: ms,
		ok,
		summary,
		timestamp: Date.now()
	});
}

export function getServerTraces(): readonly WireTraceRecord[] {
	return serverRing.snapshot();
}

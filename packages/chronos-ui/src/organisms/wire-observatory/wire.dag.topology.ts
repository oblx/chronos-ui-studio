import type { UiIconName } from '@ui/tokens';
import type { WireTraceRecord } from '@ui/wire';

export type DagColumnId = 'EMITTERS' | 'CLIENT_DAG' | 'TRANSPORT' | 'SERVER_DAG';
export type DagNodeStatus = 'NOMINAL' | 'WARN' | 'BLOCKED';

export interface WireDagNodeDef {
	readonly id: string;
	readonly label: string;
	readonly column: DagColumnId;
	readonly icon: UiIconName;
	readonly x: number;
	readonly y: number;
	readonly w: number;
	readonly h: number;
}

export interface WireDagEdgeDef {
	readonly id: string;
	readonly from: string;
	readonly to: string;
}

export interface WireDagNodeMetrics {
	readonly count: number;
	readonly avgMs: number;
	readonly status: DagNodeStatus;
}

export interface CoalescedWireBurst {
	readonly key: string;
	readonly representative: WireTraceRecord;
	readonly count: number;
	readonly avgMs: number;
	readonly rows: readonly WireTraceRecord[];
}

export const WIRE_DAG_NODES: readonly WireDagNodeDef[] = [
	{ id: 'USER_UI', label: 'USER_UI', column: 'EMITTERS', icon: 'cursor', x: 24, y: 26, w: 158, h: 46 },
	{ id: 'AI_ASSISTANT', label: 'AI_ASSISTANT', column: 'EMITTERS', icon: 'bot', x: 24, y: 88, w: 158, h: 46 },
	{ id: 'TWIN_MCP', label: 'TWIN_MCP', column: 'EMITTERS', icon: 'plug', x: 24, y: 150, w: 158, h: 46 },
	{ id: 'TOUR_ENGINE', label: 'TOUR_ENGINE', column: 'EMITTERS', icon: 'spotlight', x: 24, y: 212, w: 158, h: 46 },
	{ id: 'BROADCAST_TAB', label: 'BROADCAST_TAB', column: 'EMITTERS', icon: 'layers', x: 24, y: 274, w: 158, h: 46 },
	{ id: 'C1_VALIDATE', label: 'C1: VALIDATE', column: 'CLIENT_DAG', icon: 'check', x: 236, y: 42, w: 170, h: 50 },
	{ id: 'C2_REDUCE', label: 'C2: REDUCE', column: 'CLIENT_DAG', icon: 'cpu', x: 236, y: 112, w: 170, h: 50 },
	{ id: 'C3_EFFECT', label: 'C3: EFFECT', column: 'CLIENT_DAG', icon: 'play', x: 236, y: 182, w: 170, h: 50 },
	{ id: 'C4_TELEMETRY', label: 'C4: TELEMETRY', column: 'CLIENT_DAG', icon: 'wire', x: 236, y: 252, w: 170, h: 50 },
	{ id: 'WS_HTTP_BRIDGE', label: 'WS / HTTP BRIDGE', column: 'TRANSPORT', icon: 'radar', x: 462, y: 142, w: 174, h: 66 },
	{ id: 'S1_WIRE_GUARD', label: 'S1: WIRE_GUARD', column: 'SERVER_DAG', icon: 'lock', x: 692, y: 26, w: 174, h: 46 },
	{ id: 'S2_AUTH_RBAC', label: 'S2: AUTH_RBAC', column: 'SERVER_DAG', icon: 'user', x: 692, y: 88, w: 174, h: 46 },
	{ id: 'S3_SANITIZE', label: 'S3: SANITIZE', column: 'SERVER_DAG', icon: 'sliders', x: 692, y: 150, w: 174, h: 46 },
	{ id: 'S4_COMMIT', label: 'S4: COMMIT', column: 'SERVER_DAG', icon: 'save', x: 692, y: 212, w: 174, h: 46 },
	{ id: 'S5_FANOUT', label: 'S5: FANOUT', column: 'SERVER_DAG', icon: 'send', x: 692, y: 274, w: 174, h: 46 }
] as const;

export const WIRE_DAG_EDGES: readonly WireDagEdgeDef[] = [
	{ id: 'e-u-c1', from: 'USER_UI', to: 'C1_VALIDATE' },
	{ id: 'e-a-c1', from: 'AI_ASSISTANT', to: 'C1_VALIDATE' },
	{ id: 'e-m-c1', from: 'TWIN_MCP', to: 'C1_VALIDATE' },
	{ id: 'e-t-c1', from: 'TOUR_ENGINE', to: 'C1_VALIDATE' },
	{ id: 'e-b-c1', from: 'BROADCAST_TAB', to: 'C1_VALIDATE' },
	{ id: 'e-c1-c2', from: 'C1_VALIDATE', to: 'C2_REDUCE' },
	{ id: 'e-c2-c3', from: 'C2_REDUCE', to: 'C3_EFFECT' },
	{ id: 'e-c3-c4', from: 'C3_EFFECT', to: 'C4_TELEMETRY' },
	{ id: 'e-c4-br', from: 'C4_TELEMETRY', to: 'WS_HTTP_BRIDGE' },
	{ id: 'e-br-s1', from: 'WS_HTTP_BRIDGE', to: 'S1_WIRE_GUARD' },
	{ id: 'e-s1-s2', from: 'S1_WIRE_GUARD', to: 'S2_AUTH_RBAC' },
	{ id: 'e-s2-s3', from: 'S2_AUTH_RBAC', to: 'S3_SANITIZE' },
	{ id: 'e-s3-s4', from: 'S3_SANITIZE', to: 'S4_COMMIT' },
	{ id: 'e-s4-s5', from: 'S4_COMMIT', to: 'S5_FANOUT' }
] as const;

export function mapOriginToEmitterNode(trace: WireTraceRecord): string {
	if (trace.kind.startsWith('UI_SPOTLIGHT')) return 'TOUR_ENGINE';
	if (trace.origin === 'ASSISTANT_CHAT' || trace.origin === 'VOICE') return 'AI_ASSISTANT';
	if (trace.origin === 'MCP_TWIN') return 'TWIN_MCP';
	if (trace.origin === 'BROADCAST') return 'BROADCAST_TAB';
	return 'USER_UI';
}

export function resolveTracePathNodes(trace: WireTraceRecord): ReadonlySet<string> {
	const set = new Set<string>([mapOriginToEmitterNode(trace), 'C1_VALIDATE']);
	if (!trace.ok) return set;
	set.add('C2_REDUCE'); set.add('C3_EFFECT'); set.add('C4_TELEMETRY');
	if (trace.spine === 'SERVER_DAG' || trace.tier !== 'TIER_0_LOCAL_UI') {
		set.add('WS_HTTP_BRIDGE');
		set.add('S1_WIRE_GUARD'); set.add('S2_AUTH_RBAC'); set.add('S3_SANITIZE'); set.add('S4_COMMIT'); set.add('S5_FANOUT');
	}
	return set;
}

export function filterTracesByDagNode(traces: readonly WireTraceRecord[], nodeId: string | null): readonly WireTraceRecord[] {
	if (!nodeId) return traces;
	return traces.filter((t) => resolveTracePathNodes(t).has(nodeId));
}

export function computeDagNodeStats(traces: readonly WireTraceRecord[], hasBit28: boolean): ReadonlyMap<string, WireDagNodeMetrics> {
	const acc = new Map<string, { count: number; totalMs: number; errors: number }>();
	for (const n of WIRE_DAG_NODES) acc.set(n.id, { count: 0, totalMs: 0, errors: 0 });
	for (const t of traces) {
		for (const id of resolveTracePathNodes(t)) {
			const slot = acc.get(id);
			if (!slot) continue;
			slot.count += 1; slot.totalMs += t.stageMs; if (!t.ok) slot.errors += 1;
		}
	}
	const out = new Map<string, WireDagNodeMetrics>();
	for (const n of WIRE_DAG_NODES) {
		const s = acc.get(n.id)!;
		const status: DagNodeStatus = n.column === 'SERVER_DAG' && !hasBit28 ? 'BLOCKED' : s.errors > 0 ? 'WARN' : 'NOMINAL';
		out.set(n.id, { count: s.count, avgMs: s.count > 0 ? Number((s.totalMs / s.count).toFixed(2)) : 0, status });
	}
	return out;
}

export const buildWireTraceKey = (row: WireTraceRecord): string => `${row.spine}-${row.seq}-${row.envelopeId}`;

export function coalesceBurstTraces(traces: readonly WireTraceRecord[]): readonly CoalescedWireBurst[] {
	const groups: { key: string; representative: WireTraceRecord; totalMs: number; rows: WireTraceRecord[] }[] = [];
	for (const row of traces) {
		const prev = groups[groups.length - 1];
		if (prev && prev.representative.kind === row.kind && prev.representative.spine === row.spine && prev.representative.ok === row.ok) {
			prev.rows.push(row); prev.totalMs += row.stageMs;
		} else {
			groups.push({ key: buildWireTraceKey(row), representative: row, totalMs: row.stageMs, rows: [row] });
		}
	}
	return groups.map((g) => ({ key: g.key, representative: g.representative, count: g.rows.length, avgMs: Number((g.totalMs / g.rows.length).toFixed(2)), rows: g.rows }));
}

export function buildBezierEdgePath(from: WireDagNodeDef, to: WireDagNodeDef): string {
	if (from.column === to.column) { const x = from.x + from.w * 0.5; return `M ${x} ${from.y + from.h} L ${x} ${to.y}`; }
	const x1 = from.x + from.w, y1 = from.y + from.h * 0.5, x2 = to.x, y2 = to.y + to.h * 0.5, cx = (x1 + x2) * 0.5;
	return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
}

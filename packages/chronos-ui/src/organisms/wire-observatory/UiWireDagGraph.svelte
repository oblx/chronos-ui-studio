<script lang="ts">
	import {
		computeHumanScaledDurationMs, formatSubMsDuration, getActiveStudioDefaults, subscribeMotionState
	} from '@ui/motion';
	import { STUDIO_KNOB_DEFAULTS, type CornerKind, type GraphEdgeRouting, type WireTimeScaleCurve } from '@ui/tokens';
	import type { WireTraceRecord } from '@ui/wire';
	import {
		UiEventGraph, type UiGraphEdge, type UiGraphLane, type UiGraphNode, type UiGraphPacket
	} from '../graph';
	import {
		computeDagNodeStats, resolveTracePathNodes, WIRE_DAG_EDGES, WIRE_DAG_NODES
	} from './wire.dag.topology';

	interface Props {
		traces: readonly WireTraceRecord[];
		hasBit28: boolean;
		cornerMode?: CornerKind;
		selectedNodeId: string | null;
		activeTrace: WireTraceRecord | null;
		paused?: boolean;
		timeScaleMultiplier?: number;
		timeScaleCurve?: WireTimeScaleCurve;
		routing?: GraphEdgeRouting;
		packetSizePx?: number;
		onSelectNode: (nodeId: string | null) => void;
	}

	let {
		traces, hasBit28, cornerMode = 'CHAMFER', selectedNodeId, activeTrace, paused = false,
		timeScaleMultiplier, timeScaleCurve, routing, packetSizePx, onSelectNode
	}: Props = $props();

	let defaults = $state(getActiveStudioDefaults());
	$effect(() => subscribeMotionState(() => { defaults = getActiveStudioDefaults(); }));

	let effMultiplier = $derived(timeScaleMultiplier ?? defaults.wireTimeScaleMultiplier ?? STUDIO_KNOB_DEFAULTS.wireTimeScaleMultiplier);
	let effCurve = $derived<WireTimeScaleCurve>(timeScaleCurve ?? defaults.wireTimeScaleCurve ?? STUDIO_KNOB_DEFAULTS.wireTimeScaleCurve);
	let effRouting = $derived<GraphEdgeRouting>(routing ?? defaults.graphRouting ?? STUDIO_KNOB_DEFAULTS.graphRouting);
	let effPacketSize = $derived(packetSizePx ?? defaults.graphPacketSizePx ?? STUDIO_KNOB_DEFAULTS.graphPacketSizePx);

	let stats = $derived(computeDagNodeStats(traces, hasBit28));
	let tracePath = $derived(activeTrace ? resolveTracePathNodes(activeTrace) : null);

	let lanes = $derived<readonly UiGraphLane[]>([
		{ id: 'EMITTERS', title: 'EMITTERS', order: 0, accentTone: 'primary' },
		{ id: 'CLIENT_DAG', title: 'CLIENT_DAG', order: 1, accentTone: 'info' },
		{ id: 'TRANSPORT', title: 'TRANSPORT', order: 2, accentTone: 'secondary' },
		{ id: 'SERVER_DAG', title: hasBit28 ? 'SERVER_DAG (LIVE)' : 'SERVER_DAG (SCHEMATIC)', order: 3, accentTone: 'warning', dimmed: !hasBit28 }
	]);

	let graphNodes = $derived<readonly UiGraphNode[]>(WIRE_DAG_NODES.map((n) => {
		const m = stats.get(n.id) ?? { count: 0, avgMs: 0, status: 'NOMINAL' as const };
		const inTrace = tracePath ? tracePath.has(n.id) : false;
		const dimmed = n.column === 'SERVER_DAG' && !hasBit28;
		return {
			uuid: n.id, laneId: n.column, label: n.label, shape: 'BOX',
			status: inTrace ? 'ACTIVE' : m.status, portsIn: 1, portsOut: 1, dimmed,
			metricsLine: n.id === 'WS_HTTP_BRIDGE'
				? `WS/HTTP · ${formatSubMsDuration(m.avgMs)} · Q:${m.count}`
				: `${m.count} ops · ${formatSubMsDuration(m.avgMs)} · ${m.status}`
		};
	}));

	const nodeColById = new Map(WIRE_DAG_NODES.map((n) => [n.id, n.column]));

	let graphEdges = $derived<readonly UiGraphEdge[]>(WIRE_DAG_EDGES.map((e) => {
		const serverDim = (nodeColById.get(e.from) === 'SERVER_DAG' || nodeColById.get(e.to) === 'SERVER_DAG') && !hasBit28;
		const highlighted = tracePath ? (tracePath.has(e.from) && tracePath.has(e.to)) : Boolean(selectedNodeId && (e.from === selectedNodeId || e.to === selectedNodeId));
		return { id: e.id, fromNodeUuid: e.from, toNodeUuid: e.to, highlighted, dimmed: serverDim };
	}));

	let graphPackets = $derived.by<readonly UiGraphPacket[]>(() => {
		const meanTraceMs = traces.length > 0
			? traces.reduce((acc, t) => acc + (t.realDurationMs ?? t.stageMs), 0) / traces.length
			: 0.05;
		const activeMs = activeTrace ? (activeTrace.realDurationMs ?? activeTrace.stageMs) : null;
		const activeSet = activeTrace ? resolveTracePathNodes(activeTrace) : null;
		return graphEdges
			.filter((e) => !e.dimmed && (e.highlighted || !activeSet || (activeSet.has(e.fromNodeUuid) && activeSet.has(e.toNodeUuid)) || traces.length > 0))
			.map((e) => {
				const stageMs = Math.max(stats.get(e.fromNodeUuid)?.avgMs ?? 0, stats.get(e.toNodeUuid)?.avgMs ?? 0);
				const realMs = Number(Math.max(0.005, activeMs ?? (stageMs > 0 ? stageMs : meanTraceMs)).toFixed(3));
				const scaledMs = computeHumanScaledDurationMs(realMs, { multiplier: effMultiplier, curve: effCurve });
				return {
					id: `pkt-${e.id}-${effMultiplier}-${effCurve}`,
					edgeId: e.id,
					realDurationMs: realMs,
					scaledDurationMs: scaledMs,
					spawnedAtMs: activeTrace?.observedAtMs ?? 0
				};
			});
	});
</script>

<UiEventGraph
	{lanes}
	nodes={graphNodes}
	edges={graphEdges}
	packets={graphPackets}
	config={{ routing: effRouting, timeScaleMultiplier: effMultiplier, timeScaleCurve: effCurve, packetSizePx: effPacketSize, showPackets: !paused }}
	{cornerMode}
	{selectedNodeId}
	{paused}
	ariaLabel="Virtual 2D Dual-Spine DAG Graph"
	testId="wire-dag-graph"
	{onSelectNode}
/>

<script lang="ts">
	import { getActiveMotionSensory, resolveDurationMs, subscribeMotionState } from '@ui/motion';
	import { buildShapeGeometry, type CornerKind } from '@ui/tokens';
	import type { WireTraceRecord } from '@ui/wire';
	import {
		buildBezierEdgePath, computeDagNodeStats, resolveTracePathNodes,
		WIRE_DAG_EDGES, WIRE_DAG_NODES, type WireDagNodeDef
	} from './wire.dag.topology';

	interface Props {
		traces: readonly WireTraceRecord[];
		hasBit28: boolean;
		cornerMode?: CornerKind;
		selectedNodeId: string | null;
		activeTrace: WireTraceRecord | null;
		paused?: boolean;
		onSelectNode: (nodeId: string | null) => void;
	}

	let {
		traces, hasBit28, cornerMode = 'CHAMFER', selectedNodeId, activeTrace, paused = false, onSelectNode
	}: Props = $props();

	let zoom = $state(1);
	let panX = $state(0);
	let panY = $state(0);
	let dragging = $state(false);
	let lastX = 0;
	let lastY = 0;
	let sensory = $state(getActiveMotionSensory());
	$effect(() => subscribeMotionState(() => { sensory = getActiveMotionSensory(); }));

	const NODE_BY_ID = new Map<string, WireDagNodeDef>(WIRE_DAG_NODES.map((n) => [n.id, n]));
	let stats = $derived(computeDagNodeStats(traces, hasBit28));
	let tracePath = $derived(activeTrace ? resolveTracePathNodes(activeTrace) : null);
	let signalDurSec = $derived.by(() => {
		const ms = resolveDurationMs('ambient');
		return ms <= 0 ? 0 : Number((ms / 1000).toFixed(2));
	});
	let pulsesActive = $derived(!paused && signalDurSec > 0 && sensory.profile !== 'REDUCED_ZERO');

	function edgeHighlighted(from: string, to: string): boolean {
		if (tracePath) return tracePath.has(from) && tracePath.has(to);
		if (selectedNodeId) return from === selectedNodeId || to === selectedNodeId;
		return false;
	}
	function nodeRingVar(status: 'NOMINAL' | 'WARN' | 'BLOCKED'): string {
		if (status === 'BLOCKED') return 'var(--ui-muted-content)';
		if (status === 'WARN') return 'var(--ui-warning)';
		return 'var(--ui-success)';
	}
	function onDown(e: PointerEvent): void {
		if ((e.target as HTMLElement)?.closest('[data-dag-node]')) return;
		dragging = true; lastX = e.clientX; lastY = e.clientY;
	}
	function onMove(e: PointerEvent): void {
		if (!dragging) return;
		panX += e.clientX - lastX; panY += e.clientY - lastY;
		lastX = e.clientX; lastY = e.clientY;
	}
	function onWheel(e: WheelEvent): void {
		e.preventDefault();
		zoom = Number(Math.max(0.65, Math.min(1.6, zoom + (e.deltaY < 0 ? 0.08 : -0.08))).toFixed(2));
	}
</script>

<div
	role="region"
	aria-label="Virtual 2D Dual-Spine DAG Graph"
	data-testid="wire-dag-graph"
	onpointerdown={onDown}
	onpointermove={onMove}
	onpointerup={() => { dragging = false; }}
	onpointerleave={() => { dragging = false; }}
	onwheel={onWheel}
	class="relative min-h-[16rem] w-full flex-1 overflow-hidden border select-none"
	style="background-color: var(--ui-base-100); border-color: var(--ui-border-subtle); background-image: radial-gradient(color-mix(in srgb, var(--ui-border-subtle) 45%, transparent) 1px, transparent 1px); background-size: 18px 18px;"
>
	<div class="ui-font-mono pointer-events-none absolute top-1.5 left-2.5 z-10 flex items-center gap-3 text-[0.62rem]" style="color: var(--ui-muted-content);">
		<span>EMITTERS</span><span>CLIENT_DAG</span><span>TRANSPORT</span><span>SERVER_DAG {hasBit28 ? '(LIVE)' : '(SCHEMATIC)'}</span>
	</div>
	<div class="absolute top-1 right-2 z-10 flex items-center gap-1">
		<button type="button" onclick={() => { zoom = 1; panX = 0; panY = 0; }} class="ui-font-mono border px-1.5 py-0.5 text-[0.62rem]" style="background-color: var(--ui-base-200); border-color: var(--ui-border-subtle); color: var(--ui-base-content);">
			{Math.round(zoom * 100)}% Fit
		</button>
	</div>

	<svg viewBox="0 0 890 340" class="ui-dur-micro h-full w-full" style="transform: translate3d({panX}px, {panY}px, 0) scale({zoom}); transform-origin: center;">
		<defs>
			<marker id="wire-dag-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
				<path d="M 0 1 L 10 5 L 0 9 z" fill="var(--ui-primary)" />
			</marker>
		</defs>

		{#each WIRE_DAG_EDGES as edge (edge.id)}
			{@const from = NODE_BY_ID.get(edge.from)}
			{@const to = NODE_BY_ID.get(edge.to)}
			{#if from && to}
				{@const d = buildBezierEdgePath(from, to)}
				{@const hi = edgeHighlighted(edge.from, edge.to)}
				{@const serverDim = (from.column === 'SERVER_DAG' || to.column === 'SERVER_DAG') && !hasBit28}
				<path {d} fill="none" stroke={hi ? 'var(--ui-accent-vivid, var(--ui-primary))' : 'var(--ui-border-subtle)'} stroke-width={hi ? 2.2 : 1.25} stroke-dasharray={serverDim ? '4 4' : undefined} opacity={serverDim ? 0.42 : hi ? 1 : 0.78} marker-end="url(#wire-dag-arrow)" />
				{#if pulsesActive && !serverDim && (hi || traces.length > 0)}
					<circle r={hi ? 3.4 : 2.3} fill="var(--ui-accent-vivid, var(--ui-primary))" opacity={hi ? 0.95 : 0.6}>
						<animateMotion dur={`${signalDurSec}s`} repeatCount="indefinite" path={d} />
					</circle>
				{/if}
			{/if}
		{/each}

		{#each WIRE_DAG_NODES as node (node.id)}
			{@const m = stats.get(node.id) ?? { count: 0, avgMs: 0, status: 'NOMINAL' }}
			{@const isSel = selectedNodeId === node.id}
			{@const inTrace = tracePath ? tracePath.has(node.id) : false}
			{@const isServerLocked = node.column === 'SERVER_DAG' && !hasBit28}
			{@const geom = buildShapeGeometry('BOX', node.w, node.h, cornerMode === 'STRAIGHT' ? 0 : 7)}
			<g
				transform="translate({node.x}, {node.y})"
				opacity={isServerLocked ? 0.48 : 1}
				data-dag-node={node.id}
				data-testid={`wire-dag-node-${node.id}`}
				role="button"
				tabindex="0"
				aria-pressed={isSel}
				aria-label={`Filter wire traces by ${node.label}`}
				onclick={() => onSelectNode(isSel ? null : node.id)}
				onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectNode(isSel ? null : node.id); } }}
			>
				<path d={geom.outerPath} fill={isSel || inTrace ? 'color-mix(in srgb, var(--ui-primary) 22%, var(--ui-base-200))' : 'var(--ui-base-200)'} stroke={isSel ? 'var(--ui-accent-vivid, var(--ui-primary))' : inTrace ? 'var(--ui-primary)' : 'var(--ui-border-subtle)'} stroke-width={isSel || inTrace ? 2 : 1.25} />
				<circle cx="0" cy={node.h * 0.5} r="2.6" fill="var(--ui-primary)" />
				<circle cx={node.w} cy={node.h * 0.5} r="2.6" fill="var(--ui-secondary)" />
				<circle cx={node.w - 11} cy="12" r="3.5" fill={nodeRingVar(m.status)} />
				<text x="10" y="18" fill="var(--ui-base-content)" font-size="9.5" font-weight="700" font-family="var(--ui-font-mono)">{node.label}</text>
				<text x="10" y={node.h - 10} fill="var(--ui-muted-content)" font-size="8.2" font-family="var(--ui-font-mono)">
					{#if node.id === 'WS_HTTP_BRIDGE'}WS/HTTP · {m.avgMs.toFixed(1)}ms · Q:{m.count}{:else}{m.count} ops · {m.avgMs.toFixed(2)}ms · {m.status}{/if}
				</text>
			</g>
		{/each}
	</svg>
</div>

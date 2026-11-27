<script lang="ts">
	import { UiOverflowText } from '@ui/atoms';
	import { getActiveMotionSensory, subscribeMotionState } from '@ui/motion';
	import { buildShapeGeometry, clamp, DEFAULT_CHAMFER_TUPLE, resolveCornerTuple, type CornerKind } from '@ui/tokens';
	import { buildGraphEdgePath, computeGraphLayout } from './graph.layout';
	import { DEFAULT_UI_GRAPH_CONFIG, type UiGraphConfig, type UiGraphEdge, type UiGraphLane, type UiGraphNode, type UiGraphNodeStatus, type UiGraphPacket } from './graph.types';

	interface Props {
		lanes: readonly UiGraphLane[];
		nodes: readonly UiGraphNode[];
		edges: readonly UiGraphEdge[];
		packets?: readonly UiGraphPacket[];
		config?: Partial<UiGraphConfig>;
		cornerMode?: CornerKind;
		selectedNodeId?: string | null;
		selectedEdgeId?: string | null;
		paused?: boolean;
		ariaLabel?: string;
		testId?: string;
		onSelectNode?: (nodeId: string | null) => void;
		onSelectEdge?: (edgeId: string | null) => void;
		onFit?: () => void;
	}

	let {
		lanes, nodes, edges, packets = [], config = {}, cornerMode = 'CHAMFER',
		selectedNodeId = null, selectedEdgeId = null, paused = false,
		ariaLabel = 'Event-Driven Graph Canvas', testId = 'ui-event-graph',
		onSelectNode, onSelectEdge, onFit
	}: Props = $props();

	let zoom = $state(1);
	let panX = $state(0);
	let panY = $state(0);
	let dragging = $state(false);
	let lastX = 0;
	let lastY = 0;
	let sensory = $state(getActiveMotionSensory());
	$effect(() => subscribeMotionState(() => { sensory = getActiveMotionSensory(); }));

	let mergedCfg = $derived<UiGraphConfig>({ ...DEFAULT_UI_GRAPH_CONFIG, ...config });
	let layout = $derived(computeGraphLayout(lanes, nodes, mergedCfg));
	let packetsByEdge = $derived.by(() => {
		const map = new Map<string, UiGraphPacket[]>();
		for (const pkt of packets) {
			const bucket = map.get(pkt.edgeId) ?? [];
			bucket.push(pkt);
			map.set(pkt.edgeId, bucket);
		}
		return map;
	});
	let packetsLive = $derived(mergedCfg.showPackets && !paused && sensory.profile !== 'REDUCED_ZERO');

	function statusColor(status: UiGraphNodeStatus): string {
		if (status === 'BLOCKED') return 'var(--ui-muted-content)';
		if (status === 'WARN') return 'var(--ui-warning)';
		return status === 'ACTIVE' ? 'var(--ui-accent-vivid, var(--ui-primary))' : 'var(--ui-success)';
	}
	function onDown(e: PointerEvent): void {
		if ((e.target as HTMLElement)?.closest('[data-graph-interactive]')) return;
		dragging = true; lastX = e.clientX; lastY = e.clientY;
	}
	function onMove(e: PointerEvent): void {
		if (!dragging) return;
		panX += e.clientX - lastX; panY += e.clientY - lastY;
		lastX = e.clientX; lastY = e.clientY;
	}
	function onWheel(e: WheelEvent): void {
		e.preventDefault();
		zoom = Number(clamp(zoom + (e.deltaY < 0 ? 0.08 : -0.08), 0.5, 1.8).toFixed(2));
	}
	function handleFit(): void { zoom = 1; panX = 0; panY = 0; onFit?.(); }
</script>

<div role="region" aria-label={ariaLabel} data-testid={testId} data-graph-routing={mergedCfg.routing}
	onpointerdown={onDown} onpointermove={onMove} onpointerup={() => { dragging = false; }} onpointerleave={() => { dragging = false; }} onwheel={onWheel}
	class="relative min-h-[17rem] w-full flex-1 overflow-hidden border select-none"
	style="background-color: var(--ui-base-100); border-color: var(--ui-border-subtle); background-image: radial-gradient(color-mix(in srgb, var(--ui-border-subtle) 42%, transparent) 1px, transparent 1px); background-size: 18px 18px;">
	<div class="absolute top-1.5 right-2 z-20 flex items-center gap-1">
		<button type="button" data-testid="graph-fit-btn" data-graph-interactive="true" onclick={handleFit} class="ui-ctl ui-font-mono border px-1.5 py-0.5 text-[0.62rem]" style="background-color: var(--ui-base-200); border-color: var(--ui-border-subtle); color: var(--ui-base-content);">
			{Math.round(zoom * 100)}% Fit
		</button>
	</div>

	<svg viewBox={`0 0 ${layout.bounds.width} ${layout.bounds.height}`} preserveAspectRatio="xMidYMid meet" class="ui-dur-micro h-full w-full" style={`transform: translate3d(${panX}px, ${panY}px, 0) scale(${zoom}); transform-origin: center;`}>
		<defs>
			<marker id="ui-graph-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
				<path d="M 0 1 L 10 5 L 0 9 z" fill="var(--ui-primary)" />
			</marker>
		</defs>

		{#if mergedCfg.showLaneHeaders}
			{#each layout.lanes as pl (pl.lane.id)}
				<g data-testid={`graph-lane-header-${pl.lane.id}`} data-graph-lane-header={pl.lane.id} opacity={pl.lane.dimmed ? 0.55 : 1}>
					<rect x={pl.headerRect.x} y={pl.headerRect.y} width={pl.headerRect.w} height={pl.headerRect.h} fill="var(--ui-base-200)" stroke="var(--ui-border-subtle)" stroke-width="1" vector-effect="non-scaling-stroke" />
					<foreignObject x={pl.headerRect.x + 6} y={pl.headerRect.y + 3} width={pl.headerRect.w - 12} height={pl.headerRect.h - 6}>
						<div class="ui-font-mono ui-marquee-host flex h-full w-full items-center text-[0.62rem] font-semibold uppercase tracking-wider" style="color: var(--ui-primary);">
							<UiOverflowText text={pl.lane.title} />
						</div>
					</foreignObject>
				</g>
			{/each}
		{/if}

		{#each edges as edge (edge.id)}
			{@const from = layout.nodeById.get(edge.fromNodeUuid)}
			{@const to = layout.nodeById.get(edge.toNodeUuid)}
			{#if from && to}
				{@const d = buildGraphEdgePath(from, to, edge.routing ?? mergedCfg.routing, edge)}
				{@const isSel = selectedEdgeId === edge.id || Boolean(edge.highlighted)}
				{@const edgePackets = packetsByEdge.get(edge.id) ?? []}
				<g data-testid={`graph-edge-${edge.id}`} data-graph-interactive="true" role="button" tabindex="0" aria-label={edge.label ?? `Edge ${edge.id}`} onclick={() => onSelectEdge?.(selectedEdgeId === edge.id ? null : edge.id)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectEdge?.(selectedEdgeId === edge.id ? null : edge.id); } }}>
					<path {d} fill="none" stroke={isSel ? 'var(--ui-accent-vivid, var(--ui-primary))' : 'var(--ui-border-subtle)'} stroke-width={isSel ? 2.2 : 1.3} stroke-dasharray={edge.dimmed ? '4 4' : undefined} opacity={edge.dimmed ? 0.42 : isSel ? 1 : 0.82} vector-effect="non-scaling-stroke" marker-end="url(#ui-graph-arrow)" />
					{#if packetsLive && !edge.dimmed}
						{#each edgePackets as pkt (pkt.id)}
							<circle r={Math.max(2, mergedCfg.packetSizePx * 0.5)} fill="var(--ui-accent-vivid, var(--ui-primary))" opacity={isSel ? 0.98 : 0.78} data-testid="graph-packet" data-real-ms={pkt.realDurationMs} data-scaled-ms={pkt.scaledDurationMs}>
								<animateMotion dur={`${(pkt.scaledDurationMs / 1000).toFixed(3)}s`} repeatCount="indefinite" path={d} />
							</circle>
						{/each}
					{/if}
				</g>
			{/if}
		{/each}

		{#each layout.nodes as pos (pos.node.uuid)}
			{@const isSel = selectedNodeId === pos.node.uuid}
			{@const geom = buildShapeGeometry(pos.node.shape ?? mergedCfg.nodeShape, pos.w, pos.h, cornerMode === 'STRAIGHT' ? 0 : 7, resolveCornerTuple(pos.node.corners ?? DEFAULT_CHAMFER_TUPLE, cornerMode))}
			<g transform={`translate(${pos.x}, ${pos.y})`} opacity={pos.node.dimmed ? 0.48 : 1} data-dag-node={pos.node.uuid} data-graph-node={pos.node.uuid} data-graph-interactive="true" data-testid={`wire-dag-node-${pos.node.uuid}`} role="button" tabindex="0" aria-pressed={isSel} aria-label={pos.node.label} onclick={() => onSelectNode?.(isSel ? null : pos.node.uuid)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectNode?.(isSel ? null : pos.node.uuid); } }}>
				<path d={geom.outerPath} fill={isSel || pos.node.status === 'ACTIVE' ? 'color-mix(in srgb, var(--ui-primary) 20%, var(--ui-base-200))' : 'var(--ui-base-200)'} stroke={isSel ? 'var(--ui-accent-vivid, var(--ui-primary))' : pos.node.status === 'ACTIVE' ? 'var(--ui-primary)' : 'var(--ui-border-subtle)'} stroke-width={isSel || pos.node.status === 'ACTIVE' ? 2 : 1.25} vector-effect="non-scaling-stroke" />
				{#if mergedCfg.showPorts}
					{#each pos.inPorts as pt, idx (`in-${idx}`)}<circle cx={pt.x - pos.x} cy={pt.y - pos.y} r="2.6" fill="var(--ui-primary)" />{/each}
					{#each pos.outPorts as pt, idx (`out-${idx}`)}<circle cx={pt.x - pos.x} cy={pt.y - pos.y} r="2.6" fill="var(--ui-secondary)" />{/each}
				{/if}
				<circle cx={pos.w - 11} cy="12" r="3.4" fill={statusColor(pos.node.status)} />
				<foreignObject x="10" y="6" width={pos.w - 28} height="18">
					<div class="ui-font-mono ui-marquee-host text-[0.62rem] font-bold leading-tight" style="color: var(--ui-base-content);"><UiOverflowText text={pos.node.label} /></div>
				</foreignObject>
				{#if pos.node.metricsLine || pos.node.subtitle}
					<foreignObject x="10" y={pos.h - 21} width={pos.w - 20} height="16">
						<div class="ui-font-mono ui-marquee-host text-[0.55rem] leading-tight" style="color: var(--ui-muted-content);"><UiOverflowText text={pos.node.metricsLine ?? pos.node.subtitle ?? ''} /></div>
					</foreignObject>
				{/if}
			</g>
		{/each}
	</svg>
</div>

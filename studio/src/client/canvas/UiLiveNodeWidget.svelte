<script lang="ts">
	import type { Snippet } from 'svelte';
	import {
		UiBadge, UiBentoRadar, UiChamferButton, UiChamferFrame, UiMathFormula, UiProgressGauge,
		type CornerKind, type UiNode, type WireTraceRecord
	} from '@chronos-ui/svelte';

	interface Props {
		node: UiNode;
		cornerMode: CornerKind;
		selected: boolean;
		traces?: readonly WireTraceRecord[];
		childrenSlot?: Snippet;
		onSelect: (id: string) => void;
		onNodeAction: (node: UiNode, actionLabel: string) => void;
	}

	let { node, cornerMode, selected, traces = [], childrenSlot, onSelect, onNodeAction }: Props = $props();

	let title = $derived(String(node.props.title ?? node.label));
	let subtitle = $derived(String(node.props.subtitle ?? ''));
	let tabs = $derived(String(node.props.tabs ?? 'Overview,Nodes,Logs').split(',').map((s) => s.trim()).filter(Boolean));
	let items = $derived(String(node.props.items ?? 'Main,Staging,Release').split(',').map((s) => s.trim()).filter(Boolean));
	let actions = $derived(String(node.props.actions ?? 'Run,Inspect,Reset').split(',').map((s) => s.trim()).filter(Boolean));
	let activeTab = $state(0);
	let effectiveCornerMode = $derived<CornerKind>(node.corners?.[0] ?? cornerMode);
	let shape = $derived(node.shape ?? 'BOX');
	let emb = $derived(node.cornerEmbellishment);
	let anim = $derived(node.cornerAnimation ?? 'NONE');
	let embCfg = $derived(node.embellishmentConfig);
	let recentTraces = $derived(traces.slice(-3).reverse());
</script>

{#snippet nestedBlock()}
	{#if childrenSlot}
		<div class="mt-2 flex w-full flex-col gap-2 border-t pt-2" style="border-color: var(--ui-border-subtle);" data-testid={`nested-children-${node.id}`}>
			{@render childrenSlot()}
		</div>
	{/if}
{/snippet}

<div role="button" tabindex="0" data-ui-interactive="true" data-testid={`live-node-${node.id}`} data-node-zone={node.zone} data-node-shape={shape}
	onclick={(e) => { e.stopPropagation(); onSelect(node.id); }}
	onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onSelect(node.id); } }}
	class="ui-commit-morph cursor-pointer text-left"
	style={selected ? 'outline: 2px solid var(--ui-accent-vivid, var(--ui-accent)); outline-offset: 2px;' : ''}>
	{#if node.type === 'UiHeaderBar'}
		<UiChamferFrame outerClass="w-full" corners={node.corners} cornerMode={effectiveCornerMode} cornerRadiusRem={node.cornerRadiusRem} {shape} cornerEmbellishment={emb} cornerAnimation={anim} embellishmentConfig={embCfg} carets={true} bezel={true} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
			<span class="ui-font-display text-xs font-semibold">{title}</span>
			<div class="flex items-center gap-1.5">
				{#each tabs as tab, idx (`${node.id}-t-${idx}`)}
					<UiChamferButton cornerMode={effectiveCornerMode} label={tab} active={activeTab === idx} variant={activeTab === idx ? 'primary' : 'surface'} onclick={(e) => { e.stopPropagation(); activeTab = idx; onNodeAction(node, tab); }} className="py-0.5 text-xs" />
				{/each}
			</div>
			{@render nestedBlock()}
		</UiChamferFrame>
	{:else if node.type === 'UiProjectDeck'}
		<UiChamferFrame outerClass="w-full" corners={node.corners} cornerMode={effectiveCornerMode} cornerRadiusRem={node.cornerRadiusRem} {shape} cornerEmbellishment={emb} cornerAnimation={anim} embellishmentConfig={embCfg} className="flex items-center gap-1.5 px-3 py-1.5">
			{#each items as item, idx (`${node.id}-d-${idx}`)}
				<UiChamferButton cornerMode={effectiveCornerMode} label={item} active={activeTab === idx} variant={activeTab === idx ? 'secondary' : 'ghost'} onclick={(e) => { e.stopPropagation(); activeTab = idx; onNodeAction(node, item); }} className="py-0.5 text-xs" />
			{/each}
		</UiChamferFrame>
	{:else if node.type === 'UiMetricCard'}
		<UiChamferFrame outerClass="w-full" corners={node.corners} cornerMode={effectiveCornerMode} cornerRadiusRem={node.cornerRadiusRem} {shape} cornerEmbellishment={emb} cornerAnimation={anim} embellishmentConfig={embCfg} carets={true} className="flex flex-col gap-1 px-4 py-3">
			<span class="text-xs" style="color: var(--ui-muted-content);">{title}</span>
			<span class="ui-font-mono text-lg font-semibold" style="color: var(--ui-accent-vivid, var(--ui-primary));">{String(node.props.value ?? '60 FPS')}</span>
			<span class="ui-font-mono text-[0.7rem]" style="color: var(--ui-muted-content);">{String(node.props.delta ?? 'Nominal')}</span>
			{@render nestedBlock()}
		</UiChamferFrame>
	{:else if node.type === 'UiProgressGauge'}
		<UiChamferFrame outerClass="w-full" corners={node.corners} cornerMode={effectiveCornerMode} cornerRadiusRem={node.cornerRadiusRem} {shape} cornerEmbellishment={emb} cornerAnimation={anim} embellishmentConfig={embCfg} className="px-4 py-3">
			<UiProgressGauge label={String(node.props.label ?? node.label)} value={Number(node.props.value ?? 72)} max={Number(node.props.max ?? 100)} />
		</UiChamferFrame>
	{:else if node.type === 'UiWireInspector'}
		<UiChamferFrame outerClass="w-full" corners={node.corners} cornerMode={effectiveCornerMode} cornerRadiusRem={node.cornerRadiusRem} {shape} cornerEmbellishment={emb} cornerAnimation={anim} embellishmentConfig={embCfg} carets={true} className="flex flex-col gap-1.5 px-3.5 py-2.5">
			<div class="flex items-center justify-between gap-2"><span class="ui-font-display text-xs font-semibold">{title}</span><span class="ui-font-mono text-[0.62rem]" style="color: var(--ui-accent-vivid, var(--ui-primary));">{traces.length} EVENTS</span></div>
			{#each recentTraces as tr (`${tr.spine}-${tr.seq}`)}
				<div class="ui-font-mono flex items-center justify-between gap-2 text-[0.62rem]" style="color: var(--ui-muted-content);"><span class="truncate">#{tr.seq} · {tr.kind}</span><span>{tr.stageMs.toFixed(1)}ms</span></div>
			{:else}
				<div class="ui-font-mono text-[0.62rem]" style="color: var(--ui-muted-content);">WIRE IDLE · READY FOR DISPATCH</div>
			{/each}
		</UiChamferFrame>
	{:else if node.type === 'UiBentoRadar'}
		<div class="relative h-32 w-60 overflow-hidden"><UiBentoRadar cornerMode={effectiveCornerMode} zoom={Number(node.props.zoom ?? 1)} panX={0} panY={0} activeZoneCount={Number(node.props.activeZoneCount ?? 3)} leftActions={[{ id: 'in', icon: 'plus', label: 'Zoom In', onClick: () => onNodeAction(node, 'zoom-in') }, { id: 'rst', icon: 'reset', label: 'Reset', onClick: () => onNodeAction(node, 'reset') }]} rightActions={[{ id: 'rad', icon: 'radar', label: 'Focus', onClick: () => onNodeAction(node, 'focus') }]} /></div>
	{:else if node.type === 'UiActionBar'}
		<UiChamferFrame outerClass="w-full" corners={node.corners} cornerMode={effectiveCornerMode} cornerRadiusRem={node.cornerRadiusRem} {shape} cornerEmbellishment={emb} cornerAnimation={anim} embellishmentConfig={embCfg} className="flex flex-nowrap items-center justify-center gap-1 px-1 py-1">
			{#each actions as act (`${node.id}-a-${act}`)}<UiChamferButton cornerMode={effectiveCornerMode} label={act} variant="surface" onclick={(e) => { e.stopPropagation(); onNodeAction(node, act); }} className="whitespace-nowrap px-1.5 py-0.5 text-[0.62rem]" />{/each}
		</UiChamferFrame>
	{:else if node.type === 'UiBadge'}
		<UiBadge text={String(node.props.text ?? node.props.label ?? node.label)} cornerMode={effectiveCornerMode} tone={(node.props.tone as 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'neutral') ?? 'primary'} />
	{:else if node.type === 'UiChamferButton'}
		<UiChamferButton cornerMode={effectiveCornerMode} label={String(node.props.label ?? node.label)} variant="primary" onclick={(e) => { e.stopPropagation(); onNodeAction(node, node.label); }} />
	{:else if node.type === 'UiMathFormula'}
		<UiChamferFrame outerClass="w-full" corners={node.corners} cornerMode={effectiveCornerMode} cornerRadiusRem={node.cornerRadiusRem} {shape} cornerEmbellishment={emb} cornerAnimation={anim} embellishmentConfig={embCfg} className="px-4 py-3"><UiMathFormula lhs={String(node.props.lhs ?? 'XP(n)')} rhs={String(node.props.rhs ?? 'n^3')} /></UiChamferFrame>
	{:else}
		<UiChamferFrame outerClass="w-full" corners={node.corners} cornerMode={effectiveCornerMode} cornerRadiusRem={node.cornerRadiusRem} {shape} cornerEmbellishment={emb} cornerAnimation={anim} embellishmentConfig={embCfg} carets={true} className="flex flex-col gap-1 px-3.5 py-3">
			<div class="flex min-w-0 flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5"><h3 class="ui-font-display min-w-0 text-xs font-semibold leading-snug break-words">{title}</h3><span class="ui-font-mono shrink-0 text-[0.58rem] opacity-75" style="color: var(--ui-muted-content);">{node.zone}</span></div>
			{#if subtitle}<p class="text-[0.7rem] leading-relaxed" style="color: var(--ui-muted-content);">{subtitle}</p>{/if}
			{@render nestedBlock()}
		</UiChamferFrame>
	{/if}
</div>

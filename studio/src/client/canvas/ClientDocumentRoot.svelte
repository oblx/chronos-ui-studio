<script lang="ts">
	import {
		createUiWireBroker, UiChamferButton, uiTransition, Z_LAYERS,
		type CornerKind, type EntityMeasuredRect, type HudZoneId, type UiNode, type UiNodeTree, type WireTraceRecord
	} from '@chronos-ui/svelte';
	import type { Action } from 'svelte/action';
	import { STARTER_SAMPLE_PROJECTS } from '@studio/config';
	import { resolveClientComponent } from './client.components';

	interface Props {
		projectId: string;
		nodes: UiNodeTree;
		traces?: readonly WireTraceRecord[];
		cornerMode: CornerKind;
		selectedNodeId: string | null;
		hasStagingNodes: boolean;
		onSelectNode: (id: string | null) => void;
		onLoadSample: (sampleId: string) => void;
		onOpenBuildPalette: () => void;
		onClientEvent: (summary: string) => void;
		onMorphCorner?: (cornerMode: CornerKind) => void;
		onMeasureRect?: (uuid: string, rect: EntityMeasuredRect) => void;
	}

	let {
		projectId, nodes, traces = [], cornerMode, selectedNodeId, hasStagingNodes,
		onSelectNode, onLoadSample, onOpenBuildPalette, onClientEvent, onMorphCorner, onMeasureRect
	}: Props = $props();

	const clientProjectBroker = createUiWireBroker<{ lastAction: string }>({ lastAction: 'idle' });
	clientProjectBroker.register('STUDIO_COMMAND_EXEC', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (_s, env) => ({ lastAction: String((env.payload as { action?: string }).action ?? 'ok') }),
		summarize: (env) => `client:${String((env.payload as { action?: string }).action ?? 'event')}`
	});

	let committed = $derived(nodes.filter((n) => n.lifecycle === 'COMMITTED'));
	const byZone = (z: HudZoneId) => committed.filter((n) => n.zone === z);
	let hasLeft = $derived(byZone('LEFT_EDGE').length > 0);
	let hasRight = $derived(byZone('RIGHT_EDGE').length > 0);
	let midGridCols = $derived(hasLeft && hasRight ? 'md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]' : hasLeft ? 'md:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]' : hasRight ? 'md:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]' : 'md:grid-cols-1');

	const measureNode: Action<HTMLElement, string> = (el, uuid) => {
		const emit = () => {
			if (!onMeasureRect) return;
			const r = el.getBoundingClientRect();
			if (r.width > 0 && r.height > 0) onMeasureRect(uuid, { x: r.left, y: r.top, width: r.width, height: r.height });
		};
		const ro = new ResizeObserver(() => requestAnimationFrame(emit));
		ro.observe(el);
		queueMicrotask(emit);
		return { destroy() { ro.disconnect(); } };
	};

	function fireNodeAction(node: UiNode, action: string): void {
		if (action === 'ROUND' || action === 'CHAMFER' || action === 'STRAIGHT') {
			onMorphCorner?.(action);
		}
		clientProjectBroker.dispatch('STUDIO_COMMAND_EXEC', { nodeId: node.id, action }, 'USER');
		onClientEvent(`${node.label} -> ${action}`);
	}
</script>

{#snippet renderNode(node: UiNode)}
	{@const DynamicComponent = resolveClientComponent(node.type)}
	{@const hasKids = Boolean(node.children && node.children.length > 0)}
	{#snippet nodeChildren()}
		{#each node.children ?? [] as child (child.id)}{@render renderNode(child)}{/each}
	{/snippet}
	<div use:measureNode={node.id} in:uiTransition={{ offsetPx: 10 }} out:uiTransition={{ offsetPx: 10 }} class="flex flex-col gap-2">
		<DynamicComponent {node} {cornerMode} {traces} selected={selectedNodeId === node.id} childrenSlot={hasKids ? nodeChildren : undefined} onSelect={(id) => onSelectNode(id)} onNodeAction={fireNodeAction} />
	</div>
{/snippet}

<div data-testid="client-document-root" data-project-id={projectId} class="relative flex min-h-full w-full flex-col justify-between px-4 py-4 pb-12 sm:px-8" style={`z-index: ${Z_LAYERS.paintedClientCanvas};`}>
	{#if committed.length === 0 && !hasStagingNodes}
		<div class="m-auto flex max-w-[44rem] flex-col items-center gap-4 text-center select-none" data-testid="calm-empty-stage">
			<span class="ui-font-mono text-[0.7rem] tracking-widest uppercase" style="color: var(--ui-muted-content);">
				Calm Empty Stage · Ready
			</span>
			<h1 class="ui-font-display max-w-[36rem] text-xl font-medium" style="color: var(--ui-base-content); text-wrap: balance;">
				Describe an interface below, click Build, or launch a starter sample
			</h1>
			<div class="grid w-full grid-cols-1 gap-2 pt-1 sm:grid-cols-2 lg:grid-cols-3" data-testid="starter-sample-chips">
				{#each STARTER_SAMPLE_PROJECTS as sample (sample.id)}
					<UiChamferButton {cornerMode} icon="star" label={sample.title} tip={sample.tagline} variant="surface"
						onclick={() => onLoadSample(sample.id)} className="w-full py-1.5 text-xs" />
				{/each}
				<UiChamferButton {cornerMode} icon="wrench" label="Open Visual Palette" variant="primary" onclick={onOpenBuildPalette} className="w-full py-1.5 text-xs" />
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-3 md:grid-cols-3">
			<div class="flex flex-col gap-2">{#each byZone('TOP_LEFT') as n (n.id)}{@render renderNode(n)}{/each}</div>
			<div class="flex flex-col gap-2">
				{#each byZone('TOP_CENTER') as n (n.id)}{@render renderNode(n)}{/each}
				{#each byZone('PROJECT_TAB_DECK') as n (n.id)}{@render renderNode(n)}{/each}
			</div>
			<div class="flex flex-col items-end gap-2">{#each byZone('TOP_RIGHT') as n (n.id)}{@render renderNode(n)}{/each}</div>
		</div>
		<div class="my-auto grid grid-cols-1 items-start gap-4 py-2 {midGridCols}">
			{#if hasLeft}<div class="flex flex-col gap-3">{#each byZone('LEFT_EDGE') as n (n.id)}{@render renderNode(n)}{/each}</div>{/if}
			<div class="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 {(!hasLeft || !hasRight) ? 'lg:grid-cols-3' : ''}">{#each byZone('WORLD_CANVAS') as n (n.id)}{@render renderNode(n)}{/each}</div>
			{#if hasRight}<div class="flex flex-col gap-3">{#each byZone('RIGHT_EDGE') as n (n.id)}{@render renderNode(n)}{/each}</div>{/if}
		</div>
		<div class="grid grid-cols-1 items-end gap-3 md:grid-cols-3">
			<div class="flex flex-col gap-2">{#each byZone('BOTTOM_LEFT') as n (n.id)}{@render renderNode(n)}{/each}</div>
			<div class="flex flex-col gap-2">{#each byZone('BOTTOM_CENTER') as n (n.id)}{@render renderNode(n)}{/each}</div>
			<div class="flex flex-col items-end gap-2">{#each byZone('BOTTOM_RIGHT') as n (n.id)}{@render renderNode(n)}{/each}</div>
		</div>
	{/if}
</div>

<script lang="ts">
	import type { HudZoneId, UiNode } from '@chronos-ui/svelte';
	import type { ZoneBlueprintConfig } from '../../../config';

	interface Props {
		zones: readonly ZoneBlueprintConfig[];
		selectedZoneId: HudZoneId;
		nodes: readonly UiNode[];
		onSelectZone: (zoneId: HudZoneId) => void;
	}

	let { zones, selectedZoneId, nodes, onSelectZone }: Props = $props();

	const findZone = (id: HudZoneId) => zones.find((z) => z.id === id);
	const countNodes = (id: HudZoneId) => nodes.filter((n) => n.zone === id).length;
</script>

{#snippet cell(id: HudZoneId, shortLabel: string)}
	{@const z = findZone(id)}
	{@const active = selectedZoneId === id}
	{@const count = countNodes(id)}
	<button
		type="button"
		data-testid={`zone-cell-${id}`}
		onclick={() => onSelectZone(id)}
		class="flex flex-col justify-between gap-0.5 border px-2 py-1.5 text-left transition-colors"
		style={`
			border-color: ${active ? 'var(--ui-accent-vivid, var(--ui-primary))' : 'var(--ui-border-subtle)'};
			background-color: ${active ? 'var(--ui-base-300)' : 'var(--ui-base-100)'};
			opacity: ${z?.visible === false ? '0.5' : '1'};
		`}
	>
		<div class="ui-font-mono flex items-center justify-between gap-1 text-[0.62rem] font-semibold">
			<span class="truncate">{shortLabel}</span>
			<span style="color: var(--ui-accent-vivid, var(--ui-primary));">{count}</span>
		</div>
		<span class="ui-font-mono truncate text-[0.56rem]" style="color: var(--ui-muted-content);">
			{z?.visible === false ? 'HIDDEN' : (z?.disposition ?? 'DOCKED')}
		</span>
	</button>
{/snippet}

<div class="flex flex-col gap-1.5" data-testid="zone-schematic-grid">
	<div class="grid grid-cols-3 gap-1.5">
		{@render cell('TOP_LEFT', 'TOP_LEFT')}
		<div class="flex flex-col gap-1">
			{@render cell('TOP_CENTER', 'TOP_CENTER')}
			{@render cell('PROJECT_TAB_DECK', 'TAB_DECK')}
		</div>
		{@render cell('TOP_RIGHT', 'TOP_RIGHT')}
	</div>
	<div class="grid grid-cols-[1fr_2fr_1fr] gap-1.5">
		{@render cell('LEFT_EDGE', 'LEFT_EDGE')}
		{@render cell('WORLD_CANVAS', 'WORLD_CANVAS')}
		{@render cell('RIGHT_EDGE', 'RIGHT_EDGE')}
	</div>
	<div class="grid grid-cols-3 gap-1.5">
		{@render cell('BOTTOM_LEFT', 'BOTTOM_LEFT')}
		{@render cell('BOTTOM_CENTER', 'BOTTOM_CENTER')}
		{@render cell('BOTTOM_RIGHT', 'BOTTOM_RIGHT')}
	</div>
	{@render cell('MODAL_OVERLAY_STACK', 'MODAL_OVERLAY_STACK')}
</div>

<script lang="ts">
	import { UiBadge, UiChamferFrame, ZONE_CORNER_PRESETS, type CornerKind, type WireTraceRecord } from '@chronos-ui/svelte';
	import type { ZoneBlueprintConfig } from '@studio/config';

	interface Props {
		mode?: 'LEFT_STREAM';
		traces?: readonly WireTraceRecord[];
		cornerMode: CornerKind;
		zoneConfig?: ZoneBlueprintConfig;
	}

	let { traces = [], cornerMode, zoneConfig }: Props = $props();
	let latest = $derived(traces.slice(-3).reverse());

	function formatTime(ts: number): string {
		const d = new Date(ts);
		return `${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
	}
</script>

<UiChamferFrame
	corners={zoneConfig?.corners ?? ZONE_CORNER_PRESETS.BOTTOM_LEFT}
	{cornerMode}
	cornerRadiusRem={zoneConfig?.cornerRadiusRem}
	cutTier="station"
	shape={zoneConfig?.shape ?? 'BOX'}
	cornerEmbellishment={zoneConfig?.cornerEmbellishment}
	cornerAnimation={zoneConfig?.cornerAnimation ?? 'NONE'}
	carets={true}
	bezel={true}
	outerClass="h-full w-full"
	className="h-full px-3.5 py-2.5"
>
	<div class="flex h-full flex-col justify-between gap-1 overflow-hidden">
		<div class="flex items-center justify-between gap-2 pb-1" style="border-bottom: var(--ui-hairline) solid var(--ui-border-subtle);">
			<span class="ui-font-mono text-[0.7rem] font-bold tracking-wider" style="color: var(--ui-primary);">LIVE STREAM</span>
			<UiBadge text={`${traces.length} ops`} tone="info" />
		</div>
		<div class="flex flex-col gap-0.5 overflow-hidden">
			{#each latest as item (`${item.spine}-${item.seq}-${item.envelopeId}`)}
				<div data-trace-kind={item.kind} class="ui-font-mono flex items-center justify-between gap-1.5 truncate text-[0.65rem]">
					<span class="shrink-0" style="color: var(--ui-muted-content);">{formatTime(item.timestamp)}</span>
					<span class="truncate" style="color: var(--ui-secondary);">[{item.kind.replace('UI_', '')}]</span>
					<span class="shrink-0" style="color: var(--ui-muted-content);">{item.stageMs.toFixed(1)}ms</span>
				</div>
			{:else}
				<div class="ui-font-mono text-[0.68rem]" style="color: var(--ui-muted-content);">Awaiting DAG envelope events...</div>
			{/each}
		</div>
	</div>
</UiChamferFrame>

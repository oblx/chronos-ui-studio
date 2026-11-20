<script lang="ts">
	import { UiChamferButton, type CornerKind, type CssCursorState } from '@chronos-ui/svelte';

	interface Props {
		cssState: CssCursorState;
		assetUrl: string;
		hotspotX: number;
		hotspotY: number;
		cornerMode: CornerKind;
		onSetHotspot: (x: number, y: number) => void;
	}

	let { cssState, assetUrl, hotspotX, hotspotY, cornerMode, onSetHotspot }: Props = $props();

	function handlePadClick(e: MouseEvent): void {
		const el = e.currentTarget as HTMLButtonElement;
		const r = el.getBoundingClientRect();
		const x = Math.max(0, Math.min(31, Math.round(((e.clientX - r.left) / Math.max(1, r.width)) * 31)));
		const y = Math.max(0, Math.min(31, Math.round(((e.clientY - r.top) / Math.max(1, r.height)) * 31)));
		onSetHotspot(x, y);
	}
</script>

<div class="flex items-center gap-3 border p-2.5" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-100);">
	<button
		type="button"
		data-testid="cursor-hotspot-pad"
		aria-label={`Calibrate hotspot for ${cssState}`}
		onclick={handlePadClick}
		class="relative h-24 w-24 shrink-0 overflow-hidden border"
		style="border-color: var(--ui-primary); background-color: var(--ui-base-200); cursor: crosshair;"
	>
		{#if assetUrl}
			<img src={assetUrl} alt={`${cssState} cursor preview`} class="pointer-events-none h-full w-full object-contain p-2" />
		{/if}
		<span class="pointer-events-none absolute inset-y-0 w-px" style={`left: ${(hotspotX / 31) * 100}%; background-color: var(--ui-accent-vivid, var(--ui-primary));`}></span>
		<span class="pointer-events-none absolute inset-x-0 h-px" style={`top: ${(hotspotY / 31) * 100}%; background-color: var(--ui-accent-vivid, var(--ui-primary));`}></span>
	</button>
	<div class="flex flex-1 flex-col gap-1.5 text-[0.7rem]">
		<div class="ui-font-mono font-semibold" style="color: var(--ui-primary);">{cssState}</div>
		<div class="ui-font-mono" style="color: var(--ui-muted-content);">Hotspot: ({hotspotX}, {hotspotY})</div>
		<div class="flex flex-wrap gap-1">
			<UiChamferButton {cornerMode} label="Top-Left (3,2)" variant="surface" onclick={() => onSetHotspot(3, 2)} className="px-1.5 py-0.5 text-[0.62rem]" />
			<UiChamferButton {cornerMode} label="Center (12,12)" variant="surface" onclick={() => onSetHotspot(12, 12)} className="px-1.5 py-0.5 text-[0.62rem]" />
		</div>
	</div>
</div>

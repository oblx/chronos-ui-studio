<script lang="ts">
	import { uiClampTooltipRect, type TooltipState } from '../machines';
	import { uiTransition } from '../motion';
	import { Z_LAYERS } from '../tokens';

	interface Props {
		tooltip: TooltipState;
	}

	let { tooltip }: Props = $props();

	let transformOrigin = $derived(
		tooltip.placement === 'top'
			? 'translate(-50%, -100%)'
			: tooltip.placement === 'bottom'
				? 'translate(-50%, 0)'
				: tooltip.placement === 'left'
					? 'translate(-100%, -50%)'
					: 'translate(0, -50%)'
	);
</script>

{#if tooltip.visible && tooltip.text}
	<div
		role="tooltip"
		data-testid="ui-cyber-tooltip"
		use:uiClampTooltipRect={{ x: tooltip.x, y: tooltip.y, placement: tooltip.placement }}
		class="pointer-events-none fixed max-w-xs"
		style="z-index: {Z_LAYERS.overlays}; left: {tooltip.x}px; top: {tooltip.y}px; transform: {transformOrigin};"
	>
		<div
			in:uiTransition={{ offsetPx: 6 }}
			out:uiTransition={{ offsetPx: 6 }}
			class="whitespace-nowrap px-2.5 py-1 text-xs font-medium shadow-md"
			style="background-color: var(--ui-base-300); color: var(--ui-base-content); border: var(--ui-hairline) solid var(--ui-accent-vivid, var(--ui-accent));"
		>
			{tooltip.text}
		</div>
	</div>
{/if}

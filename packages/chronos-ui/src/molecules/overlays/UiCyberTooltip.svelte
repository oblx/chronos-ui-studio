<script lang="ts">
	import { UiChamferFrame } from '@ui/atoms';
	import { parseTooltipContent, uiClampTooltipRect, type TooltipState } from '@ui/machines';
	import { uiTransition } from '@ui/motion';
	import { DEFAULT_CHAMFER_TUPLE, Z_LAYERS } from '@ui/tokens';

	interface Props {
		tooltip: TooltipState;
	}

	let { tooltip }: Props = $props();

	let parsed = $derived(parseTooltipContent(tooltip.text));
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
		data-tip-level={tooltip.infoLevel}
		use:uiClampTooltipRect={{ x: tooltip.x, y: tooltip.y, placement: tooltip.placement, text: tooltip.text }}
		class="pointer-events-none fixed"
		style="z-index: {Z_LAYERS.overlays}; left: {tooltip.x}px; top: {tooltip.y}px; transform: {transformOrigin}; width: fit-content; max-width: min(20rem, calc(100vw - 1rem));"
	>
		<div in:uiTransition={{ offsetPx: 6 }} out:uiTransition={{ offsetPx: 6 }} class="w-fit max-w-full shadow-lg">
			<UiChamferFrame
				corners={DEFAULT_CHAMFER_TUPLE}
				cutPx={6}
				carets={false}
				bezel={false}
				surfaceVar="var(--ui-base-300)"
				strokeVar="var(--ui-accent-vivid, var(--ui-accent))"
				outerClass="w-fit max-w-full"
				className="min-w-[8rem] max-w-[min(20rem,calc(100vw-1rem))] whitespace-normal break-words px-3 py-2 text-left text-xs leading-[1.45]"
			>
				<div data-testid="ui-cyber-tooltip-body" class="space-y-1.5" style="color: var(--ui-base-content);">
					{#if parsed.title}
						<div class="flex items-center justify-between gap-2">
							<span class="font-semibold tracking-tight" style="color: var(--ui-base-content);">{parsed.title}</span>
							{#if parsed.shortcut}
								<kbd class="ui-font-mono shrink-0 border px-1 py-0.25 text-[0.65rem] font-semibold" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-200); color: var(--ui-accent-vivid, var(--ui-accent));">{parsed.shortcut}</kbd>
							{/if}
						</div>
					{/if}
					{#each parsed.paragraphs as lines, pIdx (pIdx)}
						<p class="m-0 font-medium" style="color: {parsed.title ? 'var(--ui-muted-content)' : 'var(--ui-base-content)'};">
							{#each lines as line, lIdx (lIdx)}
								{#if lIdx > 0}<br />{/if}{line}
							{/each}
							{#if !parsed.title && parsed.shortcut && pIdx === parsed.paragraphs.length - 1}
								<kbd class="ui-font-mono ml-1.5 inline-block border px-1 py-0.25 text-[0.65rem] font-semibold" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-200); color: var(--ui-accent-vivid, var(--ui-accent));">{parsed.shortcut}</kbd>
							{/if}
						</p>
					{/each}
				</div>
			</UiChamferFrame>
		</div>
	</div>
{/if}

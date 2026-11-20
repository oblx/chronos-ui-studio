<script lang="ts">
	import type { Snippet } from 'svelte';
	import { UiChamferButton } from '../atoms';
	import { createCarouselMachine, uiSwipeDeck } from '../machines';
	import type { CornerKind } from '../tokens';

	interface Props {
		cornerMode?: CornerKind;
		label?: string;
		className?: string;
		children?: Snippet;
	}

	let {
		cornerMode = 'CHAMFER',
		label = 'Horizontal carousel',
		className = '',
		children
	}: Props = $props();

	const carousel = createCarouselMachine();
	let deckEl = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (!deckEl) return;
		return carousel.bindScroller(deckEl);
	});

	let needsScroll = $derived(carousel.canPrev || carousel.canNext);

	function onKeydown(e: KeyboardEvent): void {
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			carousel.stepPrev();
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			carousel.stepNext();
		}
	}
</script>

<div class="flex flex-col gap-1 {className}" data-testid="ui-horizontal-deck">
	<div role="toolbar" aria-label={label} tabindex="0" onkeydown={onKeydown} class="flex items-center gap-2">
		{#if needsScroll}
			<UiChamferButton {cornerMode} icon="chevron-left" tip="Previous items" disabled={!carousel.canPrev} onclick={carousel.stepPrev}
				className="min-h-[2.75rem] min-w-[2.75rem] px-2 md:min-h-0 md:min-w-0" />
		{/if}
		<div bind:this={deckEl} use:uiSwipeDeck={{ onStep: (d) => (d < 0 ? carousel.stepPrev() : carousel.stepNext()) }}
			data-testid="ui-swipe-track"
			class="ui-scroll-deck flex flex-1 touch-pan-y snap-x snap-mandatory items-stretch gap-3 overflow-x-auto overflow-y-hidden pb-1">
			{@render children?.()}
		</div>
		{#if needsScroll}
			<UiChamferButton {cornerMode} icon="chevron-right" tip="Next items" disabled={!carousel.canNext} onclick={carousel.stepNext}
				className="min-h-[2.75rem] min-w-[2.75rem] px-2 md:min-h-0 md:min-w-0" />
		{/if}
	</div>
	{#if needsScroll}
		<div class="flex items-center justify-center gap-1.5" aria-hidden="true" data-testid="ui-deck-dots">
			<span class="h-1.5 w-3 transition-colors" style={`background-color: ${carousel.canPrev ? 'var(--ui-border-subtle)' : 'var(--ui-accent-vivid, var(--ui-primary))'};`}></span>
			<span class="h-1.5 w-3 transition-colors" style={`background-color: ${carousel.canPrev && carousel.canNext ? 'var(--ui-accent-vivid, var(--ui-primary))' : 'var(--ui-border-subtle)'};`}></span>
			<span class="h-1.5 w-3 transition-colors" style={`background-color: ${carousel.canNext ? 'var(--ui-border-subtle)' : 'var(--ui-accent-vivid, var(--ui-primary))'};`}></span>
		</div>
	{/if}
</div>

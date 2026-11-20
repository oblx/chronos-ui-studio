<script lang="ts">
	import type { Snippet } from 'svelte';
	import { UiChamferFrame } from '../atoms';
	import { uiDragPan } from '../machines';
	import type { CornerKind } from '../tokens';

	interface Props {
		panX: number;
		panY: number;
		zoom: number;
		cornerMode?: CornerKind;
		showGrid?: boolean;
		showReticle?: boolean;
		onPanDelta: (dx: number, dy: number) => void;
		onZoomDelta: (delta: number) => void;
		children?: Snippet;
	}

	let {
		panX,
		panY,
		zoom,
		cornerMode = 'CHAMFER',
		showGrid = true,
		showReticle = true,
		onPanDelta,
		onZoomDelta,
		children
	}: Props = $props();
</script>

<main
	aria-label="Primary interactive canvas stage"
	data-testid="world-canvas-stage"
	data-ui-pan-stage="true"
	use:uiDragPan={{ onPanDelta, onZoomDelta }}
	class="fixed inset-0 z-0 h-screen w-screen overflow-hidden select-none"
	style="background-color: var(--ui-base-100);"
>
	{#if showGrid || showReticle}
		<svg class="pointer-events-none absolute inset-0 h-full w-full opacity-45" aria-hidden="true">
			{#if showGrid}
				<defs>
					<pattern id="ui-stage-grid" width="48" height="48" patternUnits="userSpaceOnUse">
						<path d="M 48 0 L 0 0 0 48" fill="none" stroke="var(--ui-border-subtle)" stroke-width="0.6" opacity="0.45" />
						<path d="M -3 0 H 3 M 0 -3 V 3" fill="none" stroke="var(--ui-primary)" stroke-width="0.8" opacity="0.55" />
					</pattern>
				</defs>
				<rect width="100%" height="100%" fill="url(#ui-stage-grid)" />
			{/if}
			{#if showReticle}
				<circle cx="50%" cy="50%" r="240" fill="none" stroke="var(--ui-primary)" stroke-width="0.8" stroke-dasharray="3 6" opacity="0.32" />
				<circle cx="50%" cy="50%" r="380" fill="none" stroke="var(--ui-border-subtle)" stroke-width="0.8" opacity="0.38" />
			{/if}
		</svg>
	{/if}

	<div class="pointer-events-none fixed inset-x-16 bottom-[9.25rem] top-[7.5rem] z-10 hidden md:block">
		<UiChamferFrame {cornerMode} carets={true} surfaceVar="transparent" strokeVar="var(--ui-border-subtle)" caretVar="var(--ui-primary)" className="h-full w-full" />
	</div>

	<div
		class="ui-scroll-deck absolute inset-0 flex items-start justify-center overflow-y-auto px-2 pt-24 pb-24 sm:px-6 sm:pt-16 md:pb-24"
		style="transform: translate3d({panX}px, {panY}px, 0) scale({zoom}); transform-origin: center center;"
	>
		{@render children?.()}
	</div>
</main>

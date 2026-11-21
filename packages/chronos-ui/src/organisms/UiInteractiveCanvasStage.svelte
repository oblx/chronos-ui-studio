<script lang="ts">
	import type { Snippet } from 'svelte';
	import { UiChamferFrame } from '../atoms';
	import { createStagePanZoomCoalescer, uiDragPan, type StageGestureCommit } from '../machines';
	import type { CornerKind } from '../tokens';

	interface Props {
		panX: number;
		panY: number;
		zoom: number;
		cornerMode?: CornerKind;
		showGrid?: boolean;
		showReticle?: boolean;
		onPanDelta?: (dx: number, dy: number) => void;
		onZoomDelta?: (delta: number) => void;
		onGestureCommit?: (commit: StageGestureCommit) => void;
		children?: Snippet;
	}

	let {
		panX, panY, zoom, cornerMode = 'CHAMFER', showGrid = true, showReticle = true,
		onPanDelta, onZoomDelta, onGestureCommit, children
	}: Props = $props();

	let livePanX = $state(0);
	let livePanY = $state(0);
	let liveZoom = $state(1);

	const coalescer = createStagePanZoomCoalescer(
		{ panX: 0, panY: 0, zoom: 1 },
		(cam) => { livePanX = cam.panX; livePanY = cam.panY; liveZoom = cam.zoom; },
		(commit) => {
			if (onGestureCommit) onGestureCommit(commit);
			else { onPanDelta?.(commit.panX - panX, commit.panY - panY); onZoomDelta?.(commit.zoom - zoom); }
		}
	);

	$effect(() => {
		livePanX = panX; livePanY = panY; liveZoom = zoom;
		coalescer.sync({ panX, panY, zoom });
	});
	$effect(() => () => coalescer.destroy());

	let corridorStyle = $derived(
		'top: var(--ui-safe-top, 4.5rem); bottom: var(--ui-safe-bottom, 5.25rem); left: var(--ui-safe-left, var(--ui-safe-side, 4.5rem)); right: var(--ui-safe-right, var(--ui-safe-side, 4.5rem));'
	);
</script>

<main
	aria-label="Primary interactive canvas stage"
	data-testid="world-canvas-stage"
	data-ui-cursor="default"
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

	<div
		data-testid="world-canvas-border"
		class="pointer-events-none fixed z-[9] hidden md:block"
		style={corridorStyle}
	>
		<UiChamferFrame {cornerMode} carets={true} surfaceVar="transparent" strokeVar="var(--ui-border-subtle)" caretVar="var(--ui-primary)" outerClass="h-full w-full" className="h-full w-full" />
	</div>

	<div
		data-testid="safe-corridor-stage"
		data-ui-stage-viewport="true"
		data-ui-cursor="grab"
		data-camera-x={Math.round(livePanX)}
		data-camera-y={Math.round(livePanY)}
		data-camera-zoom={liveZoom.toFixed(2)}
		use:uiDragPan={{
			onPanDelta: (dx, dy) => { coalescer.tickPan(dx, dy); },
			onZoomDelta: (dz) => { coalescer.tickZoom(dz); },
			onPanEnd: () => { coalescer.flush(); }
		}}
		class="ui-scroll-deck fixed z-[10] flex cursor-grab items-center justify-center overflow-y-auto overflow-x-hidden px-4 py-4"
		style="{corridorStyle} contain: layout style;"
	>
		<div
			data-testid="stage-camera-plane"
			class="m-auto flex w-full max-w-6xl items-center justify-center"
			style="transform: translate3d({livePanX}px, {livePanY}px, 0) scale({liveZoom}); transform-origin: center center;"
		>
			{@render children?.()}
		</div>
	</div>
</main>

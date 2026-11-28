<script lang="ts">
	import { untrack } from 'svelte';
	import { getActiveCornerMorph, subscribeMotionState } from '../motion';
	import {
		buildMorphableCornerPath, clampControlCutPx, DEFAULT_CHAMFER_TUPLE, resolveCornerTuple,
		type CornerKind, type CornerTuple
	} from '../tokens';

	interface Props {
		corners?: CornerTuple;
		cornerMode?: CornerKind;
		cutPx?: number;
		maxCutRatio?: number;
		strokeVar?: string;
		strokeWidthVar?: string;
		strokeWidth?: number;
		progressRatio?: number;
		progressStrokeVar?: string;
	}

	let {
		corners = DEFAULT_CHAMFER_TUPLE,
		cornerMode = 'CHAMFER',
		cutPx = 8,
		maxCutRatio,
		strokeVar = 'var(--ui-border-subtle)',
		strokeWidthVar = 'var(--ui-stroke-w, var(--ui-hairline))',
		strokeWidth,
		progressRatio = 0,
		progressStrokeVar = 'var(--ui-accent)'
	}: Props = $props();

	let svgEl = $state<SVGSVGElement | null>(null);
	let boxW = $state(96);
	let boxH = $state(28);
	let cornerMorph = $state(getActiveCornerMorph());

	$effect(() => subscribeMotionState(() => { cornerMorph = getActiveCornerMorph(); }));

	$effect(() => {
		const host = svgEl?.parentElement;
		if (!host) return;
		let raf = 0;
		const measure = (w: number, h: number) => {
			const nextW = Math.max(16, Math.round(w));
			const nextH = Math.max(16, Math.round(h));
			untrack(() => {
				if (Math.abs(nextW - boxW) > 0.5) boxW = nextW;
				if (Math.abs(nextH - boxH) > 0.5) boxH = nextH;
			});
		};
		const initRect = host.getBoundingClientRect();
		if (initRect.width > 0 && initRect.height > 0) measure(initRect.width, initRect.height);
		const ro = new ResizeObserver((entries) => {
			const rect = entries[0]?.borderBoxSize?.[0]
				? { width: entries[0].borderBoxSize[0].inlineSize, height: entries[0].borderBoxSize[0].blockSize }
				: entries[0]?.contentRect;
			if (!rect) return;
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => measure(rect.width, rect.height));
		});
		ro.observe(host);
		return () => { ro.disconnect(); cancelAnimationFrame(raf); };
	});

	let tuple = $derived(resolveCornerTuple(corners, cornerMode));
	let effectiveCut = $derived(
		cornerMode === 'STRAIGHT'
			? 0
			: maxCutRatio !== undefined
				? clampControlCutPx(cutPx, boxH, maxCutRatio)
				: cutPx
	);
	let strokePath = $derived(buildMorphableCornerPath(boxW, boxH, effectiveCut, tuple, 0.75));
	let haloPath = $derived(buildMorphableCornerPath(boxW, boxH, effectiveCut, tuple, 0.2));
	let morphCls = $derived(cornerMorph ? 'ui-morph-path' : '');
	let perimeter = $derived((boxW + boxH) * 2);
	let dashOffset = $derived(perimeter * (1 - Math.max(0, Math.min(1, progressRatio))));
	let resolvedWidth = $derived(strokeWidth ? `${strokeWidth}px` : strokeWidthVar);
</script>

<svg
	bind:this={svgEl}
	data-ui-vector-border="true"
	data-effective-cut-px={effectiveCut.toFixed(2)}
	class="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
	viewBox="0 0 {boxW} {boxH}"
	preserveAspectRatio="none"
	aria-hidden="true"
>
	<path
		d={haloPath}
		data-ui-focus-halo="true"
		fill="none"
		stroke="var(--ui-accent-vivid, var(--ui-accent))"
		vector-effect="non-scaling-stroke"
		class="ui-vector-focus-halo {morphCls}"
	/>
	<path
		d={strokePath}
		data-ui-contour-path="true"
		fill="none"
		stroke={strokeVar}
		vector-effect="non-scaling-stroke"
		class="ui-vector-contour {morphCls}"
		style="--ui-contour-stroke: {strokeVar}; --ui-contour-width: {resolvedWidth};"
	/>
	{#if progressRatio > 0}
		<path d={strokePath} fill="none" stroke={progressStrokeVar} vector-effect="non-scaling-stroke" stroke-width="2" stroke-dasharray={perimeter} stroke-dashoffset={dashOffset} />
	{/if}
</svg>

<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { getActiveCornerMorph, getActiveCornerRadiusRem, getActiveMotionConfig, subscribeMotionState } from '../motion';
	import {
		buildClipPathPolygon, buildContourEmbellishments, buildCornerCarets, buildCurvedCornerEmbellishment,
		buildShapeGeometry, clampCornerRadiusRem, DEFAULT_CHAMFER_TUPLE, DEFAULT_EMBELLISHMENT_CONFIG,
		remToPx, resolveCornerTuple, type CornerAnimation, type CornerEmbellishment, type CornerKind,
		type CornerTuple, type EmbellishmentConfig, type UiFrameShape
	} from '../tokens';

	interface Props {
		corners?: CornerTuple; cornerMode?: CornerKind; cornerRadiusRem?: number; shape?: UiFrameShape;
		cornerEmbellishment?: CornerEmbellishment; cornerAnimation?: CornerAnimation;
		embellishmentConfig?: EmbellishmentConfig; cutPx?: number; cutRem?: number;
		carets?: boolean; bezel?: boolean; surfaceVar?: string; strokeVar?: string; caretVar?: string;
		outerClass?: string; className?: string; children?: Snippet;
	}

	let {
		corners = DEFAULT_CHAMFER_TUPLE, cornerMode = 'CHAMFER', cornerRadiusRem, shape = 'BOX',
		cornerEmbellishment, cornerAnimation = 'NONE', embellishmentConfig = DEFAULT_EMBELLISHMENT_CONFIG,
		cutPx, cutRem, carets = true, bezel = false,
		surfaceVar = 'var(--ui-base-200)', strokeVar = 'var(--ui-border-subtle)',
		caretVar = 'var(--ui-accent-vivid, var(--ui-primary))',
		outerClass = 'h-full w-full', className = '', children
	}: Props = $props();

	let hostEl = $state<HTMLDivElement | null>(null);
	let boxW = $state(240);
	let boxH = $state(100);
	let globalRadiusRem = $state(getActiveCornerRadiusRem());
	let globalMorph = $state(getActiveCornerMorph());
	let motionPreset = $state(getActiveMotionConfig().preset);

	$effect(() => subscribeMotionState(() => {
		globalRadiusRem = getActiveCornerRadiusRem();
		globalMorph = getActiveCornerMorph();
		motionPreset = getActiveMotionConfig().preset;
	}));

	$effect(() => {
		const el = hostEl;
		if (!el) return;
		let raf = 0;
		const ro = new ResizeObserver((entries) => {
			const rect = entries[0]?.contentRect;
			if (!rect) return;
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => {
				const nextW = Math.max(24, Math.round(rect.width));
				const nextH = Math.max(24, Math.round(rect.height));
				untrack(() => {
					if (Math.abs(nextW - boxW) > 0.5) boxW = nextW;
					if (Math.abs(nextH - boxH) > 0.5) boxH = nextH;
				});
			});
		});
		ro.observe(el);
		return () => { ro.disconnect(); cancelAnimationFrame(raf); };
	});

	let activeTuple = $derived(resolveCornerTuple(corners, cornerMode));
	let hasRoundCorner = $derived(activeTuple.includes('ROUND'));
	let resolvedRem = $derived(cornerMode === 'STRAIGHT' ? 0 : (cornerRadiusRem !== undefined ? clampCornerRadiusRem(cornerRadiusRem) : (cutRem ?? globalRadiusRem)));
	let resolvedCutPx = $derived(cornerMode === 'STRAIGHT' ? 0 : (cornerRadiusRem !== undefined ? remToPx(resolvedRem) : (cutPx ?? remToPx(resolvedRem))));
	let isBox = $derived(shape === 'BOX');
	let clipStyle = $derived(isBox ? buildClipPathPolygon(resolvedRem, activeTuple) : 'none');
	let geom = $derived(buildShapeGeometry(shape, boxW, boxH, resolvedCutPx, activeTuple));
	let effectiveEmb = $derived<CornerEmbellishment>(cornerEmbellishment ?? (carets ? 'CARET' : 'NONE'));
	let useClassicBoxCarets = $derived(isBox && !hasRoundCorner && effectiveEmb === 'CARET' && cornerAnimation !== 'DIAGONAL_DRIFT');
	let caretSegs = $derived(useClassicBoxCarets ? buildCornerCarets(boxW, boxH, resolvedCutPx, activeTuple) : []);
	let contourEmbs = $derived.by(() => {
		if (useClassicBoxCarets || effectiveEmb === 'NONE') return [];
		if (isBox && hasRoundCorner) return buildCurvedCornerEmbellishment(effectiveEmb, boxW, boxH, resolvedCutPx, activeTuple, 1.5);
		return buildContourEmbellishments(effectiveEmb, geom.anchorVertices, resolvedCutPx, 1);
	});
	let animClass = $derived.by(() => {
		if (cornerAnimation === 'NONE' || motionPreset === 'NONE') return '';
		if (cornerAnimation === 'BREATHE') return 'ui-corner-breathe';
		if (cornerAnimation === 'SCAN_GLINT') return 'ui-corner-glint';
		if (cornerAnimation === 'DIAGONAL_DRIFT') return 'ui-corner-drift';
		return 'ui-corner-reticle';
	});
	let morphCls = $derived(globalMorph ? 'ui-morph-path' : '');
	let embVars = $derived(`--ui-emb-offset: ${embellishmentConfig.offsetRem}rem; --ui-emb-amp: ${embellishmentConfig.amplitudeRem}rem; --ui-emb-period: ${embellishmentConfig.periodMs}ms;`);
	let padStyle = $derived(isBox ? '' : `padding: ${geom.safePaddingRem[0]}rem ${geom.safePaddingRem[1]}rem ${geom.safePaddingRem[2]}rem ${geom.safePaddingRem[3]}rem;`);
</script>

<div bind:this={hostEl} data-frame-shape={shape} data-corner-mode={cornerMode} data-corner-radius-rem={resolvedRem} data-corner-embellishment={effectiveEmb} data-corner-animation={cornerAnimation} class="relative {outerClass}">
	{#if !isBox}
		<svg class="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible" viewBox="0 0 {boxW} {boxH}" preserveAspectRatio="none" aria-hidden="true">
			<path d={geom.outerPath} fill={surfaceVar} class={morphCls} />
		</svg>
	{/if}
	<div class="relative z-10 h-full w-full overflow-hidden {className}" style="clip-path: {clipStyle}; background-color: {isBox ? surfaceVar : 'transparent'}; {padStyle}">
		{@render children?.()}
	</div>
	<svg class="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible" viewBox="0 0 {boxW} {boxH}" preserveAspectRatio="none" aria-hidden="true">
		<path d={geom.outerPath} fill="none" stroke={strokeVar} vector-effect="non-scaling-stroke" class={morphCls} style="stroke-width: var(--ui-hairline);" />
		{#if bezel}<path d={geom.innerBezelPath} fill="none" stroke={strokeVar} opacity="0.45" vector-effect="non-scaling-stroke" class={morphCls} style="stroke-width: var(--ui-hairline);" />{/if}
		{#if geom.ornamentPath}<path d={geom.ornamentPath} fill="none" stroke={strokeVar} vector-effect="non-scaling-stroke" style="stroke-width: var(--ui-hairline);" />{/if}
		{#if caretSegs.length > 0}
			<g class="ui-corner-emb {animClass}" style={embVars}>
				{#each caretSegs as seg, i (i)}<polyline points={seg.points} fill="none" stroke={caretVar} vector-effect="non-scaling-stroke" style="stroke-width: var(--ui-caret-stroke);" />{/each}
			</g>
		{/if}
		{#each contourEmbs as item, i (`emb-${i}`)}
			<path data-ui-embellishment="true" d={item.d} fill="none" stroke={caretVar} vector-effect="non-scaling-stroke" class="ui-corner-emb {animClass}" style="--ui-nx: {item.nx}; --ui-ny: {item.ny}; {embVars} stroke-width: var(--ui-caret-stroke);" />
		{/each}
	</svg>
</div>

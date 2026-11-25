<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import {
		getActiveCornerMorph, getActiveMotionConfig, getActiveStudioDefaults, subscribeMotionState
	} from '../motion';
	import {
		buildClipPathPolygon, buildContourEmbellishments, buildCornerCarets, buildCurvedCornerEmbellishment,
		buildShapeGeometry, clampCornerRadiusRem, DEFAULT_CHAMFER_TUPLE, remToPx, resolveCornerTuple,
		type CornerAnimation, type CornerEmbellishment, type CornerKind, type CornerTuple,
		type EmbellishmentConfig, type UiFrameShape
	} from '../tokens';

	interface Props {
		corners?: CornerTuple; cornerMode?: CornerKind; cornerRadiusRem?: number;
		cutTier?: 'base' | 'station'; shape?: UiFrameShape;
		cornerEmbellishment?: CornerEmbellishment; cornerAnimation?: CornerAnimation;
		embellishmentConfig?: EmbellishmentConfig; cutPx?: number; cutRem?: number;
		carets?: boolean; bezel?: boolean; surfaceVar?: string; strokeVar?: string; caretVar?: string;
		outerClass?: string; className?: string; children?: Snippet;
	}

	let {
		corners = DEFAULT_CHAMFER_TUPLE, cornerMode = 'CHAMFER', cornerRadiusRem,
		cutTier = 'base', shape = 'BOX', cornerEmbellishment, cornerAnimation = 'NONE',
		embellishmentConfig, cutPx, cutRem, carets = true, bezel = false,
		surfaceVar = 'var(--ui-base-200)', strokeVar = 'var(--ui-border-subtle)',
		caretVar = 'var(--ui-accent-vivid, var(--ui-primary))',
		outerClass = 'h-full w-full', className = '', children
	}: Props = $props();

	let hostEl = $state<HTMLDivElement | null>(null);
	let boxW = $state(240);
	let boxH = $state(100);
	let studioDefaults = $state(getActiveStudioDefaults());
	let globalMorph = $state(getActiveCornerMorph());
	let motionPreset = $state(getActiveMotionConfig().preset);

	$effect(() => subscribeMotionState(() => {
		studioDefaults = getActiveStudioDefaults();
		globalMorph = getActiveCornerMorph();
		motionPreset = getActiveMotionConfig().preset;
	}));

	$effect(() => {
		const el = hostEl;
		if (!el) return;
		let raf = 0;
		const applySize = (w: number, h: number) => {
			const nextW = Math.max(24, Math.round(w));
			const nextH = Math.max(24, Math.round(h));
			untrack(() => {
				if (Math.abs(nextW - boxW) > 0.5) boxW = nextW;
				if (Math.abs(nextH - boxH) > 0.5) boxH = nextH;
			});
		};
		const init = el.getBoundingClientRect();
		if (init.width > 0 && init.height > 0) applySize(init.width, init.height);
		const ro = new ResizeObserver((entries) => {
			const rect = entries[0]?.contentRect;
			if (!rect) return;
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => applySize(rect.width, rect.height));
		});
		ro.observe(el);
		return () => { ro.disconnect(); cancelAnimationFrame(raf); };
	});

	let activeTuple = $derived(resolveCornerTuple(corners, cornerMode));
	let hasRoundCorner = $derived(activeTuple.includes('ROUND'));
	let tierRem = $derived(cutTier === 'station' ? studioDefaults.stationCornerCutRem : studioDefaults.baseCornerCutRem);
	let resolvedRem = $derived(cornerMode === 'STRAIGHT' ? 0 : (cornerRadiusRem !== undefined ? clampCornerRadiusRem(cornerRadiusRem) : (cutRem ?? tierRem)));
	let resolvedCutPx = $derived(cornerMode === 'STRAIGHT' ? 0 : (cornerRadiusRem !== undefined ? remToPx(resolvedRem) : (cutPx ?? remToPx(resolvedRem))));
	let isBox = $derived(shape === 'BOX');
	let clipStyle = $derived(isBox ? buildClipPathPolygon(resolvedRem, activeTuple) : 'none');
	let geom = $derived(buildShapeGeometry(shape, boxW, boxH, resolvedCutPx, activeTuple));
	let effectiveEmb = $derived<CornerEmbellishment>(cornerEmbellishment ?? (carets ? 'CARET' : 'NONE'));
	let embCfg = $derived<EmbellishmentConfig>(embellishmentConfig ?? {
		offsetRem: studioDefaults.ornamentOffsetRem,
		amplitudeRem: studioDefaults.ornamentDriftAmpRem,
		periodMs: studioDefaults.ornamentPeriodMs
	});
	let embOffsetPx = $derived(Math.max(1, remToPx(embCfg.offsetRem)));
	let useClassicBoxCarets = $derived(isBox && !hasRoundCorner && effectiveEmb === 'CARET' && cornerAnimation === 'NONE');
	let caretSegs = $derived(useClassicBoxCarets ? buildCornerCarets(boxW, boxH, resolvedCutPx, activeTuple) : []);
	let contourEmbs = $derived.by(() => {
		if (useClassicBoxCarets || effectiveEmb === 'NONE') return [];
		if (isBox && hasRoundCorner) return buildCurvedCornerEmbellishment(effectiveEmb, boxW, boxH, resolvedCutPx, activeTuple, embOffsetPx);
		return buildContourEmbellishments(effectiveEmb, geom.anchorVertices, resolvedCutPx, embOffsetPx);
	});
	let hasPerimeterTrace = $derived(motionPreset !== 'NONE' && (cornerAnimation === 'SCAN_GLINT' || cornerAnimation === 'ORBIT_TRACE'));
	let traceClass = $derived(cornerAnimation === 'ORBIT_TRACE' ? 'ui-orbit-trace' : 'ui-corner-glint');
	let animClass = $derived.by(() => {
		if (cornerAnimation === 'NONE' || motionPreset === 'NONE') return '';
		if (cornerAnimation === 'BREATHE') return 'ui-corner-breathe';
		if (cornerAnimation === 'DIAGONAL_DRIFT') return 'ui-corner-drift';
		if (cornerAnimation === 'RETICLE_LOCK') return 'ui-corner-reticle';
		return '';
	});
	let morphCls = $derived(globalMorph ? 'ui-morph-path' : '');
	let embVars = $derived(`--ui-orn-offset: ${embCfg.offsetRem}rem; --ui-orn-amp: ${embCfg.amplitudeRem}rem; --ui-orn-period: ${embCfg.periodMs}ms; --ui-emb-offset: ${embCfg.offsetRem}rem; --ui-emb-amp: ${embCfg.amplitudeRem}rem; --ui-emb-period: ${embCfg.periodMs}ms;`);
	let padStyle = $derived(isBox ? '' : `padding: ${geom.safePaddingRem[0]}rem ${geom.safePaddingRem[1]}rem ${geom.safePaddingRem[2]}rem ${geom.safePaddingRem[3]}rem;`);
</script>

<div bind:this={hostEl} data-frame-shape={shape} data-corner-mode={cornerMode} data-cut-tier={cutTier} data-corner-radius-rem={resolvedRem} data-corner-embellishment={effectiveEmb} data-corner-animation={cornerAnimation} class="relative {outerClass}">
	{#if !isBox}
		<svg class="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible" viewBox="0 0 {boxW} {boxH}" preserveAspectRatio="none" aria-hidden="true">
			<path d={geom.outerPath} fill={surfaceVar} class={morphCls} />
		</svg>
	{/if}
	<div class="relative z-10 h-full w-full overflow-hidden {className}" style="clip-path: {clipStyle}; background-color: {isBox ? surfaceVar : 'transparent'}; {padStyle}">
		{@render children?.()}
	</div>
	<svg class="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible" viewBox="0 0 {boxW} {boxH}" preserveAspectRatio="none" aria-hidden="true">
		<path d={geom.outerPath} fill="none" stroke={strokeVar} vector-effect="non-scaling-stroke" class={morphCls} style="stroke-width: var(--ui-stroke-w, var(--ui-hairline));" />
		{#if bezel}<path d={geom.innerBezelPath} fill="none" stroke={strokeVar} opacity="0.45" vector-effect="non-scaling-stroke" class={morphCls} style="stroke-width: var(--ui-hairline);" />{/if}
		{#if geom.ornamentPath}<path d={geom.ornamentPath} fill="none" stroke={strokeVar} vector-effect="non-scaling-stroke" style="stroke-width: var(--ui-hairline);" />{/if}
		{#if hasPerimeterTrace}
			<path data-ui-perimeter-trace="true" d={geom.outerPath} pathLength="100" fill="none" stroke={caretVar} stroke-linecap="round" vector-effect="non-scaling-stroke" class="ui-corner-emb {traceClass}" style="{embVars} stroke-width: var(--ui-caret-stroke);" />
		{/if}
		{#if caretSegs.length > 0}
			<g class="ui-corner-emb {animClass}" style={embVars}>
				{#each caretSegs as seg, i (i)}<polyline points={seg.points} fill="none" stroke={caretVar} vector-effect="non-scaling-stroke" style="stroke-width: var(--ui-caret-stroke);" />{/each}
			</g>
		{/if}
		{#each contourEmbs as item, i (`emb-${i}`)}
			<path data-ui-embellishment="true" d={item.d} fill="none" stroke={caretVar} vector-effect="non-scaling-stroke" class="ui-corner-emb {animClass}" style="--nx: {item.nx}; --ny: {item.ny}; --ui-nx: {item.nx}; --ui-ny: {item.ny}; {embVars} stroke-width: var(--ui-caret-stroke);" />
		{/each}
	</svg>
</div>

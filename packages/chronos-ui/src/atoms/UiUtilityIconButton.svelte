<script lang="ts">
	import { getActiveStudioDefaults, subscribeMotionState } from '../motion';
	import {
		buildClipPathPolygon, clampControlCutRem, CONTROL_MAX_CUT_RATIO, DEFAULT_CHAMFER_TUPLE, remToPx,
		resolveCornerTuple, type CornerKind, type CornerTuple, type UiIconName
	} from '../tokens';
	import UiIcon from './UiIcon.svelte';
	import UiVectorBorder from './UiVectorBorder.svelte';

	interface Props {
		icon: UiIconName;
		label: string;
		tip?: string;
		testId?: string;
		active?: boolean;
		glitterBurst?: number;
		corners?: CornerTuple;
		cornerMode?: CornerKind;
		onclick?: (e: MouseEvent) => void;
		className?: string;
	}

	let {
		icon,
		label,
		tip,
		testId,
		active = false,
		glitterBurst = 0,
		corners = DEFAULT_CHAMFER_TUPLE,
		cornerMode = 'CHAMFER',
		onclick,
		className = ''
	}: Props = $props();

	let showGlitter = $state(false);
	let lastBurst = 0;
	let controlCutRem = $state(getActiveStudioDefaults().controlCornerCutRem);

	$effect(() => subscribeMotionState(() => { controlCutRem = getActiveStudioDefaults().controlCornerCutRem; }));

	$effect(() => {
		if (glitterBurst > lastBurst) {
			lastBurst = glitterBurst;
			showGlitter = true;
			const timer = setTimeout(() => {
				showGlitter = false;
			}, 2400);
			return () => clearTimeout(timer);
		}
	});

	let tuple = $derived(resolveCornerTuple(corners, cornerMode));
	let cutRem = $derived(cornerMode === 'STRAIGHT' ? 0 : clampControlCutRem(controlCutRem));
	let cutPx = $derived(remToPx(cutRem));
	let surfaceStyle = $derived(
		cornerMode === 'ROUND'
			? `border-radius: ${cutRem}rem;`
			: `clip-path: ${buildClipPathPolygon(cutRem, tuple)};`
	);
	let strokeVar = $derived(active ? 'var(--ui-accent)' : 'var(--ui-border-subtle)');
</script>

<button
	type="button"
	aria-label={label}
	aria-pressed={active}
	data-testid={testId}
	data-corner-mode={cornerMode}
	data-corner-cut-rem={cutRem}
	data-ui-tip={tip ?? label}
	data-ui-interactive="true"
	data-ui-cursor="pointer"
	{onclick}
	class="group relative inline-flex h-8 w-8 shrink-0 items-center justify-center transition-all duration-150 {className}"
	style="color: {active ? 'var(--ui-accent)' : 'var(--ui-muted-content)'}; opacity: {active ? '1' : '0.82'}; background: transparent; border: none;"
>
	<span
		aria-hidden="true"
		class="pointer-events-none absolute inset-0 z-0"
		style="{surfaceStyle} background-color: {active ? 'var(--ui-base-300)' : 'transparent'};"
	></span>
	<UiVectorBorder {corners} {cornerMode} {cutPx} maxCutRatio={CONTROL_MAX_CUT_RATIO} {strokeVar} />
	<span class="relative z-10 transition-transform duration-150 group-hover:scale-105 group-hover:opacity-100" style="color: inherit;">
		<UiIcon name={icon} sizeRem={1} />
	</span>
	{#if showGlitter}
		<span class="pointer-events-none absolute -inset-1 overflow-visible" aria-hidden="true">
			{#each [0, 60, 120, 180, 240, 300] as angle (angle)}
				<span
					class="ui-glitter-spark absolute left-1/2 top-1/2 h-1.5 w-1.5"
					style="background-color: var(--ui-accent); transform: rotate({angle}deg) translateY(-0.95rem);"
				></span>
			{/each}
		</span>
	{/if}
</button>

<script lang="ts">
	import { createControlCornerRef } from '@ui/motion';
	import {
		clampControlCutRem, CONTROL_MAX_CUT_RATIO, DEFAULT_CHAMFER_TUPLE, HUD_METRICS, resolveControlSurface,
		type CornerKind, type CornerTuple, type UiIconName
	} from '@ui/tokens';
	import UiIcon from '../UiIcon.svelte';
	import UiVectorBorder from '../UiVectorBorder.svelte';

	interface Props {
		icon: UiIconName;
		label: string;
		tip?: string;
		tipLevel?: number;
		testId?: string;
		active?: boolean;
		disabled?: boolean;
		glitterBurst?: number;
		corners?: CornerTuple;
		cornerMode?: CornerKind;
		onclick?: (e: MouseEvent) => void;
		className?: string;
	}

	let {
		icon, label, tip, tipLevel, testId, active = false, disabled = false, glitterBurst = 0,
		corners = DEFAULT_CHAMFER_TUPLE, cornerMode = 'CHAMFER', onclick, className = ''
	}: Props = $props();

	let showGlitter = $state(false);
	let lastBurst = 0;
	const cornerRef = createControlCornerRef();

	$effect(() => {
		if (glitterBurst > lastBurst) {
			lastBurst = glitterBurst;
			showGlitter = true;
			const timer = setTimeout(() => { showGlitter = false; }, HUD_METRICS.glitterBurstMs);
			return () => clearTimeout(timer);
		}
	});

	let surface = $derived(resolveControlSurface(cornerMode, corners, clampControlCutRem(cornerRef.cutRem)));
	let strokeVar = $derived(active ? 'var(--ui-accent-vivid, var(--ui-accent))' : 'var(--ui-border-subtle)');
</script>

<button
	type="button"
	{disabled}
	aria-label={label}
	aria-pressed={active}
	aria-disabled={disabled ? 'true' : undefined}
	data-testid={testId}
	data-corner-mode={cornerMode}
	data-corner-cut-rem={surface.cutRem}
	data-ui-active={active ? 'true' : 'false'}
	data-ui-tip={tip ?? label}
	data-ui-tip-level={tipLevel}
	data-ui-interactive="true"
	data-ui-cursor={disabled ? 'not-allowed' : 'pointer'}
	{onclick}
	class="ui-ctl ui-dur-micro ui-detent group relative inline-flex h-8 w-8 shrink-0 items-center justify-center {className}"
	style="color: {active ? 'var(--ui-accent-vivid, var(--ui-accent))' : 'var(--ui-muted-content)'}; opacity: {active ? '1' : '0.88'}; background: transparent;"
>
	<span aria-hidden="true" class="pointer-events-none absolute inset-0 z-0" style="{surface.surfaceStyle} background-color: {active ? 'var(--ui-state-active-bg, var(--ui-base-300))' : 'transparent'};"></span>
	<UiVectorBorder {corners} {cornerMode} cutPx={surface.cutPx} maxCutRatio={CONTROL_MAX_CUT_RATIO} {strokeVar} />
	<span class="ui-dur-micro relative z-10 transition-transform group-hover:scale-105 group-hover:opacity-100" style="color: inherit;">
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

<script lang="ts">
	import { createControlCornerRef } from '@ui/motion';
	import {
		CONTROL_MAX_CUT_RATIO,
		DEFAULT_CHAMFER_TUPLE,
		resolveControlSurface,
		type CornerKind,
		type CornerTuple
	} from '@ui/tokens';
	import UiOverflowText from '../UiOverflowText.svelte';
	import UiVectorBorder from '../UiVectorBorder.svelte';

	interface Props {
		text: string;
		tone?: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
		corners?: CornerTuple;
		cornerMode?: CornerKind;
		ariaLabel?: string;
		className?: string;
	}

	let {
		text,
		tone = 'neutral',
		corners = DEFAULT_CHAMFER_TUPLE,
		cornerMode = 'CHAMFER',
		ariaLabel,
		className = ''
	}: Props = $props();

	const TONE_VARS: Record<NonNullable<Props['tone']>, { fg: string; stroke: string }> = {
		primary: { fg: 'var(--ui-primary)', stroke: 'var(--ui-primary)' },
		secondary: { fg: 'var(--ui-secondary)', stroke: 'var(--ui-secondary)' },
		success: { fg: 'var(--ui-success)', stroke: 'var(--ui-success)' },
		warning: { fg: 'var(--ui-warning)', stroke: 'var(--ui-warning)' },
		error: { fg: 'var(--ui-error)', stroke: 'var(--ui-error)' },
		info: { fg: 'var(--ui-info)', stroke: 'var(--ui-info)' },
		neutral: { fg: 'var(--ui-base-content)', stroke: 'var(--ui-border-subtle)' }
	};

	const cornerRef = createControlCornerRef();
	let palette = $derived(TONE_VARS[tone]);
	let surface = $derived(resolveControlSurface(cornerMode, corners, Math.min(0.25, cornerRef.cutRem)));
</script>

<span
	aria-label={ariaLabel}
	data-corner-mode={cornerMode}
	class="ui-font-mono ui-marquee-host relative inline-flex min-w-0 max-w-full shrink-0 items-center justify-center overflow-hidden whitespace-nowrap px-1.5 py-0.5 text-xs font-semibold leading-none {className}"
	style="color: {palette.fg};"
>
	<span
		aria-hidden="true"
		class="pointer-events-none absolute inset-0"
		style="background-color: var(--ui-base-300); {surface.surfaceStyle}"
	></span>
	<UiVectorBorder {corners} {cornerMode} cutPx={surface.cutPx} maxCutRatio={CONTROL_MAX_CUT_RATIO} strokeVar={palette.stroke} strokeWidth={1.15} />
	<span class="relative z-10 min-w-0 max-w-full overflow-hidden"><UiOverflowText {text} /></span>
</span>

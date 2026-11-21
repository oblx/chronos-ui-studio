<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getActiveStudioDefaults, subscribeMotionState } from '../motion';
	import {
		buildClipPathPolygon, clampControlCutRem, CONTROL_MAX_CUT_RATIO, DEFAULT_CHAMFER_TUPLE, remToPx,
		resolveCornerTuple, type CornerKind, type CornerTuple, type UiIconName
	} from '../tokens';
	import UiIcon from './UiIcon.svelte';
	import UiVectorBorder from './UiVectorBorder.svelte';

	interface Props {
		corners?: CornerTuple;
		cornerMode?: CornerKind;
		cornerRadiusRem?: number;
		variant?: 'primary' | 'secondary' | 'surface' | 'ghost' | 'danger';
		active?: boolean;
		disabled?: boolean;
		icon?: UiIconName;
		label?: string;
		tip?: string;
		type?: 'button' | 'submit' | 'reset';
		testId?: string;
		className?: string;
		onclick?: (e: MouseEvent) => void;
		children?: Snippet;
	}

	let {
		corners = DEFAULT_CHAMFER_TUPLE, cornerMode = 'CHAMFER', cornerRadiusRem,
		variant = 'surface', active = false, disabled = false, icon, label = '',
		tip, type = 'button', testId, className = '', onclick, children
	}: Props = $props();

	let controlCutRem = $state(getActiveStudioDefaults().controlCornerCutRem);
	$effect(() => subscribeMotionState(() => { controlCutRem = getActiveStudioDefaults().controlCornerCutRem; }));
	let tuple = $derived(resolveCornerTuple(corners, cornerMode));
	let cutRem = $derived(cornerMode === 'STRAIGHT' ? 0 : clampControlCutRem(cornerRadiusRem ?? controlCutRem));
	let cutPx = $derived(remToPx(cutRem));
	let clip = $derived(buildClipPathPolygon(cutRem, tuple));
	let surfaceStyle = $derived(
		cornerMode === 'ROUND'
			? `border-radius: ${cutRem}rem;`
			: `clip-path: ${clip};`
	);
	let tone = $derived.by(() => {
		if (variant === 'primary' || active) return { bg: 'var(--ui-primary)', fg: 'var(--ui-primary-content)', stroke: 'var(--ui-primary)' };
		if (variant === 'secondary') return { bg: 'var(--ui-secondary)', fg: 'var(--ui-secondary-content)', stroke: 'var(--ui-secondary)' };
		if (variant === 'danger') return { bg: 'var(--ui-error)', fg: 'var(--ui-primary-content)', stroke: 'var(--ui-error)' };
		if (variant === 'ghost') return { bg: 'transparent', fg: 'var(--ui-base-content)', stroke: 'var(--ui-border-subtle)' };
		return { bg: 'var(--ui-base-300)', fg: 'var(--ui-base-content)', stroke: 'var(--ui-border-subtle)' };
	});
</script>

<button
	{type}
	{disabled}
	{onclick}
	data-testid={testId}
	data-corner-mode={cornerMode}
	data-corner-cut-rem={cutRem}
	aria-label={label ? undefined : tip}
	data-ui-tip={tip}
	data-ui-interactive="true"
	data-ui-cursor={disabled ? 'not-allowed' : 'pointer'}
	aria-pressed={active}
	class="ui-dur-micro ui-detent relative inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap px-3 py-1 text-xs font-semibold tracking-wide transition-transform disabled:opacity-45 {className}"
	style="color: {tone.fg}; background: transparent; border: none;"
>
	<span class="pointer-events-none absolute inset-0 z-0" style="{surfaceStyle} background-color: {tone.bg};" aria-hidden="true"></span>
	<UiVectorBorder {corners} {cornerMode} {cutPx} maxCutRatio={CONTROL_MAX_CUT_RATIO} strokeVar={tone.stroke} />
	<span class="relative z-10 inline-flex items-center justify-center gap-1.5">
		{#if icon}<UiIcon name={icon} sizeRem={0.95} />{/if}
		{#if children}{@render children()}{:else if label}<span>{label}</span>{/if}
	</span>
</button>

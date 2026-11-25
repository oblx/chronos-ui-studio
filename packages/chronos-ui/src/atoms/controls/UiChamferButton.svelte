<script lang="ts">
	import type { Snippet } from 'svelte';
	import { createControlCornerRef } from '@ui/motion';
	import {
		clampControlCutRem, CONTROL_MAX_CUT_RATIO, DEFAULT_CHAMFER_TUPLE, resolveControlSurface,
		type CornerKind, type CornerTuple, type UiIconName
	} from '@ui/tokens';
	import UiIcon from '../UiIcon.svelte';
	import UiVectorBorder from '../UiVectorBorder.svelte';

	interface Props {
		corners?: CornerTuple;
		cornerMode?: CornerKind;
		cornerRadiusRem?: number;
		variant?: 'primary' | 'secondary' | 'surface' | 'ghost' | 'danger';
		active?: boolean;
		disabled?: boolean;
		icon?: UiIconName;
		iconPosition?: 'left' | 'right';
		label?: string;
		tip?: string;
		tipLevel?: number;
		type?: 'button' | 'submit' | 'reset';
		testId?: string;
		className?: string;
		onclick?: (e: MouseEvent) => void;
		children?: Snippet;
	}

	let {
		corners = DEFAULT_CHAMFER_TUPLE, cornerMode = 'CHAMFER', cornerRadiusRem,
		variant = 'surface', active = false, disabled = false, icon, iconPosition = 'left', label = '',
		tip, tipLevel, type = 'button', testId, className = '', onclick, children
	}: Props = $props();

	const cornerRef = createControlCornerRef();
	let surface = $derived(resolveControlSurface(cornerMode, corners, clampControlCutRem(cornerRadiusRem ?? cornerRef.cutRem)));
	let tone = $derived.by(() => {
		if (variant === 'primary' || active) return { bg: 'var(--ui-primary)', fg: 'var(--ui-primary-content)', stroke: active ? 'var(--ui-accent-vivid, var(--ui-primary))' : 'var(--ui-primary)' };
		if (variant === 'secondary') return { bg: 'var(--ui-secondary)', fg: 'var(--ui-secondary-content)', stroke: 'var(--ui-secondary)' };
		if (variant === 'danger') return { bg: 'var(--ui-error)', fg: 'var(--ui-primary-content)', stroke: 'var(--ui-error)' };
		if (variant === 'ghost') return { bg: 'transparent', fg: 'var(--ui-base-content)', stroke: 'var(--ui-border-subtle)' };
		return { bg: 'var(--ui-state-idle-bg, var(--ui-base-300))', fg: 'var(--ui-base-content)', stroke: 'var(--ui-border-subtle)' };
	});
</script>

<button
	{type}
	{disabled}
	{onclick}
	data-testid={testId}
	data-corner-mode={cornerMode}
	data-corner-cut-rem={surface.cutRem}
	data-ui-active={active ? 'true' : 'false'}
	data-ui-variant={variant}
	aria-label={label ? undefined : tip}
	aria-disabled={disabled ? 'true' : undefined}
	data-ui-tip={tip}
	data-ui-tip-level={tipLevel}
	data-ui-interactive="true"
	data-ui-cursor={disabled ? 'not-allowed' : 'pointer'}
	aria-pressed={active}
	class="ui-ctl ui-ctl-btn ui-dur-micro ui-detent relative inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap text-xs font-semibold tracking-wide {className}"
	style="color: {tone.fg}; background: transparent; border: none;"
>
	<span class="ui-ctl-bg pointer-events-none absolute inset-0 z-0" style="{surface.surfaceStyle} background-color: {tone.bg};" aria-hidden="true"></span>
	<UiVectorBorder {corners} {cornerMode} cutPx={surface.cutPx} maxCutRatio={CONTROL_MAX_CUT_RATIO} strokeVar={tone.stroke} />
	<span class="ui-ctl-inner relative z-10 inline-flex items-center justify-center gap-1.5">
		{#if icon && iconPosition === 'left'}<UiIcon name={icon} sizeRem={0.95} />{/if}
		{#if children}{@render children()}{:else if label}<span class="ui-ctl-label">{label}</span>{/if}
		{#if icon && iconPosition === 'right'}<UiIcon name={icon} sizeRem={0.95} />{/if}
	</span>
</button>

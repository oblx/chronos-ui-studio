<script lang="ts">
	import {
		buildClipPathPolygon,
		DEFAULT_CHAMFER_TUPLE,
		resolveCornerTuple,
		type CornerKind,
		type CornerTuple
	} from '../tokens';
	import UiVectorBorder from './UiVectorBorder.svelte';

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

	let palette = $derived(TONE_VARS[tone]);
	let resolvedCorners = $derived(resolveCornerTuple(corners, cornerMode));
	let clipStyle = $derived(
		cornerMode === 'CHAMFER'
			? `clip-path: ${buildClipPathPolygon(0.25, resolvedCorners)};`
			: cornerMode === 'ROUND'
				? 'border-radius: 0.25rem;'
				: ''
	);
</script>

<span
	aria-label={ariaLabel}
	data-corner-mode={cornerMode}
	class="ui-font-mono relative inline-flex shrink-0 items-center justify-center whitespace-nowrap px-1.5 py-0.5 text-xs font-semibold leading-none {className}"
	style="color: {palette.fg};"
>
	<span
		aria-hidden="true"
		class="pointer-events-none absolute inset-0"
		style="background-color: var(--ui-base-300); {clipStyle}"
	></span>
	<UiVectorBorder {corners} {cornerMode} cutPx={4} strokeVar={palette.stroke} strokeWidth={1.15} />
	<span class="relative z-10">{text}</span>
</span>

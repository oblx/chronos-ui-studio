<script lang="ts">
	import { UiVectorBorder } from '../atoms';
	import { buildClipPathPolygon, DEFAULT_CHAMFER_TUPLE, resolveCornerTuple, type CornerKind, type CornerTuple } from '../tokens';
	import type { SelectOption } from './index';

	interface Props {
		value?: string;
		options: readonly SelectOption[];
		label?: string;
		disabled?: boolean;
		corners?: CornerTuple;
		cornerMode?: CornerKind;
		className?: string;
		onchange?: (value: string) => void;
	}

	let {
		value = $bindable(''),
		options,
		label = '',
		disabled = false,
		corners = DEFAULT_CHAMFER_TUPLE,
		cornerMode = 'CHAMFER',
		className = '',
		onchange
	}: Props = $props();

	let resolvedCorners = $derived(resolveCornerTuple(corners, cornerMode));
	let clipStyle = $derived(
		cornerMode === 'CHAMFER'
			? `clip-path: ${buildClipPathPolygon(0.35, resolvedCorners)};`
			: cornerMode === 'ROUND'
				? 'border-radius: 0.35rem;'
				: ''
	);
</script>

<span class="relative inline-flex w-full" data-corner-mode={cornerMode}>
	<span
		aria-hidden="true"
		class="pointer-events-none absolute inset-0"
		style="background-color: var(--ui-base-100); {clipStyle}"
	></span>
	<UiVectorBorder {corners} {cornerMode} cutPx={5.6} strokeVar="var(--ui-border-subtle)" strokeWidth={1.15} />
	<select
		{value}
		{disabled}
		aria-label={label || undefined}
		data-ui-interactive="true"
		data-ui-cursor={disabled ? 'not-allowed' : 'pointer'}
		onchange={(e) => {
			const next = (e.currentTarget as HTMLSelectElement).value;
			value = next;
			onchange?.(next);
		}}
		class="relative z-10 w-full bg-transparent px-2.5 py-1.5 text-xs outline-none transition-colors disabled:opacity-50 {className}"
		style="color: var(--ui-base-content);"
	>
		{#each options as opt (opt.value)}
			<option value={opt.value}>{opt.label}</option>
		{/each}
	</select>
</span>

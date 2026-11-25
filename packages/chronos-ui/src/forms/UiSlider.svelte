<script lang="ts">
	interface Props {
		value?: number;
		min: number;
		max: number;
		step?: number;
		label?: string;
		valueLabel?: string;
		disabled?: boolean;
		testId?: string;
		className?: string;
		oninput?: (value: number) => void;
	}

	let {
		value = $bindable(0),
		min,
		max,
		step = 1,
		label = '',
		valueLabel = '',
		disabled = false,
		testId,
		className = '',
		oninput
	}: Props = $props();

	let ratioPct = $derived(max > min ? Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100)) : 0);
</script>

<label class="flex flex-col gap-1 {className}">
	{#if label || valueLabel}
		<div class="flex items-center justify-between gap-2 text-xs">
			{#if label}<span class="font-medium">{label}</span>{/if}
			{#if valueLabel}<span class="ui-font-mono tabular-nums" style="color: var(--ui-muted-content);">{valueLabel}</span>{/if}
		</div>
	{/if}
	<input
		type="range"
		{min}
		{max}
		{step}
		{value}
		{disabled}
		data-testid={testId}
		aria-label={label || undefined}
		data-ui-interactive="true"
		oninput={(e) => {
			const next = Number((e.currentTarget as HTMLInputElement).value);
			value = next;
			oninput?.(next);
		}}
		class="ui-ctl ui-slider-input h-1.5 w-full cursor-pointer appearance-none outline-none disabled:opacity-50"
		style="background: linear-gradient(90deg, var(--ui-accent-vivid, var(--ui-primary)) {ratioPct}%, var(--ui-base-300) {ratioPct}%); accent-color: var(--ui-accent-vivid, var(--ui-primary));"
	/>
</label>

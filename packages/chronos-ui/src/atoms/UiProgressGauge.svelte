<script lang="ts">
	interface Props {
		value: number;
		max?: number;
		label: string;
		unitText?: string;
	}

	let {
		value,
		max = 100,
		label,
		unitText
	}: Props = $props();

	let pct = $derived(Math.max(0, Math.min(100, Math.round((value / Math.max(1, max)) * 100))));
</script>

<div class="flex w-full flex-col gap-1" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
	<div class="flex items-center justify-between text-xs leading-none">
		<span class="truncate font-medium" style="color: var(--ui-muted-content);">{label}</span>
		<span class="ui-font-mono shrink-0" style="color: var(--ui-base-content);">{unitText ?? `${pct}%`}</span>
	</div>
	<div class="h-1.5 w-full overflow-hidden" style="background-color: var(--ui-base-300); border: var(--ui-hairline) solid var(--ui-border-subtle);">
		<div class="ui-dur-micro h-full transition-all" style="width: {pct}%; background-color: var(--ui-primary);"></div>
	</div>
</div>

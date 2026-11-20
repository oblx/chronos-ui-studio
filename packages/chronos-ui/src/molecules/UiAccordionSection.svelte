<script lang="ts">
	import type { Snippet } from 'svelte';
	import { UiIcon } from '../atoms';

	interface Props {
		title: string;
		subtitle?: string;
		open?: boolean;
		children?: Snippet;
	}

	let {
		title,
		subtitle,
		open = $bindable(false),
		children
	}: Props = $props();
</script>

<section style="border: var(--ui-hairline) solid var(--ui-border-subtle); background-color: var(--ui-base-200);">
	<button
		type="button"
		aria-expanded={open}
		onclick={() => (open = !open)}
		class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors"
		style="color: var(--ui-base-content);"
	>
		<div class="min-w-0">
			<div class="truncate text-xs font-semibold">{title}</div>
			{#if subtitle}
				<div class="truncate text-xs" style="color: var(--ui-muted-content);">{subtitle}</div>
			{/if}
		</div>
		<UiIcon name={open ? 'chevron-up' : 'chevron-down'} sizeRem={0.95} />
	</button>
	{#if open}
		<div class="px-3 py-2.5" style="border-top: var(--ui-hairline) solid var(--ui-border-subtle);">
			{@render children?.()}
		</div>
	{/if}
</section>

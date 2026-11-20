<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		children?: Snippet;
		className?: string;
	}

	let { title, children, className = '' }: Props = $props();
</script>

<div
	class="flex items-center justify-between gap-3 px-3 py-1.5 {className}"
	style="
		container-type: inline-size;
		background-color: var(--ui-base-200);
		border-bottom: var(--ui-hairline) solid var(--ui-border-subtle);
	"
>
	<span class="truncate text-xs font-semibold tracking-wide" style="color: var(--ui-muted-content);">
		{title}
	</span>
	<div class="flex shrink-0 items-center gap-2 overflow-x-auto">
		{@render children?.()}
	</div>
</div>

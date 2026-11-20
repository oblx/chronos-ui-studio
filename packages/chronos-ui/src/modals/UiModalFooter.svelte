<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();
</script>

<footer
	class="flex flex-wrap items-center justify-end gap-2 px-4 py-2.5"
	style="border-top: var(--ui-hairline) solid var(--ui-border-subtle); background-color: var(--ui-base-300);"
>
	{@render children?.()}
</footer>

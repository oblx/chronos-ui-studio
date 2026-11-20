<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open?: boolean;
		className?: string;
		children?: Snippet;
	}

	let { open, className = '', children }: Props = $props();
	let accordionMode = $derived(open !== undefined);
</script>

{#if accordionMode}
	<div class="ui-phase-accordion {className}" data-open={open ? 'true' : 'false'} aria-hidden={!open}>
		<div class="ui-phase-accordion-inner">
			{@render children?.()}
		</div>
	</div>
{:else}
	<div class={className}>
		{@render children?.()}
	</div>
{/if}

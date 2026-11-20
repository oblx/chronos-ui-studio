<script lang="ts">
	import type { Snippet } from 'svelte';
	import { UiChamferFrame } from '../atoms';
	import { uiTransition } from '../motion';
	import { ZONE_CORNER_PRESETS, type CornerKind } from '../tokens';

	interface Props {
		open: boolean;
		onClose: () => void;
		cornerMode?: CornerKind;
		label?: string;
		className?: string;
		children?: Snippet;
	}

	let {
		open,
		onClose,
		cornerMode = 'CHAMFER',
		label = 'Popover panel',
		className = '',
		children
	}: Props = $props();

	function handleKey(e: KeyboardEvent): void {
		if (open && e.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={handleKey} />

{#if open}
	<button
		type="button"
		aria-label="Close popover"
		class="fixed inset-0 z-40 cursor-default bg-transparent"
		onclick={onClose}
	></button>
	<div
		role="region"
		aria-label={label}
		in:uiTransition={{ offsetPx: -6 }}
		out:uiTransition={{ offsetPx: -6 }}
		class="absolute left-0 top-full z-50 mt-1.5 min-w-[16rem] shadow-xl {className}"
	>
		<UiChamferFrame corners={ZONE_CORNER_PRESETS.TOP_LEFT} {cornerMode} carets={true} cutPx={8} cutRem={0.5} className="p-2.5">
			{@render children?.()}
		</UiChamferFrame>
	</div>
{/if}

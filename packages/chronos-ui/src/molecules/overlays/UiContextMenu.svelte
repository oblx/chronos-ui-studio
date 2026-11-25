<script lang="ts">
	import { UiIcon } from '@ui/atoms';
	import { uiTransition } from '@ui/motion';
	import type { ContextMenuItem } from '../molecules.types';

	interface Props {
		open: boolean;
		x: number;
		y: number;
		items: readonly ContextMenuItem[];
		onClose: () => void;
	}

	let { open, x, y, items, onClose }: Props = $props();

	function handleWindowKey(e: KeyboardEvent): void {
		if (open && e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleWindowKey} />

{#if open}
	<div
		role="presentation"
		class="fixed inset-0 z-[75]"
		onclick={onClose}
		oncontextmenu={(e) => { e.preventDefault(); onClose(); }}
	></div>
	<div
		role="menu"
		in:uiTransition={{ offsetPx: 6 }}
		out:uiTransition={{ offsetPx: 6 }}
		class="fixed z-[76] min-w-[11rem] py-1 shadow-lg"
		style="
			left: {x}px;
			top: {y}px;
			background-color: var(--ui-base-200);
			border: var(--ui-hairline) solid var(--ui-accent-vivid, var(--ui-accent));
		"
	>
		{#each items as item (item.id)}
			<button
				type="button"
				role="menuitem"
				onclick={() => { item.onSelect(); onClose(); }}
				class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium transition-colors"
				style="color: {item.danger ? 'var(--ui-error)' : 'var(--ui-base-content)'};"
			>
				{#if item.icon}
					<UiIcon name={item.icon} sizeRem={0.9} />
				{/if}
				<span>{item.label}</span>
			</button>
		{/each}
	</div>
{/if}

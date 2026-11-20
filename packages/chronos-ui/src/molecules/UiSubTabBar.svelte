<script lang="ts">
	import { UiChamferButton } from '../atoms';
	import { uiSwipeDeck } from '../machines';
	import type { CornerKind } from '../tokens';
	import type { SubTabItem } from './molecules.types';

	interface Props {
		items: readonly SubTabItem[];
		activeId: string;
		cornerMode?: CornerKind;
		onSelect: (id: string) => void;
		className?: string;
	}

	let { items, activeId, cornerMode = 'CHAMFER', onSelect, className = '' }: Props = $props();

	function stepTab(dir: -1 | 1): void {
		if (items.length === 0) return;
		const idx = Math.max(0, items.findIndex((item) => item.id === activeId));
		const nextIdx = (idx + dir + items.length) % items.length;
		onSelect(items[nextIdx].id);
	}
</script>

<div
	role="tablist"
	use:uiSwipeDeck={{ onStep: stepTab }}
	class="ui-scroll-deck flex touch-pan-y items-center gap-1.5 overflow-x-auto pb-1 {className}"
>
	{#each items as item (item.id)}
		<div role="presentation">
			<UiChamferButton
				{cornerMode}
				icon={item.icon}
				label={item.label}
				tip={item.tip}
				active={item.id === activeId}
				variant={item.id === activeId ? 'primary' : 'surface'}
				onclick={() => onSelect(item.id)}
			/>
		</div>
	{/each}
</div>

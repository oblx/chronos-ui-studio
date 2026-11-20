<script lang="ts">
	import { UiBadge, UiChamferButton, UiHorizontalDeck, type CornerKind } from '@chronos-ui/svelte';
	import type { UiBlueprint } from '../../config';
	import { computeBlueprintGrade } from '../../core';

	interface Props {
		blueprints: readonly UiBlueprint[];
		activeBlueprintId: string;
		cornerMode: CornerKind;
		onSelect: (id: string) => void;
		onSave: (bp: UiBlueprint) => void;
		onClone: (id: string) => void;
		onDelete: (id: string) => void;
		onOpenExport: () => void;
	}

	let {
		blueprints,
		activeBlueprintId,
		cornerMode,
		onSelect,
		onSave,
		onClone,
		onDelete,
		onOpenExport
	}: Props = $props();

	let newName = $state('');
	let activeBp = $derived(blueprints.find((b) => b.id === activeBlueprintId) ?? blueprints[0]);

	function createNewBlueprint(): void {
		const name = newName.trim();
		if (!name || !activeBp) return;
		onSave({ ...activeBp, id: `bp-${Date.now().toString(36)}`, name, version: 1, starred: false });
		newName = '';
	}
</script>

<div class="flex flex-col gap-3">
	<UiHorizontalDeck {cornerMode} label="Blueprint library carousel">
		{#each blueprints as bp (bp.id)}
			{@const selected = bp.id === activeBlueprintId}
			<article
				data-selected={selected}
				class="ui-recon-card flex w-56 shrink-0 snap-start flex-col justify-between gap-2 p-2.5"
				style="
					background-color: var(--ui-base-100);
					border: var(--ui-hairline) solid {selected ? 'var(--ui-primary)' : 'var(--ui-border-subtle)'};
				"
			>
				<div class="flex items-start justify-between gap-2">
					<button type="button" onclick={() => onSelect(bp.id)} class="min-w-0 text-left">
						<div class="truncate text-xs font-bold" style="color: var(--ui-base-content);">{bp.name}</div>
						<div class="ui-font-mono text-[0.65rem]" style="color: var(--ui-muted-content);">
							v{bp.version} · {bp.cornerMode}
						</div>
					</button>
					<UiBadge text={computeBlueprintGrade(bp)} tone={selected ? 'primary' : 'neutral'} />
				</div>
				<div class="flex items-center justify-between gap-1">
					<UiChamferButton {cornerMode} label={selected ? 'Active' : 'Load'} active={selected} onclick={() => onSelect(bp.id)} />
					<UiChamferButton {cornerMode} icon="copy" tip="Clone blueprint" onclick={() => onClone(bp.id)} className="px-2" />
					<UiChamferButton {cornerMode} icon="trash" tip={`Delete ${bp.name}`} onclick={() => onDelete(bp.id)} className="px-2" />
				</div>
			</article>
		{/each}
	</UiHorizontalDeck>

	<div class="flex flex-wrap items-center gap-1.5">
		<input
			type="text"
			bind:value={newName}
			placeholder="Create new blueprint..."
			aria-label="New blueprint name"
			class="min-w-0 flex-1 px-2 py-1 text-xs"
			style="background-color: var(--ui-base-100); color: var(--ui-base-content); border: var(--ui-hairline) solid var(--ui-border-subtle);"
		/>
		<UiChamferButton {cornerMode} icon="plus" label="Create" variant="primary" onclick={createNewBlueprint} />
		<UiChamferButton {cornerMode} icon="export" label="Export" onclick={onOpenExport} />
	</div>
</div>

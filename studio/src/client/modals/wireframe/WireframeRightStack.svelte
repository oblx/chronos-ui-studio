<script lang="ts">
	import {
		CORNER_ANIMATIONS, CORNER_EMBELLISHMENTS, CORNER_MODES, HUD_ZONES, UI_FRAME_SHAPES,
		UiChamferButton, UiIcon, type CornerKind, type HudZoneId, type RegisteredUiEntity, type UiNode, type UiNodeTree
	} from '@chronos-ui/svelte';
	import type { WireframeRightTabId } from './wireframe.types';

	interface Props {
		cornerMode: CornerKind;
		activeTab: WireframeRightTabId;
		entities: readonly RegisteredUiEntity[];
		selectedUuid: string | null;
		hoveredUuid: string | null;
		undoStack: readonly UiNodeTree[];
		onSelectTab: (tab: WireframeRightTabId) => void;
		onSelectEntity: (uuid: string) => void;
		onHoverEntity: (uuid: string | null) => void;
		onToggleVisibility: (uuid: string) => void;
		onToggleLock: (uuid: string) => void;
		onDuplicateEntity: (uuid: string, name: string) => void;
		onPatchEntity: (uuid: string, patch: Partial<UiNode>) => void;
		onMoveEntity: (uuid: string, targetZone: HudZoneId) => void;
		onRemoveEntity: (uuid: string) => void;
		onJumpUndoSteps: (stepsBack: number) => void;
	}

	let p: Props = $props();
	let collapsedZones = $state<ReadonlySet<HudZoneId>>(new Set());
	let selected = $derived(p.entities.find((e) => e.uuid === p.selectedUuid) ?? p.entities[0] ?? null);
	let grouped = $derived.by(() => {
		const map = new Map<HudZoneId, RegisteredUiEntity[]>();
		for (const e of p.entities) {
			const bucket = map.get(e.zoneId) ?? [];
			bucket.push(e);
			map.set(e.zoneId, bucket);
		}
		return [...map.entries()];
	});
	const TABS: readonly { id: WireframeRightTabId; label: string }[] = [
		{ id: 'LAYERS', label: 'Layers' }, { id: 'PROPERTIES', label: 'Properties' }, { id: 'HISTORY', label: 'History' }
	];
	function toggleZoneGroup(z: HudZoneId): void {
		const next = new Set(collapsedZones);
		if (next.has(z)) next.delete(z); else next.add(z);
		collapsedZones = next;
	}
</script>

<aside aria-label="Wireframe Inspector Stack" class="flex w-full shrink-0 flex-col border-t lg:w-[20rem] lg:border-t-0 lg:border-l"
	style="background-color: var(--ui-base-200); border-color: var(--ui-border-subtle);" data-testid="wf-right-stack">
	<div class="grid grid-cols-3 gap-1 border-b p-1" style="border-color: var(--ui-border-subtle);">
		{#each TABS as tab (tab.id)}
			<UiChamferButton cornerMode={p.cornerMode} label={tab.label} active={p.activeTab === tab.id} variant={p.activeTab === tab.id ? 'primary' : 'ghost'}
				testId={`wf-tab-${tab.id.toLowerCase()}`} onclick={() => p.onSelectTab(tab.id)} className="w-full py-1 text-[0.68rem]" />
		{/each}
	</div>

	<div class="ui-scroll-deck flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-2 text-xs">
		{#if p.activeTab === 'LAYERS'}
			{#if grouped.length === 0}
				<p class="p-2 text-center text-[0.7rem]" style="color: var(--ui-muted-content);">No entities match current filter. Click [N] Spawn or + Add Component.</p>
			{:else}
				{#each grouped as [zoneId, list] (zoneId)}
					{@const collapsed = collapsedZones.has(zoneId)}
					<div class="flex flex-col gap-1" data-testid={`wf-zone-group-${zoneId}`}>
						<button type="button" onclick={() => toggleZoneGroup(zoneId)} class="ui-font-mono flex items-center justify-between px-1.5 py-1 text-[0.64rem] font-semibold" style="background-color: var(--ui-base-300); color: var(--ui-primary); border: var(--ui-hairline) solid var(--ui-border-subtle);">
							<span class="flex items-center gap-1"><UiIcon name={collapsed ? 'chevron-right' : 'chevron-down'} sizeRem={0.7} />{zoneId}</span>
							<span style="color: var(--ui-muted-content);">{list.length}</span>
						</button>
						{#if !collapsed}
							{#each list as ent (ent.uuid)}
								{@const isSel = ent.uuid === selected?.uuid}
								{@const isHov = ent.uuid === p.hoveredUuid}
								<div role="listitem" class="ui-virtual-row ml-1.5 flex items-center justify-between gap-1 px-1.5 py-1 transition-colors" data-testid={`wf-layer-${ent.shortId}`} data-locked={ent.locked ? 'true' : 'false'} data-visible={ent.visible ? 'true' : 'false'} onmouseenter={() => p.onHoverEntity(ent.uuid)} onmouseleave={() => p.onHoverEntity(null)}
									style="background-color: {isSel ? 'color-mix(in srgb, var(--ui-primary) 16%, var(--ui-base-100))' : 'var(--ui-base-100)'}; border: var(--ui-hairline) solid {isSel || isHov ? 'var(--ui-primary)' : 'var(--ui-border-subtle)'};">
									<span class="cursor-grab opacity-55" aria-hidden="true"><UiIcon name="grip" sizeRem={0.7} /></span>
									<button type="button" class="flex min-w-0 flex-1 items-center gap-1 text-left" onclick={() => p.onSelectEntity(ent.uuid)}>
										<span class="ui-font-mono text-[0.58rem] opacity-70">{ent.shortId}</span>
										<span class="truncate text-[0.7rem] font-medium" style="color: var(--ui-base-content);">{ent.label}</span>
									</button>
									<div class="flex shrink-0 items-center gap-0.5">
										<button type="button" data-testid={`wf-eye-${ent.shortId}`} aria-label={ent.visible ? 'Hide layer' : 'Show layer'} onclick={() => p.onToggleVisibility(ent.uuid)} class="flex h-5 w-5 items-center justify-center border" style="border-color: var(--ui-border-subtle); color: {ent.visible ? 'var(--ui-primary)' : 'var(--ui-muted-content)'};"><UiIcon name="eye" sizeRem={0.7} /></button>
										<button type="button" data-testid={`wf-lock-${ent.shortId}`} aria-label={ent.locked ? 'Unlock layer' : 'Lock layer'} onclick={() => p.onToggleLock(ent.uuid)} class="flex h-5 w-5 items-center justify-center border" style="border-color: {ent.locked ? 'var(--ui-warning)' : 'var(--ui-border-subtle)'}; color: {ent.locked ? 'var(--ui-warning)' : 'var(--ui-muted-content)'};"><UiIcon name="lock" sizeRem={0.7} /></button>
										<button type="button" aria-label={`Duplicate ${ent.label}`} onclick={() => p.onDuplicateEntity(ent.uuid, `${ent.label} Copy`)} class="flex h-5 w-5 items-center justify-center border" style="border-color: var(--ui-border-subtle); color: var(--ui-muted-content);"><UiIcon name="copy" sizeRem={0.68} /></button>
										<button type="button" aria-label={`Delete ${ent.label}`} disabled={ent.locked} onclick={() => p.onRemoveEntity(ent.uuid)} class="flex h-5 w-5 items-center justify-center border disabled:opacity-35" style="border-color: var(--ui-border-subtle); color: var(--ui-error);"><UiIcon name="trash" sizeRem={0.68} /></button>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				{/each}
			{/if}
		{:else if p.activeTab === 'PROPERTIES'}
			{#if !selected}
				<p class="p-2 text-[0.7rem]" style="color: var(--ui-muted-content);">Select an entity on the artboard or Layers tree.</p>
			{:else}
				<div class="flex flex-col gap-2 p-1" data-testid="wf-properties-panel">
					<div class="flex items-center justify-between">
						<span class="font-semibold">{selected.label}</span>
						<span class="ui-font-mono text-[0.65rem]" style="color: {selected.locked ? 'var(--ui-warning)' : 'var(--ui-success)'};">{selected.locked ? 'LOCKED' : 'EDITABLE'}</span>
					</div>
					<label class="flex flex-col gap-1 text-[0.68rem]">
						<span style="color: var(--ui-muted-content);">Zone</span>
						<select disabled={selected.locked} value={selected.zoneId} onchange={(e) => p.onMoveEntity(selected.uuid, e.currentTarget.value as HudZoneId)} class="ui-font-mono px-2 py-1 text-xs" style="background-color: var(--ui-base-100); border: var(--ui-hairline) solid var(--ui-border-subtle);">
							{#each HUD_ZONES as z (z)}<option value={z}>{z}</option>{/each}
						</select>
					</label>
					<label class="flex flex-col gap-1 text-[0.68rem]">
						<span style="color: var(--ui-muted-content);">Shape Contour</span>
						<select disabled={selected.locked} value={selected.shape} onchange={(e) => p.onPatchEntity(selected.uuid, { shape: e.currentTarget.value as UiNode['shape'] })} class="ui-font-mono px-2 py-1 text-xs" style="background-color: var(--ui-base-100); border: var(--ui-hairline) solid var(--ui-border-subtle);">
							{#each UI_FRAME_SHAPES as s (s)}<option value={s}>{s}</option>{/each}
						</select>
					</label>
					<div class="grid grid-cols-3 gap-1">
						{#each CORNER_MODES as cm (cm)}
							<UiChamferButton cornerMode={p.cornerMode} label={cm} disabled={selected.locked} variant={selected.corners[0] === cm ? 'primary' : 'surface'} onclick={() => p.onPatchEntity(selected.uuid, { corners: [cm, cm, cm, cm] })} className="py-0.5 text-[0.62rem]" />
						{/each}
					</div>
					<label class="flex flex-col gap-1 text-[0.68rem]">
						<span style="color: var(--ui-muted-content);">Embellishment</span>
						<select disabled={selected.locked} value={selected.embellishment} onchange={(e) => p.onPatchEntity(selected.uuid, { cornerEmbellishment: e.currentTarget.value as UiNode['cornerEmbellishment'] })} class="ui-font-mono px-2 py-1 text-xs" style="background-color: var(--ui-base-100); border: var(--ui-hairline) solid var(--ui-border-subtle);">
							{#each CORNER_EMBELLISHMENTS as e (e)}<option value={e}>{e}</option>{/each}
						</select>
					</label>
					<label class="flex flex-col gap-1 text-[0.68rem]">
						<span style="color: var(--ui-muted-content);">Animation</span>
						<select disabled={selected.locked} value={selected.cornerAnimation} onchange={(e) => p.onPatchEntity(selected.uuid, { cornerAnimation: e.currentTarget.value as UiNode['cornerAnimation'] })} class="ui-font-mono px-2 py-1 text-xs" style="background-color: var(--ui-base-100); border: var(--ui-hairline) solid var(--ui-border-subtle);">
							{#each CORNER_ANIMATIONS as a (a)}<option value={a}>{a}</option>{/each}
						</select>
					</label>
					<UiChamferButton cornerMode={p.cornerMode} icon="trash" label="Delete Entity" variant="danger" disabled={selected.locked} testId="wf-delete-entity-btn" onclick={() => p.onRemoveEntity(selected.uuid)} className="mt-1 w-full py-1 text-xs" />
				</div>
			{/if}
		{:else}
			<div class="flex flex-col gap-1" data-testid="wf-history-panel">
				<div class="ui-font-mono px-1.5 py-1 text-[0.66rem]" style="background-color: var(--ui-base-100); color: var(--ui-primary); border: var(--ui-hairline) solid var(--ui-primary);">Current State · {p.entities.length} entities</div>
				{#if p.undoStack.length === 0}
					<p class="p-2 text-[0.68rem]" style="color: var(--ui-muted-content);">No prior RFC 6902 revisions yet.</p>
				{:else}
					{#each [...p.undoStack].reverse() as snap, idx (idx)}
						<button type="button" onclick={() => p.onJumpUndoSteps(idx + 1)} class="ui-font-mono flex items-center justify-between px-2 py-1 text-left text-[0.66rem] hover:opacity-90" style="background-color: var(--ui-base-100); border: var(--ui-hairline) solid var(--ui-border-subtle);">
							<span>Rev -{idx + 1}</span><span style="color: var(--ui-muted-content);">{snap.length} entities</span>
						</button>
					{/each}
				{/if}
			</div>
		{/if}
	</div>
</aside>

<script lang="ts">
	import {
		CORNER_MODES, shortUuid, UiChamferButton, UiChamferFrame, UiHorizontalDeck, UiModalFooter, UiModalShell,
		type CornerKind, type HudZoneId, type RegisteredUiEntity
	} from '@chronos-ui/svelte';

	interface Props {
		open: boolean;
		cornerMode: CornerKind;
		projectName: string;
		entities: readonly RegisteredUiEntity[];
		selectedUuid: string | null;
		onSelectEntity: (uuid: string) => void;
		onInspectOnCanvas: (uuid: string) => void;
		onMorphEntityCorner: (uuid: string, nextCorner: CornerKind) => void;
		onCloneDerived: (uuid: string, label: string) => void;
		onCopiedUuid: (uuid: string) => void;
		onEditZone?: (zoneId?: HudZoneId) => void;
		onClose: () => void;
	}

	let {
		open, cornerMode, projectName, entities, selectedUuid,
		onSelectEntity, onInspectOnCanvas, onMorphEntityCorner, onCloneDerived, onCopiedUuid, onEditZone, onClose
	}: Props = $props();

	let bandFilter = $state<'ALL' | 'TOP' | 'MID' | 'BOTTOM'>('ALL');
	let activeUuid = $derived(selectedUuid ?? entities[0]?.uuid ?? null);
	let focused = $derived(entities.find((e) => e.uuid === activeUuid) ?? entities[0] ?? null);
	const BANDS = [
		{ id: 'ALL', label: 'All 11 Zones' },
		{ id: 'TOP', label: 'Top Crown' },
		{ id: 'MID', label: 'World & Edges' },
		{ id: 'BOTTOM', label: 'Bottom Dock' }
	] as const;
	const byZone = (z: HudZoneId) => entities.filter((e) => e.zoneId === z && !e.parentUuid);
	const childrenOf = (uuid: string) => entities.filter((e) => e.parentUuid === uuid);

	function nextCorner(cur: CornerKind): CornerKind {
		return CORNER_MODES[(CORNER_MODES.indexOf(cur) + 1) % CORNER_MODES.length];
	}

	function copyFocusedUuid(): void {
		if (!focused) return;
		if (typeof navigator !== 'undefined' && navigator.clipboard) void navigator.clipboard.writeText(focused.uuid);
		onCopiedUuid(focused.uuid);
	}
</script>

{#snippet skeletonSlot(zone: HudZoneId, title: string)}
	{@const list = byZone(zone)}
	<div class="flex flex-col gap-1 border p-2" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-100);">
		<div class="ui-font-mono flex items-center justify-between text-[0.62rem]" style="color: var(--ui-muted-content);">
			<span>{title}</span>
			<span>{list.length}</span>
		</div>
		{#each list as ent (ent.uuid)}
			<button
				type="button"
				data-testid={`skeleton-node-${ent.uuid}`}
				onclick={() => onSelectEntity(ent.uuid)}
				class="flex flex-col gap-0.5 border px-2 py-1 text-left text-[0.68rem] transition-colors"
				style={`border-color: ${focused?.uuid === ent.uuid ? 'var(--ui-accent-vivid, var(--ui-primary))' : 'var(--ui-border-subtle)'}; background-color: var(--ui-base-200);`}
			>
				<div class="flex items-center justify-between gap-1 font-medium">
					<span class="truncate">{ent.label}</span>
					<span class="ui-font-mono text-[0.6rem]" style="color: var(--ui-accent-vivid, var(--ui-primary));">{ent.shortId}</span>
				</div>
				<div class="ui-font-mono text-[0.58rem]" style="color: var(--ui-muted-content);">{ent.shape} · {ent.corners[0]} · {ent.lifecycle}</div>
				{#if childrenOf(ent.uuid).length > 0}
					<div class="mt-1 flex flex-wrap gap-1 border-t pt-1" style="border-color: var(--ui-border-subtle);">
						{#each childrenOf(ent.uuid) as ch (ch.uuid)}
							<span class="ui-font-mono border px-1 py-0.5 text-[0.56rem]" style="border-color: var(--ui-border-subtle);">{ch.label} ({ch.shortId})</span>
						{/each}
					</div>
				{/if}
			</button>
		{:else}
			<span class="ui-font-mono text-[0.6rem] opacity-55">Empty slot</span>
		{/each}
	</div>
{/snippet}

<UiModalShell {open} sizeTier="WIDE" title="Spatial Wireframe Skeleton" subtitle={`${projectName} · ${entities.length} RFC 9562 UUID v7 entities`} icon="radar" {cornerMode} {onClose}>
	<div class="relative flex flex-col gap-3 text-xs" data-testid="radar-wireframe-modal">
		<UiHorizontalDeck {cornerMode} label="Radar wireframe zone bands">
			{#each BANDS as b (b.id)}
				<UiChamferButton {cornerMode} label={b.label} active={bandFilter === b.id} variant={bandFilter === b.id ? 'primary' : 'surface'} onclick={() => { bandFilter = b.id; }} className="shrink-0 py-0.5 text-[0.7rem]" />
			{/each}
		</UiHorizontalDeck>
		<svg aria-hidden="true" viewBox="0 0 600 220" preserveAspectRatio="none" class="pointer-events-none absolute inset-0 h-full w-full opacity-15">
			<path d="M 100 32 Q 300 10 500 32" fill="none" stroke="var(--ui-accent-vivid, var(--ui-primary))" stroke-width="1.25" stroke-dasharray="4 4" />
			<path d="M 300 44 L 300 110 M 140 110 Q 300 92 460 110" fill="none" stroke="var(--ui-secondary)" stroke-width="1.25" stroke-dasharray="3 3" />
			<path d="M 300 132 L 100 188 M 300 132 L 500 188" fill="none" stroke="var(--ui-primary)" stroke-width="1.25" stroke-dasharray="4 4" />
		</svg>
		{#if bandFilter === 'ALL' || bandFilter === 'TOP'}
			<div class="grid grid-cols-1 gap-2 md:grid-cols-3">
				{@render skeletonSlot('TOP_LEFT', 'TOP_LEFT')}
				<div class="flex flex-col gap-2">
					{@render skeletonSlot('TOP_CENTER', 'TOP_CENTER')}
					{@render skeletonSlot('PROJECT_TAB_DECK', 'PROJECT_TAB_DECK')}
				</div>
				{@render skeletonSlot('TOP_RIGHT', 'TOP_RIGHT')}
			</div>
		{/if}

		{#if bandFilter === 'ALL' || bandFilter === 'MID'}
			<div class="grid grid-cols-1 gap-2 md:grid-cols-[1fr_2fr_1fr]">
				{@render skeletonSlot('LEFT_EDGE', 'LEFT_EDGE')}
				{@render skeletonSlot('WORLD_CANVAS', 'WORLD_CANVAS')}
				{@render skeletonSlot('RIGHT_EDGE', 'RIGHT_EDGE')}
			</div>
		{/if}

		{#if bandFilter === 'ALL' || bandFilter === 'BOTTOM'}
			<div class="grid grid-cols-1 gap-2 md:grid-cols-3">
				{@render skeletonSlot('BOTTOM_LEFT', 'BOTTOM_LEFT')}
				{@render skeletonSlot('BOTTOM_CENTER', 'BOTTOM_CENTER')}
				{@render skeletonSlot('BOTTOM_RIGHT', 'BOTTOM_RIGHT')}
			</div>
		{/if}

		{#if focused}
			<UiChamferFrame {cornerMode} carets={true} cutPx={8} cutRem={0.5} className="flex flex-wrap items-center justify-between gap-2 p-3">
				<div class="flex flex-col gap-0.5">
					<span class="ui-font-display font-semibold">{focused.label} ({focused.kind})</span>
					<span class="ui-font-mono text-[0.66rem]" style="color: var(--ui-muted-content);">
						UUID {focused.uuid} · {focused.shape} · {focused.corners[0]} · {focused.lifecycle}
					</span>
				</div>
				<div class="flex flex-wrap items-center gap-1.5">
					<UiChamferButton {cornerMode} label="Inspect on Canvas" variant="primary" onclick={() => { onInspectOnCanvas(focused.uuid); onClose(); }} className="py-1 text-xs" />
					<UiChamferButton {cornerMode} label="Morph Corners" variant="secondary" onclick={() => onMorphEntityCorner(focused.uuid, nextCorner(focused.corners[0]))} className="py-1 text-xs" />
					<UiChamferButton {cornerMode} label="Clone Derived" variant="surface" onclick={() => onCloneDerived(focused.uuid, `${focused.label} Derived`)} className="py-1 text-xs" />
					<UiChamferButton {cornerMode} label="Copy UUID" variant="ghost" onclick={copyFocusedUuid} className="py-1 text-xs" />
				</div>
			</UiChamferFrame>
		{/if}
	</div>
	{#snippet footer()}
		<UiModalFooter>
			{#if onEditZone}<UiChamferButton {cornerMode} icon="grid" label="Edit Zone" variant="secondary" onclick={() => onEditZone(focused?.zoneId)} />{/if}
			<UiChamferButton {cornerMode} label="Close" variant="ghost" onclick={onClose} />
		</UiModalFooter>
	{/snippet}
</UiModalShell>

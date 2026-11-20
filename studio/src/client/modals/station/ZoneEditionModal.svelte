<script lang="ts">
	import {
		CORNER_ANIMATIONS, CORNER_EMBELLISHMENTS, CORNER_MODES, CORNER_RADIUS_LIMITS, findOppositeZone, HUD_ZONES, UI_FRAME_SHAPES,
		UiBadge, UiChamferButton, UiChamferFrame, UiModalFooter, UiModalShell, UiSelect, UiSlider,
		type CornerAnimation, type CornerEmbellishment, type CornerKind, type CornerTuple,
		type HudZoneId, type UiFrameShape, type UiNode
	} from '@chronos-ui/svelte';
	import type { UiBlueprint, ZoneDensityMode, ZoneDispositionMode } from '@studio/config';
	import type { ZoneEditPayload } from '@studio/client/state';
	import ZoneSchematicGrid from './ZoneSchematicGrid.svelte';

	interface Props {
		open: boolean;
		cornerMode: CornerKind;
		blueprint: UiBlueprint;
		selectedZoneId: HudZoneId;
		nodes: readonly UiNode[];
		bilateralMirror: boolean;
		onSelectZone: (zoneId: HudZoneId) => void;
		onEditZone: (payload: ZoneEditPayload) => void;
		onMoveEntity: (nodeId: string, targetZone: HudZoneId, direction?: 'UP' | 'DOWN') => void;
		onInspectEntity: (nodeId: string) => void;
		onRemoveEntity: (nodeId: string) => void;
		onClose: () => void;
	}

	let p: Props = $props();
	let mirrorOpposite = $state(true);
	$effect(() => { if (p.open) mirrorOpposite = p.bilateralMirror; });
	let zone = $derived(p.blueprint.zones.find((z) => z.id === p.selectedZoneId) ?? p.blueprint.zones[0]);
	let oppositeZone = $derived(findOppositeZone(p.selectedZoneId));
	let zoneNodes = $derived(p.nodes.filter((n) => n.zone === p.selectedZoneId));

	const DISPOSITIONS: readonly ZoneDispositionMode[] = ['DOCKED', 'FLOATING', 'COLLAPSED'];
	const DENSITIES: readonly ZoneDensityMode[] = ['COMPACT', 'STANDARD', 'SPACIOUS'];
	const CORNER_LABELS = ['TL', 'TR', 'BR', 'BL'] as const;
	const ZONE_OPTS = HUD_ZONES.map((z) => ({ value: z, label: z }));
	const SHAPE_OPTS = UI_FRAME_SHAPES.map((s) => ({ value: s, label: s }));
	const EMB_OPTS = CORNER_EMBELLISHMENTS.map((e) => ({ value: e, label: e }));
	const ANIM_OPTS = CORNER_ANIMATIONS.map((a) => ({ value: a, label: a }));

	function cycleCorner(idx: 0 | 1 | 2 | 3): void {
		if (!zone) return;
		const next = [...zone.corners] as [CornerKind, CornerKind, CornerKind, CornerKind];
		next[idx] = CORNER_MODES[(CORNER_MODES.indexOf(next[idx]) + 1) % CORNER_MODES.length];
		p.onEditZone({ zoneId: zone.id, corners: next as CornerTuple, mirrorOpposite });
	}
</script>

<UiModalShell open={p.open} sizeTier="WIDE" title="Zone Edition — 11-Zone Perimeter Workbench" subtitle={`${p.blueprint.name} · Editing ${p.selectedZoneId}`} icon="grid" cornerMode={p.cornerMode} onClose={p.onClose}>
	<div class="grid grid-cols-1 gap-4 text-xs lg:grid-cols-[1.05fr_1.35fr]" data-testid="zone-edition-modal">
		<div class="flex flex-col gap-2.5">
			<div class="flex items-center justify-between">
				<span class="font-semibold" style="color: var(--ui-muted-content);">11-Zone Spatial Schematic</span>
				<UiBadge text={`${p.blueprint.zones.filter((z) => z.visible).length}/11 Visible`} tone="primary" cornerMode={p.cornerMode} />
			</div>
			<ZoneSchematicGrid zones={p.blueprint.zones} selectedZoneId={p.selectedZoneId} nodes={p.nodes} onSelectZone={p.onSelectZone} />
			{#if oppositeZone}
				<UiChamferButton cornerMode={p.cornerMode} label={mirrorOpposite ? `Mirror Opposite (${oppositeZone} · X=50vw): ON` : `Mirror Opposite (${oppositeZone}): OFF`} active={mirrorOpposite} variant={mirrorOpposite ? 'secondary' : 'surface'} onclick={() => { mirrorOpposite = !mirrorOpposite; }} testId="zone-mirror-toggle" className="w-full py-1 text-[0.68rem]" />
			{/if}
		</div>

		{#if zone}
			<UiChamferFrame cornerMode={p.cornerMode} carets={false} className="flex flex-col gap-2.5 p-3">
				<div class="flex items-center justify-between gap-2 border-b pb-2" style="border-color: var(--ui-border-subtle);">
					<span class="ui-font-display font-semibold">{zone.label} ({zone.id})</span>
					<UiChamferButton cornerMode={p.cornerMode} label={zone.visible ? 'Visible' : 'Hidden'} active={zone.visible} variant={zone.visible ? 'primary' : 'surface'} onclick={() => p.onEditZone({ zoneId: zone.id, visible: !zone.visible, mirrorOpposite })} className="py-0.5 text-[0.66rem]" />
				</div>

				<div class="grid grid-cols-2 gap-2">
					<div class="flex flex-col gap-1">
						<span style="color: var(--ui-muted-content);">Disposition</span>
						<div class="grid grid-cols-3 gap-1">
							{#each DISPOSITIONS as disp (disp)}
								<UiChamferButton cornerMode={p.cornerMode} label={disp} active={(zone.disposition ?? 'DOCKED') === disp} variant={(zone.disposition ?? 'DOCKED') === disp ? 'primary' : 'surface'} onclick={() => p.onEditZone({ zoneId: zone.id, disposition: disp, mirrorOpposite })} className="px-1 py-0.5 text-[0.6rem]" />
							{/each}
						</div>
					</div>
					<div class="flex flex-col gap-1">
						<span style="color: var(--ui-muted-content);">Zone Density</span>
						<div class="grid grid-cols-3 gap-1">
							{#each DENSITIES as dens (dens)}
								<UiChamferButton cornerMode={p.cornerMode} label={dens} active={(zone.density ?? 'STANDARD') === dens} variant={(zone.density ?? 'STANDARD') === dens ? 'secondary' : 'surface'} onclick={() => p.onEditZone({ zoneId: zone.id, density: dens, mirrorOpposite })} className="px-1 py-0.5 text-[0.6rem]" />
							{/each}
						</div>
					</div>
				</div>

				<div class="flex flex-col gap-1">
					<span style="color: var(--ui-muted-content);">4-Corner Matrix [TL, TR, BR, BL] (click to cycle STRAIGHT / CHAMFER / ROUND)</span>
					<div class="grid grid-cols-4 gap-1.5" data-testid="zone-corner-matrix">
						{#each CORNER_LABELS as lbl, idx (lbl)}
							<UiChamferButton cornerMode={p.cornerMode} label={`${lbl}: ${zone.corners[idx]}`} variant="surface" onclick={() => cycleCorner(idx as 0 | 1 | 2 | 3)} className="px-1 py-1 text-[0.62rem]" />
						{/each}
					</div>
				</div>

				<UiSlider value={zone.cornerRadiusRem ?? CORNER_RADIUS_LIMITS.defaultRem} min={CORNER_RADIUS_LIMITS.minRem} max={CORNER_RADIUS_LIMITS.maxRem} step={CORNER_RADIUS_LIMITS.stepRem} label="Zone Corner Radius" valueLabel={`${(zone.cornerRadiusRem ?? CORNER_RADIUS_LIMITS.defaultRem).toFixed(2)}rem`} oninput={(v) => p.onEditZone({ zoneId: zone.id, cornerRadiusRem: v, mirrorOpposite })} />

				<div class="grid grid-cols-3 gap-1.5">
					<UiSelect cornerMode={p.cornerMode} value={zone.shape ?? 'BOX'} options={SHAPE_OPTS} label="Zone shape" onchange={(v) => p.onEditZone({ zoneId: zone.id, shape: v as UiFrameShape, mirrorOpposite })} />
					<UiSelect cornerMode={p.cornerMode} value={zone.cornerEmbellishment ?? 'CARET'} options={EMB_OPTS} label="Zone embellishment" onchange={(v) => p.onEditZone({ zoneId: zone.id, cornerEmbellishment: v as CornerEmbellishment, mirrorOpposite })} />
					<UiSelect cornerMode={p.cornerMode} value={zone.cornerAnimation ?? 'NONE'} options={ANIM_OPTS} label="Zone animation" onchange={(v) => p.onEditZone({ zoneId: zone.id, cornerAnimation: v as CornerAnimation, mirrorOpposite })} />
				</div>

				<div class="flex flex-col gap-1.5 border-t pt-2" style="border-color: var(--ui-border-subtle);">
					<span class="font-semibold" style="color: var(--ui-muted-content);">Mounted Entities in {zone.id} ({zoneNodes.length})</span>
					{#each zoneNodes as node (node.id)}
						<div class="flex flex-wrap items-center justify-between gap-1.5 border px-2 py-1" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-100);">
							<span class="truncate font-medium">{node.label}</span>
							<div class="flex items-center gap-1">
								<div class="w-28"><UiSelect cornerMode={p.cornerMode} value={node.zone} options={ZONE_OPTS} label={`Move ${node.label} to zone`} onchange={(z) => p.onMoveEntity(node.id, z as HudZoneId)} /></div>
								<UiChamferButton cornerMode={p.cornerMode} label="Up" variant="ghost" onclick={() => p.onMoveEntity(node.id, node.zone, 'UP')} className="px-1.5 py-0.5 text-[0.6rem]" />
								<UiChamferButton cornerMode={p.cornerMode} label="Down" variant="ghost" onclick={() => p.onMoveEntity(node.id, node.zone, 'DOWN')} className="px-1.5 py-0.5 text-[0.6rem]" />
								<UiChamferButton cornerMode={p.cornerMode} label="Inspect" variant="surface" onclick={() => { p.onInspectEntity(node.id); p.onClose(); }} className="px-1.5 py-0.5 text-[0.6rem]" />
								<UiChamferButton cornerMode={p.cornerMode} icon="trash" tip="Remove entity" variant="danger" onclick={() => p.onRemoveEntity(node.id)} className="px-1.5 py-0.5" />
							</div>
						</div>
					{:else}
						<span class="ui-font-mono opacity-60">No entities mounted in this zone.</span>
					{/each}
				</div>
			</UiChamferFrame>
		{/if}
	</div>
	{#snippet footer()}
		<UiModalFooter><UiChamferButton cornerMode={p.cornerMode} label="Done" variant="primary" onclick={p.onClose} /></UiModalFooter>
	{/snippet}
</UiModalShell>

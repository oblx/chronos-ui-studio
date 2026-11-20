<script lang="ts">
	import { UiBadge, UiChamferButton, type CornerKind, type HudZoneId } from '@chronos-ui/svelte';
	import type { UiBlueprint } from '@studio/config';

	interface Props {
		blueprint: UiBlueprint;
		cornerMode: CornerKind;
		onToggleZone: (zoneId: HudZoneId) => void;
		onCycleCorner: (zoneId: HudZoneId, idx: 0 | 1 | 2 | 3, next: CornerKind) => void;
	}

	let { blueprint, cornerMode, onToggleZone, onCycleCorner }: Props = $props();
	const cornerLabels = ['TL', 'TR', 'BR', 'BL'] as const;
</script>

<div class="flex flex-col gap-2">
	<div class="flex items-center justify-between">
		<span class="text-xs font-semibold" style="color: var(--ui-muted-content);">
			11-Zone Perimeter Composer
		</span>
		<UiBadge text={`${blueprint.zones.filter((z) => z.visible).length}/11`} tone="primary" />
	</div>
	<div class="flex flex-col gap-1.5">
		{#each blueprint.zones as zone (zone.id)}
			<div
				class="flex flex-col gap-1.5 p-2"
				style="background-color: var(--ui-base-100); border: var(--ui-hairline) solid var(--ui-border-subtle);"
			>
				<div class="flex items-center justify-between gap-2">
					<div class="min-w-0">
						<div class="truncate text-xs font-semibold" style="color: var(--ui-base-content);">{zone.label}</div>
						<div class="ui-font-mono truncate text-[0.65rem]" style="color: var(--ui-muted-content);">{zone.id}</div>
					</div>
					<UiChamferButton
						{cornerMode}
						label={zone.visible ? 'Visible' : 'Hidden'}
						active={zone.visible}
						variant={zone.visible ? 'primary' : 'ghost'}
						onclick={() => onToggleZone(zone.id)}
						className="px-2 py-1"
					/>
				</div>
				<div class="grid grid-cols-4 gap-1">
					{#each cornerLabels as lbl, idx (lbl)}
						{@const kind = zone.corners[idx as 0 | 1 | 2 | 3]}
						<button
							type="button"
							onclick={() => onCycleCorner(zone.id, idx as 0 | 1 | 2 | 3, kind === 'CHAMFER' ? 'STRAIGHT' : 'CHAMFER')}
							class="ui-font-mono px-1 py-0.5 text-[0.65rem] font-semibold"
							style="
								background-color: var(--ui-base-300);
								color: {kind === 'CHAMFER' ? 'var(--ui-accent)' : 'var(--ui-muted-content)'};
								border: var(--ui-hairline) solid var(--ui-border-subtle);
							"
						>
							{lbl}:{kind === 'CHAMFER' ? '45' : '90'}
						</button>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

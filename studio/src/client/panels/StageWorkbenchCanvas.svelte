<script lang="ts">
	import {
		UiBadge,
		UiChamferButton,
		UiChamferFrame,
		UiMathFormula,
		type CornerKind,
		type HudZoneId,
		type ViewportTier
	} from '@chronos-ui/svelte';
	import { VIEWPORT_PRESETS, type UiBlueprint } from '@studio/config';
	import { computeBlueprintGrade } from '@studio/core';

	interface Props {
		blueprint: UiBlueprint;
		previewTier: ViewportTier;
		cornerMode: CornerKind;
		zoom: number;
		onSelectTier: (tier: ViewportTier) => void;
		onResetCamera: () => void;
		onOpenExport: () => void;
		onToggleZone?: (id: HudZoneId) => void;
	}

	let {
		blueprint,
		previewTier,
		cornerMode,
		zoom,
		onSelectTier,
		onResetCamera,
		onOpenExport,
		onToggleZone
	}: Props = $props();

	let activePreset = $derived(VIEWPORT_PRESETS.find((p) => p.tier === previewTier) ?? VIEWPORT_PRESETS[3]);
	let visibleCount = $derived(blueprint.zones.filter((z) => z.visible).length);
	let inboundZones = $derived(blueprint.zones.filter((z) => z.id === 'TOP_LEFT' || z.id === 'LEFT_EDGE' || z.id === 'BOTTOM_LEFT'));
	let outboundZones = $derived(blueprint.zones.filter((z) => z.id === 'TOP_RIGHT' || z.id === 'RIGHT_EDGE' || z.id === 'BOTTOM_RIGHT'));
</script>

<div data-ui-interactive="true" class="flex w-full max-w-5xl flex-col items-center gap-4 px-6">
	<div class="flex w-full flex-wrap items-center justify-between gap-2 px-2">
		<div class="flex flex-wrap items-center gap-1.5">
			{#each VIEWPORT_PRESETS as preset (preset.tier)}
				<UiChamferButton
					{cornerMode}
					label={preset.label}
					active={preset.tier === previewTier}
					variant={preset.tier === previewTier ? 'primary' : 'surface'}
					onclick={() => onSelectTier(preset.tier)}
				/>
			{/each}
		</div>
		<div class="flex items-center gap-2">
			<span class="ui-font-mono text-xs" style="color: var(--ui-muted-content);">
				{activePreset.widthPx}x{activePreset.heightPx} · {Math.round(zoom * 100)}%
			</span>
			<UiChamferButton {cornerMode} icon="reset" label="Fit" onclick={onResetCamera} />
			<UiChamferButton {cornerMode} icon="export" label="Export" variant="primary" onclick={onOpenExport} />
		</div>
	</div>

	<div class="relative grid w-full grid-cols-1 items-center gap-6 lg:grid-cols-[15rem_1fr_15rem]">
		<svg class="pointer-events-none absolute inset-0 hidden h-full w-full lg:block" viewBox="0 0 1000 320" preserveAspectRatio="none" aria-hidden="true">
			<path d="M 245 72 C 300 72, 300 160, 345 160" fill="none" stroke="var(--ui-primary)" stroke-opacity="0.5" style="stroke-width: var(--ui-hairline);" />
			<path d="M 245 168 L 345 168" fill="none" stroke="var(--ui-secondary)" stroke-opacity="0.5" style="stroke-width: var(--ui-hairline);" />
			<path d="M 245 264 C 300 264, 300 176, 345 176" fill="none" stroke="var(--ui-primary)" stroke-opacity="0.4" style="stroke-width: var(--ui-hairline);" />
			<path d="M 655 160 C 700 160, 700 72, 755 72" fill="none" stroke="var(--ui-secondary)" stroke-opacity="0.5" style="stroke-width: var(--ui-hairline);" />
			<path d="M 655 168 L 755 168" fill="none" stroke="var(--ui-secondary)" stroke-opacity="0.5" style="stroke-width: var(--ui-hairline);" />
			<path d="M 655 176 C 700 176, 700 264, 755 264" fill="none" stroke="var(--ui-secondary)" stroke-opacity="0.4" style="stroke-width: var(--ui-hairline);" />
		</svg>
		<div class="relative z-10 flex flex-col gap-3">
			<div class="ui-font-mono text-[0.68rem] font-semibold tracking-wider" style="color: var(--ui-success);">
				LEFT PERIMETER (X &lt; 50vw)
			</div>
			{#each inboundZones as z (z.id)}
				<button type="button" onclick={() => onToggleZone?.(z.id)} class="text-left transition-transform duration-150 hover:translate-x-0.5">
					<UiChamferFrame corners={z.corners} {cornerMode} carets={false} strokeVar={z.visible ? 'var(--ui-primary)' : 'var(--ui-border-subtle)'} outerClass="w-full" className="px-4 py-3">
						<div class="flex items-center justify-between gap-2">
							<span class="text-xs font-bold" style="color: var(--ui-base-content);">{z.label}</span>
							<UiBadge text={z.visible ? 'ON' : 'OFF'} tone={z.visible ? 'success' : 'neutral'} />
						</div>
						<div class="ui-font-mono mt-1 text-[0.65rem]" style="color: var(--ui-muted-content);">
							{z.id} · {z.corners.map((c) => (c === 'CHAMFER' ? '45' : '90')).join('/')}
						</div>
					</UiChamferFrame>
				</button>
			{/each}
		</div>

		<UiChamferFrame {cornerMode} bezel={true} carets={true} strokeVar="var(--ui-secondary)" caretVar="var(--ui-primary)" cutPx={14} cutRem={0.875} outerClass="relative z-10 w-full" className="px-6 py-4">
			<div class="flex flex-col gap-3.5">
				<div class="flex items-center justify-between gap-2">
					<span class="ui-font-mono text-[0.7rem] font-semibold tracking-wider" style="color: var(--ui-primary);">FOCAL BLUEPRINT · ACYCLIC DAG</span>
					<UiBadge text={`Grade ${computeBlueprintGrade(blueprint)}`} tone="primary" />
				</div>
				<div>
					<h1 class="ui-font-display text-lg font-bold tracking-tight" style="color: var(--ui-base-content);">{blueprint.name}</h1>
					<p class="mt-0.5 text-xs leading-relaxed" style="color: var(--ui-muted-content);">{blueprint.description}</p>
				</div>
				<div class="grid grid-cols-2 gap-2 p-2.5" style="background-color: var(--ui-base-100); border: var(--ui-hairline) solid var(--ui-border-subtle);">
					<div>
						<div class="text-[0.68rem]" style="color: var(--ui-muted-content);">Active Perimeter</div>
						<div class="ui-font-mono text-sm font-bold" style="color: var(--ui-base-content);">{visibleCount} / 11 Zones</div>
					</div>
					<div>
						<div class="text-[0.68rem]" style="color: var(--ui-muted-content);">Overlay Drift</div>
						<div class="ui-font-mono text-sm font-bold" style="color: var(--ui-success);">0px · 60 FPS</div>
					</div>
				</div>
				<div class="flex items-center justify-between gap-2 pt-1" style="border-top: var(--ui-hairline) solid var(--ui-border-subtle);">
					<UiMathFormula label="Symmetry Law" lhs="M([TL,TR,BR,BL])" rhs="[TR,TL,BL,BR]" />
					<UiBadge text={cornerMode} tone="secondary" />
				</div>
			</div>
		</UiChamferFrame>

		<div class="relative z-10 flex flex-col gap-3">
			<div class="ui-font-mono text-[0.68rem] font-semibold tracking-wider" style="color: var(--ui-secondary);">
				RIGHT MIRROR (X &gt; 50vw)
			</div>
			{#each outboundZones as z (z.id)}
				<button type="button" onclick={() => onToggleZone?.(z.id)} class="text-left transition-transform duration-150 hover:-translate-x-0.5">
					<UiChamferFrame corners={z.corners} {cornerMode} carets={false} strokeVar={z.visible ? 'var(--ui-secondary)' : 'var(--ui-border-subtle)'} outerClass="w-full" className="px-4 py-3">
						<div class="flex items-center justify-between gap-2">
							<span class="text-xs font-bold" style="color: var(--ui-base-content);">{z.label}</span>
							<UiBadge text={z.visible ? 'ON' : 'OFF'} tone={z.visible ? 'info' : 'neutral'} />
						</div>
						<div class="ui-font-mono mt-1 text-[0.65rem]" style="color: var(--ui-muted-content);">
							{z.id} · {z.corners.map((c) => (c === 'CHAMFER' ? '45' : '90')).join('/')}
						</div>
					</UiChamferFrame>
				</button>
			{/each}
		</div>
	</div>
</div>

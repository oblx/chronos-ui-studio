<script lang="ts">
	import {
		UiBadge, UiChamferFrame,
		type CornerAnimation, type CornerEmbellishment, type CornerKind, type LayoutDensity,
		type MotionConfig, type StudioDefaultsConfig
	} from '@chronos-ui/svelte';
	import { STUDIO_UI_COPY } from '@studio/config';
	import type { StationLayerConfig } from '@studio/client/state';

	interface Props {
		cornerMode: CornerKind;
		studioDefaults: StudioDefaultsConfig;
		stationLayer: StationLayerConfig;
		motionConfig: MotionConfig;
		layoutDensity: LayoutDensity;
		studioChromeVisible: boolean;
		themeName: string;
		themePolarity: string;
		cursorPackName: string;
		nodeCount: number;
		cornerEmbellishment: CornerEmbellishment;
		cornerAnimation: CornerAnimation;
	}

	let p: Props = $props();
</script>

<aside
	class="flex w-full shrink-0 flex-col gap-2.5 lg:w-[20rem]"
	data-testid="station-live-preview"
	data-preview-corner={p.cornerMode}
	data-preview-density={p.layoutDensity}
	data-preview-preset={p.motionConfig.preset}
>
	<UiChamferFrame
		cornerMode={p.cornerMode}
		cornerRadiusRem={p.studioDefaults.stationCornerCutRem}
		cutTier="station"
		cornerEmbellishment={p.cornerEmbellishment}
		cornerAnimation={p.cornerAnimation}
		carets={true}
		bezel={true}
		className="flex flex-col gap-2.5 p-3"
	>
		<div class="flex items-center justify-between gap-2">
			<span class="ui-font-mono text-[0.65rem] font-semibold uppercase tracking-wider" style="color: var(--ui-primary);">
				{STUDIO_UI_COPY.stationPreviewHeading}
			</span>
			<UiBadge text={p.cornerMode} tone="primary" cornerMode={p.cornerMode} />
		</div>

		<div
			class="relative flex aspect-[16/10] w-full flex-col justify-between overflow-hidden border p-2.5"
			style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-100); {p.stationLayer.showGrid ? 'background-image: linear-gradient(to right, var(--ui-border-subtle) 1px, transparent 1px), linear-gradient(to bottom, var(--ui-border-subtle) 1px, transparent 1px); background-size: 1.25rem 1.25rem;' : ''}"
		>
			{#if p.stationLayer.showReticle}
				<span class="pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 border opacity-45" style="border-color: var(--ui-primary);" aria-hidden="true"></span>
			{/if}

			<div class="relative z-10 flex items-center justify-between gap-1.5">
				<UiChamferFrame cornerMode={p.cornerMode} cornerRadiusRem={p.studioDefaults.controlCornerCutRem} cutTier="base" carets={false} className="px-1.5 py-0.5 text-[0.58rem]">
					<span class="ui-font-mono">{p.studioChromeVisible ? 'HUD' : 'CALM'} · {p.layoutDensity}</span>
				</UiChamferFrame>
				<UiChamferFrame cornerMode={p.cornerMode} cornerRadiusRem={p.studioDefaults.controlCornerCutRem} cutTier="base" carets={false} className="px-1.5 py-0.5 text-[0.58rem]">
					<span class="ui-font-mono">{p.nodeCount} nodes</span>
				</UiChamferFrame>
			</div>

			<div class="relative z-10 mx-auto w-4/5">
				<UiChamferFrame cornerMode={p.cornerMode} cornerRadiusRem={p.studioDefaults.baseCornerCutRem} cutTier="base" carets={false} className="flex items-center justify-between px-2.5 py-2 text-[0.62rem]">
					<span class="ui-font-display font-semibold" style="color: var(--ui-base-content);">Stage Surface</span>
					<span class="ui-font-mono" style="color: var(--ui-secondary);">{p.motionConfig.preset}</span>
				</UiChamferFrame>
			</div>

			<div class="ui-font-mono relative z-10 flex items-center justify-between text-[0.58rem]" style="color: var(--ui-muted-content);">
				<span>Grid: {p.stationLayer.showGrid ? 'ON' : 'OFF'}</span>
				<span>Reticle: {p.stationLayer.showReticle ? 'ON' : 'OFF'}</span>
			</div>
		</div>

		<div class="ui-font-mono grid grid-cols-2 gap-1.5 text-[0.64rem]" style="color: var(--ui-muted-content);">
			<div class="border px-2 py-1" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-100);">
				<div class="opacity-65">Theme</div>
				<div class="truncate font-semibold" style="color: var(--ui-base-content);">{p.themeName} ({p.themePolarity})</div>
			</div>
			<div class="border px-2 py-1" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-100);">
				<div class="opacity-65">Cursor Pack</div>
				<div class="truncate font-semibold" style="color: var(--ui-base-content);">{p.cursorPackName}</div>
			</div>
			<div class="col-span-2 border px-2 py-1" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-100);">
				<div class="opacity-65">3-Tier Cut Geometry</div>
				<div class="font-semibold" style="color: var(--ui-primary);">
					Base {p.studioDefaults.baseCornerCutRem.toFixed(2)}rem · Station {p.studioDefaults.stationCornerCutRem.toFixed(2)}rem · Ctrl {p.studioDefaults.controlCornerCutRem.toFixed(2)}rem
				</div>
			</div>
		</div>
	</UiChamferFrame>
</aside>

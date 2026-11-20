<script lang="ts">
	import {
		BORDER_STROKE_OPTIONS, ORNAMENT_LIMITS, UiChamferButton, UiChamferFrame, UiSlider,
		type CornerKind, type StudioDefaultsConfig
	} from '@chronos-ui/svelte';

	interface Props {
		cornerMode: CornerKind;
		studioDefaults: StudioDefaultsConfig;
		onSetStudioDefaults: (patch: Partial<StudioDefaultsConfig>) => void;
		onResetStudioDefaults: () => void;
	}

	let { cornerMode, studioDefaults, onSetStudioDefaults, onResetStudioDefaults }: Props = $props();
</script>

<UiChamferFrame {cornerMode} carets={false} surfaceVar="var(--ui-base-100)" className="flex flex-col gap-2 p-2.5">
	<div class="flex items-center justify-between gap-1.5" data-testid="settings-geometry-knobs">
		<span class="font-semibold" style="color: var(--ui-muted-content);">Studio Geometry & Ornament Knobs</span>
		<UiChamferButton
			{cornerMode}
			icon="reset"
			label="Reset Defaults"
			variant="ghost"
			testId="reset-studio-defaults-btn"
			onclick={onResetStudioDefaults}
			className="px-2 py-0.5 text-[0.62rem]"
		/>
	</div>

	<UiSlider
		value={studioDefaults.ornamentOffsetRem}
		min={ORNAMENT_LIMITS.minOffsetRem}
		max={ORNAMENT_LIMITS.maxOffsetRem}
		step={ORNAMENT_LIMITS.stepOffsetRem}
		label="Ornament Offset"
		valueLabel={`${studioDefaults.ornamentOffsetRem.toFixed(3)}rem`}
		oninput={(ornamentOffsetRem) => onSetStudioDefaults({ ornamentOffsetRem })}
	/>

	<UiSlider
		value={studioDefaults.ornamentDriftAmpRem}
		min={ORNAMENT_LIMITS.minAmpRem}
		max={ORNAMENT_LIMITS.maxAmpRem}
		step={ORNAMENT_LIMITS.stepOffsetRem}
		label="Drift Amplitude"
		valueLabel={`${studioDefaults.ornamentDriftAmpRem.toFixed(3)}rem`}
		oninput={(ornamentDriftAmpRem) => onSetStudioDefaults({ ornamentDriftAmpRem })}
	/>

	<UiSlider
		value={studioDefaults.ornamentPeriodMs}
		min={ORNAMENT_LIMITS.minPeriodMs}
		max={ORNAMENT_LIMITS.maxPeriodMs}
		step={ORNAMENT_LIMITS.stepPeriodMs}
		label="Animation Period"
		valueLabel={`${studioDefaults.ornamentPeriodMs}ms`}
		oninput={(ornamentPeriodMs) => onSetStudioDefaults({ ornamentPeriodMs })}
	/>

	<div class="flex flex-col gap-1">
		<span class="ui-font-mono text-[0.64rem]" style="color: var(--ui-muted-content);">Border Stroke Weight</span>
		<div class="grid grid-cols-3 gap-1.5">
			{#each BORDER_STROKE_OPTIONS as px (px)}
				<UiChamferButton
					{cornerMode}
					label={`${px}px`}
					active={studioDefaults.borderStrokePx === px}
					variant={studioDefaults.borderStrokePx === px ? 'secondary' : 'surface'}
					onclick={() => onSetStudioDefaults({ borderStrokePx: px })}
					className="w-full py-0.5 text-[0.64rem]"
				/>
			{/each}
		</div>
	</div>
</UiChamferFrame>

<script lang="ts">
	import {
		BUTTON_HOVER_EFFECTS, BUTTON_VARIANT_MODES, CONTROL_DENSITY_MODES, DEFAULT_CONTROL_CONFIG,
		FORM_SURFACE_STYLES, resolveTooltipTierLabel, SLIDER_TRACK_STYLES, TOOLTIP_LEVEL_BOUNDS, UiChamferButton, UiSlider,
		type ButtonControlConfig, type CornerKind, type FormControlConfig, type StudioDefaultsConfig
	} from '@chronos-ui/svelte';
	import SettingsControlPreview from './SettingsControlPreview.svelte';

	interface Props {
		cornerMode: CornerKind;
		studioDefaults: StudioDefaultsConfig;
		onSetControlConfig?: (patch: { buttonConfig?: Partial<ButtonControlConfig>; formConfig?: Partial<FormControlConfig> }) => void;
		onSetTooltipInfoLevel?: (infoLevel: number) => void;
		onReplayHudSequence?: () => void;
	}

	let { cornerMode, studioDefaults, onSetControlConfig, onSetTooltipInfoLevel, onReplayHudSequence }: Props = $props();
	let btn = $derived(studioDefaults.controlConfig?.buttonConfig ?? DEFAULT_CONTROL_CONFIG.buttonConfig);
	let form = $derived(studioDefaults.controlConfig?.formConfig ?? DEFAULT_CONTROL_CONFIG.formConfig);
	let tipLevel = $derived(studioDefaults.tooltipInfoLevel ?? TOOLTIP_LEVEL_BOUNDS.defaultLevel);
	let tipTier = $derived(resolveTooltipTierLabel(tipLevel));
</script>

<div class="flex flex-col gap-2 border p-2.5 text-xs" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-100);" data-testid="settings-controls-card">
	<div class="flex items-center justify-between gap-2">
		<span class="font-semibold" style="color: var(--ui-muted-content);">Controls, Tooltips & HUD Boot</span>
		<span class="ui-font-mono text-[0.62rem]" style="color: var(--ui-primary);">{tipTier} ({tipLevel})</span>
	</div>
	<UiSlider
		value={tipLevel}
		min={TOOLTIP_LEVEL_BOUNDS.minLevel}
		max={TOOLTIP_LEVEL_BOUNDS.maxLevel}
		step={5}
		label="Tooltip Detail Level (0–100)"
		valueLabel={`${tipLevel} · ${tipTier}`}
		testId="settings-tooltip-level-slider"
		oninput={(v) => onSetTooltipInfoLevel?.(v)}
	/>
	{#if onSetControlConfig}
		<div class="flex flex-col gap-1">
			<span class="ui-font-mono text-[0.58rem] uppercase" style="color: var(--ui-muted-content);">Buttons · Variant / Density / Hover</span>
			<div class="grid grid-cols-4 gap-1">
				{#each BUTTON_VARIANT_MODES as v (v)}
					<UiChamferButton {cornerMode} label={v} active={btn.variant === v} variant={btn.variant === v ? 'primary' : 'surface'} testId={`ctrl-btn-variant-${v.toLowerCase()}`} onclick={() => onSetControlConfig({ buttonConfig: { variant: v } })} className="w-full px-1 py-0.5 text-[0.58rem]" />
				{/each}
			</div>
			<div class="grid grid-cols-3 gap-1">
				{#each CONTROL_DENSITY_MODES as d (d)}
					<UiChamferButton {cornerMode} label={d} active={btn.density === d} variant={btn.density === d ? 'secondary' : 'ghost'} onclick={() => onSetControlConfig({ buttonConfig: { density: d } })} className="w-full px-1 py-0.5 text-[0.58rem]" />
				{/each}
			</div>
			<div class="grid grid-cols-4 gap-1">
				{#each BUTTON_HOVER_EFFECTS as h (h)}
					<UiChamferButton {cornerMode} label={h.replace('_', ' ')} active={btn.hoverEffect === h} variant={btn.hoverEffect === h ? 'primary' : 'ghost'} onclick={() => onSetControlConfig({ buttonConfig: { hoverEffect: h } })} className="w-full px-1 py-0.5 text-[0.56rem]" />
				{/each}
			</div>
			<div class="grid grid-cols-3 gap-1">
				<UiChamferButton {cornerMode} label={btn.pressDetent ? 'Detent: On' : 'Detent: Off'} active={btn.pressDetent} variant={btn.pressDetent ? 'secondary' : 'ghost'} onclick={() => onSetControlConfig({ buttonConfig: { pressDetent: !btn.pressDetent } })} className="w-full px-1 py-0.5 text-[0.58rem]" />
				<UiChamferButton {cornerMode} label={btn.uppercaseLabels ? 'UPPER: On' : 'UPPER: Off'} active={btn.uppercaseLabels} variant={btn.uppercaseLabels ? 'secondary' : 'ghost'} onclick={() => onSetControlConfig({ buttonConfig: { uppercaseLabels: !btn.uppercaseLabels } })} className="w-full px-1 py-0.5 text-[0.58rem]" />
				<UiChamferButton {cornerMode} label={`Icon: ${btn.iconPosition}`} active={btn.iconPosition === 'RIGHT'} variant={btn.iconPosition === 'RIGHT' ? 'secondary' : 'ghost'} onclick={() => onSetControlConfig({ buttonConfig: { iconPosition: btn.iconPosition === 'LEFT' ? 'RIGHT' : 'LEFT' } })} className="w-full px-1 py-0.5 text-[0.58rem]" />
			</div>
		</div>
		<div class="flex flex-col gap-1">
			<span class="ui-font-mono text-[0.58rem] uppercase" style="color: var(--ui-muted-content);">Forms · Surface / Density / Track</span>
			<div class="grid grid-cols-3 gap-1">
				{#each FORM_SURFACE_STYLES as fs (fs)}
					<UiChamferButton {cornerMode} label={fs} active={form.surfaceStyle === fs} variant={form.surfaceStyle === fs ? 'secondary' : 'ghost'} onclick={() => onSetControlConfig({ formConfig: { surfaceStyle: fs } })} className="w-full px-1 py-0.5 text-[0.58rem]" />
				{/each}
			</div>
			<div class="grid grid-cols-3 gap-1">
				{#each CONTROL_DENSITY_MODES as fd (fd)}
					<UiChamferButton {cornerMode} label={`Form ${fd.slice(0, 3)}`} active={form.density === fd} variant={form.density === fd ? 'primary' : 'ghost'} onclick={() => onSetControlConfig({ formConfig: { density: fd } })} className="w-full px-1 py-0.5 text-[0.58rem]" />
				{/each}
			</div>
			<div class="grid grid-cols-3 gap-1">
				{#each SLIDER_TRACK_STYLES as st (st)}
					<UiChamferButton {cornerMode} label={st} active={form.sliderTrackStyle === st} variant={form.sliderTrackStyle === st ? 'secondary' : 'ghost'} onclick={() => onSetControlConfig({ formConfig: { sliderTrackStyle: st } })} className="w-full px-1 py-0.5 text-[0.58rem]" />
				{/each}
			</div>
			<div class="grid grid-cols-2 gap-1">
				<UiChamferButton {cornerMode} label={form.focusGlow ? 'Focus Glow: On' : 'Focus Glow: Off'} active={form.focusGlow} variant={form.focusGlow ? 'secondary' : 'ghost'} onclick={() => onSetControlConfig({ formConfig: { focusGlow: !form.focusGlow } })} className="w-full px-1 py-0.5 text-[0.58rem]" />
				<UiChamferButton {cornerMode} label={form.showValidationInline ? 'Inline Val: On' : 'Inline Val: Off'} active={form.showValidationInline} variant={form.showValidationInline ? 'secondary' : 'ghost'} onclick={() => onSetControlConfig({ formConfig: { showValidationInline: !form.showValidationInline } })} className="w-full px-1 py-0.5 text-[0.58rem]" />
			</div>
		</div>
		<SettingsControlPreview {cornerMode} showValidationInline={form.showValidationInline} />
	{/if}
	{#if onReplayHudSequence}
		<UiChamferButton
			{cornerMode}
			icon="star"
			label="Replay HUD Boot Sequence"
			tip="Close Settings and replay the staged ASC perimeter reveal"
			tipLevel={35}
			variant="secondary"
			testId="replay-hud-sequence-btn"
			onclick={onReplayHudSequence}
			className="w-full py-1 text-xs"
		/>
	{/if}
</div>

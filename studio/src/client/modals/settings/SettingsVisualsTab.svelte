<script lang="ts">
	import {
		CONTROL_CUT_LIMITS, CORNER_MODES, CORNER_RADIUS_LIMITS, CSS_CURSOR_STATES, FONT_SCALE_OPTIONS,
		MOTION_PRESETS, MOTION_SPEEDS, remToPx, UI_FRAME_SHAPES, UiChamferButton, UiChamferFrame, UiSlider,
		uiTransition, type AccessibilityPrefs, type CornerAnimation, type CornerEmbellishment, type CornerKind,
		type MotionConfig, type StudioDefaultsConfig, type ThemePack
	} from '@chronos-ui/svelte';
	import SettingsGeometryKnobs from './SettingsGeometryKnobs.svelte';

	interface Props {
		prefs: AccessibilityPrefs; motionConfig: MotionConfig; studioDefaults: StudioDefaultsConfig;
		themes: readonly ThemePack[]; activeThemeId: string; cornerMorphEnabled: boolean;
		onUpdate: (patch: Partial<AccessibilityPrefs>) => void; onSetCornerStyle: (cornerMode: CornerKind) => void;
		onSetCornerRadius: (cornerRadiusRem: number) => void; onSetStudioDefaults: (patch: Partial<StudioDefaultsConfig>) => void;
		onResetStudioDefaults: () => void; onSetMotionConfig: (patch: Partial<MotionConfig>) => void;
		onToggleCornerMorph: (enabled: boolean) => void; onSelectTheme: (themeId: string) => void; onOpenCursors?: () => void;
	}

	let {
		prefs, motionConfig, studioDefaults, themes, activeThemeId, cornerMorphEnabled,
		onUpdate, onSetCornerStyle, onSetCornerRadius, onSetStudioDefaults, onResetStudioDefaults,
		onSetMotionConfig, onToggleCornerMorph, onSelectTheme, onOpenCursors
	}: Props = $props();

	const EMB_ITEMS: readonly { id: CornerEmbellishment; label: string }[] = [
		{ id: 'NONE', label: 'Orn: None' }, { id: 'CARET', label: 'Caret' }, { id: 'BRACKET', label: 'Bracket' }, { id: 'ARC', label: 'Arc' }, { id: 'DOTS', label: 'Dots' },
		{ id: 'TICKS', label: 'Ticks' }, { id: 'DIAMOND', label: 'Diamond' }, { id: 'DOUBLE_LINE', label: 'Dbl Line' }, { id: 'CROSSHAIR', label: 'Crosshair' }
	];
	const ANIM_ITEMS: readonly { id: CornerAnimation; label: string }[] = [
		{ id: 'NONE', label: 'Anim: Off' }, { id: 'BREATHE', label: 'Breathe' }, { id: 'SCAN_GLINT', label: 'Scan Glint' },
		{ id: 'RETICLE_LOCK', label: 'Reticle' }, { id: 'DIAGONAL_DRIFT', label: 'Diag Drift' }, { id: 'ORBIT_TRACE', label: 'Orbit Trace' }
	];
	const CUT_SCOPES = [{ id: 'base', label: 'Base' }, { id: 'station', label: 'Stations' }, { id: 'control', label: 'Controls' }] as const;

	let previewTick = $state(0);
	let previewEmb = $state<CornerEmbellishment>('DIAMOND');
	let previewAnim = $state<CornerAnimation>('ORBIT_TRACE');
	let cutScope = $state<'base' | 'station' | 'control'>('base');
	let shapeIdx = $state(0);
	let previewShape = $derived(UI_FRAME_SHAPES[shapeIdx]);
	let activeCutValue = $derived(cutScope === 'base' ? studioDefaults.baseCornerCutRem : cutScope === 'station' ? studioDefaults.stationCornerCutRem : studioDefaults.controlCornerCutRem);
	let activeCutLimits = $derived(cutScope === 'control' ? CONTROL_CUT_LIMITS : CORNER_RADIUS_LIMITS);
	let activeCutPx = $derived(remToPx(activeCutValue));
	let embCfg = $derived({ offsetRem: studioDefaults.ornamentOffsetRem, amplitudeRem: studioDefaults.ornamentDriftAmpRem, periodMs: studioDefaults.ornamentPeriodMs });

	function replay(): void { previewTick += 1; }
	function cycleShape(): void { shapeIdx = (shapeIdx + 1) % UI_FRAME_SHAPES.length; replay(); }
	function handleScopeSlider(val: number): void {
		if (cutScope === 'base') onSetCornerRadius(val); else if (cutScope === 'station') onSetStudioDefaults({ stationCornerCutRem: val }); else onSetStudioDefaults({ controlCornerCutRem: val });
		replay();
	}
</script>

<div class="grid grid-cols-1 items-stretch gap-4 text-xs lg:grid-cols-[1fr_minmax(16rem,1.25fr)_1fr]" data-testid="settings-visuals-tab">
	<div class="flex flex-col justify-between gap-2.5" data-testid="visuals-left-matrix">
		<div class="flex flex-col gap-1.5">
			<span class="font-semibold" style="color: var(--ui-muted-content);">Embellishments & Effects (5x3)</span>
			<div class="grid grid-cols-3 gap-1.5" data-testid="embellishment-5x3-matrix">
				{#each EMB_ITEMS as emb (emb.id)}
					<UiChamferButton cornerMode={prefs.cornerMode} label={emb.label} active={previewEmb === emb.id} variant={previewEmb === emb.id ? 'primary' : 'surface'} onclick={() => { previewEmb = emb.id; replay(); }} className="w-full px-1.5 py-1 text-[0.64rem]" />
				{/each}
				{#each ANIM_ITEMS as anim (anim.id)}
					<UiChamferButton cornerMode={prefs.cornerMode} label={anim.label} active={previewAnim === anim.id} variant={previewAnim === anim.id ? 'secondary' : 'surface'} onclick={() => { previewAnim = anim.id; replay(); }} className="w-full px-1.5 py-1 text-[0.64rem]" />
				{/each}
			</div>
		</div>
		<div class="flex flex-col gap-1.5">
			<span class="font-semibold" style="color: var(--ui-muted-content);">Semantic Theme Packs</span>
			<div class="grid grid-cols-2 gap-1.5">
				{#each themes as theme (theme.id)}
					<UiChamferButton cornerMode={prefs.cornerMode} label={theme.name} active={activeThemeId === theme.id} variant={activeThemeId === theme.id ? 'primary' : 'surface'} onclick={() => onSelectTheme(theme.id)} className="w-full py-1 text-[0.64rem]" />
				{/each}
			</div>
		</div>
	</div>

	<div class="h-full" data-testid="visuals-center-cartridge">
		<UiChamferFrame cornerMode={prefs.cornerMode} carets={false} surfaceVar="var(--ui-base-100)" className="flex h-full flex-col justify-between gap-2.5 p-3">
			<div class="flex flex-col gap-2">
				<div class="grid grid-cols-3 gap-1.5" data-testid="settings-corner-modes">
					{#each CORNER_MODES as mode (mode)}
						<UiChamferButton cornerMode={prefs.cornerMode} label={mode} active={prefs.cornerMode === mode} variant={prefs.cornerMode === mode ? 'primary' : 'surface'} onclick={() => { onSetCornerStyle(mode); replay(); }} className="w-full py-1 text-[0.68rem]" />
					{/each}
				</div>
				<div class="grid grid-cols-3 gap-1" data-testid="settings-cut-scope">
					{#each CUT_SCOPES as sc (sc.id)}
						<UiChamferButton cornerMode={prefs.cornerMode} label={sc.label} active={cutScope === sc.id} variant={cutScope === sc.id ? 'secondary' : 'ghost'} onclick={() => { cutScope = sc.id; }} className="w-full px-1 py-0.5 text-[0.62rem]" />
					{/each}
				</div>
				<div data-testid="settings-corner-radius-slider">
					<UiSlider value={activeCutValue} min={activeCutLimits.minRem} max={activeCutLimits.maxRem} step={activeCutLimits.stepRem} label={`${cutScope.toUpperCase()} Corner Cut / Radius`} valueLabel={`${activeCutValue.toFixed(3)}rem (${activeCutPx}px)`} oninput={handleScopeSlider} />
				</div>
				<div class="flex items-center justify-between gap-1.5">
					<span class="ui-font-mono text-[0.64rem] font-semibold" style="color: var(--ui-muted-content);">LIVE PREVIEW · {previewShape}</span>
					<div class="flex items-center gap-1">
						<UiChamferButton cornerMode={prefs.cornerMode} label="Replay" variant="secondary" onclick={replay} className="px-2 py-0.5 text-[0.62rem]" />
						<UiChamferButton cornerMode={prefs.cornerMode} label={`Shape (${shapeIdx + 1}/${UI_FRAME_SHAPES.length})`} variant="surface" onclick={cycleShape} testId="shape-cycle-btn" className="px-2 py-0.5 text-[0.62rem]" />
					</div>
				</div>
				{#key previewTick}
					<div in:uiTransition={{ config: motionConfig, offsetPx: 14 }} data-testid="motion-preview-cartridge">
						<UiChamferFrame cornerMode={prefs.cornerMode} cornerRadiusRem={cutScope === 'station' ? studioDefaults.stationCornerCutRem : studioDefaults.baseCornerCutRem} shape={previewShape} cornerEmbellishment={previewEmb} cornerAnimation={previewAnim} embellishmentConfig={embCfg} carets={true} outerClass="min-h-[7.5rem] w-full" className="flex min-h-[7.5rem] flex-col items-center justify-center p-4 text-center">
							<div class="ui-font-mono text-[0.7rem] font-semibold" style="color: var(--ui-accent-vivid, var(--ui-primary));">{motionConfig.preset} · {motionConfig.speed} · {prefs.cornerMode}</div>
							<div class="ui-font-mono text-[0.64rem]" style="color: var(--ui-muted-content);">{previewEmb} · {previewAnim} · {activeCutValue.toFixed(2)}rem</div>
						</UiChamferFrame>
					</div>
				{/key}
			</div>

			<div class="flex flex-col gap-1.5">
				<div class="grid grid-cols-4 gap-1">
					{#each MOTION_SPEEDS as speed (speed)}
						<UiChamferButton cornerMode={prefs.cornerMode} label={speed} active={motionConfig.speed === speed} variant={motionConfig.speed === speed ? 'secondary' : 'surface'} onclick={() => { onSetMotionConfig({ speed }); replay(); }} className="w-full px-1 py-0.5 text-[0.62rem]" />
					{/each}
				</div>
				<div class="grid grid-cols-4 gap-1">
					{#each FONT_SCALE_OPTIONS as scale (scale)}
						<UiChamferButton cornerMode={prefs.cornerMode} label={`${scale}%`} active={prefs.fontScale === scale} variant={prefs.fontScale === scale ? 'primary' : 'surface'} onclick={() => onUpdate({ fontScale: scale })} className="w-full px-1 py-0.5 text-[0.62rem]" />
					{/each}
				</div>
				<div class="grid grid-cols-2 gap-1.5">
					<UiChamferButton cornerMode={prefs.cornerMode} label={prefs.highContrast ? 'WCAG AAA' : 'WCAG AA+'} active={prefs.highContrast} onclick={() => onUpdate({ highContrast: !prefs.highContrast })} className="w-full py-0.5 text-[0.64rem]" />
					<UiChamferButton cornerMode={prefs.cornerMode} label={prefs.dyslexiaSpacing ? 'Dyslexia On' : 'Dyslexia Off'} active={prefs.dyslexiaSpacing} onclick={() => onUpdate({ dyslexiaSpacing: !prefs.dyslexiaSpacing })} className="w-full py-0.5 text-[0.64rem]" />
				</div>
				{#if onOpenCursors}
					<UiChamferButton cornerMode={prefs.cornerMode} icon="cursor" label={`Open Cursor Studio (${CSS_CURSOR_STATES.length} States)`} variant="secondary" onclick={onOpenCursors} testId="open-cursor-studio-btn" className="w-full py-1 text-xs" />
				{/if}
			</div>
		</UiChamferFrame>
	</div>

	<div class="flex flex-col justify-between gap-2.5" data-testid="visuals-right-matrix">
		<div class="flex flex-col gap-1.5">
			<span class="font-semibold" style="color: var(--ui-muted-content);">Svelte 5 Transitions & Kinetics (5x2)</span>
			<div class="grid grid-cols-2 gap-1.5">
				{#each MOTION_PRESETS as preset (preset)}
					<UiChamferButton cornerMode={prefs.cornerMode} label={preset.replace('_', ' ')} active={motionConfig.preset === preset} variant={motionConfig.preset === preset ? 'primary' : 'surface'} onclick={() => { onSetMotionConfig({ preset }); replay(); }} className="w-full py-1 text-[0.64rem]" />
				{/each}
				<UiChamferButton cornerMode={prefs.cornerMode} label={prefs.kineticMotion ? 'Kinetic: On' : 'Kinetic: Off'} active={prefs.kineticMotion} variant={prefs.kineticMotion ? 'secondary' : 'surface'} onclick={() => onUpdate({ kineticMotion: !prefs.kineticMotion })} className="w-full py-1 text-[0.64rem]" />
				<UiChamferButton cornerMode={prefs.cornerMode} label={cornerMorphEnabled ? 'Corner Morph: On' : 'Corner Morph: Off'} active={cornerMorphEnabled} variant={cornerMorphEnabled ? 'secondary' : 'surface'} onclick={() => onToggleCornerMorph(!cornerMorphEnabled)} className="w-full py-1 text-[0.64rem]" />
			</div>
		</div>
		<SettingsGeometryKnobs cornerMode={prefs.cornerMode} {studioDefaults} {onSetStudioDefaults} {onResetStudioDefaults} />
	</div>
</div>

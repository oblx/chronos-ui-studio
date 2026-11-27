<script lang="ts">
	import {
		DEFAULT_SURFACE_MOTION_PROFILES, getActiveMotionSensory, HUD_STAGGER_BOUNDS, MOTION_PROFILES,
		MOTION_PROFILE_SPECS, MOTION_SURFACES, resolveSurfaceMotionMs, SIGNAL_FLOW_SPEEDS, STUDIO_KNOB_BOUNDS,
		STUDIO_KNOB_DEFAULTS, subscribeMotionState, SURFACE_MOTION_BOUNDS, UiChamferButton, UiSlider,
		WIRE_TIME_SCALE_CURVES, type CornerKind, type MotionProfileId, type MotionSensoryConfig,
		type MotionSurfaceId, type StudioDefaultsConfig
	} from '@chronos-ui/svelte';

	interface Props {
		cornerMode: CornerKind;
		studioDefaults?: StudioDefaultsConfig;
		onSetMotionProfile: (patch: Partial<MotionSensoryConfig>) => void;
		onSetStudioDefaults?: (patch: Partial<StudioDefaultsConfig>) => void;
	}

	let { cornerMode, studioDefaults, onSetMotionProfile, onSetStudioDefaults }: Props = $props();
	let sensory = $state(getActiveMotionSensory());
	let activeSurface = $state<MotionSurfaceId>('MODAL');
	$effect(() => subscribeMotionState(() => { sensory = getActiveMotionSensory(); }));

	let staggerMs = $derived(studioDefaults?.hudZoneStaggerMs ?? sensory.hudZoneStaggerMs ?? HUD_STAGGER_BOUNDS.defaultMs);
	let wireTimeScale = $derived(studioDefaults?.wireTimeScaleMultiplier ?? STUDIO_KNOB_DEFAULTS.wireTimeScaleMultiplier);
	let wireCurve = $derived(studioDefaults?.wireTimeScaleCurve ?? STUDIO_KNOB_DEFAULTS.wireTimeScaleCurve);
	let marqueeSpeed = $derived(studioDefaults?.marqueeSpeedPxPerSec ?? STUDIO_KNOB_DEFAULTS.marqueeSpeedPxPerSec);
	let dragFrames = $derived(studioDefaults?.cursorDragTargetFrames ?? STUDIO_KNOB_DEFAULTS.cursorDragTargetFrames);
	let surfaceEnterMs = $derived(resolveSurfaceMotionMs(activeSurface, 'enter', sensory));
	let surfaceExitMs = $derived(resolveSurfaceMotionMs(activeSurface, 'exit', sensory));

	function pickProfile(profile: MotionProfileId): void {
		onSetMotionProfile({ profile });
	}
	function updateStagger(ms: number): void {
		if (onSetStudioDefaults) onSetStudioDefaults({ hudZoneStaggerMs: ms });
		else onSetMotionProfile({ hudZoneStaggerMs: ms });
	}
	function nudgeSurfaceEnter(delta: number): void {
		const cur = sensory.surfaces?.[activeSurface] ?? DEFAULT_SURFACE_MOTION_PROFILES[activeSurface];
		const enterMs = Math.max(SURFACE_MOTION_BOUNDS.minMs, Math.min(SURFACE_MOTION_BOUNDS.maxMs, cur.enterMs + delta));
		onSetMotionProfile({ surfaces: { ...sensory.surfaces, [activeSurface]: { ...cur, enterMs } } });
	}
</script>

<div class="flex flex-col gap-2 border p-2.5 text-xs" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-100);" data-testid="settings-motion-profiles">
	<div class="flex items-center justify-between">
		<span class="font-semibold" style="color: var(--ui-muted-content);">Sensory Motion Engine & Surfaces</span>
		<span class="ui-font-mono text-[0.62rem]" style="color: var(--ui-primary);">{sensory.profile}</span>
	</div>
	<div class="grid grid-cols-2 gap-1 sm:grid-cols-4">
		{#each MOTION_PROFILES as pid (pid)}
			<UiChamferButton {cornerMode} label={MOTION_PROFILE_SPECS[pid].label} active={sensory.profile === pid} variant={sensory.profile === pid ? 'primary' : 'surface'} testId={`motion-profile-${pid.toLowerCase()}`} onclick={() => pickProfile(pid)} className="w-full px-1 py-1 text-[0.62rem]" />
		{/each}
	</div>
	<UiSlider
		value={staggerMs}
		min={HUD_STAGGER_BOUNDS.minMs}
		max={HUD_STAGGER_BOUNDS.maxMs}
		step={HUD_STAGGER_BOUNDS.stepMs}
		label="HUD Reveal Stagger (ms)"
		valueLabel={`${staggerMs}ms`}
		testId="settings-hud-stagger-slider"
		oninput={updateStagger}
	/>
	<div class="flex flex-col gap-1 border-t pt-1.5" style="border-color: var(--ui-border-subtle);">
		<div class="flex items-center justify-between gap-1">
			<span class="ui-font-mono text-[0.58rem] uppercase" style="color: var(--ui-muted-content);">Surface Timing</span>
			<span class="ui-font-mono text-[0.6rem]" style="color: var(--ui-secondary);">{activeSurface}: {surfaceEnterMs}ms / {surfaceExitMs}ms</span>
		</div>
		<div class="grid grid-cols-3 gap-1">
			{#each MOTION_SURFACES as sid (sid)}
				<UiChamferButton {cornerMode} label={sid.replace('_', ' ')} active={activeSurface === sid} variant={activeSurface === sid ? 'secondary' : 'ghost'} onclick={() => { activeSurface = sid; }} className="w-full px-1 py-0.5 text-[0.56rem]" />
			{/each}
		</div>
		<div class="grid grid-cols-2 gap-1">
			<UiChamferButton {cornerMode} label={`-${SURFACE_MOTION_BOUNDS.stepMs}ms Enter`} variant="ghost" onclick={() => nudgeSurfaceEnter(-SURFACE_MOTION_BOUNDS.stepMs)} className="w-full py-0.5 text-[0.58rem]" />
			<UiChamferButton {cornerMode} label={`+${SURFACE_MOTION_BOUNDS.stepMs}ms Enter`} variant="ghost" onclick={() => nudgeSurfaceEnter(SURFACE_MOTION_BOUNDS.stepMs)} className="w-full py-0.5 text-[0.58rem]" />
		</div>
	</div>
	<div class="grid grid-cols-2 gap-1.5">
		<UiChamferButton {cornerMode} label={sensory.ambientPulsesEnabled ? 'Ambient Pulses: On' : 'Ambient Pulses: Off'} active={sensory.ambientPulsesEnabled} variant={sensory.ambientPulsesEnabled ? 'secondary' : 'surface'} onclick={() => onSetMotionProfile({ ambientPulsesEnabled: !sensory.ambientPulsesEnabled })} className="w-full py-0.5 text-[0.62rem]" />
		<UiChamferButton {cornerMode} label={sensory.modalMorphEnabled ? 'Modal Morph: On' : 'Modal Morph: Off'} active={sensory.modalMorphEnabled} variant={sensory.modalMorphEnabled ? 'secondary' : 'surface'} onclick={() => onSetMotionProfile({ modalMorphEnabled: !sensory.modalMorphEnabled })} className="w-full py-0.5 text-[0.62rem]" />
		<UiChamferButton {cornerMode} label={sensory.microDetentsEnabled ? 'Micro Detents: On' : 'Micro Detents: Off'} active={sensory.microDetentsEnabled} variant={sensory.microDetentsEnabled ? 'secondary' : 'surface'} onclick={() => onSetMotionProfile({ microDetentsEnabled: !sensory.microDetentsEnabled })} className="w-full py-0.5 text-[0.62rem]" />
		<div class="grid grid-cols-4 gap-0.5" role="group" aria-label="Signal flow speed">
			{#each SIGNAL_FLOW_SPEEDS as spd (spd)}
				<UiChamferButton {cornerMode} label={`${spd}x`} active={sensory.signalFlowSpeed === spd} variant={sensory.signalFlowSpeed === spd ? 'primary' : 'ghost'} onclick={() => onSetMotionProfile({ signalFlowSpeed: spd })} className="w-full px-0.5 py-0.5 text-[0.58rem]" />
			{/each}
		</div>
	</div>
	{#if onSetStudioDefaults}
		<div class="flex flex-col gap-1.5 border-t pt-1.5" style="border-color: var(--ui-border-subtle);">
			<UiSlider value={wireTimeScale} min={STUDIO_KNOB_BOUNDS.wireTimeScaleMin} max={STUDIO_KNOB_BOUNDS.wireTimeScaleMax} step={STUDIO_KNOB_BOUNDS.wireTimeScaleStep} label="Wire Time-Scale Multiplier" valueLabel={`${wireTimeScale}x`} testId="settings-wire-timescale-slider" oninput={(v) => onSetStudioDefaults({ wireTimeScaleMultiplier: v })} />
			<div class="grid grid-cols-3 gap-1">
				{#each WIRE_TIME_SCALE_CURVES as c (c)}
					<UiChamferButton {cornerMode} label={c === 'LINEAR' ? 'Linear Curve' : 'Log Curve'} active={wireCurve === c} variant={wireCurve === c ? 'primary' : 'ghost'} onclick={() => onSetStudioDefaults({ wireTimeScaleCurve: c })} testId={`settings-wire-curve-${c.toLowerCase()}`} className="w-full py-0.5 text-[0.58rem]" />
				{/each}
				<UiChamferButton {cornerMode} label={dragFrames ? 'Drag Frames: On' : 'Drag Frames: Off'} active={dragFrames} variant={dragFrames ? 'secondary' : 'ghost'} onclick={() => onSetStudioDefaults({ cursorDragTargetFrames: !dragFrames })} testId="settings-cursor-drag-frames-toggle" className="w-full py-0.5 text-[0.58rem]" />
			</div>
			<UiSlider value={marqueeSpeed} min={STUDIO_KNOB_BOUNDS.marqueeSpeedMin} max={STUDIO_KNOB_BOUNDS.marqueeSpeedMax} step={STUDIO_KNOB_BOUNDS.marqueeSpeedStep} label="Hover-Marquee Speed (px/s)" valueLabel={`${marqueeSpeed}px/s`} testId="settings-marquee-speed-slider" oninput={(v) => onSetStudioDefaults({ marqueeSpeedPxPerSec: v })} />
		</div>
	{/if}
</div>

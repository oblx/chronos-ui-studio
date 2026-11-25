<script lang="ts">
	import {
		DEFAULT_SURFACE_MOTION_PROFILES, getActiveMotionSensory, HUD_STAGGER_BOUNDS, MOTION_PROFILES,
		MOTION_PROFILE_SPECS, resolveSurfaceMotionMs, SIGNAL_FLOW_SPEEDS, subscribeMotionState,
		UiChamferButton, UiSlider, type CornerKind, type MotionProfileId, type MotionSensoryConfig,
		type MotionSurfaceId, type StudioDefaultsConfig
	} from '@chronos-ui/svelte';

	interface Props {
		cornerMode: CornerKind;
		studioDefaults?: StudioDefaultsConfig;
		onSetMotionProfile: (patch: Partial<MotionSensoryConfig>) => void;
		onSetStudioDefaults?: (patch: Partial<StudioDefaultsConfig>) => void;
	}

	const SURFACES: readonly MotionSurfaceId[] = ['MODAL', 'DRAWER', 'HUD_ZONE', 'TOOLTIP', 'NODE', 'CONTROL'] as const;

	let { cornerMode, studioDefaults, onSetMotionProfile, onSetStudioDefaults }: Props = $props();
	let sensory = $state(getActiveMotionSensory());
	let activeSurface = $state<MotionSurfaceId>('MODAL');
	$effect(() => subscribeMotionState(() => { sensory = getActiveMotionSensory(); }));

	let staggerMs = $derived(studioDefaults?.hudZoneStaggerMs ?? sensory.hudZoneStaggerMs ?? HUD_STAGGER_BOUNDS.defaultMs);
	let surfaceEnterMs = $derived(resolveSurfaceMotionMs(activeSurface, 'enter', sensory));
	let surfaceExitMs = $derived(resolveSurfaceMotionMs(activeSurface, 'exit', sensory));

	function pickProfile(profile: MotionProfileId): void {
		onSetMotionProfile({ profile });
	}
	function updateStagger(ms: number): void {
		onSetMotionProfile({ hudZoneStaggerMs: ms });
		onSetStudioDefaults?.({ hudZoneStaggerMs: ms });
	}
	function nudgeSurfaceEnter(delta: number): void {
		const cur = sensory.surfaces?.[activeSurface] ?? DEFAULT_SURFACE_MOTION_PROFILES[activeSurface];
		const enterMs = Math.max(0, Math.min(800, cur.enterMs + delta));
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
			{#each SURFACES as sid (sid)}
				<UiChamferButton {cornerMode} label={sid.replace('_', ' ')} active={activeSurface === sid} variant={activeSurface === sid ? 'secondary' : 'ghost'} onclick={() => { activeSurface = sid; }} className="w-full px-1 py-0.5 text-[0.56rem]" />
			{/each}
		</div>
		<div class="grid grid-cols-2 gap-1">
			<UiChamferButton {cornerMode} label="-40ms Enter" variant="ghost" onclick={() => nudgeSurfaceEnter(-40)} className="w-full py-0.5 text-[0.58rem]" />
			<UiChamferButton {cornerMode} label="+40ms Enter" variant="ghost" onclick={() => nudgeSurfaceEnter(40)} className="w-full py-0.5 text-[0.58rem]" />
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
</div>

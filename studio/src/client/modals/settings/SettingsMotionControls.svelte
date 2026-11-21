<script lang="ts">
	import {
		getActiveMotionSensory, MOTION_PROFILES, MOTION_PROFILE_SPECS, SIGNAL_FLOW_SPEEDS,
		subscribeMotionState, UiChamferButton, type CornerKind, type MotionProfileId, type MotionSensoryConfig
	} from '@chronos-ui/svelte';

	interface Props {
		cornerMode: CornerKind;
		onSetMotionProfile: (patch: Partial<MotionSensoryConfig>) => void;
	}

	let { cornerMode, onSetMotionProfile }: Props = $props();
	let sensory = $state(getActiveMotionSensory());
	$effect(() => subscribeMotionState(() => { sensory = getActiveMotionSensory(); }));

	function pickProfile(profile: MotionProfileId): void {
		onSetMotionProfile({ profile });
	}
</script>

<div class="flex flex-col gap-2 border p-2.5 text-xs" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-100);" data-testid="settings-motion-profiles">
	<div class="flex items-center justify-between">
		<span class="font-semibold" style="color: var(--ui-muted-content);">Sensory Motion Profile (ADHD-Friendly)</span>
		<span class="ui-font-mono text-[0.62rem]" style="color: var(--ui-primary);">{sensory.profile}</span>
	</div>
	<div class="grid grid-cols-2 gap-1 sm:grid-cols-4">
		{#each MOTION_PROFILES as pid (pid)}
			<UiChamferButton
				{cornerMode}
				label={MOTION_PROFILE_SPECS[pid].label}
				active={sensory.profile === pid}
				variant={sensory.profile === pid ? 'primary' : 'surface'}
				testId={`motion-profile-${pid.toLowerCase()}`}
				onclick={() => pickProfile(pid)}
				className="w-full px-1 py-1 text-[0.62rem]"
			/>
		{/each}
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

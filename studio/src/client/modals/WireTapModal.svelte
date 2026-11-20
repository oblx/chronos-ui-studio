<script lang="ts">
	import { UiBadge, UiChamferButton, UiModalFooter, UiModalShell, UiWireInspector, type CornerKind, type WireTraceRecord } from '@chronos-ui/svelte';
	import { CAPABILITY_BITS } from '@studio/config';
	import { hasCapability } from '@studio/core';
	import type { StudioUser } from '../state';

	interface Props {
		open: boolean;
		traces: readonly WireTraceRecord[];
		user: StudioUser | null;
		cornerMode: CornerKind;
		onDevArchitectLogin: () => void;
		onRefresh: () => void;
		onClose: () => void;
	}

	let { open, traces, user, cornerMode, onDevArchitectLogin, onRefresh, onClose }: Props = $props();
	let hasBit28 = $derived(Boolean(user && hasCapability(user.capabilityMask, CAPABILITY_BITS.ADMIN_WIRE_OBSERVE)));
</script>

<UiModalShell
	{open}
	title="Dual-Spine Live Wire Observatory"
	subtitle="CLIENT_DAG and SERVER_DAG telemetry gated by capability bit 28"
	icon="wire"
	{cornerMode}
	sizeTier="WIDE"
	{onClose}
>
	<div class="flex flex-col gap-3">
		<div class="flex flex-wrap items-center justify-between gap-2 p-2.5" style="background-color: var(--ui-base-100); border: var(--ui-hairline) solid var(--ui-border-subtle);">
			<div class="flex items-center gap-2">
				<UiBadge text={hasBit28 ? 'BIT 28 UNLOCKED' : 'CLIENT SPINE ONLY'} tone={hasBit28 ? 'success' : 'warning'} />
				<span class="text-xs" style="color: var(--ui-muted-content);">
					{hasBit28 ? 'Unified CLIENT_DAG + SERVER_DAG active.' : 'Sign in as Architect (ADMIN_WIRE_OBSERVE) to stream SERVER_DAG.'}
				</span>
			</div>
			{#if !hasBit28}
				<UiChamferButton {cornerMode} icon="lock" label="Unlock Bit 28 (Dev)" variant="primary" onclick={onDevArchitectLogin} />
			{:else}
				<UiChamferButton {cornerMode} icon="reset" label="Refresh Server Spine" onclick={onRefresh} />
			{/if}
		</div>
		<UiWireInspector {traces} {cornerMode} />
	</div>
	{#snippet footer()}
		<UiModalFooter>
			<UiChamferButton {cornerMode} label="Close" variant="primary" onclick={onClose} />
		</UiModalFooter>
	{/snippet}
</UiModalShell>

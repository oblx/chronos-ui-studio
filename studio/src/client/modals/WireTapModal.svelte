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
		onClearBuffer?: () => void;
		onClose: () => void;
	}

	let { open, traces, user, cornerMode, onDevArchitectLogin, onRefresh, onClearBuffer, onClose }: Props = $props();
	let hasBit28 = $derived(Boolean(user && hasCapability(user.capabilityMask, CAPABILITY_BITS.ADMIN_WIRE_OBSERVE)));
</script>

<UiModalShell
	{open}
	title="Dual-Spine Live Wire Observatory"
	subtitle="Virtual 2D CLIENT_DAG + SERVER_DAG topology & coalesced burst ledger"
	icon="wire"
	{cornerMode}
	sizeTier="FULL_STAGE"
	{onClose}
>
	<div class="flex min-h-0 flex-1 flex-col gap-3">
		<div class="flex flex-wrap items-center justify-between gap-2 p-2.5" style="background-color: var(--ui-base-100); border: var(--ui-hairline) solid var(--ui-border-subtle);">
			<div class="flex items-center gap-2">
				<UiBadge text={hasBit28 ? 'BIT 28 UNLOCKED' : 'CLIENT SPINE ONLY'} tone={hasBit28 ? 'success' : 'warning'} />
				<span class="text-xs" style="color: var(--ui-muted-content);">
					{hasBit28 ? 'Unified CLIENT_DAG + SERVER_DAG active.' : 'Sign in as Architect (ADMIN_WIRE_OBSERVE) to unlock live SERVER_DAG telemetry.'}
				</span>
			</div>
			{#if !hasBit28}
				<UiChamferButton {cornerMode} icon="lock" label="Unlock Bit 28 (Dev)" variant="primary" onclick={onDevArchitectLogin} />
			{:else}
				<UiChamferButton {cornerMode} icon="reset" label="Refresh Server Spine" onclick={onRefresh} />
			{/if}
		</div>
		<UiWireInspector {traces} {hasBit28} {cornerMode} {onClearBuffer} />
	</div>
	{#snippet footer()}
		<UiModalFooter>
			<UiChamferButton {cornerMode} label="Close" variant="primary" onclick={onClose} />
		</UiModalFooter>
	{/snippet}
</UiModalShell>

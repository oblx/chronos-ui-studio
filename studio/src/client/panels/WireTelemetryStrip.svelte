<script lang="ts">
	import { UiBadge, UiChamferButton, UiChamferFrame, ZONE_CORNER_PRESETS, type CornerKind, type WireTraceRecord } from '@chronos-ui/svelte';
	import type { ZoneBlueprintConfig } from '@studio/config';

	interface Props {
		mode: 'LEFT_STREAM' | 'CENTER_CONSOLE';
		traces?: readonly WireTraceRecord[];
		cornerMode: CornerKind;
		zoneConfig?: ZoneBlueprintConfig;
		lastOutput?: string;
		onOpenWire?: () => void;
		onTogglePolarity?: () => void;
		onToggleCornerMode?: () => void;
		onStartSpotlight?: () => void;
		onOpenTome?: () => void;
		onOpenExport?: () => void;
		onOpenSettings?: () => void;
		onRunCommand?: (cmd: string) => void;
	}

	let {
		mode,
		traces = [],
		cornerMode,
		zoneConfig,
		lastOutput = '',
		onOpenWire,
		onTogglePolarity,
		onToggleCornerMode,
		onStartSpotlight,
		onOpenTome,
		onOpenExport,
		onOpenSettings,
		onRunCommand
	}: Props = $props();

	let cmdInput = $state('');
	let latest = $derived(traces.slice(-3).reverse());

	function formatTime(ts: number): string {
		const d = new Date(ts);
		return `${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
	}

	function submitCommand(e: SubmitEvent): void {
		e.preventDefault();
		const text = cmdInput.trim();
		if (!text) return;
		onRunCommand?.(text);
		cmdInput = '';
	}
</script>

{#if mode === 'LEFT_STREAM'}
	<UiChamferFrame
		corners={zoneConfig?.corners ?? ZONE_CORNER_PRESETS.BOTTOM_LEFT}
		{cornerMode}
		cornerRadiusRem={zoneConfig?.cornerRadiusRem}
		cutTier="station"
		shape={zoneConfig?.shape ?? 'BOX'}
		cornerEmbellishment={zoneConfig?.cornerEmbellishment}
		cornerAnimation={zoneConfig?.cornerAnimation ?? 'NONE'}
		carets={true}
		bezel={true}
		className="px-3.5 py-2.5"
	>
		<div class="flex h-full flex-col justify-between gap-1">
			<div class="flex items-center justify-between gap-2 pb-1" style="border-bottom: var(--ui-hairline) solid var(--ui-border-subtle);">
				<span class="ui-font-mono text-[0.7rem] font-bold tracking-wider" style="color: var(--ui-primary);">LIVE STREAM</span>
				<UiBadge text={`${traces.length} ops`} tone="info" />
			</div>
			<div class="flex flex-col gap-0.5 overflow-hidden">
				{#each latest as item (`${item.spine}-${item.seq}`)}
					<div class="ui-font-mono flex items-center justify-between gap-1.5 truncate text-[0.65rem]">
						<span class="shrink-0" style="color: var(--ui-muted-content);">{formatTime(item.timestamp)}</span>
						<span class="truncate" style="color: var(--ui-secondary);">[{item.kind.replace('UI_', '')}]</span>
						<span class="shrink-0" style="color: var(--ui-muted-content);">{item.stageMs.toFixed(1)}ms</span>
					</div>
				{:else}
					<div class="ui-font-mono text-[0.68rem]" style="color: var(--ui-muted-content);">Awaiting DAG envelope events...</div>
				{/each}
			</div>
		</div>
	</UiChamferFrame>
{:else}
	<UiChamferFrame corners={ZONE_CORNER_PRESETS.BOTTOM_CENTER} {cornerMode} carets={true} bezel={true} className="px-4 py-2">
		<div class="flex h-full flex-col justify-between gap-1">
			<div class="grid grid-cols-6 gap-1.5">
				<UiChamferButton {cornerMode} icon="sun" label="1 Polarity" onclick={onTogglePolarity} className="px-2 py-0.5" />
				<UiChamferButton {cornerMode} icon="layers" label={`2 ${cornerMode}`} onclick={onToggleCornerMode} className="px-2 py-0.5" />
				<UiChamferButton {cornerMode} icon="spotlight" label="3 Tour" onclick={onStartSpotlight} className="px-2 py-0.5" />
				<UiChamferButton {cornerMode} icon="wire" label="4 Wire" onclick={onOpenWire} className="px-2 py-0.5" />
				<UiChamferButton {cornerMode} icon="book" label="5 Tome" onclick={onOpenTome} className="px-2 py-0.5" />
				<UiChamferButton {cornerMode} icon="export" label="6 Export" variant="primary" onclick={onOpenExport} className="px-2 py-0.5" />
			</div>
			<form onsubmit={submitCommand} class="flex items-center gap-1.5">
				<input
					type="text"
					bind:value={cmdInput}
					placeholder="Command: /polarity, /corners, /tour, /wire, /tome, /reset..."
					aria-label="Studio command prompt"
					class="ui-font-mono min-w-0 flex-1 px-2.5 py-1 text-xs"
					style="background-color: var(--ui-base-100); color: var(--ui-base-content); border: var(--ui-hairline) solid var(--ui-border-subtle);"
				/>
				<UiChamferButton {cornerMode} type="submit" label="Run" variant="secondary" className="py-1" />
				<UiChamferButton {cornerMode} icon="settings" label="Prefs" onclick={onOpenSettings} className="py-1" />
			</form>
			<div class="ui-font-mono flex items-center justify-between gap-2 text-[0.65rem]" style="color: var(--ui-muted-content);">
				<span class="truncate">{lastOutput}</span>
				<span class="shrink-0" style="color: var(--ui-success);">DAG ACYCLIC</span>
			</div>
		</div>
	</UiChamferFrame>
{/if}

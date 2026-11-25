<script lang="ts">
	import {
		AUTO_SAVE_MODES, HISTORY_LIMIT_BOUNDS, HUD_METRICS, PERIMETER_GUTTER_OPTIONS, UiChamferButton,
		UiProgressGauge, UiSlider, type CornerKind, type StudioDefaultsConfig
	} from '@chronos-ui/svelte';

	interface Props {
		cornerMode: CornerKind;
		studioDefaults: StudioDefaultsConfig;
		projectNodeCount: number;
		traceCount: number;
		undoCount?: number;
		redoCount?: number;
		lowMemoryMode: boolean;
		onToggleLowMemory: (next: boolean) => void;
		onSetStudioDefaults: (patch: Partial<StudioDefaultsConfig>) => void;
		onSetHistoryLimit?: (limit: number) => void;
		onResetStudioDefaults: () => void;
	}

	let {
		cornerMode, studioDefaults, projectNodeCount, traceCount, undoCount = 0, redoCount = 0, lowMemoryMode,
		onToggleLowMemory, onSetStudioDefaults, onSetHistoryLimit, onResetStudioDefaults
	}: Props = $props();

	let domNodes = $derived(typeof document !== 'undefined' ? document.getElementsByTagName('*').length : 0);
	let historyLimit = $derived(studioDefaults.historyLimit ?? HISTORY_LIMIT_BOUNDS.defaultLimit);
	let heapMb = $derived.by(() => {
		const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
		return mem ? (mem.usedJSHeapSize / (1024 * 1024)).toFixed(1) : 'N/A';
	});
</script>

<div class="grid grid-cols-1 gap-3 text-xs md:grid-cols-2" data-testid="settings-runtime-tab">
	<div class="flex flex-col gap-2.5 border p-3" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-100);">
		<span class="font-semibold" style="color: var(--ui-muted-content);">Live Runtime Telemetry</span>
		<div class="grid grid-cols-2 gap-2 ui-font-mono">
			<div>DOM Nodes: <strong>{domNodes}</strong></div>
			<div>Canvas Nodes: <strong>{projectNodeCount}</strong></div>
			<div>JS Heap: <strong>{heapMb} MB</strong></div>
			<div>Ring Cap: <strong>{traceCount}/{HUD_METRICS.ringCapacity}</strong></div>
		</div>
		<UiProgressGauge label="WireTelemetryRing Utilization" value={traceCount} max={HUD_METRICS.ringCapacity} />
		<div class="flex flex-col gap-1 pt-1">
			<UiSlider
				value={historyLimit}
				min={HISTORY_LIMIT_BOUNDS.minLimit}
				max={HISTORY_LIMIT_BOUNDS.maxLimit}
				step={1}
				label="Undo/Redo History Limit (IndexedDB)"
				valueLabel={`${historyLimit} steps (${undoCount} undo · ${redoCount} redo)`}
				testId="settings-history-limit-slider"
				oninput={(v) => onSetHistoryLimit?.(v)}
			/>
		</div>
		<div class="flex flex-col gap-1 pt-1">
			<span class="ui-font-mono text-[0.66rem]" style="color: var(--ui-muted-content);">Perimeter Gutter Spacing</span>
			<div class="grid grid-cols-3 gap-1.5">
				{#each PERIMETER_GUTTER_OPTIONS as rem (rem)}
					<UiChamferButton {cornerMode} label={`${rem}rem`} active={studioDefaults.perimeterGutterRem === rem} variant={studioDefaults.perimeterGutterRem === rem ? 'secondary' : 'surface'} onclick={() => onSetStudioDefaults({ perimeterGutterRem: rem })} className="w-full py-0.5 text-[0.64rem]" />
				{/each}
			</div>
		</div>
	</div>

	<div class="flex flex-col justify-between gap-2.5 border p-3" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-100);">
		<div class="flex flex-col gap-1.5">
			<span class="font-semibold" style="color: var(--ui-muted-content);">512MB SBC Low-Memory & Auto-Save Policy</span>
			<p class="leading-relaxed" style="color: var(--ui-muted-content);">
				Reduces canvas scanline overhead for constrained single-board hardware and tunes automatic project persistence. History snapshots remain local in browser IndexedDB.
			</p>
			<div class="grid grid-cols-3 gap-1.5 pt-1">
				{#each AUTO_SAVE_MODES as mode (mode)}
					<UiChamferButton {cornerMode} label={mode.replace('_', ' ')} active={studioDefaults.autoSaveMode === mode} variant={studioDefaults.autoSaveMode === mode ? 'primary' : 'surface'} onclick={() => onSetStudioDefaults({ autoSaveMode: mode })} className="w-full px-1 py-0.5 text-[0.62rem]" />
				{/each}
			</div>
		</div>
		<div class="flex flex-wrap items-center justify-between gap-2">
			<UiChamferButton
				{cornerMode}
				icon="cpu"
				label={lowMemoryMode ? '512MB Low-Memory: Active' : '512MB Low-Memory: Off'}
				active={lowMemoryMode}
				variant={lowMemoryMode ? 'primary' : 'surface'}
				onclick={() => onToggleLowMemory(!lowMemoryMode)}
			/>
			<UiChamferButton {cornerMode} icon="reset" label="Reset Defaults" variant="ghost" onclick={onResetStudioDefaults} />
		</div>
	</div>
</div>

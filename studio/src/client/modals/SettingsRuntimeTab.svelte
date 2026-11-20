<script lang="ts">
	import { HUD_METRICS, UiChamferButton, UiProgressGauge, type CornerKind } from '@chronos-ui/svelte';

	interface Props {
		cornerMode: CornerKind;
		projectNodeCount: number;
		traceCount: number;
		lowMemoryMode: boolean;
		onToggleLowMemory: (next: boolean) => void;
	}

	let { cornerMode, projectNodeCount, traceCount, lowMemoryMode, onToggleLowMemory }: Props = $props();

	let domNodes = $derived(typeof document !== 'undefined' ? document.getElementsByTagName('*').length : 0);
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
	</div>

	<div class="flex flex-col justify-between gap-2.5 border p-3" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-100);">
		<div class="flex flex-col gap-1">
			<span class="font-semibold" style="color: var(--ui-muted-content);">512MB SBC Low-Memory Mode</span>
			<p class="leading-relaxed" style="color: var(--ui-muted-content);">
				Reduces canvas scanline overhead and trims off-viewport node hydration for constrained single-board hardware.
			</p>
		</div>
		<div>
			<UiChamferButton
				{cornerMode}
				icon="cpu"
				label={lowMemoryMode ? '512MB Low-Memory: Active' : '512MB Low-Memory: Off'}
				active={lowMemoryMode}
				variant={lowMemoryMode ? 'primary' : 'surface'}
				onclick={() => onToggleLowMemory(!lowMemoryMode)}
			/>
		</div>
	</div>
</div>

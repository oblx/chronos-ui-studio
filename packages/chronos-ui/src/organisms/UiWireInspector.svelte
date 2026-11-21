<script lang="ts">
	import { UiBadge, UiChamferButton } from '../atoms';
	import type { CornerKind } from '../tokens';
	import type { WireSpine, WireTraceRecord } from '../wire';
	import { coalesceBurstTraces, filterTracesByDagNode, UiWireDagGraph } from './wire-observatory';

	interface Props {
		traces: readonly WireTraceRecord[];
		hasBit28?: boolean;
		cornerMode?: CornerKind;
		onClearBuffer?: () => void;
	}

	let { traces, hasBit28 = false, cornerMode = 'CHAMFER', onClearBuffer }: Props = $props();
	let spineFilter = $state<'ALL' | WireSpine>('ALL');
	let viewMode = $state<'SPLIT' | 'GRAPH' | 'TABLE'>('SPLIT');
	let query = $state('');
	let paused = $state(false);
	let frozenTraces = $state.raw<readonly WireTraceRecord[]>([]);
	let selectedNodeId = $state<string | null>(null);
	let selectedTraceId = $state<string | null>(null);
	let expandedBurstKeys = $state<ReadonlySet<string>>(new Set());

	let liveTraces = $derived(paused ? frozenTraces : traces);
	let filtered = $derived.by(() => {
		const byNode = filterTracesByDagNode(liveTraces, selectedNodeId);
		const q = query.trim().toLowerCase();
		return byNode
			.filter((t) => (spineFilter === 'ALL' ? true : t.spine === spineFilter))
			.filter((t) => (!q ? true : t.kind.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q)))
			.slice()
			.reverse();
	});
	let bursts = $derived(coalesceBurstTraces(filtered));
	let activeTrace = $derived(filtered.find((r) => `${r.spine}-${r.seq}-${r.envelopeId}` === selectedTraceId) ?? null);

	function togglePause(): void {
		if (!paused) frozenTraces = [...traces];
		paused = !paused;
	}
	function toggleBurst(key: string): void {
		const next = new Set(expandedBurstKeys);
		if (next.has(key)) next.delete(key); else next.add(key);
		expandedBurstKeys = next;
	}
	function exportTraceJson(): void {
		if (typeof document === 'undefined') return;
		const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url; a.download = `chronos-wire-trace-${Date.now()}.json`; a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="flex min-h-0 flex-1 flex-col gap-2.5" data-testid="wire-observatory-root">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<div class="flex flex-wrap items-center gap-1.5">
			<UiChamferButton {cornerMode} label="All Spines" active={spineFilter === 'ALL'} onclick={() => { spineFilter = 'ALL'; }} />
			<UiChamferButton {cornerMode} label="Client DAG" active={spineFilter === 'CLIENT_DAG'} onclick={() => { spineFilter = 'CLIENT_DAG'; }} />
			<UiChamferButton {cornerMode} label="Server DAG" active={spineFilter === 'SERVER_DAG'} onclick={() => { spineFilter = 'SERVER_DAG'; }} />
			<span class="mx-0.5 h-5 w-px" style="background-color: var(--ui-border-subtle);"></span>
			{#each ['SPLIT', 'GRAPH', 'TABLE'] as const as mode (mode)}
				<UiChamferButton {cornerMode} label={mode[0] + mode.slice(1).toLowerCase()} active={viewMode === mode} variant={viewMode === mode ? 'secondary' : 'ghost'} testId={`wire-view-${mode.toLowerCase()}`} onclick={() => { viewMode = mode; }} className="px-2 py-0.5 text-[0.68rem]" />
			{/each}
		</div>
		<div class="flex flex-1 flex-wrap items-center justify-end gap-1.5">
			<input
				type="search"
				bind:value={query}
				placeholder="Filter intents or summary..."
				aria-label="Filter wire traces"
				data-testid="wire-filter-input"
				class="min-w-[16rem] flex-1 px-2.5 py-1 text-xs"
				style="background-color: var(--ui-base-100); color: var(--ui-base-content); border: var(--ui-hairline) solid var(--ui-border-subtle);"
			/>
			<UiChamferButton {cornerMode} label={paused ? 'Resume' : 'Pause'} variant={paused ? 'primary' : 'surface'} onclick={togglePause} className="px-2 py-1 text-xs" />
			{#if onClearBuffer}<UiChamferButton {cornerMode} label="Clear Buffer" variant="ghost" onclick={() => { selectedTraceId = null; onClearBuffer(); }} className="px-2 py-1 text-xs" />{/if}
			<UiChamferButton {cornerMode} icon="export" label="Export JSON" variant="surface" onclick={exportTraceJson} className="px-2 py-1 text-xs" />
		</div>
	</div>

	{#if selectedNodeId}
		<div class="ui-font-mono flex items-center justify-between gap-2 px-2.5 py-1 text-[0.68rem]" style="background-color: color-mix(in srgb, var(--ui-primary) 14%, var(--ui-base-100)); border: var(--ui-hairline) solid var(--ui-primary);">
			<span>Scoped to DAG Stage: <strong>{selectedNodeId}</strong> ({filtered.length} records)</span>
			<button type="button" onclick={() => { selectedNodeId = null; }} class="underline">Clear Filter</button>
		</div>
	{/if}

	{#if viewMode === 'SPLIT' || viewMode === 'GRAPH'}
		<UiWireDagGraph traces={liveTraces} {hasBit28} {cornerMode} {selectedNodeId} {activeTrace} {paused} onSelectNode={(id) => { selectedNodeId = id; }} />
	{/if}

	{#if viewMode === 'SPLIT' || viewMode === 'TABLE'}
		<div class="ui-scroll-deck min-h-[10rem] flex-1 overflow-y-auto" style="border: var(--ui-hairline) solid var(--ui-border-subtle); max-height: {viewMode === 'TABLE' ? '34rem' : '16rem'};">
			<table class="w-full border-collapse text-left text-xs">
				<thead style="background-color: var(--ui-base-300); color: var(--ui-muted-content);">
					<tr>
						<th class="px-2 py-1.5">#</th><th class="px-2 py-1.5">Spine</th><th class="px-2 py-1.5">Intent / Burst</th>
						<th class="px-2 py-1.5">Origin</th><th class="px-2 py-1.5 text-right">ms</th><th class="px-2 py-1.5">Status</th>
					</tr>
				</thead>
				<tbody>
					{#if bursts.length === 0}
						<tr><td colspan="6" class="px-3 py-4 text-center" style="color: var(--ui-muted-content);">No wire telemetry records match the active filter.</td></tr>
					{:else}
						{#each bursts as burst (burst.key)}
							{@const row = burst.representative}
							{@const isSel = selectedTraceId === burst.key}
							<tr
								onclick={() => { selectedTraceId = isSel ? null : burst.key; if (burst.count > 1) toggleBurst(burst.key); }}
								class="cursor-pointer"
								style="border-top: var(--ui-hairline) solid var(--ui-border-subtle); background-color: {isSel ? 'color-mix(in srgb, var(--ui-primary) 16%, transparent)' : 'transparent'};"
							>
								<td class="ui-font-mono px-2 py-1.5">{row.seq}</td>
								<td class="px-2 py-1.5"><UiBadge text={row.spine === 'CLIENT_DAG' ? 'CLIENT' : 'SERVER'} tone={row.spine === 'CLIENT_DAG' ? 'info' : 'secondary'} /></td>
								<td class="ui-font-mono px-2 py-1.5" style="color: var(--ui-base-content);">
									<span>{row.kind}</span>
									{#if burst.count > 1}
										<span class="ml-1.5 px-1.5 py-0.5 text-[0.64rem] font-semibold" data-testid="wire-burst-pill" style="background-color: var(--ui-base-300); color: var(--ui-primary);">x{burst.count} · {burst.avgMs.toFixed(2)}ms avg</span>
									{/if}
								</td>
								<td class="ui-font-mono px-2 py-1.5" style="color: var(--ui-muted-content);">{row.origin}</td>
								<td class="ui-font-mono px-2 py-1.5 text-right">{burst.avgMs.toFixed(2)}</td>
								<td class="px-2 py-1.5"><UiBadge text={row.ok ? 'OK' : 'REJECT'} tone={row.ok ? 'success' : 'error'} /></td>
							</tr>
							{#if burst.count > 1 && expandedBurstKeys.has(burst.key)}
								{#each burst.rows as sub (`${sub.spine}-${sub.seq}-${sub.envelopeId}`)}
									<tr style="border-top: 1px dashed var(--ui-border-subtle); background-color: var(--ui-base-100);">
										<td class="ui-font-mono px-2 py-1 pl-5 text-[0.65rem]" style="color: var(--ui-muted-content);">{sub.seq}</td>
										<td colspan="3" class="ui-font-mono px-2 py-1 text-[0.65rem]" style="color: var(--ui-muted-content);">{sub.summary}</td>
										<td class="ui-font-mono px-2 py-1 text-right text-[0.65rem]">{sub.stageMs.toFixed(2)}</td>
										<td class="px-2 py-1 text-[0.65rem]">{sub.ok ? 'OK' : 'REJECT'}</td>
									</tr>
								{/each}
							{/if}
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	{/if}
</div>

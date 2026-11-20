<script lang="ts">
	import { UiBadge, UiChamferButton } from '../atoms';
	import type { CornerKind } from '../tokens';
	import type { WireSpine, WireTraceRecord } from '../wire';

	interface Props {
		traces: readonly WireTraceRecord[];
		cornerMode?: CornerKind;
	}

	let { traces, cornerMode = 'CHAMFER' }: Props = $props();
	let spineFilter = $state<'ALL' | WireSpine>('ALL');
	let query = $state('');

	let filtered = $derived(
		traces
			.filter((t) => (spineFilter === 'ALL' ? true : t.spine === spineFilter))
			.filter((t) => {
				const q = query.trim().toLowerCase();
				if (!q) return true;
				return t.kind.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q);
			})
			.slice()
			.reverse()
	);
</script>

<div class="flex flex-col gap-3">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<div class="flex items-center gap-1.5">
			<UiChamferButton {cornerMode} label="All Spines" active={spineFilter === 'ALL'} onclick={() => (spineFilter = 'ALL')} />
			<UiChamferButton {cornerMode} label="Client DAG" active={spineFilter === 'CLIENT_DAG'} onclick={() => (spineFilter = 'CLIENT_DAG')} />
			<UiChamferButton {cornerMode} label="Server DAG" active={spineFilter === 'SERVER_DAG'} onclick={() => (spineFilter = 'SERVER_DAG')} />
		</div>
		<input
			type="search"
			bind:value={query}
			placeholder="Filter intents or summaries..."
			aria-label="Filter wire traces"
			class="px-2.5 py-1 text-xs"
			style="background-color: var(--ui-base-100); color: var(--ui-base-content); border: var(--ui-hairline) solid var(--ui-border-subtle);"
		/>
	</div>

	<div class="ui-scroll-deck max-h-72 overflow-y-auto" style="border: var(--ui-hairline) solid var(--ui-border-subtle);">
		<table class="w-full border-collapse text-left text-xs">
			<thead style="background-color: var(--ui-base-300); color: var(--ui-muted-content);">
				<tr>
					<th class="px-2 py-1.5">#</th>
					<th class="px-2 py-1.5">Spine</th>
					<th class="px-2 py-1.5">Intent</th>
					<th class="px-2 py-1.5">Origin</th>
					<th class="px-2 py-1.5 text-right">ms</th>
					<th class="px-2 py-1.5">Status</th>
				</tr>
			</thead>
			<tbody>
				{#if filtered.length === 0}
					<tr>
						<td colspan="6" class="px-3 py-4 text-center" style="color: var(--ui-muted-content);">
							No wire telemetry records match the active filter.
						</td>
					</tr>
				{:else}
					{#each filtered as row (`${row.spine}-${row.seq}-${row.envelopeId}`)}
						<tr style="border-top: var(--ui-hairline) solid var(--ui-border-subtle);">
							<td class="ui-font-mono px-2 py-1.5">{row.seq}</td>
							<td class="px-2 py-1.5">
								<UiBadge text={row.spine === 'CLIENT_DAG' ? 'CLIENT' : 'SERVER'} tone={row.spine === 'CLIENT_DAG' ? 'info' : 'secondary'} />
							</td>
							<td class="ui-font-mono px-2 py-1.5" style="color: var(--ui-base-content);">{row.kind}</td>
							<td class="ui-font-mono px-2 py-1.5" style="color: var(--ui-muted-content);">{row.origin}</td>
							<td class="ui-font-mono px-2 py-1.5 text-right">{row.stageMs.toFixed(2)}</td>
							<td class="px-2 py-1.5">
								<UiBadge text={row.ok ? 'OK' : 'REJECT'} tone={row.ok ? 'success' : 'error'} />
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>

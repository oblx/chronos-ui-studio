<script lang="ts">
	import { UiBadge, UiChamferButton, UiChamferFrame, type CornerKind, type UiProjectDefinition } from '@chronos-ui/svelte';

	interface Props {
		cornerMode: CornerKind;
		cornerRadiusRem: number;
		project: UiProjectDefinition;
		activeAdapterBadge: string;
		traceCount: number;
		onOpenExport: () => void;
	}

	let p: Props = $props();
	const CONNECTORS = ['REST JSON', 'GraphQL', 'SSE Stream', 'WebSocket', 'Webhook In', 'MCP Twin'] as const;
	const ADAPTERS = ['Svelte 5', 'CSS Tokens', 'JSON Schema', 'Vite Static', 'PKZIP'] as const;
</script>

<div class="grid grid-cols-1 gap-3 md:grid-cols-2" data-testid="station-layer-pipelines">
	<UiChamferFrame cornerMode={p.cornerMode} carets={false} className="flex flex-col gap-2 p-3">
		<div class="flex items-center justify-between gap-2">
			<span class="font-semibold" style="color: var(--ui-muted-content);">Input Connectors ({CONNECTORS.length})</span>
			<UiBadge text={`AI: ${p.activeAdapterBadge}`} tone="primary" cornerMode={p.cornerMode} />
		</div>
		<div class="flex flex-wrap gap-1.5">
			{#each CONNECTORS as conn (conn)}
				<UiBadge text={conn} tone="neutral" cornerMode={p.cornerMode} />
			{/each}
		</div>
		<div class="flex items-center justify-between border-t pt-2" style="border-color: var(--ui-border-subtle);">
			<span class="ui-font-mono text-[0.65rem]" style="color: var(--ui-muted-content);">Dual-Spine MCP · {p.traceCount} wire traces</span>
			<UiBadge text="ACYCLIC DAG" tone="success" cornerMode={p.cornerMode} />
		</div>
	</UiChamferFrame>
	<UiChamferFrame cornerMode={p.cornerMode} carets={false} className="flex flex-col justify-between gap-2 p-3">
		<div class="flex flex-col gap-2">
			<div class="flex items-center justify-between gap-2">
				<span class="font-semibold" style="color: var(--ui-muted-content);">Output Adapters ({ADAPTERS.length})</span>
				<UiBadge text={`Radius: ${p.cornerRadiusRem.toFixed(2)}rem`} tone="secondary" cornerMode={p.cornerMode} />
			</div>
			<div class="flex flex-wrap gap-1.5">
				{#each ADAPTERS as adp (adp)}
					<UiBadge text={adp} tone="info" cornerMode={p.cornerMode} />
				{/each}
			</div>
			<p class="text-[0.68rem]" style="color: var(--ui-muted-content);">
				Target theme {p.project.themeId} · compiles zero-dep Svelte 5, semantic CSS tokens, 21-state cursor sheet, and Vite dist.
			</p>
		</div>
		<div class="flex justify-end">
			<UiChamferButton cornerMode={p.cornerMode} icon="export" label="Open Export & Static Build" variant="primary" onclick={p.onOpenExport} />
		</div>
	</UiChamferFrame>
</div>

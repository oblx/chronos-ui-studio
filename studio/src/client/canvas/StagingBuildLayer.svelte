<script lang="ts">
	import { UiChamferButton, uiTransition, Z_LAYERS, type CornerKind, type UiNodeTree } from '@chronos-ui/svelte';

	interface Props {
		nodes: UiNodeTree;
		cornerMode: CornerKind;
		onCommitNode: (nodeId?: string) => void;
		onRejectNode: (nodeId: string) => void;
	}

	let { nodes, cornerMode, onCommitNode, onRejectNode }: Props = $props();

	let staged = $derived(nodes.filter((n) => n.lifecycle === 'STAGING' || n.lifecycle === 'BUILDING'));
</script>

{#if staged.length > 0}
	<div
		data-testid="staging-build-layer"
		class="pointer-events-none fixed inset-x-6 flex flex-col justify-between"
		style={`z-index: ${Z_LAYERS.stagingBuildOverlay}; top: var(--ui-safe-top, 4.25rem); bottom: var(--ui-safe-bottom, 4.5rem);`}
	>
		<div in:uiTransition={{ offsetPx: -8 }} out:uiTransition={{ offsetPx: -8 }} class="pointer-events-auto mx-auto flex items-center gap-3 border px-3.5 py-1.5 text-xs"
			style="background-color: var(--ui-base-200); border-color: var(--ui-accent-vivid, var(--ui-accent));">
			<span class="ui-font-mono font-semibold" style="color: var(--ui-accent-vivid, var(--ui-accent));">
				ON-PROCESS STAGING · {staged.length} node{staged.length === 1 ? '' : 's'}
			</span>
			<UiChamferButton {cornerMode} icon="check" label="Commit All" variant="primary" onclick={() => onCommitNode()} className="py-0.5 text-xs" />
		</div>

		<div class="pointer-events-auto mx-auto my-auto grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2">
			{#each staged as node (node.id)}
				<div
					data-testid={`staging-node-${node.id}`}
					in:uiTransition={{ offsetPx: 10 }}
					out:uiTransition={{ offsetPx: 10 }}
					class="ui-staging-hull ui-commit-morph flex flex-col gap-2 p-3.5"
					style="background-color: color-mix(in srgb, var(--ui-base-100) 86%, transparent);"
				>
					<div class="flex items-center justify-between gap-2 text-xs">
						<span class="ui-font-mono font-semibold" style="color: var(--ui-accent-vivid, var(--ui-accent));">{node.type}</span>
						<span class="ui-font-mono text-[0.7rem]" style="color: var(--ui-muted-content);">{node.zone}</span>
					</div>
					<div class="ui-font-display text-sm font-medium">{node.label}</div>
					<div class="ui-font-mono text-[0.68rem]" style="color: var(--ui-muted-content);">
						props: {Object.keys(node.props).join(', ') || 'defaults'}
					</div>
					<div class="flex items-center justify-end gap-1.5 pt-1">
						<UiChamferButton {cornerMode} icon="check" label="Commit" variant="primary" onclick={() => onCommitNode(node.id)} className="py-0.5 text-xs" />
						<UiChamferButton {cornerMode} icon="close" label="Reject" variant="danger" onclick={() => onRejectNode(node.id)} className="py-0.5 text-xs" />
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

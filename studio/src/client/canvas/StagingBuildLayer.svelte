<script lang="ts">
	import { UiChamferButton, uiTransition, Z_LAYERS, type CornerKind, type UiNodeTree } from '@chronos-ui/svelte';

	interface Props {
		nodes: UiNodeTree;
		cornerMode: CornerKind;
		onCommitNode: (nodeId?: string) => void;
		onRejectNode: (nodeId: string) => void;
		onRejectAll: () => void;
	}

	let { nodes, cornerMode, onCommitNode, onRejectNode, onRejectAll }: Props = $props();

	let staged = $derived(nodes.filter((n) => n.lifecycle === 'STAGING' || n.lifecycle === 'BUILDING'));
</script>

{#if staged.length > 0}
	<div
		data-testid="staging-build-layer"
		class="ui-scroll-deck pointer-events-auto fixed flex flex-col gap-3 overflow-x-hidden overflow-y-auto px-3 pb-4"
		style={`z-index: ${Z_LAYERS.stagingBuildOverlay}; top: var(--ui-safe-top, 4.5rem); bottom: var(--ui-safe-bottom, 5.25rem); left: var(--ui-safe-left, 4.25rem); right: var(--ui-safe-right, 4.25rem); contain: layout style;`}
	>
		<div
			in:uiTransition={{ offsetPx: -8 }}
			out:uiTransition={{ offsetPx: -8 }}
			data-testid="staging-sticky-header"
			class="sticky top-0 z-[5] mx-auto flex flex-wrap items-center justify-center gap-2 border px-3.5 py-1.5 text-xs shadow-sm"
			style="background-color: var(--ui-base-200); border-color: var(--ui-accent-vivid, var(--ui-accent));"
		>
			<span class="ui-font-mono font-semibold" style="color: var(--ui-accent-vivid, var(--ui-accent));">
				ON-PROCESS STAGING · {staged.length} node{staged.length === 1 ? '' : 's'}
			</span>
			<UiChamferButton {cornerMode} icon="check" label="Commit All" variant="primary" testId="staging-commit-all-btn" onclick={() => onCommitNode()} className="py-0.5 text-xs" />
			<UiChamferButton {cornerMode} icon="close" label="Reject All" variant="danger" testId="staging-reject-all-btn" onclick={onRejectAll} className="py-0.5 text-xs" />
		</div>

		<div class="mx-auto grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2" data-testid="staging-node-grid">
			{#each staged as node (node.id)}
				<div
					data-testid={`staging-node-${node.id}`}
					in:uiTransition={{ offsetPx: 10 }}
					out:uiTransition={{ offsetPx: 10 }}
					class="ui-staging-hull ui-commit-morph flex flex-col gap-2 p-3.5"
					style="background-color: color-mix(in srgb, var(--ui-base-100) 88%, transparent);"
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

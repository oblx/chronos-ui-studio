<script lang="ts">
	import { UiIcon, type CornerKind } from '@chronos-ui/svelte';
	import { WIREFRAME_TOOLS, type WireframeToolId } from './wireframe.types';

	interface Props {
		cornerMode: CornerKind;
		activeTool: WireframeToolId;
		onSelectTool: (tool: WireframeToolId) => void;
	}

	let p: Props = $props();
</script>

<aside aria-label="Wireframe CS6 Toolbox" class="flex w-[2.75rem] shrink-0 flex-col items-center gap-1.5 border-r py-2"
	style="background-color: var(--ui-base-200); border-color: var(--ui-border-subtle);" data-testid="wf-toolbox">
	{#each WIREFRAME_TOOLS as tool (tool.id)}
		{@const active = p.activeTool === tool.id}
		<button
			type="button"
			data-testid={`wf-tool-${tool.id.toLowerCase()}`}
			data-ui-interactive="true"
			data-ui-tip={`${tool.label} [${tool.key}]`}
			aria-label={`${tool.label} (${tool.key})`}
			aria-pressed={active}
			onclick={() => p.onSelectTool(tool.id)}
			class="relative flex h-8 w-8 items-center justify-center transition-colors"
			style="background-color: {active ? 'var(--ui-primary)' : 'var(--ui-base-100)'}; color: {active ? 'var(--ui-primary-content)' : 'var(--ui-base-content)'}; border: var(--ui-hairline) solid {active ? 'var(--ui-primary)' : 'var(--ui-border-subtle)'}; border-radius: {p.cornerMode === 'ROUND' ? 'var(--ui-control-cut, 0.3125rem)' : '0'};"
		>
			<UiIcon name={tool.icon} sizeRem={0.95} />
			<span class="ui-font-mono pointer-events-none absolute right-0.5 bottom-0 text-[0.5rem] leading-none opacity-75">{tool.key}</span>
		</button>
	{/each}
</aside>

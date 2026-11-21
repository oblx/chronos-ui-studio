<script lang="ts">
	import { UiChamferButton, UiInput, type CornerKind } from '@chronos-ui/svelte';
	import { WIREFRAME_FILTERS, WIREFRAME_TOOLS, WIREFRAME_ZOOMS, type WireframeFilterId, type WireframeToolId } from './wireframe.types';

	export type WireframeAlignMode = 'LEFT' | 'CENTER' | 'RIGHT' | 'TOP' | 'MIDDLE' | 'BOTTOM' | 'DISTRIBUTE';

	interface Props {
		cornerMode: CornerKind;
		activeTool: WireframeToolId;
		activeFilter: WireframeFilterId;
		snapGrid: boolean;
		snapStepPx: number;
		showArcs: boolean;
		zoom: number;
		searchQuery: string;
		canUndo: boolean;
		canRedo: boolean;
		onUndo: () => void;
		onRedo: () => void;
		onCycleSnapStep: () => void;
		onAlign: (mode: WireframeAlignMode) => void;
		onToggleGrid: () => void;
		onToggleArcs: () => void;
		onSelectFilter: (filter: WireframeFilterId) => void;
		onSetZoom: (z: number | 'FIT') => void;
		onSearchChange: (q: string) => void;
	}

	let p: Props = $props();
	let toolMeta = $derived(WIREFRAME_TOOLS.find((t) => t.id === p.activeTool) ?? WIREFRAME_TOOLS[0]);
	const ALIGN_BTNS: readonly { id: WireframeAlignMode; short: string; tip: string }[] = [
		{ id: 'LEFT', short: 'L', tip: 'Align Left' }, { id: 'CENTER', short: 'C', tip: 'Align Center' },
		{ id: 'RIGHT', short: 'R', tip: 'Align Right' }, { id: 'TOP', short: 'T', tip: 'Align Top' },
		{ id: 'MIDDLE', short: 'M', tip: 'Align Middle' }, { id: 'BOTTOM', short: 'B', tip: 'Align Bottom' },
		{ id: 'DISTRIBUTE', short: 'Dist', tip: 'Distribute Across Zones' }
	];
</script>

<div class="flex min-h-[2.5rem] flex-wrap items-center justify-between gap-1.5 border-b px-2.5 py-1 text-xs"
	style="background-color: var(--ui-base-200); border-color: var(--ui-border-subtle);" data-testid="wf-options-bar">
	<div class="flex flex-wrap items-center gap-1">
		<span class="ui-font-mono px-1.5 py-0.5 text-[0.64rem] font-semibold" style="background-color: var(--ui-base-100); color: var(--ui-primary); border: var(--ui-hairline) solid var(--ui-border-subtle);">
			[{toolMeta.key}] {toolMeta.label}
		</span>
		<UiChamferButton cornerMode={p.cornerMode} icon="undo" tip="Undo revision" disabled={!p.canUndo} variant="ghost" onclick={p.onUndo} className="px-1.5 py-0.5 text-[0.64rem]" />
		<UiChamferButton cornerMode={p.cornerMode} icon="redo" tip="Redo revision" disabled={!p.canRedo} variant="ghost" onclick={p.onRedo} className="px-1.5 py-0.5 text-[0.64rem]" />
		<UiChamferButton cornerMode={p.cornerMode} label={p.snapGrid ? `Snap ${p.snapStepPx}px` : 'Snap OFF'} active={p.snapGrid} variant={p.snapGrid ? 'secondary' : 'ghost'} onclick={p.onToggleGrid} className="px-1.5 py-0.5 text-[0.64rem]" />
		<UiChamferButton cornerMode={p.cornerMode} label={`${(p.snapStepPx / 16).toFixed(2)}rem`} tip="Toggle snap increment (8px / 16px)" variant="ghost" onclick={p.onCycleSnapStep} className="px-1.5 py-0.5 text-[0.62rem]" />
		<UiChamferButton cornerMode={p.cornerMode} label={p.showArcs ? 'Arcs: ON' : 'Arcs: OFF'} active={p.showArcs} variant={p.showArcs ? 'secondary' : 'ghost'} onclick={p.onToggleArcs} className="px-1.5 py-0.5 text-[0.64rem]" />
		<div class="flex items-center gap-0.5" role="group" aria-label="Align and distribute">
			{#each ALIGN_BTNS as a (a.id)}
				<UiChamferButton cornerMode={p.cornerMode} label={a.short} tip={a.tip} variant="ghost" onclick={() => p.onAlign(a.id)} className="px-1.5 py-0.5 text-[0.62rem]" />
			{/each}
		</div>
	</div>

	<div class="flex flex-wrap items-center gap-1.5">
		<div class="flex items-center gap-0.5" role="group" aria-label="Layer filter">
			{#each WIREFRAME_FILTERS as f (f.id)}
				<UiChamferButton cornerMode={p.cornerMode} label={f.label} active={p.activeFilter === f.id} variant={p.activeFilter === f.id ? 'primary' : 'ghost'} onclick={() => p.onSelectFilter(f.id)} className="px-1.5 py-0.5 text-[0.62rem]" />
			{/each}
		</div>
		<div class="flex items-center gap-0.5" role="group" aria-label="Artboard zoom">
			{#each WIREFRAME_ZOOMS as z (z)}
				<UiChamferButton cornerMode={p.cornerMode} label={`${Math.round(z * 100)}%`} active={Math.abs(p.zoom - z) < 0.02} variant={Math.abs(p.zoom - z) < 0.02 ? 'secondary' : 'ghost'} onclick={() => p.onSetZoom(z)} className="px-1.5 py-0.5 text-[0.62rem]" />
			{/each}
			<UiChamferButton cornerMode={p.cornerMode} label="Fit" variant="ghost" onclick={() => p.onSetZoom('FIT')} className="px-1.5 py-0.5 text-[0.62rem]" />
		</div>
		<div class="w-40">
			<UiInput value={p.searchQuery} cornerMode={p.cornerMode} placeholder="Search UUID / label..." label="Search entities" oninput={(val) => p.onSearchChange(val)} className="ui-font-mono text-[0.68rem]" />
		</div>
	</div>
</div>

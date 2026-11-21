<script lang="ts">
	import {
		UiChamferButton, UiModalShell, type CornerKind, type HudZoneId, type RegisteredUiEntity, type UiNode, type UiNodeTree
	} from '@chronos-ui/svelte';
	import type { WireframeFilterId, WireframeRightTabId, WireframeToolId } from './wireframe.types';
	import WireframeArtboard from './WireframeArtboard.svelte';
	import WireframeOptionsBar, { type WireframeAlignMode } from './WireframeOptionsBar.svelte';
	import WireframeRightStack from './WireframeRightStack.svelte';
	import WireframeToolbox from './WireframeToolbox.svelte';

	interface Props {
		open: boolean;
		cornerMode: CornerKind;
		projectName: string;
		entities: readonly RegisteredUiEntity[];
		selectedUuid: string | null;
		undoStack: readonly UiNodeTree[];
		canRedo?: boolean;
		onSelectEntity: (uuid: string) => void;
		onToggleLock: (uuid: string) => void;
		onToggleVisibility: (uuid: string) => void;
		onPatchEntity: (uuid: string, patch: Partial<UiNode>) => void;
		onMoveEntity: (uuid: string, targetZone: HudZoneId) => void;
		onRemoveEntity: (uuid: string) => void;
		onSpawnQuickInZone: (zoneId: HudZoneId) => void;
		onDuplicateEntity?: (uuid: string, name: string) => void;
		onCommitStaged?: () => void;
		onUndo?: () => void;
		onRedo?: () => void;
		onJumpUndoSteps: (stepsBack: number) => void;
		onCopiedUuid: (uuid: string) => void;
		onClose: () => void;
	}

	let p: Props = $props();
	let activeTool = $state<WireframeToolId>('SELECT');
	let activeFilter = $state<WireframeFilterId>('ALL');
	let activeTab = $state<WireframeRightTabId>('LAYERS');
	let snapGrid = $state(true);
	let snapStepPx = $state(8);
	let showArcs = $state(true);
	let zoom = $state(1);
	let panX = $state(0);
	let panY = $state(0);
	let searchQuery = $state('');
	let hoveredUuid = $state<string | null>(null);

	let filtered = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		return p.entities.filter((e) => {
			if (activeFilter === 'STAGED' && e.lifecycle !== 'STAGING') return false;
			if (activeFilter === 'COMMITTED' && e.lifecycle !== 'COMMITTED') return false;
			if (activeFilter === 'LOCKED' && !e.locked) return false;
			if (q && !e.uuid.toLowerCase().includes(q) && !e.label.toLowerCase().includes(q) && !e.zoneId.toLowerCase().includes(q)) return false;
			return true;
		});
	});

	let selected = $derived(p.entities.find((e) => e.uuid === p.selectedUuid) ?? filtered[0] ?? null);

	function handleZoneClick(zoneId: HudZoneId): void {
		if (activeTool === 'SPAWN') { p.onSpawnQuickInZone(zoneId); return; }
		if (activeTool === 'MOVE' && selected && !selected.locked) p.onMoveEntity(selected.uuid, zoneId);
	}
	function handleAlign(mode: WireframeAlignMode): void {
		if (!selected || selected.locked) return;
		const zoneMap: Record<WireframeAlignMode, HudZoneId> = { LEFT: 'LEFT_EDGE', CENTER: 'WORLD_CANVAS', RIGHT: 'RIGHT_EDGE', TOP: 'TOP_CENTER', MIDDLE: 'WORLD_CANVAS', BOTTOM: 'BOTTOM_CENTER', DISTRIBUTE: 'WORLD_CANVAS' };
		p.onMoveEntity(selected.uuid, zoneMap[mode]);
	}
	function setZoom(z: number | 'FIT'): void {
		if (z === 'FIT') { zoom = 1; panX = 0; panY = 0; return; }
		zoom = Math.max(0.5, Math.min(1.5, Number(z.toFixed(2))));
	}
	async function copySelectedUuid(): Promise<void> {
		if (!selected) return;
		if (typeof navigator !== 'undefined' && navigator.clipboard) await navigator.clipboard.writeText(selected.uuid);
		p.onCopiedUuid(selected.uuid);
	}
</script>

<UiModalShell open={p.open} sizeTier="FULL_STAGE" title="Wireframe Skeleton Workbench" subtitle={`${p.projectName} · CS6 Precision Inspector`} icon="radar" cornerMode={p.cornerMode} onClose={p.onClose}>
	<div class="flex min-h-[30rem] w-full flex-1 flex-col overflow-hidden border" style="border-color: var(--ui-border-subtle);" data-testid="wireframe-skeleton-modal">
		<WireframeOptionsBar
			cornerMode={p.cornerMode} {activeTool} {activeFilter} {snapGrid} {snapStepPx} {showArcs} {zoom} {searchQuery}
			canUndo={p.undoStack.length > 0} canRedo={Boolean(p.canRedo)}
			onUndo={() => { if (p.onUndo) p.onUndo(); else p.onJumpUndoSteps(1); }}
			onRedo={() => { p.onRedo?.(); }}
			onCycleSnapStep={() => { snapStepPx = snapStepPx === 8 ? 16 : 8; }}
			onAlign={handleAlign}
			onToggleGrid={() => { snapGrid = !snapGrid; }}
			onToggleArcs={() => { showArcs = !showArcs; }}
			onSelectFilter={(f) => { activeFilter = f; }}
			onSetZoom={setZoom}
			onSearchChange={(q) => { searchQuery = q; }}
		/>

		<div class="flex min-h-0 flex-1 flex-col lg:flex-row">
			<div class="flex min-h-0 min-w-0 flex-1">
				<WireframeToolbox cornerMode={p.cornerMode} {activeTool} onSelectTool={(t) => { activeTool = t; }} />
				<WireframeArtboard
					cornerMode={p.cornerMode} entities={filtered} selectedUuid={selected?.uuid ?? null} {hoveredUuid}
					{activeTool} {snapGrid} {snapStepPx} {showArcs} {zoom} {panX} {panY}
					onSelectEntity={p.onSelectEntity}
					onHoverEntity={(id) => { hoveredUuid = id; }}
					onClickZone={handleZoneClick}
					onSpawnInZone={p.onSpawnQuickInZone}
					onPanDelta={(dx, dy) => { panX += dx; panY += dy; }}
					onZoomWheel={(d) => setZoom(zoom + d)}
				/>
			</div>

			<WireframeRightStack
				cornerMode={p.cornerMode} {activeTab} entities={filtered} selectedUuid={selected?.uuid ?? null}
				{hoveredUuid} undoStack={p.undoStack}
				onSelectTab={(t) => { activeTab = t; }}
				onSelectEntity={p.onSelectEntity}
				onHoverEntity={(id) => { hoveredUuid = id; }}
				onToggleVisibility={p.onToggleVisibility}
				onToggleLock={p.onToggleLock}
				onDuplicateEntity={(uuid, name) => p.onDuplicateEntity?.(uuid, name)}
				onPatchEntity={p.onPatchEntity}
				onMoveEntity={p.onMoveEntity}
				onRemoveEntity={p.onRemoveEntity}
				onJumpUndoSteps={p.onJumpUndoSteps}
			/>
		</div>

		<div class="ui-font-mono flex min-h-[2.25rem] shrink-0 flex-wrap items-center justify-between gap-2 border-t px-3 py-1 text-[0.66rem] tabular-nums"
			style="background-color: var(--ui-base-200); border-color: var(--ui-border-subtle); color: var(--ui-muted-content);" data-testid="wf-status-strip">
			<div class="flex min-w-0 flex-wrap items-center gap-1.5">
				<span class="border px-1.5 py-0.5" style="background-color: var(--ui-base-100); border-color: var(--ui-border-subtle);">Zoom: {Math.round(zoom * 100)}%</span>
				<span class="border px-1.5 py-0.5" style="background-color: var(--ui-base-100); border-color: var(--ui-border-subtle);">Entities: {filtered.length}/{p.entities.length}</span>
				<span class="border px-1.5 py-0.5" style="background-color: var(--ui-base-100); border-color: var(--ui-border-subtle);">Arcs: {showArcs ? 'Active' : 'Hidden'}</span>
				{#if selected}
					<button type="button" onclick={() => void copySelectedUuid()} class="truncate border px-1.5 py-0.5 underline-offset-2 hover:underline" style="background-color: var(--ui-base-100); border-color: var(--ui-border-subtle); color: var(--ui-primary);">
						UUID: {selected.uuid.slice(0, 12)}...
					</button>
				{/if}
			</div>
			<div class="flex items-center gap-1.5">
				<UiChamferButton cornerMode={p.cornerMode} label="Reset" variant="ghost" onclick={() => setZoom('FIT')} className="px-2 py-0.5 text-[0.66rem]" />
				{#if p.onCommitStaged}<UiChamferButton cornerMode={p.cornerMode} label="Apply & Commit" variant="secondary" onclick={p.onCommitStaged} className="px-2 py-0.5 text-[0.66rem]" />{/if}
				<UiChamferButton cornerMode={p.cornerMode} label="Done" variant="primary" onclick={p.onClose} className="px-2.5 py-0.5 text-[0.66rem]" />
			</div>
		</div>
	</div>
</UiModalShell>

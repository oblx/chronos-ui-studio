<script lang="ts">
	import { UiChamferButton, type CornerKind, type HudZoneId, type ThemePack, type UiComponentKind, type UiNode } from '@chronos-ui/svelte';
	import type { UiBlueprint } from '@studio/config';
	import type { UiComponentPrototype } from '@studio/core/engine';
	import { NodeInspectorFloat, StudioToolPalettePanel } from '../canvas';
	import BlueprintLibraryPanel from './BlueprintLibraryPanel.svelte';
	import SpotlightStudioPanel from './SpotlightStudioPanel.svelte';
	import ThemeTunerPanel from './ThemeTunerPanel.svelte';
	import ZoneComposerPanel from './ZoneComposerPanel.svelte';

	interface Props {
		side: 'LEFT' | 'RIGHT';
		activeTab: string;
		blueprint: UiBlueprint;
		blueprints: readonly UiBlueprint[];
		themes: readonly (ThemePack & { readonly starred?: boolean })[];
		activeThemeId: string;
		cornerMode: CornerKind;
		prototypes: readonly UiComponentPrototype[];
		selectedNode: UiNode | null;
		lastMcpActivity: string | null;
		canUndo: boolean;
		onSpawnQuick: (type: UiComponentKind, zone: HudZoneId, label: string, props: Record<string, unknown>) => void;
		onSpawnPrototype: (proto: UiComponentPrototype) => void;
		onLoadSample: (sampleId: string) => void;
		onUndo: () => void;
		onOpenStationBuilder: () => void;
		onOpenZoneEdition: () => void;
		onOpenCursors: () => void;
		onPatchNode: (nodeId: string, patch: Partial<UiNode>) => void;
		onDeriveBlueprint: (nodeId: string, name: string) => void;
		onCommitNode: (nodeId: string) => void;
		onRejectNode: (nodeId: string) => void;
		onRemoveNode: (nodeId: string) => void;
		onCopiedUuid: (uuid: string) => void;
		onClearSelection: () => void;
		onToggleZone: (id: HudZoneId) => void;
		onCycleCorner: (id: HudZoneId, idx: 0 | 1 | 2 | 3, kind: CornerKind) => void;
		onSelectBlueprint: (id: string) => void;
		onSaveBlueprint: (bp: UiBlueprint) => void;
		onCloneBlueprint: (id: string) => void;
		onDeleteBlueprint: (id: string) => void;
		onSelectTheme: (id: string) => void;
		onToggleThemeStar: (id: string) => void;
		onPublishTheme: (pack: ThemePack) => void;
		onStartSpotlight: () => void;
		onOpenTome: () => void;
		onOpenExport: () => void;
	}

	let props: Props = $props();
	const EXPORT_FORMATS = [
		'Svelte 5 Component Scaffold (.svelte)',
		'Vite Static Client Bundle (Lighthouse 100 + llms.txt)',
		'Full-Stack Vendored Bundle (Node + SQLite + MCP)',
		'Drizzle Schema + Canonical JSON Blueprint',
		'CSS Design Token Sheet (:root)',
		'21-State Vector Cursor Pack CSS'
	] as const;
</script>

{#if props.side === 'LEFT'}
	{#if props.activeTab === 'build'}
		<StudioToolPalettePanel
			cornerMode={props.cornerMode}
			prototypes={props.prototypes}
			lastMcpActivity={props.lastMcpActivity}
			canUndo={props.canUndo}
			onSpawnQuick={props.onSpawnQuick}
			onSpawnPrototype={props.onSpawnPrototype}
			onLoadSample={props.onLoadSample}
			onOpenExport={props.onOpenExport}
			onOpenStationBuilder={props.onOpenStationBuilder}
			onOpenZoneEdition={props.onOpenZoneEdition}
			onOpenCursors={props.onOpenCursors}
			onUndo={props.onUndo}
		/>
	{:else if props.activeTab === 'zones'}
		<ZoneComposerPanel blueprint={props.blueprint} cornerMode={props.cornerMode} onToggleZone={props.onToggleZone} onCycleCorner={props.onCycleCorner} />
	{:else if props.activeTab === 'blueprints'}
		<BlueprintLibraryPanel blueprints={props.blueprints} activeBlueprintId={props.blueprint.id} cornerMode={props.cornerMode} onSelect={props.onSelectBlueprint} onSave={props.onSaveBlueprint} onClone={props.onCloneBlueprint} onDelete={props.onDeleteBlueprint} onOpenExport={props.onOpenExport} />
	{:else}
		<SpotlightStudioPanel cornerMode={props.cornerMode} onStartTour={props.onStartSpotlight} onOpenTome={props.onOpenTome} />
	{/if}
{:else if props.activeTab === 'inspector'}
	<NodeInspectorFloat node={props.selectedNode} cornerMode={props.cornerMode} onPatch={props.onPatchNode} onDeriveBlueprint={props.onDeriveBlueprint} onCommitNode={props.onCommitNode} onRejectNode={props.onRejectNode} onRemove={props.onRemoveNode} onCopiedUuid={props.onCopiedUuid} onClose={props.onClearSelection} />
{:else if props.activeTab === 'themes'}
	<ThemeTunerPanel themes={props.themes} activeThemeId={props.activeThemeId} cornerMode={props.cornerMode} onSelectTheme={props.onSelectTheme} onToggleStar={props.onToggleThemeStar} onPublishTheme={props.onPublishTheme} />
{:else}
	<div class="flex flex-col gap-3 pb-3 text-xs">
		<p class="leading-relaxed" style="color: var(--ui-muted-content);">
			Export standalone @chronos-ui/svelte scaffolds, Lighthouse-100 static bundles, or vendored full-stack Node + SQLite + MCP packages.
		</p>
		<ul class="flex flex-col gap-1 border p-2.5" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-100); color: var(--ui-base-content);">
			{#each EXPORT_FORMATS as fmt (fmt)}
				<li class="ui-font-mono text-[0.68rem]">· {fmt}</li>
			{/each}
		</ul>
		<UiChamferButton cornerMode={props.cornerMode} icon="export" label="Open Export Studio" variant="primary" onclick={props.onOpenExport} />
	</div>
{/if}

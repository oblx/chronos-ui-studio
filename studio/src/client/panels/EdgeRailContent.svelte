<script lang="ts">
	import { UiChamferButton, type CornerKind, type HudZoneId, type ThemePack } from '@chronos-ui/svelte';
	import type { UiBlueprint } from '../../config';
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
</script>

{#if props.side === 'LEFT'}
	{#if props.activeTab === 'zones'}
		<ZoneComposerPanel
			blueprint={props.blueprint}
			cornerMode={props.cornerMode}
			onToggleZone={props.onToggleZone}
			onCycleCorner={props.onCycleCorner}
		/>
	{:else if props.activeTab === 'blueprints'}
		<BlueprintLibraryPanel
			blueprints={props.blueprints}
			activeBlueprintId={props.blueprint.id}
			cornerMode={props.cornerMode}
			onSelect={props.onSelectBlueprint}
			onSave={props.onSaveBlueprint}
			onClone={props.onCloneBlueprint}
			onDelete={props.onDeleteBlueprint}
			onOpenExport={props.onOpenExport}
		/>
	{:else}
		<SpotlightStudioPanel
			cornerMode={props.cornerMode}
			onStartTour={props.onStartSpotlight}
			onOpenTome={props.onOpenTome}
		/>
	{/if}
{:else if props.activeTab === 'themes'}
	<ThemeTunerPanel
		themes={props.themes}
		activeThemeId={props.activeThemeId}
		cornerMode={props.cornerMode}
		onSelectTheme={props.onSelectTheme}
		onToggleStar={props.onToggleThemeStar}
		onPublishTheme={props.onPublishTheme}
	/>
{:else}
	<div class="flex flex-col gap-3">
		<p class="text-xs leading-relaxed" style="color: var(--ui-muted-content);">
			Generate standalone @chronos-ui/svelte component scaffolds, JSON blueprints, or CSS token sheets.
		</p>
		<UiChamferButton cornerMode={props.cornerMode} icon="export" label="Open Export Studio" variant="primary" onclick={props.onOpenExport} />
	</div>
{/if}

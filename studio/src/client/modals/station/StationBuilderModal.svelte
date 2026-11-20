<script lang="ts">
	import {
		CORNER_MODES, CORNER_RADIUS_LIMITS, LAYOUT_DENSITIES, MOTION_PRESETS, UiChamferButton, UiChamferFrame,
		UiHorizontalDeck, UiModalFooter, UiModalShell, UiSlider, uiSwipeDeck,
		type AccessibilityPrefs, type CornerKind, type CursorPackDefinition, type HudZoneId,
		type LayoutDensity, type MotionConfig, type ThemePack, type UiProjectDefinition
	} from '@chronos-ui/svelte';
	import type { UiComponentPrototype } from '../../../core/engine';
	import type { StationLayerConfig } from '../../state';
	import StationPipelinesPane from './StationPipelinesPane.svelte';

	interface Props {
		open: boolean; prefs: AccessibilityPrefs; motionConfig: MotionConfig; stationLayer: StationLayerConfig;
		studioChromeVisible: boolean; layoutDensity: LayoutDensity; activeAdapterBadge: string; traceCount: number;
		themes: readonly ThemePack[]; activeThemeId: string; cursorPacks: readonly CursorPackDefinition[];
		activeCursorPackId: string | null; project: UiProjectDefinition; prototypes: readonly UiComponentPrototype[];
		onConfigureLayer: (patch: Partial<StationLayerConfig>) => void; onToggleStudioChrome: () => void;
		onSetCornerStyle: (mode: CornerKind) => void; onSetCornerRadius: (rem: number) => void;
		onSetMotionConfig: (patch: Partial<MotionConfig>) => void; onSetDensity: (density: LayoutDensity) => void;
		onSelectTheme: (themeId: string) => void; onApplyCursorPack: (packId: string) => void;
		onSpawnPrototype: (proto: UiComponentPrototype) => void; onPromoteNode: (nodeId: string, name: string) => void;
		onCommitStaged: () => void; onInspectNode: (nodeId: string) => void;
		onOpenZoneEdition: (zoneId?: HudZoneId) => void; onOpenExport: () => void; onClose: () => void;
	}

	let p: Props = $props();
	let activeTab = $state<'substrate' | 'perimeter' | 'tree' | 'pipelines'>('substrate');
	const TABS = [
		{ id: 'substrate', label: '1. Substrate & Atmosphere' }, { id: 'perimeter', label: '2. Perimeter Shell & Density' },
		{ id: 'tree', label: '3. Live Tree & Prototypes' }, { id: 'pipelines', label: '4. Runtime Pipelines' }
	] as const;
	const QUICK_PRESETS = MOTION_PRESETS.slice(0, 4);
	let stagedCount = $derived(p.project.nodes.filter((n) => n.lifecycle === 'STAGING' || n.lifecycle === 'BUILDING').length);

	function stepTab(delta: -1 | 1): void {
		const idx = TABS.findIndex((t) => t.id === activeTab);
		const next = TABS[(idx + delta + TABS.length) % TABS.length];
		if (next) activeTab = next.id;
	}
</script>

<UiModalShell open={p.open} sizeTier="WIDE" title="Station Builder — Architectural Layer Workbench" subtitle={`${p.project.name} · 4-Layer Real-Time Canvas & Perimeter Architect`} icon="layers" cornerMode={p.prefs.cornerMode} onClose={p.onClose}>
	<div class="flex flex-col gap-3 text-xs" data-testid="station-builder-modal" use:uiSwipeDeck={{ onStep: stepTab }}>
		<UiHorizontalDeck cornerMode={p.prefs.cornerMode} label="Station builder layers">
			{#each TABS as tab (tab.id)}
				<UiChamferButton cornerMode={p.prefs.cornerMode} label={tab.label} active={activeTab === tab.id} variant={activeTab === tab.id ? 'primary' : 'surface'} onclick={() => { activeTab = tab.id; }} className="shrink-0 py-1 text-[0.7rem]" />
			{/each}
		</UiHorizontalDeck>

		{#if activeTab === 'substrate'}
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2" data-testid="station-layer-substrate">
				<UiChamferFrame cornerMode={p.prefs.cornerMode} carets={false} className="flex flex-col gap-2 p-3">
					<span class="font-semibold" style="color: var(--ui-muted-content);">World Stage Atmosphere & Motion</span>
					<div class="grid grid-cols-2 gap-1.5">
						<UiChamferButton cornerMode={p.prefs.cornerMode} label={p.stationLayer.showGrid ? 'Blueprint Grid: On' : 'Blueprint Grid: Off'} active={p.stationLayer.showGrid} variant={p.stationLayer.showGrid ? 'primary' : 'surface'} onclick={() => p.onConfigureLayer({ showGrid: !p.stationLayer.showGrid })} />
						<UiChamferButton cornerMode={p.prefs.cornerMode} label={p.stationLayer.showReticle ? 'Center Reticle: On' : 'Center Reticle: Off'} active={p.stationLayer.showReticle} variant={p.stationLayer.showReticle ? 'primary' : 'surface'} onclick={() => p.onConfigureLayer({ showReticle: !p.stationLayer.showReticle })} />
					</div>
					<div class="grid grid-cols-3 gap-1.5">
						{#each CORNER_MODES as mode (mode)}
							<UiChamferButton cornerMode={p.prefs.cornerMode} label={mode} active={p.prefs.cornerMode === mode} variant={p.prefs.cornerMode === mode ? 'primary' : 'surface'} onclick={() => p.onSetCornerStyle(mode)} />
						{/each}
					</div>
					<UiSlider value={p.prefs.cornerRadiusRem} min={CORNER_RADIUS_LIMITS.minRem} max={CORNER_RADIUS_LIMITS.maxRem} step={CORNER_RADIUS_LIMITS.stepRem} label="Global Corner Radius" valueLabel={`${p.prefs.cornerRadiusRem.toFixed(2)}rem`} oninput={p.onSetCornerRadius} />
					<div class="grid grid-cols-4 gap-1">
						{#each QUICK_PRESETS as preset (preset)}
							<UiChamferButton cornerMode={p.prefs.cornerMode} label={preset} active={p.motionConfig.preset === preset} variant={p.motionConfig.preset === preset ? 'secondary' : 'surface'} onclick={() => p.onSetMotionConfig({ preset })} className="px-1 py-0.5 text-[0.6rem]" />
						{/each}
					</div>
				</UiChamferFrame>
				<UiChamferFrame cornerMode={p.prefs.cornerMode} carets={false} className="flex flex-col gap-2 p-3">
					<span class="font-semibold" style="color: var(--ui-muted-content);">Theme & 21-State Cursor Binding</span>
					<div class="grid grid-cols-2 gap-1.5">
						{#each p.themes as theme (theme.id)}
							<UiChamferButton cornerMode={p.prefs.cornerMode} label={theme.name} active={p.activeThemeId === theme.id} variant={p.activeThemeId === theme.id ? 'primary' : 'surface'} onclick={() => p.onSelectTheme(theme.id)} className="py-1 text-[0.66rem]" />
						{/each}
					</div>
					<div class="grid grid-cols-2 gap-1.5 pt-1">
						{#each p.cursorPacks.slice(0, 4) as pack (pack.uuid)}
							<UiChamferButton cornerMode={p.prefs.cornerMode} icon="cursor" label={pack.name} active={p.activeCursorPackId === pack.uuid} variant={p.activeCursorPackId === pack.uuid ? 'secondary' : 'surface'} onclick={() => p.onApplyCursorPack(pack.uuid)} className="py-1 text-[0.66rem]" />
						{/each}
					</div>
				</UiChamferFrame>
			</div>
		{:else if activeTab === 'perimeter'}
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2" data-testid="station-layer-perimeter">
				<UiChamferFrame cornerMode={p.prefs.cornerMode} carets={false} className="flex flex-col gap-2.5 p-3">
					<span class="font-semibold" style="color: var(--ui-muted-content);">HUD Corridor Proportions</span>
					<UiSlider value={p.stationLayer.topBandRem} min={4.5} max={8.5} step={0.25} label="Top Band Height" valueLabel={`${p.stationLayer.topBandRem.toFixed(2)}rem`} oninput={(v) => p.onConfigureLayer({ topBandRem: v })} />
					<UiSlider value={p.stationLayer.bottomDockRem} min={6.5} max={11.5} step={0.25} label="Bottom Dock Height" valueLabel={`${p.stationLayer.bottomDockRem.toFixed(2)}rem`} oninput={(v) => p.onConfigureLayer({ bottomDockRem: v })} />
					<UiSlider value={p.stationLayer.edgeRailRem} min={2.0} max={4.0} step={0.25} label="Edge Rail Width" valueLabel={`${p.stationLayer.edgeRailRem.toFixed(2)}rem`} oninput={(v) => p.onConfigureLayer({ edgeRailRem: v })} />
				</UiChamferFrame>
				<UiChamferFrame cornerMode={p.prefs.cornerMode} carets={false} className="flex flex-col gap-2 p-3">
					<span class="font-semibold" style="color: var(--ui-muted-content);">Shell Mode, Density & Symmetry</span>
					<UiChamferButton cornerMode={p.prefs.cornerMode} label={p.studioChromeVisible ? 'Active Shell: Studio HUD (Switch to Calm Stage)' : 'Active Shell: Calm Stage (Switch to Studio HUD)'} active={p.studioChromeVisible} variant={p.studioChromeVisible ? 'primary' : 'surface'} onclick={p.onToggleStudioChrome} testId="station-toggle-hud-btn" />
					<div class="grid grid-cols-3 gap-1.5">
						{#each LAYOUT_DENSITIES as d (d)}
							<UiChamferButton cornerMode={p.prefs.cornerMode} label={d} active={p.layoutDensity === d} variant={p.layoutDensity === d ? 'primary' : 'surface'} onclick={() => p.onSetDensity(d)} />
						{/each}
					</div>
					<UiChamferButton cornerMode={p.prefs.cornerMode} label={p.stationLayer.bilateralMirror ? 'Bilateral Mirror (X = 50vw): LOCKED' : 'Bilateral Mirror: Independent'} active={p.stationLayer.bilateralMirror} variant={p.stationLayer.bilateralMirror ? 'secondary' : 'surface'} onclick={() => p.onConfigureLayer({ bilateralMirror: !p.stationLayer.bilateralMirror })} />
					<UiChamferButton cornerMode={p.prefs.cornerMode} icon="grid" label="Open 11-Zone Perimeter Edition" variant="primary" onclick={() => p.onOpenZoneEdition()} />
				</UiChamferFrame>
			</div>
		{:else if activeTab === 'tree'}
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2" data-testid="station-layer-tree">
				<UiChamferFrame cornerMode={p.prefs.cornerMode} carets={false} className="flex flex-col gap-1.5 p-3">
					<div class="flex items-center justify-between gap-2">
						<span class="font-semibold" style="color: var(--ui-muted-content);">Live Mounted Nodes ({p.project.nodes.length})</span>
						{#if stagedCount > 0}
							<UiChamferButton cornerMode={p.prefs.cornerMode} label={`Commit ${stagedCount} Staged`} variant="primary" onclick={p.onCommitStaged} className="py-0.5 text-[0.64rem]" />
						{/if}
					</div>
					{#each p.project.nodes as node (node.id)}
						<div class="flex items-center justify-between gap-1.5 border px-2 py-1" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-100);">
							<span class="truncate font-medium">{node.label} <span class="ui-font-mono opacity-65">({node.zone})</span></span>
							<div class="flex shrink-0 items-center gap-1">
								<UiChamferButton cornerMode={p.prefs.cornerMode} label="Zone" variant="ghost" onclick={() => p.onOpenZoneEdition(node.zone)} className="px-1.5 py-0.5 text-[0.6rem]" />
								<UiChamferButton cornerMode={p.prefs.cornerMode} label="Promote" variant="secondary" onclick={() => p.onPromoteNode(node.id, `${node.label} Blueprint`)} className="px-1.5 py-0.5 text-[0.6rem]" />
								<UiChamferButton cornerMode={p.prefs.cornerMode} label="Inspect" variant="surface" onclick={() => { p.onInspectNode(node.id); p.onClose(); }} className="px-1.5 py-0.5 text-[0.6rem]" />
							</div>
						</div>
					{:else}
						<span class="ui-font-mono opacity-65">Calm Empty Stage — spawn components or ask Assistant.</span>
					{/each}
				</UiChamferFrame>
				<UiChamferFrame cornerMode={p.prefs.cornerMode} carets={false} className="flex flex-col gap-1.5 p-3">
					<span class="font-semibold" style="color: var(--ui-muted-content);">Derived Blueprint Prototypes ({p.prototypes.length})</span>
					{#each p.prototypes as proto (proto.id)}
						<UiChamferButton cornerMode={p.prefs.cornerMode} icon="copy" label={`Spawn ${proto.name}`} variant="secondary" onclick={() => p.onSpawnPrototype(proto)} className="w-full justify-start py-1" />
					{:else}
						<span class="ui-font-mono opacity-65">Select any canvas block and click Promote to create inherited prototypes.</span>
					{/each}
				</UiChamferFrame>
			</div>
		{:else}
			<StationPipelinesPane cornerMode={p.prefs.cornerMode} cornerRadiusRem={p.prefs.cornerRadiusRem} project={p.project} activeAdapterBadge={p.activeAdapterBadge} traceCount={p.traceCount} onOpenExport={p.onOpenExport} />
		{/if}
	</div>
	{#snippet footer()}
		<UiModalFooter><UiChamferButton cornerMode={p.prefs.cornerMode} label="Done" variant="primary" onclick={p.onClose} /></UiModalFooter>
	{/snippet}
</UiModalShell>

<script lang="ts">
	import { applySafeCorridorCssVars, computeSafeCorridorFromRects, findThemePack, measureActivePerimeterRects, shortUuid, UiAssistantDock, UiChamferButton, UiChamferFrame, UiCyberTooltip, UiEdgeDrawer, UiInteractiveCanvasStage, UiPerimeterHud, UiSpotlightVeil, UiToastStack, UiVirtualCursors, ZONE_CORNER_PRESETS, type HudZoneId, type UiNode } from '@chronos-ui/svelte';
	import { STARTER_BLUEPRINTS, STUDIO_CONFIG, STUDIO_LEFT_TABS, STUDIO_RIGHT_TABS, STUDIO_VIEWS } from '../config';
	import { CalmTopStrip, ClientDocumentRoot, NodeInspectorFloat, StagingBuildLayer, StudioToolPalettePanel } from './canvas';
	import { StudioModalStack } from './modals';
	import { BentoRadarConsole, EdgeRailContent, TopPerimeterPods, WireTelemetryStrip } from './panels';
	import { apiLogin, apiLogout, apiMintPat, apiRegister, createStudioController, GENESIS_FALLBACK } from './state';

	const studio = createStudioController();
	const QUICK_ACTIONS = [{ id: 'qa-telemetry', label: 'Build Telemetry HUD', prompt: 'build a minimal telemetry dashboard' }, { id: 'qa-station', label: 'Station Builder', prompt: 'open station builder' }, { id: 'qa-zone', label: 'Zone Edition', prompt: 'open zone edition' }, { id: 'qa-commit', label: 'Commit Staged', prompt: '/commit' }] as const;

	const findNodeById = (list: readonly UiNode[], id: string | null): UiNode | null => {
		if (!id) return null;
		for (const n of list) { if (n.id === id) return n; const hit = n.children ? findNodeById(n.children, id) : null; if (hit) return hit; }
		return null;
	};

	let bp = $derived(studio.state.blueprints.find((b) => b.id === studio.state.activeBlueprintId) ?? STARTER_BLUEPRINTS[0]);
	let project = $derived(studio.state.projects.find((p) => p.id === studio.state.activeProjectId) ?? studio.state.projects[0] ?? GENESIS_FALLBACK);
	let activeTheme = $derived(studio.state.themes.find((t) => t.id === studio.state.activeThemeId) ?? findThemePack(studio.state.activeThemeId));
	let selectedNode = $derived(findNodeById(project.nodes, studio.state.selectedNodeId));
	let hasStaging = $derived(project.nodes.some((n) => n.lifecycle === 'STAGING' || n.lifecycle === 'BUILDING'));
	let hiddenZones = $derived(new Set<HudZoneId>(bp.zones.filter((z) => !z.visible).map((z) => z.id)));
	let cornerMode = $derived(studio.state.accessibility.cornerMode);
	const zoneOf = (id: HudZoneId) => bp.zones.find((z) => z.id === id);

	$effect(() => {
		void studio.hydrate();
		const detachTips = studio.tooltip.attachGlobalDelegation();
		const detachInput = studio.input.attach();
		const syncCorridors = () => applySafeCorridorCssVars(computeSafeCorridorFromRects(window.innerWidth, window.innerHeight, studio.state.studioChromeVisible, measureActivePerimeterRects()));
		window.addEventListener('resize', syncCorridors, { passive: true });
		const pollId = setInterval(() => { void studio.pollCollab(); }, STUDIO_CONFIG.collabPollIntervalMs);
		return () => { detachTips(); detachInput(); window.removeEventListener('resize', syncCorridors); clearInterval(pollId); studio.destroy(); };
	});

	function handleGlobalKey(e: KeyboardEvent): void {
		if (e.key === 'F1' || (e.shiftKey && e.key === '?')) { e.preventDefault(); openHelp(); }
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); void studio.saveProject(); }
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); studio.dispatch('UI_TOGGLE_STUDIO_CHROME', {}); }
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); studio.dispatch(e.shiftKey ? 'UI_REDO_REVISION' : 'UI_UNDO_REVISION', {}); }
	}
	async function devLogin(): Promise<void> {
		const res = await apiLogin(STUDIO_CONFIG.devSeed.email, STUDIO_CONFIG.devSeed.password);
		if (res.user) { studio.setUser(res.user); await studio.refreshServerTraces(); studio.pushToast('Signed in as Dev Architect', 'success'); }
	}
	function openHelp(): void { studio.dispatch('HELP_CONTEXT_SHIFTED', { topic: studio.state.helpTopic }); studio.openModal('tome'); }
	function openZoneEdition(zoneId?: HudZoneId): void { if (zoneId) studio.selectZone(zoneId); studio.openModal('zone-edition'); }
</script>

<svelte:window onkeydown={handleGlobalKey} />

{#snippet dynamicCanvas()}
	<UiInteractiveCanvasStage panX={studio.state.panX} panY={studio.state.panY} zoom={studio.state.zoom} {cornerMode} showGrid={studio.state.stationLayer.showGrid} showReticle={studio.state.stationLayer.showReticle} onPanDelta={(dx, dy) => studio.dispatch('UI_STAGE_PAN_ZOOM', { dx, dy })} onZoomDelta={(dz) => studio.dispatch('UI_STAGE_PAN_ZOOM', { dz })}>
		<div class="relative my-auto min-h-[34rem] w-full max-w-6xl">
			<ClientDocumentRoot projectId={project.id} nodes={project.nodes} traces={studio.traces} {cornerMode} selectedNodeId={studio.state.selectedNodeId} hasStagingNodes={hasStaging} onSelectNode={(nodeId) => studio.dispatch('UI_SELECT_NODE', { nodeId })} onLoadSample={studio.loadSampleProject} onOpenBuildPalette={() => studio.toggleToolPalette(true)} onClientEvent={(summary) => studio.pushToast(summary, 'info')} onMorphCorner={(cm) => studio.dispatch('UI_SET_CORNER_STYLE', { cornerMode: cm })} onMeasureRect={studio.entityRegistry.updateMeasuredRect} />
			<StagingBuildLayer nodes={project.nodes} {cornerMode} onCommitNode={(nodeId) => studio.dispatch('UI_COMMIT_NODE', { nodeId })} onRejectNode={(nodeId) => studio.dispatch('UI_REJECT_NODE', { nodeId })} />
		</div>
	</UiInteractiveCanvasStage>
	<StudioToolPalettePanel open={studio.state.toolPaletteOpen} {cornerMode} layoutDensity={studio.state.layoutDensity} prototypes={studio.state.prototypes} lastMcpActivity={studio.state.lastMcpActivity} canUndo={studio.state.undoStack.length > 0} onSpawnQuick={studio.spawnQuickComponent} onSpawnPrototype={studio.spawnFromPrototype} onLoadSample={studio.loadSampleProject} onSetDensity={(density) => studio.dispatch('UI_SET_LAYOUT_DENSITY', { density })} onOpenExport={() => studio.openModal('export')} onOpenStationBuilder={() => studio.openModal('station-builder')} onOpenZoneEdition={() => openZoneEdition()} onUndo={() => studio.dispatch('UI_UNDO_REVISION', {})} onClose={() => studio.toggleToolPalette(false)} />
	<NodeInspectorFloat node={selectedNode} {cornerMode} onPatch={(nodeId, patch) => studio.dispatch('UI_PATCH_NODE', { nodeId, patch })} onDeriveBlueprint={(nodeId, name) => { studio.dispatch('UI_DERIVE_BLUEPRINT', { nodeId, name }); studio.pushToast(`Promoted ${name}`, 'success'); }} onRemove={(nodeId) => studio.dispatch('UI_REMOVE_NODE', { nodeId })} onCopiedUuid={(uuid) => studio.pushToast(`Copied UUID ${shortUuid(uuid)}`, 'info')} onClose={() => studio.dispatch('UI_SELECT_NODE', { nodeId: null })} />
{/snippet}

{#snippet assistantAndOverlays()}
	<UiAssistantDock {cornerMode} dockState={studio.state.assistantDock} studioChromeVisible={studio.state.studioChromeVisible} ocularState={studio.state.assistantOcular} modelLabel={studio.state.activeAdapterBadge} inputModality={studio.state.inputModality} voiceListening={studio.input.voiceListening} voiceSupported={studio.input.voiceSupported} interimTranscript={studio.input.interimTranscript} busy={studio.state.assistantBusy} messages={studio.state.chatMessages} quickActions={QUICK_ACTIONS} canUndo={studio.state.undoStack.length > 0} onSubmit={(prompt) => void studio.sendAssistantPrompt(prompt)} onMoveFloat={(dxPx, dyPx, rect) => studio.dispatch('UI_ASSISTANT_MOVE', { dxPx, dyPx, rect })} onDropFloat={() => studio.dispatch('UI_ASSISTANT_DROP', {})} onDock={() => studio.dispatch('UI_ASSISTANT_DOCK', {})} onToggleExpand={() => studio.dispatch('UI_ASSISTANT_EXPAND', {})} onToggleVoice={() => studio.input.toggleVoice()} onTogglePalette={() => studio.toggleToolPalette()} onUndoStep={() => studio.dispatch('UI_UNDO_REVISION', {})} />
	<StudioModalStack activeModalId={studio.modal.activeId} helpTopic={studio.state.helpTopic} {cornerMode} isLocked={studio.modal.isLocked} remainingSeconds={studio.modal.remainingSeconds} progressRatio={studio.modal.progressRatio} accessibility={studio.state.accessibility} motionConfig={studio.state.motionConfig} envCapabilities={studio.state.envCapabilities} activeAdapterBadge={studio.state.activeAdapterBadge} stationLayer={studio.state.stationLayer} studioChromeVisible={studio.state.studioChromeVisible} layoutDensity={studio.state.layoutDensity} blueprint={bp} selectedZoneId={studio.state.selectedZoneId} prototypes={studio.state.prototypes} themes={studio.state.themes} activeThemeId={studio.state.activeThemeId} aiProfiles={studio.state.aiProfiles} {project} entities={studio.entityRegistry.list()} selectedNodeId={studio.state.selectedNodeId} lowMemoryMode={studio.state.lowMemoryMode} voiceMode={studio.state.voiceMode} gamepadOverride={studio.state.gamepadOverride} cursorPacks={studio.state.cursorPacks} activeCursorPackId={studio.state.activeCursorPackId} traces={studio.traces} user={studio.state.user} onCloseModal={() => studio.modal.close()} onOpenTimedDemo={() => studio.openModal('tome', 3)} onOpenCursors={() => studio.openModal('cursors')} onOpenZoneEdition={openZoneEdition} onOpenExport={() => studio.openModal('export')} onUpdatePrefs={(patch) => studio.dispatch('UI_SET_ACCESSIBILITY', patch)} onSetCornerStyle={(cm) => studio.dispatch('UI_SET_CORNER_STYLE', { cornerMode: cm })} onSetCornerRadius={(cornerRadiusRem) => studio.dispatch('UI_SET_CORNER_RADIUS', { cornerRadiusRem })} onSetMotionConfig={(patch) => studio.dispatch('UI_SET_MOTION_CONFIG', patch)} onConfigureStationLayer={(patch) => studio.dispatch('UI_CONFIGURE_STATION_LAYER', patch)} onToggleStudioChrome={() => studio.dispatch('UI_TOGGLE_STUDIO_CHROME', {})} onCommitStaged={() => studio.dispatch('UI_COMMIT_NODE', { all: true })} onSetDensity={(density) => studio.dispatch('UI_SET_LAYOUT_DENSITY', { density })} onSelectZone={studio.selectZone} onEditZone={(payload) => studio.dispatch('UI_EDIT_ZONE_DISPOSITION', payload)} onMoveEntityToZone={(nodeId, targetZone, direction) => studio.dispatch('UI_MOVE_ENTITY_TO_ZONE', { nodeId, targetZone, direction })} onRemoveEntity={(nodeId) => studio.dispatch('UI_REMOVE_NODE', { nodeId })} onSpawnPrototype={studio.spawnFromPrototype} onSelectTheme={(themeId) => studio.dispatch('UI_SET_THEME', { themeId })} onSaveAiProfile={studio.saveAiProfile} onToggleLowMemory={studio.setLowMemoryMode} onSetVoiceMode={studio.setVoiceMode} onSetGamepadOverride={studio.setGamepadOverride} onApplyCursorPack={studio.applyCursorPack} onResetCursorPack={studio.resetCursorPack} onCreateCursorPack={studio.createCursorPack} onDeriveCursorStates={studio.deriveCursorPack} onUpdateCursorHotspot={(uuid, st, x, y) => studio.updateCursorState(uuid, st, { hotspotX: x, hotspotY: y })} onInspectEntity={(uuid) => studio.dispatch('UI_SELECT_NODE', { nodeId: uuid })} onMorphEntityCorner={(uuid, cm) => studio.dispatch('UI_PATCH_NODE', { nodeId: uuid, patch: { corners: [cm, cm, cm, cm] } })} onCloneDerivedEntity={(uuid, name) => { studio.dispatch('UI_DERIVE_BLUEPRINT', { nodeId: uuid, name }); studio.pushToast(`Derived ${name}`, 'success'); }} onCopiedUuid={(uuid) => studio.pushToast(`Copied UUID ${shortUuid(uuid)}`, 'info')} onDevLogin={devLogin} onRefreshTraces={() => void studio.refreshServerTraces()} onLogin={async (e, p) => { const r = await apiLogin(e, p); if (r.user) { studio.setUser(r.user); return null; } return r.error ?? 'Failed'; }} onRegister={async (e, p, n) => { const r = await apiRegister(e, p, n); if (r.user) { studio.setUser(r.user); return null; } return r.error ?? 'Failed'; }} onLogout={async () => { await apiLogout(); studio.setUser(null); }} onMintPat={async (lbl) => { const r = await apiMintPat(lbl); return r.token ?? null; }} onCopiedExport={() => studio.pushToast('Copied export artifact to clipboard', 'success')} />
	<UiSpotlightVeil active={studio.spotlight.active} step={studio.spotlight.currentStep} stepIndex={studio.spotlight.stepIndex} totalSteps={studio.spotlight.steps.length} {cornerMode} onPrev={studio.spotlight.prev} onNext={studio.spotlight.next} onStop={studio.spotlight.stop} />
	{#if studio.state.studioChromeVisible}<UiVirtualCursors peers={studio.state.peers} />{/if}
	<UiToastStack toasts={studio.state.toasts} {cornerMode} onDismiss={(id) => studio.dispatch('UI_DISMISS_TOAST', { id })} />
	<UiCyberTooltip tooltip={studio.tooltip.state} />
{/snippet}

{#if !studio.state.studioChromeVisible}
	<div class="relative h-screen w-screen overflow-hidden" style="background-color: var(--ui-base-100); color: var(--ui-base-content);" data-testid="calm-genesis-stage">
		{@render dynamicCanvas()}
		<CalmTopStrip projects={studio.state.projects} activeProjectId={project.id} {cornerMode} polarity={activeTheme.polarity} chromeVisible={false} layoutDensity={studio.state.layoutDensity} toolPaletteOpen={studio.state.toolPaletteOpen} inputModality={studio.state.inputModality} isDirty={studio.state.projectPersistence.isDirty} saveStatus={studio.state.projectPersistence.status} onSelectProject={(id) => void studio.switchProject(id)} onCreateProject={(name) => void studio.createProject(name)} onSaveWorkspace={() => void studio.saveProject()} onResetDefaultView={studio.resetDefaultView} onCleanWorkspace={() => void studio.cleanWorkspace()} onTogglePalette={() => studio.toggleToolPalette()} onToggleChrome={() => studio.dispatch('UI_TOGGLE_STUDIO_CHROME', {})} onSetDensity={(density) => studio.dispatch('UI_SET_LAYOUT_DENSITY', { density })} onTogglePolarity={() => studio.dispatch('UI_TOGGLE_POLARITY', {})} onOpenCursors={() => studio.openModal('cursors')} onOpenStationBuilder={() => studio.openModal('station-builder')} onOpenZoneEdition={() => openZoneEdition()} onOpenExport={() => studio.openModal('export')} onOpenSettings={() => studio.openModal('settings')} onOpenHelp={openHelp} />
		{@render assistantAndOverlays()}
	</div>
{:else}
	<UiPerimeterHud {hiddenZones} {cornerMode} onOpenLeftMobile={() => studio.dispatch('UI_SET_DRAWER_OPEN', { side: 'LEFT', open: true })} onOpenRightMobile={() => studio.dispatch('UI_SET_DRAWER_OPEN', { side: 'RIGHT', open: true })} onOpenSettingsMobile={() => studio.openModal('settings')}>
		{#snippet worldCanvas()}{@render dynamicCanvas()}{/snippet}
		{#snippet topLeft()}<TopPerimeterPods zone="TOP_LEFT" blueprint={bp} {cornerMode} polarity={activeTheme.polarity} user={studio.state.user} activeModalId={studio.modal.activeId} glitterBurst={studio.state.helpGlitterCount} isDirty={studio.state.projectPersistence.isDirty} onSaveWorkspace={() => void studio.saveProject()} onResetDefaultView={studio.resetDefaultView} onCleanWorkspace={() => void studio.cleanWorkspace()} />{/snippet}
		{#snippet topCenter()}
			{@const z = zoneOf('TOP_CENTER')}
			<UiChamferFrame corners={z?.corners} {cornerMode} cornerRadiusRem={z?.cornerRadiusRem} shape={z?.shape ?? 'BOX'} cornerEmbellishment={z?.cornerEmbellishment} cornerAnimation={z?.cornerAnimation ?? 'NONE'} carets={true} bezel={true} className="flex items-center justify-between gap-2 px-4">
				<div class="flex items-center gap-1.5 overflow-x-auto">
					{#each STUDIO_VIEWS as v (v.id)}<UiChamferButton {cornerMode} label={v.label} active={studio.state.activeView === v.id} variant={studio.state.activeView === v.id ? 'primary' : 'surface'} onclick={() => { studio.dispatch('UI_SET_ACTIVE_VIEW', { view: v.id }); studio.dispatch('HELP_CONTEXT_SHIFTED', { topic: v.topic }); }} />{/each}
				</div>
				<div class="flex shrink-0 items-center gap-1">
					<UiChamferButton {cornerMode} icon="sliders" label="Station" variant="secondary" onclick={() => studio.openModal('station-builder')} className="py-0.5 text-xs" />
					<UiChamferButton {cornerMode} icon="grid" label="Zones" variant="surface" onclick={() => openZoneEdition()} className="py-0.5 text-xs" />
					<UiChamferButton {cornerMode} label="Calm View" variant="ghost" onclick={() => studio.dispatch('UI_TOGGLE_STUDIO_CHROME', { visible: false })} className="py-0.5 text-xs" />
				</div>
			</UiChamferFrame>
		{/snippet}
		{#snippet projectDeck()}
			{@const z = zoneOf('PROJECT_TAB_DECK')}
			<UiChamferFrame corners={z?.corners ?? ZONE_CORNER_PRESETS.PROJECT_DECK} {cornerMode} cornerRadiusRem={z?.cornerRadiusRem} shape={z?.shape ?? 'BOX'} cornerEmbellishment={z?.cornerEmbellishment} cornerAnimation={z?.cornerAnimation ?? 'NONE'} className="flex items-center justify-between gap-2 px-4">
				<div class="flex items-center gap-1.5 overflow-x-auto">
					{#each studio.state.projects as proj (proj.id)}<UiChamferButton {cornerMode} label={proj.name} active={proj.id === project.id} variant={proj.id === project.id ? 'secondary' : 'ghost'} onclick={() => void studio.switchProject(proj.id)} className="py-0.5" />{/each}
				</div>
				<UiChamferButton {cornerMode} icon="plus" tip="New empty project canvas" onclick={() => void studio.createProject(`Canvas ${studio.state.projects.length + 1}`)} className="px-2 py-0.5" />
			</UiChamferFrame>
		{/snippet}
		{#snippet topRight()}<TopPerimeterPods zone="TOP_RIGHT" blueprint={bp} {cornerMode} polarity={activeTheme.polarity} user={studio.state.user} activeModalId={studio.modal.activeId} glitterBurst={studio.state.helpGlitterCount} onOpenCursors={() => studio.openModal('cursors')} onOpenAuth={() => studio.openModal('auth')} onOpenWire={() => studio.openModal('wire')} onTogglePolarity={() => studio.dispatch('UI_TOGGLE_POLARITY', {})} onOpenHelp={openHelp} onOpenSettings={() => studio.openModal('settings')} onStartSpotlight={() => studio.startSpotlight()} />{/snippet}
		{#snippet drawers()}
			{#each ['LEFT', 'RIGHT'] as const as side (side)}
				{@const d = side === 'LEFT' ? studio.state.leftDrawer : studio.state.rightDrawer}
				<UiEdgeDrawer {side} open={d.open} floating={d.floating} railOffsetY={d.railOffsetY} floatX={d.floatX} floatY={d.floatY} tabs={side === 'LEFT' ? STUDIO_LEFT_TABS : STUDIO_RIGHT_TABS} activeTabId={d.activeTab} {cornerMode} onToggleOpen={() => studio.dispatch('UI_SET_DRAWER_OPEN', { side })} onSelectTab={(tabId) => studio.dispatch('UI_SET_DRAWER_TAB', { side, tabId })} onToggleFloat={() => studio.dispatch('UI_TOGGLE_DRAWER_FLOAT', { side })} onMoveRail={(dy) => studio.dispatch('UI_MOVE_EDGE_RAIL', { side, dy })} onMoveFloat={(dx, dy) => studio.dispatch('UI_MOVE_FLOATING_DRAWER', { side, dx, dy })}>
					<EdgeRailContent {side} activeTab={d.activeTab} blueprint={bp} blueprints={studio.state.blueprints} themes={studio.state.themes} activeThemeId={studio.state.activeThemeId} {cornerMode} onToggleZone={(zoneId) => studio.dispatch('UI_TOGGLE_ZONE_VISIBILITY', { zoneId })} onCycleCorner={(zoneId, index, kind) => studio.dispatch('UI_SET_ZONE_CORNER', { zoneId, index, kind })} onSelectBlueprint={(blueprintId) => studio.dispatch('UI_SET_ACTIVE_TAB', { blueprintId })} onSaveBlueprint={(nextBp) => void studio.saveBlueprint(nextBp)} onCloneBlueprint={(id) => void studio.cloneBlueprint(id)} onDeleteBlueprint={(id) => void studio.deleteBlueprint(id)} onSelectTheme={(themeId) => studio.dispatch('UI_SET_THEME', { themeId })} onToggleThemeStar={(id) => void studio.toggleThemeStar(id)} onPublishTheme={(p) => void studio.createCustomTheme(p)} onStartSpotlight={() => studio.startSpotlight()} onOpenTome={openHelp} onOpenExport={() => studio.openModal('export')} />
				</UiEdgeDrawer>
			{/each}
		{/snippet}
		{#snippet bottomLeft()}<WireTelemetryStrip mode="LEFT_STREAM" traces={studio.traces} {cornerMode} zoneConfig={zoneOf('BOTTOM_LEFT')} />{/snippet}
		{#snippet bottomRight()}<BentoRadarConsole {cornerMode} zoneConfig={zoneOf('BOTTOM_RIGHT')} zoom={studio.state.zoom} panX={studio.state.panX} panY={studio.state.panY} activeZoneCount={project.nodes.length} entities={studio.entityRegistry.list()} selectedUuid={studio.state.selectedNodeId} onOpenSkeleton={() => studio.openModal('radar-skeleton')} onZoomIn={() => studio.dispatch('UI_STAGE_PAN_ZOOM', { dz: 0.12 })} onZoomOut={() => studio.dispatch('UI_STAGE_PAN_ZOOM', { dz: -0.12 })} onResetCamera={() => studio.dispatch('UI_STAGE_PAN_ZOOM', { reset: true })} onToggleLeftDrawer={() => studio.dispatch('UI_SET_DRAWER_OPEN', { side: 'LEFT' })} onToggleRightDrawer={() => studio.dispatch('UI_SET_DRAWER_OPEN', { side: 'RIGHT' })} onStartSpotlight={() => studio.startSpotlight()} />{/snippet}
		{#snippet overlays()}{@render assistantAndOverlays()}{/snippet}
	</UiPerimeterHud>
{/if}

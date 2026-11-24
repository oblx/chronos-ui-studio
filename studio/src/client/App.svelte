<script lang="ts">
	import { findThemePack, fitNodesToSafeCorridor, HUD_METRICS, shortUuid, UiAssistantDock, UiChamferButton, UiChamferFrame, UiCyberTooltip, UiEdgeDrawer, UiInteractiveCanvasStage, UiPerimeterHud, uiSpotlight, UiSpotlightVeil, UiToastStack, UiUtilityIconButton, UiVirtualCursors, ZONE_CORNER_PRESETS, type HudZoneId, type UiNode } from '@chronos-ui/svelte';
	import { STARTER_BLUEPRINTS, STUDIO_CONFIG, STUDIO_LEFT_TABS, STUDIO_RIGHT_TABS, STUDIO_UI_COPY, STUDIO_VIEWS } from '../config';
	import { CalmTopStrip, ClientDocumentRoot, StagingBuildLayer } from './canvas';
	import StudioModalStack from './modals/StudioModalStack.svelte';
	import { BentoRadarConsole, EdgeRailContent, TopPerimeterPods, WireTelemetryStrip } from './panels';
	import { apiLogin, apiLogout, apiMintPat, apiRegister, createStudioController, GENESIS_FALLBACK, syncCorridorForState } from './state';

	const studio = createStudioController();

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

	const fitActiveStage = () => {
		const stage = document.querySelector<HTMLElement>('[data-ui-stage-viewport]'), docEl = document.querySelector<HTMLElement>('[data-testid="client-document-root"]');
		if (!stage || !docEl) return;
		const fit = fitNodesToSafeCorridor({ left: 0, top: 0, width: docEl.scrollWidth, height: docEl.scrollHeight }, stage.getBoundingClientRect(), 1.25);
		if (Math.abs(fit.zoom - studio.state.zoom) >= 0.04) studio.dispatch('UI_STAGE_PAN_ZOOM', { panX: 0, panY: 0, zoom: fit.zoom, coalescedFrames: 1, durationMs: 0 });
	};
	const syncCorridors = () => syncCorridorForState(studio.state);

	$effect(() => {
		void studio.hydrate();
		const detachTips = studio.tooltip.attachGlobalDelegation(), detachInput = studio.input.attach();
		window.addEventListener('resize', syncCorridors, { passive: true });
		const pollId = setInterval(() => { void studio.pollCollab(); }, STUDIO_CONFIG.collabPollIntervalMs);
		return () => { detachTips(); detachInput(); window.removeEventListener('resize', syncCorridors); clearInterval(pollId); studio.destroy(); };
	});
	$effect(() => {
		void [studio.state.studioChromeVisible, studio.state.assistantDock.expanded, studio.state.assistantDock.mode, studio.state.chatMessages.length, project.id, project.nodes.length];
		syncCorridors(); requestAnimationFrame(() => { syncCorridors(); fitActiveStage(); });
		const dock = document.querySelector('[data-testid="ui-assistant-dock"]');
		if (!dock || typeof ResizeObserver === 'undefined') return;
		const ro = new ResizeObserver(syncCorridors); ro.observe(dock);
		return () => ro.disconnect();
	});

	function handleGlobalKey(e: KeyboardEvent): void {
		if (e.key === 'F1' || (e.shiftKey && e.key === '?')) { e.preventDefault(); openHelp(); }
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); void studio.saveProject(); }
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); studio.dispatch('UI_TOGGLE_STUDIO_CHROME', {}); }
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); studio.dispatch(e.shiftKey ? 'UI_REDO_REVISION' : 'UI_UNDO_REVISION', {}); }
	}
	async function devLogin(): Promise<void> { const res = await apiLogin(STUDIO_CONFIG.devSeed.email, STUDIO_CONFIG.devSeed.password); if (res.user) { studio.setUser(res.user); await studio.refreshServerTraces(); studio.pushToast('Signed in as Dev Architect', 'success'); } }
	const openHelp = (): void => { studio.dispatch('HELP_CONTEXT_SHIFTED', { topic: studio.state.helpTopic }); studio.openModal('tome'); };
	const openZoneEdition = (zoneId?: HudZoneId): void => { if (zoneId) studio.selectZone(zoneId); studio.openModal('zone-edition'); };
	const jumpUndoSteps = (stepsBack: number): void => { for (let i = 0; i < stepsBack; i += 1) studio.dispatch('UI_UNDO_REVISION', {}); };
</script>

<svelte:window onkeydown={handleGlobalKey} />

{#snippet dynamicCanvas()}
	<UiInteractiveCanvasStage panX={studio.state.panX} panY={studio.state.panY} zoom={studio.state.zoom} {cornerMode} showGrid={studio.state.stationLayer.showGrid} showReticle={studio.state.stationLayer.showReticle} onGestureCommit={(commit) => studio.dispatch('UI_STAGE_PAN_ZOOM', commit)}>
		<div class="relative w-full max-w-6xl">
			<ClientDocumentRoot projectId={project.id} nodes={project.nodes} traces={studio.traces} {cornerMode} selectedNodeId={studio.state.selectedNodeId} hasStagingNodes={hasStaging} onSelectNode={(nodeId) => studio.dispatch('UI_SELECT_NODE', { nodeId })} onLoadSample={studio.loadSampleProject} onOpenBuildPalette={() => studio.toggleToolPalette(true)} onClientEvent={(summary) => studio.pushToast(summary, 'info')} onMorphCorner={(cm) => studio.dispatch('UI_SET_CORNER_STYLE', { cornerMode: cm })} onMeasureRect={studio.entityRegistry.updateMeasuredRect} />
		</div>
	</UiInteractiveCanvasStage>
	<StagingBuildLayer nodes={project.nodes} {cornerMode} onCommitNode={(nodeId) => studio.dispatch('UI_COMMIT_NODE', { nodeId })} onRejectNode={(nodeId) => studio.dispatch('UI_REJECT_NODE', { nodeId })} onRejectAll={() => studio.dispatch('UI_REJECT_ALL_STAGED', {})} />
{/snippet}

{#snippet unifiedEdgeRails()}
	{#each ['LEFT', 'RIGHT'] as const as side (side)}
		{@const d = side === 'LEFT' ? studio.state.leftDrawer : studio.state.rightDrawer}
		<UiEdgeDrawer {side} open={d.open} floating={d.floating} railOffsetY={d.railOffsetY} floatX={d.floatX} floatY={d.floatY} tabs={side === 'LEFT' ? STUDIO_LEFT_TABS : STUDIO_RIGHT_TABS} activeTabId={d.activeTab} {cornerMode} onToggleOpen={() => studio.dispatch('UI_SET_DRAWER_OPEN', { side })} onSelectTab={(tabId) => studio.dispatch('UI_SET_DRAWER_TAB', { side, tabId })} onToggleFloat={() => studio.dispatch('UI_TOGGLE_DRAWER_FLOAT', { side })} onMoveRail={(dy) => studio.dispatch('UI_MOVE_EDGE_RAIL', { side, dy })} onMoveFloat={(dx, dy) => studio.dispatch('UI_MOVE_FLOATING_DRAWER', { side, dx, dy })}>
			<EdgeRailContent {side} activeTab={d.activeTab} blueprint={bp} blueprints={studio.state.blueprints} themes={studio.state.themes} activeThemeId={studio.state.activeThemeId} {cornerMode} prototypes={studio.state.prototypes} {selectedNode} lastMcpActivity={studio.state.lastMcpActivity} canUndo={studio.state.undoStack.length > 0} onSpawnQuick={studio.spawnQuickComponent} onSpawnPrototype={studio.spawnFromPrototype} onLoadSample={studio.loadSampleProject} onUndo={() => studio.dispatch('UI_UNDO_REVISION', {})} onOpenStationBuilder={() => studio.openModal('station-builder')} onOpenZoneEdition={() => openZoneEdition()} onOpenCursors={() => studio.openModal('cursors')} onPatchNode={(nodeId, patch) => studio.dispatch('UI_PATCH_NODE', { nodeId, patch })} onDeriveBlueprint={(nodeId, name) => { studio.dispatch('UI_DERIVE_BLUEPRINT', { nodeId, name }); studio.pushToast(`Promoted ${name}`, 'success'); }} onCommitNode={(nodeId) => studio.dispatch('UI_COMMIT_NODE', { nodeId })} onRejectNode={(nodeId) => studio.dispatch('UI_REJECT_NODE', { nodeId })} onRemoveNode={(nodeId) => studio.dispatch('UI_REMOVE_NODE', { nodeId })} onCopiedUuid={(uuid) => studio.pushToast(`Copied UUID ${shortUuid(uuid)}`, 'info')} onClearSelection={() => studio.dispatch('UI_SELECT_NODE', { nodeId: null })} onToggleZone={(zoneId) => studio.dispatch('UI_TOGGLE_ZONE_VISIBILITY', { zoneId })} onCycleCorner={(zoneId, index, kind) => studio.dispatch('UI_SET_ZONE_CORNER', { zoneId, index, kind })} onSelectBlueprint={(blueprintId) => studio.dispatch('UI_SET_ACTIVE_TAB', { blueprintId })} onSaveBlueprint={(nextBp) => void studio.saveBlueprint(nextBp)} onCloneBlueprint={(id) => void studio.cloneBlueprint(id)} onDeleteBlueprint={(id) => void studio.deleteBlueprint(id)} onSelectTheme={(themeId) => studio.dispatch('UI_SET_THEME', { themeId })} onToggleThemeStar={(id) => void studio.toggleThemeStar(id)} onPublishTheme={(p) => void studio.createCustomTheme(p)} onStartSpotlight={() => studio.startSpotlight()} onOpenTome={openHelp} onOpenExport={() => studio.openModal('export')} />
		</UiEdgeDrawer>
	{/each}
{/snippet}

{#snippet assistantAndOverlays()}
	<UiAssistantDock {cornerMode} dockState={studio.state.assistantDock} studioChromeVisible={studio.state.studioChromeVisible} ocularState={studio.state.assistantOcular} modelLabel={studio.state.activeAdapterBadge} inputModality={studio.state.inputModality} voiceListening={studio.input.voiceListening} voiceSupported={studio.input.voiceSupported} interimTranscript={studio.input.interimTranscript} busy={studio.state.assistantBusy} hasBuiltOnce={Boolean(project.hasBuiltOnce)} messages={studio.state.chatMessages} quickActions={STUDIO_UI_COPY.quickActions} canUndo={studio.state.undoStack.length > 0} onSubmit={(prompt) => void studio.sendAssistantPrompt(prompt)} onMoveFloat={(dxPx, dyPx, rect) => studio.dispatch('UI_ASSISTANT_MOVE', { dxPx, dyPx, rect })} onDropFloat={() => studio.dispatch('UI_ASSISTANT_DROP', {})} onDock={() => studio.dispatch('UI_ASSISTANT_DOCK', {})} onToggleFloat={(rect) => studio.dispatch('UI_ASSISTANT_TOGGLE_FLOAT', { rect })} onToggleExpand={() => studio.dispatch('UI_ASSISTANT_EXPAND', {})} onToggleVoice={() => studio.input.toggleVoice()} onTogglePalette={() => studio.toggleToolPalette()} onUndoStep={() => studio.dispatch('UI_UNDO_REVISION', {})} />
	<StudioModalStack activeModalId={studio.modal.activeId} modalExpanded={studio.modal.isExpanded} modalRestoreSnapshot={studio.modal.restoreSnapshot} onSetModalExpanded={(next, snap) => { studio.modal.setExpanded(next, snap); studio.dispatch('UI_MODAL_TOGGLE_EXPAND', { expanded: next }); }} helpTopic={studio.state.helpTopic} {cornerMode} isLocked={studio.modal.isLocked} remainingSeconds={studio.modal.remainingSeconds} progressRatio={studio.modal.progressRatio} accessibility={studio.state.accessibility} motionConfig={studio.state.motionConfig} studioDefaults={studio.state.studioDefaults} envCapabilities={studio.state.envCapabilities} activeAdapterBadge={studio.state.activeAdapterBadge} stationLayer={studio.state.stationLayer} studioChromeVisible={studio.state.studioChromeVisible} layoutDensity={studio.state.layoutDensity} blueprint={bp} selectedZoneId={studio.state.selectedZoneId} prototypes={studio.state.prototypes} themes={studio.state.themes} activeThemeId={studio.state.activeThemeId} aiProfiles={studio.state.aiProfiles} {project} entities={studio.entityRegistry.list()} selectedNodeId={studio.state.selectedNodeId} undoStack={studio.state.undoStack} canRedo={studio.state.redoStack.length > 0} lowMemoryMode={studio.state.lowMemoryMode} voiceMode={studio.state.voiceMode} gamepadOverride={studio.state.gamepadOverride} cursorPacks={studio.state.cursorPacks} activeCursorPackId={studio.state.activeCursorPackId} traces={studio.traces} user={studio.state.user} onCloseModal={() => studio.modal.close()} onOpenCursors={() => studio.openModal('cursors')} onOpenZoneEdition={openZoneEdition} onOpenExport={() => studio.openModal('export')} onUpdatePrefs={(patch) => studio.dispatch('UI_SET_ACCESSIBILITY', patch)} onSetCornerStyle={(cm) => studio.dispatch('UI_SET_CORNER_STYLE', { cornerMode: cm })} onSetCornerRadius={(cornerRadiusRem) => studio.dispatch('UI_SET_CORNER_RADIUS', { cornerRadiusRem })} onSetStudioDefaults={(patch) => studio.dispatch('UI_SET_STUDIO_DEFAULT', patch)} onResetStudioDefaults={() => studio.dispatch('UI_RESET_STUDIO_DEFAULTS', {})} onSetMotionConfig={(patch) => studio.dispatch('UI_SET_MOTION_CONFIG', patch)} onSetMotionProfile={(patch) => studio.dispatch('UI_SET_MOTION_PROFILE', patch)} onConfigureStationLayer={(patch) => studio.dispatch('UI_CONFIGURE_STATION_LAYER', patch)} onToggleStudioChrome={() => studio.dispatch('UI_TOGGLE_STUDIO_CHROME', {})} onCommitStaged={() => studio.dispatch('UI_COMMIT_NODE', { all: true })} onUndo={() => studio.dispatch('UI_UNDO_REVISION', {})} onRedo={() => studio.dispatch('UI_REDO_REVISION', {})} onClearTraces={() => studio.clearTraces()} onSetDensity={(density) => studio.dispatch('UI_SET_LAYOUT_DENSITY', { density })} onSelectZone={studio.selectZone} onEditZone={(payload) => studio.dispatch('UI_EDIT_ZONE_DISPOSITION', payload)} onMoveEntityToZone={(nodeId, targetZone, direction) => studio.dispatch('UI_MOVE_ENTITY_TO_ZONE', { nodeId, targetZone, direction })} onRemoveEntity={(nodeId) => studio.dispatch('UI_REMOVE_NODE', { nodeId })} onSpawnPrototype={studio.spawnFromPrototype} onSelectTheme={(themeId) => studio.dispatch('UI_SET_THEME', { themeId })} onSaveAiProfile={studio.saveAiProfile} onToggleLowMemory={studio.setLowMemoryMode} onSetVoiceMode={studio.setVoiceMode} onSetGamepadOverride={studio.setGamepadOverride} onApplyCursorPack={studio.applyCursorPack} onResetCursorPack={studio.resetCursorPack} onCreateCursorPack={studio.createCursorPack} onDeriveCursorStates={studio.deriveCursorPack} onUpdateCursorHotspot={(uuid, st, x, y) => studio.updateCursorState(uuid, st, { hotspotX: x, hotspotY: y })} onInspectEntity={(uuid) => studio.dispatch('UI_SELECT_NODE', { nodeId: uuid })} onToggleEntityLock={(nodeId) => studio.dispatch('UI_TOGGLE_ENTITY_LOCK', { nodeId })} onToggleEntityVisibility={(nodeId) => studio.dispatch('UI_TOGGLE_ENTITY_VISIBILITY', { nodeId })} onPatchEntity={(nodeId, patch) => studio.dispatch('UI_PATCH_NODE', { nodeId, patch })} onSpawnQuickInZone={(zoneId) => studio.spawnQuickComponent('UiMetricCard', zoneId, `Zone ${zoneId} Card`, { title: `${zoneId} Entity`, subtitle: 'Spawned from CS6 Wireframe' })} onJumpUndoSteps={jumpUndoSteps} onCloneDerivedEntity={(uuid, name) => { studio.dispatch('UI_DERIVE_BLUEPRINT', { nodeId: uuid, name }); studio.pushToast(`Derived ${name}`, 'success'); }} onCopiedUuid={(uuid) => studio.pushToast(`Copied UUID ${shortUuid(uuid)}`, 'info')} onDevLogin={devLogin} onRefreshTraces={() => void studio.refreshServerTraces()} onLogin={async (e, p) => { const r = await apiLogin(e, p); if (r.user) { studio.setUser(r.user); return null; } return r.error ?? 'Failed'; }} onRegister={async (e, p, n) => { const r = await apiRegister(e, p, n); if (r.user) { studio.setUser(r.user); return null; } return r.error ?? 'Failed'; }} onLogout={async () => { await apiLogout(); studio.setUser(null); }} onMintPat={async (lbl) => { const r = await apiMintPat(lbl); return r.token ?? null; }} onCopiedExport={() => studio.pushToast('Copied export artifact to clipboard', 'success')} />
	<UiSpotlightVeil active={studio.spotlight.active} step={studio.spotlight.currentStep} stepIndex={studio.spotlight.stepIndex} totalSteps={studio.spotlight.steps.length} {cornerMode} onPrev={studio.spotlight.prev} onNext={studio.spotlight.next} onRunDrill={(prompt) => { void studio.sendAssistantPrompt(prompt); }} onStop={studio.spotlight.stop} />
	{#if studio.state.studioChromeVisible && project.nodes.length > 0}<UiVirtualCursors peers={studio.state.peers} localSessionId={studio.sessionId} />{/if}
	<UiToastStack toasts={studio.state.toasts} {cornerMode} onDismiss={(id) => studio.dispatch('UI_DISMISS_TOAST', { id })} />
	<UiCyberTooltip tooltip={studio.tooltip.state} />
{/snippet}

{#if !studio.state.studioChromeVisible}
	<div class="relative h-screen w-screen overflow-hidden" style="background-color: var(--ui-base-100); color: var(--ui-base-content);" data-testid="calm-genesis-stage" data-layout-density={studio.state.layoutDensity} data-studio-chrome="false">
		{@render dynamicCanvas()}
		<CalmTopStrip projects={studio.state.projects} activeProjectId={project.id} {cornerMode} polarity={activeTheme.polarity} chromeVisible={false} inputModality={studio.state.inputModality} isDirty={studio.state.projectPersistence.isDirty} saveStatus={studio.state.projectPersistence.status} onSelectProject={(id) => void studio.switchProject(id)} onCreateProject={(name) => void studio.createProject(name)} onSaveWorkspace={() => void studio.saveProject()} onResetDefaultView={studio.resetDefaultView} onCleanWorkspace={() => void studio.cleanWorkspace()} onToggleChrome={() => studio.dispatch('UI_TOGGLE_STUDIO_CHROME', {})} onTogglePolarity={() => studio.dispatch('UI_TOGGLE_POLARITY', {})} onOpenWireframe={() => studio.openModal('radar-skeleton')} onOpenSettings={() => studio.openModal('settings')} onOpenHelp={openHelp} />
		{@render unifiedEdgeRails()}
		{@render assistantAndOverlays()}
	</div>
{:else}
	<div class="relative h-screen w-screen overflow-hidden" data-layout-density={studio.state.layoutDensity} data-studio-chrome="true">
		<UiPerimeterHud {hiddenZones} {cornerMode} onOpenLeftMobile={() => studio.dispatch('UI_SET_DRAWER_OPEN', { side: 'LEFT', open: true })} onOpenRightMobile={() => studio.dispatch('UI_SET_DRAWER_OPEN', { side: 'RIGHT', open: true })} onOpenSettingsMobile={() => studio.openModal('settings')}>
			{#snippet worldCanvas()}{@render dynamicCanvas()}{/snippet}
			{#snippet topLeft()}<TopPerimeterPods zone="TOP_LEFT" blueprint={bp} {cornerMode} polarity={activeTheme.polarity} user={studio.state.user} activeModalId={studio.modal.activeId} glitterBurst={studio.state.helpGlitterCount} isDirty={studio.state.projectPersistence.isDirty} saveStatus={studio.state.projectPersistence.status} onSaveWorkspace={() => void studio.saveProject()} onResetDefaultView={studio.resetDefaultView} onCleanWorkspace={() => void studio.cleanWorkspace()} />{/snippet}
			{#snippet topCenter()}
				{@const z = zoneOf('TOP_CENTER')}
				<div use:uiSpotlight={'spot-top-center'} class="h-full w-full">
					<UiChamferFrame corners={z?.corners} {cornerMode} cornerRadiusRem={z?.cornerRadiusRem} cutTier="station" shape={z?.shape ?? 'BOX'} cornerEmbellishment={z?.cornerEmbellishment} cornerAnimation={z?.cornerAnimation ?? 'NONE'} carets={true} bezel={true} className="grid h-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3">
						<div class="flex min-w-0 items-center gap-1 overflow-x-auto">
							{#each STUDIO_VIEWS as v (v.id)}<UiChamferButton {cornerMode} label={v.label} active={studio.state.activeView === v.id} variant={studio.state.activeView === v.id ? 'primary' : 'surface'} testId={`studio-view-${v.id}`} onclick={() => { studio.dispatch('UI_SET_ACTIVE_VIEW', { view: v.id }); studio.dispatch('HELP_CONTEXT_SHIFTED', { topic: v.topic }); }} className="h-8 shrink-0 whitespace-nowrap px-2 py-0.5 text-xs" />{/each}
						</div>
						<div class="flex shrink-0 items-center justify-center" data-testid="hud-calm-anchor">
							<UiChamferButton {cornerMode} icon="layers" label={STUDIO_UI_COPY.shellCalmLabel} variant="ghost" testId="calm-view-toggle-btn" onclick={() => studio.dispatch('UI_TOGGLE_STUDIO_CHROME', { visible: false })} className="h-8 min-w-[6.75rem] justify-center py-0.5 text-xs" />
						</div>
						<div class="flex min-w-0 shrink-0 items-center justify-end gap-1">
							<div use:uiSpotlight={'spot-station-zone'} class="flex items-center gap-1">
								<UiChamferButton {cornerMode} icon="sliders" label={STUDIO_UI_COPY.stationLabel} variant="surface" testId="open-station-btn" onclick={() => studio.openModal('station-builder')} className="h-8 px-2 py-0.5 text-xs" />
								<UiChamferButton {cornerMode} icon="grid" label={STUDIO_UI_COPY.zonesLabel} variant="surface" onclick={() => openZoneEdition()} className="h-8 px-2 py-0.5 text-xs" />
							</div>
							<UiUtilityIconButton {cornerMode} icon="radar" label="Wireframe Skeleton Workbench" testId="hud-open-wireframe" onclick={() => studio.openModal('radar-skeleton')} />
							<div use:uiSpotlight={'spot-export-pipeline'} class="inline-flex">
								<UiUtilityIconButton {cornerMode} icon="export" label="Export & Full-Stack Build" testId="hud-open-export" onclick={() => studio.openModal('export')} />
							</div>
						</div>
					</UiChamferFrame>
				</div>
			{/snippet}
			{#snippet projectDeck()}
				{@const z = zoneOf('PROJECT_TAB_DECK')}
				<UiChamferFrame corners={z?.corners ?? ZONE_CORNER_PRESETS.PROJECT_DECK} {cornerMode} cornerRadiusRem={z?.cornerRadiusRem} cutTier="station" shape={z?.shape ?? 'BOX'} cornerEmbellishment={z?.cornerEmbellishment} cornerAnimation={z?.cornerAnimation ?? 'NONE'} className="flex items-center justify-between gap-2 px-4">
					<div class="flex items-center gap-1.5 overflow-x-auto">
						{#each studio.state.projects as proj (proj.id)}<UiChamferButton {cornerMode} label={proj.name} active={proj.id === project.id} variant={proj.id === project.id ? 'secondary' : 'ghost'} onclick={() => void studio.switchProject(proj.id)} className="py-0.5" />{/each}
					</div>
					<UiChamferButton {cornerMode} icon="plus" tip="New empty project canvas" onclick={() => void studio.createProject(`Canvas ${studio.state.projects.length + 1}`)} className="px-2 py-0.5" />
				</UiChamferFrame>
			{/snippet}
			{#snippet topRight()}<TopPerimeterPods zone="TOP_RIGHT" blueprint={bp} {cornerMode} polarity={activeTheme.polarity} user={studio.state.user} activeModalId={studio.modal.activeId} glitterBurst={studio.state.helpGlitterCount} onOpenCursors={() => studio.openModal('cursors')} onOpenAuth={() => studio.openModal('auth')} onOpenWire={() => studio.openModal('wire')} onTogglePolarity={() => studio.dispatch('UI_TOGGLE_POLARITY', {})} onOpenHelp={openHelp} onOpenSettings={() => studio.openModal('settings')} onStartSpotlight={() => studio.startSpotlight()} />{/snippet}
			{#snippet drawers()}{@render unifiedEdgeRails()}{/snippet}
			{#snippet bottomLeft()}<WireTelemetryStrip mode="LEFT_STREAM" traces={studio.traces} {cornerMode} zoneConfig={zoneOf('BOTTOM_LEFT')} />{/snippet}
			{#snippet bottomRight()}<BentoRadarConsole {cornerMode} zoneConfig={zoneOf('BOTTOM_RIGHT')} zoom={studio.state.zoom} panX={studio.state.panX} panY={studio.state.panY} activeZoneCount={project.nodes.length} entities={studio.entityRegistry.list()} selectedUuid={studio.state.selectedNodeId} onOpenSkeleton={() => studio.openModal('radar-skeleton')} onZoomIn={() => studio.dispatch('UI_STAGE_PAN_ZOOM', { dz: HUD_METRICS.buttonZoomStep })} onZoomOut={() => studio.dispatch('UI_STAGE_PAN_ZOOM', { dz: -HUD_METRICS.buttonZoomStep })} onResetCamera={() => studio.dispatch('UI_STAGE_PAN_ZOOM', { reset: true })} onToggleLeftDrawer={() => studio.dispatch('UI_SET_DRAWER_OPEN', { side: 'LEFT' })} onToggleRightDrawer={() => studio.dispatch('UI_SET_DRAWER_OPEN', { side: 'RIGHT' })} onStartSpotlight={() => studio.startSpotlight()} />{/snippet}
			{#snippet overlays()}{@render assistantAndOverlays()}{/snippet}
		</UiPerimeterHud>
	</div>
{/if}

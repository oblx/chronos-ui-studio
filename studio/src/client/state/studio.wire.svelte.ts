import {
	applyAccessibilityPrefs, applyControlConfigToRoot, applyCursorPackToDocument, applyMotionTokensToRoot, applyThemeToRoot,
	BUILTIN_CURSOR_PACKS, clampCornerRadiusRem, clampStudioDefaults, createHudBootChoreographer, createModalMachine,
	createMultimodalInputManager, createOverlayDismissMiddleware, createSpotlightMachine, createTooltipController,
	createUiEntityRegistry, createUiWireBroker, DEFAULT_ACCESSIBILITY_PREFS, DEFAULT_CONTROL_CONFIG, DEFAULT_STUDIO_DEFAULTS,
	HUD_STAGGER_BOUNDS, probeEnvironmentCapabilities, resolveActiveSurfaceMs, resolveThemeCursorPalette, setActiveStudioDefaults,
	THEME_PACKS, TOOLTIP_LEVEL_BOUNDS, type GamepadProfileId, type HudZoneId, type IntentKind, type ThemePack, type ViewportTier, type VoiceCaptureMode
} from '@chronos-ui/svelte';
import { STARTER_BLUEPRINTS, STUDIO_SPOTLIGHT_STEPS, type UiBlueprint } from '@studio/config';
import { historyIdbStore } from '@studio/lib/history.idb';
import { apiFetchCursorPacks, createInitialStudioState, createLifecycleActions, GENESIS_FALLBACK, readSessionSnapshot, resolveActiveProject, STUDIO_INITIAL_LAYOUT, syncCorridorForState, syncThemeAndCursor, writeSessionSnapshot } from './lifecycle';
import { apiBroadcastCollabEvent, apiCloneBlueprint, apiCreateTheme, apiDeleteBlueprint, apiFetchAuthMe, apiFetchBlueprints, apiFetchServerTraces, apiFetchThemes, apiPollCollab, apiSaveBlueprint, apiToggleThemeStar } from './studio.api';
import { executeStudioCommand } from './studio.commands';
import { createV003Actions, registerStudioIntentHandlers } from './handlers';
import { apiCreateProject, apiFetchAiProfiles, apiFetchChat, apiFetchEnvCapabilities, apiFetchProjects, apiSaveAiProfile, apiSendAssistantPrompt } from './studio.project.api';
import type { StudioModalId, StudioState, StudioUser } from './studio.types';

const REALTIME_SYNC_KINDS = new Set<IntentKind>(['UI_SET_LAYOUT_DENSITY', 'UI_ASSISTANT_TOGGLE_FLOAT', 'UI_ASSISTANT_SUBMIT', 'UI_STATION_PREVIEW_UPDATE', 'UI_PROJECT_SAVE']);
const SESSION_PERSIST_KINDS = new Set<IntentKind>(['UI_SET_LAYOUT_DENSITY', 'UI_TOGGLE_STUDIO_CHROME', 'UI_SWITCH_PROJECT', 'UI_ASSISTANT_TOGGLE_FLOAT', 'UI_ASSISTANT_MOVE', 'UI_ASSISTANT_DROP', 'UI_ASSISTANT_DOCK', 'UI_SET_STUDIO_DEFAULT', 'UI_SET_CORNER_RADIUS', 'UI_SET_CORNER_STYLE', 'UI_APPLY_CURSOR_PACK', 'UI_SET_DRAWER_OPEN', 'UI_SET_CONTROL_CONFIG', 'UI_SET_HISTORY_LIMIT', 'UI_SET_TOOLTIP_INFO_LEVEL']);
const persistSessionFromState = (s: StudioState): void => { writeSessionSnapshot({ activeProjectId: s.activeProjectId, layoutDensity: s.layoutDensity, studioChromeVisible: s.studioChromeVisible, toolPaletteOpen: s.toolPaletteOpen, leftDrawerOpen: s.leftDrawer.open, rightDrawerOpen: s.rightDrawer.open, assistantDock: s.assistantDock, studioDefaults: s.studioDefaults, activeCursorPackId: s.activeCursorPackId, updatedAt: Date.now() }); };

function createStudioOps(broker: ReturnType<typeof createUiWireBroker<StudioState>>, sessionId: string) {
	const pushToast = (title: string, tone: 'info' | 'success' | 'warning' | 'error' = 'info'): void => { broker.dispatch('UI_PUSH_TOAST', { title, tone }); };
	const syncCatalog = async (): Promise<void> => {
		const [themes, blueprints, projects] = await Promise.all([apiFetchThemes(), apiFetchBlueprints(), apiFetchProjects()]);
		broker.patchState((s) => ({ ...s, themes: themes.length ? themes : s.themes, blueprints: blueprints.length ? blueprints : s.blueprints, projects: projects.length ? projects : s.projects }));
	};
	const pollCollab = async (): Promise<void> => {
		const cur = broker.state;
		const data = await apiPollCollab({ sessionId, label: cur.user?.displayName ?? 'Operator', x: STUDIO_INITIAL_LAYOUT.peerOriginX + cur.panX, y: STUDIO_INITIAL_LAYOUT.peerOriginY + cur.panY });
		if (!data) return;
		broker.patchState((s) => ({ ...s, peers: data.peers.filter((p) => p.sessionId !== sessionId) }));
		for (const cmd of data.commands) { broker.dispatch(cmd.kind as IntentKind, cmd.payload, 'MCP_TWIN'); broker.patchState((s) => ({ ...s, lastMcpActivity: `MCP executed ${cmd.kind}` })); }
	};
	const hydrate = async (): Promise<void> => {
		applyThemeToRoot(THEME_PACKS[0]); applyAccessibilityPrefs(DEFAULT_ACCESSIBILITY_PREFS); applyMotionTokensToRoot(); applyControlConfigToRoot(DEFAULT_STUDIO_DEFAULTS.controlConfig ?? DEFAULT_CONTROL_CONFIG); applyCursorPackToDocument(BUILTIN_CURSOR_PACKS[0], resolveThemeCursorPalette(THEME_PACKS[0]));
		const [themes, blueprints, user, projects, aiProfiles, serverEnv, cursorPacks, saved] = await Promise.all([apiFetchThemes(), apiFetchBlueprints(), apiFetchAuthMe(), apiFetchProjects(), apiFetchAiProfiles(), apiFetchEnvCapabilities(), apiFetchCursorPacks(), readSessionSnapshot()]);
		const activeProj = (saved ? projects.find((p) => p.id === saved.activeProjectId) : null) ?? projects.find((p) => p.id === GENESIS_FALLBACK.id) ?? projects[0] ?? GENESIS_FALLBACK;
		const customDef = aiProfiles.find((p) => p.isDefault && p.providerKind !== 'local');
		const [chatMessages, envCapabilities, idbHistory] = await Promise.all([apiFetchChat(activeProj.id), probeEnvironmentCapabilities(serverEnv, Boolean(customDef)), historyIdbStore.load(activeProj.id)]);
		const nextPacks = cursorPacks.length ? cursorPacks : broker.state.cursorPacks;
		const activeCursorPackId = saved?.activeCursorPackId ?? activeProj.activeCursorPackId ?? nextPacks[0]?.uuid ?? BUILTIN_CURSOR_PACKS[0].uuid;
		const matchedPack = nextPacks.find((c) => c.uuid === activeCursorPackId || c.slug === activeCursorPackId) ?? BUILTIN_CURSOR_PACKS[0];
		const activeTheme = (themes.length ? themes : THEME_PACKS).find((t) => t.id === activeProj.themeId) ?? THEME_PACKS[0];
		const studioDefaults = clampStudioDefaults(activeProj.studioDefaults ?? saved?.studioDefaults, { ...DEFAULT_STUDIO_DEFAULTS, baseCornerCutRem: clampCornerRadiusRem(activeProj.cornerRadiusRem) });
		const nextAccess = { ...broker.state.accessibility, cornerMode: activeProj.cornerMode, cornerRadiusRem: studioDefaults.baseCornerCutRem };
		setActiveStudioDefaults(studioDefaults); applyAccessibilityPrefs(nextAccess);
		broker.patchState((s) => ({ ...s, themes: themes.length ? themes : THEME_PACKS, activeThemeId: activeTheme.id, blueprints: blueprints.length ? blueprints : STARTER_BLUEPRINTS, activeBlueprintId: blueprints[0]?.id ?? STARTER_BLUEPRINTS[0].id, projects: projects.length ? projects : [GENESIS_FALLBACK], activeProjectId: activeProj.id, undoStack: s.undoStack.length ? s.undoStack : (idbHistory?.undoStack ?? []), redoStack: s.redoStack.length ? s.redoStack : (idbHistory?.redoStack ?? []), accessibility: nextAccess, studioDefaults, cursorPacks: nextPacks, activeCursorPackId: matchedPack.uuid, aiProfiles: aiProfiles.length ? aiProfiles : s.aiProfiles, chatMessages, user, envCapabilities, activeAdapterBadge: customDef ? customDef.modelId : envCapabilities.badgeLabel }));
		syncThemeAndCursor(broker.state); syncCorridorForState(broker.state);
	};
	return { pushToast, syncCatalog, pollCollab, hydrate };
}

function createProjectAndAiActions(broker: ReturnType<typeof createUiWireBroker<StudioState>>, ops: ReturnType<typeof createStudioOps>, openModal: (id: StudioModalId) => void) {
	const sendAssistantPrompt = async (prompt: string): Promise<void> => {
		if (prompt.trim().toLowerCase() === '/dock') { broker.dispatch('UI_ASSISTANT_DOCK', {}); ops.pushToast('Assistant docked to bottom center', 'info'); return; }
		const userMsg = { id: `u-${Date.now()}`, role: 'user' as const, content: prompt, createdAt: Date.now() };
		broker.dispatch('UI_ASSISTANT_SUBMIT', { projectId: broker.state.activeProjectId });
		broker.patchState((s) => ({ ...s, assistantBusy: true, assistantOcular: 'BUILDING_UI', chatMessages: [...s.chatMessages, userMsg] }));
		try {
			const res = await apiSendAssistantPrompt(broker.state.activeProjectId, prompt);
			if (res.error) throw new Error(res.error);
			broker.patchState((s) => ({ ...s, assistantBusy: false, assistantOcular: 'IDLE', activeAdapterBadge: res.modelLabel ?? s.activeAdapterBadge, projects: res.projects?.length ? res.projects : s.projects, activeProjectId: res.project?.id ?? s.activeProjectId, activeThemeId: res.project?.themeId ?? s.activeThemeId, chatMessages: res.message ? [...s.chatMessages, res.message] : s.chatMessages }));
			if (res.project?.themeId) syncThemeAndCursor(broker.state);
			for (const ci of res.clientIntents ?? []) {
				if (ci.kind === 'UI_OPEN_MODAL' && typeof ci.payload.id === 'string') {
					if (typeof ci.payload.zoneId === 'string') broker.patchState((s) => ({ ...s, selectedZoneId: ci.payload.zoneId as HudZoneId }));
					openModal(ci.payload.id as StudioModalId);
				} else broker.dispatch(ci.kind as IntentKind, ci.payload, 'ASSISTANT_CHAT');
			}
		} catch (err) {
			broker.patchState((s) => ({ ...s, assistantBusy: false, assistantOcular: 'ERROR' }));
			ops.pushToast(err instanceof Error ? err.message : 'Assistant request failed', 'error');
		}
	};
	const createProject = async (name: string): Promise<void> => { const proj = await apiCreateProject(name); if (!proj) return; await ops.syncCatalog(); broker.dispatch('UI_SWITCH_PROJECT', { projectId: proj.id }); broker.patchState((s) => ({ ...s, chatMessages: [] })); ops.pushToast(`Created empty canvas: ${proj.name}`, 'success'); };
	const switchProject = async (projectId: string): Promise<void> => { broker.dispatch('UI_SWITCH_PROJECT', { projectId }); const [msgs, hist] = await Promise.all([apiFetchChat(projectId), historyIdbStore.load(projectId)]); broker.patchState((s) => ({ ...s, chatMessages: msgs, undoStack: hist?.undoStack ?? [], redoStack: hist?.redoStack ?? [] })); };
	const saveAiProfile = async (payload: Record<string, unknown>): Promise<void> => { const profiles = await apiSaveAiProfile(payload); const customDef = profiles.find((p) => p.isDefault && p.providerKind !== 'local'); broker.patchState((s) => ({ ...s, aiProfiles: profiles, activeAdapterBadge: customDef ? customDef.modelId : (s.envCapabilities?.badgeLabel ?? 'LOCAL AGENT') })); ops.pushToast('Saved AI model profile in AEAD vault', 'success'); };
	return { sendAssistantPrompt, createProject, switchProject, saveAiProfile };
}

function createCatalogActions(broker: ReturnType<typeof createUiWireBroker<StudioState>>, ops: ReturnType<typeof createStudioOps>) {
	const mutate = async (fn: () => Promise<unknown>, toast?: string): Promise<void> => { await fn(); await ops.syncCatalog(); if (toast) ops.pushToast(toast, 'success'); };
	return {
		saveBlueprint: (bp: UiBlueprint) => mutate(() => apiSaveBlueprint(bp), `Saved blueprint: ${bp.name}`),
		cloneBlueprint: (id: string) => mutate(() => apiCloneBlueprint(id), 'Cloned blueprint'),
		deleteBlueprint: async (id: string) => { if (broker.state.blueprints.length <= 1) { ops.pushToast('At least one blueprint must remain active', 'warning'); return; } await mutate(() => apiDeleteBlueprint(id), 'Blueprint deleted'); },
		toggleThemeStar: (id: string) => mutate(() => apiToggleThemeStar(id)),
		createCustomTheme: (pack: ThemePack) => mutate(() => apiCreateTheme(pack), `Published theme: ${pack.name}`),
		refreshServerTraces: async () => { if (!broker.state.user) return { forbidden: true }; const r = await apiFetchServerTraces(); if (r.traces) broker.ingestServerTraces(r.traces); return r; }
	};
}

const MODAL_ID_ALIASES: Readonly<Record<string, StudioModalId>> = { GLOBAL_SEARCH: 'global-search', 'global-search': 'global-search', RADAR_SKELETON: 'radar-skeleton', 'radar-skeleton': 'radar-skeleton', SETTINGS: 'settings', settings: 'settings', EXPORT: 'export', export: 'export', TOME: 'tome', tome: 'tome', WIRE: 'wire', wire: 'wire', AUTH: 'auth', auth: 'auth', CURSORS: 'cursors', cursors: 'cursors', STATION_BUILDER: 'station-builder', 'station-builder': 'station-builder', ZONE_EDITION: 'zone-edition', 'zone-edition': 'zone-edition' };

function attachEntityMiddleware(broker: ReturnType<typeof createUiWireBroker<StudioState>>, entityRegistry: ReturnType<typeof createUiEntityRegistry>, modal: ReturnType<typeof createModalMachine>, spotlight: ReturnType<typeof createSpotlightMachine>, hudBoot: ReturnType<typeof createHudBootChoreographer>, sessionId: string, clearSampleTimers: () => void, onSaveProject: () => void): void {
	let lastProjId = '', lastNodesRef: unknown = null;
	broker.use((env, _s, next) => {
		if (env.kind === 'UI_UNDO_REVISION' || env.kind === 'UI_REDO_REVISION' || env.kind === 'UI_SWITCH_PROJECT') clearSampleTimers();
		next();
		const proj = resolveActiveProject(broker.state);
		if (proj && (proj.id !== lastProjId || proj.nodes !== lastNodesRef)) { lastProjId = proj.id; lastNodesRef = proj.nodes; entityRegistry.syncProjectNodes(proj.id, proj.nodes, String(env.timestamp)); }
		const p = (env.payload ?? {}) as Record<string, unknown>;
		const rawModalId = typeof p.id === 'string' ? p.id : (typeof p.modalId === 'string' ? p.modalId : null);
		if (env.kind === 'UI_OPEN_MODAL' && rawModalId) modal.open({ id: MODAL_ID_ALIASES[rawModalId] ?? rawModalId, lockSeconds: typeof p.lockSeconds === 'number' ? p.lockSeconds : 0 });
		if (env.kind === 'OPEN_CONTEXTUAL_HELP') modal.open({ id: 'tome', lockSeconds: 0 });
		if (env.kind === 'UI_CLOSE_MODAL') modal.close();
		if (env.kind === 'UI_DISMISS_TOP_OVERLAY') { if (modal.activeId) modal.close(); else if (spotlight.active) spotlight.stop(); }
		if (env.kind === 'UI_PROJECT_SAVE' && env.origin === 'KEYBOARD_SHORTCUT') onSaveProject();
		if (env.kind === 'UI_MODAL_TOGGLE_EXPAND') { if (typeof p.expanded === 'boolean') { if (modal.isExpanded !== p.expanded) modal.setExpanded(p.expanded); } else modal.toggleExpand(); }
		if (env.kind === 'UI_TOGGLE_STUDIO_CHROME') { if (broker.state.studioChromeVisible) hudBoot.start(); else hudBoot.cancel(); }
		if (env.kind === 'UI_REPLAY_HUD_SEQUENCE') hudBoot.replay(typeof p.intervalMs === 'number' ? p.intervalMs : undefined);
		const nid = typeof p.nodeId === 'string' ? p.nodeId : (typeof (p.node as { id?: string } | undefined)?.id === 'string' ? (p.node as { id: string }).id : null);
		if (nid) entityRegistry.pulseEntity(nid, String(env.timestamp));
		if (SESSION_PERSIST_KINDS.has(env.kind) || env.kind === 'UI_REBIND_SHORTCUT') persistSessionFromState(broker.state);
		if (env.origin !== 'MCP_TWIN' && REALTIME_SYNC_KINDS.has(env.kind)) void apiBroadcastCollabEvent(sessionId, env.kind, p);
	});
}

export function createStudioController() {
	const broker = createUiWireBroker<StudioState>(createInitialStudioState());
	const modal = createModalMachine({ onOpened: (id) => broker.dispatch('UI_MODAL_OPENED', { id }), onClosed: (id) => broker.dispatch('UI_MODAL_CLOSED', { id }), getDurationMs: (dir) => resolveActiveSurfaceMs('MODAL', dir) });
	const hudBoot = createHudBootChoreographer({ getStaggerMs: () => broker.state.studioDefaults.hudZoneStaggerMs ?? HUD_STAGGER_BOUNDS.defaultMs, isReducedMotion: () => !broker.state.accessibility.kineticMotion, onRevealZone: (zoneId, index, total, immediate) => broker.dispatch('UI_REVEAL_ZONE', { zoneId, index, total, immediate }) });
	const spotlight = createSpotlightMachine(), tooltip = createTooltipController(() => broker.state.studioDefaults.tooltipInfoLevel ?? TOOLTIP_LEVEL_BOUNDS.defaultLevel), entityRegistry = createUiEntityRegistry();
	const sessionId = `studio-${Math.random().toString(36).slice(2, 8)}`;
	registerStudioIntentHandlers(broker);
	broker.use(createOverlayDismissMiddleware(() => tooltip.hide()));
	const ops = createStudioOps(broker, sessionId), catalog = createCatalogActions(broker, ops);
	const openModal = (id: StudioModalId, lockSeconds = 0): void => { const norm = MODAL_ID_ALIASES[id] ?? id; tooltip.hide(); broker.dispatch('UI_OPEN_MODAL', { id: norm, modalId: norm, lockSeconds }); if (norm === 'wire') void catalog.refreshServerTraces(); };
	const closeModal = (): void => { tooltip.hide(); broker.dispatch('UI_CLOSE_MODAL', {}); };
	const replayHudSequence = (intervalMs?: number): void => { tooltip.hide(); broker.dispatch('UI_CLOSE_MODAL', {}); broker.dispatch('UI_REPLAY_HUD_SEQUENCE', { intervalMs: intervalMs ?? broker.state.studioDefaults.hudZoneStaggerMs }); };
	const projectAi = createProjectAndAiActions(broker, ops, openModal), lifecycle = createLifecycleActions(broker, { pushToast: ops.pushToast });
	const v003 = createV003Actions(broker, { pushToast: ops.pushToast, sendPrompt: projectAi.sendAssistantPrompt, openModal });
	attachEntityMiddleware(broker, entityRegistry, modal, spotlight, hudBoot, sessionId, v003.clearSampleTimers, () => { void lifecycle.saveProject(); });
	const input = createMultimodalInputManager({ onAction: v003.handleSemanticInput, onModalityChange: (inputModality) => broker.patchState((s) => ({ ...s, inputModality })) });
	const startSpotlight = () => { tooltip.hide(); if (!broker.state.studioChromeVisible) { broker.dispatch('UI_TOGGLE_STUDIO_CHROME', { visible: true }); hudBoot.revealImmediate(); requestAnimationFrame(() => spotlight.start(STUDIO_SPOTLIGHT_STEPS)); } else { hudBoot.revealImmediate(); spotlight.start(STUDIO_SPOTLIGHT_STEPS); } };
	const runCommand = (raw: string) => { broker.patchState((s) => ({ ...s, lastCommandOutput: executeStudioCommand(raw, { getState: () => broker.state, dispatch: broker.dispatch, openModal, startSpotlight, pushToast: ops.pushToast }) })); };
	return {
		get state(): StudioState { return broker.state; }, get traces() { return broker.traces; }, clearTraces: () => broker.clearTraces(),
		modal, hudBoot, spotlight, tooltip, entityRegistry, input, sessionId, openModal, closeModal, replayHudSequence, startSpotlight, runCommand,
		dispatch: <P>(kind: IntentKind, payload: P, origin?: 'USER' | 'KEYBOARD_SHORTCUT' | 'ASSISTANT_CHAT' | 'VOICE' | 'GAMEPAD' | 'MCP_TWIN' | 'BROADCAST' | 'SYSTEM') => { tooltip.hide(); return broker.dispatch(kind, payload, origin); },
		selectZone: (selectedZoneId: HudZoneId) => broker.patchState((s) => ({ ...s, selectedZoneId })),
		toggleToolPalette: (open?: boolean) => { tooltip.hide(); hudBoot.revealImmediate(); broker.patchState((s) => { const next = open ?? !(s.leftDrawer.open && s.leftDrawer.activeTab === 'build'); return { ...s, toolPaletteOpen: next, leftDrawer: { ...s.leftDrawer, open: next, activeTab: 'build' } }; }); },
		setVoiceMode: (voiceMode: VoiceCaptureMode) => { input.setVoiceMode(voiceMode); broker.patchState((s) => ({ ...s, voiceMode })); },
		setGamepadOverride: (gamepadOverride: GamepadProfileId | null) => { input.setGamepadOverride(gamepadOverride); broker.patchState((s) => ({ ...s, gamepadOverride })); },
		setPreviewTier: (previewTier: ViewportTier) => broker.patchState((s) => ({ ...s, previewTier })), setLowMemoryMode: (lowMemoryMode: boolean) => broker.patchState((s) => ({ ...s, lowMemoryMode })), setUser: (user: StudioUser | null) => broker.patchState((s) => ({ ...s, user })),
		pushToast: ops.pushToast, pollCollab: ops.pollCollab, hydrate: ops.hydrate, ...catalog, ...projectAi, ...v003, ...lifecycle, destroy: () => { v003.clearSampleTimers(); hudBoot.cancel(); broker.destroy(); modal.destroy(); }
	};
}

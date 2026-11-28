import {
	applyControlConfigToRoot, applyStudioDefaults, canonicalizeChordString, clampControlConfig, clampHistoryLimit, clampStudioDefaults,
	clampTooltipInfoLevel, DEFAULT_CONTROL_CONFIG, DEFAULT_STUDIO_DEFAULTS, HUD_STAGGER_BOUNDS,
	resolveTooltipTierLabel, setActiveStudioDefaults, validateShortcutRegistry, VERSION,
	type ButtonControlConfig, type FormControlConfig, type GraphEdgeRouting, type HudZoneId,
	type StudioControlConfig, type UiWireBroker, type WireTimeScaleCurve
} from '@chronos-ui/svelte';
import { trimHistoryStacks } from '@studio/lib/history.idb';
import { apiPatchProjectStudioDefaults, persistActiveHistory } from '../lifecycle';
import type { StudioState } from '../studio.types';

export { persistActiveHistory };

function updateStudioDefaults(state: StudioState, patch: Partial<StudioState['studioDefaults']>): StudioState {
	const nextDefaults = { ...DEFAULT_STUDIO_DEFAULTS, ...state.studioDefaults, ...patch };
	return {
		...state,
		studioDefaults: nextDefaults,
		projects: state.projects.map((p) => (p.id === state.activeProjectId ? { ...p, studioDefaults: nextDefaults } : p))
	};
}

function persistDefaultsEffect(state: StudioState): void {
	setActiveStudioDefaults(state.studioDefaults);
	applyStudioDefaults(state.studioDefaults);
	applyControlConfigToRoot(state.studioDefaults.controlConfig ?? DEFAULT_CONTROL_CONFIG);
	if (typeof window !== 'undefined') void apiPatchProjectStudioDefaults(state.activeProjectId, state.studioDefaults);
}

function registerControlAndHistoryHandlers(broker: UiWireBroker<StudioState>): void {
	broker.register<{ controlConfig?: StudioControlConfig; buttonConfig?: Partial<ButtonControlConfig>; formConfig?: Partial<FormControlConfig> }>('UI_SET_CONTROL_CONFIG', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => {
			const base = s.studioDefaults.controlConfig ?? DEFAULT_STUDIO_DEFAULTS.controlConfig;
			const nextControl = env.payload.controlConfig
				? clampControlConfig(env.payload.controlConfig, base)
				: clampControlConfig({ buttonConfig: env.payload.buttonConfig, formConfig: env.payload.formConfig }, base);
			if (typeof document !== 'undefined') applyControlConfigToRoot(nextControl);
			return updateStudioDefaults(s, { controlConfig: nextControl });
		},
		effect: persistDefaultsEffect,
		summarize: (env) => `Controls -> ${env.payload.buttonConfig?.variant ?? env.payload.controlConfig?.buttonConfig.variant ?? 'updated'}`
	});
	broker.register<{ limit: number }>('UI_SET_HISTORY_LIMIT', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => {
			const limit = clampHistoryLimit(env.payload.limit);
			const trimmed = trimHistoryStacks(s.undoStack, s.redoStack, limit);
			return { ...updateStudioDefaults(s, { historyLimit: limit }), undoStack: trimmed.undoStack, redoStack: trimmed.redoStack };
		},
		effect: (s) => { persistDefaultsEffect(s); persistActiveHistory(s); },
		summarize: (env) => `History ring limit -> ${clampHistoryLimit(env.payload.limit)}`
	});
	broker.register<{ infoLevel: number }>('UI_SET_TOOLTIP_INFO_LEVEL', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => updateStudioDefaults(s, { tooltipInfoLevel: clampTooltipInfoLevel(env.payload.infoLevel) }),
		effect: persistDefaultsEffect,
		summarize: (env) => `Tooltip level -> ${clampTooltipInfoLevel(env.payload.infoLevel)} (${resolveTooltipTierLabel(clampTooltipInfoLevel(env.payload.infoLevel))})`
	});
}

function registerMotionAndSyncHandlers(broker: UiWireBroker<StudioState>): void {
	broker.register<{ id?: string; modalId?: string; lockSeconds?: number }>('UI_OPEN_MODAL', { tier: 'TIER_0_LOCAL_UI', reduce: (s) => s, summarize: (env) => `Open modal: ${env.payload.id ?? env.payload.modalId}` });
	broker.register('UI_CLOSE_MODAL', { tier: 'TIER_0_LOCAL_UI', reduce: (s) => s, summarize: () => 'Close active modal' });
	broker.register<{ id: string }>('UI_MODAL_OPENED', { tier: 'TIER_0_LOCAL_UI', reduce: (s) => s, summarize: (env) => `Modal opened: ${env.payload.id}` });
	broker.register<{ id: string }>('UI_MODAL_CLOSED', { tier: 'TIER_0_LOCAL_UI', reduce: (s) => s, summarize: (env) => `Modal closed: ${env.payload.id}` });
	broker.register<{ zoneId: HudZoneId; index?: number; total?: number; immediate?: boolean }>('UI_REVEAL_ZONE', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => {
			const revealedZones = s.revealedZones.includes(env.payload.zoneId) ? s.revealedZones : [...s.revealedZones, env.payload.zoneId];
			const done = env.payload.total !== undefined && env.payload.index !== undefined && env.payload.index + 1 >= env.payload.total;
			return { ...s, revealedZones, hudBootRunning: env.payload.immediate ? false : !done };
		},
		summarize: (env) => `Revealed zone ${env.payload.zoneId}`
	});
	broker.register<{ intervalMs?: number }>('UI_REPLAY_HUD_SEQUENCE', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s) => ({ ...s, studioChromeVisible: true, revealedZones: ['WORLD_CANVAS'], hudBootRunning: true }),
		summarize: (env) => `Replaying HUD sequence (${env.payload.intervalMs ?? HUD_STAGGER_BOUNDS.defaultMs}ms ASC)`
	});
	broker.register<{ toolCount: number; syncedAt: number; version?: string }>('SERVER_MANIFEST_SYNCED', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => ({ ...s, mcpManifestSyncedAt: env.payload.syncedAt, mcpToolCount: env.payload.toolCount, lastMcpActivity: `Synced ${env.payload.toolCount} MCP tools (v${env.payload.version ?? VERSION})` }),
		summarize: (env) => `Synced MCP manifest (${env.payload.toolCount} tools)`
	});
}

function registerGraphAndTimescaleHandlers(broker: UiWireBroker<StudioState>): void {
	broker.register<{ multiplier?: number; curve?: WireTimeScaleCurve }>('UI_SET_WIRE_TIMESCALE', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => updateStudioDefaults(s, clampStudioDefaults({
			...(env.payload.multiplier !== undefined ? { wireTimeScaleMultiplier: env.payload.multiplier } : {}),
			...(env.payload.curve !== undefined ? { wireTimeScaleCurve: env.payload.curve } : {})
		}, s.studioDefaults)),
		effect: persistDefaultsEffect,
		summarize: (env) => `Wire time-scale -> ${env.payload.multiplier ?? 'keep'}x (${env.payload.curve ?? 'keep'})`
	});
	broker.register<{ routing?: GraphEdgeRouting; packetSizePx?: number; nodeId?: string; props?: Record<string, unknown> }>('UI_CONFIGURE_GRAPH', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => {
			const next = updateStudioDefaults(s, clampStudioDefaults({ ...(env.payload.routing ? { graphRouting: env.payload.routing } : {}), ...(env.payload.packetSizePx !== undefined ? { graphPacketSizePx: env.payload.packetSizePx } : {}) }, s.studioDefaults));
			if (!env.payload.nodeId) return next;
			return { ...next, projects: next.projects.map((p) => (p.id !== next.activeProjectId ? p : { ...p, nodes: p.nodes.map((n) => (n.id === env.payload.nodeId ? { ...n, props: { ...n.props, ...(env.payload.routing ? { routing: env.payload.routing } : {}), ...(env.payload.props ?? {}) } } : n)) })) };
		},
		effect: persistDefaultsEffect,
		summarize: (env) => `Configured event graph (${env.payload.routing ?? 'updated'})`
	});
	broker.register<{ nodeId: string }>('UI_GRAPH_SELECT_NODE', { tier: 'TIER_0_LOCAL_UI', reduce: (s) => s, summarize: (env) => `Graph node selected: ${env.payload.nodeId}` });
	broker.register<{ edgeId: string }>('UI_GRAPH_SELECT_EDGE', { tier: 'TIER_0_LOCAL_UI', reduce: (s) => s, summarize: (env) => `Graph edge selected: ${env.payload.edgeId}` });
	broker.register<Record<string, unknown>>('UI_GRAPH_FIT', { tier: 'TIER_0_LOCAL_UI', reduce: (s) => s, summarize: () => 'Fitted event graph to viewport' });
}

function registerShortcutIntentHandlers(broker: UiWireBroker<StudioState>): void {
	broker.register('UI_HISTORY_UNDO', { tier: 'TIER_0_LOCAL_UI', reduce: (s) => s, effect: () => { broker.dispatch('UI_UNDO_REVISION', {}); }, summarize: () => 'Shortcut: Undo revision' });
	broker.register('UI_HISTORY_REDO', { tier: 'TIER_0_LOCAL_UI', reduce: (s) => s, effect: () => { broker.dispatch('UI_REDO_REVISION', {}); }, summarize: () => 'Shortcut: Redo revision' });
	broker.register<{ side?: 'LEFT' | 'RIGHT' }>('UI_TOGGLE_DRAWER', { tier: 'TIER_0_LOCAL_UI', reduce: (s, env) => (env.payload.side === 'RIGHT' ? { ...s, rightDrawer: { ...s.rightDrawer, open: !s.rightDrawer.open } } : { ...s, leftDrawer: { ...s.leftDrawer, open: !s.leftDrawer.open } }), summarize: (env) => `Toggle ${env.payload.side ?? 'LEFT'} drawer` });
	broker.register('UI_ASSISTANT_TOGGLE_EXPAND', { tier: 'TIER_0_LOCAL_UI', reduce: (s) => ({ ...s, assistantDock: { ...s.assistantDock, expanded: !s.assistantDock.expanded } }), summarize: () => 'Toggle AI Assistant console' });
	broker.register('OPEN_CONTEXTUAL_HELP', { tier: 'TIER_0_LOCAL_UI', reduce: (s) => ({ ...s, helpGlitterCount: s.helpGlitterCount + 1 }), summarize: () => 'Open contextual Field Tome help' });
	broker.register('UI_DISMISS_TOP_OVERLAY', { tier: 'TIER_0_LOCAL_UI', reduce: (s) => s, summarize: () => 'Dismiss top overlay' });
	broker.register<{ shortcutId: string; chord: string | null }>('UI_REBIND_SHORTCUT', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => {
			const nextMap: Record<string, string> = { ...(s.studioDefaults.shortcutOverrides ?? {}) };
			if (!env.payload.chord) delete nextMap[env.payload.shortcutId];
			else nextMap[env.payload.shortcutId] = canonicalizeChordString(env.payload.chord);
			return validateShortcutRegistry(undefined, nextMap).valid ? updateStudioDefaults(s, { shortcutOverrides: nextMap }) : s;
		},
		effect: persistDefaultsEffect,
		summarize: (env) => `Rebind shortcut ${env.payload.shortcutId} -> ${env.payload.chord ?? 'default'}`
	});
}

export function registerV011Handlers(broker: UiWireBroker<StudioState>): void {
	registerControlAndHistoryHandlers(broker);
	registerMotionAndSyncHandlers(broker);
	registerGraphAndTimescaleHandlers(broker);
	registerShortcutIntentHandlers(broker);
}

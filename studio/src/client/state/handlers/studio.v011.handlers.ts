import {
	applyControlConfigToRoot, applyStudioDefaults, clampControlConfig, clampHistoryLimit,
	clampTooltipInfoLevel, DEFAULT_CONTROL_CONFIG, DEFAULT_STUDIO_DEFAULTS, resolveTooltipTierLabel, setActiveStudioDefaults,
	type ButtonControlConfig, type FormControlConfig, type HudZoneId, type StudioControlConfig, type UiWireBroker
} from '@chronos-ui/svelte';
import { historyIdbStore, trimHistoryStacks } from '@studio/lib/history.idb';
import { apiPatchProjectStudioDefaults } from '../lifecycle';
import type { StudioState } from '../studio.types';

export function persistActiveHistory(state: StudioState): void {
	if (typeof window === 'undefined') return;
	const proj = state.projects.find((p) => p.id === state.activeProjectId) ?? state.projects[0];
	if (!proj) return;
	const historyLimit = clampHistoryLimit(state.studioDefaults.historyLimit);
	void historyIdbStore.save(proj.id, { undoStack: state.undoStack, redoStack: state.redoStack, historyLimit });
}

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
	broker.register<{ id: string; lockSeconds?: number }>('UI_OPEN_MODAL', { tier: 'TIER_0_LOCAL_UI', reduce: (s) => s, summarize: (env) => `Open modal: ${env.payload.id}` });
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
		summarize: (env) => `Replaying HUD sequence (${env.payload.intervalMs ?? 250}ms ASC)`
	});
	broker.register<{ toolCount: number; syncedAt: number; version?: string }>('SERVER_MANIFEST_SYNCED', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => ({ ...s, mcpManifestSyncedAt: env.payload.syncedAt, mcpToolCount: env.payload.toolCount, lastMcpActivity: `Synced ${env.payload.toolCount} MCP tools (v${env.payload.version ?? '0.1.1'})` }),
		summarize: (env) => `Synced MCP manifest (${env.payload.toolCount} tools)`
	});
}

export function registerV011Handlers(broker: UiWireBroker<StudioState>): void {
	registerControlAndHistoryHandlers(broker);
	registerMotionAndSyncHandlers(broker);
}

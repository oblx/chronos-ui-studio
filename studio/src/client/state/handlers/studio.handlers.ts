import {
	applyAccessibilityPrefs, findThemePack, type AccessibilityPrefs, type CornerKind, type UiWireBroker
} from '@chronos-ui/svelte';
import type { UiBlueprint } from '@studio/config';
import { registerLifecycleAndCursorHandlers, syncThemeAndCursor } from '../lifecycle';
import { apiFetchMcpManifest, apiFetchServerTraces, apiSaveBlueprint } from '../studio.api';
import { registerDrawerAndStageHandlers } from './studio.drawer.handlers';
import { registerProjectHandlers } from './studio.project.handlers';
import type { StudioState, StudioViewId, ZoneCornerPayload, ZoneTogglePayload } from '../studio.types';
import { registerV003Handlers } from './studio.v003.handlers';
import { registerV011Handlers } from './studio.v011.handlers';

function updateActiveBlueprint(state: StudioState, updater: (bp: UiBlueprint) => UiBlueprint): StudioState {
	const nextList = state.blueprints.map((bp) => (bp.id === state.activeBlueprintId ? updater(bp) : bp));
	return { ...state, blueprints: nextList };
}

function registerThemeHandlers(broker: UiWireBroker<StudioState>): void {
	broker.register<{ themeId: string }>('UI_SET_THEME', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => updateActiveBlueprint({ ...s, activeThemeId: env.payload.themeId }, (bp) => ({ ...bp, themeId: env.payload.themeId })),
		effect: (s) => syncThemeAndCursor(s),
		summarize: (env) => `Theme -> ${env.payload.themeId}`
	});
	broker.register('UI_TOGGLE_POLARITY', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s) => {
			const current = s.themes.find((t) => t.id === s.activeThemeId) ?? findThemePack(s.activeThemeId);
			const nextPolar = current.polarity === 'dark' ? 'light' : 'dark';
			const target = s.themes.find((t) => t.polarity === nextPolar) ?? findThemePack(nextPolar === 'dark' ? 'obsidian-brass' : 'alabaster-lab');
			return { ...s, activeThemeId: target.id };
		},
		effect: (s) => syncThemeAndCursor(s),
		summarize: () => 'Toggled dark/light polarity'
	});
	broker.register<Partial<AccessibilityPrefs>>('UI_SET_ACCESSIBILITY', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => ({ ...s, accessibility: { ...s.accessibility, ...env.payload } }),
		effect: (s) => applyAccessibilityPrefs(s.accessibility),
		summarize: () => 'Updated accessibility prefs'
	});
}

function reduceActiveView(s: StudioState, view: StudioViewId): StudioState {
	if (view === 'THEMES') {
		return { ...s, activeView: view, helpTopic: 'themes', rightDrawer: { ...s.rightDrawer, open: true, activeTab: 'themes' } };
	}
	if (view === 'BLUEPRINTS') {
		return { ...s, activeView: view, helpTopic: 'blueprints', leftDrawer: { ...s.leftDrawer, open: true, activeTab: 'blueprints' } };
	}
	if (view === 'MCP_TWIN') {
		return { ...s, activeView: view, helpTopic: 'mcp_twin', rightDrawer: { ...s.rightDrawer, open: true, activeTab: 'export' } };
	}
	return { ...s, activeView: view, helpTopic: 'workbench', leftDrawer: { ...s.leftDrawer, open: false }, rightDrawer: { ...s.rightDrawer, open: false } };
}

function registerBlueprintHandlers(broker: UiWireBroker<StudioState>): void {
	broker.register<{ view: StudioViewId }>('UI_SET_ACTIVE_VIEW', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => reduceActiveView(s, env.payload.view),
		effect: (s, env) => {
			if (env.payload.view !== 'MCP_TWIN' || typeof window === 'undefined') return;
			void Promise.all([apiFetchMcpManifest(), s.user ? apiFetchServerTraces() : Promise.resolve({ traces: null })]).then(([m, tr]) => {
				if (tr.traces) broker.ingestServerTraces(tr.traces);
				if (m) broker.dispatch('SERVER_MANIFEST_SYNCED', { toolCount: m.toolCount, version: m.version, syncedAt: Date.now() }, 'MCP_TWIN');
			});
		},
		summarize: (env) => `Active view -> ${env.payload.view}`
	});
	broker.register<{ blueprintId: string }>('UI_SET_ACTIVE_TAB', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => {
			const target = s.blueprints.find((b) => b.id === env.payload.blueprintId);
			return target ? { ...s, activeBlueprintId: target.id, activeThemeId: target.themeId } : s;
		},
		effect: (s) => syncThemeAndCursor(s)
	});
	broker.register<ZoneTogglePayload>('UI_TOGGLE_ZONE_VISIBILITY', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => updateActiveBlueprint(s, (bp) => ({ ...bp, zones: bp.zones.map((z) => (z.id === env.payload.zoneId ? { ...z, visible: !z.visible } : z)) })),
		effect: (s) => { const bp = s.blueprints.find((b) => b.id === s.activeBlueprintId); if (bp) void apiSaveBlueprint(bp); }
	});
	broker.register<ZoneCornerPayload>('UI_SET_ZONE_CORNER', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => updateActiveBlueprint(s, (bp) => ({
			...bp,
			zones: bp.zones.map((z) => {
				if (z.id !== env.payload.zoneId) return z;
				const next = [...z.corners] as [CornerKind, CornerKind, CornerKind, CornerKind];
				next[env.payload.index] = env.payload.kind;
				return { ...z, corners: next };
			})
		})),
		effect: (s) => { const bp = s.blueprints.find((b) => b.id === s.activeBlueprintId); if (bp) void apiSaveBlueprint(bp); }
	});
}

export function registerStudioIntentHandlers(broker: UiWireBroker<StudioState>): void {
	registerThemeHandlers(broker);
	registerBlueprintHandlers(broker);
	registerDrawerAndStageHandlers(broker);
	registerProjectHandlers(broker);
	registerV003Handlers(broker);
	registerLifecycleAndCursorHandlers(broker);
	registerV011Handlers(broker);
}

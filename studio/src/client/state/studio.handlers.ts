import {
	applyAccessibilityPrefs, applyCursorPackToDocument, applyThemeToRoot, BUILTIN_CURSOR_PACKS, findThemePack,
	resolveThemeCursorPalette, type AccessibilityPrefs, type CornerKind, type UiWireBroker
} from '@chronos-ui/svelte';
import type { UiBlueprint } from '@studio/config';
import { registerLifecycleAndCursorHandlers } from './lifecycle';
import { apiSaveBlueprint } from './studio.api';
import { registerDrawerAndStageHandlers } from './studio.drawer.handlers';
import { registerProjectHandlers } from './studio.project.handlers';
import type { StudioState, StudioViewId, ZoneCornerPayload, ZoneTogglePayload } from './studio.types';
import { registerV003Handlers } from './studio.v003.handlers';

function syncThemeAndCursor(s: StudioState): void {
	const theme = s.themes.find((t) => t.id === s.activeThemeId) ?? findThemePack(s.activeThemeId);
	applyThemeToRoot(theme);
	if (s.activeCursorPackId !== null) {
		const pack = s.cursorPacks.find((c) => c.uuid === s.activeCursorPackId || c.slug === s.activeCursorPackId) ?? BUILTIN_CURSOR_PACKS[0];
		applyCursorPackToDocument(pack, resolveThemeCursorPalette(theme));
	}
}

function updateActiveBlueprint(state: StudioState, updater: (bp: UiBlueprint) => UiBlueprint): StudioState {
	const nextList = state.blueprints.map((bp) => (bp.id === state.activeBlueprintId ? updater(bp) : bp));
	return { ...state, blueprints: nextList };
}

function registerThemeHandlers(broker: UiWireBroker<StudioState>): void {
	broker.register<{ themeId: string }>('UI_SET_THEME', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => updateActiveBlueprint({ ...s, activeThemeId: env.payload.themeId }, (bp) => ({ ...bp, themeId: env.payload.themeId })),
		effect: syncThemeAndCursor,
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
		effect: syncThemeAndCursor,
		summarize: () => 'Toggled dark/light polarity'
	});
	broker.register<Partial<AccessibilityPrefs>>('UI_SET_ACCESSIBILITY', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => ({ ...s, accessibility: { ...s.accessibility, ...env.payload } }),
		effect: (s) => applyAccessibilityPrefs(s.accessibility),
		summarize: () => 'Updated accessibility prefs'
	});
}

function registerBlueprintHandlers(broker: UiWireBroker<StudioState>): void {
	broker.register<{ view: StudioViewId }>('UI_SET_ACTIVE_VIEW', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => ({ ...s, activeView: env.payload.view, helpTopic: env.payload.view.toLowerCase() })
	});
	broker.register<{ blueprintId: string }>('UI_SET_ACTIVE_TAB', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => {
			const target = s.blueprints.find((b) => b.id === env.payload.blueprintId);
			return target ? { ...s, activeBlueprintId: target.id, activeThemeId: target.themeId } : s;
		},
		effect: syncThemeAndCursor
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
}

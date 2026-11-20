import {
	applyCursorPackToDocument, CSS_CURSOR_STATES, DEFAULT_EMBELLISHMENT_CONFIG, resetCursorPackOnDocument,
	type CssCursorState, type CursorPackDefinition, type EmbellishmentConfig, type UiWireBroker
} from '@chronos-ui/svelte';
import type { StudioState } from '../studio.types';
import {
	apiCleanProject, apiCreateCursorPack, apiDeriveCursorPackStates,
	apiPatchProjectCursor, apiSaveProject, apiUpdateCursorStateAsset
} from './lifecycle.api';
import { registerStationAndZoneHandlers } from './station.handlers';

function upsertPack(list: readonly CursorPackDefinition[], next: CursorPackDefinition): readonly CursorPackDefinition[] {
	const exists = list.some((p) => p.uuid === next.uuid);
	return exists ? list.map((p) => (p.uuid === next.uuid ? next : p)) : [next, ...list];
}

function registerWorkspaceLifecycleHandlers(broker: UiWireBroker<StudioState>): void {
	broker.register('UI_PROJECT_SAVE', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s) => ({ ...s, projectPersistence: { ...s.projectPersistence, isDirty: false, lastSavedAt: Date.now(), status: 'SAVED' } }),
		summarize: () => 'Saved workspace snapshot'
	});
	broker.register('UI_PROJECT_CLEAN', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s) => {
			const cur = s.projects.find((p) => p.id === s.activeProjectId) ?? s.projects[0];
			if (!cur) return s;
			return {
				...s, selectedNodeId: null, undoStack: [...s.undoStack.slice(-19), cur.nodes], redoStack: [],
				projectPersistence: { ...s.projectPersistence, isDirty: false, lastSavedAt: Date.now(), status: 'SAVED' },
				projects: s.projects.map((p) => (p.id === cur.id ? { ...p, nodes: [], updatedAt: Date.now() } : p))
			};
		},
		summarize: () => 'Cleaned workspace to Calm Empty Stage'
	});
	broker.register('UI_WORKSPACE_RESET_DEFAULT', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s) => ({
			...s, panX: 0, panY: 0, zoom: 1, layoutDensity: 'CALM', selectedNodeId: null, toolPaletteOpen: false,
			assistantDock: { mode: 'DOCKED', expanded: false, xRem: 0, yRem: 0 }
		}),
		summarize: () => 'Reset workspace viewport & layout to default view'
	});
	broker.register<Partial<EmbellishmentConfig>>('UI_SET_EMBELLISHMENT_CONFIG', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => ({ ...s, globalEmbellishmentConfig: { ...DEFAULT_EMBELLISHMENT_CONFIG, ...s.globalEmbellishmentConfig, ...env.payload } }),
		summarize: () => 'Updated contour embellishment dynamics'
	});
}

function registerCursorPackHandlers(broker: UiWireBroker<StudioState>): void {
	broker.register<{ packId: string }>('UI_APPLY_CURSOR_PACK', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => ({
			...s, activeCursorPackId: env.payload.packId,
			projects: s.projects.map((p) => (p.id === s.activeProjectId ? { ...p, activeCursorPackId: env.payload.packId } : p))
		}),
		effect: (s, env) => {
			const pack = s.cursorPacks.find((c) => c.uuid === env.payload.packId || c.slug === env.payload.packId);
			if (pack) applyCursorPackToDocument(pack);
			void apiPatchProjectCursor(s.activeProjectId, pack?.uuid ?? env.payload.packId);
		},
		summarize: (env) => `Applied cursor pack -> ${env.payload.packId}`
	});
	broker.register<{ packUuid: string; cssState: CssCursorState; hotspotX?: number; hotspotY?: number }>('UI_UPDATE_CURSOR_STATE', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s) => s,
		summarize: (env) => `Updated cursor hotspot (${env.payload.cssState})`
	});
	broker.register('UI_RESET_CURSOR_PACK', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s) => ({
			...s, activeCursorPackId: null,
			projects: s.projects.map((p) => (p.id === s.activeProjectId ? { ...p, activeCursorPackId: undefined } : p))
		}),
		effect: (s) => {
			resetCursorPackOnDocument();
			void apiPatchProjectCursor(s.activeProjectId, null);
		},
		summarize: () => 'Reset cursor theme to OS default'
	});
}

export function registerLifecycleAndCursorHandlers(broker: UiWireBroker<StudioState>): void {
	registerWorkspaceLifecycleHandlers(broker);
	registerCursorPackHandlers(broker);
	registerStationAndZoneHandlers(broker);
}

type ToastFn = (msg: string, tone?: 'info' | 'success' | 'warning' | 'error') => void;

function createProjectSaveCleanOps(broker: UiWireBroker<StudioState>, pushToast: ToastFn) {
	const saveProject = async (): Promise<void> => {
		const cur = broker.state.projects.find((p) => p.id === broker.state.activeProjectId) ?? broker.state.projects[0];
		if (!cur) return;
		broker.patchState((s) => ({ ...s, projectPersistence: { ...s.projectPersistence, status: 'SAVING' } }));
		try {
			const res = await apiSaveProject(cur.id, { name: cur.name, themeId: broker.state.activeThemeId, cornerMode: broker.state.accessibility.cornerMode, cornerRadiusRem: broker.state.accessibility.cornerRadiusRem, activeCursorPackId: broker.state.activeCursorPackId, nodes: cur.nodes });
			broker.dispatch('UI_PROJECT_SAVE', { projectId: cur.id });
			broker.patchState((s) => ({ ...s, projectPersistence: { ...s.projectPersistence, isDirty: false, lastSavedAt: res.savedAt, status: 'SAVED' } }));
			pushToast(`Saved ${cur.name}`, 'success');
		} catch (err) {
			broker.patchState((s) => ({ ...s, projectPersistence: { ...s.projectPersistence, status: 'DIRTY' } }));
			pushToast(err instanceof Error ? err.message : 'Save failed', 'error');
		}
	};
	const cleanWorkspace = async (): Promise<void> => {
		const curId = broker.state.activeProjectId;
		broker.dispatch('UI_PROJECT_CLEAN', { projectId: curId });
		try { await apiCleanProject(curId); } catch {}
		pushToast('Workspace cleared to Calm Empty Stage (Ctrl+Z to undo)', 'info');
	};
	const resetDefaultView = (): void => { broker.dispatch('UI_WORKSPACE_RESET_DEFAULT', {}); pushToast('Restored default viewport framing', 'info'); };
	return { saveProject, cleanWorkspace, resetDefaultView };
}

function createCursorPackOps(broker: UiWireBroker<StudioState>, pushToast: ToastFn) {
	const applyCursorPack = (packId: string): void => { broker.dispatch('UI_APPLY_CURSOR_PACK', { packId }); pushToast(`Applied ${CSS_CURSOR_STATES.length}-state cursor pack`, 'success'); };
	const resetCursorPack = (): void => { broker.dispatch('UI_RESET_CURSOR_PACK', {}); pushToast('Restored OS default cursor', 'info'); };
	const createCursorPack = async (payload: { name: string; sourcePngDataUrl?: string; forkFromUuid?: string; baseHotspotX?: number; baseHotspotY?: number }): Promise<CursorPackDefinition | null> => {
		const pack = await apiCreateCursorPack(payload);
		broker.patchState((s) => ({ ...s, cursorPacks: upsertPack(s.cursorPacks, pack) }));
		applyCursorPack(pack.uuid);
		return pack;
	};
	const deriveCursorPack = async (uuid: string, accentColor?: string): Promise<CursorPackDefinition | null> => {
		const pack = await apiDeriveCursorPackStates(uuid, { accentColor, useAiLabel: true });
		broker.patchState((s) => ({ ...s, cursorPacks: upsertPack(s.cursorPacks, pack) }));
		if (broker.state.activeCursorPackId === uuid) applyCursorPackToDocument(pack);
		pushToast(`Derived ${CSS_CURSOR_STATES.length - 1} cursor states for ${pack.name}`, 'success');
		return pack;
	};
	const updateCursorState = async (uuid: string, cssState: CssCursorState, patch: { hotspotX?: number; hotspotY?: number }): Promise<void> => {
		const pack = await apiUpdateCursorStateAsset(uuid, cssState, patch);
		broker.patchState((s) => ({ ...s, cursorPacks: upsertPack(s.cursorPacks, pack) }));
		broker.dispatch('UI_UPDATE_CURSOR_STATE', { packUuid: uuid, cssState, ...patch });
		if (broker.state.activeCursorPackId === uuid) applyCursorPackToDocument(pack);
	};
	return { applyCursorPack, resetCursorPack, createCursorPack, deriveCursorPack, updateCursorState };
}

export function createLifecycleActions(broker: UiWireBroker<StudioState>, deps: { pushToast: ToastFn }) {
	return { ...createProjectSaveCleanOps(broker, deps.pushToast), ...createCursorPackOps(broker, deps.pushToast) };
}

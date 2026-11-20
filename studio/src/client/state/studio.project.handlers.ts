import {
	applyCursorPackToDocument, applySafeCorridorCssVars, applyThemeToRoot, computeSafeCorridor, DEFAULT_VIEWPORT, findThemePack,
	resetCursorPackOnDocument, type UiNode, type UiNodeTree, type UiWireBroker
} from '@chronos-ui/svelte';
import { patchNodeInTreeByUuid } from '../../core/engine';
import { apiCommitRevision } from './studio.project.api';
import type { StudioState } from './studio.types';

export { createInitialStudioState, GENESIS_FALLBACK, STUDIO_INITIAL_LAYOUT } from './lifecycle';

function activeProj(state: StudioState) {
	return state.projects.find((p) => p.id === state.activeProjectId) ?? state.projects[0];
}

function replaceActiveNodes(state: StudioState, nextNodes: UiNodeTree, pushUndo = true): StudioState {
	const cur = activeProj(state);
	if (!cur) return state;
	return {
		...state,
		projectPersistence: { ...state.projectPersistence, isDirty: true, status: 'DIRTY' },
		undoStack: pushUndo ? [...state.undoStack.slice(-19), cur.nodes] : state.undoStack,
		redoStack: pushUndo ? [] : state.redoStack,
		projects: state.projects.map((p) => (p.id === cur.id ? { ...p, nodes: nextNodes, updatedAt: Date.now() } : p))
	};
}

function syncRevision(state: StudioState, origin: string): void {
	const cur = activeProj(state);
	if (cur) void apiCommitRevision(cur.id, cur.nodes, origin);
}

function registerNodeLifecycleHandlers(broker: UiWireBroker<StudioState>): void {
	broker.register<{ node: UiNode }>('UI_SPAWN_NODE', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => replaceActiveNodes(s, [...(activeProj(s)?.nodes ?? []), env.payload.node]),
		effect: (s, env) => syncRevision(s, env.origin),
		summarize: (env) => `Staged ${env.payload.node.type} -> ${env.payload.node.zone}`
	});
	broker.register<{ nodeId?: string }>('UI_COMMIT_NODE', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => {
			const nodes = (activeProj(s)?.nodes ?? []).map((n) => (!env.payload.nodeId || n.id === env.payload.nodeId) ? { ...n, lifecycle: 'COMMITTED' as const } : n);
			return replaceActiveNodes(s, nodes);
		},
		effect: (s, env) => syncRevision(s, env.origin),
		summarize: (env) => env.payload.nodeId ? `Committed ${env.payload.nodeId}` : 'Committed all staged nodes'
	});
	broker.register<{ nodeId: string }>('UI_REJECT_NODE', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => replaceActiveNodes(s, (activeProj(s)?.nodes ?? []).filter((n) => n.id !== env.payload.nodeId)),
		effect: (s, env) => syncRevision(s, env.origin),
		summarize: (env) => `Rejected ${env.payload.nodeId}`
	});
	broker.register<{ nodeId: string; patch: Partial<UiNode> }>('UI_PATCH_NODE', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => replaceActiveNodes(s, patchNodeInTreeByUuid(activeProj(s)?.nodes ?? [], env.payload.nodeId, env.payload.patch).nodes),
		effect: (s, env) => syncRevision(s, env.origin),
		summarize: (env) => `Configured ${env.payload.nodeId}`
	});
	broker.register<{ nodeId: string }>('UI_REMOVE_NODE', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => ({
			...replaceActiveNodes(s, (activeProj(s)?.nodes ?? []).filter((n) => n.id !== env.payload.nodeId)),
			selectedNodeId: s.selectedNodeId === env.payload.nodeId ? null : s.selectedNodeId
		}),
		effect: (s, env) => syncRevision(s, env.origin),
		summarize: (env) => `Removed ${env.payload.nodeId}`
	});
}

function registerRevisionHandlers(broker: UiWireBroker<StudioState>): void {
	broker.register('UI_UNDO_REVISION', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s) => {
			if (s.undoStack.length === 0) return s;
			const cur = activeProj(s);
			const prev = s.undoStack[s.undoStack.length - 1];
			return { ...replaceActiveNodes(s, prev, false), undoStack: s.undoStack.slice(0, -1), redoStack: cur ? [...s.redoStack, cur.nodes] : s.redoStack };
		},
		effect: (s) => syncRevision(s, 'USER'),
		summarize: () => 'Undid last canvas revision'
	});
	broker.register('UI_REDO_REVISION', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s) => {
			if (s.redoStack.length === 0) return s;
			const cur = activeProj(s);
			const next = s.redoStack[s.redoStack.length - 1];
			return { ...replaceActiveNodes(s, next, false), redoStack: s.redoStack.slice(0, -1), undoStack: cur ? [...s.undoStack, cur.nodes] : s.undoStack };
		},
		effect: (s) => syncRevision(s, 'USER'),
		summarize: () => 'Redid canvas revision'
	});
}

export function registerProjectHandlers(broker: UiWireBroker<StudioState>): void {
	registerNodeLifecycleHandlers(broker);
	registerRevisionHandlers(broker);
	broker.register<{ projectId: string }>('UI_SWITCH_PROJECT', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => {
			const target = s.projects.find((p) => p.id === env.payload.projectId || p.slug === env.payload.projectId);
			if (!target) return s;
			const cleaned = s.projects.map((p) => (p.id === s.activeProjectId ? { ...p, nodes: p.nodes.filter((n) => n.lifecycle === 'COMMITTED') } : p));
			return { ...s, projects: cleaned, activeProjectId: target.id, activeThemeId: target.themeId, activeCursorPackId: target.activeCursorPackId ?? null, projectPersistence: { isDirty: false, lastSavedAt: target.updatedAt, autoSave: false, status: 'SAVED' }, selectedNodeId: null, undoStack: [], redoStack: [] };
		},
		effect: (s) => {
			applyThemeToRoot(s.themes.find((t) => t.id === s.activeThemeId) ?? findThemePack(s.activeThemeId));
			const pack = s.activeCursorPackId ? s.cursorPacks.find((c) => c.uuid === s.activeCursorPackId || c.slug === s.activeCursorPackId) : null;
			if (pack) applyCursorPackToDocument(pack); else resetCursorPackOnDocument();
		},
		summarize: (env) => `Switched project -> ${env.payload.projectId}`
	});
	broker.register<{ nodeId: string | null }>('UI_SELECT_NODE', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => ({ ...s, selectedNodeId: env.payload.nodeId, toolPaletteOpen: s.layoutDensity === 'CALM' && env.payload.nodeId !== null ? false : s.toolPaletteOpen })
	});
	broker.register<{ visible?: boolean }>('UI_TOGGLE_STUDIO_CHROME', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => ({ ...s, studioChromeVisible: env.payload.visible ?? !s.studioChromeVisible }),
		effect: (s) => applySafeCorridorCssVars(computeSafeCorridor(s.studioChromeVisible, typeof window !== 'undefined' ? window.innerWidth : DEFAULT_VIEWPORT.width, typeof window !== 'undefined' ? window.innerHeight : DEFAULT_VIEWPORT.height)),
		summarize: () => 'Toggled Studio meta-chrome'
	});
}

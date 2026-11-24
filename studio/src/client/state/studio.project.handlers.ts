import type { UiNode, UiNodeTree, UiWireBroker } from '@chronos-ui/svelte';
import { patchNodeInTreeByUuid } from '@studio/core/engine';
import { syncCorridorForState, syncThemeAndCursor } from './lifecycle';
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

function findNodeRecursive(nodes: readonly UiNode[], id: string): UiNode | null {
	for (const n of nodes) {
		if (n.id === id) return n;
		if (n.children) { const hit = findNodeRecursive(n.children, id); if (hit) return hit; }
	}
	return null;
}

function isDuplicateStagingNode(existing: readonly UiNode[], candidate: UiNode): boolean {
	if (candidate.lifecycle !== 'STAGING' && candidate.lifecycle !== 'BUILDING') return false;
	const sig = JSON.stringify(candidate.props);
	return existing.some((n) => (n.lifecycle === 'STAGING' || n.lifecycle === 'BUILDING') && n.type === candidate.type && n.zone === candidate.zone && n.label === candidate.label && JSON.stringify(n.props) === sig);
}

function registerNodeLifecycleHandlers(broker: UiWireBroker<StudioState>): void {
	broker.register<{ node: UiNode }>('UI_SPAWN_NODE', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => { const cur = activeProj(s)?.nodes ?? []; return isDuplicateStagingNode(cur, env.payload.node) ? s : replaceActiveNodes(s, [...cur, env.payload.node]); },
		effect: (s, env) => syncRevision(s, env.origin),
		summarize: (env) => `Staged ${env.payload.node.type} -> ${env.payload.node.zone}`
	});
	broker.register<{ nodeId?: string }>('UI_COMMIT_NODE', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => replaceActiveNodes(s, (activeProj(s)?.nodes ?? []).map((n) => (!env.payload.nodeId || n.id === env.payload.nodeId) ? { ...n, lifecycle: 'COMMITTED' as const } : n)),
		effect: (s, env) => syncRevision(s, env.origin),
		summarize: (env) => env.payload.nodeId ? `Committed ${env.payload.nodeId}` : 'Committed all staged nodes'
	});
	broker.register<{ nodeId: string }>('UI_REJECT_NODE', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => replaceActiveNodes(s, (activeProj(s)?.nodes ?? []).filter((n) => n.id !== env.payload.nodeId)),
		effect: (s, env) => syncRevision(s, env.origin),
		summarize: (env) => `Rejected ${env.payload.nodeId}`
	});
	broker.register('UI_REJECT_ALL_STAGED', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s) => replaceActiveNodes(s, (activeProj(s)?.nodes ?? []).filter((n) => n.lifecycle === 'COMMITTED')),
		effect: (s, env) => syncRevision(s, env.origin),
		summarize: () => 'Rejected all staged nodes'
	});
	broker.register<{ nodeId: string; patch: Partial<UiNode> }>('UI_PATCH_NODE', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => { const nodes = activeProj(s)?.nodes ?? []; return findNodeRecursive(nodes, env.payload.nodeId)?.locked ? s : replaceActiveNodes(s, patchNodeInTreeByUuid(nodes, env.payload.nodeId, env.payload.patch).nodes); },
		effect: (s, env) => syncRevision(s, env.origin),
		summarize: (env) => `Configured ${env.payload.nodeId}`
	});
}

function registerNodeFlagHandlers(broker: UiWireBroker<StudioState>): void {
	broker.register<{ nodeId: string; locked?: boolean }>('UI_TOGGLE_ENTITY_LOCK', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => { const nodes = activeProj(s)?.nodes ?? []; const t = findNodeRecursive(nodes, env.payload.nodeId); return t ? replaceActiveNodes(s, patchNodeInTreeByUuid(nodes, env.payload.nodeId, { locked: env.payload.locked ?? !t.locked }).nodes) : s; },
		effect: (s, env) => syncRevision(s, env.origin), summarize: (env) => `Toggled lock ${env.payload.nodeId}`
	});
	broker.register<{ nodeId: string; visible?: boolean }>('UI_TOGGLE_ENTITY_VISIBILITY', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => { const nodes = activeProj(s)?.nodes ?? []; const t = findNodeRecursive(nodes, env.payload.nodeId); return t ? replaceActiveNodes(s, patchNodeInTreeByUuid(nodes, env.payload.nodeId, { visible: env.payload.visible ?? (t.visible === false) }).nodes) : s; },
		effect: (s, env) => syncRevision(s, env.origin), summarize: (env) => `Toggled visibility ${env.payload.nodeId}`
	});
	broker.register<{ nodeId: string }>('UI_REMOVE_NODE', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => { const nodes = activeProj(s)?.nodes ?? []; if (findNodeRecursive(nodes, env.payload.nodeId)?.locked) return s; return { ...replaceActiveNodes(s, nodes.filter((n) => n.id !== env.payload.nodeId)), selectedNodeId: s.selectedNodeId === env.payload.nodeId ? null : s.selectedNodeId }; },
		effect: (s, env) => syncRevision(s, env.origin), summarize: (env) => `Removed ${env.payload.nodeId}`
	});
}

function registerRevisionHandlers(broker: UiWireBroker<StudioState>): void {
	broker.register('UI_UNDO_REVISION', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s) => { if (!s.undoStack.length) return s; const cur = activeProj(s); return { ...replaceActiveNodes(s, s.undoStack[s.undoStack.length - 1], false), undoStack: s.undoStack.slice(0, -1), redoStack: cur ? [...s.redoStack, cur.nodes] : s.redoStack }; },
		effect: (s) => syncRevision(s, 'USER'), summarize: () => 'Undid last canvas revision'
	});
	broker.register('UI_REDO_REVISION', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s) => { if (!s.redoStack.length) return s; const cur = activeProj(s); return { ...replaceActiveNodes(s, s.redoStack[s.redoStack.length - 1], false), redoStack: s.redoStack.slice(0, -1), undoStack: cur ? [...s.undoStack, cur.nodes] : s.undoStack }; },
		effect: (s) => syncRevision(s, 'USER'), summarize: () => 'Redid canvas revision'
	});
}

export function registerProjectHandlers(broker: UiWireBroker<StudioState>): void {
	registerNodeLifecycleHandlers(broker);
	registerNodeFlagHandlers(broker);
	registerRevisionHandlers(broker);
	broker.register<{ projectId: string }>('UI_SWITCH_PROJECT', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => {
			const target = s.projects.find((p) => p.id === env.payload.projectId || p.slug === env.payload.projectId);
			if (!target) return s;
			const cleaned = s.projects.map((p) => (p.id === s.activeProjectId ? { ...p, nodes: p.nodes.filter((n) => n.lifecycle === 'COMMITTED') } : p));
			return { ...s, projects: cleaned, activeProjectId: target.id, activeThemeId: target.themeId, activeCursorPackId: target.activeCursorPackId ?? null, projectPersistence: { isDirty: false, lastSavedAt: target.updatedAt, autoSave: false, status: 'SAVED' }, selectedNodeId: null, undoStack: [], redoStack: [] };
		},
		effect: (s) => syncThemeAndCursor(s, true),
		summarize: (env) => `Switched project -> ${env.payload.projectId}`
	});
	broker.register<{ nodeId: string | null }>('UI_SELECT_NODE', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => env.payload.nodeId
			? { ...s, selectedNodeId: env.payload.nodeId, rightDrawer: { ...s.rightDrawer, open: true, activeTab: 'inspector' } }
			: { ...s, selectedNodeId: null }
	});
	broker.register<{ visible?: boolean }>('UI_TOGGLE_STUDIO_CHROME', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => ({ ...s, studioChromeVisible: env.payload.visible ?? !s.studioChromeVisible }),
		effect: syncCorridorForState,
		summarize: () => 'Toggled Studio meta-chrome'
	});
}

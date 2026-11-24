import {
	applyAccessibilityPrefs, clamp, generateUuidV7, HUD_METRICS,
	type HudZoneId, type SemanticInputAction, type UiComponentKind, type UiNode, type UiWireBroker
} from '@chronos-ui/svelte';
import { CAPABILITY_BITS, findStarterSample, SAMPLE_LOAD_CHOREOGRAPHY, sortNodesForChoreography } from '@studio/config';
import {
	applyJsonPatchWithInverse, derivePrototypeFromNode, documentGraphToNodeTree,
	evaluateGovernanceGate, instantiateFromPrototype, nodeTreeToDocumentGraph, STUDIO_ROLE_MASKS,
	type JsonPatchOp, type UiComponentPrototype
} from '@studio/core/engine';
import { resolveRootFontPx, syncThemeAndCursor } from './lifecycle';
import { apiCommitRevision } from './studio.project.api';
import type { StudioModalId, StudioState } from './studio.types';

export interface ChoreographyEpochGuard { epoch: number; controller: AbortController | null; timers: ReturnType<typeof setTimeout>[]; }
export function cancelChoreographyEpoch(guard: ChoreographyEpochGuard): number {
	guard.epoch += 1; guard.controller?.abort(); guard.controller = null;
	for (const t of guard.timers.splice(0)) clearTimeout(t);
	return guard.epoch;
}

function moveAssistantDockState(s: StudioState, dxPx: number, dyPx: number, rect?: { left: number; top: number; width: number; height: number }): StudioState {
	const rootPx = resolveRootFontPx();
	const vwRem = typeof window !== 'undefined' ? window.innerWidth / rootPx : 90;
	const vhRem = typeof window !== 'undefined' ? window.innerHeight / rootPx : 56.25;
	const panelWRem = rect ? rect.width / rootPx : HUD_METRICS.assistantWidthRem;
	const panelHRem = rect ? rect.height / rootPx : 4;
	const m = HUD_METRICS.viewportMarginRem;
	const baseX = s.assistantDock.mode === 'FLOATING' ? s.assistantDock.xRem : (rect ? rect.left / rootPx : (vwRem - panelWRem) / 2);
	const baseY = s.assistantDock.mode === 'FLOATING' ? s.assistantDock.yRem : (rect ? rect.top / rootPx : vhRem - panelHRem - m);
	return { ...s, assistantDock: { ...s.assistantDock, mode: 'FLOATING', xRem: Number(clamp(baseX + dxPx / rootPx, m, Math.max(m, vwRem - panelWRem - m)).toFixed(3)), yRem: Number(clamp(baseY + dyPx / rootPx, m, Math.max(m, vhRem - panelHRem - m)).toFixed(3)) } };
}

function registerAssistantDockHandlers(broker: UiWireBroker<StudioState>): void {
	broker.register<{ dxPx: number; dyPx: number; rect?: { left: number; top: number; width: number; height: number } }>('UI_ASSISTANT_MOVE', { tier: 'TIER_0_LOCAL_UI', reduce: (s, env) => moveAssistantDockState(s, env.payload.dxPx, env.payload.dyPx, env.payload.rect) });
	broker.register('UI_ASSISTANT_DROP', { tier: 'TIER_0_LOCAL_UI', reduce: (s) => ({ ...s, assistantDock: { ...s.assistantDock, mode: 'FLOATING' } }), summarize: () => 'Anchored floating assistant dock' });
	broker.register('UI_ASSISTANT_DOCK', { tier: 'TIER_0_LOCAL_UI', reduce: (s) => ({ ...s, assistantDock: { ...s.assistantDock, mode: 'DOCKED', xRem: 0, yRem: 0 } }), summarize: () => 'Returned assistant dock to BOTTOM_CENTER' });
	broker.register<{ rect?: { left: number; top: number; width: number; height: number } }>('UI_ASSISTANT_TOGGLE_FLOAT', { tier: 'TIER_0_LOCAL_UI', reduce: (s, env) => s.assistantDock.mode === 'FLOATING' ? { ...s, assistantDock: { ...s.assistantDock, mode: 'DOCKED', xRem: 0, yRem: 0 } } : moveAssistantDockState(s, 0, -24, env.payload.rect), summarize: () => 'Toggled assistant dock float/dock' });
	broker.register<{ projectId?: string }>('UI_ASSISTANT_SUBMIT', { tier: 'TIER_0_LOCAL_UI', reduce: (s, env) => ({ ...s, projects: s.projects.map((p) => (p.id === (env.payload.projectId ?? s.activeProjectId) ? { ...p, hasBuiltOnce: true } : p)) }), summarize: () => 'Assistant build -> send lifecycle active' });
	broker.register<Record<string, unknown>>('UI_STATION_PREVIEW_UPDATE', { tier: 'TIER_0_LOCAL_UI', reduce: (s) => s, summarize: () => 'Station live preview synced' });
	broker.register<{ expanded?: boolean }>('UI_ASSISTANT_EXPAND', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => {
			const expanded = env.payload.expanded ?? !s.assistantDock.expanded;
			if (!expanded || s.assistantDock.mode !== 'FLOATING') return { ...s, assistantDock: { ...s.assistantDock, expanded } };
			const yRem = Number(Math.min(s.assistantDock.yRem, Math.max(HUD_METRICS.viewportMarginRem, (typeof window !== 'undefined' ? window.innerHeight / resolveRootFontPx() : 56.25) - 20)).toFixed(3));
			return { ...s, assistantDock: { ...s.assistantDock, expanded, yRem } };
		}
	});
}

export function registerV003Handlers(broker: UiWireBroker<StudioState>): void {
	registerAssistantDockHandlers(broker);
	broker.register<{ nodeId: string; name: string }>('UI_DERIVE_BLUEPRINT', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => {
			const proj = s.projects.find((p) => p.id === s.activeProjectId) ?? s.projects[0];
			const node = proj?.nodes.find((n) => n.id === env.payload.nodeId);
			return node ? { ...s, prototypes: [...s.prototypes, derivePrototypeFromNode(node, env.payload.name)] } : s;
		},
		summarize: (env) => `Derived reusable blueprint: ${env.payload.name}`
	});
	broker.register<{ patches: readonly JsonPatchOp[] }>('UI_PATCH_DOCUMENT', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => {
			const proj = s.projects.find((p) => p.id === s.activeProjectId) ?? s.projects[0];
			if (!proj) return s;
			const { doc } = applyJsonPatchWithInverse(nodeTreeToDocumentGraph(proj.nodes, s.prototypes), env.payload.patches);
			if (!evaluateGovernanceGate({ graph: doc, actorCapabilityMask: s.user?.capabilityMask ?? STUDIO_ROLE_MASKS.ARCHITECT, requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS }).ok) return s;
			const nextNodes = documentGraphToNodeTree(doc);
			return { ...s, projectPersistence: { ...s.projectPersistence, isDirty: true, status: 'DIRTY' }, undoStack: [...s.undoStack.slice(-19), proj.nodes], redoStack: [], projects: s.projects.map((p) => (p.id === proj.id ? { ...p, nodes: nextNodes, updatedAt: Date.now() } : p)) };
		},
		effect: (s, env) => { const cur = s.projects.find((p) => p.id === s.activeProjectId); if (cur) void apiCommitRevision(cur.id, cur.nodes, env.origin); },
		summarize: (env) => `Applied ${env.payload.patches.length} RFC 6902 patch op(s)`
	});
	broker.register<{ action: SemanticInputAction }>('UI_INPUT_ACTION', { tier: 'TIER_0_LOCAL_UI', reduce: (s, env) => ({ ...s, inputModality: env.payload.action.modality }), summarize: (env) => `${env.payload.action.modality}: ${env.payload.action.type}` });
	broker.register<{ sampleId: string; title: string }>('UI_LOAD_SAMPLE', { tier: 'TIER_0_LOCAL_UI', reduce: (s) => s, summarize: (env) => `Choreographed sample: ${env.payload.title}` });
}

const cloneWithFreshUuids = (nodes: readonly UiNode[]): readonly UiNode[] =>
	nodes.map((n) => ({ ...n, id: generateUuidV7(), ...(n.children ? { children: cloneWithFreshUuids(n.children) } : {}) }));

function scheduleSampleAssembly(broker: UiWireBroker<StudioState>, sampleId: string, guard: ChoreographyEpochGuard, pushToast: (msg: string, tone?: 'info' | 'success' | 'warning' | 'error') => void): void {
	const sample = findStarterSample(sampleId);
	const cur = broker.state.projects.find((p) => p.id === broker.state.activeProjectId) ?? broker.state.projects[0];
	if (!sample || !cur) return;
	const epoch = cancelChoreographyEpoch(guard);
	const controller = new AbortController(); guard.controller = controller;
	const ordered = sortNodesForChoreography(cloneWithFreshUuids(sample.nodes));
	const reduced = !broker.state.accessibility.kineticMotion || (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
	broker.patchState((s) => ({
		...s, activeThemeId: sample.themeId, selectedNodeId: null, accessibility: { ...s.accessibility, cornerMode: sample.cornerMode },
		projectPersistence: { ...s.projectPersistence, isDirty: true, status: 'DIRTY' }, undoStack: [...s.undoStack.slice(-19), cur.nodes], redoStack: [],
		projects: s.projects.map((p) => (p.id === cur.id ? { ...p, themeId: sample.themeId, cornerMode: sample.cornerMode, nodes: reduced ? ordered : [] } : p))
	}));
	broker.dispatch('UI_LOAD_SAMPLE', { sampleId: sample.id, title: sample.title });
	syncThemeAndCursor(broker.state);
	applyAccessibilityPrefs(broker.state.accessibility);
	if (reduced) { void apiCommitRevision(cur.id, ordered, 'USER'); pushToast(`Loaded ${sample.title}`, 'success'); return; }
	ordered.forEach((node, idx) => {
		guard.timers.push(setTimeout(() => {
			if (guard.epoch !== epoch || controller.signal.aborted) return;
			broker.patchState((s) => ({ ...s, projects: s.projects.map((p) => (p.id === cur.id ? { ...p, nodes: [...p.nodes.filter((x) => x.id !== node.id), node] } : p)) }));
			if (idx === ordered.length - 1) { void apiCommitRevision(cur.id, ordered, 'USER'); pushToast(`Assembled ${sample.title}`, 'success'); }
		}, idx * SAMPLE_LOAD_CHOREOGRAPHY.stepDelayMs));
	});
}

export function createV003Actions(broker: UiWireBroker<StudioState>, deps: { pushToast: (msg: string, tone?: 'info' | 'success' | 'warning' | 'error') => void; sendPrompt: (p: string) => Promise<void>; openModal: (id: StudioModalId) => void }) {
	const guard: ChoreographyEpochGuard = { epoch: 0, controller: null, timers: [] };
	const clearSampleTimers = (): void => { cancelChoreographyEpoch(guard); };
	const loadSampleProject = (sampleId: string): void => scheduleSampleAssembly(broker, sampleId, guard, deps.pushToast);
	const spawnQuickComponent = (type: UiComponentKind, zone: HudZoneId, label: string, props: Record<string, unknown>): void => {
		const node: UiNode = { id: generateUuidV7(), type, zone, label, lifecycle: 'COMMITTED', props };
		broker.dispatch('UI_SPAWN_NODE', { node }); broker.dispatch('UI_SELECT_NODE', { nodeId: node.id });
		deps.pushToast(`Added ${label} to canvas`, 'success');
	};
	const spawnFromPrototype = (proto: UiComponentPrototype): void => {
		const node = instantiateFromPrototype(proto);
		broker.dispatch('UI_SPAWN_NODE', { node }); broker.dispatch('UI_SELECT_NODE', { nodeId: node.id });
		deps.pushToast(`Spawned reusable blueprint: ${proto.name}`, 'success');
	};
	const actionRoutes: Record<string, (a: SemanticInputAction) => void> = {
		PAN_DELTA: (a) => broker.dispatch('UI_STAGE_PAN_ZOOM', { dx: a.dx ?? 0, dy: a.dy ?? 0 }),
		ZOOM_IN: () => broker.dispatch('UI_STAGE_PAN_ZOOM', { dz: HUD_METRICS.buttonZoomStep }), ZOOM_OUT: () => broker.dispatch('UI_STAGE_PAN_ZOOM', { dz: -HUD_METRICS.buttonZoomStep }),
		TAB_PREV: () => broker.dispatch('UI_UNDO_REVISION', {}), TAB_NEXT: () => broker.dispatch('UI_REDO_REVISION', {}),
		FIT_CANVAS: () => broker.dispatch('UI_STAGE_PAN_ZOOM', { reset: true }), TOGGLE_HUD: () => broker.dispatch('UI_TOGGLE_STUDIO_CHROME', {}),
		TOGGLE_ASSISTANT: () => broker.dispatch('UI_ASSISTANT_EXPAND', {}), OPEN_SETTINGS: () => deps.openModal('settings'),
		CANCEL: () => broker.patchState((s) => ({ ...s, toolPaletteOpen: false, selectedNodeId: null }))
	};
	const handleSemanticInput = (action: SemanticInputAction): void => {
		broker.dispatch('UI_INPUT_ACTION', { action }, action.modality === 'VOICE' ? 'VOICE' : 'GAMEPAD');
		if (action.type === 'VOICE_FINAL' && action.transcript) void deps.sendPrompt(action.transcript); else actionRoutes[action.type]?.(action);
	};
	return { loadSampleProject, spawnQuickComponent, spawnFromPrototype, handleSemanticInput, clearSampleTimers };
}

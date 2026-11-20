import {
	applyAccessibilityPrefs, clampCornerRadiusRem, findOppositeZone, mirrorCornerTuple,
	setActiveCornerMorph, setActiveCornerRadiusRem,
	type HudZoneId, type UiNode, type UiWireBroker
} from '@chronos-ui/svelte';
import type { ZoneBlueprintConfig } from '../../../config';
import { apiSaveBlueprint } from '../studio.api';
import { apiCommitRevision } from '../studio.project.api';
import type { MoveEntityToZonePayload, StationLayerConfig, StudioState, ZoneEditPayload } from '../studio.types';
import { apiPatchProjectCornerRadius } from './lifecycle.api';

export { findOppositeZone };

function applyStationCssVars(layer: StationLayerConfig): void {
	if (typeof document === 'undefined') return;
	const root = document.documentElement;
	root.style.setProperty('--hud-top-band-h', `${layer.topBandRem}rem`);
	root.style.setProperty('--hud-bottom-dock-h', `${layer.bottomDockRem}rem`);
	root.style.setProperty('--ui-edge-rail-w', `${layer.edgeRailRem}rem`);
	setActiveCornerMorph(layer.cornerMorphEnabled);
}

function patchZoneEntry(z: ZoneBlueprintConfig, p: ZoneEditPayload): ZoneBlueprintConfig {
	return {
		...z,
		...(p.visible !== undefined ? { visible: p.visible } : {}),
		...(p.disposition !== undefined ? { disposition: p.disposition } : {}),
		...(p.density !== undefined ? { density: p.density } : {}),
		...(p.corners !== undefined ? { corners: p.corners } : {}),
		...(p.cornerRadiusRem !== undefined ? { cornerRadiusRem: clampCornerRadiusRem(p.cornerRadiusRem) } : {}),
		...(p.shape !== undefined ? { shape: p.shape } : {}),
		...(p.cornerEmbellishment !== undefined ? { cornerEmbellishment: p.cornerEmbellishment } : {}),
		...(p.cornerAnimation !== undefined ? { cornerAnimation: p.cornerAnimation } : {})
	};
}

function moveOrReorderNodes(nodes: readonly UiNode[], payload: MoveEntityToZonePayload): readonly UiNode[] {
	const list = [...nodes];
	const idx = list.findIndex((n) => n.id === payload.nodeId);
	if (idx < 0) return list;
	if (payload.direction) {
		const swapIdx = payload.direction === 'UP' ? idx - 1 : idx + 1;
		if (swapIdx >= 0 && swapIdx < list.length) {
			const tmp = list[idx];
			list[idx] = list[swapIdx];
			list[swapIdx] = tmp;
		}
		return list;
	}
	list[idx] = { ...list[idx], zone: payload.targetZone };
	return list;
}

function reduceZoneEdit(s: StudioState, p: ZoneEditPayload): StudioState {
	const mirror = p.mirrorOpposite ?? s.stationLayer.bilateralMirror;
	const opposite = mirror ? findOppositeZone(p.zoneId) : null;
	const blueprints = s.blueprints.map((bp) => {
		if (bp.id !== s.activeBlueprintId) return bp;
		return {
			...bp,
			zones: bp.zones.map((z) => {
				if (z.id === p.zoneId) return patchZoneEntry(z, p);
				if (opposite && z.id === opposite && (p.corners || p.cornerRadiusRem !== undefined)) {
					return patchZoneEntry(z, { ...p, zoneId: opposite, ...(p.corners ? { corners: mirrorCornerTuple(p.corners) } : {}) });
				}
				return z;
			})
		};
	});
	return { ...s, selectedZoneId: p.zoneId, blueprints, projectPersistence: { ...s.projectPersistence, isDirty: true, status: 'DIRTY' } };
}

function reduceEntityZoneMove(s: StudioState, p: MoveEntityToZonePayload): StudioState {
	const cur = s.projects.find((proj) => proj.id === s.activeProjectId) ?? s.projects[0];
	if (!cur) return s;
	const nextNodes = moveOrReorderNodes(cur.nodes, p);
	return {
		...s, undoStack: [...s.undoStack.slice(-19), cur.nodes], redoStack: [],
		projects: s.projects.map((proj) => (proj.id === cur.id ? { ...proj, nodes: nextNodes, updatedAt: Date.now() } : proj)),
		projectPersistence: { ...s.projectPersistence, isDirty: true, status: 'DIRTY' }
	};
}

export function registerStationAndZoneHandlers(broker: UiWireBroker<StudioState>): void {
	broker.register<{ cornerRadiusRem: number }>('UI_SET_CORNER_RADIUS', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => {
			const radius = clampCornerRadiusRem(env.payload.cornerRadiusRem);
			return {
				...s, accessibility: { ...s.accessibility, cornerRadiusRem: radius },
				projects: s.projects.map((p) => (p.id === s.activeProjectId ? { ...p, cornerRadiusRem: radius } : p)),
				projectPersistence: { ...s.projectPersistence, isDirty: true, status: 'DIRTY' }
			};
		},
		effect: (s) => {
			setActiveCornerRadiusRem(s.accessibility.cornerRadiusRem);
			applyAccessibilityPrefs(s.accessibility);
			void apiPatchProjectCornerRadius(s.activeProjectId, s.accessibility.cornerRadiusRem);
		},
		summarize: (env) => `Corner radius -> ${clampCornerRadiusRem(env.payload.cornerRadiusRem)}rem`
	});
	broker.register<Partial<StationLayerConfig>>('UI_CONFIGURE_STATION_LAYER', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => ({ ...s, stationLayer: { ...s.stationLayer, ...env.payload } }),
		effect: (s) => applyStationCssVars(s.stationLayer),
		summarize: () => 'Updated station layer architecture'
	});
	broker.register<ZoneEditPayload>('UI_EDIT_ZONE_DISPOSITION', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => reduceZoneEdit(s, env.payload),
		effect: (s) => { const bp = s.blueprints.find((b) => b.id === s.activeBlueprintId); if (bp) void apiSaveBlueprint(bp); },
		summarize: (env) => `Edited zone ${env.payload.zoneId}`
	});
	broker.register<MoveEntityToZonePayload>('UI_MOVE_ENTITY_TO_ZONE', {
		tier: 'TIER_1_COALESCED_PERSIST',
		reduce: (s, env) => reduceEntityZoneMove(s, env.payload),
		effect: (s) => { const cur = s.projects.find((p) => p.id === s.activeProjectId); if (cur) void apiCommitRevision(cur.id, cur.nodes, 'ZONE_EDITION'); },
		summarize: (env) => `Moved entity ${env.payload.nodeId} -> ${env.payload.targetZone}`
	});
}

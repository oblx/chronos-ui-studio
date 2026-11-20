import {
	clampCornerRadiusRem, CORNER_RADIUS_LIMITS, findOppositeZone, HUD_ZONES, mirrorCornerTuple,
	type CornerKind, type CornerTuple, type HudZoneId
} from '@chronos-ui/svelte';
import { eq } from 'drizzle-orm';
import type { ZoneBlueprintConfig } from '../config';
import { blueprints, getStudioDb, mapBlueprintRow, uiProjects } from '../lib';
import { commitProjectRevision, loadProjectWithNodes } from '../server/routes/routes.projects';
import type { ProjectMcpToolFn } from './mcp.project.tools';

async function toolSetCornerRadius(args: Record<string, unknown>) {
	const key = String(args.projectId ?? 'proj-genesis');
	const project = await loadProjectWithNodes(key);
	if (!project) throw new Error(`Project not found: ${key}`);
	const radius = clampCornerRadiusRem(Number(args.cornerRadiusRem ?? CORNER_RADIUS_LIMITS.defaultRem));
	const cornerStyle = typeof args.cornerMode === 'string' ? (args.cornerMode as CornerKind) : project.cornerMode;
	const db = await getStudioDb();
	await db.update(uiProjects).set({ cornerRadiusRem: radius, cornerStyle, updatedAt: Date.now() }).where(eq(uiProjects.id, project.id));
	const updated = await loadProjectWithNodes(project.id);
	const clientIntents: Array<{ kind: string; payload: Record<string, unknown> }> = [
		{ kind: 'UI_SET_CORNER_RADIUS', payload: { cornerRadiusRem: radius } }
	];
	if (typeof args.cornerMode === 'string') {
		clientIntents.push({ kind: 'UI_SET_ACCESSIBILITY', payload: { cornerMode: cornerStyle } });
	}
	if (typeof args.cornerAnimation === 'string') {
		clientIntents.push({ kind: 'UI_SET_EMBELLISHMENT_CONFIG', payload: { cornerAnimation: args.cornerAnimation } });
	}
	return { summary: `corner radius ${radius}rem`, cornerRadiusRem: radius, project: updated, clientIntents };
}

async function toolConfigureStationLayer(args: Record<string, unknown>) {
	const payload: Record<string, unknown> = {};
	for (const k of ['showGrid', 'showReticle', 'topBandRem', 'bottomDockRem', 'edgeRailRem', 'bilateralMirror', 'cornerMorphEnabled']) {
		if (args[k] !== undefined) payload[k] = args[k];
	}
	return { summary: 'updated station layer', stationLayer: payload, clientIntents: [{ kind: 'UI_CONFIGURE_STATION_LAYER', payload }] };
}

async function toolEditZoneDisposition(args: Record<string, unknown>) {
	const zoneId = String(args.zoneId ?? 'TOP_RIGHT').toUpperCase() as HudZoneId;
	if (!HUD_ZONES.includes(zoneId)) throw new Error(`Invalid zoneId: ${zoneId}`);
	const db = await getStudioDb();
	const bpRows = await db.select().from(blueprints).limit(5);
	const row = (args.blueprintId ? bpRows.find((b) => b.id === String(args.blueprintId)) : bpRows[0]) ?? bpRows[0];
	if (!row) throw new Error('No active blueprint found');
	const bp = mapBlueprintRow(row);
	const mirrorOpposite = args.mirrorOpposite !== false;
	const mirroredZoneId = mirrorOpposite ? findOppositeZone(zoneId) : null;
	const corners = Array.isArray(args.corners) ? (args.corners as unknown as CornerTuple) : undefined;
	const radius = typeof args.cornerRadiusRem === 'number' ? clampCornerRadiusRem(args.cornerRadiusRem) : undefined;
	const patch = (z: ZoneBlueprintConfig, overrideCorners?: CornerTuple): ZoneBlueprintConfig => ({
		...z,
		...(args.visible !== undefined ? { visible: Boolean(args.visible) } : {}),
		...(typeof args.disposition === 'string' ? { disposition: args.disposition as ZoneBlueprintConfig['disposition'] } : {}),
		...(typeof args.density === 'string' ? { density: args.density as ZoneBlueprintConfig['density'] } : {}),
		...(overrideCorners ? { corners: overrideCorners } : {}),
		...(radius !== undefined ? { cornerRadiusRem: radius } : {}),
		...(typeof args.shape === 'string' ? { shape: args.shape as ZoneBlueprintConfig['shape'] } : {}),
		...(typeof args.cornerEmbellishment === 'string' ? { cornerEmbellishment: args.cornerEmbellishment as ZoneBlueprintConfig['cornerEmbellishment'] } : {}),
		...(typeof args.cornerAnimation === 'string' ? { cornerAnimation: args.cornerAnimation as ZoneBlueprintConfig['cornerAnimation'] } : {})
	});
	const shouldMirrorTwin = Boolean(mirroredZoneId && (corners || radius !== undefined));
	const nextZones = bp.zones.map((z) => {
		if (z.id === zoneId) return patch(z, corners);
		if (shouldMirrorTwin && z.id === mirroredZoneId) return patch(z, corners ? mirrorCornerTuple(corners) : undefined);
		return z;
	});
	await db.update(blueprints).set({ zonesJson: JSON.stringify(nextZones), updatedAt: Date.now() }).where(eq(blueprints.id, bp.id));
	const clientIntents = [{ kind: 'UI_EDIT_ZONE_DISPOSITION', payload: { ...args, zoneId, mirrorOpposite, ...(corners ? { corners } : {}), ...(radius !== undefined ? { cornerRadiusRem: radius } : {}) } }];
	return { summary: `edited zone ${zoneId}${shouldMirrorTwin ? ` + mirrored ${mirroredZoneId}` : ''}`, blueprint: { ...bp, zones: nextZones }, mirroredZoneId, clientIntents };
}

async function toolMoveEntityToZone(args: Record<string, unknown>) {
	const key = String(args.projectId ?? 'proj-genesis');
	const project = await loadProjectWithNodes(key);
	if (!project) throw new Error(`Project not found: ${key}`);
	const targetZone = String(args.targetZone ?? 'WORLD_CANVAS').toUpperCase() as HudZoneId;
	if (!HUD_ZONES.includes(targetZone)) throw new Error(`Invalid targetZone: ${targetZone}`);
	const query = String(args.nodeId ?? args.nodeQuery ?? '').toLowerCase();
	const target = project.nodes.find((n) => n.id.toLowerCase() === query || n.label.toLowerCase().includes(query) || n.type.toLowerCase().includes(query)) ?? project.nodes[project.nodes.length - 1];
	if (!target) throw new Error('No matching entity found to relocate');
	const nextNodes = project.nodes.map((n) => (n.id === target.id ? { ...n, zone: targetZone } : n));
	const res = await commitProjectRevision(project.id, nextNodes, 'MCP_ZONE_MOVE');
	return { summary: `moved ${target.label} -> ${targetZone}`, project: res.project, clientIntents: [{ kind: 'UI_MOVE_ENTITY_TO_ZONE', payload: { nodeId: target.id, targetZone } }] };
}

export function buildStationMcpTools(): readonly [string, ProjectMcpToolFn][] {
	return [
		['ui_set_corner_radius', toolSetCornerRadius],
		['ui_configure_station_layer', toolConfigureStationLayer],
		['ui_edit_zone_disposition', toolEditZoneDisposition],
		['ui_move_entity_to_zone', toolMoveEntityToZone],
		['ui_open_station_builder', async (args) => ({
			summary: 'opened Station Builder modal', modal: 'station-builder',
			clientIntents: [{ kind: 'UI_OPEN_MODAL', payload: { id: 'station-builder', layer: args.layer ?? 'substrate' } }]
		})],
		['ui_open_zone_edition', async (args) => ({
			summary: 'opened Zone Edition modal', modal: 'zone-edition', zoneId: String(args.zoneId ?? 'TOP_RIGHT').toUpperCase(),
			clientIntents: [{ kind: 'UI_OPEN_MODAL', payload: { id: 'zone-edition', zoneId: String(args.zoneId ?? 'TOP_RIGHT').toUpperCase() } }]
		})]
	];
}

import type { CornerTuple, HudZoneId, UiFrameShape } from '@chronos-ui/svelte';
import { eq } from 'drizzle-orm';
import { buildWireframeSkeleton, patchNodeInTreeByUuid } from '../core';
import { getStudioDb, uiEntities } from '../lib';
import { commitProjectRevision, loadProjectWithNodes } from '../server/routes/routes.projects';

export type EntityMcpToolFn = (args: Record<string, unknown>) => Promise<unknown>;

async function toolListEntities(args: Record<string, unknown>) {
	const projectKey = String(args.projectId ?? args.slug ?? 'proj-genesis');
	const project = await loadProjectWithNodes(projectKey);
	if (!project) throw new Error(`Project not found: ${projectKey}`);
	const db = await getStudioDb();
	let rows = await db.select().from(uiEntities).where(eq(uiEntities.projectUuid, project.id));
	if (typeof args.zoneId === 'string') {
		rows = rows.filter((r) => r.zoneId === args.zoneId);
	}
	return { projectUuid: project.id, count: rows.length, entities: rows };
}

async function toolInspectEntity(args: Record<string, unknown>) {
	const uuid = String(args.uuid ?? '');
	if (!uuid) throw new Error('Entity uuid is required');
	const db = await getStudioDb();
	const rows = await db.select().from(uiEntities).where(eq(uiEntities.uuid, uuid)).limit(1);
	if (!rows[0]) throw new Error(`Entity not found: ${uuid}`);
	return { entity: { ...rows[0], props: JSON.parse(rows[0].propsJson) } };
}

async function toolPatchEntity(args: Record<string, unknown>) {
	const uuid = String(args.uuid ?? '');
	if (!uuid) throw new Error('Entity uuid is required');
	const db = await getStudioDb();
	const rows = await db.select().from(uiEntities).where(eq(uiEntities.uuid, uuid)).limit(1);
	const projectKey = rows[0]?.projectUuid ?? String(args.projectId ?? 'proj-genesis');
	const project = await loadProjectWithNodes(projectKey);
	if (!project) throw new Error(`Project not found: ${projectKey}`);
	const patch = {
		...(typeof args.label === 'string' ? { label: args.label } : {}),
		...(typeof args.zone === 'string' ? { zone: args.zone as HudZoneId } : {}),
		...(typeof args.shape === 'string' ? { shape: args.shape as UiFrameShape } : {}),
		...(Array.isArray(args.corners) ? { corners: args.corners as unknown as CornerTuple } : {}),
		...(args.props && typeof args.props === 'object' ? { props: args.props as Record<string, unknown> } : {})
	};
	const res = patchNodeInTreeByUuid(project.nodes, uuid, patch);
	if (!res.matched) throw new Error(`Entity missing from project tree: ${uuid}`);
	const committed = await commitProjectRevision(project.id, res.nodes, 'MCP_BUILDER');
	return { summary: `patched entity ${uuid}`, revisionId: committed.revisionId, project: committed.project };
}

async function toolGetWireframeSkeleton(args: Record<string, unknown>) {
	const projectKey = String(args.projectId ?? args.slug ?? 'proj-genesis');
	const project = await loadProjectWithNodes(projectKey);
	if (!project) throw new Error(`Project not found: ${projectKey}`);
	return buildWireframeSkeleton(project);
}

export function buildEntityMcpTools(): readonly [string, EntityMcpToolFn][] {
	return [
		['ui_list_entities', toolListEntities],
		['ui_inspect_entity', toolInspectEntity],
		['ui_patch_entity', toolPatchEntity],
		['ui_get_wireframe_skeleton', toolGetWireframeSkeleton]
	];
}

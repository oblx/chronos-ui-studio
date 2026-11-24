import type { CornerTuple, HudZoneId, UiFrameShape, UiNode } from '@chronos-ui/svelte';
import { eq } from 'drizzle-orm';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildWireframeSkeleton, patchNodeInTreeByUuid } from '@studio/core';
import { getStudioDb, uiEntities } from '@studio/lib';
import { compileFullstackBundle } from '@studio/plugins';
import { commitProjectRevision, loadProjectWithNodes } from '@studio/server/routes/routes.projects';
import { resolveMcpProject } from './mcp.project.tools';

export type EntityMcpToolFn = (args: Record<string, unknown>) => Promise<unknown>;

function patchNodeFlag(nodes: readonly UiNode[], nodeId: string, updater: (node: UiNode) => UiNode): { next: UiNode[]; matched: UiNode | null } {
	let matched: UiNode | null = null;
	const walk = (list: readonly UiNode[]): UiNode[] => list.map((n) => {
		if (n.id === nodeId) { const u = updater(n); matched = u; return u; }
		return n.children?.length ? { ...n, children: walk(n.children) } : n;
	});
	return { next: walk(nodes), matched };
}

async function toolListEntities(args: Record<string, unknown>) {
	const project = await resolveMcpProject(args);
	const db = await getStudioDb();
	let rows = await db.select().from(uiEntities).where(eq(uiEntities.projectUuid, project.id));
	if (typeof args.zoneId === 'string') rows = rows.filter((r) => r.zoneId === args.zoneId);
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
	return buildWireframeSkeleton(await resolveMcpProject(args));
}

async function toolToggleEntityLock(args: Record<string, unknown>) {
	const project = await resolveMcpProject(args);
	const { next, matched } = patchNodeFlag(project.nodes, String(args.nodeId ?? ''), (n) => ({ ...n, locked: typeof args.locked === 'boolean' ? args.locked : !(n.locked ?? false) }));
	if (!matched) throw new Error(`Entity not found: ${String(args.nodeId ?? '')}`);
	const res = await commitProjectRevision(project.id, next, 'MCP_LOCK_TOGGLE');
	return { summary: `${matched.locked ? 'locked' : 'unlocked'} ${matched.label}`, nodeId: matched.id, locked: Boolean(matched.locked), project: res.project, clientIntents: [{ kind: 'UI_TOGGLE_ENTITY_LOCK', payload: { nodeId: matched.id, locked: Boolean(matched.locked) } }] };
}

async function toolToggleEntityVisibility(args: Record<string, unknown>) {
	const project = await resolveMcpProject(args);
	const { next, matched } = patchNodeFlag(project.nodes, String(args.nodeId ?? ''), (n) => ({ ...n, visible: typeof args.visible === 'boolean' ? args.visible : !(n.visible !== false) }));
	if (!matched) throw new Error(`Entity not found: ${String(args.nodeId ?? '')}`);
	const res = await commitProjectRevision(project.id, next, 'MCP_VISIBILITY_TOGGLE');
	return { summary: `${matched.visible !== false ? 'shown' : 'hidden'} ${matched.label}`, nodeId: matched.id, visible: matched.visible !== false, project: res.project, clientIntents: [{ kind: 'UI_TOGGLE_ENTITY_VISIBILITY', payload: { nodeId: matched.id, visible: matched.visible !== false } }] };
}

async function toolExportFullstackBundle(args: Record<string, unknown>) {
	const project = await resolveMcpProject(args);
	const workDir = typeof args.outDir === 'string' && args.outDir.trim() ? args.outDir.trim() : join(tmpdir(), `chronos-mcp-fullstack-${project.slug}-${Date.now().toString(36)}`);
	const bundle = await compileFullstackBundle({ project, workDir, emitZip: Boolean(args.emitZip) });
	return { summary: `compiled ${bundle.files.length} full-stack files`, bundle: { adapterId: bundle.adapterId, outDir: bundle.outDir, clientDir: bundle.clientDir, serverDir: bundle.serverDir, files: bundle.files, checksum: bundle.checksum } };
}

export function buildEntityMcpTools(): readonly [string, EntityMcpToolFn][] {
	return [
		['ui_list_entities', toolListEntities],
		['ui_inspect_entity', toolInspectEntity],
		['ui_patch_entity', toolPatchEntity],
		['ui_get_wireframe_skeleton', toolGetWireframeSkeleton]
	];
}

export function buildWireframeMcpTools(): readonly [string, EntityMcpToolFn][] {
	return [
		['ui_open_wireframe_skeleton', async (args) => ({ summary: 'opened Wireframe Skeleton Workbench', modal: 'radar-skeleton', clientIntents: [{ kind: 'UI_OPEN_MODAL', payload: { id: 'radar-skeleton', tool: args.tool ?? 'SELECT' } }] })],
		['ui_toggle_entity_lock', toolToggleEntityLock],
		['ui_toggle_entity_visibility', toolToggleEntityVisibility],
		['ui_export_fullstack_bundle', toolExportFullstackBundle]
	];
}


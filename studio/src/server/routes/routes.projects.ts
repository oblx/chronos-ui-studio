import { clampCornerRadiusRem, generateUuidV7, THEME_PACKS, type CornerKind, type UiNodeTree, type UiProjectBuildConfig, type UiProjectDefinition } from '@chronos-ui/svelte';
import { desc, eq, inArray } from 'drizzle-orm';
import { DEFAULT_BUILD_CONFIG, flattenNodesToEntityRecords, formatHlc, patchNodeInTreeByUuid, tickHlc, validateUiNodeTree } from '../../core';
import { getStudioDb, mapProjectRow, uiEntities, uiProjectRevisions, uiProjects } from '../../lib';
import { pushServerTrace } from '../server.telemetry';
import { HTTP_STATUS, jsonErr, jsonOk, parseJsonSafe, readJsonBody, toSlug } from './http.helpers';

export async function loadProjectWithNodes(idOrSlug: string): Promise<UiProjectDefinition | null> {
	const db = await getStudioDb();
	let rows = await db.select().from(uiProjects).where(eq(uiProjects.id, idOrSlug)).limit(1);
	if (!rows[0]) rows = await db.select().from(uiProjects).where(eq(uiProjects.slug, idOrSlug)).limit(1);
	if (!rows[0]) return null;
	const rev = await db.select().from(uiProjectRevisions).where(eq(uiProjectRevisions.id, rows[0].activeRevisionId)).limit(1);
	const nodes: UiNodeTree = rev[0] ? parseJsonSafe<UiNodeTree>(rev[0].nodesJson, []) : [];
	return mapProjectRow(rows[0], nodes);
}

export async function listAllProjects(): Promise<UiProjectDefinition[]> {
	const db = await getStudioDb();
	const rows = await db.select().from(uiProjects).orderBy(desc(uiProjects.updatedAt));
	const revIds = rows.map((r) => r.activeRevisionId);
	const revs = revIds.length > 0 ? await db.select().from(uiProjectRevisions).where(inArray(uiProjectRevisions.id, revIds)) : [];
	const revById = new Map(revs.map((r) => [r.id, r]));
	return rows.map((row) => {
		const rev = revById.get(row.activeRevisionId);
		return mapProjectRow(row, rev ? parseJsonSafe<UiNodeTree>(rev.nodesJson, []) : []);
	});
}

async function syncEntitiesTx(tx: Parameters<Parameters<Awaited<ReturnType<typeof getStudioDb>>['transaction']>[0]>[0], projectId: string, nodes: UiNodeTree, hlc: string, now: number): Promise<void> {
	await tx.delete(uiEntities).where(eq(uiEntities.projectUuid, projectId));
	const records = flattenNodesToEntityRecords(projectId, nodes, hlc, now);
	if (records.length > 0) {
		await tx.delete(uiEntities).where(inArray(uiEntities.uuid, records.map((r) => r.uuid)));
		await tx.insert(uiEntities).values(records);
	}
}

export async function createStudioProject(input: { name: string; description?: string; themeId?: string; nodes?: UiNodeTree }): Promise<UiProjectDefinition> {
	const db = await getStudioDb();
	const now = Date.now();
	const baseSlug = toSlug(input.name, 'workspace');
	const id = generateUuidV7();
	const slug = `${baseSlug}-${id.slice(-4)}`;
	const revId = generateUuidV7();
	const hlc = formatHlc(tickHlc(null, 'studio', now));
	const nodes = input.nodes ?? [];
	const themeId = input.themeId ?? THEME_PACKS[0].id;
	await db.transaction(async (tx) => {
		await tx.insert(uiProjects).values({
			id, slug, name: input.name.trim() || 'Untitled Workspace',
			description: input.description ?? 'Calm empty-stage UI workspace.',
			activeRevisionId: revId, themeId, cornerStyle: 'CHAMFER',
			buildConfigJson: JSON.stringify(DEFAULT_BUILD_CONFIG), createdAt: now, updatedAt: now
		});
		await tx.insert(uiProjectRevisions).values({
			id: revId, projectId: id, hlcTimestamp: hlc, parentRevisionId: null, nodesJson: JSON.stringify(nodes), authorOrigin: 'USER', createdAt: now
		});
		await syncEntitiesTx(tx, id, nodes, hlc, now);
	});
	pushServerTrace('UI_SWITCH_PROJECT', `Created project ${slug}`, 0.4, true, 'USER');
	return (await loadProjectWithNodes(id))!;
}

export async function commitProjectRevision(projectId: string, nodes: UiNodeTree, authorOrigin = 'USER'): Promise<{ revisionId: string; project: UiProjectDefinition }> {
	const check = validateUiNodeTree(nodes);
	if (!check.ok) throw new Error(check.error);
	const db = await getStudioDb();
	const rows = await db.select().from(uiProjects).where(eq(uiProjects.id, projectId)).limit(1);
	if (!rows[0]) throw new Error(`Project not found: ${projectId}`);
	const now = Date.now();
	const revisionId = generateUuidV7();
	const hlc = formatHlc(tickHlc(null, 'studio', now));
	await db.transaction(async (tx) => {
		await tx.insert(uiProjectRevisions).values({
			id: revisionId, projectId, hlcTimestamp: hlc,
			parentRevisionId: rows[0].activeRevisionId, nodesJson: JSON.stringify(check.nodes), authorOrigin, createdAt: now
		});
		await tx.update(uiProjects).set({ activeRevisionId: revisionId, updatedAt: now }).where(eq(uiProjects.id, projectId));
		await syncEntitiesTx(tx, projectId, check.nodes, hlc, now);
	});
	pushServerTrace('UI_COMMIT_NODE', `Committed revision ${revisionId} (${check.nodes.length} nodes)`, 0.5, true, 'SYSTEM');
	return { revisionId, project: (await loadProjectWithNodes(projectId))! };
}

async function handleProjectPatch(req: Request, id: string): Promise<Response> {
	const body = await readJsonBody<{ name?: string; themeId?: string; cornerMode?: CornerKind; cornerRadiusRem?: number; activeCursorPackId?: string | null; buildConfig?: Partial<UiProjectBuildConfig> }>(req);
	const db = await getStudioDb();
	const rows = await db.select().from(uiProjects).where(eq(uiProjects.id, id)).limit(1);
	if (!rows[0]) return jsonErr('Project not found', HTTP_STATUS.NOT_FOUND);
	const mergedCfg = { ...parseJsonSafe<Partial<UiProjectBuildConfig>>(rows[0].buildConfigJson, {}), ...(body.buildConfig ?? {}) };
	const radius = body.cornerRadiusRem !== undefined ? clampCornerRadiusRem(Number(body.cornerRadiusRem)) : rows[0].cornerRadiusRem;
	await db.update(uiProjects).set({
		name: body.name ?? rows[0].name, themeId: body.themeId ?? rows[0].themeId, cornerStyle: body.cornerMode ?? rows[0].cornerStyle,
		cornerRadiusRem: radius, cursorPackUuid: body.activeCursorPackId !== undefined ? body.activeCursorPackId : rows[0].cursorPackUuid,
		buildConfigJson: JSON.stringify(mergedCfg), updatedAt: Date.now()
	}).where(eq(uiProjects.id, id));
	return jsonOk({ project: await loadProjectWithNodes(id) });
}

async function handleEntityRoutes(req: Request, path: string): Promise<Response | null> {
	const entListMatch = path.match(/^\/api\/projects\/([^/]+)\/entities$/);
	if (entListMatch && req.method === 'GET') {
		const db = await getStudioDb();
		const rows = await db.select().from(uiEntities).where(eq(uiEntities.projectUuid, entListMatch[1]));
		return jsonOk({ entities: rows });
	}
	const entPatchMatch = path.match(/^\/api\/entities\/([^/]+)$/);
	if (entPatchMatch && req.method === 'PATCH') {
		const db = await getStudioDb();
		const existing = await db.select().from(uiEntities).where(eq(uiEntities.uuid, entPatchMatch[1])).limit(1);
		if (!existing[0]) return jsonErr('Entity not found', HTTP_STATUS.NOT_FOUND);
		const project = await loadProjectWithNodes(existing[0].projectUuid);
		if (!project) return jsonErr('Parent project not found', HTTP_STATUS.NOT_FOUND);
		const body = await readJsonBody<Record<string, unknown>>(req);
		const patched = patchNodeInTreeByUuid(project.nodes, entPatchMatch[1], body);
		if (!patched.matched) return jsonErr('Entity missing from tree', HTTP_STATUS.NOT_FOUND);
		const res = await commitProjectRevision(project.id, patched.nodes, 'API_ENTITY_PATCH');
		return jsonOk({ revisionId: res.revisionId, project: res.project });
	}
	return null;
}

export async function handleProjectRoutes(req: Request, path: string): Promise<Response | null> {
	if (path === '/api/projects' && req.method === 'GET') return jsonOk({ projects: await listAllProjects() });
	if (path === '/api/projects' && req.method === 'POST') {
		const body = await readJsonBody<{ name?: string; description?: string; themeId?: string; nodes?: UiNodeTree }>(req);
		return jsonOk({ project: await createStudioProject({ name: body.name || 'New Canvas', description: body.description, themeId: body.themeId, nodes: body.nodes }) }, HTTP_STATUS.CREATED);
	}
	const entRes = await handleEntityRoutes(req, path);
	if (entRes) return entRes;
	const revMatch = path.match(/^\/api\/projects\/([^/]+)\/revisions$/);
	if (revMatch) {
		const db = await getStudioDb();
		if (req.method === 'GET') {
			const revs = await db.select().from(uiProjectRevisions).where(eq(uiProjectRevisions.projectId, revMatch[1])).orderBy(desc(uiProjectRevisions.createdAt)).limit(30);
			return jsonOk({ revisions: revs.map((r) => ({ ...r, nodes: parseJsonSafe<UiNodeTree>(r.nodesJson, []) })) });
		}
		if (req.method === 'POST') {
			const body = await readJsonBody<{ nodes: UiNodeTree; authorOrigin?: string }>(req);
			try { return jsonOk(await commitProjectRevision(revMatch[1], body.nodes, body.authorOrigin ?? 'USER'), HTTP_STATUS.CREATED); }
			catch (err) { return jsonErr(err instanceof Error ? err.message : 'Invalid revision', HTTP_STATUS.BAD_REQUEST); }
		}
	}
	const projMatch = path.match(/^\/api\/projects\/([^/]+)$/);
	if (projMatch && req.method === 'PATCH') return handleProjectPatch(req, projMatch[1]);
	return null;
}

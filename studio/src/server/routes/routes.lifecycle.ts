import { clampCornerRadiusRem, type CornerKind, type UiNodeTree, type UiProjectBuildConfig, type UiProjectDefinition } from '@chronos-ui/svelte';
import { eq } from 'drizzle-orm';
import { getStudioDb, uiProjects } from '../../lib';
import { pushServerTrace } from '../server.telemetry';
import { HTTP_STATUS, jsonErr, jsonOk, parseJsonSafe, readJsonBody } from './http.helpers';
import { commitProjectRevision, loadProjectWithNodes } from './routes.projects';

export interface SaveProjectInput {
	readonly name?: string;
	readonly themeId?: string;
	readonly cornerMode?: CornerKind;
	readonly cornerRadiusRem?: number;
	readonly activeCursorPackId?: string | null;
	readonly nodes?: UiNodeTree;
	readonly buildConfig?: Partial<UiProjectBuildConfig>;
	readonly authorOrigin?: string;
}

export async function saveProjectSnapshot(projectId: string, input: SaveProjectInput = {}): Promise<{ savedAt: number; revisionId: string; project: UiProjectDefinition }> {
	const db = await getStudioDb();
	const rows = await db.select().from(uiProjects).where(eq(uiProjects.id, projectId)).limit(1);
	if (!rows[0]) throw new Error(`Project not found: ${projectId}`);
	const mergedCfg = { ...parseJsonSafe<Partial<UiProjectBuildConfig>>(rows[0].buildConfigJson, {}), ...(input.buildConfig ?? {}) };
	const now = Date.now();
	await db.update(uiProjects).set({
		name: input.name ?? rows[0].name,
		themeId: input.themeId ?? rows[0].themeId,
		cornerStyle: input.cornerMode ?? rows[0].cornerStyle,
		cornerRadiusRem: input.cornerRadiusRem !== undefined ? clampCornerRadiusRem(input.cornerRadiusRem) : rows[0].cornerRadiusRem,
		cursorPackUuid: input.activeCursorPackId !== undefined ? input.activeCursorPackId : rows[0].cursorPackUuid,
		buildConfigJson: JSON.stringify(mergedCfg),
		updatedAt: now
	}).where(eq(uiProjects.id, projectId));
	if (input.nodes) {
		const res = await commitProjectRevision(projectId, input.nodes, input.authorOrigin ?? 'USER_SAVE');
		pushServerTrace('UI_PROJECT_SAVE', `Saved project ${rows[0].slug} (${input.nodes.length} nodes)`, 0.5, true, 'USER');
		return { savedAt: now, revisionId: res.revisionId, project: res.project };
	}
	const current = (await loadProjectWithNodes(projectId))!;
	pushServerTrace('UI_PROJECT_SAVE', `Saved project metadata ${current.slug}`, 0.3, true, 'USER');
	return { savedAt: now, revisionId: current.activeRevisionId, project: current };
}

export async function cleanProjectWorkspace(projectId: string): Promise<{ revisionId: string; project: UiProjectDefinition }> {
	const res = await commitProjectRevision(projectId, [], 'USER_CLEAN');
	pushServerTrace('UI_PROJECT_CLEAN', `Cleaned workspace ${res.project.slug} to Calm Empty Stage`, 0.4, true, 'USER');
	return res;
}

export async function handleLifecycleRoutes(req: Request, path: string): Promise<Response | null> {
	const saveMatch = path.match(/^\/api\/projects\/([^/]+)\/save$/);
	if (saveMatch && req.method === 'POST') {
		try {
			const body = await readJsonBody<SaveProjectInput>(req, {});
			return jsonOk(await saveProjectSnapshot(saveMatch[1], body));
		} catch (err) {
			return jsonErr(err instanceof Error ? err.message : 'Save failed', HTTP_STATUS.BAD_REQUEST);
		}
	}
	const cleanMatch = path.match(/^\/api\/projects\/([^/]+)\/clean$/);
	if (cleanMatch && req.method === 'POST') {
		try { return jsonOk(await cleanProjectWorkspace(cleanMatch[1])); }
		catch (err) { return jsonErr(err instanceof Error ? err.message : 'Clean failed', HTTP_STATUS.NOT_FOUND); }
	}
	return null;
}

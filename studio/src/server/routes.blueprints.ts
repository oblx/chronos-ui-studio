import { eq } from 'drizzle-orm';
import { STUDIO_CONFIG } from '../config';
import { validateBlueprint } from '../core';
import { blueprints, getStudioDb, mapBlueprintRow } from '../lib';
import { dispatchOutboundWebhooks, exportBlueprintArtifact, type ExportFormat } from '../plugins';
import { pushServerTrace } from './server.telemetry';
import { HTTP_STATUS, jsonErr, jsonOk, readJsonBody } from './routes';

async function saveBlueprint(req: Request): Promise<Response> {
	const db = await getStudioDb();
	const t0 = performance.now();
	const valid = validateBlueprint(await readJsonBody<unknown>(req));
	if (!valid.ok) return jsonErr(valid.error, HTTP_STATUS.BAD_REQUEST);
	const bp = valid.blueprint;
	const existing = await db.select().from(blueprints).where(eq(blueprints.id, bp.id)).limit(1);
	if (existing[0]) {
		await db.update(blueprints).set({
			name: bp.name, description: bp.description, themeId: bp.themeId,
			cornerMode: bp.cornerMode, zonesJson: JSON.stringify(bp.zones),
			starred: bp.starred ? 1 : 0, version: existing[0].version + 1, updatedAt: Date.now()
		}).where(eq(blueprints.id, bp.id));
	} else {
		await db.insert(blueprints).values({
			id: bp.id, name: bp.name, description: bp.description, themeId: bp.themeId,
			cornerMode: bp.cornerMode, zonesJson: JSON.stringify(bp.zones),
			starred: bp.starred ? 1 : 0, version: bp.version, ownerId: STUDIO_CONFIG.devSeed.ownerId, updatedAt: Date.now()
		});
	}
	pushServerTrace('STUDIO_COMMAND_EXEC', `Saved blueprint ${bp.id}`, performance.now() - t0);
	void dispatchOutboundWebhooks('blueprint.saved', { id: bp.id, name: bp.name });
	return jsonOk({ blueprint: bp }, HTTP_STATUS.CREATED);
}

async function cloneBlueprint(id: string): Promise<Response> {
	const db = await getStudioDb();
	const t0 = performance.now();
	const rows = await db.select().from(blueprints).where(eq(blueprints.id, id)).limit(1);
	if (!rows[0]) return jsonErr('Blueprint not found.', HTTP_STATUS.NOT_FOUND);
	const clonedId = `bp-${Date.now().toString(36)}`;
	const clonedName = `${rows[0].name} Copy`;
	await db.insert(blueprints).values({ ...rows[0], id: clonedId, name: clonedName, version: 1, updatedAt: Date.now() });
	pushServerTrace('STUDIO_COMMAND_EXEC', `Cloned ${id} -> ${clonedId}`, performance.now() - t0);
	return jsonOk({ blueprint: mapBlueprintRow({ ...rows[0], id: clonedId, name: clonedName, version: 1 }) }, HTTP_STATUS.CREATED);
}

async function exportBlueprint(req: Request, id: string): Promise<Response> {
	const db = await getStudioDb();
	const format = (new URL(req.url).searchParams.get('format') ?? 'json') as ExportFormat;
	const rows = await db.select().from(blueprints).where(eq(blueprints.id, id)).limit(1);
	if (!rows[0]) return jsonErr('Blueprint not found.', HTTP_STATUS.NOT_FOUND);
	return jsonOk(exportBlueprintArtifact(mapBlueprintRow(rows[0]), format));
}

export async function handleBlueprintRoutes(req: Request, path: string): Promise<Response | null> {
	if (!path.startsWith('/api/blueprints')) return null;
	const db = await getStudioDb();
	if (path === '/api/blueprints' && req.method === 'GET') {
		return jsonOk({ blueprints: (await db.select().from(blueprints)).map(mapBlueprintRow) });
	}
	if (path === '/api/blueprints' && req.method === 'POST') return saveBlueprint(req);
	const cloneMatch = /^\/api\/blueprints\/([^/]+)\/clone$/.exec(path);
	if (cloneMatch && req.method === 'POST') return cloneBlueprint(decodeURIComponent(cloneMatch[1]));
	const exportMatch = /^\/api\/blueprints\/([^/]+)\/export$/.exec(path);
	if (exportMatch && req.method === 'GET') return exportBlueprint(req, decodeURIComponent(exportMatch[1]));
	const itemMatch = /^\/api\/blueprints\/([^/]+)$/.exec(path);
	if (itemMatch && req.method === 'DELETE') {
		const id = decodeURIComponent(itemMatch[1]);
		await db.delete(blueprints).where(eq(blueprints.id, id));
		pushServerTrace('STUDIO_COMMAND_EXEC', `Deleted blueprint ${id}`, 0.2);
		return jsonOk({ ok: true, id });
	}
	return null;
}

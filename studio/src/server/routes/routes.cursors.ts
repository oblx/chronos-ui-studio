import {
	CSS_CURSOR_STATES, CURSOR_LIMITS, generateUuidV7, type CssCursorState, type CursorPackDefinition
} from '@chronos-ui/svelte';
import { and, desc, eq } from 'drizzle-orm';
import { deriveAllCursorStates, validatePngDataUrl } from '@studio/core';
import { cursorPacks, cursorStateAssets, getStudioDb, mapCursorPackRow } from '@studio/lib';
import { pushServerTrace } from '../server.telemetry';
import { clampNumber, HTTP_STATUS, jsonErr, jsonOk, readJsonBody, toSlug } from './http.helpers';

const clampSpot = (v: unknown, fallback: number): number => clampNumber(v, fallback, 0, CURSOR_LIMITS.maxHotspot);

export async function listCursorPacks(): Promise<CursorPackDefinition[]> {
	const db = await getStudioDb();
	const [rows, allAssets] = await Promise.all([
		db.select().from(cursorPacks).orderBy(desc(cursorPacks.isBuiltin), desc(cursorPacks.updatedAt)),
		db.select().from(cursorStateAssets)
	]);
	const byPack = new Map<string, (typeof cursorStateAssets.$inferSelect)[]>();
	for (const asset of allAssets) {
		const bucket = byPack.get(asset.packUuid);
		if (bucket) bucket.push(asset);
		else byPack.set(asset.packUuid, [asset]);
	}
	return rows.map((row) => mapCursorPackRow(row, byPack.get(row.uuid) ?? []));
}

export async function loadCursorPackById(uuidOrSlug: string): Promise<CursorPackDefinition | null> {
	const db = await getStudioDb();
	let rows = await db.select().from(cursorPacks).where(eq(cursorPacks.uuid, uuidOrSlug)).limit(1);
	if (!rows[0]) rows = await db.select().from(cursorPacks).where(eq(cursorPacks.slug, uuidOrSlug)).limit(1);
	if (!rows[0]) return null;
	const assets = await db.select().from(cursorStateAssets).where(eq(cursorStateAssets.packUuid, rows[0].uuid));
	return mapCursorPackRow(rows[0], assets);
}

export async function createCustomCursorPack(input: { name: string; description?: string; forkFromUuid?: string; sourcePngDataUrl?: string; baseHotspotX?: number; baseHotspotY?: number }): Promise<CursorPackDefinition> {
	if (input.sourcePngDataUrl) {
		const check = validatePngDataUrl(input.sourcePngDataUrl);
		if (!check.ok) throw new Error(check.error);
	}
	const db = await getStudioDb();
	const now = Date.now();
	const uuid = generateUuidV7();
	const slug = `${toSlug(input.name, 'cursor-pack')}-${uuid.slice(-4)}`;
	const parent = input.forkFromUuid ? await loadCursorPackById(input.forkFromUuid) : null;
	const hx = clampSpot(input.baseHotspotX, parent?.baseHotspotX ?? CURSOR_LIMITS.defaultHotspotX);
	const hy = clampSpot(input.baseHotspotY, parent?.baseHotspotY ?? CURSOR_LIMITS.defaultHotspotY);
	const sourcePng = input.sourcePngDataUrl ?? parent?.sourcePngDataUrl;
	const seedAssets = CSS_CURSOR_STATES.map((st) => ({
		uuid: generateUuidV7(), packUuid: uuid, cssState: st,
		assetDataUrl: st === 'default' && sourcePng ? sourcePng : (parent?.states[st]?.assetDataUrl ?? ''),
		hotspotX: st === 'default' ? hx : (parent?.states[st]?.hotspotX ?? hx),
		hotspotY: st === 'default' ? hy : (parent?.states[st]?.hotspotY ?? hy),
		generatorOrigin: st === 'default' && sourcePng ? 'USER_UPLOAD' : (parent?.states[st]?.generatorOrigin ?? 'PRESET'),
		updatedAt: now
	}));
	await db.transaction(async (tx) => {
		await tx.insert(cursorPacks).values({
			uuid, slug, name: input.name.trim() || 'Custom Cursor Pack',
			description: input.description ?? (parent ? `Forked from ${parent.name}` : `Custom ${CSS_CURSOR_STATES.length}-state PNG-derived cursor pack.`),
			isBuiltin: 0, derivedFromUuid: parent?.uuid ?? null, sourcePngDataUrl: sourcePng ?? null,
			baseHotspotX: hx, baseHotspotY: hy, createdAt: now, updatedAt: now
		});
		await tx.insert(cursorStateAssets).values(seedAssets);
	});
	pushServerTrace('UI_APPLY_CURSOR_PACK', `Created cursor pack ${slug}`, 0.4, true, 'USER');
	return (await loadCursorPackById(uuid))!;
}

export async function deriveCursorStatesForPack(uuid: string, opts?: { accentColor?: string; useAiLabel?: boolean }): Promise<CursorPackDefinition> {
	const pack = await loadCursorPackById(uuid);
	if (!pack) throw new Error(`Cursor pack not found: ${uuid}`);
	const { states } = await deriveAllCursorStates({ basePack: pack, accentColor: opts?.accentColor, useAiLabel: opts?.useAiLabel });
	const db = await getStudioDb();
	const now = Date.now();
	await db.transaction(async (tx) => {
		await tx.delete(cursorStateAssets).where(eq(cursorStateAssets.packUuid, uuid));
		await tx.insert(cursorStateAssets).values(CSS_CURSOR_STATES.map((st) => ({
			uuid: generateUuidV7(), packUuid: uuid, cssState: st,
			assetDataUrl: states[st].assetDataUrl, hotspotX: states[st].hotspotX,
			hotspotY: states[st].hotspotY, generatorOrigin: states[st].generatorOrigin, updatedAt: now
		})));
		await tx.update(cursorPacks).set({ updatedAt: now }).where(eq(cursorPacks.uuid, uuid));
	});
	pushServerTrace('UI_UPDATE_CURSOR_STATE', `Derived ${CSS_CURSOR_STATES.length} cursor states for ${pack.slug}`, 0.6, true, 'SYSTEM');
	return (await loadCursorPackById(uuid))!;
}

function validateAssetUrl(url: string): void {
	if (url.startsWith('data:image/png;base64,')) {
		const check = validatePngDataUrl(url);
		if (!check.ok) throw new Error(check.error);
		return;
	}
	if (!url.startsWith('data:image/svg+xml,') || /<script|%3cscript/i.test(url)) throw new Error('Cursor assetDataUrl must be a safe SVG or PNG data URL.');
}

export async function updateCursorStateAsset(uuid: string, cssState: CssCursorState, patch: { hotspotX?: number; hotspotY?: number; assetDataUrl?: string }): Promise<CursorPackDefinition> {
	if (!CSS_CURSOR_STATES.includes(cssState)) throw new Error(`Invalid CSS cursor state: ${cssState}`);
	if (patch.assetDataUrl !== undefined) validateAssetUrl(patch.assetDataUrl);
	const db = await getStudioDb();
	const existing = await db.select().from(cursorStateAssets).where(and(eq(cursorStateAssets.packUuid, uuid), eq(cursorStateAssets.cssState, cssState))).limit(1);
	if (!existing[0]) throw new Error(`Cursor state not found: ${uuid}/${cssState}`);
	const now = Date.now();
	const hx = clampSpot(patch.hotspotX, existing[0].hotspotX);
	const hy = clampSpot(patch.hotspotY, existing[0].hotspotY);
	await db.transaction(async (tx) => {
		await tx.update(cursorStateAssets).set({
			hotspotX: hx, hotspotY: hy,
			assetDataUrl: patch.assetDataUrl ?? existing[0].assetDataUrl, updatedAt: now
		}).where(eq(cursorStateAssets.uuid, existing[0].uuid));
		if (cssState === 'default') {
			await tx.update(cursorPacks).set({ baseHotspotX: hx, baseHotspotY: hy, updatedAt: now }).where(eq(cursorPacks.uuid, uuid));
		}
	});
	return (await loadCursorPackById(uuid))!;
}

export async function handleCursorRoutes(req: Request, path: string): Promise<Response | null> {
	if (path === '/api/cursors' && req.method === 'GET') return jsonOk({ packs: await listCursorPacks() });
	if (path === '/api/cursors' && req.method === 'POST') {
		try {
			const body = await readJsonBody<Parameters<typeof createCustomCursorPack>[0]>(req);
			return jsonOk({ pack: await createCustomCursorPack(body) }, HTTP_STATUS.CREATED);
		} catch (err) {
			return jsonErr(err instanceof Error ? err.message : 'Invalid cursor upload', HTTP_STATUS.BAD_REQUEST);
		}
	}
	const deriveMatch = path.match(/^\/api\/cursors\/([^/]+)\/derive-states$/);
	if (deriveMatch && req.method === 'POST') {
		const body = await readJsonBody<{ accentColor?: string; useAiLabel?: boolean }>(req, {});
		try { return jsonOk({ pack: await deriveCursorStatesForPack(deriveMatch[1], body), derivedCount: CSS_CURSOR_STATES.length - 1 }); }
		catch (err) { return jsonErr(err instanceof Error ? err.message : 'Derive failed', HTTP_STATUS.NOT_FOUND); }
	}
	const stateMatch = path.match(/^\/api\/cursors\/([^/]+)\/states\/([^/]+)$/);
	if (stateMatch && req.method === 'PATCH') {
		const body = await readJsonBody<{ hotspotX?: number; hotspotY?: number; assetDataUrl?: string }>(req);
		try { return jsonOk({ pack: await updateCursorStateAsset(stateMatch[1], stateMatch[2] as CssCursorState, body) }); }
		catch (err) { return jsonErr(err instanceof Error ? err.message : 'Update failed', HTTP_STATUS.BAD_REQUEST); }
	}
	return null;
}

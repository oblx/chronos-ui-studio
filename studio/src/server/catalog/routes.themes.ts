import { THEME_PACKS, validateThemePackContrast, type ThemePack } from '@chronos-ui/svelte';
import { eq } from 'drizzle-orm';
import { STUDIO_CONFIG } from '@studio/config';
import { getStudioDb, mapThemeRow, themes } from '@studio/lib';
import { pushServerTrace } from '../server.telemetry';
import { HTTP_STATUS, jsonErr, jsonOk, readJsonBody } from '../routes';

async function listThemes(req: Request): Promise<Response> {
	const db = await getStudioDb();
	const url = new URL(req.url);
	const polarity = url.searchParams.get('polarity');
	const starredOnly = url.searchParams.get('starred') === 'true';
	const rows = (await db.select().from(themes)).map(mapThemeRow);
	const filtered = rows
		.filter((t) => (polarity === 'dark' || polarity === 'light' ? t.polarity === polarity : true))
		.filter((t) => (starredOnly ? t.starred : true));
	return jsonOk({ themes: filtered });
}

async function createTheme(req: Request): Promise<Response> {
	const db = await getStudioDb();
	const t0 = performance.now();
	const body = await readJsonBody<Partial<ThemePack>>(req);
	const pack: ThemePack = {
		id: body.id?.trim() || `theme-${Date.now().toString(36)}`,
		name: body.name?.trim() || 'Custom Theme',
		polarity: body.polarity === 'light' ? 'light' : 'dark',
		tokens: { ...THEME_PACKS[0].tokens, ...(body.tokens ?? {}) }
	};
	await db.insert(themes).values({
		id: pack.id, name: pack.name, polarity: pack.polarity,
		tokensJson: JSON.stringify(pack.tokens), starred: 0,
		ownerId: STUDIO_CONFIG.devSeed.ownerId, updatedAt: Date.now()
	});
	pushServerTrace('UI_SET_THEME', `Created theme ${pack.name}`, performance.now() - t0);
	return jsonOk({ theme: { ...pack, starred: false }, wcag: validateThemePackContrast(pack) }, HTTP_STATUS.CREATED);
}

async function toggleThemeStar(id: string): Promise<Response> {
	const db = await getStudioDb();
	const t0 = performance.now();
	const existing = await db.select().from(themes).where(eq(themes.id, id)).limit(1);
	if (!existing[0]) return jsonErr('Theme not found.', HTTP_STATUS.NOT_FOUND);
	const nextStar = existing[0].starred === 1 ? 0 : 1;
	await db.update(themes).set({ starred: nextStar, updatedAt: Date.now() }).where(eq(themes.id, id));
	pushServerTrace('UI_SET_THEME', `Toggled star on ${id}`, performance.now() - t0);
	return jsonOk({ id, starred: nextStar === 1 });
}

export async function handleThemeRoutes(req: Request, path: string): Promise<Response | null> {
	if (!path.startsWith('/api/themes')) return null;
	if (path === '/api/themes' && req.method === 'GET') return listThemes(req);
	if (path === '/api/themes' && req.method === 'POST') return createTheme(req);
	const starMatch = /^\/api\/themes\/([^/]+)\/star$/.exec(path);
	if (starMatch && req.method === 'PATCH') return toggleThemeStar(decodeURIComponent(starMatch[1]));
	return null;
}

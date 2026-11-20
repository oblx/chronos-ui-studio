import { eq } from 'drizzle-orm';
import { CAPABILITY_BITS } from '../config';
import { validateWebhookUrl } from '../core';
import { encryptSecret, getStudioDb, webhooks } from '../lib';
import { requireCapability, resolvePrincipal } from './auth.middleware';
import { HTTP_STATUS, jsonErr, jsonOk, parseJsonSafe, readJsonBody } from './routes';

export async function handleWebhookRoutes(req: Request, path: string): Promise<Response | null> {
	if (!path.startsWith('/api/webhooks')) return null;
	const principal = await resolvePrincipal(req);
	const guard = requireCapability(principal, CAPABILITY_BITS.MANAGE_WEBHOOKS);
	if (guard) return guard;
	const db = await getStudioDb();

	if (path === '/api/webhooks' && req.method === 'GET') {
		const rows = await db.select().from(webhooks);
		return jsonOk({
			webhooks: rows.map((w) => ({ id: w.id, url: w.url, events: parseJsonSafe<string[]>(w.eventsJson, ['*']), enabled: w.enabled === 1 }))
		});
	}

	if (path === '/api/webhooks' && req.method === 'POST') {
		const body = await readJsonBody<{ url?: string; secret?: string; events?: string[] }>(req);
		const check = validateWebhookUrl(String(body.url ?? ''));
		if (!check.ok) return jsonErr(check.error, HTTP_STATUS.BAD_REQUEST);
		const secret = String(body.secret ?? crypto.randomUUID());
		const id = `wh-${Date.now().toString(36)}`;
		await db.insert(webhooks).values({
			id,
			url: check.url.toString(),
			secretCipher: await encryptSecret(secret),
			eventsJson: JSON.stringify(Array.isArray(body.events) ? body.events : ['*']),
			enabled: 1,
			createdAt: Date.now()
		});
		return jsonOk({ id, url: check.url.toString() }, HTTP_STATUS.CREATED);
	}

	const delMatch = /^\/api\/webhooks\/([^/]+)$/.exec(path);
	if (delMatch && req.method === 'DELETE') {
		await db.delete(webhooks).where(eq(webhooks.id, decodeURIComponent(delMatch[1])));
		return jsonOk({ ok: true });
	}
	return null;
}

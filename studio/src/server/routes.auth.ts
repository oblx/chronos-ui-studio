import { eq } from 'drizzle-orm';
import { STUDIO_CONFIG } from '../config';
import { maskForRole } from '../core';
import { getStudioDb, hashPassword, hashToken, mcpTokens, sessions, users, verifyPassword } from '../lib';
import { extractClientIpHash, resolvePrincipal } from './auth.middleware';
import { HTTP_STATUS, jsonErr, jsonOk, readJsonBody } from './routes';

function buildSessionCookie(rawToken: string, maxAgeSec: number): string {
	return `${STUDIO_CONFIG.sessionCookieName}=${encodeURIComponent(rawToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}`;
}

async function createSessionForUser(userId: string): Promise<string> {
	const db = await getStudioDb();
	const rawToken = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
	const now = Date.now();
	await db.insert(sessions).values({
		id: `ses-${now.toString(36)}`,
		userId,
		tokenHash: hashToken(rawToken),
		expiresAt: now + STUDIO_CONFIG.sessionTtlMs,
		createdAt: now
	});
	return rawToken;
}

async function handleLogin(req: Request): Promise<Response> {
	const db = await getStudioDb();
	const body = await readJsonBody<{ email?: string; password?: string }>(req);
	const email = String(body.email ?? '').trim().toLowerCase();
	const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
	const u = rows[0];
	if (!u || !(await verifyPassword(String(body.password ?? ''), u.passwordHash))) {
		return jsonErr('Invalid credentials.', HTTP_STATUS.UNAUTHORIZED);
	}
	const token = await createSessionForUser(u.id);
	const maxAge = Math.floor(STUDIO_CONFIG.sessionTtlMs / 1000);
	return jsonOk(
		{ user: { userId: u.id, email: u.email, displayName: u.displayName, role: u.role, capabilityMask: u.capabilityMask } },
		HTTP_STATUS.OK, { 'Set-Cookie': buildSessionCookie(token, maxAge) }
	);
}

async function handleRegister(req: Request): Promise<Response> {
	const db = await getStudioDb();
	const body = await readJsonBody<{ email?: string; password?: string; displayName?: string }>(req);
	const email = String(body.email ?? '').trim().toLowerCase();
	const password = String(body.password ?? '');
	if (!email.includes('@') || password.length < STUDIO_CONFIG.minPasswordLength) {
		return jsonErr(`Valid email and ${STUDIO_CONFIG.minPasswordLength}+ character password required.`, HTTP_STATUS.BAD_REQUEST);
	}
	const userId = `usr-${Date.now().toString(36)}`;
	const cap = maskForRole('editor');
	const displayName = String(body.displayName ?? email.split('@')[0]).trim();
	await db.insert(users).values({ id: userId, email, displayName, passwordHash: await hashPassword(password), role: 'editor', capabilityMask: cap, createdAt: Date.now() });
	const token = await createSessionForUser(userId);
	const maxAge = Math.floor(STUDIO_CONFIG.sessionTtlMs / 1000);
	return jsonOk(
		{ user: { userId, email, displayName, role: 'editor', capabilityMask: cap } },
		HTTP_STATUS.CREATED, { 'Set-Cookie': buildSessionCookie(token, maxAge) }
	);
}

async function handleMintPat(req: Request): Promise<Response> {
	const p = await resolvePrincipal(req);
	if (!p) return jsonErr('Authentication required.', HTTP_STATUS.UNAUTHORIZED);
	const db = await getStudioDb();
	const body = await readJsonBody<{ label?: string }>(req);
	const rawPat = `${STUDIO_CONFIG.tokenPrefix}${crypto.randomUUID().replace(/-/g, '')}`;
	await db.insert(mcpTokens).values({
		id: `pat-${Date.now().toString(36)}`, userId: p.userId,
		label: String(body.label ?? 'Studio Token').slice(0, STUDIO_CONFIG.maxTokenLabelLength),
		tokenHash: hashToken(rawPat), capabilityMask: p.capabilityMask, createdAt: Date.now()
	});
	return jsonOk({ token: rawPat, capabilityMask: p.capabilityMask }, HTTP_STATUS.CREATED);
}

export async function handleAuthRoutes(req: Request, path: string): Promise<Response | null> {
	if (path === '/api/auth/me' && req.method === 'GET') {
		const p = await resolvePrincipal(req);
		return jsonOk({ authenticated: Boolean(p), user: p, ipHash: extractClientIpHash(req) });
	}
	if (path === '/api/auth/logout' && req.method === 'POST') {
		return jsonOk({ ok: true }, HTTP_STATUS.OK, { 'Set-Cookie': buildSessionCookie('', 0) });
	}
	if (path === '/api/auth/login' && req.method === 'POST') return handleLogin(req);
	if (path === '/api/auth/register' && req.method === 'POST') return handleRegister(req);
	if (path === '/api/auth/tokens' && req.method === 'POST') return handleMintPat(req);
	return null;
}

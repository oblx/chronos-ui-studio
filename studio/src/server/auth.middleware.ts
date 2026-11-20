import { eq } from 'drizzle-orm';
import { STUDIO_CONFIG } from '../config';
import { hasCapability } from '../core';
import { getStudioDb, hashToken, mcpTokens, pseudonymizeIp, sessions, users } from '../lib';

export interface AuthPrincipal {
	readonly userId: string;
	readonly email: string;
	readonly displayName: string;
	readonly role: string;
	readonly capabilityMask: number;
	readonly ipHash: string;
}

function parseCookieToken(cookieHeader: string | null): string | null {
	if (!cookieHeader) return null;
	const parts = cookieHeader.split(';');
	for (const part of parts) {
		const [k, ...rest] = part.trim().split('=');
		if (k === STUDIO_CONFIG.sessionCookieName) return decodeURIComponent(rest.join('='));
	}
	return null;
}

export function extractClientIpHash(req: Request): string {
	const fwd = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
	return pseudonymizeIp(fwd);
}

export async function resolvePrincipal(req: Request): Promise<AuthPrincipal | null> {
	const ipHash = extractClientIpHash(req);
	const db = await getStudioDb();
	const authHeader = req.headers.get('authorization');
	if (authHeader?.startsWith('Bearer ')) {
		const rawToken = authHeader.slice(7).trim();
		const tokenHash = hashToken(rawToken);
		const patRows = await db.select().from(mcpTokens).where(eq(mcpTokens.tokenHash, tokenHash)).limit(1);
		if (patRows[0]) {
			const userRows = await db.select().from(users).where(eq(users.id, patRows[0].userId)).limit(1);
			const u = userRows[0];
			if (u) return { userId: u.id, email: u.email, displayName: u.displayName, role: u.role, capabilityMask: patRows[0].capabilityMask, ipHash };
		}
	}
	const cookieToken = parseCookieToken(req.headers.get('cookie'));
	if (!cookieToken) return null;
	const sessRows = await db.select().from(sessions).where(eq(sessions.tokenHash, hashToken(cookieToken))).limit(1);
	const sess = sessRows[0];
	if (!sess || sess.expiresAt < Date.now()) return null;
	const userRows = await db.select().from(users).where(eq(users.id, sess.userId)).limit(1);
	const u = userRows[0];
	return u ? { userId: u.id, email: u.email, displayName: u.displayName, role: u.role, capabilityMask: u.capabilityMask, ipHash } : null;
}

export function requireCapability(principal: AuthPrincipal | null, bit: number): Response | null {
	if (!principal) {
		return Response.json({ error: 'Authentication required.' }, { status: 401 });
	}
	if (!hasCapability(principal.capabilityMask, bit)) {
		return Response.json({ error: `Missing required capability bit ${bit}.` }, { status: 403 });
	}
	return null;
}

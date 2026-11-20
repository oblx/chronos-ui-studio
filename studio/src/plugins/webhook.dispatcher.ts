import { eq } from 'drizzle-orm';
import { STUDIO_CONFIG } from '../config';
import { validateWebhookUrl } from '../core';
import { bytesToHex, decryptSecret, getStudioDb, webhooks } from '../lib';

async function signPayload(secret: string, body: string): Promise<string> {
	const enc = new TextEncoder();
	const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
	const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(body)));
	return bytesToHex(sig);
}

export async function dispatchOutboundWebhooks(eventKind: string, payload: unknown): Promise<number> {
	const db = await getStudioDb();
	const rows = await db.select().from(webhooks).where(eq(webhooks.enabled, 1));
	let delivered = 0;
	const body = JSON.stringify({ event: eventKind, timestamp: Date.now(), payload });
	for (const hook of rows) {
		const events = JSON.parse(hook.eventsJson) as string[];
		if (!events.includes('*') && !events.includes(eventKind)) continue;
		const urlCheck = validateWebhookUrl(hook.url);
		if (!urlCheck.ok) continue;
		try {
			const secret = await decryptSecret(hook.secretCipher);
			const sig = await signPayload(secret, body);
			const res = await fetch(urlCheck.url.toString(), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'X-Chronos-Signature': `sha256=${sig}` },
				body,
				signal: AbortSignal.timeout(STUDIO_CONFIG.webhookTimeoutMs)
			});
			if (res.ok) delivered += 1;
		} catch {
			// Skip unreachable webhook endpoint safely
		}
	}
	return delivered;
}

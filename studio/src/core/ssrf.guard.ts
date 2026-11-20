function isPrivateIpv4(host: string): boolean {
	const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
	if (!m) return false;
	const a = Number(m[1]);
	const b = Number(m[2]);
	if (a === 10 || a === 127 || a === 0) return true;
	if (a === 169 && b === 254) return true;
	if (a === 172 && b >= 16 && b <= 31) return true;
	if (a === 192 && b === 168) return true;
	return false;
}

function isBlockedHostname(host: string): boolean {
	const h = host.toLowerCase();
	if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal')) return true;
	if (h === '::1' || h === '[::1]' || h.startsWith('[fc') || h.startsWith('[fd') || h.startsWith('[fe80')) {
		return true;
	}
	return isPrivateIpv4(h);
}

export function validateWebhookUrl(rawUrl: string): { ok: true; url: URL } | { ok: false; error: string } {
	let parsed: URL;
	try {
		parsed = new URL(rawUrl);
	} catch {
		return { ok: false, error: 'Malformed webhook URL.' };
	}
	if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
		return { ok: false, error: 'Webhook URL must use http or https.' };
	}
	if (isBlockedHostname(parsed.hostname)) {
		return { ok: false, error: 'Private, loopback, and link-local hosts are blocked by SSRF guard.' };
	}
	return { ok: true, url: parsed };
}

export function assertSafeWebhookUrl(rawUrl: string): URL {
	const res = validateWebhookUrl(rawUrl);
	if (!res.ok) throw new Error(res.error);
	return res.url;
}

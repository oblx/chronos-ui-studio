import { readIdbMirror, writeIdbMirror } from '@studio/lib/idb.mirror';

export async function apiRequest<T>(url: string, method = 'GET', body?: unknown): Promise<{ ok: boolean; status: number; data: T | null }> {
	const init: RequestInit = { method };
	if (body !== undefined) {
		init.headers = { 'Content-Type': 'application/json' };
		init.body = JSON.stringify(body);
	}
	const res = await fetch(url, init);
	let data: T | null = null;
	try { data = (await res.json()) as T; } catch { data = null; }
	return { ok: res.ok, status: res.status, data };
}

export async function apiJsonOrThrow<T>(url: string, init?: RequestInit): Promise<T> {
	const headers = { ...(init?.body ? { 'content-type': 'application/json' } : {}), ...(init?.headers ?? {}) };
	const res = await fetch(url, { ...init, headers });
	const data = (await res.json()) as T & { error?: string };
	if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
	return data;
}

export async function fetchWithIdbFallback<T>(url: string, mirrorKey: string, extract: (raw: Record<string, unknown>) => T): Promise<T | null> {
	try {
		const res = await apiRequest<Record<string, unknown>>(url);
		if (!res.ok || !res.data) throw new Error(`Fetch failed: ${url}`);
		const value = extract(res.data);
		void writeIdbMirror(mirrorKey, value);
		return value;
	} catch {
		return readIdbMirror<T>(mirrorKey);
	}
}

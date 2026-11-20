import type { ThemePack, WireTraceRecord } from '@chronos-ui/svelte';
import type { UiBlueprint } from '@studio/config';
import { apiRequest as requestJson, fetchWithIdbFallback as fetchWithIdbMirror } from './lifecycle/http.client';
import type { StudioUser } from './studio.types';

export async function apiFetchThemes(): Promise<(ThemePack & { starred?: boolean })[]> {
	return (await fetchWithIdbMirror('/api/themes', 'themes', (d) => d.themes as (ThemePack & { starred?: boolean })[])) ?? [];
}

export async function apiFetchBlueprints(): Promise<UiBlueprint[]> {
	return (await fetchWithIdbMirror('/api/blueprints', 'blueprints', (d) => d.blueprints as UiBlueprint[])) ?? [];
}

export async function apiSaveBlueprint(bp: UiBlueprint): Promise<UiBlueprint | null> {
	const r = await requestJson<{ blueprint: UiBlueprint }>('/api/blueprints', 'POST', bp);
	return r.ok ? r.data?.blueprint ?? null : null;
}

export async function apiCloneBlueprint(id: string): Promise<UiBlueprint | null> {
	const r = await requestJson<{ blueprint: UiBlueprint }>(`/api/blueprints/${encodeURIComponent(id)}/clone`, 'POST');
	return r.ok ? r.data?.blueprint ?? null : null;
}

export async function apiDeleteBlueprint(id: string): Promise<boolean> {
	return (await requestJson(`/api/blueprints/${encodeURIComponent(id)}`, 'DELETE')).ok;
}

export async function apiToggleThemeStar(id: string): Promise<boolean> {
	return (await requestJson(`/api/themes/${encodeURIComponent(id)}/star`, 'PATCH')).ok;
}

export async function apiCreateTheme(pack: ThemePack): Promise<ThemePack | null> {
	const r = await requestJson<{ theme: ThemePack }>('/api/themes', 'POST', pack);
	return r.ok ? r.data?.theme ?? null : null;
}

export async function apiFetchAuthMe(): Promise<StudioUser | null> {
	const r = await requestJson<{ authenticated: boolean; user: StudioUser | null }>('/api/auth/me');
	return r.ok && r.data?.authenticated ? r.data.user : null;
}

export async function apiLogin(email: string, password: string): Promise<{ user?: StudioUser; error?: string }> {
	return (await requestJson<{ user?: StudioUser; error?: string }>('/api/auth/login', 'POST', { email, password })).data ?? { error: 'Login failed' };
}

export async function apiRegister(email: string, password: string, displayName: string): Promise<{ user?: StudioUser; error?: string }> {
	return (await requestJson<{ user?: StudioUser; error?: string }>('/api/auth/register', 'POST', { email, password, displayName })).data ?? { error: 'Register failed' };
}

export async function apiLogout(): Promise<void> {
	await requestJson('/api/auth/logout', 'POST');
}

export async function apiMintPat(label: string): Promise<{ token?: string; error?: string }> {
	return (await requestJson<{ token?: string; error?: string }>('/api/auth/tokens', 'POST', { label })).data ?? { error: 'PAT mint failed' };
}

export async function apiFetchServerTraces(): Promise<{ traces?: WireTraceRecord[]; forbidden?: boolean }> {
	const r = await requestJson<{ traces: WireTraceRecord[] }>('/api/wire/traces');
	if (r.status === 401 || r.status === 403) return { forbidden: true };
	return r.ok && r.data ? r.data : {};
}

export async function apiPollCollab(payload: { sessionId: string; label: string; x: number; y: number }) {
	try {
		const r = await requestJson<{
			peers: { sessionId: string; label: string; x: number; y: number; scope: 'WORKSPACE' | 'FULL_APP' }[];
			commands: { kind: string; payload: Record<string, unknown> }[];
		}>('/api/ws/collab', 'POST', { ...payload, scope: 'WORKSPACE' });
		return r.ok ? r.data : null;
	} catch {
		return null;
	}
}

export async function apiBroadcastCollabEvent(sessionId: string, kind: string, payload: Record<string, unknown>): Promise<void> {
	try {
		await requestJson('/api/ws/collab', 'POST', { sessionId, label: 'Operator', scope: 'WORKSPACE', event: { kind, payload } });
	} catch { /* non-blocking realtime broadcast */ }
}

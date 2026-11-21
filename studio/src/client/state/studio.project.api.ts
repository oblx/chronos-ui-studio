import type { AssistantMessage, ServerAiCapabilityFlags, UiNodeTree, UiProjectDefinition } from '@chronos-ui/svelte';
import { readIdbMirror, writeIdbMirror } from '@studio/lib/idb.mirror';
import { apiJsonOrThrow as jsonReq } from './lifecycle/http.client';
import type { AiProfileSummary } from './studio.types';

export async function apiFetchEnvCapabilities(): Promise<ServerAiCapabilityFlags | undefined> {
	try {
		return await jsonReq<ServerAiCapabilityFlags>('/api/env/capabilities');
	} catch { return undefined; }
}

export async function apiFetchProjects(): Promise<UiProjectDefinition[]> {
	try {
		const data = await jsonReq<{ projects?: UiProjectDefinition[] }>('/api/projects');
		const list = data.projects ?? [];
		await writeIdbMirror('ui_projects', list);
		return list;
	} catch {
		return (await readIdbMirror<UiProjectDefinition[]>('ui_projects')) ?? [];
	}
}

export async function apiCreateProject(name: string): Promise<UiProjectDefinition | null> {
	const data = await jsonReq<{ project?: UiProjectDefinition }>('/api/projects', {
		method: 'POST', body: JSON.stringify({ name })
	});
	return data.project ?? null;
}

export async function apiCommitRevision(projectId: string, nodes: UiNodeTree, authorOrigin = 'USER'): Promise<UiProjectDefinition | null> {
	const data = await jsonReq<{ project?: UiProjectDefinition }>(`/api/projects/${encodeURIComponent(projectId)}/revisions`, {
		method: 'POST', body: JSON.stringify({ nodes, authorOrigin })
	});
	return data.project ?? null;
}

export async function apiFetchChat(projectId: string): Promise<AssistantMessage[]> {
	try {
		const data = await jsonReq<{ messages?: AssistantMessage[] }>(`/api/assistant/chat?projectId=${encodeURIComponent(projectId)}`);
		return data.messages ?? [];
	} catch { return []; }
}

export async function apiSendAssistantPrompt(projectId: string, prompt: string) {
	return jsonReq<{
		message?: AssistantMessage; project?: UiProjectDefinition;
		projects?: UiProjectDefinition[]; modelLabel?: string;
		clientIntents?: Array<{ kind: string; payload: Record<string, unknown> }>;
		error?: string;
	}>('/api/assistant/chat', { method: 'POST', body: JSON.stringify({ projectId, prompt }) });
}

export async function apiFetchAiProfiles(): Promise<AiProfileSummary[]> {
	try {
		const data = await jsonReq<{ profiles?: AiProfileSummary[] }>('/api/ai/profiles');
		return data.profiles ?? [];
	} catch { return []; }
}

export async function apiSaveAiProfile(payload: Record<string, unknown>): Promise<AiProfileSummary[]> {
	const data = await jsonReq<{ profiles?: AiProfileSummary[] }>('/api/ai/profiles', {
		method: 'POST', body: JSON.stringify(payload)
	});
	return data.profiles ?? [];
}

export async function apiRunPipelineExport(projectId: string, adapterId: string) {
	return jsonReq<{
		artifact?: { filename: string; content: string; mimeType: string };
		build?: { outDir: string; files: string[]; checksum: string };
		bundle?: { outDir: string; files: string[]; checksum: string; serverEntry: string; migrationCount: number };
		filename?: string; entries?: string[]; byteLength?: number; base64?: string; error?: string;
	}>('/api/pipelines/export', { method: 'POST', body: JSON.stringify({ projectId, adapterId }) });
}


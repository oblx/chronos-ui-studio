import type { AssistantToolChip, UiProjectDefinition } from '@chronos-ui/svelte';
import { asc, desc, eq } from 'drizzle-orm';
import {
	probeServerEnvironmentCapabilities, resolveAiStudioServerConfig, runAiProviderPlan,
	type AiProviderConfig, type AiProviderKind
} from '../../core';
import { aiChatMessages, aiProviderProfiles, decryptSecret, encryptSecret, getStudioDb, mapAiProfileRow, mapChatMessageRow } from '../../lib';
import { handleBuilderMcpRpc } from '../../mcp/mcp.builder';
import { pushServerTrace } from '../server.telemetry';
import { HTTP_STATUS, jsonErr, jsonOk, readJsonBody } from './http.helpers';
import { listAllProjects, loadProjectWithNodes } from './routes.projects';

function maskApiKey(key: string): string {
	const trimmed = key.trim();
	if (trimmed.length <= 8) return '****';
	return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

async function resolveActiveProfile(): Promise<{ readonly profile: AiProviderConfig; readonly badgeLabel: string }> {
	const db = await getStudioDb();
	const rows = await db.select().from(aiProviderProfiles).orderBy(desc(aiProviderProfiles.isDefault), desc(aiProviderProfiles.updatedAt)).limit(1);
	const row = rows[0];
	if (row && row.providerKind !== 'local') {
		const apiKey = row.vaultSecretCipher ? await decryptSecret(row.vaultSecretCipher) : undefined;
		return {
			profile: {
				id: row.id, label: row.label, providerKind: row.providerKind as AiProviderKind,
				baseUrl: row.baseUrl, modelId: row.modelId, apiKey,
				temperature: row.temperature / 100, maxTokens: row.maxTokens, persona: row.persona
			},
			badgeLabel: row.modelId
		};
	}
	const aiStudioCfg = resolveAiStudioServerConfig();
	if (aiStudioCfg) return { profile: aiStudioCfg, badgeLabel: 'AI STUDIO · GEMINI' };
	return {
		profile: { id: 'ai-local-default', label: 'Local Heuristic Engine', providerKind: 'local', baseUrl: '', modelId: 'LOCAL AGENT', temperature: 0.2, maxTokens: 2048, persona: 'architect' },
		badgeLabel: 'LOCAL AGENT'
	};
}

async function handleAssistantChat(req: Request): Promise<Response> {
	const body = await readJsonBody<{ projectId?: string; prompt?: string }>(req);
	const prompt = (body.prompt ?? '').trim();
	if (!prompt) return jsonErr('Prompt is required.', HTTP_STATUS.BAD_REQUEST);
	const db = await getStudioDb();
	const projects = await listAllProjects();
	let activeProjectId = body.projectId || projects[0]?.id || 'proj-genesis';
	const now = Date.now();
	await db.insert(aiChatMessages).values({ id: `msg-u-${now.toString(36)}`, projectId: activeProjectId, role: 'user', content: prompt, toolCallsJson: '[]', revisionId: null, createdAt: now });
	const { profile, badgeLabel } = await resolveActiveProfile();
	const plan = await runAiProviderPlan(profile, prompt);
	const toolCalls: AssistantToolChip[] = [];
	const clientIntents: Array<{ kind: string; payload: Record<string, unknown> }> = [];
	let latestRev: string | null = null;
	for (const act of plan.actions) {
		const rpc = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: now, method: 'tools/call', params: { name: act.tool, arguments: { projectId: activeProjectId, ...act.args } } });
		const structured = (rpc.result as { structured?: Record<string, unknown> } | undefined)?.structured;
		if (structured?.project && typeof (structured.project as UiProjectDefinition).id === 'string') {
			activeProjectId = (structured.project as UiProjectDefinition).id;
			latestRev = (structured.project as UiProjectDefinition).activeRevisionId;
		}
		if (Array.isArray(structured?.clientIntents)) for (const ci of structured.clientIntents) clientIntents.push(ci as { kind: string; payload: Record<string, unknown> });
		toolCalls.push({ tool: act.tool, summary: rpc.error ? rpc.error.message : String(structured?.summary ?? 'applied'), ok: !rpc.error });
	}
	const replyId = `msg-a-${(Date.now() + 1).toString(36)}`;
	await db.insert(aiChatMessages).values({ id: replyId, projectId: activeProjectId, role: 'assistant', content: plan.reply, toolCallsJson: JSON.stringify(toolCalls), revisionId: latestRev, createdAt: Date.now() });
	pushServerTrace('STUDIO_COMMAND_EXEC', `Assistant executed ${toolCalls.length} MCP action(s)`, 1.2, true, 'ASSISTANT_CHAT');
	const project = await loadProjectWithNodes(activeProjectId);
	return jsonOk({ message: { id: replyId, role: 'assistant', content: plan.reply, toolCalls, revisionId: latestRev ?? undefined, createdAt: Date.now() }, project, projects: await listAllProjects(), modelLabel: badgeLabel, clientIntents });
}

async function handleSaveProfile(req: Request): Promise<Response> {
	const body = await readJsonBody<{
		id?: string; label?: string; providerKind?: AiProviderKind; baseUrl?: string;
		modelId?: string; apiKey?: string; temperature?: number; maxTokens?: number; persona?: string; isDefault?: boolean;
	}>(req);
	const db = await getStudioDb();
	const id = body.id?.trim() || `ai-${Date.now().toString(36)}`;
	const cipher = body.apiKey?.trim() ? await encryptSecret(body.apiKey.trim()) : null;
	const mask = body.apiKey?.trim() ? maskApiKey(body.apiKey) : null;
	if (body.isDefault) await db.update(aiProviderProfiles).set({ isDefault: 0 });
	const now = Date.now();
	const existing = await db.select().from(aiProviderProfiles).where(eq(aiProviderProfiles.id, id)).limit(1);
	if (existing[0]) {
		await db.update(aiProviderProfiles).set({
			label: body.label ?? existing[0].label, providerKind: body.providerKind ?? existing[0].providerKind,
			baseUrl: body.baseUrl ?? existing[0].baseUrl, modelId: body.modelId ?? existing[0].modelId,
			vaultSecretCipher: cipher ?? existing[0].vaultSecretCipher, secretMask: mask ?? existing[0].secretMask,
			temperature: Math.round((body.temperature ?? existing[0].temperature / 100) * 100),
			maxTokens: body.maxTokens ?? existing[0].maxTokens, persona: body.persona ?? existing[0].persona,
			isDefault: body.isDefault ? 1 : existing[0].isDefault, updatedAt: now
		}).where(eq(aiProviderProfiles.id, id));
	} else {
		await db.insert(aiProviderProfiles).values({
			id, label: body.label || 'Custom Provider', providerKind: body.providerKind || 'openai',
			baseUrl: body.baseUrl || '', modelId: body.modelId || 'gpt-4o-mini',
			vaultSecretCipher: cipher, secretMask: mask ?? '',
			temperature: Math.round((body.temperature ?? 0.3) * 100), maxTokens: body.maxTokens ?? 2048,
			persona: body.persona ?? 'architect', isDefault: body.isDefault ? 1 : 0, updatedAt: now
		});
	}
	const rows = await db.select().from(aiProviderProfiles).orderBy(desc(aiProviderProfiles.isDefault), desc(aiProviderProfiles.updatedAt));
	return jsonOk({ profiles: rows.map(mapAiProfileRow) });
}

export async function handleAiRoutes(req: Request, path: string): Promise<Response | null> {
	if (path === '/api/env/capabilities' && req.method === 'GET') return jsonOk(probeServerEnvironmentCapabilities());
	if (path === '/api/ai/profiles' && req.method === 'GET') {
		const db = await getStudioDb();
		const rows = await db.select().from(aiProviderProfiles).orderBy(desc(aiProviderProfiles.isDefault), desc(aiProviderProfiles.updatedAt));
		return jsonOk({ profiles: rows.map(mapAiProfileRow) });
	}
	if (path === '/api/ai/profiles' && req.method === 'POST') return handleSaveProfile(req);
	if (path === '/api/assistant/chat' && req.method === 'GET') {
		const projectId = new URL(req.url).searchParams.get('projectId') ?? 'proj-genesis';
		const db = await getStudioDb();
		const rows = await db.select().from(aiChatMessages).where(eq(aiChatMessages.projectId, projectId)).orderBy(asc(aiChatMessages.createdAt)).limit(60);
		return jsonOk({ messages: rows.map(mapChatMessageRow) });
	}
	if (path === '/api/assistant/chat' && req.method === 'POST') return handleAssistantChat(req);
	return null;
}

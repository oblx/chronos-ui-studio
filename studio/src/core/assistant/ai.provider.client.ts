import { planLocalAssistantPrompt, type AssistantPlan } from './local.assistant';
import { assertSafeWebhookUrl } from '../ssrf.guard';

export type AiProviderKind = 'local' | 'openai' | 'anthropic' | 'gemini' | 'google_ai_studio' | 'ollama';

export interface AiProviderConfig {
	readonly id: string;
	readonly label: string;
	readonly providerKind: AiProviderKind;
	readonly baseUrl: string;
	readonly modelId: string;
	readonly apiKey?: string;
	readonly temperature: number;
	readonly maxTokens: number;
	readonly persona: string;
}

const SYSTEM_INSTRUCTION = 'Return strict JSON {"reply": string, "actions": [{"tool": "ui_spawn_node"|"ui_apply_theme"|"ui_commit_node", "args": {}}]} for @chronos-ui/svelte.';

function assertProviderUrl(kind: AiProviderKind, url: string): void {
	if (kind === 'local') return;
	if (kind === 'ollama') {
		const parsed = new URL(url);
		const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
		if (isLocal && (parsed.protocol === 'http:' || parsed.protocol === 'https:')) return;
	}
	assertSafeWebhookUrl(url);
}

function parseRemotePlan(text: string, fallbackPrompt: string): AssistantPlan {
	try {
		const match = text.match(/\{[\s\S]*\}/);
		if (!match) return planLocalAssistantPrompt(fallbackPrompt);
		const parsed = JSON.parse(match[0]) as Partial<AssistantPlan>;
		if (typeof parsed.reply === 'string' && Array.isArray(parsed.actions)) {
			return { reply: parsed.reply, actions: parsed.actions };
		}
	} catch { /* fall through to deterministic local planner */ }
	return planLocalAssistantPrompt(fallbackPrompt);
}

async function callRemoteEndpoint(cfg: AiProviderConfig, prompt: string): Promise<string> {
	const headers: Record<string, string> = { 'content-type': 'application/json' };
	if (cfg.providerKind === 'anthropic') {
		if (cfg.apiKey) headers['x-api-key'] = cfg.apiKey;
		headers['anthropic-version'] = '2023-06-01';
		const res = await fetch(`${cfg.baseUrl.replace(/\/$/, '')}/v1/messages`, {
			method: 'POST', headers, signal: AbortSignal.timeout(12000),
			body: JSON.stringify({ model: cfg.modelId, max_tokens: cfg.maxTokens, system: SYSTEM_INSTRUCTION, messages: [{ role: 'user', content: prompt }] })
		});
		const data = (await res.json()) as { content?: { text?: string }[] };
		return data.content?.[0]?.text ?? '';
	}
	if (cfg.providerKind === 'gemini' || cfg.providerKind === 'google_ai_studio') {
		const url = `${cfg.baseUrl.replace(/\/$/, '')}/v1beta/models/${encodeURIComponent(cfg.modelId)}:generateContent${cfg.apiKey ? `?key=${encodeURIComponent(cfg.apiKey)}` : ''}`;
		const res = await fetch(url, {
			method: 'POST', headers, signal: AbortSignal.timeout(12000),
			body: JSON.stringify({ contents: [{ parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nUser: ${prompt}` }] }] })
		});
		const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
		return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
	}
	if (cfg.apiKey) headers.authorization = `Bearer ${cfg.apiKey}`;
	const endpoint = cfg.providerKind === 'ollama' ? `${cfg.baseUrl.replace(/\/$/, '')}/api/chat` : `${cfg.baseUrl.replace(/\/$/, '')}/v1/chat/completions`;
	const res = await fetch(endpoint, {
		method: 'POST', headers, signal: AbortSignal.timeout(12000),
		body: JSON.stringify({
			model: cfg.modelId, temperature: cfg.temperature, max_tokens: cfg.maxTokens, stream: false,
			messages: [{ role: 'system', content: SYSTEM_INSTRUCTION }, { role: 'user', content: prompt }]
		})
	});
	const data = (await res.json()) as { choices?: { message?: { content?: string } }[]; message?: { content?: string } };
	return data.choices?.[0]?.message?.content ?? data.message?.content ?? '';
}

export async function runAiProviderPlan(cfg: AiProviderConfig, prompt: string): Promise<AssistantPlan> {
	if (cfg.providerKind === 'local' || !cfg.baseUrl) return planLocalAssistantPrompt(prompt);
	assertProviderUrl(cfg.providerKind, cfg.baseUrl);
	try {
		const raw = await callRemoteEndpoint(cfg, prompt);
		return parseRemotePlan(raw, prompt);
	} catch {
		return planLocalAssistantPrompt(prompt);
	}
}

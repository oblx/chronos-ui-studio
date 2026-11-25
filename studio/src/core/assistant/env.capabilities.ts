import type { ServerAiCapabilityFlags } from '@chronos-ui/svelte';
import type { AiProviderConfig } from './ai.provider.client';

const AI_STUDIO_BASE_URL = 'https://generativelanguage.googleapis.com';
const AI_STUDIO_DEFAULT_MODEL = 'gemini-2.5-flash';

function readProvisionedGeminiKey(env: Record<string, string | undefined>): string | null {
	const key = env.GEMINI_API_KEY ?? env.GOOGLE_AI_STUDIO_KEY ?? env.GOOGLE_API_KEY ?? '';
	const trimmed = key.trim();
	return trimmed.length > 0 ? trimmed : null;
}

export function probeServerEnvironmentCapabilities(
	env: Record<string, string | undefined> = process.env
): ServerAiCapabilityFlags {
	const available = readProvisionedGeminiKey(env) !== null;
	return {
		aiStudioGeminiAvailable: available,
		source: available ? 'AI_STUDIO_ENV' : 'NONE',
		defaultModel: AI_STUDIO_DEFAULT_MODEL,
		runtime: 'bun'
	};
}

export function resolveAiStudioServerConfig(
	env: Record<string, string | undefined> = process.env
): AiProviderConfig | null {
	const apiKey = readProvisionedGeminiKey(env);
	if (!apiKey) return null;
	return {
		id: 'ai-studio-gemini-env',
		label: 'Google AI Studio (Gemini)',
		providerKind: 'gemini',
		baseUrl: AI_STUDIO_BASE_URL,
		modelId: env.GEMINI_MODEL?.trim() || AI_STUDIO_DEFAULT_MODEL,
		apiKey,
		temperature: 0.25,
		maxTokens: 2048,
		persona: 'architect'
	};
}

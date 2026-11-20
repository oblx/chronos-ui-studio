import { HUD_METRICS } from '../tokens';

export type ResolvedAiAdapterKind = 'USER_CUSTOM_PROFILE' | 'GOOGLE_AI_STUDIO' | 'BROWSER_WINDOW_AI' | 'LOCAL_HEURISTIC';

export interface ServerAiCapabilityFlags { readonly aiStudioGeminiAvailable: boolean; readonly source: 'AI_STUDIO_ENV' | 'NONE'; readonly defaultModel: string; readonly runtime: string; }

export interface EnvironmentCapabilityReport {
	readonly host: 'AI_STUDIO' | 'BROWSER' | 'HEADLESS';
	readonly aiStudioGemini: { readonly available: boolean; readonly clientBridge: boolean; readonly serverKeyProvisioned: boolean; readonly source: 'AI_STUDIO_ENV' | 'CLIENT_BRIDGE' | 'NONE'; };
	readonly browserWindowAi: { readonly available: boolean; readonly provider: 'HARBOR_OR_CHROME_AI' | 'NONE'; readonly readiness: 'readily' | 'after-download' | 'no' | 'unavailable'; };
	readonly hardware: { readonly webGpu: boolean; readonly webNn: boolean; readonly voiceInput: boolean; readonly gamepadApi: boolean; readonly broadcastChannel: boolean; readonly indexedDb: boolean; readonly prefersReducedMotion: boolean; };
	readonly resolvedAdapter: ResolvedAiAdapterKind;
	readonly badgeLabel: string;
}

interface WindowAiLike {
	readonly languageModel?: {
		readonly capabilities?: () => Promise<{ readonly available?: string }>;
		readonly create?: (opts?: { readonly systemPrompt?: string }) => Promise<{ readonly prompt: (input: string) => Promise<string>; readonly destroy?: () => void }>;
	};
	readonly assistant?: { readonly capabilities?: () => Promise<{ readonly available?: string }> };
}

export interface AiProviderProbeContext { readonly serverFlags?: ServerAiCapabilityFlags; readonly hasUserDefaultProfile: boolean; readonly globalObj: Record<string, unknown>; }
export interface AiProviderProbeStep { readonly id: ResolvedAiAdapterKind; readonly badgeLabel: string; readonly probe: (ctx: AiProviderProbeContext) => Promise<boolean>; }

let cachedProbe: { readonly report: EnvironmentCapabilityReport; readonly at: number } | null = null;
export function resetEnvProbeCache(): void { cachedProbe = null; }

function hasAiStudioBridge(globalObj: Record<string, unknown>): boolean {
	if (typeof globalObj.aistudio === 'object' && globalObj.aistudio !== null) return true;
	const bridge = (globalObj.__AI_STUDIO_CAPABILITY__ ?? (globalObj.navigator as Record<string, unknown> | undefined)?.aistudio) as unknown;
	if (typeof bridge === 'object' && bridge !== null) return true;
	return ((globalObj.location as { readonly hostname?: string } | undefined)?.hostname ?? '') === 'aistudio.google.com';
}

async function detectWindowAiReadiness(globalObj: Record<string, unknown>): Promise<'readily' | 'after-download' | 'no' | 'unavailable'> {
	const ai = globalObj.ai as WindowAiLike | undefined;
	if (!ai) return 'unavailable';
	try {
		const lm = ai.languageModel ?? ai.assistant;
		if (!lm?.capabilities) return 'readily';
		const status = (await lm.capabilities())?.available;
		if (status === 'readily' || status === 'available') return 'readily';
		if (status === 'after-download' || status === 'downloadable') return 'after-download';
		return 'no';
	} catch { return 'unavailable'; }
}

const ORDERED_AI_PROBES: readonly AiProviderProbeStep[] = [
	{ id: 'USER_CUSTOM_PROFILE', badgeLabel: 'CUSTOM PROFILE', probe: async (c) => c.hasUserDefaultProfile },
	{ id: 'GOOGLE_AI_STUDIO', badgeLabel: 'AI STUDIO · GEMINI', probe: async (c) => Boolean(c.serverFlags?.aiStudioGeminiAvailable) || hasAiStudioBridge(c.globalObj) },
	{ id: 'BROWSER_WINDOW_AI', badgeLabel: 'HARBOR · WINDOW.AI', probe: async (c) => (await detectWindowAiReadiness(c.globalObj)) === 'readily' },
	{ id: 'LOCAL_HEURISTIC', badgeLabel: 'LOCAL AGENT', probe: async () => true }
];

export function resolveDefaultAiAdapter(opts: { readonly hasUserDefaultProfile: boolean; readonly aiStudioAvailable: boolean; readonly browserWindowAiAvailable: boolean; }): { readonly adapter: ResolvedAiAdapterKind; readonly badgeLabel: string } {
	if (opts.hasUserDefaultProfile) return { adapter: 'USER_CUSTOM_PROFILE', badgeLabel: 'CUSTOM PROFILE' };
	if (opts.aiStudioAvailable) return { adapter: 'GOOGLE_AI_STUDIO', badgeLabel: 'AI STUDIO · GEMINI' };
	if (opts.browserWindowAiAvailable) return { adapter: 'BROWSER_WINDOW_AI', badgeLabel: 'HARBOR · WINDOW.AI' };
	return { adapter: 'LOCAL_HEURISTIC', badgeLabel: 'LOCAL AGENT' };
}

function readHardwareFlags(globalObj: Record<string, unknown>): EnvironmentCapabilityReport['hardware'] {
	const nav = globalObj.navigator as Record<string, unknown> | undefined;
	const matchMedia = globalObj.matchMedia as ((q: string) => { matches: boolean }) | undefined;
	return {
		webGpu: Boolean(nav && 'gpu' in nav),
		webNn: Boolean(nav && 'ml' in nav),
		voiceInput: Boolean(globalObj.SpeechRecognition || globalObj.webkitSpeechRecognition),
		gamepadApi: typeof nav?.getGamepads === 'function',
		broadcastChannel: typeof globalObj.BroadcastChannel === 'function',
		indexedDb: typeof globalObj.indexedDB !== 'undefined',
		prefersReducedMotion: Boolean(matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
	};
}

export async function probeEnvironmentCapabilities(
	serverFlags?: ServerAiCapabilityFlags,
	hasUserDefaultProfile = false,
	globalObj: Record<string, unknown> = globalThis as unknown as Record<string, unknown>,
	forceRefresh = false
): Promise<EnvironmentCapabilityReport> {
	const useCache = !forceRefresh && globalObj === (globalThis as unknown as Record<string, unknown>) && cachedProbe && (Date.now() - cachedProbe.at < HUD_METRICS.probeCacheTtlMs);
	if (useCache && cachedProbe) return cachedProbe.report;
	const ctx: AiProviderProbeContext = { serverFlags, hasUserDefaultProfile, globalObj };
	let resolved: { adapter: ResolvedAiAdapterKind; badgeLabel: string } = { adapter: 'LOCAL_HEURISTIC', badgeLabel: 'LOCAL AGENT' };
	for (const step of ORDERED_AI_PROBES) {
		if (await step.probe(ctx)) { resolved = { adapter: step.id, badgeLabel: step.badgeLabel }; break; }
	}
	const clientBridge = hasAiStudioBridge(globalObj);
	const serverKeyProvisioned = Boolean(serverFlags?.aiStudioGeminiAvailable);
	const aiStudioAvailable = clientBridge || serverKeyProvisioned;
	const readiness = await detectWindowAiReadiness(globalObj);
	const report: EnvironmentCapabilityReport = {
		host: aiStudioAvailable ? 'AI_STUDIO' : typeof globalObj.window !== 'undefined' ? 'BROWSER' : 'HEADLESS',
		aiStudioGemini: { available: aiStudioAvailable, clientBridge, serverKeyProvisioned, source: serverKeyProvisioned ? 'AI_STUDIO_ENV' : clientBridge ? 'CLIENT_BRIDGE' : 'NONE' },
		browserWindowAi: { available: readiness === 'readily', provider: readiness === 'readily' ? 'HARBOR_OR_CHROME_AI' : 'NONE', readiness },
		hardware: readHardwareFlags(globalObj),
		resolvedAdapter: resolved.adapter,
		badgeLabel: resolved.badgeLabel
	};
	if (globalObj === (globalThis as unknown as Record<string, unknown>)) cachedProbe = { report, at: Date.now() };
	return report;
}

export async function runBrowserWindowAiPrompt(prompt: string, systemPrompt: string, globalObj: Record<string, unknown> = globalThis as unknown as Record<string, unknown>): Promise<string | null> {
	const ai = globalObj.ai as WindowAiLike | undefined;
	if (!ai?.languageModel?.create) return null;
	try {
		const session = await ai.languageModel.create({ systemPrompt });
		const text = await session.prompt(prompt);
		session.destroy?.();
		return text;
	} catch { return null; }
}

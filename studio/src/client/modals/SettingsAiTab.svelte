<script lang="ts">
	import {
		UiBadge, UiChamferButton, UiChamferFrame, UiInput, UiSelect, UiSlider,
		type CornerKind, type EnvironmentCapabilityReport
	} from '@chronos-ui/svelte';
	import type { AiProviderKind } from '../../core';
	import type { AiProfileSummary } from '../state';

	interface Props {
		cornerMode: CornerKind;
		profiles: readonly AiProfileSummary[];
		envCapabilities: EnvironmentCapabilityReport | null;
		activeAdapterBadge?: string;
		onSaveProfile: (payload: Record<string, unknown>) => Promise<void>;
	}

	let { cornerMode, profiles, envCapabilities, activeAdapterBadge, onSaveProfile }: Props = $props();

	const PRESETS: Record<AiProviderKind, { short: string; label: string; baseUrl: string; modelId: string }> = {
		local: { short: 'Local Heuristic', label: 'Local Heuristic Engine', baseUrl: '', modelId: 'LOCAL AGENT' },
		google_ai_studio: { short: 'Google AI Studio', label: 'Google AI Studio (Auto-Bridge)', baseUrl: 'https://generativelanguage.googleapis.com', modelId: 'gemini-2.5-flash' },
		gemini: { short: 'Gemini REST', label: 'Google Gemini REST API', baseUrl: 'https://generativelanguage.googleapis.com', modelId: 'gemini-2.5-flash' },
		openai: { short: 'OpenAI API', label: 'OpenAI-Compatible API', baseUrl: 'https://api.openai.com', modelId: 'gpt-4o-mini' },
		anthropic: { short: 'Anthropic API', label: 'Anthropic-Compatible API', baseUrl: 'https://api.anthropic.com', modelId: 'claude-3-7-sonnet-latest' },
		ollama: { short: 'Local Ollama', label: 'Local Ollama / vLLM', baseUrl: 'http://127.0.0.1:11434', modelId: 'qwen2.5-coder:7b' }
	};
	const PERSONA_OPTIONS = [{ value: 'architect', label: 'Architect' }, { value: 'minimalist', label: 'Minimalist' }, { value: 'spatial', label: 'Spatial HMI' }];

	let active = $derived(profiles.find((p) => p.isDefault) ?? profiles[0]);
	let effectiveRuntimeKind = $derived<AiProviderKind>(active && active.providerKind !== 'local' ? active.providerKind : (envCapabilities?.aiStudioGemini.available ? 'google_ai_studio' : 'local'));
	let effectiveRuntimeLabel = $derived(PRESETS[effectiveRuntimeKind].label);
	let effectiveRuntimeModel = $derived(active && active.providerKind !== 'local' ? active.modelId : (activeAdapterBadge ?? envCapabilities?.badgeLabel ?? PRESETS[effectiveRuntimeKind].modelId));

	let providerKind = $state<AiProviderKind>('local');
	let baseUrl = $state('');
	let modelId = $state('LOCAL AGENT');
	let apiKey = $state('');
	let temperature = $state(0.2);
	let maxTokens = $state(2048);
	let persona = $state('architect');
	let saving = $state(false);
	let userEdited = $state(false);
	let isDraftDirty = $derived(providerKind !== effectiveRuntimeKind || modelId !== (active && active.providerKind !== 'local' ? active.modelId : PRESETS[effectiveRuntimeKind].modelId) || apiKey.trim().length > 0);

	$effect(() => {
		if (userEdited) return;
		providerKind = effectiveRuntimeKind;
		baseUrl = active && active.providerKind === effectiveRuntimeKind ? active.baseUrl : PRESETS[effectiveRuntimeKind].baseUrl;
		modelId = active && active.providerKind === effectiveRuntimeKind ? active.modelId : PRESETS[effectiveRuntimeKind].modelId;
	});

	function applyPreset(kind: AiProviderKind): void {
		userEdited = true; providerKind = kind; baseUrl = PRESETS[kind].baseUrl; modelId = PRESETS[kind].modelId;
	}

	async function save(): Promise<void> {
		saving = true;
		try {
			await onSaveProfile({ id: providerKind === 'local' ? 'ai-local-default' : `ai-${providerKind}`, label: PRESETS[providerKind].label, providerKind, baseUrl, modelId, apiKey: apiKey.trim() || undefined, temperature, maxTokens, persona, isDefault: true });
			apiKey = ''; userEdited = false;
		} finally { saving = false; }
	}
</script>

<div class="grid grid-cols-1 gap-3 text-xs md:grid-cols-2" data-testid="settings-ai-tab">
	<div class="flex flex-col gap-2">
		<span class="font-semibold" style="color: var(--ui-muted-content);">Provider Adapter (6 Zero-Lock Adapters)</span>
		<div class="grid grid-cols-2 gap-1.5 sm:grid-cols-3" data-testid="ai-provider-tiles">
			{#each Object.entries(PRESETS) as [kind, meta] (kind)}
				<UiChamferButton {cornerMode} label={meta.short} active={providerKind === kind} variant={providerKind === kind ? 'primary' : 'surface'} onclick={() => applyPreset(kind as AiProviderKind)} className="py-1 text-[0.7rem]" />
			{/each}
		</div>
		<UiChamferFrame {cornerMode} carets={false} cutPx={8} cutRem={0.5} surfaceVar="var(--ui-base-100)" className="flex flex-col gap-1 p-2.5">
			<div class="flex items-center justify-between gap-2" data-testid="ai-active-runtime-status">
				<span class="ui-font-mono text-[0.68rem] font-semibold" style="color: var(--ui-accent-vivid, var(--ui-primary));">
					ACTIVE RUNTIME · {effectiveRuntimeLabel}
				</span>
				<UiBadge text={effectiveRuntimeModel} tone="primary" {cornerMode} />
			</div>
			{#if active?.secretMask}
				<span class="ui-font-mono text-[0.64rem]" style="color: var(--ui-muted-content);">AEAD Vault Key: {active.secretMask}</span>
			{/if}
			{#if envCapabilities}
				<div data-testid="env-capabilities-matrix" class="ui-font-mono grid grid-cols-2 gap-1 border-t pt-1 text-[0.64rem]" style="border-color: var(--ui-border-subtle); color: var(--ui-muted-content);">
					<span>AI Studio Gemini: {envCapabilities.aiStudioGemini.available ? 'READY' : 'OFF'}</span>
					<span>Harbor window.ai: {envCapabilities.browserWindowAi.available ? 'READY' : 'OFF'}</span>
					<span>WebGPU: {envCapabilities.hardware.webGpu ? 'YES' : 'NO'} · WebNN: {envCapabilities.hardware.webNn ? 'YES' : 'NO'}</span>
					<span>Voice: {envCapabilities.hardware.voiceInput ? 'YES' : 'NO'} · Gamepad: {envCapabilities.hardware.gamepadApi ? 'YES' : 'NO'}</span>
				</div>
			{/if}
		</UiChamferFrame>
	</div>

	<div class="flex flex-col gap-2">
		<div class="flex items-center justify-between">
			<span class="font-semibold" style="color: var(--ui-muted-content);">Selected Profile Editor</span>
			{#if isDraftDirty}
				<UiBadge text="Unsaved Draft" tone="warning" {cornerMode} />
			{:else}
				<UiBadge text="Synced" tone="success" {cornerMode} />
			{/if}
		</div>
		<div class="grid grid-cols-2 gap-2">
			<div class="flex flex-col gap-0.5">
				<span style="color: var(--ui-muted-content);">Base URL</span>
				<UiInput {cornerMode} bind:value={baseUrl} placeholder="Zero-config local" label="Base URL" className="ui-font-mono" />
			</div>
			<div class="flex flex-col gap-0.5">
				<span style="color: var(--ui-muted-content);">Model ID</span>
				<UiInput {cornerMode} bind:value={modelId} label="Model ID" className="ui-font-mono" />
			</div>
		</div>
		<div class="flex flex-col gap-0.5">
			<span style="color: var(--ui-muted-content);">API Bearer (Write-Only AEAD AES-256-GCM Vault)</span>
			<UiInput {cornerMode} type="password" bind:value={apiKey} placeholder="Optional for Auto-Bridge / Local" label="API Bearer" className="ui-font-mono" />
		</div>
		<div class="grid grid-cols-3 gap-2">
			<UiSlider bind:value={temperature} min={0} max={1} step={0.1} label="Temp" valueLabel={temperature.toFixed(1)} />
			<div class="flex flex-col gap-0.5">
				<span style="color: var(--ui-muted-content);">Max Tokens</span>
				<UiInput {cornerMode} value={String(maxTokens)} label="Max Tokens" className="ui-font-mono" oninput={(v) => { maxTokens = Math.max(256, Number(v) || 2048); }} />
			</div>
			<div class="flex flex-col gap-0.5">
				<span style="color: var(--ui-muted-content);">Persona</span>
				<UiSelect {cornerMode} bind:value={persona} options={PERSONA_OPTIONS} label="Persona" />
			</div>
		</div>
		<div class="flex justify-end pt-1">
			<UiChamferButton {cornerMode} label={saving ? 'Encrypting...' : 'Save Active Profile'} variant="secondary" disabled={saving} onclick={() => void save()} />
		</div>
	</div>
</div>

<script lang="ts">
	import {
		UiChamferButton, UiHorizontalDeck, UiModalFooter, UiModalShell, uiSwipeDeck,
		type AccessibilityPrefs, type CornerKind, type EnvironmentCapabilityReport,
		type GamepadProfileId, type MotionConfig, type StudioDefaultsConfig, type ThemePack, type VoiceCaptureMode
	} from '@chronos-ui/svelte';
	import type { AiProfileSummary } from '../state';
	import { SettingsVisualsTab } from './settings';
	import SettingsAiTab from './SettingsAiTab.svelte';
	import SettingsRuntimeTab from './SettingsRuntimeTab.svelte';

	interface Props {
		open: boolean;
		prefs: AccessibilityPrefs;
		motionConfig: MotionConfig;
		studioDefaults: StudioDefaultsConfig;
		envCapabilities: EnvironmentCapabilityReport | null;
		activeAdapterBadge: string;
		themes: readonly ThemePack[];
		activeThemeId: string;
		aiProfiles: readonly AiProfileSummary[];
		projectNodeCount: number;
		traceCount: number;
		lowMemoryMode: boolean;
		cornerMorphEnabled: boolean;
		voiceMode: VoiceCaptureMode;
		gamepadOverride: GamepadProfileId | null;
		onUpdate: (patch: Partial<AccessibilityPrefs>) => void;
		onSetCornerStyle: (cornerMode: CornerKind) => void;
		onSetCornerRadius: (cornerRadiusRem: number) => void;
		onSetStudioDefaults: (patch: Partial<StudioDefaultsConfig>) => void;
		onResetStudioDefaults: () => void;
		onSetMotionConfig: (patch: Partial<MotionConfig>) => void;
		onSetMotionProfile?: (patch: Record<string, unknown>) => void;
		onToggleCornerMorph: (enabled: boolean) => void;
		onSelectTheme: (themeId: string) => void;
		onSaveAiProfile: (payload: Record<string, unknown>) => Promise<void>;
		onToggleLowMemory: (next: boolean) => void;
		onSetVoiceMode: (mode: VoiceCaptureMode) => void;
		onSetGamepadOverride: (id: GamepadProfileId | null) => void;
		onOpenCursors?: () => void;
		onClose: () => void;
	}

	let {
		open, prefs, motionConfig, studioDefaults, envCapabilities, activeAdapterBadge, themes, activeThemeId, aiProfiles,
		projectNodeCount, traceCount, lowMemoryMode, cornerMorphEnabled, voiceMode, gamepadOverride,
		onUpdate, onSetCornerStyle, onSetCornerRadius, onSetStudioDefaults, onResetStudioDefaults, onSetMotionConfig, onSetMotionProfile, onToggleCornerMorph,
		onSelectTheme, onSaveAiProfile, onToggleLowMemory, onSetVoiceMode, onSetGamepadOverride, onOpenCursors, onClose
	}: Props = $props();

	let activeTab = $state<'ai' | 'visuals' | 'input' | 'runtime'>('ai');
	const TABS = [
		{ id: 'ai', label: 'AI & Models' },
		{ id: 'visuals', label: 'Visuals & Motion' },
		{ id: 'input', label: 'Input & Modality' },
		{ id: 'runtime', label: 'Runtime & Memory' }
	] as const;

	function stepTab(delta: -1 | 1): void {
		const idx = TABS.findIndex((t) => t.id === activeTab);
		const next = TABS[(idx + delta + TABS.length) % TABS.length];
		if (next) activeTab = next.id;
	}
</script>

<UiModalShell {open} sizeTier="WIDE" title="Settings" subtitle="AI providers, tri-mode corners, Svelte 5 motion presets, and runtime budgets" icon="settings" cornerMode={prefs.cornerMode} {onClose}>
	<div class="flex flex-col gap-3" use:uiSwipeDeck={{ onStep: stepTab }}>
		<UiHorizontalDeck cornerMode={prefs.cornerMode}>
			{#each TABS as tab (tab.id)}
				<UiChamferButton cornerMode={prefs.cornerMode} label={tab.label} active={activeTab === tab.id} variant={activeTab === tab.id ? 'primary' : 'surface'} onclick={() => { activeTab = tab.id; }} />
			{/each}
		</UiHorizontalDeck>

		{#if activeTab === 'ai'}
			<SettingsAiTab cornerMode={prefs.cornerMode} profiles={aiProfiles} {envCapabilities} {activeAdapterBadge} onSaveProfile={onSaveAiProfile} />
		{:else if activeTab === 'visuals'}
			<SettingsVisualsTab {prefs} {motionConfig} {studioDefaults} {themes} {activeThemeId} {cornerMorphEnabled} {onUpdate} {onSetCornerStyle} {onSetCornerRadius} {onSetStudioDefaults} {onResetStudioDefaults} {onSetMotionConfig} {onSetMotionProfile} {onToggleCornerMorph} {onSelectTheme} {onOpenCursors} />
		{:else if activeTab === 'input'}
			<div class="grid grid-cols-1 gap-3 text-xs md:grid-cols-2" data-testid="settings-input-tab">
				<div class="flex flex-col gap-2">
					<span class="font-semibold" style="color: var(--ui-muted-content);">Voice Recognition Mode</span>
					<div class="grid grid-cols-2 gap-1.5">
						<UiChamferButton cornerMode={prefs.cornerMode} icon="mic" label="Push-to-Talk" active={voiceMode === 'PUSH_TO_TALK'} variant={voiceMode === 'PUSH_TO_TALK' ? 'primary' : 'surface'} onclick={() => onSetVoiceMode('PUSH_TO_TALK')} />
						<UiChamferButton cornerMode={prefs.cornerMode} icon="mic" label="Hands-Free" active={voiceMode === 'HANDS_FREE'} variant={voiceMode === 'HANDS_FREE' ? 'primary' : 'surface'} onclick={() => onSetVoiceMode('HANDS_FREE')} />
					</div>
				</div>
				<div class="flex flex-col gap-2">
					<span class="font-semibold" style="color: var(--ui-muted-content);">Gamepad Profile (Xbox / PS5 DualSense)</span>
					<div class="grid grid-cols-3 gap-1.5">
						<UiChamferButton cornerMode={prefs.cornerMode} label="Auto-Detect" active={gamepadOverride === null} variant={gamepadOverride === null ? 'primary' : 'surface'} onclick={() => onSetGamepadOverride(null)} />
						<UiChamferButton cornerMode={prefs.cornerMode} icon="gamepad" label="Xbox" active={gamepadOverride === 'xbox'} variant={gamepadOverride === 'xbox' ? 'primary' : 'surface'} onclick={() => onSetGamepadOverride('xbox')} />
						<UiChamferButton cornerMode={prefs.cornerMode} icon="gamepad" label="DualSense" active={gamepadOverride === 'dualsense'} variant={gamepadOverride === 'dualsense' ? 'primary' : 'surface'} onclick={() => onSetGamepadOverride('dualsense')} />
					</div>
				</div>
			</div>
		{:else}
			<SettingsRuntimeTab cornerMode={prefs.cornerMode} {studioDefaults} {projectNodeCount} {traceCount} {lowMemoryMode} {onToggleLowMemory} {onSetStudioDefaults} {onResetStudioDefaults} />
		{/if}
	</div>
	{#snippet footer()}
		<UiModalFooter><UiChamferButton cornerMode={prefs.cornerMode} label="Done" variant="ghost" onclick={onClose} /></UiModalFooter>
	{/snippet}
</UiModalShell>

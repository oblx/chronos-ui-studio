<script lang="ts">
	import { UiChamferButton, UiChamferFrame, UiIcon } from '../atoms';
	import type { InputModality } from '../input';
	import { uiDrawerGrip } from '../machines';
	import { UiAnimatedResizeBody } from '../molecules';
	import { HUD_METRICS, ZONE_CORNER_PRESETS, Z_LAYERS, type CornerKind, type UiIconName } from '../tokens';
	import type { AssistantDockState, AssistantMessage, AssistantOcularState, AssistantQuickAction } from './assistant.types';
	import UiRobotEmblem from './UiRobotEmblem.svelte';

	interface Props {
		cornerMode?: CornerKind; dockState: AssistantDockState; studioChromeVisible?: boolean;
		ocularState?: AssistantOcularState; modelLabel?: string; inputModality?: InputModality;
		voiceListening?: boolean; voiceSupported?: boolean; interimTranscript?: string;
		messages?: readonly AssistantMessage[]; quickActions?: readonly AssistantQuickAction[];
		canUndo?: boolean; busy?: boolean;
		onSubmit: (prompt: string) => void;
		onMoveFloat: (dxPx: number, dyPx: number, rect?: DOMRect) => void;
		onDropFloat: () => void; onDock: () => void; onToggleExpand: () => void;
		onToggleVoice?: () => void; onTogglePalette?: () => void; onUndoStep?: () => void;
	}

	let {
		cornerMode = 'CHAMFER', dockState, studioChromeVisible = false, ocularState = 'IDLE', modelLabel = 'LOCAL AGENT',
		inputModality = 'KEYBOARD', voiceListening = false, voiceSupported = true, interimTranscript = '',
		messages = [], quickActions = [], canUndo = false, busy = false,
		onSubmit, onMoveFloat, onDropFloat, onDock, onToggleExpand, onToggleVoice, onTogglePalette, onUndoStep
	}: Props = $props();

	let draft = $state('');
	let sectionEl = $state<HTMLElement | null>(null);
	const MODALITY_ICON: Record<InputModality, UiIconName> = { KEYBOARD: 'keyboard', XBOX: 'gamepad', DUALSENSE: 'gamepad', VOICE: 'mic' };
	let dockedBottom = $derived(studioChromeVisible ? 'var(--ui-safe-bottom, 9rem)' : `${HUD_METRICS.viewportMarginRem}rem`);
	let positionStyle = $derived(
		dockState.mode === 'FLOATING'
			? `z-index: ${Z_LAYERS.assistantDock}; left: ${dockState.xRem}rem; top: ${dockState.yRem}rem; width: min(${HUD_METRICS.assistantWidthRem}rem, calc(100vw - 2rem));`
			: `z-index: ${Z_LAYERS.assistantDock}; left: 50%; bottom: ${dockedBottom}; transform: translateX(-50%); width: min(${HUD_METRICS.assistantWidthRem}rem, calc(100vw - 2rem));`
	);

	function sendPrompt(raw?: string): void {
		const rawText = raw ?? draft;
		const text = rawText.trim();
		if (!text || busy) return;
		draft = '';
		if (!dockState.expanded) onToggleExpand();
		onSubmit(text);
	}
</script>

<section bind:this={sectionEl} aria-label="Chronos AI Assistant Dock" data-testid="ui-assistant-dock" data-dock-mode={dockState.mode} data-expanded={dockState.expanded ? 'true' : 'false'} class="fixed select-none" style={positionStyle}>
	<UiChamferFrame corners={ZONE_CORNER_PRESETS.BOTTOM_CENTER} {cornerMode} carets={true} bezel={true} outerClass="w-full" className="flex flex-col gap-2 px-3 py-2">
		<UiAnimatedResizeBody open={dockState.expanded}>
			<div class="mb-1 flex flex-col gap-2 border-b pb-2" style="border-color: var(--ui-border-subtle); max-height: clamp(14rem, 34vh, 20rem);" inert={!dockState.expanded}>
				<div class="flex items-center justify-between gap-2 text-xs">
					<div class="flex min-w-0 items-center gap-2">
						<span class="font-semibold">Builder Assistant</span>
						<span class="ui-font-mono truncate px-1.5 py-0.5 text-[0.65rem] font-semibold" data-testid="assistant-adapter-badge" style="background-color: var(--ui-accent-vivid); color: var(--ui-accent-vivid-content);">{modelLabel}</span>
						<span class="ui-font-mono inline-flex items-center gap-1 text-[0.65rem]" style="color: var(--ui-secondary);">
							<UiIcon name={MODALITY_ICON[inputModality]} sizeRem={0.75} />{inputModality}
						</span>
					</div>
					<div class="flex shrink-0 items-center gap-1.5">
						{#if onTogglePalette}
							<UiChamferButton {cornerMode} icon="wrench" label="Build" variant="ghost" onclick={onTogglePalette} className="py-0.5 text-[0.7rem]" />
						{/if}
						{#if dockState.mode === 'FLOATING'}
							<UiChamferButton {cornerMode} icon="dock" label="Dock" variant="secondary" onclick={onDock} className="py-0.5 text-[0.7rem]" />
						{/if}
						{#if canUndo && onUndoStep}
							<UiChamferButton {cornerMode} icon="undo" label="Undo" variant="ghost" onclick={onUndoStep} className="py-0.5 text-[0.7rem]" />
						{/if}
						<button type="button" data-testid="assistant-collapse-trigger" aria-label="Collapse assistant deck" data-ui-tip="Collapse assistant deck" onclick={onToggleExpand}
							class="flex h-6 w-6 items-center justify-center border" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-200); color: var(--ui-base-content);">
							<UiIcon name="chevron-down" sizeRem={0.85} />
						</button>
					</div>
				</div>
				<div class="flex max-h-36 flex-col gap-2 overflow-y-auto pr-1 text-xs select-text" data-testid="assistant-timeline">
					{#if messages.length === 0}
						<p style="color: var(--ui-muted-content);">Type, click Build, or speak with the microphone to assemble live components — zero API keys required.</p>
					{:else}
						{#each messages as msg (msg.id)}
							<div class="flex flex-col gap-1 border-b pb-1.5 last:border-none" style="border-color: var(--ui-border-subtle);">
								<div class="flex items-center justify-between gap-2 text-[0.7rem]" style="color: var(--ui-muted-content);">
									<span class="font-semibold uppercase">{msg.role}</span>
									{#if msg.revisionId}<span class="ui-font-mono">{msg.revisionId.slice(0, 10)}</span>{/if}
								</div>
								<p class="leading-relaxed">{msg.content}</p>
								{#if msg.toolCalls && msg.toolCalls.length > 0}
									<div class="ui-font-mono flex flex-wrap items-center gap-2 pt-0.5 text-[0.7rem]" style="color: var(--ui-secondary);">
										{#each msg.toolCalls as tc, idx (`${msg.id}-${idx}`)}<span>[{tc.ok ? 'OK' : 'ERR'}] {tc.tool}: {tc.summary}</span>{/each}
									</div>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
				{#if quickActions.length > 0}
					<div class="flex flex-wrap items-center gap-1.5">
						{#each quickActions as qa (qa.id)}<UiChamferButton {cornerMode} label={qa.label} variant="surface" onclick={() => sendPrompt(qa.prompt)} className="py-0.5 text-[0.7rem]" />{/each}
					</div>
				{/if}
			</div>
		</UiAnimatedResizeBody>

		<form class="flex items-center gap-1.5" onsubmit={(e) => { e.preventDefault(); sendPrompt(); }}>
			<button type="button" data-testid="assistant-drag-grip" data-ui-drag-grip="true" aria-label="Drag to float assistant" data-ui-tip="Drag to float assistant"
				use:uiDrawerGrip={{ isFloating: dockState.mode === 'FLOATING', detachOnDrag: true, onMoveFloat: (dx, dy) => onMoveFloat(dx, dy, sectionEl?.getBoundingClientRect()), onDropFloat }}
				class="flex h-7 w-7 shrink-0 cursor-grab items-center justify-center border active:cursor-grabbing"
				style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-300); color: var(--ui-accent-vivid, var(--ui-primary));">
				<UiIcon name="grip" sizeRem={0.9} />
			</button>
			<UiRobotEmblem state={voiceListening ? 'LISTENING' : ocularState} size={24} />
			<input type="text" value={voiceListening && interimTranscript ? interimTranscript : draft}
				oninput={(e) => { draft = (e.currentTarget as HTMLInputElement).value; }} aria-label="Assistant prompt input" data-ui-focusable="true"
				placeholder={voiceListening ? 'Listening... speak your UI idea' : 'Describe a UI, click Build, or tap mic...'}
				class="min-w-0 flex-1 bg-transparent px-1.5 py-1 text-xs outline-none" style="color: var(--ui-base-content);" />
			{#if onToggleVoice && voiceSupported}
				<UiChamferButton {cornerMode} icon={voiceListening ? 'mic-off' : 'mic'} tip={voiceListening ? 'Stop voice input' : 'Speak UI prompt'}
					active={voiceListening} variant={voiceListening ? 'danger' : 'ghost'} onclick={onToggleVoice} className="px-2 py-1" />
			{/if}
			{#if dockState.mode === 'FLOATING' && !dockState.expanded}
				<UiChamferButton {cornerMode} icon="dock" label="Dock" variant="secondary" onclick={onDock} className="py-1 text-xs" />
			{/if}
			<UiChamferButton {cornerMode} icon="send" label={busy ? 'Running' : 'Send'} variant="primary" disabled={busy} type="submit" className="py-1 text-xs" />
			{#if !dockState.expanded}
				<button type="button" data-testid="assistant-unfold-trigger" aria-label="Unfold assistant deck" data-ui-tip="Expand assistant deck"
					onclick={onToggleExpand} class="flex h-7 w-7 shrink-0 items-center justify-center border"
					style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-200); color: var(--ui-base-content);">
					<UiIcon name="chevron-up" sizeRem={0.875} />
				</button>
			{/if}
		</form>
	</UiChamferFrame>
</section>

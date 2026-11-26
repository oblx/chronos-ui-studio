<script lang="ts">
	import { UiChamferButton, UiChamferFrame, UiIcon } from '../atoms';
	import type { InputModality } from '../input';
	import { uiFoldGrip, uiSpotlight } from '../machines';
	import { UiAnimatedResizeBody } from '../molecules';
	import { HISTORY_LIMIT_BOUNDS, HUD_METRICS, ZONE_CORNER_PRESETS, Z_LAYERS, type CornerKind, type UiIconName } from '../tokens';
	import type { AssistantDockState, AssistantMessage, AssistantOcularState, AssistantQuickAction } from './assistant.types';
	import UiRobotEmblem from './UiRobotEmblem.svelte';

	interface Props {
		cornerMode?: CornerKind; dockState: AssistantDockState; studioChromeVisible?: boolean;
		ocularState?: AssistantOcularState; modelLabel?: string; inputModality?: InputModality;
		voiceListening?: boolean; voiceSupported?: boolean; interimTranscript?: string;
		messages?: readonly AssistantMessage[]; quickActions?: readonly AssistantQuickAction[];
		canUndo?: boolean; canRedo?: boolean; undoCount?: number; redoCount?: number; historyLimit?: number;
		busy?: boolean; hasBuiltOnce?: boolean;
		onSubmit: (prompt: string) => void;
		onMoveFloat: (dxPx: number, dyPx: number, rect?: DOMRect) => void;
		onDropFloat: () => void; onDock: () => void; onToggleFloat?: (rect?: DOMRect) => void; onToggleExpand: () => void;
		onToggleVoice?: () => void; onTogglePalette?: () => void; onUndoStep?: () => void; onRedoStep?: () => void;
	}

	let {
		cornerMode = 'CHAMFER', dockState, studioChromeVisible = false, ocularState = 'IDLE', modelLabel = 'LOCAL AGENT',
		inputModality = 'KEYBOARD', voiceListening = false, voiceSupported = true, interimTranscript = '',
		messages = [], quickActions = [], canUndo = false, canRedo = false, undoCount = 0, redoCount = 0, historyLimit = HISTORY_LIMIT_BOUNDS.defaultLimit,
		busy = false, hasBuiltOnce = false,
		onSubmit, onMoveFloat, onDropFloat, onDock, onToggleFloat, onToggleExpand, onToggleVoice, onTogglePalette, onUndoStep, onRedoStep
	}: Props = $props();

	let draft = $state('');
	let sectionEl = $state<HTMLElement | null>(null);
	const MODALITY_ICON: Record<InputModality, UiIconName> = { KEYBOARD: 'keyboard', XBOX: 'gamepad', DUALSENSE: 'gamepad', VOICE: 'mic' };
	let dockedBottom = $derived(`${HUD_METRICS.viewportMarginRem}rem`);
	let dockedWidth = $derived(studioChromeVisible ? `min(var(--ui-corridor-max-w, ${HUD_METRICS.assistantWidthRem}rem), calc(100vw - 2 * var(--ui-side-track-w) - 3rem))` : `min(${HUD_METRICS.assistantWidthRem}rem, calc(100vw - 2rem))`);
	let effectiveHasBuilt = $derived(hasBuiltOnce || messages.length > 0);
	let gripTip = $derived(dockState.mode === 'FLOATING' ? 'Click: dock to bottom\nDrag: reposition panel' : 'Click: float assistant\nDrag: reposition panel');
	let primaryCtaLabel = $derived(busy ? 'Running' : effectiveHasBuilt ? 'Send' : 'Build');
	let undoTip = $derived(canUndo ? `Undo step (${undoCount}/${historyLimit} in IndexedDB)` : `Undo unavailable (0/${historyLimit})`);
	let redoTip = $derived(canRedo ? `Redo step (${redoCount}/${historyLimit} in IndexedDB)` : `Redo unavailable (0/${historyLimit})`);
	let positionStyle = $derived(dockState.mode === 'FLOATING' ? `z-index: ${Z_LAYERS.assistantDock}; left: ${dockState.xRem}rem; top: ${dockState.yRem}rem; width: min(${HUD_METRICS.assistantWidthRem}rem, calc(100vw - 2rem));` : `z-index: ${Z_LAYERS.assistantDock}; left: 50%; bottom: ${dockedBottom}; transform: translateX(-50%); width: ${dockedWidth};`);

	function sendPrompt(raw?: string): void { const text = (raw ?? draft).trim(); if (!text || busy) return; draft = ''; if (!dockState.expanded) onToggleExpand(); onSubmit(text); }
	function toggleGripDock(): void { if (onToggleFloat) onToggleFloat(sectionEl?.getBoundingClientRect()); else if (dockState.mode === 'FLOATING') onDock(); }
</script>

<section
	bind:this={sectionEl}
	use:uiSpotlight={'hud-assistant-dock'}
	aria-label="Chronos AI Assistant Dock"
	data-testid="ui-assistant-dock"
	data-fold-axis="VERTICAL"
	data-fold-behavior="OVERLAY_HOVER"
	data-ui-interactive="true"
	data-dock-mode={dockState.mode}
	data-expanded={dockState.expanded ? 'true' : 'false'}
	data-has-built-once={effectiveHasBuilt ? 'true' : 'false'}
	class="fixed select-none {dockState.expanded ? 'shadow-xl' : 'shadow-md'}"
	style={positionStyle}
>
	<UiChamferFrame corners={ZONE_CORNER_PRESETS.BOTTOM_CENTER} {cornerMode} carets={true} bezel={true} outerClass="w-full" className="flex flex-col">
		<UiAnimatedResizeBody open={dockState.expanded}>
			<div class="flex flex-col border-b" style="border-color: var(--ui-border-subtle); max-height: clamp(14rem, 36vh, 22rem);" inert={!dockState.expanded}>
				<div data-testid="assistant-transcript-header" class="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2 text-xs" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-300);">
					<div class="flex min-w-0 items-center gap-2">
						<span class="font-semibold">Builder Assistant</span>
						<span class="ui-font-mono truncate px-1.5 py-0.5 text-[0.65rem] font-semibold" data-testid="assistant-adapter-badge" style="background-color: var(--ui-accent-vivid); color: var(--ui-accent-vivid-content);">{modelLabel}</span>
						<span class="ui-font-mono inline-flex items-center gap-1 text-[0.65rem]" style="color: var(--ui-secondary);"><UiIcon name={MODALITY_ICON[inputModality]} sizeRem={0.75} />{inputModality}</span>
					</div>
					<div class="flex shrink-0 items-center gap-1">
						{#if onTogglePalette}<UiChamferButton {cornerMode} icon="wrench" label="Palette" tip="Toggle component palette" tipLevel={50} variant="ghost" onclick={onTogglePalette} className="py-0.5 text-[0.7rem]" />{/if}
						{#if dockState.mode === 'FLOATING'}<UiChamferButton {cornerMode} icon="dock" label="Dock" tip="Dock assistant to bottom corridor" tipLevel={40} variant="secondary" onclick={onDock} className="py-0.5 text-[0.7rem]" />{/if}
						<UiChamferButton {cornerMode} icon="undo" label="Undo" testId="assistant-undo-btn" tip={undoTip} tipLevel={canUndo ? 25 : 15} variant="ghost" disabled={!canUndo || !onUndoStep} onclick={() => onUndoStep?.()} className="py-0.5 text-[0.7rem]" />
						<UiChamferButton {cornerMode} icon="redo" label="Redo" testId="assistant-redo-btn" tip={redoTip} tipLevel={canRedo ? 25 : 15} variant="ghost" disabled={!canRedo || !onRedoStep} onclick={() => onRedoStep?.()} className="py-0.5 text-[0.7rem]" />
						<button type="button" data-testid="assistant-collapse-trigger" aria-label="Collapse assistant deck" data-ui-tip="Collapse assistant deck" data-ui-tip-level={40} data-ui-cursor="pointer" onclick={onToggleExpand} class="ui-ctl ui-detent flex h-6 w-6 items-center justify-center border" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-200); color: var(--ui-base-content);"><UiIcon name="chevron-down" sizeRem={0.85} /></button>
					</div>
				</div>
				<div class="ui-scroll-deck min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 pt-3 pb-2 text-xs select-text" style="max-height: clamp(9.5rem, 24vh, 14.5rem);" data-testid="assistant-timeline">
					{#if messages.length === 0}
						<p class="m-0" style="color: var(--ui-muted-content);">Describe an interface, press Build, or tap the microphone to assemble live components.</p>
					{:else}
						{#each messages as msg (msg.id)}
							<div class="flex flex-col gap-1.5 border-b pb-2 last:border-none" style="border-color: var(--ui-border-subtle);">
								<div class="flex items-center justify-between gap-2 text-[0.68rem]" style="color: var(--ui-muted-content);">
									<span data-testid="assistant-user-badge" data-role={msg.role} class="ui-font-mono font-semibold tracking-wider uppercase">{msg.role}</span>
									{#if msg.revisionId}<span class="ui-font-mono">{msg.revisionId.slice(0, 10)}</span>{/if}
								</div>
								<p class="m-0 leading-relaxed">{msg.content}</p>
								{#if msg.toolCalls && msg.toolCalls.length > 0}
									<div class="ui-font-mono flex flex-wrap items-center gap-1.5 pt-0.5 text-[0.68rem]">
										{#each msg.toolCalls as tc, idx (`${msg.id}-${idx}`)}
											<span data-testid="assistant-tool-chip" class="inline-flex max-w-full items-center gap-1.5 border px-1.5 py-0.5 leading-snug" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-300); color: var(--ui-base-content);">
												<span class="font-semibold" style="color: {tc.ok ? 'var(--ui-success)' : 'var(--ui-error)'};">[{tc.ok ? 'OK' : 'ERR'}]</span>
												<span class="font-semibold" style="color: var(--ui-secondary);">{tc.tool}</span>
												<span class="truncate" style="color: var(--ui-muted-content);">{tc.summary}</span>
											</span>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
				{#if quickActions.length > 0}
					<div class="flex shrink-0 flex-wrap items-center gap-1.5 border-t px-3 py-1.5" style="border-color: var(--ui-border-subtle);">
						{#each quickActions as qa (qa.id)}<UiChamferButton {cornerMode} label={qa.label} tip={qa.prompt} tipLevel={75} variant="surface" onclick={() => sendPrompt(qa.prompt)} className="py-0.5 text-[0.7rem]" />{/each}
					</div>
				{/if}
			</div>
		</UiAnimatedResizeBody>

		<form class="flex items-center gap-1.5 px-3 py-2" onsubmit={(e) => { e.preventDefault(); sendPrompt(); }}>
			<button type="button" data-testid="assistant-drag-grip" data-ui-drag-grip="true" data-ui-tip-placement="top" data-ui-tip-level={65} data-ui-cursor="grab" aria-label={gripTip} data-ui-tip={gripTip}
				use:uiFoldGrip={{ axis: 'VERTICAL', isFloating: dockState.mode === 'FLOATING', detachOnDrag: true, onToggleFloat: toggleGripDock, onMoveFloat: (dx, dy) => onMoveFloat(dx, dy, sectionEl?.getBoundingClientRect()), onDropFloat }}
				class="ui-ctl ui-detent flex h-7 w-7 shrink-0 cursor-grab items-center justify-center border active:cursor-grabbing"
				style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-300); color: var(--ui-accent-vivid, var(--ui-primary));">
				<UiIcon name="grip" sizeRem={0.9} />
			</button>
			<UiRobotEmblem state={voiceListening ? 'LISTENING' : ocularState} size={24} />
			<input type="text" value={voiceListening && interimTranscript ? interimTranscript : draft} oninput={(e) => { draft = (e.currentTarget as HTMLInputElement).value; }}
				aria-label="Assistant prompt input" data-testid="assistant-prompt-input" data-ui-focusable="true" data-ui-cursor="text"
				placeholder={voiceListening ? 'Listening... speak your UI idea' : effectiveHasBuilt ? 'Refine layout, theme, or components...' : 'Describe a UI, press Build, or tap mic...'}
				class="min-w-0 flex-1 bg-transparent px-1.5 py-1 text-xs outline-none" style="color: var(--ui-base-content);" />
			{#if onToggleVoice && voiceSupported}
				<UiChamferButton {cornerMode} icon={voiceListening ? 'mic-off' : 'mic'} tip={voiceListening ? 'Stop voice input' : 'Speak UI prompt'} tipLevel={50} active={voiceListening} variant={voiceListening ? 'danger' : 'ghost'} onclick={onToggleVoice} className="px-2 py-1" />
			{/if}
			<UiChamferButton {cornerMode} icon={effectiveHasBuilt ? 'send' : 'wrench'} label={primaryCtaLabel} tip={effectiveHasBuilt ? 'Send refinement prompt' : 'Build UI from prompt'} tipLevel={30} testId="assistant-submit-btn" variant="primary" disabled={busy} type="submit" className="py-1 text-xs" />
			{#if !dockState.expanded}
				<button type="button" data-testid="assistant-unfold-trigger" aria-label="Unfold assistant deck" data-ui-tip="Expand assistant deck" data-ui-tip-level={40} data-ui-cursor="pointer" onclick={onToggleExpand} class="ui-ctl ui-detent flex h-7 w-7 shrink-0 items-center justify-center border" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-200); color: var(--ui-base-content);"><UiIcon name="chevron-up" sizeRem={0.875} /></button>
			{/if}
		</form>
	</UiChamferFrame>
</section>

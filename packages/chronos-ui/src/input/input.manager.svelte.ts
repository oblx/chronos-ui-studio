import { moveSpatialFocusInDom } from './focus.spatial';
import { createGamepadPollerState, processGamepadSnapshot, triggerGamepadHaptic, type GamepadPollerState } from './gamepad';
import type { GamepadProfileId, GamepadSnapshot, InputModality, SemanticInputAction, VoiceCaptureMode } from './input.types';
import { createVoiceInputAdapter } from './voice.adapter';

export interface MultimodalInputOptions {
	readonly onAction: (action: SemanticInputAction) => void;
	readonly onModalityChange?: (modality: InputModality) => void;
	readonly onVoiceState?: (listening: boolean, interim: string) => void;
}

function pollConnectedGamepads(
	padStates: Map<number, GamepadPollerState>,
	nowMs: number,
	profileOverride: GamepadProfileId | null,
	emit: (action: SemanticInputAction) => void
): number {
	const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
	let active = 0;
	for (const pad of pads) {
		if (!pad) continue;
		active += 1;
		let st = padStates.get(pad.index);
		if (!st) { st = createGamepadPollerState(); padStates.set(pad.index, st); }
		const snap: GamepadSnapshot = { index: pad.index, id: pad.id, buttons: pad.buttons, axes: pad.axes };
		for (const act of processGamepadSnapshot(snap, st, nowMs, profileOverride).actions) emit(act);
	}
	return active;
}

function wireWindowInputEvents(onKey: () => void, onConnect: () => void, onDisconnect: () => void, onCleanup: () => void): () => void {
	if (typeof window === 'undefined') return () => {};
	window.addEventListener('keydown', onKey, { passive: true });
	window.addEventListener('gamepadconnected', onConnect);
	window.addEventListener('gamepaddisconnected', onDisconnect);
	return () => {
		window.removeEventListener('keydown', onKey);
		window.removeEventListener('gamepadconnected', onConnect);
		window.removeEventListener('gamepaddisconnected', onDisconnect);
		onCleanup();
	};
}

function isNavDir(type: SemanticInputAction['type']): type is 'NAV_UP' | 'NAV_DOWN' | 'NAV_LEFT' | 'NAV_RIGHT' {
	return type === 'NAV_UP' || type === 'NAV_DOWN' || type === 'NAV_LEFT' || type === 'NAV_RIGHT';
}

export function createMultimodalInputManager(opts: MultimodalInputOptions) {
	let modality = $state<InputModality>('KEYBOARD');
	let voiceListening = $state(false);
	let interimTranscript = $state('');
	let connectedGamepads = $state(0);
	let profileOverride = $state<GamepadProfileId | null>(null);
	let rafId = 0;
	const padStates = new Map<number, GamepadPollerState>();

	const emit = (action: SemanticInputAction): void => {
		if (action.modality !== modality) { modality = action.modality; opts.onModalityChange?.(modality); }
		if (isNavDir(action.type)) moveSpatialFocusInDom(action.type);
		if (action.type === 'VOICE_INTERIM' || action.type === 'VOICE_FINAL') {
			interimTranscript = action.type === 'VOICE_INTERIM' ? (action.transcript ?? '') : '';
			opts.onVoiceState?.(voiceListening, interimTranscript);
		}
		opts.onAction(action);
	};
	const voice = createVoiceInputAdapter({
		onAction: emit,
		onStateChange: (listening) => { voiceListening = listening; if (!listening) interimTranscript = ''; opts.onVoiceState?.(listening, interimTranscript); }
	});
	const pollFrame = (nowMs: number): void => {
		connectedGamepads = pollConnectedGamepads(padStates, nowMs, profileOverride, emit);
		rafId = connectedGamepads > 0 ? requestAnimationFrame(pollFrame) : 0;
	};
	const attach = () => wireWindowInputEvents(
		() => { if (modality !== 'KEYBOARD') { modality = 'KEYBOARD'; opts.onModalityChange?.('KEYBOARD'); } },
		() => { if (!rafId) rafId = requestAnimationFrame(pollFrame); },
		() => {
			connectedGamepads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean).length : 0;
			if (connectedGamepads === 0 && rafId) { cancelAnimationFrame(rafId); rafId = 0; padStates.clear(); }
		},
		() => { if (rafId) cancelAnimationFrame(rafId); voice.stop(); }
	);
	return {
		get modality() { return modality; }, get voiceListening() { return voiceListening; }, get voiceSupported() { return voice.isSupported; },
		get interimTranscript() { return interimTranscript; }, get connectedGamepads() { return connectedGamepads; },
		setVoiceMode: (m: VoiceCaptureMode) => voice.setMode(m), setGamepadOverride: (id: GamepadProfileId | null) => { profileOverride = id; },
		toggleVoice: () => voice.toggle(), pulseHaptic: () => triggerGamepadHaptic(), attach
	};
}

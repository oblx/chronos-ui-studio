import type { SemanticInputAction, SpeechToTextPort, VoiceCaptureMode } from './input.types';

export interface SpeechRecognitionLike {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	onresult: ((e: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
	onerror: ((e: { error: string }) => void) | null;
	onend: (() => void) | null;
	start: () => void;
	stop: () => void;
}

export interface VoiceAdapterOptions {
	readonly lang?: string;
	readonly mode?: VoiceCaptureMode;
	readonly fallbackPort?: SpeechToTextPort;
	readonly factory?: () => SpeechRecognitionLike | null;
	readonly onAction: (action: SemanticInputAction) => void;
	readonly onStateChange?: (listening: boolean, error?: string) => void;
}

function defaultSpeechFactory(): SpeechRecognitionLike | null {
	if (typeof window === 'undefined') return null;
	const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
	const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
	return Ctor ? new Ctor() : null;
}

function wireSpeechRecognition(
	rec: SpeechRecognitionLike,
	mode: VoiceCaptureMode,
	opts: VoiceAdapterOptions,
	setStopped: (error?: string) => void
): void {
	rec.continuous = mode === 'HANDS_FREE';
	rec.interimResults = true;
	rec.lang = opts.lang ?? (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
	rec.onresult = (e) => {
		let interim = '';
		let finalText = '';
		for (let i = 0; i < e.results.length; i += 1) {
			const seg = e.results[i];
			if (seg.isFinal) finalText += seg[0].transcript;
			else interim += seg[0].transcript;
		}
		if (interim.trim()) opts.onAction({ type: 'VOICE_INTERIM', modality: 'VOICE', transcript: interim.trim(), timestamp: Date.now() });
		if (finalText.trim()) opts.onAction({ type: 'VOICE_FINAL', modality: 'VOICE', transcript: finalText.trim(), timestamp: Date.now() });
	};
	rec.onerror = (e) => setStopped(e.error);
	rec.onend = () => setStopped();
}

async function runFallbackStt(opts: VoiceAdapterOptions, blob: Blob): Promise<string | null> {
	if (!opts.fallbackPort) return null;
	const transcript = (await opts.fallbackPort.transcribe(blob)).trim();
	if (transcript) opts.onAction({ type: 'VOICE_FINAL', modality: 'VOICE', transcript, timestamp: Date.now() });
	return transcript || null;
}

export function createVoiceInputAdapter(opts: VoiceAdapterOptions) {
	const makeRec = opts.factory ?? defaultSpeechFactory;
	let rec: SpeechRecognitionLike | null = null;
	let listening = false;
	let mode: VoiceCaptureMode = opts.mode ?? 'PUSH_TO_TALK';

	const setStopped = (error?: string): void => { listening = false; opts.onStateChange?.(false, error); };
	const start = (): boolean => {
		if (listening) return true;
		rec = makeRec();
		if (!rec) {
			opts.onStateChange?.(false, opts.fallbackPort ? 'Using external STT port' : 'Web Speech API unavailable');
			return false;
		}
		wireSpeechRecognition(rec, mode, opts, setStopped);
		rec.start();
		listening = true;
		opts.onStateChange?.(true);
		return true;
	};
	const stop = (): void => { if (!listening) return; listening = false; rec?.stop(); opts.onStateChange?.(false); };

	return {
		get isListening() { return listening; },
		get isSupported() { return Boolean(makeRec() || opts.fallbackPort); },
		setMode: (next: VoiceCaptureMode) => { mode = next; },
		start,
		stop,
		toggle: () => (listening ? (stop(), false) : start()),
		transcribeFallback: (blob: Blob) => runFallbackStt(opts, blob)
	};
}

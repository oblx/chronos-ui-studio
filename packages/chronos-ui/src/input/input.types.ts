export type InputModality = 'KEYBOARD' | 'XBOX' | 'DUALSENSE' | 'VOICE';

export type GamepadProfileId = 'xbox' | 'dualsense';

export type VoiceCaptureMode = 'PUSH_TO_TALK' | 'HANDS_FREE';

export type SemanticInputActionType =
	| 'NAV_UP'
	| 'NAV_DOWN'
	| 'NAV_LEFT'
	| 'NAV_RIGHT'
	| 'CONFIRM'
	| 'CANCEL'
	| 'OPEN_INSPECTOR'
	| 'TOGGLE_ASSISTANT'
	| 'PUSH_TO_TALK'
	| 'TAB_PREV'
	| 'TAB_NEXT'
	| 'ZOOM_IN'
	| 'ZOOM_OUT'
	| 'PAN_DELTA'
	| 'FIT_CANVAS'
	| 'TOGGLE_HUD'
	| 'OPEN_SETTINGS'
	| 'VOICE_INTERIM'
	| 'VOICE_FINAL';

export interface SemanticInputAction {
	readonly type: SemanticInputActionType;
	readonly modality: InputModality;
	readonly dx?: number;
	readonly dy?: number;
	readonly value?: number;
	readonly transcript?: string;
	readonly timestamp: number;
}

export interface SpeechToTextPort {
	readonly label: string;
	readonly transcribe: (audioBlob: Blob) => Promise<string>;
}

export interface GamepadButtonState {
	readonly pressed: boolean;
	readonly value: number;
}

export interface GamepadSnapshot {
	readonly index: number;
	readonly id: string;
	readonly buttons: readonly GamepadButtonState[];
	readonly axes: readonly number[];
}

export interface GamepadProfile {
	readonly id: GamepadProfileId | string;
	readonly label: string;
	readonly modality: Extract<InputModality, 'XBOX' | 'DUALSENSE'>;
	readonly matchId: (gamepadId: string) => boolean;
	readonly buttonLabels: Readonly<Record<number, string>>;
	readonly buttonMap: Readonly<Record<number, SemanticInputActionType>>;
}

import { HUD_METRICS } from '@ui/tokens';
import type { GamepadProfile, SemanticInputActionType } from '../input.types';

export const STICK_DEADZONE = HUD_METRICS.stickDeadzone;

export interface HardwareVidPid {
	readonly vendorId: string;
	readonly productId: string;
}

export function parseHardwareVidPid(gamepadId: string): HardwareVidPid | null {
	const labelMatch = gamepadId.match(/Vendor:\s*([0-9a-f]{4})\s+Product:\s*([0-9a-f]{4})/i);
	if (labelMatch) {
		return { vendorId: labelMatch[1].toLowerCase(), productId: labelMatch[2].toLowerCase() };
	}
	const colonMatch = gamepadId.match(/\b([0-9a-f]{4}):([0-9a-f]{4})\b/i);
	if (colonMatch) {
		return { vendorId: colonMatch[1].toLowerCase(), productId: colonMatch[2].toLowerCase() };
	}
	return null;
}

export const STANDARD_BUTTON_MAP: Readonly<Record<number, SemanticInputActionType>> = {
	0: 'CONFIRM', 1: 'CANCEL', 2: 'OPEN_INSPECTOR', 3: 'TOGGLE_ASSISTANT',
	4: 'TAB_PREV', 5: 'TAB_NEXT', 6: 'ZOOM_OUT', 7: 'ZOOM_IN',
	8: 'TOGGLE_HUD', 9: 'OPEN_SETTINGS', 10: 'FIT_CANVAS', 11: 'PUSH_TO_TALK',
	12: 'NAV_UP', 13: 'NAV_DOWN', 14: 'NAV_LEFT', 15: 'NAV_RIGHT'
};

export const XBOX_PROFILE: GamepadProfile = {
	id: 'xbox',
	label: 'Xbox Series / XInput',
	modality: 'XBOX',
	matchId: (id) => {
		const hw = parseHardwareVidPid(id);
		if (hw) return hw.vendorId === '045e';
		return /xbox|xinput|microsoft/i.test(id);
	},
	buttonLabels: { 0: 'A', 1: 'B', 2: 'X', 3: 'Y', 4: 'LB', 5: 'RB', 6: 'LT', 7: 'RT', 8: 'View', 9: 'Menu', 10: 'L3', 11: 'R3' },
	buttonMap: STANDARD_BUTTON_MAP
};

export const DUALSENSE_PROFILE: GamepadProfile = {
	id: 'dualsense',
	label: 'PS5 DualSense',
	modality: 'DUALSENSE',
	matchId: (id) => {
		const hw = parseHardwareVidPid(id);
		if (hw) return hw.vendorId === '054c';
		return /dualsense|ps5|playstation|sony/i.test(id) || (/wireless controller/i.test(id) && !/xbox/i.test(id));
	},
	buttonLabels: { 0: 'Cross', 1: 'Circle', 2: 'Square', 3: 'Triangle', 4: 'L1', 5: 'R1', 6: 'L2', 7: 'R2', 8: 'Create', 9: 'Options', 10: 'L3', 11: 'R3' },
	buttonMap: STANDARD_BUTTON_MAP
};

const PROFILE_REGISTRY = new Map<string, GamepadProfile>([
	[XBOX_PROFILE.id, XBOX_PROFILE],
	[DUALSENSE_PROFILE.id, DUALSENSE_PROFILE]
]);

export function registerGamepadProfile(profile: GamepadProfile): void {
	PROFILE_REGISTRY.set(profile.id, profile);
}

export function listGamepadProfiles(): readonly GamepadProfile[] {
	return [...PROFILE_REGISTRY.values()];
}

export function detectGamepadProfile(gamepadId: string, overrideId?: string | null): GamepadProfile {
	if (overrideId && PROFILE_REGISTRY.has(overrideId)) return PROFILE_REGISTRY.get(overrideId)!;
	for (const profile of PROFILE_REGISTRY.values()) {
		if (profile.matchId(gamepadId)) return profile;
	}
	return XBOX_PROFILE;
}

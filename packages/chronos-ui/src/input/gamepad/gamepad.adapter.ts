import { detectGamepadProfile, STICK_DEADZONE } from './gamepad.profiles';
import type { GamepadProfile, GamepadSnapshot, SemanticInputAction } from '../input.types';

const REPEAT_DELAY_MS = 260;
const NAV_REPEATABLE = new Set(['NAV_UP', 'NAV_DOWN', 'NAV_LEFT', 'NAV_RIGHT', 'ZOOM_IN', 'ZOOM_OUT']);

export interface GamepadPollerState {
	readonly pressedButtons: Set<number>;
	readonly lastNavRepeatMs: Map<number, number>;
	lastStickDir: string | null;
	lastStickMs: number;
}

export function createGamepadPollerState(): GamepadPollerState {
	return { pressedButtons: new Set(), lastNavRepeatMs: new Map(), lastStickDir: null, lastStickMs: 0 };
}

export function applyRadialDeadzone(x: number, y: number, deadzone = STICK_DEADZONE): { x: number; y: number } {
	const mag = Math.hypot(x, y);
	if (mag < deadzone) return { x: 0, y: 0 };
	const scale = Math.min(1, (mag - deadzone) / (1 - deadzone)) / mag;
	return { x: Number((x * scale).toFixed(3)), y: Number((y * scale).toFixed(3)) };
}

function pollGamepadButtons(
	snap: GamepadSnapshot,
	profile: GamepadProfile,
	state: GamepadPollerState,
	nowMs: number,
	actions: SemanticInputAction[]
): void {
	for (let i = 0; i < snap.buttons.length; i += 1) {
		const btn = snap.buttons[i];
		const actionType = profile.buttonMap[i];
		if (!btn || !actionType) continue;
		const isDown = btn.pressed || btn.value > 0.5;
		const wasDown = state.pressedButtons.has(i);
		if (isDown && !wasDown) {
			state.pressedButtons.add(i);
			state.lastNavRepeatMs.set(i, nowMs);
			actions.push({ type: actionType, modality: profile.modality, value: btn.value, timestamp: nowMs });
		} else if (isDown && wasDown && NAV_REPEATABLE.has(actionType)) {
			if (nowMs - (state.lastNavRepeatMs.get(i) ?? 0) >= REPEAT_DELAY_MS) {
				state.lastNavRepeatMs.set(i, nowMs);
				actions.push({ type: actionType, modality: profile.modality, value: btn.value, timestamp: nowMs });
			}
		} else if (!isDown && wasDown) {
			state.pressedButtons.delete(i);
			state.lastNavRepeatMs.delete(i);
		}
	}
}

function pollGamepadSticks(
	snap: GamepadSnapshot,
	profile: GamepadProfile,
	state: GamepadPollerState,
	nowMs: number,
	actions: SemanticInputAction[]
): void {
	const left = applyRadialDeadzone(snap.axes[0] ?? 0, snap.axes[1] ?? 0);
	const dir = Math.abs(left.x) > Math.abs(left.y)
		? (left.x > 0.5 ? 'NAV_RIGHT' : left.x < -0.5 ? 'NAV_LEFT' : null)
		: (left.y > 0.5 ? 'NAV_DOWN' : left.y < -0.5 ? 'NAV_UP' : null);
	if (dir && (dir !== state.lastStickDir || nowMs - state.lastStickMs >= REPEAT_DELAY_MS)) {
		state.lastStickDir = dir;
		state.lastStickMs = nowMs;
		actions.push({ type: dir, modality: profile.modality, timestamp: nowMs });
	} else if (!dir) {
		state.lastStickDir = null;
	}
	const right = applyRadialDeadzone(snap.axes[2] ?? 0, snap.axes[3] ?? 0);
	if (right.x !== 0 || right.y !== 0) {
		actions.push({ type: 'PAN_DELTA', modality: profile.modality, dx: Math.round(right.x * 16), dy: Math.round(right.y * 16), timestamp: nowMs });
	}
}

export function processGamepadSnapshot(
	snap: GamepadSnapshot,
	state: GamepadPollerState,
	nowMs: number,
	overrideProfileId?: string | null
): { readonly profile: GamepadProfile; readonly actions: readonly SemanticInputAction[] } {
	const profile = detectGamepadProfile(snap.id, overrideProfileId);
	const actions: SemanticInputAction[] = [];
	pollGamepadButtons(snap, profile, state, nowMs, actions);
	pollGamepadSticks(snap, profile, state, nowMs, actions);
	return { profile, actions };
}

export function triggerGamepadHaptic(durationMs = 45, weak = 0.25, strong = 0.15): void {
	if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
	for (const pad of navigator.getGamepads()) {
		const act = (pad as unknown as { vibrationActuator?: { playEffect?: (t: string, o: Record<string, number>) => Promise<void> } } | null)?.vibrationActuator;
		if (act?.playEffect) {
			void act.playEffect('dual-rumble', { duration: durationMs, weakMagnitude: weak, strongMagnitude: strong });
			break;
		}
	}
}

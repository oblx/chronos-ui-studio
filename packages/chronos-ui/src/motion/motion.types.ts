export type MotionPreset =
	| 'NONE'
	| 'FADE'
	| 'SLIDE'
	| 'SCALE_SPRING'
	| 'CYBER_UNFOLD'
	| 'GLITCH_SNAP'
	| 'IRIS_EXPAND'
	| 'SCAN_WIPE';

export type MotionSpeed = 'INSTANT' | 'FAST' | 'NORMAL' | 'DELIBERATE';

export type ReducedMotionOverride = 'AUTO' | 'FORCE_OFF' | 'FORCE_ON';

export interface MotionConfig {
	readonly preset: MotionPreset;
	readonly speed: MotionSpeed;
	readonly reducedMotionOverride: ReducedMotionOverride;
}

export const MOTION_PRESETS: readonly MotionPreset[] = [
	'NONE',
	'FADE',
	'SLIDE',
	'SCALE_SPRING',
	'CYBER_UNFOLD',
	'GLITCH_SNAP',
	'IRIS_EXPAND',
	'SCAN_WIPE'
] as const;

export const MOTION_SPEEDS: readonly MotionSpeed[] = [
	'INSTANT',
	'FAST',
	'NORMAL',
	'DELIBERATE'
] as const;

export const MOTION_SPEED_MS: Readonly<Record<MotionSpeed, number>> = {
	INSTANT: 0,
	FAST: 120,
	NORMAL: 220,
	DELIBERATE: 360
};

export const MOTION_SPEED_MULTIPLIER: Readonly<Record<MotionSpeed, number>> = {
	INSTANT: 0,
	FAST: 0.6,
	NORMAL: 1,
	DELIBERATE: 1.6
};

export const DEFAULT_MOTION_CONFIG: MotionConfig = {
	preset: 'CYBER_UNFOLD',
	speed: 'NORMAL',
	reducedMotionOverride: 'AUTO'
};

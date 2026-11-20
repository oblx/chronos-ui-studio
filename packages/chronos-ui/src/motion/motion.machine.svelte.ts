import {
	applyStudioDefaults, clampCornerRadiusRem, clampStudioDefaults, DEFAULT_CORNER_CUT_REM,
	DEFAULT_STUDIO_DEFAULTS, type StudioDefaultsConfig
} from '../tokens';
import { DEFAULT_MOTION_CONFIG, type MotionConfig } from './motion.types';

let activeMotionConfig: MotionConfig = DEFAULT_MOTION_CONFIG;
let activeCornerRadiusRem: number = DEFAULT_CORNER_CUT_REM;
let activeStudioDefaults: StudioDefaultsConfig = { ...DEFAULT_STUDIO_DEFAULTS };
let activeCornerMorph = true;
const listeners = new Set<() => void>();

function notifyMotionListeners(): void {
	for (const fn of listeners) fn();
}

export function subscribeMotionState(fn: () => void): () => void {
	listeners.add(fn);
	return () => { listeners.delete(fn); };
}

export function getActiveMotionConfig(): MotionConfig {
	return activeMotionConfig;
}

export function setActiveMotionConfig(patch: Partial<MotionConfig>): MotionConfig {
	activeMotionConfig = {
		preset: patch.preset ?? activeMotionConfig.preset,
		speed: patch.speed ?? activeMotionConfig.speed,
		reducedMotionOverride: patch.reducedMotionOverride ?? activeMotionConfig.reducedMotionOverride
	};
	notifyMotionListeners();
	return activeMotionConfig;
}

export function getActiveCornerRadiusRem(): number {
	return activeCornerRadiusRem;
}

export function setActiveCornerRadiusRem(value: number): number {
	activeCornerRadiusRem = clampCornerRadiusRem(value);
	activeStudioDefaults = { ...activeStudioDefaults, baseCornerCutRem: activeCornerRadiusRem };
	notifyMotionListeners();
	return activeCornerRadiusRem;
}

export function getActiveStudioDefaults(): StudioDefaultsConfig {
	return activeStudioDefaults;
}

export function setActiveStudioDefaults(patch: Partial<StudioDefaultsConfig>): StudioDefaultsConfig {
	activeStudioDefaults = clampStudioDefaults(patch, activeStudioDefaults);
	activeCornerRadiusRem = activeStudioDefaults.baseCornerCutRem;
	applyStudioDefaults(activeStudioDefaults);
	notifyMotionListeners();
	return activeStudioDefaults;
}

export function resetActiveStudioDefaults(): StudioDefaultsConfig {
	activeStudioDefaults = { ...DEFAULT_STUDIO_DEFAULTS };
	activeCornerRadiusRem = activeStudioDefaults.baseCornerCutRem;
	applyStudioDefaults(activeStudioDefaults);
	notifyMotionListeners();
	return activeStudioDefaults;
}

export function getActiveCornerMorph(): boolean {
	return activeCornerMorph;
}

export function setActiveCornerMorph(enabled: boolean): boolean {
	activeCornerMorph = enabled;
	notifyMotionListeners();
	return activeCornerMorph;
}

export function createMotionStore(initial: MotionConfig = DEFAULT_MOTION_CONFIG) {
	let config = $state<MotionConfig>(initial);
	activeMotionConfig = initial;
	const update = (patch: Partial<MotionConfig>): MotionConfig => {
		config = setActiveMotionConfig(patch);
		return config;
	};
	return {
		get config(): MotionConfig { return config; },
		update
	};
}

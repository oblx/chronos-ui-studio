import {
	applyStudioDefaults, clampCornerRadiusRem, clampStudioDefaults, DEFAULT_CORNER_CUT_REM,
	DEFAULT_STUDIO_DEFAULTS, type StudioDefaultsConfig
} from '../tokens';
import {
	applyMotionTokensToRoot, DEFAULT_MOTION_SENSORY, resolveMotionTierMs,
	type MotionDurationTier, type MotionProfileId, type MotionSensoryConfig
} from './motion.tokens';
import { DEFAULT_MOTION_CONFIG, type MotionConfig } from './motion.types';

let activeMotionConfig: MotionConfig = DEFAULT_MOTION_CONFIG;
let activeMotionSensory: MotionSensoryConfig = { ...DEFAULT_MOTION_SENSORY };
let activeCornerRadiusRem: number = DEFAULT_CORNER_CUT_REM;
let activeStudioDefaults: StudioDefaultsConfig = { ...DEFAULT_STUDIO_DEFAULTS };
let activeCornerMorph = true;
const listeners = new Set<() => void>();

function notifyMotionListeners(): void {
	for (const fn of listeners) fn();
}

function detectReduced(): boolean {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

export function getActiveMotionSensory(): MotionSensoryConfig {
	return activeMotionSensory;
}

export function setActiveMotionSensory(patch: Partial<MotionSensoryConfig>): MotionSensoryConfig {
	activeMotionSensory = { ...activeMotionSensory, ...patch };
	const reduced = activeMotionConfig.reducedMotionOverride === 'FORCE_OFF'
		|| (activeMotionConfig.reducedMotionOverride === 'AUTO' && detectReduced());
	applyMotionTokensToRoot(activeMotionSensory, reduced);
	notifyMotionListeners();
	return activeMotionSensory;
}

export function setActiveMotionProfile(profile: MotionProfileId): MotionSensoryConfig {
	const nextSpeed = profile === 'REDUCED_ZERO' ? 'INSTANT' : profile === 'SNAPPY' ? 'FAST' : profile === 'BALANCED' ? 'NORMAL' : 'DELIBERATE';
	activeMotionConfig = { ...activeMotionConfig, speed: nextSpeed };
	return setActiveMotionSensory({ profile });
}

export function resolveDurationMs(tier: MotionDurationTier, prefersReduced?: boolean): number {
	const reduced = prefersReduced ?? (
		activeMotionConfig.reducedMotionOverride === 'FORCE_OFF'
		|| (activeMotionConfig.reducedMotionOverride === 'AUTO' && detectReduced())
	);
	return resolveMotionTierMs(tier, activeMotionSensory, reduced);
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
	let sensory = $state<MotionSensoryConfig>({ ...DEFAULT_MOTION_SENSORY });
	activeMotionConfig = initial;
	applyMotionTokensToRoot(sensory, detectReduced());
	return {
		get config(): MotionConfig { return config; },
		get sensory(): MotionSensoryConfig { return sensory; },
		update(patch: Partial<MotionConfig>): MotionConfig { config = setActiveMotionConfig(patch); return config; },
		setProfile(profile: MotionProfileId): MotionSensoryConfig { sensory = setActiveMotionProfile(profile); config = getActiveMotionConfig(); return sensory; },
		updateSensory(patch: Partial<MotionSensoryConfig>): MotionSensoryConfig { sensory = setActiveMotionSensory(patch); return sensory; },
		resolveDurationMs
	};
}

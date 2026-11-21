export type MotionProfileId = 'CALM_SLOW' | 'BALANCED' | 'SNAPPY' | 'REDUCED_ZERO';

export type MotionDurationTier = 'micro' | 'base' | 'morph' | 'ambient';

export type SignalFlowSpeed = 0.25 | 0.5 | 1 | 1.5;

export interface MotionProfileSpec {
	readonly id: MotionProfileId;
	readonly label: string;
	readonly microMs: number;
	readonly baseMs: number;
	readonly morphMs: number;
	readonly ambientMs: number;
	readonly easing: string;
}

export interface MotionSensoryConfig {
	readonly profile: MotionProfileId;
	readonly ambientPulsesEnabled: boolean;
	readonly signalFlowSpeed: SignalFlowSpeed;
	readonly modalMorphEnabled: boolean;
	readonly microDetentsEnabled: boolean;
}

export const MOTION_PROFILES: readonly MotionProfileId[] = [
	'CALM_SLOW', 'BALANCED', 'SNAPPY', 'REDUCED_ZERO'
] as const;

export const SIGNAL_FLOW_SPEEDS: readonly SignalFlowSpeed[] = [0.25, 0.5, 1, 1.5] as const;

export const MOTION_PROFILE_SPECS: Readonly<Record<MotionProfileId, MotionProfileSpec>> = {
	CALM_SLOW: {
		id: 'CALM_SLOW',
		label: 'Calm Slow',
		microMs: 280,
		baseMs: 440,
		morphMs: 580,
		ambientMs: 4200,
		easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
	},
	BALANCED: {
		id: 'BALANCED',
		label: 'Balanced',
		microMs: 180,
		baseMs: 280,
		morphMs: 360,
		ambientMs: 2400,
		easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
	},
	SNAPPY: {
		id: 'SNAPPY',
		label: 'Snappy',
		microMs: 100,
		baseMs: 160,
		morphMs: 220,
		ambientMs: 1400,
		easing: 'cubic-bezier(0.2, 0.9, 0.25, 1)'
	},
	REDUCED_ZERO: {
		id: 'REDUCED_ZERO',
		label: 'Reduced Zero',
		microMs: 0,
		baseMs: 0,
		morphMs: 0,
		ambientMs: 0,
		easing: 'linear'
	}
};

export const DEFAULT_MOTION_SENSORY: MotionSensoryConfig = {
	profile: 'CALM_SLOW',
	ambientPulsesEnabled: false,
	signalFlowSpeed: 0.5,
	modalMorphEnabled: true,
	microDetentsEnabled: true
};

export function resolveMotionTierMs(
	tier: MotionDurationTier,
	sensory: MotionSensoryConfig = DEFAULT_MOTION_SENSORY,
	prefersReduced = false
): number {
	if (prefersReduced || sensory.profile === 'REDUCED_ZERO') return 0;
	const spec = MOTION_PROFILE_SPECS[sensory.profile];
	if (tier === 'micro') return spec.microMs;
	if (tier === 'base') return spec.baseMs;
	if (tier === 'morph') return sensory.modalMorphEnabled ? spec.morphMs : 0;
	const speed = Math.max(0.25, sensory.signalFlowSpeed);
	return Math.round(spec.ambientMs / speed);
}

export function buildMotionCssVars(
	sensory: MotionSensoryConfig = DEFAULT_MOTION_SENSORY,
	prefersReduced = false
): Readonly<Record<string, string>> {
	const spec = prefersReduced ? MOTION_PROFILE_SPECS.REDUCED_ZERO : MOTION_PROFILE_SPECS[sensory.profile];
	const micro = resolveMotionTierMs('micro', sensory, prefersReduced);
	const base = resolveMotionTierMs('base', sensory, prefersReduced);
	const morph = resolveMotionTierMs('morph', sensory, prefersReduced);
	const ambient = resolveMotionTierMs('ambient', sensory, prefersReduced);
	return {
		'--ui-dur-micro': `${micro}ms`,
		'--ui-dur-base': `${base}ms`,
		'--ui-dur-morph': `${morph}ms`,
		'--ui-dur-ambient': `${ambient}ms`,
		'--ui-ease-calm': spec.easing,
		'--ui-ease-out': spec.easing,
		'--ui-detent-scale': sensory.microDetentsEnabled && micro > 0 ? '0.99' : '1'
	};
}

export function applyMotionTokensToRoot(
	sensory: MotionSensoryConfig = DEFAULT_MOTION_SENSORY,
	prefersReduced = false,
	target: HTMLElement | null = typeof document !== 'undefined' ? document.documentElement : null
): void {
	if (!target) return;
	const vars = buildMotionCssVars(sensory, prefersReduced);
	for (const [k, v] of Object.entries(vars)) target.style.setProperty(k, v);
	target.dataset.uiMotionProfile = prefersReduced ? 'REDUCED_ZERO' : sensory.profile;
	target.dataset.uiAmbientPulses = sensory.ambientPulsesEnabled ? 'on' : 'off';
}

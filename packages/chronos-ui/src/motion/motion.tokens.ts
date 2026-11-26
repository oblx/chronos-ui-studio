export type MotionProfileId = 'CALM_SLOW' | 'BALANCED' | 'SNAPPY' | 'REDUCED_ZERO';
export type MotionDurationTier = 'micro' | 'base' | 'morph' | 'ambient';
export type SignalFlowSpeed = 0.25 | 0.5 | 1 | 1.5;
export type MotionSurfaceId = 'MODAL' | 'DRAWER' | 'HUD_ZONE' | 'TOOLTIP' | 'NODE' | 'CONTROL';

export interface MotionDesignTokens {
	readonly durInstantMs: number;
	readonly durFastMs: number;
	readonly durNormalMs: number;
	readonly durDeliberateMs: number;
	readonly easeStandard: string;
	readonly easeEnter: string;
	readonly easeExit: string;
	readonly easeSpring: string;
	readonly staggerZoneMs: number;
	readonly staggerNodeMs: number;
}

export interface MotionSurfaceProfile {
	readonly enterMs: number;
	readonly exitMs: number;
	readonly easing: string;
}

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
	readonly hudZoneStaggerMs?: number;
	readonly surfaces?: Readonly<Partial<Record<MotionSurfaceId, MotionSurfaceProfile>>>;
}

export const MOTION_DESIGN_TOKENS: MotionDesignTokens = {
	durInstantMs: 0,
	durFastMs: 140,
	durNormalMs: 220,
	durDeliberateMs: 360,
	easeStandard: 'cubic-bezier(0.2, 0, 0, 1)',
	easeEnter: 'cubic-bezier(0.16, 1, 0.3, 1)',
	easeExit: 'cubic-bezier(0.4, 0, 1, 1)',
	easeSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
	staggerZoneMs: 250,
	staggerNodeMs: 75
} as const;

export const DEFAULT_SURFACE_MOTION_PROFILES: Readonly<Record<MotionSurfaceId, MotionSurfaceProfile>> = {
	MODAL: { enterMs: 220, exitMs: 160, easing: MOTION_DESIGN_TOKENS.easeEnter },
	DRAWER: { enterMs: 240, exitMs: 180, easing: MOTION_DESIGN_TOKENS.easeStandard },
	HUD_ZONE: { enterMs: 220, exitMs: 160, easing: MOTION_DESIGN_TOKENS.easeEnter },
	TOOLTIP: { enterMs: 120, exitMs: 90, easing: MOTION_DESIGN_TOKENS.easeStandard },
	NODE: { enterMs: 260, exitMs: 180, easing: MOTION_DESIGN_TOKENS.easeSpring },
	CONTROL: { enterMs: 140, exitMs: 110, easing: MOTION_DESIGN_TOKENS.easeStandard }
} as const;

export const MOTION_PROFILES: readonly MotionProfileId[] = ['CALM_SLOW', 'BALANCED', 'SNAPPY', 'REDUCED_ZERO'] as const;
export const MOTION_SURFACES: readonly MotionSurfaceId[] = ['MODAL', 'DRAWER', 'HUD_ZONE', 'TOOLTIP', 'NODE', 'CONTROL'] as const;
export const SURFACE_MOTION_BOUNDS = { minMs: 0, maxMs: 800, stepMs: 40 } as const;
export const SIGNAL_FLOW_SPEEDS: readonly SignalFlowSpeed[] = [0.25, 0.5, 1, 1.5] as const;

export const MOTION_PROFILE_SPECS: Readonly<Record<MotionProfileId, MotionProfileSpec>> = {
	CALM_SLOW: { id: 'CALM_SLOW', label: 'Calm Slow', microMs: 280, baseMs: 440, morphMs: 580, ambientMs: 4200, easing: MOTION_DESIGN_TOKENS.easeEnter },
	BALANCED: { id: 'BALANCED', label: 'Balanced', microMs: 180, baseMs: 280, morphMs: 360, ambientMs: 2400, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
	SNAPPY: { id: 'SNAPPY', label: 'Snappy', microMs: 100, baseMs: 160, morphMs: 220, ambientMs: 1400, easing: 'cubic-bezier(0.2, 0.9, 0.25, 1)' },
	REDUCED_ZERO: { id: 'REDUCED_ZERO', label: 'Reduced Zero', microMs: 0, baseMs: 0, morphMs: 0, ambientMs: 0, easing: 'linear' }
};

export const DEFAULT_MOTION_SENSORY: MotionSensoryConfig = {
	profile: 'CALM_SLOW',
	ambientPulsesEnabled: false,
	signalFlowSpeed: 0.5,
	modalMorphEnabled: true,
	microDetentsEnabled: true,
	hudZoneStaggerMs: MOTION_DESIGN_TOKENS.staggerZoneMs,
	surfaces: DEFAULT_SURFACE_MOTION_PROFILES
};

export function resolveMotionTierMs(tier: MotionDurationTier, sensory: MotionSensoryConfig = DEFAULT_MOTION_SENSORY, prefersReduced = false): number {
	if (prefersReduced || sensory.profile === 'REDUCED_ZERO') return 0;
	const spec = MOTION_PROFILE_SPECS[sensory.profile];
	if (tier === 'micro') return spec.microMs;
	if (tier === 'base') return spec.baseMs;
	if (tier === 'morph') return sensory.modalMorphEnabled ? spec.morphMs : 0;
	return Math.round(spec.ambientMs / Math.max(0.25, sensory.signalFlowSpeed));
}

export function resolveSurfaceMotionMs(surface: MotionSurfaceId, phase: 'enter' | 'exit', sensory: MotionSensoryConfig = DEFAULT_MOTION_SENSORY, prefersReduced = false): number {
	if (prefersReduced || sensory.profile === 'REDUCED_ZERO') return 0;
	const prof = sensory.surfaces?.[surface] ?? DEFAULT_SURFACE_MOTION_PROFILES[surface];
	const scale = sensory.profile === 'SNAPPY' ? 0.7 : sensory.profile === 'BALANCED' ? 0.85 : 1;
	return Math.round((phase === 'enter' ? prof.enterMs : prof.exitMs) * scale);
}

export function buildMotionCssVars(sensory: MotionSensoryConfig = DEFAULT_MOTION_SENSORY, prefersReduced = false): Readonly<Record<string, string>> {
	const reduced = prefersReduced || sensory.profile === 'REDUCED_ZERO';
	const spec = reduced ? MOTION_PROFILE_SPECS.REDUCED_ZERO : MOTION_PROFILE_SPECS[sensory.profile];
	const micro = resolveMotionTierMs('micro', sensory, prefersReduced);
	const base = resolveMotionTierMs('base', sensory, prefersReduced);
	const morph = resolveMotionTierMs('morph', sensory, prefersReduced);
	const ambient = resolveMotionTierMs('ambient', sensory, prefersReduced);
	const modalEnter = sensory.modalMorphEnabled ? resolveSurfaceMotionMs('MODAL', 'enter', sensory, prefersReduced) : 0;
	const modalExit = sensory.modalMorphEnabled ? resolveSurfaceMotionMs('MODAL', 'exit', sensory, prefersReduced) : 0;
	const hudEnter = resolveSurfaceMotionMs('HUD_ZONE', 'enter', sensory, prefersReduced);
	return {
		'--ui-dur-instant': `${MOTION_DESIGN_TOKENS.durInstantMs}ms`,
		'--ui-dur-fast': `${reduced ? 0 : MOTION_DESIGN_TOKENS.durFastMs}ms`,
		'--ui-dur-normal': `${reduced ? 0 : MOTION_DESIGN_TOKENS.durNormalMs}ms`,
		'--ui-dur-deliberate': `${reduced ? 0 : MOTION_DESIGN_TOKENS.durDeliberateMs}ms`,
		'--ui-dur-modal-enter': `${modalEnter}ms`,
		'--ui-dur-modal-exit': `${modalExit}ms`,
		'--ui-dur-hud-enter': `${hudEnter}ms`,
		'--ui-dur-micro': `${micro}ms`,
		'--ui-dur-base': `${base}ms`,
		'--ui-dur-morph': `${morph}ms`,
		'--ui-dur-ambient': `${ambient}ms`,
		'--ui-stagger-zone-ms': `${reduced ? 0 : (sensory.hudZoneStaggerMs ?? MOTION_DESIGN_TOKENS.staggerZoneMs)}ms`,
		'--ui-stagger-node-ms': `${reduced ? 0 : MOTION_DESIGN_TOKENS.staggerNodeMs}ms`,
		'--ui-ease-standard': MOTION_DESIGN_TOKENS.easeStandard,
		'--ui-ease-enter': MOTION_DESIGN_TOKENS.easeEnter,
		'--ui-ease-exit': MOTION_DESIGN_TOKENS.easeExit,
		'--ui-ease-spring': MOTION_DESIGN_TOKENS.easeSpring,
		'--ui-ease-calm': spec.easing,
		'--ui-ease-out': spec.easing,
		'--ui-detent-scale': sensory.microDetentsEnabled && micro > 0 ? '0.98' : '1'
	};
}

export function applyMotionTokensToRoot(
	sensory: MotionSensoryConfig = DEFAULT_MOTION_SENSORY,
	prefersReduced = false,
	target: HTMLElement | null = typeof document !== 'undefined' ? document.documentElement : null
): void {
	if (!target) return;
	for (const [k, v] of Object.entries(buildMotionCssVars(sensory, prefersReduced))) target.style.setProperty(k, v);
	target.dataset.uiMotionProfile = prefersReduced ? 'REDUCED_ZERO' : sensory.profile;
	target.dataset.uiAmbientPulses = sensory.ambientPulsesEnabled ? 'on' : 'off';
}

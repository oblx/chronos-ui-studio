import {
	clamp, STUDIO_KNOB_BOUNDS, STUDIO_KNOB_DEFAULTS,
	type WireTimeScaleCurve
} from '../tokens';

export interface HumanTimeScaleConfig {
	readonly multiplier?: number;
	readonly curve?: WireTimeScaleCurve;
	readonly refreshRateHz?: number;
	readonly minVisibleFrames?: number;
	readonly maxTravelMs?: number;
	readonly logScaleUnitMs?: number;
}

export const TIME_SCALE_PRESETS: readonly number[] = [100, 500, 1000, 2500, 10000, 25000] as const;

export const DEFAULT_HUMAN_TIME_SCALE: Required<HumanTimeScaleConfig> = {
	multiplier: STUDIO_KNOB_DEFAULTS.wireTimeScaleMultiplier,
	curve: STUDIO_KNOB_DEFAULTS.wireTimeScaleCurve,
	refreshRateHz: STUDIO_KNOB_BOUNDS.defaultRefreshRateHz,
	minVisibleFrames: STUDIO_KNOB_BOUNDS.minVisibleFrames,
	maxTravelMs: STUDIO_KNOB_BOUNDS.maxPacketTravelMs,
	logScaleUnitMs: 900
} as const;

export function computeFramePeriodMs(refreshRateHz = DEFAULT_HUMAN_TIME_SCALE.refreshRateHz): number {
	const hz = Number.isFinite(refreshRateHz) && refreshRateHz > 0 ? refreshRateHz : DEFAULT_HUMAN_TIME_SCALE.refreshRateHz;
	return 1000 / hz;
}

export function computePerceptualFloorMs(
	refreshRateHz = DEFAULT_HUMAN_TIME_SCALE.refreshRateHz,
	minVisibleFrames = DEFAULT_HUMAN_TIME_SCALE.minVisibleFrames
): number {
	const frames = Math.max(1, Math.round(minVisibleFrames));
	return Number((frames * computeFramePeriodMs(refreshRateHz)).toFixed(2));
}

export function clampTimeScaleMultiplier(value?: number): number {
	const safe = typeof value === 'number' && Number.isFinite(value) ? value : STUDIO_KNOB_BOUNDS.wireTimeScaleDefault;
	return Math.round(clamp(safe, STUDIO_KNOB_BOUNDS.wireTimeScaleMin, STUDIO_KNOB_BOUNDS.wireTimeScaleMax));
}

export function computeHumanScaledDurationMs(realDurationMs: number, config: HumanTimeScaleConfig = {}): number {
	const safeReal = Number.isFinite(realDurationMs) && realDurationMs > 0 ? realDurationMs : 0.001;
	const multiplier = clampTimeScaleMultiplier(config.multiplier ?? DEFAULT_HUMAN_TIME_SCALE.multiplier);
	const curve = config.curve ?? DEFAULT_HUMAN_TIME_SCALE.curve;
	const minVisibleMs = computePerceptualFloorMs(
		config.refreshRateHz ?? DEFAULT_HUMAN_TIME_SCALE.refreshRateHz,
		config.minVisibleFrames ?? DEFAULT_HUMAN_TIME_SCALE.minVisibleFrames
	);
	const maxTravelMs = Math.max(minVisibleMs, config.maxTravelMs ?? DEFAULT_HUMAN_TIME_SCALE.maxTravelMs);
	const rawScaled = safeReal * multiplier;
	if (curve === 'LOGARITHMIC') {
		const unit = config.logScaleUnitMs ?? DEFAULT_HUMAN_TIME_SCALE.logScaleUnitMs;
		const scaled = minVisibleMs + Math.log10(1 + Math.pow(rawScaled / 250, 1.8)) * unit;
		return Number(clamp(scaled, minVisibleMs, maxTravelMs).toFixed(2));
	}
	return Number(clamp(rawScaled, minVisibleMs, maxTravelMs).toFixed(2));
}

export function formatSubMsDuration(ms?: number): string {
	const val = typeof ms === 'number' && Number.isFinite(ms) ? ms : 0;
	if (val < 0.01) return '< 0.01ms';
	if (val < 10) return `${val.toFixed(2)}ms`;
	return `${val.toFixed(1)}ms`;
}

export function computeMarqueeDurationMs(
	overflowPx: number,
	speedPxPerSec: number = STUDIO_KNOB_DEFAULTS.marqueeSpeedPxPerSec,
	pauseRatio: number = STUDIO_KNOB_DEFAULTS.marqueePauseRatio
): number {
	if (!Number.isFinite(overflowPx) || overflowPx <= 0) return 0;
	const speed = clamp(speedPxPerSec, STUDIO_KNOB_BOUNDS.marqueeSpeedMin, STUDIO_KNOB_BOUNDS.marqueeSpeedMax);
	const pause = clamp(pauseRatio, STUDIO_KNOB_BOUNDS.marqueePauseMin, STUDIO_KNOB_BOUNDS.marqueePauseMax);
	const travelMs = (overflowPx / speed) * 1000;
	const activeFraction = Math.max(0.2, 1 - 2 * pause);
	return Math.round(travelMs / activeFraction);
}

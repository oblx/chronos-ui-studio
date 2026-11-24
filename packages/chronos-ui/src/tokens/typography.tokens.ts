import type { CornerKind } from './corners.geometry';
import {
	clamp, CONTROL_CUT_LIMITS, CORNER_RADIUS_LIMITS, DEFAULT_CONTROL_CORNER_CUT_REM, DEFAULT_CORNER_CUT_REM,
	DEFAULT_STATION_CORNER_CUT_REM, ORNAMENT_LIMITS, STUDIO_DEFAULTS_VERSION
} from './hud.constants';

export type FontScalePercent = 85 | 100 | 115 | 130;
export type BorderStrokePx = 1 | 1.5 | 2;
export type PerimeterGutterRem = 0.5 | 0.75 | 1;
export type AutoSaveMode = 'OFF' | 'ON_COMMIT' | 'DEBOUNCED_3S';

export const FONT_SCALE_OPTIONS: readonly FontScalePercent[] = [85, 100, 115, 130] as const;
export const BORDER_STROKE_OPTIONS: readonly BorderStrokePx[] = [1, 1.5, 2] as const;
export const PERIMETER_GUTTER_OPTIONS: readonly PerimeterGutterRem[] = [0.5, 0.75, 1] as const;
export const AUTO_SAVE_MODES: readonly AutoSaveMode[] = ['OFF', 'ON_COMMIT', 'DEBOUNCED_3S'] as const;

export interface AccessibilityPrefs {
	readonly fontScale: FontScalePercent;
	readonly cornerMode: CornerKind;
	readonly cornerRadiusRem: number;
	readonly highContrast: boolean;
	readonly kineticMotion: boolean;
	readonly dyslexiaSpacing: boolean;
}

export interface StudioDefaultsConfig {
	readonly defaultsVersion?: number;
	readonly baseCornerCutRem: number;
	readonly stationCornerCutRem: number;
	readonly controlCornerCutRem: number;
	readonly borderStrokePx: BorderStrokePx;
	readonly ornamentOffsetRem: number;
	readonly ornamentDriftAmpRem: number;
	readonly ornamentPeriodMs: number;
	readonly perimeterGutterRem: PerimeterGutterRem;
	readonly autoSaveMode: AutoSaveMode;
}

export const DEFAULT_ACCESSIBILITY_PREFS: AccessibilityPrefs = {
	fontScale: 100,
	cornerMode: 'CHAMFER',
	cornerRadiusRem: DEFAULT_CORNER_CUT_REM,
	highContrast: false,
	kineticMotion: true,
	dyslexiaSpacing: false
} as const;

export const DEFAULT_STUDIO_DEFAULTS: StudioDefaultsConfig = {
	defaultsVersion: STUDIO_DEFAULTS_VERSION,
	baseCornerCutRem: DEFAULT_CORNER_CUT_REM,
	stationCornerCutRem: DEFAULT_STATION_CORNER_CUT_REM,
	controlCornerCutRem: DEFAULT_CONTROL_CORNER_CUT_REM,
	borderStrokePx: 1.5,
	ornamentOffsetRem: ORNAMENT_LIMITS.defaultOffsetRem,
	ornamentDriftAmpRem: ORNAMENT_LIMITS.defaultAmpRem,
	ornamentPeriodMs: ORNAMENT_LIMITS.defaultPeriodMs,
	perimeterGutterRem: 0.75,
	autoSaveMode: 'OFF'
} as const;

const snapStep = (v: number, min: number, max: number, step: number): number =>
	Number((Math.round(clamp(v, min, max) / step) * step).toFixed(4));

export function clampCornerRadiusRem(value?: number): number {
	const safe = typeof value === 'number' && Number.isFinite(value) ? value : CORNER_RADIUS_LIMITS.defaultRem;
	return snapStep(safe, CORNER_RADIUS_LIMITS.minRem, CORNER_RADIUS_LIMITS.maxRem, CORNER_RADIUS_LIMITS.stepRem);
}

export function clampControlCutRem(value?: number): number {
	const safe = typeof value === 'number' && Number.isFinite(value) ? value : CONTROL_CUT_LIMITS.defaultRem;
	return snapStep(safe, CONTROL_CUT_LIMITS.minRem, CONTROL_CUT_LIMITS.maxRem, CONTROL_CUT_LIMITS.stepRem);
}

export function clampStudioDefaults(
	patch?: Partial<StudioDefaultsConfig>,
	base: StudioDefaultsConfig = DEFAULT_STUDIO_DEFAULTS
): StudioDefaultsConfig {
	if (!patch) return { ...base, defaultsVersion: base.defaultsVersion ?? STUDIO_DEFAULTS_VERSION };
	const stroke = BORDER_STROKE_OPTIONS.includes(patch.borderStrokePx as BorderStrokePx) ? patch.borderStrokePx! : base.borderStrokePx;
	const gutter = PERIMETER_GUTTER_OPTIONS.includes(patch.perimeterGutterRem as PerimeterGutterRem) ? patch.perimeterGutterRem! : base.perimeterGutterRem;
	const save = AUTO_SAVE_MODES.includes(patch.autoSaveMode as AutoSaveMode) ? patch.autoSaveMode! : base.autoSaveMode;
	return {
		defaultsVersion: patch.defaultsVersion ?? base.defaultsVersion ?? STUDIO_DEFAULTS_VERSION,
		baseCornerCutRem: patch.baseCornerCutRem !== undefined ? clampCornerRadiusRem(patch.baseCornerCutRem) : base.baseCornerCutRem,
		stationCornerCutRem: patch.stationCornerCutRem !== undefined ? clampCornerRadiusRem(patch.stationCornerCutRem) : base.stationCornerCutRem,
		controlCornerCutRem: patch.controlCornerCutRem !== undefined ? clampControlCutRem(patch.controlCornerCutRem) : base.controlCornerCutRem,
		borderStrokePx: stroke,
		ornamentOffsetRem: patch.ornamentOffsetRem !== undefined ? snapStep(patch.ornamentOffsetRem, ORNAMENT_LIMITS.minOffsetRem, ORNAMENT_LIMITS.maxOffsetRem, ORNAMENT_LIMITS.stepOffsetRem) : base.ornamentOffsetRem,
		ornamentDriftAmpRem: patch.ornamentDriftAmpRem !== undefined ? snapStep(patch.ornamentDriftAmpRem, ORNAMENT_LIMITS.minAmpRem, ORNAMENT_LIMITS.maxAmpRem, ORNAMENT_LIMITS.stepOffsetRem) : base.ornamentDriftAmpRem,
		ornamentPeriodMs: patch.ornamentPeriodMs !== undefined ? snapStep(patch.ornamentPeriodMs, ORNAMENT_LIMITS.minPeriodMs, ORNAMENT_LIMITS.maxPeriodMs, ORNAMENT_LIMITS.stepPeriodMs) : base.ornamentPeriodMs,
		perimeterGutterRem: gutter,
		autoSaveMode: save
	};
}

export function applyAccessibilityPrefs(
	prefs: AccessibilityPrefs,
	target: HTMLElement | null = typeof document !== 'undefined' ? document.documentElement : null
): void {
	if (!target) return;
	const radiusRem = prefs.cornerMode === 'STRAIGHT' ? 0 : clampCornerRadiusRem(prefs.cornerRadiusRem ?? DEFAULT_CORNER_CUT_REM);
	target.style.setProperty('--ui-font-scale', String(prefs.fontScale / 100));
	target.style.setProperty('--ui-corner-cut', `${radiusRem}rem`);
	target.setAttribute('data-ui-corner', prefs.cornerMode);
	target.setAttribute('data-ui-contrast', prefs.highContrast ? 'aaa' : 'aa');
	target.setAttribute('data-ui-motion', prefs.kineticMotion ? 'kinetic' : 'reduced');
	target.setAttribute('data-ui-dyslexia', prefs.dyslexiaSpacing ? 'on' : 'off');
}

export function applyStudioDefaults(
	defaults: StudioDefaultsConfig,
	target: HTMLElement | null = typeof document !== 'undefined' ? document.documentElement : null
): void {
	if (!target) return;
	target.style.setProperty('--ui-corner-cut', `${defaults.baseCornerCutRem}rem`);
	target.style.setProperty('--ui-station-cut', `${defaults.stationCornerCutRem}rem`);
	target.style.setProperty('--ui-control-cut', `${defaults.controlCornerCutRem}rem`);
	target.style.setProperty('--ui-stroke-w', `${defaults.borderStrokePx}px`);
	target.style.setProperty('--ui-hairline', `${defaults.borderStrokePx}px`);
	target.style.setProperty('--ui-orn-offset', `${defaults.ornamentOffsetRem}rem`);
	target.style.setProperty('--ui-orn-amp', `${defaults.ornamentDriftAmpRem}rem`);
	target.style.setProperty('--ui-orn-period', `${defaults.ornamentPeriodMs}ms`);
	target.style.setProperty('--ui-perimeter-gutter', `${defaults.perimeterGutterRem}rem`);
}

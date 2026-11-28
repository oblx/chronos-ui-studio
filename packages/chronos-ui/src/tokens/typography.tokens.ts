import {
	applyControlConfigToRoot, clampControlConfig, clampHistoryLimit, clampTooltipInfoLevel,
	DEFAULT_CONTROL_CONFIG, HISTORY_LIMIT_BOUNDS, HUD_STAGGER_BOUNDS, TOOLTIP_LEVEL_BOUNDS,
	type StudioControlConfig
} from './control.tokens';
import type { CornerKind } from './geometry';
import {
	clamp, CONTROL_CUT_LIMITS, CORNER_RADIUS_LIMITS, DEFAULT_CONTROL_CORNER_CUT_REM, DEFAULT_CORNER_CUT_REM,
	DEFAULT_STATION_CORNER_CUT_REM, GRAPH_EDGE_ROUTINGS, ORNAMENT_LIMITS, STUDIO_DEFAULTS_VERSION,
	STUDIO_KNOB_BOUNDS, STUDIO_KNOB_DEFAULTS, WIRE_TIME_SCALE_CURVES,
	type GraphEdgeRouting, type WireTimeScaleCurve
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
	readonly baseCornerCutRem: number; readonly stationCornerCutRem: number; readonly controlCornerCutRem: number;
	readonly borderStrokePx: BorderStrokePx; readonly ornamentOffsetRem: number; readonly ornamentDriftAmpRem: number;
	readonly ornamentPeriodMs: number; readonly perimeterGutterRem: PerimeterGutterRem; readonly autoSaveMode: AutoSaveMode;
	readonly tooltipInfoLevel?: number; readonly historyLimit?: number; readonly hudZoneStaggerMs?: number;
	readonly wireTimeScaleMultiplier?: number; readonly wireTimeScaleCurve?: WireTimeScaleCurve;
	readonly marqueeSpeedPxPerSec?: number; readonly marqueePauseRatio?: number;
	readonly graphRouting?: GraphEdgeRouting; readonly graphPacketSizePx?: number;
	readonly cursorDragTargetFrames?: boolean; readonly controlConfig?: StudioControlConfig;
	readonly shortcutOverrides?: Readonly<Record<string, string>>;
}

export const DEFAULT_ACCESSIBILITY_PREFS: AccessibilityPrefs = {
	fontScale: 100, cornerMode: 'CHAMFER', cornerRadiusRem: DEFAULT_CORNER_CUT_REM,
	highContrast: false, kineticMotion: true, dyslexiaSpacing: false
} as const;

export const DEFAULT_STUDIO_DEFAULTS: StudioDefaultsConfig = {
	defaultsVersion: STUDIO_DEFAULTS_VERSION, baseCornerCutRem: DEFAULT_CORNER_CUT_REM,
	stationCornerCutRem: DEFAULT_STATION_CORNER_CUT_REM, controlCornerCutRem: DEFAULT_CONTROL_CORNER_CUT_REM,
	borderStrokePx: 1.5, ornamentOffsetRem: ORNAMENT_LIMITS.defaultOffsetRem,
	ornamentDriftAmpRem: ORNAMENT_LIMITS.defaultAmpRem, ornamentPeriodMs: ORNAMENT_LIMITS.defaultPeriodMs,
	perimeterGutterRem: 0.75, autoSaveMode: 'OFF', tooltipInfoLevel: TOOLTIP_LEVEL_BOUNDS.defaultLevel,
	historyLimit: HISTORY_LIMIT_BOUNDS.defaultLimit, ...STUDIO_KNOB_DEFAULTS, controlConfig: DEFAULT_CONTROL_CONFIG
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

const clampStaggerMs = (v?: number): number =>
	snapStep(v ?? HUD_STAGGER_BOUNDS.defaultMs, HUD_STAGGER_BOUNDS.minMs, HUD_STAGGER_BOUNDS.maxMs, HUD_STAGGER_BOUNDS.stepMs);

function clampKnobFields(p: Partial<StudioDefaultsConfig>, b: StudioDefaultsConfig) {
	const kb = STUDIO_KNOB_BOUNDS;
	const curve = p.wireTimeScaleCurve ?? b.wireTimeScaleCurve;
	const routing = p.graphRouting ?? b.graphRouting;
	return {
		wireTimeScaleMultiplier: Math.round(clamp(p.wireTimeScaleMultiplier ?? b.wireTimeScaleMultiplier ?? kb.wireTimeScaleDefault, kb.wireTimeScaleMin, kb.wireTimeScaleMax)),
		wireTimeScaleCurve: WIRE_TIME_SCALE_CURVES.includes(curve as WireTimeScaleCurve) ? (curve as WireTimeScaleCurve) : STUDIO_KNOB_DEFAULTS.wireTimeScaleCurve,
		marqueeSpeedPxPerSec: snapStep(p.marqueeSpeedPxPerSec ?? b.marqueeSpeedPxPerSec ?? kb.marqueeSpeedDefault, kb.marqueeSpeedMin, kb.marqueeSpeedMax, kb.marqueeSpeedStep),
		marqueePauseRatio: snapStep(p.marqueePauseRatio ?? b.marqueePauseRatio ?? kb.marqueePauseDefault, kb.marqueePauseMin, kb.marqueePauseMax, kb.marqueePauseStep),
		graphRouting: GRAPH_EDGE_ROUTINGS.includes(routing as GraphEdgeRouting) ? (routing as GraphEdgeRouting) : STUDIO_KNOB_DEFAULTS.graphRouting,
		graphPacketSizePx: snapStep(p.graphPacketSizePx ?? b.graphPacketSizePx ?? kb.graphPacketSizeDefault, kb.graphPacketSizeMin, kb.graphPacketSizeMax, kb.graphPacketSizeStep),
		cursorDragTargetFrames: typeof p.cursorDragTargetFrames === 'boolean' ? p.cursorDragTargetFrames : (b.cursorDragTargetFrames ?? STUDIO_KNOB_DEFAULTS.cursorDragTargetFrames)
	};
}

export function clampStudioDefaults(patch?: Partial<StudioDefaultsConfig>, base: StudioDefaultsConfig = DEFAULT_STUDIO_DEFAULTS): StudioDefaultsConfig {
	const baseControl = base.controlConfig ?? DEFAULT_CONTROL_CONFIG;
	const p = patch ?? {};
	return {
		defaultsVersion: p.defaultsVersion ?? base.defaultsVersion ?? STUDIO_DEFAULTS_VERSION,
		baseCornerCutRem: p.baseCornerCutRem !== undefined ? clampCornerRadiusRem(p.baseCornerCutRem) : base.baseCornerCutRem,
		stationCornerCutRem: p.stationCornerCutRem !== undefined ? clampCornerRadiusRem(p.stationCornerCutRem) : base.stationCornerCutRem,
		controlCornerCutRem: p.controlCornerCutRem !== undefined ? clampControlCutRem(p.controlCornerCutRem) : base.controlCornerCutRem,
		borderStrokePx: BORDER_STROKE_OPTIONS.includes(p.borderStrokePx as BorderStrokePx) ? p.borderStrokePx! : base.borderStrokePx,
		ornamentOffsetRem: p.ornamentOffsetRem !== undefined ? snapStep(p.ornamentOffsetRem, ORNAMENT_LIMITS.minOffsetRem, ORNAMENT_LIMITS.maxOffsetRem, ORNAMENT_LIMITS.stepOffsetRem) : base.ornamentOffsetRem,
		ornamentDriftAmpRem: p.ornamentDriftAmpRem !== undefined ? snapStep(p.ornamentDriftAmpRem, ORNAMENT_LIMITS.minAmpRem, ORNAMENT_LIMITS.maxAmpRem, ORNAMENT_LIMITS.stepOffsetRem) : base.ornamentDriftAmpRem,
		ornamentPeriodMs: p.ornamentPeriodMs !== undefined ? snapStep(p.ornamentPeriodMs, ORNAMENT_LIMITS.minPeriodMs, ORNAMENT_LIMITS.maxPeriodMs, ORNAMENT_LIMITS.stepPeriodMs) : base.ornamentPeriodMs,
		perimeterGutterRem: PERIMETER_GUTTER_OPTIONS.includes(p.perimeterGutterRem as PerimeterGutterRem) ? p.perimeterGutterRem! : base.perimeterGutterRem,
		autoSaveMode: AUTO_SAVE_MODES.includes(p.autoSaveMode as AutoSaveMode) ? p.autoSaveMode! : base.autoSaveMode,
		tooltipInfoLevel: clampTooltipInfoLevel(p.tooltipInfoLevel ?? base.tooltipInfoLevel),
		historyLimit: clampHistoryLimit(p.historyLimit ?? base.historyLimit),
		hudZoneStaggerMs: clampStaggerMs(p.hudZoneStaggerMs ?? base.hudZoneStaggerMs),
		...clampKnobFields(p, base),
		controlConfig: p.controlConfig ? clampControlConfig(p.controlConfig, baseControl) : clampControlConfig(undefined, baseControl),
		shortcutOverrides: p.shortcutOverrides ?? base.shortcutOverrides ?? {}
	};
}

export function applyAccessibilityPrefs(prefs: AccessibilityPrefs, target: HTMLElement | null = typeof document !== 'undefined' ? document.documentElement : null): void {
	if (!target) return;
	const radiusRem = prefs.cornerMode === 'STRAIGHT' ? 0 : clampCornerRadiusRem(prefs.cornerRadiusRem ?? DEFAULT_CORNER_CUT_REM);
	target.style.setProperty('--ui-font-scale', String(prefs.fontScale / 100));
	target.style.setProperty('--ui-corner-cut', `${radiusRem}rem`);
	target.setAttribute('data-ui-corner', prefs.cornerMode);
	target.setAttribute('data-ui-contrast', prefs.highContrast ? 'aaa' : 'aa');
	target.setAttribute('data-ui-motion', prefs.kineticMotion ? 'kinetic' : 'reduced');
	target.setAttribute('data-ui-dyslexia', prefs.dyslexiaSpacing ? 'on' : 'off');
}

export function buildStudioDefaultCssVars(d: StudioDefaultsConfig): Readonly<Record<string, string>> {
	return {
		'--ui-corner-cut': `${d.baseCornerCutRem}rem`, '--ui-station-cut': `${d.stationCornerCutRem}rem`,
		'--ui-control-cut': `${d.controlCornerCutRem}rem`, '--ui-stroke-w': `${d.borderStrokePx}px`,
		'--ui-hairline': `${d.borderStrokePx}px`, '--ui-orn-offset': `${d.ornamentOffsetRem}rem`,
		'--ui-orn-amp': `${d.ornamentDriftAmpRem}rem`, '--ui-orn-period': `${d.ornamentPeriodMs}ms`,
		'--ui-perimeter-gutter': `${d.perimeterGutterRem}rem`, '--ui-stagger-zone-ms': `${d.hudZoneStaggerMs ?? HUD_STAGGER_BOUNDS.defaultMs}ms`,
		'--ui-marquee-speed': `${d.marqueeSpeedPxPerSec ?? STUDIO_KNOB_DEFAULTS.marqueeSpeedPxPerSec}`,
		'--ui-marquee-pause': `${d.marqueePauseRatio ?? STUDIO_KNOB_DEFAULTS.marqueePauseRatio}`,
		'--ui-wire-timescale': `${d.wireTimeScaleMultiplier ?? STUDIO_KNOB_DEFAULTS.wireTimeScaleMultiplier}`,
		'--ui-graph-packet-size': `${d.graphPacketSizePx ?? STUDIO_KNOB_DEFAULTS.graphPacketSizePx}px`
	};
}

export function applyStudioDefaults(defaults: StudioDefaultsConfig, target: HTMLElement | null = typeof document !== 'undefined' ? document.documentElement : null): void {
	if (!target) return;
	for (const [k, v] of Object.entries(buildStudioDefaultCssVars(defaults))) target.style.setProperty(k, v);
	applyControlConfigToRoot(defaults.controlConfig ?? DEFAULT_CONTROL_CONFIG, target);
}

export const VERSION = '0.1.3' as const;
export const STUDIO_DEFAULTS_VERSION = 3 as const;

export type WireTimeScaleCurve = 'LINEAR' | 'LOGARITHMIC';
export type GraphEdgeRouting = 'BEZIER' | 'ORTHOGONAL' | 'STEP';

export const WIRE_TIME_SCALE_CURVES: readonly WireTimeScaleCurve[] = ['LINEAR', 'LOGARITHMIC'] as const;
export const GRAPH_EDGE_ROUTINGS: readonly GraphEdgeRouting[] = ['BEZIER', 'ORTHOGONAL', 'STEP'] as const;

export const STUDIO_KNOB_BOUNDS = {
	wireTimeScaleMin: 100, wireTimeScaleMax: 25000, wireTimeScaleStep: 100, wireTimeScaleDefault: 2500,
	marqueeSpeedMin: 16, marqueeSpeedMax: 120, marqueeSpeedStep: 4, marqueeSpeedDefault: 48,
	marqueePauseMin: 0.05, marqueePauseMax: 0.3, marqueePauseStep: 0.05, marqueePauseDefault: 0.15,
	graphPacketSizeMin: 4, graphPacketSizeMax: 12, graphPacketSizeStep: 1, graphPacketSizeDefault: 6,
	maxPacketTravelMs: 4000, defaultRefreshRateHz: 60, minVisibleFrames: 12
} as const;

export const STUDIO_KNOB_DEFAULTS = {
	wireTimeScaleMultiplier: STUDIO_KNOB_BOUNDS.wireTimeScaleDefault,
	wireTimeScaleCurve: 'LINEAR' as WireTimeScaleCurve,
	marqueeSpeedPxPerSec: STUDIO_KNOB_BOUNDS.marqueeSpeedDefault,
	marqueePauseRatio: STUDIO_KNOB_BOUNDS.marqueePauseDefault,
	hudZoneStaggerMs: 250,
	graphRouting: 'BEZIER' as GraphEdgeRouting,
	graphPacketSizePx: STUDIO_KNOB_BOUNDS.graphPacketSizeDefault,
	cursorDragTargetFrames: true
} as const;

export type HudZoneId =
	| 'WORLD_CANVAS' | 'TOP_LEFT' | 'TOP_CENTER' | 'PROJECT_TAB_DECK' | 'TOP_RIGHT'
	| 'RIGHT_EDGE' | 'BOTTOM_RIGHT' | 'MODAL_OVERLAY_STACK' | 'BOTTOM_CENTER' | 'BOTTOM_LEFT' | 'LEFT_EDGE';

export const HUD_ZONES: readonly HudZoneId[] = [
	'WORLD_CANVAS', 'TOP_LEFT', 'TOP_CENTER', 'PROJECT_TAB_DECK', 'TOP_RIGHT',
	'RIGHT_EDGE', 'BOTTOM_RIGHT', 'MODAL_OVERLAY_STACK', 'BOTTOM_CENTER', 'BOTTOM_LEFT', 'LEFT_EDGE'
] as const;

export type ViewportTier = 'PHONE' | 'TABLET_PORTRAIT' | 'TABLET_LANDSCAPE' | 'DESKTOP' | 'WQHD_UWQHD';

export const BREAKPOINT_REM = { phoneMax: 48, tabletPortraitMax: 64, tabletLandscapeMax: 80, desktopMax: 120 } as const;

export const Z_LAYERS = {
	paintedClientCanvas: 10, stagingBuildOverlay: 20, studioChrome: 40,
	assistantDock: 38, modals: 70, overlays: 90
} as const;

export const HUD_METRICS = {
	topBandRem: 6.25, bottomDockRem: 8.25, edgeRailWidthRem: 3, closeButtonRem: 2.25,
	utilityButtonRem: 2, sideTrackClamp: 'clamp(15.5rem, 20vw, 22.5rem)', corridorMaxRem: 90,
	dragThresholdPx: 5, modalTweenMs: 440, stageMorphMs: 440, wheelSettleMs: 180,
	sampleStepMs: 75, stickDeadzone: 0.18, assistantWidthRem: 44, assistantExpandedReserveRem: 21,
	viewportMarginRem: 0.75, countdownTickMs: 100, refreshGraceMs: 3000, toastAutoDismissMs: 3500,
	probeCacheTtlMs: 15000, sonarPingMs: 600, glitterBurstMs: 2400, wheelZoomStep: 0.06,
	buttonZoomStep: 0.12, perimeterGapPx: 8, ringCapacity: 256, maxToasts: 4
} as const;

export const SAFE_CORRIDOR_REM = {
	calmTop: 4.5, calmBottom: 5.25, calmSide: 4.5,
	hudTop: 7.75, hudBottom: 8.75, hudSide: 4.5
} as const;

export const DEFAULT_VIEWPORT = { width: 1440, height: 900, minSafeW: 390, minSafeH: 300 } as const;
export const DEFAULT_CORNER_CUT_REM = 0.5;
export const DEFAULT_STATION_CORNER_CUT_REM = 0.75;
export const DEFAULT_CONTROL_CORNER_CUT_REM = 0.3125;
export const CONTROL_MAX_CUT_RATIO = 0.28;
export const PEER_STALE_MS = 30000;
export const ROOT_FONT_PX = 16;

export const CORNER_RADIUS_LIMITS = { minRem: 0.25, maxRem: 1.5, stepRem: 0.0625, defaultRem: DEFAULT_CORNER_CUT_REM } as const;
export const CONTROL_CUT_LIMITS = { minRem: 0.125, maxRem: 0.5, stepRem: 0.0625, defaultRem: DEFAULT_CONTROL_CORNER_CUT_REM } as const;

export const ORNAMENT_LIMITS = {
	minOffsetRem: 0, maxOffsetRem: 0.5, stepOffsetRem: 0.0625, defaultOffsetRem: 0.1875,
	minAmpRem: 0.0625, maxAmpRem: 0.5, defaultAmpRem: 0.25,
	minPeriodMs: 1200, maxPeriodMs: 5000, stepPeriodMs: 200, defaultPeriodMs: 2800
} as const;

export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

export function remToPx(rem: number): number {
	return Math.round(rem * ROOT_FONT_PX);
}

export function pxToRem(px: number, digits = 3): number {
	return Number((px / ROOT_FONT_PX).toFixed(digits));
}

export function clampControlCutPx(cutPx: number, heightPx: number, maxRatio = CONTROL_MAX_CUT_RATIO): number {
	if (cutPx <= 0 || heightPx <= 0) return 0;
	return clamp(cutPx, 0, Math.floor(heightPx * maxRatio));
}

export const BILATERAL_ZONE_TWINS: Readonly<Partial<Record<HudZoneId, HudZoneId>>> = {
	TOP_LEFT: 'TOP_RIGHT', TOP_RIGHT: 'TOP_LEFT',
	LEFT_EDGE: 'RIGHT_EDGE', RIGHT_EDGE: 'LEFT_EDGE',
	BOTTOM_LEFT: 'BOTTOM_RIGHT', BOTTOM_RIGHT: 'BOTTOM_LEFT'
};

export function findOppositeZone(zoneId: HudZoneId): HudZoneId | null {
	return BILATERAL_ZONE_TWINS[zoneId] ?? null;
}

export const CURSOR_LIMITS = {
	maxBytes: 131072, maxKb: 128, minDim: 4, maxDim: 256,
	normalizedPx: 32, centerHotspot: 16, autoScaleAbovePx: 48,
	defaultHotspotX: 3, defaultHotspotY: 2, maxHotspot: 31
} as const;

export const STAGE_LIMITS = {
	railOffsetPx: 140, floatMarginLeftPx: 24, floatMarginTopPx: 112,
	floatPadRightPx: 360, floatPadBottomPx: 280, defaultMaxWidthPx: 1080,
	defaultMaxHeightPx: 620, panMaxX: 600, panMaxY: 400, zoomMin: 0.45, zoomMax: 2.2,
	desktopMinPx: 768, railOccupiedPx: 72,
	mobileEdgePx: 16, minFreeWidthPx: 280, freeWidthGutterPx: 32
} as const;

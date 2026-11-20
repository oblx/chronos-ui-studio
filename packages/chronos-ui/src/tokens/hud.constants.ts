export const VERSION = '0.0.7' as const;

export type HudZoneId =
	| 'WORLD_CANVAS'
	| 'TOP_LEFT'
	| 'TOP_CENTER'
	| 'PROJECT_TAB_DECK'
	| 'TOP_RIGHT'
	| 'RIGHT_EDGE'
	| 'BOTTOM_RIGHT'
	| 'MODAL_OVERLAY_STACK'
	| 'BOTTOM_CENTER'
	| 'BOTTOM_LEFT'
	| 'LEFT_EDGE';

export const HUD_ZONES: readonly HudZoneId[] = [
	'WORLD_CANVAS',
	'TOP_LEFT',
	'TOP_CENTER',
	'PROJECT_TAB_DECK',
	'TOP_RIGHT',
	'RIGHT_EDGE',
	'BOTTOM_RIGHT',
	'MODAL_OVERLAY_STACK',
	'BOTTOM_CENTER',
	'BOTTOM_LEFT',
	'LEFT_EDGE'
] as const;

export type ViewportTier =
	| 'PHONE'
	| 'TABLET_PORTRAIT'
	| 'TABLET_LANDSCAPE'
	| 'DESKTOP'
	| 'WQHD_UWQHD';

export const BREAKPOINT_REM = {
	phoneMax: 48,
	tabletPortraitMax: 64,
	tabletLandscapeMax: 80,
	desktopMax: 120
} as const;

export const Z_LAYERS = {
	paintedClientCanvas: 10,
	stagingBuildOverlay: 20,
	studioChrome: 40,
	assistantDock: 45,
	modals: 70,
	overlays: 90
} as const;

export const HUD_METRICS = {
	topBandRem: 6.25,
	bottomDockRem: 8.25,
	edgeRailWidthRem: 3,
	closeButtonRem: 2.25,
	utilityButtonRem: 2,
	sideTrackClamp: 'clamp(15.5rem, 20vw, 22.5rem)',
	corridorMaxRem: 90,
	dragThresholdPx: 5,
	modalTweenMs: 220,
	stageMorphMs: 220,
	sampleStepMs: 75,
	stickDeadzone: 0.18,
	assistantWidthRem: 44,
	viewportMarginRem: 1,
	countdownTickMs: 100,
	refreshGraceMs: 3000,
	toastAutoDismissMs: 3500,
	probeCacheTtlMs: 15000,
	sonarPingMs: 600,
	ringCapacity: 256,
	maxToasts: 4
} as const;

export const SAFE_CORRIDOR_REM = {
	calmTop: 4.25,
	calmBottom: 4.5,
	calmSide: 1,
	hudTop: 7,
	hudBottom: 9,
	hudSide: 3.75
} as const;

export const DEFAULT_VIEWPORT = {
	width: 1440,
	height: 900,
	minSafeW: 390,
	minSafeH: 300
} as const;

export const CORNER_RADIUS_LIMITS = {
	minRem: 0.25,
	maxRem: 1.5,
	stepRem: 0.0625,
	defaultRem: 0.75
} as const;

export const ROOT_FONT_PX = 16;

export function remToPx(rem: number): number {
	return Math.round(rem * ROOT_FONT_PX);
}

export function pxToRem(px: number, digits = 3): number {
	return Number((px / ROOT_FONT_PX).toFixed(digits));
}

export const BILATERAL_ZONE_TWINS: Readonly<Partial<Record<HudZoneId, HudZoneId>>> = {
	TOP_LEFT: 'TOP_RIGHT',
	TOP_RIGHT: 'TOP_LEFT',
	LEFT_EDGE: 'RIGHT_EDGE',
	RIGHT_EDGE: 'LEFT_EDGE',
	BOTTOM_LEFT: 'BOTTOM_RIGHT',
	BOTTOM_RIGHT: 'BOTTOM_LEFT'
};

export function findOppositeZone(zoneId: HudZoneId): HudZoneId | null {
	return BILATERAL_ZONE_TWINS[zoneId] ?? null;
}

export const CURSOR_LIMITS = {
	maxBytes: 131072,
	maxKb: 128,
	minDim: 4,
	maxDim: 256,
	normalizedPx: 32,
	centerHotspot: 16,
	autoScaleAbovePx: 48,
	defaultHotspotX: 3,
	defaultHotspotY: 2,
	maxHotspot: 31
} as const;

export const STAGE_LIMITS = {
	railOffsetPx: 140,
	floatMarginLeftPx: 24,
	floatMarginTopPx: 112,
	floatPadRightPx: 360,
	floatPadBottomPx: 280,
	defaultMaxWidthPx: 1080,
	defaultMaxHeightPx: 620,
	panMaxX: 600,
	panMaxY: 400,
	zoomMin: 0.45,
	zoomMax: 2.2
} as const;

import type { CornerKind } from './corners.geometry';
import { CORNER_RADIUS_LIMITS } from './hud.constants';

export type FontScalePercent = 85 | 100 | 115 | 130;

export const FONT_SCALE_OPTIONS: readonly FontScalePercent[] = [85, 100, 115, 130] as const;

export interface AccessibilityPrefs {
	readonly fontScale: FontScalePercent;
	readonly cornerMode: CornerKind;
	readonly cornerRadiusRem: number;
	readonly highContrast: boolean;
	readonly kineticMotion: boolean;
	readonly dyslexiaSpacing: boolean;
}

export const DEFAULT_ACCESSIBILITY_PREFS: AccessibilityPrefs = {
	fontScale: 100,
	cornerMode: 'CHAMFER',
	cornerRadiusRem: CORNER_RADIUS_LIMITS.defaultRem,
	highContrast: false,
	kineticMotion: true,
	dyslexiaSpacing: false
} as const;

export function clampCornerRadiusRem(value?: number): number {
	const safe = typeof value === 'number' && Number.isFinite(value) ? value : CORNER_RADIUS_LIMITS.defaultRem;
	const clamped = Math.max(CORNER_RADIUS_LIMITS.minRem, Math.min(CORNER_RADIUS_LIMITS.maxRem, safe));
	return Math.round(clamped / CORNER_RADIUS_LIMITS.stepRem) * CORNER_RADIUS_LIMITS.stepRem;
}

export function applyAccessibilityPrefs(
	prefs: AccessibilityPrefs,
	target: HTMLElement | null = typeof document !== 'undefined' ? document.documentElement : null
): void {
	if (!target) return;
	const radiusRem = prefs.cornerMode === 'STRAIGHT' ? 0 : clampCornerRadiusRem(prefs.cornerRadiusRem ?? CORNER_RADIUS_LIMITS.defaultRem);
	target.style.setProperty('--ui-font-scale', String(prefs.fontScale / 100));
	target.style.setProperty('--ui-corner-cut', `${radiusRem}rem`);
	target.setAttribute('data-ui-corner', prefs.cornerMode);
	target.setAttribute('data-ui-contrast', prefs.highContrast ? 'aaa' : 'aa');
	target.setAttribute('data-ui-motion', prefs.kineticMotion ? 'kinetic' : 'reduced');
	target.setAttribute('data-ui-dyslexia', prefs.dyslexiaSpacing ? 'on' : 'off');
}

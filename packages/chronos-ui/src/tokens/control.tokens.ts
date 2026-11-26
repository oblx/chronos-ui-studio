import { clamp } from './hud.constants';

export type ButtonVariantMode = 'SOLID' | 'OUTLINE' | 'GHOST' | 'TACTICAL';
export type ControlDensityMode = 'COMPACT' | 'STANDARD' | 'SPACIOUS';
export type ButtonHoverEffect = 'GLOW' | 'LIFT' | 'BORDER_SWEEP' | 'NONE';
export type ButtonIconPosition = 'LEFT' | 'RIGHT';
export type FormSurfaceStyle = 'RECESSED' | 'OUTLINED' | 'UNDERLINE';
export type SliderTrackStyle = 'HAIRLINE' | 'SEGMENTED' | 'SOLID';

export interface ButtonControlConfig {
	readonly variant: ButtonVariantMode;
	readonly density: ControlDensityMode;
	readonly hoverEffect: ButtonHoverEffect;
	readonly pressDetent: boolean;
	readonly uppercaseLabels: boolean;
	readonly iconPosition: ButtonIconPosition;
}

export interface FormControlConfig {
	readonly surfaceStyle: FormSurfaceStyle;
	readonly density: ControlDensityMode;
	readonly focusGlow: boolean;
	readonly showValidationInline: boolean;
	readonly sliderTrackStyle: SliderTrackStyle;
}

export interface StudioControlConfig {
	readonly buttonConfig: ButtonControlConfig;
	readonly formConfig: FormControlConfig;
}

export const BUTTON_VARIANT_MODES: readonly ButtonVariantMode[] = ['SOLID', 'OUTLINE', 'GHOST', 'TACTICAL'] as const;
export const CONTROL_DENSITY_MODES: readonly ControlDensityMode[] = ['COMPACT', 'STANDARD', 'SPACIOUS'] as const;
export const BUTTON_HOVER_EFFECTS: readonly ButtonHoverEffect[] = ['GLOW', 'LIFT', 'BORDER_SWEEP', 'NONE'] as const;
export const FORM_SURFACE_STYLES: readonly FormSurfaceStyle[] = ['RECESSED', 'OUTLINED', 'UNDERLINE'] as const;
export const SLIDER_TRACK_STYLES: readonly SliderTrackStyle[] = ['HAIRLINE', 'SEGMENTED', 'SOLID'] as const;

export const HISTORY_LIMIT_BOUNDS = { defaultLimit: 5, minLimit: 1, maxLimit: 128 } as const;
export const TOOLTIP_LEVEL_BOUNDS = { defaultLevel: 60, minLevel: 0, maxLevel: 100 } as const;
export const TOOLTIP_TIER_THRESHOLDS = { silent: 0, essential: 20, standard: 50, guided: 80 } as const;
export const HUD_STAGGER_BOUNDS = { defaultMs: 250, minMs: 0, maxMs: 1000, stepMs: 25 } as const;

export const DEFAULT_CONTROL_CONFIG: StudioControlConfig = {
	buttonConfig: {
		variant: 'TACTICAL',
		density: 'STANDARD',
		hoverEffect: 'GLOW',
		pressDetent: true,
		uppercaseLabels: false,
		iconPosition: 'LEFT'
	},
	formConfig: {
		surfaceStyle: 'RECESSED',
		density: 'STANDARD',
		focusGlow: true,
		showValidationInline: true,
		sliderTrackStyle: 'HAIRLINE'
	}
} as const;

export function clampHistoryLimit(value?: number): number {
	const safe = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : HISTORY_LIMIT_BOUNDS.defaultLimit;
	return clamp(safe, HISTORY_LIMIT_BOUNDS.minLimit, HISTORY_LIMIT_BOUNDS.maxLimit);
}

export function clampTooltipInfoLevel(value?: number): number {
	const safe = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : TOOLTIP_LEVEL_BOUNDS.defaultLevel;
	return clamp(safe, TOOLTIP_LEVEL_BOUNDS.minLevel, TOOLTIP_LEVEL_BOUNDS.maxLevel);
}

export function resolveTooltipTierLabel(level: number): 'Silent' | 'Essential' | 'Standard' | 'Guided' | 'Verbose' {
	const n = clampTooltipInfoLevel(level);
	if (n <= TOOLTIP_TIER_THRESHOLDS.silent) return 'Silent';
	if (n <= TOOLTIP_TIER_THRESHOLDS.essential) return 'Essential';
	if (n <= TOOLTIP_TIER_THRESHOLDS.standard) return 'Standard';
	if (n <= TOOLTIP_TIER_THRESHOLDS.guided) return 'Guided';
	return 'Verbose';
}

export type PartialStudioControlConfig = Partial<{
	readonly buttonConfig?: Partial<ButtonControlConfig>;
	readonly formConfig?: Partial<FormControlConfig>;
}>;

export function clampControlConfig(
	patch?: PartialStudioControlConfig,
	base: StudioControlConfig = DEFAULT_CONTROL_CONFIG
): StudioControlConfig {
	const bp = patch?.buttonConfig ?? {};
	const fp = patch?.formConfig ?? {};
	return {
		buttonConfig: {
			variant: BUTTON_VARIANT_MODES.includes(bp.variant as ButtonVariantMode) ? bp.variant! : base.buttonConfig.variant,
			density: CONTROL_DENSITY_MODES.includes(bp.density as ControlDensityMode) ? bp.density! : base.buttonConfig.density,
			hoverEffect: BUTTON_HOVER_EFFECTS.includes(bp.hoverEffect as ButtonHoverEffect) ? bp.hoverEffect! : base.buttonConfig.hoverEffect,
			pressDetent: typeof bp.pressDetent === 'boolean' ? bp.pressDetent : base.buttonConfig.pressDetent,
			uppercaseLabels: typeof bp.uppercaseLabels === 'boolean' ? bp.uppercaseLabels : base.buttonConfig.uppercaseLabels,
			iconPosition: bp.iconPosition === 'RIGHT' ? 'RIGHT' : bp.iconPosition === 'LEFT' ? 'LEFT' : base.buttonConfig.iconPosition
		},
		formConfig: {
			surfaceStyle: FORM_SURFACE_STYLES.includes(fp.surfaceStyle as FormSurfaceStyle) ? fp.surfaceStyle! : base.formConfig.surfaceStyle,
			density: CONTROL_DENSITY_MODES.includes(fp.density as ControlDensityMode) ? fp.density! : base.formConfig.density,
			focusGlow: typeof fp.focusGlow === 'boolean' ? fp.focusGlow : base.formConfig.focusGlow,
			showValidationInline: typeof fp.showValidationInline === 'boolean' ? fp.showValidationInline : base.formConfig.showValidationInline,
			sliderTrackStyle: SLIDER_TRACK_STYLES.includes(fp.sliderTrackStyle as SliderTrackStyle) ? fp.sliderTrackStyle! : base.formConfig.sliderTrackStyle
		}
	};
}

export function buildControlHtmlAttrs(patch?: PartialStudioControlConfig): Readonly<Record<string, string>> {
	if (!patch) return {};
	const out: Record<string, string> = {};
	const bp = patch.buttonConfig;
	const fp = patch.formConfig;
	if (bp?.variant) out['data-ui-btn-variant'] = bp.variant;
	if (bp?.density) out['data-ui-btn-density'] = bp.density;
	if (bp?.hoverEffect) out['data-ui-btn-hover'] = bp.hoverEffect;
	if (typeof bp?.pressDetent === 'boolean') out['data-ui-btn-detent'] = bp.pressDetent ? 'on' : 'off';
	if (typeof bp?.uppercaseLabels === 'boolean') out['data-ui-btn-upper'] = bp.uppercaseLabels ? 'on' : 'off';
	if (bp?.iconPosition) out['data-ui-btn-icon-pos'] = bp.iconPosition;
	if (fp?.surfaceStyle) out['data-ui-form-surface'] = fp.surfaceStyle;
	if (fp?.density) out['data-ui-form-density'] = fp.density;
	if (typeof fp?.focusGlow === 'boolean') out['data-ui-form-focus-glow'] = fp.focusGlow ? 'on' : 'off';
	if (typeof fp?.showValidationInline === 'boolean') out['data-ui-form-inline-val'] = fp.showValidationInline ? 'on' : 'off';
	if (fp?.sliderTrackStyle) out['data-ui-slider-track'] = fp.sliderTrackStyle;
	return out;
}

export function applyControlConfigToRoot(
	cfg: StudioControlConfig,
	target: HTMLElement | null = typeof document !== 'undefined' ? document.documentElement : null
): void {
	if (!target) return;
	for (const [attr, val] of Object.entries(buildControlHtmlAttrs(cfg))) target.setAttribute(attr, val);
}

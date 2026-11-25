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
	if (n <= 0) return 'Silent';
	if (n <= 20) return 'Essential';
	if (n <= 50) return 'Standard';
	if (n <= 80) return 'Guided';
	return 'Verbose';
}

export function clampControlConfig(
	patch?: Partial<{ buttonConfig?: Partial<ButtonControlConfig>; formConfig?: Partial<FormControlConfig> }>,
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

export function applyControlConfigToRoot(
	cfg: StudioControlConfig,
	target: HTMLElement | null = typeof document !== 'undefined' ? document.documentElement : null
): void {
	if (!target) return;
	target.dataset.uiBtnVariant = cfg.buttonConfig.variant;
	target.dataset.uiBtnDensity = cfg.buttonConfig.density;
	target.dataset.uiBtnHover = cfg.buttonConfig.hoverEffect;
	target.dataset.uiBtnDetent = cfg.buttonConfig.pressDetent ? 'on' : 'off';
	target.dataset.uiBtnUpper = cfg.buttonConfig.uppercaseLabels ? 'on' : 'off';
	target.dataset.uiBtnIconPos = cfg.buttonConfig.iconPosition;
	target.dataset.uiFormSurface = cfg.formConfig.surfaceStyle;
	target.dataset.uiFormDensity = cfg.formConfig.density;
	target.dataset.uiFormFocusGlow = cfg.formConfig.focusGlow ? 'on' : 'off';
	target.dataset.uiFormInlineVal = cfg.formConfig.showValidationInline ? 'on' : 'off';
	target.dataset.uiSliderTrack = cfg.formConfig.sliderTrackStyle;
}

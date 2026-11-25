import { clampTooltipInfoLevel } from '@ui/tokens';

export interface TooltipState {
	readonly visible: boolean;
	readonly text: string;
	readonly infoLevel: number;
	readonly x: number;
	readonly y: number;
	readonly placement: 'top' | 'bottom' | 'left' | 'right';
}

export interface ParsedTooltipContent {
	readonly title?: string;
	readonly paragraphs: readonly (readonly string[])[];
	readonly shortcut?: string;
}

export const TIP_ATTR = 'data-ui-tip';
export const TIP_LEVEL_ATTR = 'data-ui-tip-level';
export const DEFAULT_TIP_LEVEL = 50;

export const TOOLTIP_LEVEL_PRESETS = {
	essential: 15,
	coreAction: 35,
	powerHint: 65,
	deepLore: 85
} as const;

export function parseTooltipInfoLevel(raw: string | null | undefined): number {
	if (!raw) return DEFAULT_TIP_LEVEL;
	const parsed = Number(raw);
	return Number.isFinite(parsed) ? clampTooltipInfoLevel(parsed) : DEFAULT_TIP_LEVEL;
}

export function shouldDisplayTooltip(tipLevel: number, userInfoLevel: number): boolean {
	const threshold = clampTooltipInfoLevel(userInfoLevel);
	if (threshold <= 0) return false;
	return clampTooltipInfoLevel(tipLevel) <= threshold;
}

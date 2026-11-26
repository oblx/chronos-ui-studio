import { DARK_THEMES, LIGHT_THEMES } from './theme.palettes';
import { checkContrastPair, type ContrastCheckResult } from './wcag.contrast';

export type ThemePolarity = 'dark' | 'light';

export interface SemanticTokenMap {
	readonly '--ui-primary': string;
	readonly '--ui-primary-content': string;
	readonly '--ui-secondary': string;
	readonly '--ui-secondary-content': string;
	readonly '--ui-accent': string;
	readonly '--ui-accent-vivid': string;
	readonly '--ui-accent-vivid-content': string;
	readonly '--ui-base-100': string;
	readonly '--ui-base-200': string;
	readonly '--ui-base-300': string;
	readonly '--ui-base-content': string;
	readonly '--ui-muted-content': string;
	readonly '--ui-border-subtle': string;
	readonly '--ui-info': string;
	readonly '--ui-success': string;
	readonly '--ui-warning': string;
	readonly '--ui-error': string;
}

export interface ThemePack {
	readonly id: string;
	readonly name: string;
	readonly polarity: ThemePolarity;
	readonly tokens: SemanticTokenMap;
}

export const THEME_PACKS: readonly ThemePack[] = [...DARK_THEMES, ...LIGHT_THEMES] as const;
export const DEFAULT_DARK_THEME_ID = DARK_THEMES[0].id;
export const DEFAULT_LIGHT_THEME_ID = LIGHT_THEMES[0].id;

export function findThemePack(id: string): ThemePack {
	return THEME_PACKS.find((item) => item.id === id) ?? THEME_PACKS[0];
}

export function validateThemePackContrast(pack: ThemePack): readonly ContrastCheckResult[] {
	const t = pack.tokens;
	return [
		checkContrastPair('base-content / base-100', t['--ui-base-content'], t['--ui-base-100']),
		checkContrastPair('muted-content / base-200', t['--ui-muted-content'], t['--ui-base-200']),
		checkContrastPair('primary-content / primary', t['--ui-primary-content'], t['--ui-primary']),
		checkContrastPair('primary / base-200', t['--ui-primary'], t['--ui-base-200']),
		checkContrastPair('accent-vivid-content / accent-vivid', t['--ui-accent-vivid-content'], t['--ui-accent-vivid']),
		checkContrastPair('accent-vivid / base-200', t['--ui-accent-vivid'], t['--ui-base-200'])
	];
}

export function buildDerivedThemeVars(pack?: ThemePack): Readonly<Record<string, string>> {
	const base100 = pack ? pack.tokens['--ui-base-100'] : 'var(--ui-base-100)';
	const base300 = pack ? pack.tokens['--ui-base-300'] : 'var(--ui-base-300)';
	const border = pack ? pack.tokens['--ui-border-subtle'] : 'var(--ui-border-subtle)';
	const primary = pack ? pack.tokens['--ui-primary'] : 'var(--ui-primary)';
	const vivid = pack ? (pack.tokens['--ui-accent-vivid'] || pack.tokens['--ui-accent']) : 'var(--ui-accent-vivid, var(--ui-accent))';
	const vividOrPrimary = pack ? (pack.tokens['--ui-accent-vivid'] || pack.tokens['--ui-primary']) : 'var(--ui-accent-vivid, var(--ui-primary))';
	return {
		'--ui-scroll-size': '0.375rem',
		'--ui-scroll-track': `color-mix(in srgb, ${base100} 76%, transparent)`,
		'--ui-scroll-thumb': border,
		'--ui-scroll-thumb-hover': vivid,
		'--ui-state-idle-bg': base300,
		'--ui-state-hover-bg': `color-mix(in srgb, ${primary} 14%, ${base300})`,
		'--ui-state-active-bg': `color-mix(in srgb, ${vividOrPrimary} 24%, ${base300})`
	};
}

export function applyThemeToRoot(
	pack: ThemePack,
	target: HTMLElement | null = typeof document !== 'undefined' ? document.documentElement : null
): void {
	if (!target) return;
	target.setAttribute('data-ui-theme', pack.id);
	target.setAttribute('data-ui-polarity', pack.polarity);
	for (const [key, value] of Object.entries({ ...pack.tokens, ...buildDerivedThemeVars(pack) })) {
		target.style.setProperty(key, value);
	}
}

import {
	applyCursorPackToDocument, applySafeCorridorCssVars, applyThemeToRoot, BUILTIN_CURSOR_PACKS,
	computeSafeCorridorFromRects, DEFAULT_VIEWPORT, findThemePack, measureActivePerimeterRects,
	resetCursorPackOnDocument, resolveThemeCursorPalette, ROOT_FONT_PX
} from '@chronos-ui/svelte';
import type { StudioState } from '../studio.types';

export function resolveRootFontPx(): number {
	return typeof window !== 'undefined'
		? (parseFloat(getComputedStyle(document.documentElement).fontSize) || ROOT_FONT_PX)
		: ROOT_FONT_PX;
}

export function syncThemeAndCursor(s: StudioState, resetIfNull = false): void {
	const theme = s.themes.find((t) => t.id === s.activeThemeId) ?? findThemePack(s.activeThemeId);
	applyThemeToRoot(theme);
	if (s.activeCursorPackId !== null) {
		const pack = s.cursorPacks.find((c) => c.uuid === s.activeCursorPackId || c.slug === s.activeCursorPackId) ?? BUILTIN_CURSOR_PACKS[0];
		applyCursorPackToDocument(pack, resolveThemeCursorPalette(theme));
	} else if (resetIfNull) {
		resetCursorPackOnDocument();
	}
}

export function syncCorridorForState(s: StudioState): void {
	const w = typeof window !== 'undefined' ? window.innerWidth : DEFAULT_VIEWPORT.width;
	const h = typeof window !== 'undefined' ? window.innerHeight : DEFAULT_VIEWPORT.height;
	applySafeCorridorCssVars(computeSafeCorridorFromRects(w, h, s.studioChromeVisible, measureActivePerimeterRects(), resolveRootFontPx(), {
		leftOpen: s.leftDrawer.open,
		leftFloating: s.leftDrawer.floating,
		rightOpen: s.rightDrawer.open,
		rightFloating: s.rightDrawer.floating,
		assistantExpanded: s.assistantDock.expanded && s.assistantDock.mode === 'DOCKED'
	}));
}

import {
	applyCursorPackToDocument, applySafeCorridorCssVars, applyThemeToRoot, BUILTIN_CURSOR_PACKS,
	clampHistoryLimit, computeSafeCorridorFromRects, DEFAULT_VIEWPORT, findThemePack,
	measureActivePerimeterRects, resetCursorPackOnDocument, resolveThemeCursorPalette, ROOT_FONT_PX,
	type ThemePack, type UiNodeTree, type UiProjectDefinition
} from '@chronos-ui/svelte';
import { historyIdbStore } from '@studio/lib/history.idb';
import type { StudioState } from '../studio.types';

export function resolveRootFontPx(): number {
	return typeof window !== 'undefined'
		? (parseFloat(getComputedStyle(document.documentElement).fontSize) || ROOT_FONT_PX)
		: ROOT_FONT_PX;
}

export function resolveActiveProject(s: StudioState): UiProjectDefinition | undefined {
	return s.projects.find((p) => p.id === s.activeProjectId) ?? s.projects[0];
}

export function resolveActiveTheme(s: StudioState): ThemePack {
	return s.themes.find((t) => t.id === s.activeThemeId) ?? findThemePack(s.activeThemeId);
}

export function pushUndoSnapshot(s: StudioState, prevNodes: UiNodeTree): Pick<StudioState, 'undoStack' | 'redoStack'> {
	const cap = clampHistoryLimit(s.studioDefaults.historyLimit);
	return { undoStack: [...s.undoStack, prevNodes].slice(-cap), redoStack: [] };
}

export function persistActiveHistory(s: StudioState): void {
	if (typeof window === 'undefined') return;
	const proj = resolveActiveProject(s);
	if (!proj) return;
	const historyLimit = clampHistoryLimit(s.studioDefaults.historyLimit);
	void historyIdbStore.save(proj.id, { undoStack: s.undoStack, redoStack: s.redoStack, historyLimit });
}

export function syncThemeAndCursor(s: StudioState, resetIfNull = false): void {
	const theme = resolveActiveTheme(s);
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
		assistantExpanded: false
	}));
}

import type { IntentKind } from '@ui/wire';

export type UiShortcutCategory = 'SEARCH' | 'PROJECT' | 'HISTORY' | 'HUD' | 'ASSISTANT' | 'MODALS' | 'HELP';
export type UiShortcutScope = 'GLOBAL' | 'STUDIO_HUD' | 'MODAL_OPEN' | 'CANVAS_ACTIVE';

export interface UiShortcutBinding {
	readonly id: string;
	readonly chord: string;
	readonly macChord?: string;
	readonly altChord?: string;
	readonly category: UiShortcutCategory;
	readonly scope: UiShortcutScope;
	readonly intent: IntentKind;
	readonly payload?: Readonly<Record<string, unknown>>;
	readonly label: string;
	readonly description: string;
	readonly allowInInput: boolean;
	readonly preventDefault: boolean;
}

export const CANONICAL_SHORTCUTS: readonly UiShortcutBinding[] = [
	{
		id: 'global-search', chord: 'Ctrl+K', macChord: 'Meta+K', category: 'SEARCH', scope: 'GLOBAL',
		intent: 'UI_OPEN_MODAL', payload: { modalId: 'GLOBAL_SEARCH', id: 'global-search' },
		label: 'Global Search / Command Palette', description: 'Open global search across entities, actions, MCP tools, samples, chapters, and themes.',
		allowInInput: true, preventDefault: true
	},
	{
		id: 'project-save', chord: 'Ctrl+S', macChord: 'Meta+S', category: 'PROJECT', scope: 'GLOBAL',
		intent: 'UI_PROJECT_SAVE', payload: {},
		label: 'Save Project Snapshot', description: 'Commit and persist current project snapshot.',
		allowInInput: true, preventDefault: true
	},
	{
		id: 'history-undo', chord: 'Ctrl+Z', macChord: 'Meta+Z', category: 'HISTORY', scope: 'GLOBAL',
		intent: 'UI_HISTORY_UNDO', payload: {},
		label: 'Undo Last Operation', description: 'Revert the most recent canvas or document mutation.',
		allowInInput: false, preventDefault: true
	},
	{
		id: 'history-redo', chord: 'Ctrl+Shift+Z', macChord: 'Meta+Shift+Z', altChord: 'Ctrl+Y', category: 'HISTORY', scope: 'GLOBAL',
		intent: 'UI_HISTORY_REDO', payload: {},
		label: 'Redo Operation', description: 'Re-apply the most recently undone mutation.',
		allowInInput: false, preventDefault: true
	},
	{
		id: 'toggle-studio-chrome', chord: 'Ctrl+Shift+H', macChord: 'Meta+Shift+H', category: 'HUD', scope: 'GLOBAL',
		intent: 'UI_TOGGLE_STUDIO_CHROME', payload: {},
		label: 'Toggle Studio HUD / Calm View', description: 'Switch between Calm Default View and 10-zone Builder Studio HUD.',
		allowInInput: true, preventDefault: true
	},
	{
		id: 'toggle-left-drawer', chord: 'Ctrl+B', macChord: 'Meta+B', category: 'HUD', scope: 'STUDIO_HUD',
		intent: 'UI_TOGGLE_DRAWER', payload: { side: 'LEFT' },
		label: 'Toggle Left Palette Drawer', description: 'Expand or collapse the left component & sample palette drawer.',
		allowInInput: false, preventDefault: true
	},
	{
		id: 'toggle-right-drawer', chord: 'Ctrl+Shift+B', macChord: 'Meta+Shift+B', category: 'HUD', scope: 'STUDIO_HUD',
		intent: 'UI_TOGGLE_DRAWER', payload: { side: 'RIGHT' },
		label: 'Toggle Right Inspector Drawer', description: 'Expand or collapse the right entity inspector & tokens drawer.',
		allowInInput: false, preventDefault: true
	},
	{
		id: 'toggle-assistant', chord: 'Ctrl+J', macChord: 'Meta+J', category: 'ASSISTANT', scope: 'GLOBAL',
		intent: 'UI_ASSISTANT_TOGGLE_EXPAND', payload: {},
		label: 'Toggle AI Assistant Console', description: 'Expand or collapse the bottom AI Assistant prompt console.',
		allowInInput: true, preventDefault: true
	},
	{
		id: 'open-wireframe-radar', chord: 'Ctrl+Shift+W', macChord: 'Meta+Shift+W', category: 'MODALS', scope: 'GLOBAL',
		intent: 'UI_OPEN_MODAL', payload: { modalId: 'RADAR_SKELETON', id: 'radar-skeleton' },
		label: 'Open Wireframe & Radar Modal', description: 'Launch the interactive wireframe skeleton & perimeter radar view.',
		allowInInput: false, preventDefault: true
	},
	{
		id: 'open-settings', chord: 'Ctrl+,', macChord: 'Meta+,', category: 'MODALS', scope: 'GLOBAL',
		intent: 'UI_OPEN_MODAL', payload: { modalId: 'SETTINGS', id: 'settings' },
		label: 'Open Studio Settings', description: 'Open global Studio Settings & Defaults configuration.',
		allowInInput: true, preventDefault: true
	},
	{
		id: 'open-export', chord: 'Ctrl+Shift+E', macChord: 'Meta+Shift+E', category: 'PROJECT', scope: 'GLOBAL',
		intent: 'UI_OPEN_MODAL', payload: { modalId: 'EXPORT', id: 'export' },
		label: 'Open Build & Export Modal', description: 'Open the static bundle & portable project export dialog.',
		allowInInput: false, preventDefault: true
	},
	{
		id: 'contextual-help', chord: 'F1', altChord: 'Shift+?', category: 'HELP', scope: 'GLOBAL',
		intent: 'OPEN_CONTEXTUAL_HELP', payload: {},
		label: 'Contextual Field Tome Help', description: 'Open the Field Tome to the chapter matching the active surface.',
		allowInInput: false, preventDefault: true
	},
	{
		id: 'dismiss-overlay', chord: 'Escape', category: 'MODALS', scope: 'GLOBAL',
		intent: 'UI_DISMISS_TOP_OVERLAY', payload: {},
		label: 'Dismiss Active Modal / Spotlight', description: 'Close the top-most open modal dialog or active spotlight tour.',
		allowInInput: true, preventDefault: false
	}
] as const;

export function getEffectiveShortcuts(overrides?: Readonly<Record<string, string>>): readonly UiShortcutBinding[] {
	if (!overrides || Object.keys(overrides).length === 0) return CANONICAL_SHORTCUTS;
	return CANONICAL_SHORTCUTS.map((b) => {
		const custom = overrides[b.id]?.trim();
		return custom ? { ...b, chord: custom, macChord: custom.replace(/^Ctrl\+/i, 'Meta+') } : b;
	});
}

export function findShortcutById(id: string, overrides?: Readonly<Record<string, string>>): UiShortcutBinding | undefined {
	return getEffectiveShortcuts(overrides).find((b) => b.id === id);
}

export function detectMacPlatform(): boolean {
	if (typeof navigator === 'undefined') return false;
	return /Mac|iPod|iPhone|iPad/i.test(navigator.platform || navigator.userAgent || '');
}

export function formatShortcutBadge(id: string, overrides?: Readonly<Record<string, string>>, isMac = detectMacPlatform()): string {
	const binding = findShortcutById(id, overrides);
	if (!binding) return '';
	const raw = isMac && binding.macChord ? binding.macChord : binding.chord;
	return raw.replace(/^Meta\+/i, 'Cmd+');
}

import type { IntentKind } from '@ui/wire';
import { CANONICAL_SHORTCUTS, getEffectiveShortcuts, type UiShortcutBinding, type UiShortcutScope } from './shortcuts.registry';

export interface ShortcutCollision {
	readonly scope: UiShortcutScope;
	readonly chord: string;
	readonly ids: readonly string[];
}

export interface ShortcutValidationReport {
	readonly valid: boolean;
	readonly count: number;
	readonly collisions: readonly ShortcutCollision[];
}

export interface ShortcutResolutionContext {
	readonly studioChromeOpen?: boolean;
	readonly modalOpen?: boolean;
	readonly target?: EventTarget | null;
}

export interface ShortcutKeyEventLike {
	readonly key: string;
	readonly ctrlKey?: boolean;
	readonly metaKey?: boolean;
	readonly shiftKey?: boolean;
	readonly altKey?: boolean;
	readonly target?: EventTarget | null;
	readonly defaultPrevented?: boolean;
	preventDefault?: () => void;
}

export function canonicalizeChordString(chord: string): string {
	const parts = chord.split('+').map((p) => p.trim()).filter(Boolean);
	let ctrlOrMeta = false;
	let shift = false;
	let alt = false;
	let key = '';
	for (const part of parts) {
		const low = part.toLowerCase();
		if (low === 'ctrl' || low === 'control' || low === 'meta' || low === 'cmd' || low === 'command') ctrlOrMeta = true;
		else if (low === 'shift') shift = true;
		else if (low === 'alt' || low === 'option') alt = true;
		else key = part.length === 1 ? part.toUpperCase() : (low === 'esc' ? 'Escape' : part);
	}
	const mods: string[] = [];
	if (ctrlOrMeta) mods.push('Ctrl');
	if (alt) mods.push('Alt');
	if (shift) mods.push('Shift');
	if (key) mods.push(key);
	return mods.join('+');
}

export function normalizeKeyboardEventChord(event: ShortcutKeyEventLike): string {
	const rawKey = event.key || '';
	if (rawKey === 'Control' || rawKey === 'Meta' || rawKey === 'Shift' || rawKey === 'Alt') return '';
	const mods: string[] = [];
	if (event.ctrlKey || event.metaKey) mods.push('Ctrl');
	if (event.altKey) mods.push('Alt');
	if (event.shiftKey) mods.push('Shift');
	const keyLabel = rawKey === ' ' ? 'Space' : (rawKey.length === 1 ? rawKey.toUpperCase() : rawKey);
	mods.push(keyLabel);
	return mods.join('+');
}

export function isEditableInputTarget(target: EventTarget | null | undefined): boolean {
	if (!target || typeof target !== 'object') return false;
	const el = target as { tagName?: string; isContentEditable?: boolean; getAttribute?: (attr: string) => string | null };
	const tag = (el.tagName ?? '').toUpperCase();
	if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
	if (el.isContentEditable) return true;
	return el.getAttribute?.('contenteditable') === 'true';
}

export function validateShortcutRegistry(
	bindings: readonly UiShortcutBinding[] = CANONICAL_SHORTCUTS,
	overrides?: Readonly<Record<string, string>>
): ShortcutValidationReport {
	const effective = overrides ? getEffectiveShortcuts(overrides) : bindings;
	const seen = new Map<string, string[]>();
	for (const b of effective) {
		const chords = [b.chord, ...(b.altChord ? [b.altChord] : [])].map(canonicalizeChordString);
		for (const c of new Set(chords)) {
			const bucketKey = `${b.scope}::${c}`;
			const list = seen.get(bucketKey) ?? [];
			list.push(b.id);
			seen.set(bucketKey, list);
		}
	}
	const collisions: ShortcutCollision[] = [];
	for (const [bucket, ids] of seen.entries()) {
		if (ids.length > 1) {
			const [scope, chord] = bucket.split('::') as [UiShortcutScope, string];
			collisions.push({ scope, chord, ids });
		}
	}
	return { valid: collisions.length === 0, count: effective.length, collisions };
}

export function resolveShortcutForEvent(
	event: ShortcutKeyEventLike,
	context: ShortcutResolutionContext = {},
	overrides?: Readonly<Record<string, string>>
): UiShortcutBinding | null {
	const eventChord = normalizeKeyboardEventChord(event);
	if (!eventChord) return null;
	const inEditable = isEditableInputTarget(context.target ?? event.target);
	const effective = getEffectiveShortcuts(overrides);
	for (const b of effective) {
		if (inEditable && !b.allowInInput) continue;
		if (b.scope === 'STUDIO_HUD' && context.studioChromeOpen === false) continue;
		if (b.scope === 'MODAL_OPEN' && !context.modalOpen) continue;
		const primary = canonicalizeChordString(b.chord);
		const alt = b.altChord ? canonicalizeChordString(b.altChord) : '';
		if (eventChord === primary || (alt && eventChord === alt)) return b;
	}
	return null;
}

export interface AttachGlobalShortcutOptions {
	readonly dispatch: (kind: IntentKind, payload: Record<string, unknown>, origin: 'KEYBOARD_SHORTCUT') => void;
	readonly getContext?: () => ShortcutResolutionContext;
	readonly getOverrides?: () => Readonly<Record<string, string>> | undefined;
}

export function attachGlobalShortcutDispatcher(options: AttachGlobalShortcutOptions): () => void {
	if (typeof window === 'undefined') return () => {};
	const onKeyDown = (event: KeyboardEvent): void => {
		if (event.defaultPrevented) return;
		const ctx = options.getContext ? options.getContext() : {};
		const match = resolveShortcutForEvent(event, { ...ctx, target: event.target }, options.getOverrides?.());
		if (!match) return;
		if (match.preventDefault) event.preventDefault();
		options.dispatch(match.intent, { ...(match.payload ?? {}), shortcutId: match.id }, 'KEYBOARD_SHORTCUT');
	};
	window.addEventListener('keydown', onKeyDown);
	return () => window.removeEventListener('keydown', onKeyDown);
}

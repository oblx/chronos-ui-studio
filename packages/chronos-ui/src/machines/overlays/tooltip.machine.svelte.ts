import type { Action } from 'svelte/action';
import { getActiveStudioDefaults } from '@ui/motion';
import { TOOLTIP_LEVEL_BOUNDS } from '@ui/tokens';
import type { IntentKind, WireMiddleware } from '@ui/wire';
import {
	DEFAULT_TIP_LEVEL, parseTooltipInfoLevel, shouldDisplayTooltip,
	TIP_ATTR, TIP_LEVEL_ATTR, type ParsedTooltipContent, type TooltipState
} from './tooltip.types';

const EDGE_MARGIN_PX = 72;
const TOP_THRESHOLD_PX = 84;
const ANCHOR_OFFSET_PX = 10;
const CLAMP_PAD_X = 96;
const CLAMP_EDGE_X = 24;
const VIEWPORT_CLAMP_PAD_PX = 8;

export function parseTooltipContent(raw: string): ParsedTooltipContent {
	const normalized = raw.replace(/\r\n/g, '\n').trim();
	if (!normalized) return { paragraphs: [] };
	let body = normalized;
	let shortcut: string | undefined;
	const scMatch = body.match(/\s*\[([A-Za-z0-9+?/\- ]{1,16})\]\s*$/);
	if (scMatch) { shortcut = scMatch[1].trim(); body = body.slice(0, scMatch.index).trim(); }
	const rawParas = body.split(/\n{2,}/).map((p) => p.split('\n').map((l) => l.trim()).filter(Boolean)).filter((p) => p.length > 0);
	if (rawParas.length > 1 && rawParas[0].length === 1 && rawParas[0][0].length <= 48 && !/[.!?]$/.test(rawParas[0][0])) {
		return { title: rawParas[0][0], paragraphs: rawParas.slice(1), shortcut };
	}
	return { paragraphs: rawParas, shortcut };
}

export function computeTooltipAnchor(rect: DOMRect, vw: number, vh: number): Pick<TooltipState, 'x' | 'y' | 'placement'> {
	const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
	const clampedX = Math.max(CLAMP_PAD_X, Math.min(vw - CLAMP_PAD_X, cx));
	if (rect.top < TOP_THRESHOLD_PX) return { x: clampedX, y: rect.bottom + ANCHOR_OFFSET_PX, placement: 'bottom' };
	if (rect.left < EDGE_MARGIN_PX) return { x: Math.min(vw - CLAMP_EDGE_X, rect.right + ANCHOR_OFFSET_PX), y: cy, placement: 'right' };
	if (vw - rect.right < EDGE_MARGIN_PX) return { x: Math.max(CLAMP_EDGE_X, rect.left - ANCHOR_OFFSET_PX), y: cy, placement: 'left' };
	return rect.bottom + 48 < vh * 0.25
		? { x: clampedX, y: rect.bottom + ANCHOR_OFFSET_PX, placement: 'bottom' }
		: { x: clampedX, y: rect.top - ANCHOR_OFFSET_PX, placement: 'top' };
}

function bindZeroTimerTipListeners(onShow: (el: HTMLElement) => void, onHide: () => void, verifyAnchorAlive: () => void): () => void {
	const selector = `[${TIP_ATTR}]`;
	const deferHide = (): void => { queueMicrotask(onHide); };
	const onOver = (e: Event): void => {
		const el = (e.target as HTMLElement | null)?.closest?.(selector) as HTMLElement | null;
		if (!el) { deferHide(); return; }
		const disabled = el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';
		const level = parseTooltipInfoLevel(el.getAttribute(TIP_LEVEL_ATTR));
		if (!disabled || level <= 20) onShow(el);
		else deferHide();
	};
	const onOut = (e: Event): void => {
		const rel = (e as PointerEvent).relatedTarget as HTMLElement | null;
		if (!rel?.closest?.(selector)) deferHide();
	};
	const docEvents: readonly [string, (e: Event) => void][] = [
		['pointerover', onOver], ['pointerout', onOut], ['pointerleave', deferHide],
		['pointerdown', deferHide], ['focusin', onOver], ['focusout', deferHide], ['keydown', deferHide]
	];
	for (const [ev, fn] of docEvents) document.addEventListener(ev, fn, { passive: true });
	window.addEventListener('scroll', deferHide, { passive: true, capture: true });
	window.addEventListener('blur', deferHide, { passive: true });
	const observer = typeof MutationObserver !== 'undefined' && document.body ? new MutationObserver(verifyAnchorAlive) : null;
	observer?.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-hidden', TIP_ATTR, TIP_LEVEL_ATTR] });
	return () => {
		for (const [ev, fn] of docEvents) document.removeEventListener(ev, fn);
		window.removeEventListener('scroll', deferHide, true);
		window.removeEventListener('blur', deferHide);
		observer?.disconnect();
	};
}

export function createOverlayDismissMiddleware<S>(
	dismiss: () => void,
	triggers: readonly IntentKind[] = ['UI_SET_ACTIVE_VIEW', 'UI_LOAD_SAMPLE', 'UI_SWITCH_PROJECT', 'UI_OPEN_MODAL', 'UI_TOGGLE_STUDIO_CHROME', 'UI_TOGGLE_POLARITY']
): WireMiddleware<S> {
	const set = new Set<IntentKind>(triggers);
	return (envelope, _state, next) => { if (set.has(envelope.kind)) queueMicrotask(dismiss); next(); };
}

export function createTooltipController(getInfoLevel?: () => number) {
	let state = $state<TooltipState>({ visible: false, text: '', infoLevel: DEFAULT_TIP_LEVEL, x: 0, y: 0, placement: 'top' });
	let anchorEl: HTMLElement | null = null;
	const resolveThreshold = (): number => getInfoLevel ? getInfoLevel() : (getActiveStudioDefaults().tooltipInfoLevel ?? TOOLTIP_LEVEL_BOUNDS.defaultLevel);
	const hide = (): void => { anchorEl = null; if (state.visible) state = { ...state, visible: false }; };
	const showFor = (target: HTMLElement): void => {
		const text = target.getAttribute(TIP_ATTR) ?? '';
		const infoLevel = parseTooltipInfoLevel(target.getAttribute(TIP_LEVEL_ATTR));
		if (!text || !shouldDisplayTooltip(infoLevel, resolveThreshold())) { hide(); return; }
		anchorEl = target;
		const anchor = computeTooltipAnchor(target.getBoundingClientRect(), window.innerWidth, window.innerHeight);
		state = { visible: true, text, infoLevel, ...anchor };
	};
	const verifyAnchorAlive = (): void => { if (state.visible && (!anchorEl || !anchorEl.isConnected)) queueMicrotask(hide); };
	return { get state(): TooltipState { return state; }, showFor, hide, attachGlobalDelegation: () => bindZeroTimerTipListeners(showFor, hide, verifyAnchorAlive) };
}

export const uiTooltip: Action<HTMLElement, string | { text?: string; level?: number } | undefined> = (node, param) => {
	const apply = (val?: string | { text?: string; level?: number }): void => {
		const text = typeof val === 'string' ? val : val?.text;
		const level = typeof val === 'object' ? val?.level : undefined;
		if (text) node.setAttribute(TIP_ATTR, text); else node.removeAttribute(TIP_ATTR);
		if (level !== undefined) node.setAttribute(TIP_LEVEL_ATTR, String(level)); else node.removeAttribute(TIP_LEVEL_ATTR);
	};
	apply(param);
	return { update: apply, destroy() { node.removeAttribute(TIP_ATTR); node.removeAttribute(TIP_LEVEL_ATTR); } };
};

export const uiClampTooltipRect: Action<HTMLElement, { x: number; y: number; placement: TooltipState['placement']; text?: string }> = (node) => {
	let raf = 0;
	const clamp = (): void => {
		node.style.marginLeft = '0px'; node.style.marginTop = '0px';
		const r = node.getBoundingClientRect(), pad = VIEWPORT_CLAMP_PAD_PX;
		let dx = 0, dy = 0;
		if (r.right > window.innerWidth - pad) dx = window.innerWidth - pad - r.right;
		if (r.left + dx < pad) dx = pad - r.left;
		if (r.bottom > window.innerHeight - pad) dy = window.innerHeight - pad - r.bottom;
		if (r.top + dy < pad) dy = pad - r.top;
		if (dx !== 0) node.style.marginLeft = `${Math.round(dx)}px`;
		if (dy !== 0) node.style.marginTop = `${Math.round(dy)}px`;
	};
	const schedule = (): void => { cancelAnimationFrame(raf); raf = requestAnimationFrame(clamp); };
	const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
	ro?.observe(node); queueMicrotask(clamp); schedule();
	return { update: () => { queueMicrotask(clamp); schedule(); }, destroy() { ro?.disconnect(); cancelAnimationFrame(raf); } };
};

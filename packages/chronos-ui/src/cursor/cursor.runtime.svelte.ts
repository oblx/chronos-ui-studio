import { CURSOR_LIMITS } from '../tokens';
import { CSS_CURSOR_STATES, type CursorPackDefinition, type CursorStateAsset } from './cursor.types';

const SHEET_ATTR = 'data-ui-cursor-sheet';

function formatCursorValue(asset: CursorStateAsset | undefined, fallback: string): string {
	if (!asset?.assetDataUrl) return fallback;
	const x = Math.max(0, Math.min(CURSOR_LIMITS.maxHotspot, Math.round(asset.hotspotX)));
	const y = Math.max(0, Math.min(CURSOR_LIMITS.maxHotspot, Math.round(asset.hotspotY)));
	return `url("${asset.assetDataUrl}") ${x} ${y}, ${fallback}`;
}

export function buildCursorPackCssSheet(pack: CursorPackDefinition): string {
	const vars = CSS_CURSOR_STATES.map((st) => `\t--ui-cursor-${st}: ${formatCursorValue(pack.states[st], st)};`).join('\n');
	const explicitDataAttrs = CSS_CURSOR_STATES.map(
		(st) => `[data-ui-cursor="${st}"] { cursor: var(--ui-cursor-${st}) !important; }`
	).join('\n');
	return [
		`:root {\n${vars}\n}`,
		':root, html, body, [data-ui-modal-backdrop] { cursor: var(--ui-cursor-default) !important; }',
		'a, button:not([data-ui-modal-backdrop]):not(:disabled):not([aria-disabled="true"]), summary, [role="button"]:not([aria-disabled="true"]), [role="tab"], select:not(:disabled), label[for], input[type="range"]:not(:disabled), input[type="checkbox"]:not(:disabled), input[type="radio"]:not(:disabled) { cursor: var(--ui-cursor-pointer) !important; }',
		'input[type="text"]:not(:disabled), input:not([type]):not(:disabled), input[type="search"]:not(:disabled), input[type="url"]:not(:disabled), input[type="password"]:not(:disabled), input[type="number"]:not(:disabled), textarea:not(:disabled), [contenteditable="true"] { cursor: var(--ui-cursor-text) !important; }',
		'[draggable="true"], [data-ui-drag-grip], [data-ui-pan-stage], [data-testid="world-canvas-stage"], .cursor-grab { cursor: var(--ui-cursor-grab) !important; }',
		'[data-ui-drag-grip]:active, [data-ui-pan-stage]:active, [data-testid="world-canvas-stage"]:active, [data-ui-dragging="true"], .cursor-grabbing, .cursor-grab:active { cursor: var(--ui-cursor-grabbing) !important; }',
		':disabled, [disabled], [aria-disabled="true"], .cursor-not-allowed { cursor: var(--ui-cursor-not-allowed) !important; }',
		'[aria-busy="true"] { cursor: var(--ui-cursor-progress) !important; }',
		'[data-ui-help-trigger="true"] { cursor: var(--ui-cursor-help) !important; }',
		'.cursor-crosshair { cursor: var(--ui-cursor-crosshair) !important; }',
		'.cursor-move { cursor: var(--ui-cursor-move) !important; }',
		'.cursor-zoom-in { cursor: var(--ui-cursor-zoom-in) !important; }',
		'.cursor-zoom-out { cursor: var(--ui-cursor-zoom-out) !important; }',
		'.cursor-col-resize { cursor: var(--ui-cursor-col-resize) !important; }',
		'.cursor-row-resize { cursor: var(--ui-cursor-row-resize) !important; }',
		'.cursor-copy { cursor: var(--ui-cursor-copy) !important; }',
		'.cursor-alias { cursor: var(--ui-cursor-alias) !important; }',
		'.cursor-cell { cursor: var(--ui-cursor-cell) !important; }',
		'.cursor-context-menu { cursor: var(--ui-cursor-context-menu) !important; }',
		explicitDataAttrs
	].join('\n');
}

export function applyCursorPackToDocument(pack: CursorPackDefinition, doc?: Document): HTMLStyleElement | null {
	const targetDoc = doc ?? (typeof document !== 'undefined' ? document : undefined);
	if (!targetDoc?.head) return null;
	let el = targetDoc.head.querySelector(`style[${SHEET_ATTR}="true"]`) as HTMLStyleElement | null;
	if (!el) {
		el = targetDoc.createElement('style');
		el.setAttribute(SHEET_ATTR, 'true');
		targetDoc.head.appendChild(el);
	}
	el.setAttribute('data-cursor-pack', pack.slug);
	el.textContent = buildCursorPackCssSheet(pack);
	return el;
}

export function resetCursorPackOnDocument(doc?: Document): void {
	const targetDoc = doc ?? (typeof document !== 'undefined' ? document : undefined);
	if (!targetDoc?.head) return;
	const el = targetDoc.head.querySelector(`style[${SHEET_ATTR}="true"]`);
	if (el) el.remove();
}

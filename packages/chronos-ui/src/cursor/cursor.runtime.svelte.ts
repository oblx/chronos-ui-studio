import { CURSOR_LIMITS, THEME_PACKS } from '../tokens';
import { buildVectorCursorDataUrl, encodeSvgCursorDataUrl, resolveThemeCursorPalette } from './cursor.presets';
import {
	CSS_CURSOR_STATES,
	type CssCursorState,
	type CursorPackDefinition,
	type CursorStateAsset,
	type ResolvedCursorPalette
} from './cursor.types';

const SHEET_ATTR = 'data-ui-cursor-sheet';

function resolveAssetUrl(asset: CursorStateAsset | undefined, state: CssCursorState, palette?: ResolvedCursorPalette): string {
	if (palette && (!asset?.assetDataUrl || asset.generatorOrigin === 'PRESET')) {
		return buildVectorCursorDataUrl(state, palette.fillHex, palette.primaryHex, palette.accentHex);
	}
	if (!asset?.assetDataUrl) {
		const fallback = palette ?? resolveThemeCursorPalette(THEME_PACKS[0]);
		return buildVectorCursorDataUrl(state, fallback.fillHex, fallback.primaryHex, fallback.accentHex);
	}
	if (asset.assetDataUrl.startsWith('data:image/svg+xml,')) {
		const decoded = decodeURIComponent(asset.assetDataUrl.slice('data:image/svg+xml,'.length));
		return encodeSvgCursorDataUrl(decoded, palette ?? resolveThemeCursorPalette(THEME_PACKS[0]));
	}
	return asset.assetDataUrl;
}

function formatCursorValue(asset: CursorStateAsset | undefined, state: CssCursorState, palette?: ResolvedCursorPalette): string {
	const url = resolveAssetUrl(asset, state, palette);
	const x = Math.max(0, Math.min(CURSOR_LIMITS.maxHotspot, Math.round(asset?.hotspotX ?? CURSOR_LIMITS.defaultHotspotX)));
	const y = Math.max(0, Math.min(CURSOR_LIMITS.maxHotspot, Math.round(asset?.hotspotY ?? CURSOR_LIMITS.defaultHotspotY)));
	return `url("${url}") ${x} ${y}, ${state}`;
}

export function buildCursorPackCss(pack: CursorPackDefinition, resolvedPalette?: ResolvedCursorPalette): string {
	const values = new Map<CssCursorState, string>(
		CSS_CURSOR_STATES.map((st) => [st, formatCursorValue(pack.states[st], st, resolvedPalette)])
	);
	const vars = CSS_CURSOR_STATES.map((st) => `\t--ui-cursor-${st}: ${values.get(st)};`).join('\n');
	const classAndAttrRules = CSS_CURSOR_STATES.map(
		(st) => `.cursor-${st}, [data-ui-cursor="${st}"] { cursor: ${values.get(st)} !important; }`
	).join('\n');
	return [
		'html, body, #app { min-height: 100vh; width: 100%; }',
		`:root {\n${vars}\n}`,
		`:root, html, body, #app, [data-ui-root], [data-ui-modal-backdrop] { cursor: ${values.get('default')} !important; }`,
		`a, button:not([data-ui-modal-backdrop]):not(:disabled):not([aria-disabled="true"]), summary, [role="button"]:not([aria-disabled="true"]), [role="tab"], select:not(:disabled), label[for], input[type="range"]:not(:disabled), input[type="checkbox"]:not(:disabled), input[type="radio"]:not(:disabled) { cursor: ${values.get('pointer')} !important; }`,
		`input[type="text"]:not(:disabled), input:not([type]):not(:disabled), input[type="search"]:not(:disabled), input[type="url"]:not(:disabled), input[type="password"]:not(:disabled), input[type="number"]:not(:disabled), textarea:not(:disabled), [contenteditable="true"] { cursor: ${values.get('text')} !important; }`,
		`[draggable="true"], [data-ui-drag-grip], [data-ui-pan-stage], [data-testid="world-canvas-stage"] { cursor: ${values.get('grab')} !important; }`,
		`[data-ui-drag-grip]:active, [data-ui-pan-stage]:active, [data-testid="world-canvas-stage"]:active, [data-ui-dragging="true"], .cursor-grab:active { cursor: ${values.get('grabbing')} !important; }`,
		`:disabled, [disabled], [aria-disabled="true"] { cursor: ${values.get('not-allowed')} !important; }`,
		`[aria-busy="true"] { cursor: ${values.get('progress')} !important; }`,
		`[data-ui-help-trigger="true"] { cursor: ${values.get('help')} !important; }`,
		classAndAttrRules
	].join('\n');
}

export const buildCursorPackCssSheet = buildCursorPackCss;

function isDocumentLike(v: unknown): v is Document {
	return Boolean(v && typeof v === 'object' && 'head' in v && 'createElement' in v);
}

export function applyCursorPackToDocument(
	pack: CursorPackDefinition,
	paletteOrDoc?: ResolvedCursorPalette | Document,
	maybeDoc?: Document
): HTMLStyleElement | null {
	const palette = isDocumentLike(paletteOrDoc) ? undefined : paletteOrDoc;
	const targetDoc = (isDocumentLike(paletteOrDoc) ? paletteOrDoc : maybeDoc) ?? (typeof document !== 'undefined' ? document : undefined);
	if (!targetDoc?.head) return null;
	let el = targetDoc.head.querySelector(`style[${SHEET_ATTR}="true"]`) as HTMLStyleElement | null;
	if (!el) {
		el = targetDoc.createElement('style');
		el.setAttribute(SHEET_ATTR, 'true');
		targetDoc.head.appendChild(el);
	}
	el.setAttribute('data-cursor-pack', pack.slug);
	el.textContent = buildCursorPackCss(pack, palette);
	return el;
}

export function resetCursorPackOnDocument(doc?: Document): void {
	const targetDoc = doc ?? (typeof document !== 'undefined' ? document : undefined);
	if (!targetDoc?.head) return;
	const el = targetDoc.head.querySelector(`style[${SHEET_ATTR}="true"]`);
	if (el) el.remove();
}

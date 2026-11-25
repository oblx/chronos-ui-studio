import { clamp, CURSOR_LIMITS, THEME_PACKS } from '../tokens';
import { buildVectorCursorDataUrl, encodeSvgCursorDataUrl, resolveThemeCursorPalette } from './cursor.presets';
import {
	CSS_CURSOR_STATES,
	type CssCursorState,
	type CursorPackDefinition,
	type CursorStateAsset,
	type ResolvedCursorPalette
} from './cursor.types';

const SHEET_ATTR = 'data-ui-cursor-sheet';

function resolveAssetUrl(
	asset: CursorStateAsset | undefined,
	state: CssCursorState,
	palette?: ResolvedCursorPalette,
	packSlug?: string
): string {
	const style = (packSlug === 'archival-nib' || packSlug === 'tactical-brass' || packSlug === 'minimal-precision' ? packSlug : 'cyber-reticle') as 'cyber-reticle' | 'archival-nib' | 'tactical-brass' | 'minimal-precision';
	if (palette && (!asset?.assetDataUrl || asset.generatorOrigin === 'PRESET')) {
		return buildVectorCursorDataUrl(state, palette.fillHex, palette.primaryHex, palette.accentHex, palette.errorHex, style);
	}
	if (!asset?.assetDataUrl) {
		const fallback = palette ?? resolveThemeCursorPalette(THEME_PACKS[0]);
		return buildVectorCursorDataUrl(state, fallback.fillHex, fallback.primaryHex, fallback.accentHex, fallback.errorHex, style);
	}
	if (asset.assetDataUrl.startsWith('data:image/svg+xml,')) {
		const decoded = decodeURIComponent(asset.assetDataUrl.slice('data:image/svg+xml,'.length));
		return encodeSvgCursorDataUrl(decoded, palette ?? resolveThemeCursorPalette(THEME_PACKS[0]));
	}
	return asset.assetDataUrl;
}

function formatCursorValue(
	asset: CursorStateAsset | undefined,
	state: CssCursorState,
	palette?: ResolvedCursorPalette,
	packSlug?: string
): string {
	const url = resolveAssetUrl(asset, state, palette, packSlug);
	const x = clamp(Math.round(asset?.hotspotX ?? CURSOR_LIMITS.defaultHotspotX), 0, CURSOR_LIMITS.maxHotspot);
	const y = clamp(Math.round(asset?.hotspotY ?? CURSOR_LIMITS.defaultHotspotY), 0, CURSOR_LIMITS.maxHotspot);
	return `url("${url}") ${x} ${y}, ${state}`;
}

export function buildCursorPackCss(pack: CursorPackDefinition, resolvedPalette?: ResolvedCursorPalette): string {
	const values = new Map<CssCursorState, string>(
		CSS_CURSOR_STATES.map((st) => [st, formatCursorValue(pack.states[st], st, resolvedPalette, pack.slug)])
	);
	const vars = CSS_CURSOR_STATES.map((st) => `\t--ui-cursor-${st}: ${values.get(st)};`).join('\n');
	const classAndAttrRules = CSS_CURSOR_STATES.map(
		(st) => `.cursor-${st}, [data-ui-cursor="${st}"] { cursor: ${values.get(st)} !important; }`
	).join('\n');
	return [
		'html, body, #app { min-height: 100vh; width: 100%; }',
		`:root {\n${vars}\n}`,
		`:where(:root, html, body, #app, [data-ui-root], [data-ui-modal-backdrop]) { cursor: ${values.get('default')} !important; }`,
		`:where(a, button:not([data-ui-modal-backdrop]):not(:disabled):not([aria-disabled="true"]), summary, [role="button"]:not([aria-disabled="true"]), [role="tab"], select:not(:disabled), label[for], input[type="range"]:not(:disabled), input[type="checkbox"]:not(:disabled), input[type="radio"]:not(:disabled)) { cursor: ${values.get('pointer')} !important; }`,
		`:where(input[type="text"]:not(:disabled), input:not([type]):not(:disabled), input[type="search"]:not(:disabled), input[type="url"]:not(:disabled), input[type="password"]:not(:disabled), input[type="number"]:not(:disabled), textarea:not(:disabled), [contenteditable="true"]) { cursor: ${values.get('text')} !important; }`,
		`:where([draggable="true"], [data-ui-drag-grip], [data-ui-pan-stage], [data-ui-stage-viewport]) { cursor: ${values.get('grab')} !important; }`,
		`:where([data-ui-drag-grip]:active, [data-ui-pan-stage]:active, [data-ui-stage-viewport]:active, [data-ui-dragging="true"], .cursor-grab:active) { cursor: ${values.get('grabbing')} !important; }`,
		`:where([aria-busy="true"]) { cursor: ${values.get('progress')} !important; }`,
		`:where([data-ui-help-trigger="true"]) { cursor: ${values.get('help')} !important; }`,
		classAndAttrRules,
		`:disabled, [disabled], [aria-disabled="true"] { cursor: ${values.get('not-allowed')} !important; }`
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

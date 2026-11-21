import { CURSOR_LIMITS, THEME_PACKS, type ThemePack } from '../tokens';
import {
	CSS_CURSOR_STATES,
	type CssCursorState,
	type CursorPackDefinition,
	type CursorStateAsset,
	type ResolvedCursorPalette
} from './cursor.types';

const BASE_POINTER_PATH = 'M3 2l16.5 10.2-6.6 2.2 3.7 6.8-2.8 1.4-3.7-6.8L5.5 21.5V2z';

type OverlayBuilder = (accent: string, ink: string) => string;

const CURSOR_OVERLAY_MAP = new Map<CssCursorState, OverlayBuilder>([
	['default', (a) => `<circle cx="22" cy="23" r="2.6" fill="${a}"/>`],
	['pointer', (a, k) => `<circle cx="23" cy="8" r="3.8" fill="${a}" stroke="${k}" stroke-width="1.2"/>`],
	['grab', (a) => `<path d="M17 19h10v7H17z" fill="none" stroke="${a}" stroke-width="2"/>`],
	['grabbing', (a, k) => `<rect x="17" y="19" width="10" height="7" fill="${a}" stroke="${k}" stroke-width="1.2"/>`],
	['text', (a) => `<path d="M20 5h6M23 5v20M20 25h6" stroke="${a}" stroke-width="2.2" stroke-linecap="square"/>`],
	['move', (a) => `<path d="M23 14v12M17 20h12" stroke="${a}" stroke-width="2.2"/>`],
	['not-allowed', (a) => `<circle cx="22" cy="22" r="5.5" fill="none" stroke="${a}" stroke-width="2.2"/><path d="M18 26l8-8" stroke="${a}" stroke-width="2.2"/>`],
	['wait', (a) => `<circle cx="22" cy="22" r="5.5" fill="none" stroke="${a}" stroke-width="2.2" stroke-dasharray="16 6"/>`],
	['progress', (a) => `<circle cx="22" cy="22" r="5.5" fill="none" stroke="${a}" stroke-width="2.2" stroke-dasharray="10 6"/>`],
	['crosshair', (a, k) => `<path d="M16 4v24M4 16h24" stroke="${a}" stroke-width="2"/><circle cx="16" cy="16" r="5" fill="none" stroke="${k}" stroke-width="1.5"/>`],
	['help', (a) => `<path d="M20 17c0-2 4.2-2 4.2 0 0 1.3-2.1 1.6-2.1 3M22.1 24h.01" stroke="${a}" stroke-width="2.2" stroke-linecap="round"/>`],
	['zoom-in', (a) => `<circle cx="21" cy="21" r="5" fill="none" stroke="${a}" stroke-width="2"/><path d="M18.5 21h5M21 18.5v5" stroke="${a}" stroke-width="2"/>`],
	['zoom-out', (a) => `<circle cx="21" cy="21" r="5" fill="none" stroke="${a}" stroke-width="2"/><path d="M18.5 21h5" stroke="${a}" stroke-width="2"/>`],
	['col-resize', (a) => `<path d="M16 22h12M19 19l-3 3 3 3M25 19l3 3-3 3" fill="none" stroke="${a}" stroke-width="2"/>`],
	['row-resize', (a) => `<path d="M23 15v12M20 18l3-3 3 3M20 24l3 3 3-3" fill="none" stroke="${a}" stroke-width="2"/>`],
	['nesw-resize', (a) => `<path d="M18 26l9-9M22 17h5v5M18 21v5h5" fill="none" stroke="${a}" stroke-width="2"/>`],
	['nwse-resize', (a) => `<path d="M18 17l9 9M18 22v-5h5M27 21v5h-5" fill="none" stroke="${a}" stroke-width="2"/>`],
	['copy', (a) => `<rect x="17" y="17" width="10" height="10" fill="none" stroke="${a}" stroke-width="1.8"/><path d="M22 19.5v5M19.5 22h5" stroke="${a}" stroke-width="1.8"/>`],
	['alias', (a) => `<path d="M18 26l8-8M21 18h5v5" fill="none" stroke="${a}" stroke-width="2"/>`],
	['cell', (a, k) => `<path d="M16 6v20M6 16h20" stroke="${a}" stroke-width="3.2"/><path d="M16 6v20M6 16h20" stroke="${k}" stroke-width="1.2"/>`],
	['context-menu', (a) => `<rect x="17" y="17" width="10" height="10" fill="none" stroke="${a}" stroke-width="1.8"/><path d="M19.5 20h5M19.5 22.5h5M19.5 25h3.5" stroke="${a}" stroke-width="1.6"/>`]
]);

export function resolveThemeCursorPalette(theme: ThemePack = THEME_PACKS[0]): ResolvedCursorPalette {
	const t = theme.tokens;
	return {
		primaryHex: t['--ui-primary'],
		accentHex: t['--ui-accent-vivid'] || t['--ui-accent'],
		strokeHex: t['--ui-base-content'],
		fillHex: t['--ui-base-100']
	};
}

export function sanitizeSvgCursorColors(svg: string, palette: ResolvedCursorPalette = resolveThemeCursorPalette()): string {
	return svg
		.replace(/var\(--ui-accent(?:-vivid)?(?:,[^)]+)?\)/gi, palette.accentHex)
		.replace(/var\(--ui-primary(?:,[^)]+)?\)/gi, palette.primaryHex)
		.replace(/var\(--ui-base-content(?:,[^)]+)?\)/gi, palette.strokeHex)
		.replace(/var\(--ui-base-\d+(?:,[^)]+)?\)/gi, palette.fillHex)
		.replace(/var\(--[^)]+\)/gi, palette.primaryHex);
}

export function encodeSvgCursorDataUrl(svg: string, palette?: ResolvedCursorPalette): string {
	const sz = CURSOR_LIMITS.normalizedPx;
	let normalized = sanitizeSvgCursorColors(svg.trim().replace(/\s+/g, ' '), palette);
	if (!/xmlns="/i.test(normalized)) normalized = normalized.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
	if (!/width="/i.test(normalized)) normalized = normalized.replace('<svg', `<svg width="${sz}" height="${sz}"`);
	if (!/viewBox="/i.test(normalized)) normalized = normalized.replace('<svg', `<svg viewBox="0 0 ${sz} ${sz}"`);
	const encoded = normalized.replace(/%/g, '%25').replace(/#/g, '%23').replace(/"/g, '%22').replace(/</g, '%3C').replace(/>/g, '%3E').replace(/\s+/g, '%20');
	return `data:image/svg+xml,${encoded}`;
}

export function buildVectorCursorDataUrl(state: CssCursorState, fill: string, stroke: string, accent: string): string {
	const sz = CURSOR_LIMITS.normalizedPx;
	const centered = state === 'crosshair' || state === 'cell';
	const base = centered
		? ''
		: `<path d="${BASE_POINTER_PATH}" fill="${fill}" stroke="${stroke}" stroke-width="1.75" stroke-linejoin="miter"/>`;
	const overlay = CURSOR_OVERLAY_MAP.get(state)?.(accent, stroke) ?? '';
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}">${base}${overlay}</svg>`;
	return encodeSvgCursorDataUrl(svg);
}

function buildPresetStates(fill: string, stroke: string, accent: string): Readonly<Record<CssCursorState, CursorStateAsset>> {
	const out = {} as Record<CssCursorState, CursorStateAsset>;
	for (const cssState of CSS_CURSOR_STATES) {
		const isCenter = cssState === 'crosshair' || cssState === 'cell';
		out[cssState] = {
			cssState,
			assetDataUrl: buildVectorCursorDataUrl(cssState, fill, stroke, accent),
			hotspotX: isCenter ? CURSOR_LIMITS.centerHotspot : CURSOR_LIMITS.defaultHotspotX,
			hotspotY: isCenter ? CURSOR_LIMITS.centerHotspot : CURSOR_LIMITS.defaultHotspotY,
			generatorOrigin: 'PRESET'
		};
	}
	return out;
}

export const BUILTIN_CURSOR_PACKS: readonly CursorPackDefinition[] = [
	{
		uuid: '01950000-0000-7000-8000-000000000c01',
		slug: 'cyber-reticle',
		name: 'Cyber Reticle',
		description: 'Precision chamfered pointer with cyan tactical reticles across all 21 CSS UI Level 4 states.',
		isBuiltin: true,
		baseHotspotX: CURSOR_LIMITS.defaultHotspotX,
		baseHotspotY: CURSOR_LIMITS.defaultHotspotY,
		states: buildPresetStates('#0b1020', '#22d3ee', '#f59e0b')
	},
	{
		uuid: '01950000-0000-7000-8000-000000000c02',
		slug: 'archival-nib',
		name: 'Archival Nib',
		description: 'Warm ink-vellum stylus pointer crafted for bright reading and editorial suites.',
		isBuiltin: true,
		baseHotspotX: CURSOR_LIMITS.defaultHotspotX,
		baseHotspotY: CURSOR_LIMITS.defaultHotspotY,
		states: buildPresetStates('#faf7f0', '#1f2937', '#b45309')
	},
	{
		uuid: '01950000-0000-7000-8000-000000000c03',
		slug: 'tactical-brass',
		name: 'Tactical Brass',
		description: 'High-contrast amber and obsidian mechanical calipers for command consoles.',
		isBuiltin: true,
		baseHotspotX: CURSOR_LIMITS.defaultHotspotX,
		baseHotspotY: CURSOR_LIMITS.defaultHotspotY,
		states: buildPresetStates('#18181b', '#f59e0b', '#fbbf24')
	},
	{
		uuid: '01950000-0000-7000-8000-000000000c04',
		slug: 'minimal-precision',
		name: 'Minimal Precision',
		description: 'Razor-thin neutral geometric pointers with indigo focus accents.',
		isBuiltin: true,
		baseHotspotX: CURSOR_LIMITS.defaultHotspotX,
		baseHotspotY: CURSOR_LIMITS.defaultHotspotY,
		states: buildPresetStates('#ffffff', '#111827', '#6366f1')
	}
] as const;

export function findBuiltinCursorPack(idOrSlug: string): CursorPackDefinition | undefined {
	return BUILTIN_CURSOR_PACKS.find((p) => p.uuid === idOrSlug || p.slug === idOrSlug);
}

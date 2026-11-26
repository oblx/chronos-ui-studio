import { CURSOR_LIMITS, THEME_PACKS, type ThemePack } from '../tokens';
import {
	buildBespokeCursorBody,
	CURSOR_CALIBRATED_HOTSPOTS,
	type CursorPackStyleId
} from './cursor.silhouettes';
import {
	CSS_CURSOR_STATES,
	type CssCursorState,
	type CursorPackDefinition,
	type CursorStateAsset,
	type ResolvedCursorPalette
} from './cursor.types';

export function resolveThemeCursorPalette(theme: ThemePack = THEME_PACKS[0]): ResolvedCursorPalette {
	const t = theme.tokens;
	return {
		primaryHex: t['--ui-primary'],
		accentHex: t['--ui-accent-vivid'] || t['--ui-accent'],
		strokeHex: t['--ui-base-content'],
		fillHex: t['--ui-base-100'],
		errorHex: t['--ui-error']
	};
}

export function sanitizeSvgCursorColors(svg: string, palette: ResolvedCursorPalette = resolveThemeCursorPalette()): string {
	return svg
		.replace(/var\(--ui-error(?:,[^)]+)?\)/gi, palette.errorHex ?? palette.accentHex)
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

export function buildVectorCursorDataUrl(
	state: CssCursorState,
	fill: string,
	stroke: string,
	accent: string,
	danger = THEME_PACKS[0].tokens['--ui-error'],
	style: CursorPackStyleId = 'cyber-reticle'
): string {
	const sz = CURSOR_LIMITS.normalizedPx;
	const body = buildBespokeCursorBody(state, { fill, stroke, accent, danger, style });
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}">${body}</svg>`;
	return encodeSvgCursorDataUrl(svg);
}

function buildPresetStates(
	fill: string,
	stroke: string,
	accent: string,
	danger: string,
	style: CursorPackStyleId
): Readonly<Record<CssCursorState, CursorStateAsset>> {
	const out = {} as Record<CssCursorState, CursorStateAsset>;
	for (const cssState of CSS_CURSOR_STATES) {
		const [hotspotX, hotspotY] = CURSOR_CALIBRATED_HOTSPOTS[cssState];
		out[cssState] = {
			cssState,
			assetDataUrl: buildVectorCursorDataUrl(cssState, fill, stroke, accent, danger, style),
			hotspotX,
			hotspotY,
			generatorOrigin: 'PRESET'
		};
	}
	return out;
}

function defineBuiltinCursorPack(
	uuid: string,
	slug: CursorPackStyleId,
	name: string,
	description: string,
	fill: string,
	stroke: string,
	accent: string,
	danger: string
): CursorPackDefinition {
	const [baseHotspotX, baseHotspotY] = CURSOR_CALIBRATED_HOTSPOTS.default;
	return {
		uuid, slug, name, description, isBuiltin: true,
		baseHotspotX, baseHotspotY,
		states: buildPresetStates(fill, stroke, accent, danger, slug)
	};
}

export const BUILTIN_CURSOR_PACKS: readonly CursorPackDefinition[] = [
	defineBuiltinCursorPack('01950000-0000-7000-8000-000000000c01', 'cyber-reticle', 'Cyber Reticle', '45-deg chamfered high-contrast cyan/amber architectural silhouettes across all 21 CSS UI Level 4 states.', '#0b1020', '#22d3ee', '#f59e0b', '#f43f5e'),
	defineBuiltinCursorPack('01950000-0000-7000-8000-000000000c02', 'archival-nib', 'Archival Nib', 'Calligraphic ink-vellum drafting silhouettes tuned for high-legibility light editorial suites.', '#faf7f0', '#1f2937', '#b45309', '#dc2626'),
	defineBuiltinCursorPack('01950000-0000-7000-8000-000000000c03', 'tactical-brass', 'Tactical Brass', 'Precision vernier caliper silhouettes in obsidian and burnished brass for command decks.', '#18181b', '#f59e0b', '#fbbf24', '#ef4444'),
	defineBuiltinCursorPack('01950000-0000-7000-8000-000000000c04', 'minimal-precision', 'Minimal Precision', 'Ultra-clean Swiss geometric hairline silhouettes with crisp indigo action accents.', '#ffffff', '#111827', '#6366f1', '#e11d48')
] as const;

export function findBuiltinCursorPack(idOrSlug: string): CursorPackDefinition | undefined {
	return BUILTIN_CURSOR_PACKS.find((p) => p.uuid === idOrSlug || p.slug === idOrSlug);
}

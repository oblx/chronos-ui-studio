import {
	buildVectorCursorDataUrl,
	CSS_CURSOR_STATES,
	CURSOR_LIMITS,
	encodeSvgCursorDataUrl,
	THEME_PACKS,
	type CssCursorState,
	type CursorGeneratorOrigin,
	type CursorPackDefinition,
	type CursorStateAsset
} from '@chronos-ui/svelte';

export const CURSOR_MAX_BYTES = CURSOR_LIMITS.maxBytes;
const SYNTH_TOKENS = THEME_PACKS[0].tokens;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;

export type PngCheckResult =
	| { ok: true; width: number; height: number; byteLength: number }
	| { ok: false; error: string };

export function validatePngDataUrl(dataUrl: string): PngCheckResult {
	const prefix = 'data:image/png;base64,';
	if (!dataUrl.startsWith(prefix)) return { ok: false, error: 'Image must be a base64 PNG data URL.' };
	const raw = Buffer.from(dataUrl.slice(prefix.length), 'base64');
	if (raw.byteLength < 24 || raw.byteLength > CURSOR_MAX_BYTES) {
		return { ok: false, error: `PNG size ${raw.byteLength}B exceeds allowed 24B..${CURSOR_MAX_BYTES}B limit.` };
	}
	for (let i = 0; i < PNG_MAGIC.length; i += 1) {
		if (raw[i] !== PNG_MAGIC[i]) return { ok: false, error: 'Invalid PNG magic signature (89 50 4E 47).' };
	}
	const width = raw.readUInt32BE(16);
	const height = raw.readUInt32BE(20);
	if (width < CURSOR_LIMITS.minDim || height < CURSOR_LIMITS.minDim || width > CURSOR_LIMITS.maxDim || height > CURSOR_LIMITS.maxDim) {
		return { ok: false, error: `PNG dimensions ${width}x${height} out of ${CURSOR_LIMITS.minDim}..${CURSOR_LIMITS.maxDim} bounds.` };
	}
	return { ok: true, width, height, byteLength: raw.byteLength };
}

type BadgeBuilder = (accent: string) => string;

const STATE_BADGE_MAP = new Map<CssCursorState, BadgeBuilder>([
	['default', () => ''],
	['pointer', (a) => `<circle cx="24" cy="7" r="4" fill="${a}"/>`],
	['grab', (a) => `<rect x="19" y="19" width="9" height="7" rx="1" fill="none" stroke="${a}" stroke-width="2"/>`],
	['grabbing', (a) => `<rect x="19" y="19" width="9" height="7" fill="${a}"/>`],
	['text', (a) => `<path d="M23 5h5M25.5 5v14M23 19h5" stroke="${a}" stroke-width="2"/>`],
	['move', (a) => `<path d="M24 17v10M19 22h10" stroke="${a}" stroke-width="2"/>`],
	['not-allowed', (a) => `<circle cx="23" cy="23" r="5" fill="none" stroke="${a}" stroke-width="2"/><path d="M19 27l8-8" stroke="${a}" stroke-width="2"/>`],
	['wait', (a) => `<circle cx="23" cy="23" r="5" fill="none" stroke="${a}" stroke-width="2" stroke-dasharray="14 6"/>`],
	['progress', (a) => `<circle cx="23" cy="23" r="5" fill="none" stroke="${a}" stroke-width="2" stroke-dasharray="10 6"/>`],
	['crosshair', (a) => `<path d="M16 3v26M3 16h26" stroke="${a}" stroke-width="2"/>`],
	['help', (a) => `<path d="M21 20c0-2 4-2 4 0 0 1-2 1.5-2 3M23 26h.01" stroke="${a}" stroke-width="2" stroke-linecap="round"/>`],
	['zoom-in', (a) => `<circle cx="22" cy="22" r="4.5" fill="none" stroke="${a}" stroke-width="1.8"/><path d="M20 22h4M22 20v4" stroke="${a}" stroke-width="1.8"/>`],
	['zoom-out', (a) => `<circle cx="22" cy="22" r="4.5" fill="none" stroke="${a}" stroke-width="1.8"/><path d="M20 22h4" stroke="${a}" stroke-width="1.8"/>`],
	['col-resize', (a) => `<path d="M18 24h10M20 21l-3 3 3 3M26 21l3 3-3 3" fill="none" stroke="${a}" stroke-width="1.8"/>`],
	['row-resize', (a) => `<path d="M24 18v10M21 20l3-3 3 3M21 26l3 3 3-3" fill="none" stroke="${a}" stroke-width="1.8"/>`],
	['nesw-resize', (a) => `<path d="M19 27l8-8M23 19h4v4M19 23v4h4" fill="none" stroke="${a}" stroke-width="1.8"/>`],
	['nwse-resize', (a) => `<path d="M19 19l8 8M19 23v-4h4M27 23v4h-4" fill="none" stroke="${a}" stroke-width="1.8"/>`],
	['copy', (a) => `<rect x="18" y="18" width="10" height="10" fill="none" stroke="${a}" stroke-width="1.8"/><path d="M23 20v6M20 23h6" stroke="${a}" stroke-width="1.8"/>`],
	['alias', (a) => `<path d="M19 27l8-8M22 19h5v5" fill="none" stroke="${a}" stroke-width="2"/>`],
	['cell', (a) => `<path d="M16 5v22M5 16h22" stroke="${a}" stroke-width="3"/>`],
	['context-menu', (a) => `<rect x="18" y="18" width="10" height="10" fill="none" stroke="${a}" stroke-width="1.8"/><path d="M20 21h6M20 23.5h6M20 26h4" stroke="${a}" stroke-width="1.6"/>`]
]);

export function composeDerivedCursorSvgDataUrl(
	sourcePngDataUrl: string | null | undefined,
	cssState: CssCursorState,
	accent = SYNTH_TOKENS['--ui-accent-vivid']
): string {
	if (!sourcePngDataUrl) {
		return buildVectorCursorDataUrl(cssState, SYNTH_TOKENS['--ui-base-100'], accent, SYNTH_TOKENS['--ui-primary']);
	}
	const sz = CURSOR_LIMITS.normalizedPx;
	const mid = CURSOR_LIMITS.centerHotspot;
	if (cssState === 'crosshair' || cssState === 'cell') {
		const badge = STATE_BADGE_MAP.get(cssState)?.(accent) ?? '';
		const ring = cssState === 'crosshair'
			? `<circle cx="${mid}" cy="${mid}" r="5" fill="none" stroke="${SYNTH_TOKENS['--ui-base-content']}" stroke-width="1.4"/>`
			: '';
		return encodeSvgCursorDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}">${badge}${ring}</svg>`);
	}
	const badge = STATE_BADGE_MAP.get(cssState)?.(accent) ?? '';
	return encodeSvgCursorDataUrl(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}"><image href="${sourcePngDataUrl}" x="1" y="1" width="22" height="22"/>${badge}</svg>`
	);
}

export async function deriveAllCursorStates(opts: {
	readonly basePack: CursorPackDefinition;
	readonly accentColor?: string;
	readonly useAiLabel?: boolean;
}): Promise<{ states: Readonly<Record<CssCursorState, CursorStateAsset>>; origin: CursorGeneratorOrigin }> {
	const accent = opts.accentColor ?? SYNTH_TOKENS['--ui-accent-vivid'];
	const origin: CursorGeneratorOrigin = opts.useAiLabel ? 'AI_DERIVED' : 'PROCEDURAL_SVG';
	const next = {} as Record<CssCursorState, CursorStateAsset>;
	for (const st of CSS_CURSOR_STATES) {
		if (st === 'default' && opts.basePack.sourcePngDataUrl) {
			next[st] = {
				cssState: 'default', assetDataUrl: opts.basePack.sourcePngDataUrl,
				hotspotX: opts.basePack.baseHotspotX, hotspotY: opts.basePack.baseHotspotY, generatorOrigin: 'USER_UPLOAD'
			};
			continue;
		}
		const isCenter = st === 'crosshair' || st === 'cell';
		next[st] = {
			cssState: st,
			assetDataUrl: composeDerivedCursorSvgDataUrl(opts.basePack.sourcePngDataUrl, st, accent),
			hotspotX: isCenter ? CURSOR_LIMITS.centerHotspot : opts.basePack.baseHotspotX,
			hotspotY: isCenter ? CURSOR_LIMITS.centerHotspot : opts.basePack.baseHotspotY,
			generatorOrigin: origin
		};
	}
	return { states: next, origin };
}

export const WORKSPACE_CURSOR_TOOL_DESCRIPTORS = [
	{ name: 'ui_save_project', description: 'Commit explicit project snapshot, active cursor pack, corner radius, theme, and entities.', humanTitle: 'Save Workspace', plainDescription: 'Persist active workspace state, revision, and entities.', category: 'BLUEPRINTS', icon: 'save', intentKind: 'UI_PROJECT_SAVE', requiredCapabilityBit: 2, inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, name: { type: 'string' } } }, outputSchema: { type: 'object', properties: { savedAt: { type: 'number' }, revisionId: { type: 'string' } } }, annotations: { readOnlyHint: false, idempotentHint: true, destructiveHint: false } },
	{ name: 'ui_clean_project', description: 'Clear all nodes in a workspace to restore Calm Empty Stage.', humanTitle: 'Clean Workspace', plainDescription: 'Clear canvas elements safely into a blank undoable stage.', category: 'BUILD', icon: 'reset', intentKind: 'UI_PROJECT_CLEAN', requiredCapabilityBit: 2, inputSchema: { type: 'object', properties: { projectId: { type: 'string' } } }, outputSchema: { type: 'object', properties: { revisionId: { type: 'string' }, project: { type: 'object' } } }, annotations: { readOnlyHint: false, idempotentHint: true, destructiveHint: true } },
	{ name: 'ui_reset_workspace_view', description: 'Reset viewport pan, zoom, studio panels, and motion to default baseline.', humanTitle: 'Default View', plainDescription: 'Recenter stage camera and restore balanced HUD defaults.', category: 'CUSTOMIZE', icon: 'reset', intentKind: 'UI_WORKSPACE_RESET_DEFAULT', requiredCapabilityBit: 1, inputSchema: { type: 'object', properties: {} }, outputSchema: { type: 'object', properties: { reset: { type: 'boolean' } } }, annotations: { readOnlyHint: false, idempotentHint: true, destructiveHint: false } },
	{ name: 'ui_list_cursor_packs', description: 'List built-in and PNG-derived 21-state CSS cursor packs.', humanTitle: 'List Cursor Packs', plainDescription: 'Inspect all curated and custom 21-state CSS cursor themes.', category: 'CUSTOMIZE', icon: 'cursor', intentKind: 'UI_APPLY_CURSOR_PACK', requiredCapabilityBit: 1, inputSchema: { type: 'object', properties: {} }, outputSchema: { type: 'object', properties: { packs: { type: 'array' } } }, annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false } },
	{ name: 'ui_apply_cursor_pack', description: 'Apply or reset a 21-state cursor pack on a workspace.', humanTitle: 'Apply Cursor Pack', plainDescription: 'Bind a live 21-state cursor pack to the workspace.', category: 'CUSTOMIZE', icon: 'cursor', intentKind: 'UI_APPLY_CURSOR_PACK', requiredCapabilityBit: 4, inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, packId: { type: 'string' } }, required: ['packId'] }, outputSchema: { type: 'object', properties: { project: { type: 'object' }, cssLength: { type: 'number' } } }, annotations: { readOnlyHint: false, idempotentHint: true, destructiveHint: false } },
	{ name: 'ui_derive_cursor_states', description: 'Synthesize all 20 secondary CSS cursor states from a base pack or uploaded PNG.', humanTitle: 'Derive 21 Cursor States', plainDescription: 'Generate complete interactive CSS cursor states from a base graphic.', category: 'CUSTOMIZE', icon: 'cursor', intentKind: 'UI_UPDATE_CURSOR_STATE', requiredCapabilityBit: 4, inputSchema: { type: 'object', properties: { packId: { type: 'string' }, accentColor: { type: 'string' } }, required: ['packId'] }, outputSchema: { type: 'object', properties: { pack: { type: 'object' }, derivedCount: { type: 'number' } } }, annotations: { readOnlyHint: false, idempotentHint: true, destructiveHint: false } }
] as const;

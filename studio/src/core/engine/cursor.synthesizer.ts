import {
	buildBespokeCursorBody,
	buildVectorCursorDataUrl,
	CSS_CURSOR_STATES,
	CURSOR_CALIBRATED_HOTSPOTS,
	CURSOR_LIMITS,
	encodeSvgCursorDataUrl,
	THEME_PACKS,
	type CssCursorState,
	type CursorGeneratorOrigin,
	type CursorPackDefinition,
	type CursorStateAsset
} from '@chronos-ui/svelte';
import { CAPABILITY_BITS } from '@studio/config';

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

const STANDALONE_SILHOUETTE_STATES = new Set<CssCursorState>([
	'pointer', 'grab', 'grabbing', 'text', 'move', 'not-allowed', 'wait', 'progress',
	'crosshair', 'zoom-in', 'zoom-out', 'col-resize', 'row-resize', 'nesw-resize', 'nwse-resize', 'cell'
]);

export function composeDerivedCursorSvgDataUrl(
	sourcePngDataUrl: string | null | undefined,
	cssState: CssCursorState,
	accent = SYNTH_TOKENS['--ui-accent-vivid']
): string {
	const fill = SYNTH_TOKENS['--ui-base-100'];
	const secondary = SYNTH_TOKENS['--ui-primary'];
	const err = SYNTH_TOKENS['--ui-error'];
	if (!sourcePngDataUrl || STANDALONE_SILHOUETTE_STATES.has(cssState)) {
		return buildVectorCursorDataUrl(cssState, fill, accent, secondary, err);
	}
	const sz = CURSOR_LIMITS.normalizedPx;
	const overlay = buildBespokeCursorBody(cssState, { fill, stroke: secondary, accent, danger: err });
	if (cssState === 'default') {
		return encodeSvgCursorDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}"><image href="${sourcePngDataUrl}" x="0" y="0" width="${sz}" height="${sz}"/></svg>`);
	}
	return encodeSvgCursorDataUrl(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}"><image href="${sourcePngDataUrl}" x="1" y="1" width="18" height="18"/><g transform="translate(8 8) scale(0.75)">${overlay}</g></svg>`
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
		const [calX, calY] = CURSOR_CALIBRATED_HOTSPOTS[st];
		const useBaseSpot = Boolean(opts.basePack.sourcePngDataUrl && !STANDALONE_SILHOUETTE_STATES.has(st));
		next[st] = {
			cssState: st,
			assetDataUrl: composeDerivedCursorSvgDataUrl(opts.basePack.sourcePngDataUrl, st, accent),
			hotspotX: useBaseSpot ? opts.basePack.baseHotspotX : calX,
			hotspotY: useBaseSpot ? opts.basePack.baseHotspotY : calY,
			generatorOrigin: origin
		};
	}
	return { states: next, origin };
}

export const WORKSPACE_CURSOR_TOOL_DESCRIPTORS = [
	{ name: 'ui_save_project', description: 'Commit explicit project snapshot, active cursor pack, corner radius, theme, and entities.', humanTitle: 'Save Workspace', plainDescription: 'Persist active workspace state, revision, and entities.', category: 'BLUEPRINTS', icon: 'save', intentKind: 'UI_PROJECT_SAVE', requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS, inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, name: { type: 'string' } } }, outputSchema: { type: 'object', properties: { savedAt: { type: 'number' }, revisionId: { type: 'string' } } }, annotations: { readOnlyHint: false, idempotentHint: true, destructiveHint: false } },
	{ name: 'ui_clean_project', description: 'Clear all nodes in a workspace to restore Calm Empty Stage.', humanTitle: 'Clean Workspace', plainDescription: 'Clear canvas elements safely into a blank undoable stage.', category: 'BUILD', icon: 'reset', intentKind: 'UI_PROJECT_CLEAN', requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS, inputSchema: { type: 'object', properties: { projectId: { type: 'string' } } }, outputSchema: { type: 'object', properties: { revisionId: { type: 'string' }, project: { type: 'object' } } }, annotations: { readOnlyHint: false, idempotentHint: true, destructiveHint: true } },
	{ name: 'ui_reject_all_staged', description: 'Atomically reject and discard all STAGING and BUILDING nodes in the active workspace.', humanTitle: 'Reject All Staged', plainDescription: 'Discard all pending staged canvas cards in one undoable step.', category: 'BUILD', icon: 'close', intentKind: 'UI_REJECT_ALL_STAGED', requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS, inputSchema: { type: 'object', properties: { projectId: { type: 'string' } } }, outputSchema: { type: 'object', properties: { rejectedCount: { type: 'number' }, project: { type: 'object' } } }, annotations: { readOnlyHint: false, idempotentHint: true, destructiveHint: true } },
	{ name: 'ui_reset_workspace_view', description: 'Reset viewport pan, zoom, studio panels, and motion to default baseline.', humanTitle: 'Default View', plainDescription: 'Recenter stage camera and restore balanced HUD defaults.', category: 'CUSTOMIZE', icon: 'reset', intentKind: 'UI_WORKSPACE_RESET_DEFAULT', requiredCapabilityBit: CAPABILITY_BITS.READ_BLUEPRINTS, inputSchema: { type: 'object', properties: {} }, outputSchema: { type: 'object', properties: { reset: { type: 'boolean' } } }, annotations: { readOnlyHint: false, idempotentHint: true, destructiveHint: false } },
	{ name: 'ui_list_cursor_packs', description: 'List built-in and PNG-derived 21-state CSS cursor packs.', humanTitle: 'List Cursor Packs', plainDescription: 'Inspect all curated and custom 21-state CSS cursor themes.', category: 'CUSTOMIZE', icon: 'cursor', intentKind: 'UI_APPLY_CURSOR_PACK', requiredCapabilityBit: CAPABILITY_BITS.READ_BLUEPRINTS, inputSchema: { type: 'object', properties: {} }, outputSchema: { type: 'object', properties: { packs: { type: 'array' } } }, annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false } },
	{ name: 'ui_apply_cursor_pack', description: 'Apply or reset a 21-state cursor pack on a workspace.', humanTitle: 'Apply Cursor Pack', plainDescription: 'Bind a live 21-state cursor pack to the workspace.', category: 'CUSTOMIZE', icon: 'cursor', intentKind: 'UI_APPLY_CURSOR_PACK', requiredCapabilityBit: CAPABILITY_BITS.WRITE_THEMES, inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, packId: { type: 'string' } }, required: ['packId'] }, outputSchema: { type: 'object', properties: { project: { type: 'object' }, cssLength: { type: 'number' } } }, annotations: { readOnlyHint: false, idempotentHint: true, destructiveHint: false } },
	{ name: 'ui_derive_cursor_states', description: 'Synthesize all 20 secondary CSS cursor states from a base pack or uploaded PNG.', humanTitle: 'Derive 21 Cursor States', plainDescription: 'Generate complete interactive CSS cursor states from a base graphic.', category: 'CUSTOMIZE', icon: 'cursor', intentKind: 'UI_UPDATE_CURSOR_STATE', requiredCapabilityBit: CAPABILITY_BITS.WRITE_THEMES, inputSchema: { type: 'object', properties: { packId: { type: 'string' }, accentColor: { type: 'string' } }, required: ['packId'] }, outputSchema: { type: 'object', properties: { pack: { type: 'object' }, derivedCount: { type: 'number' } } }, annotations: { readOnlyHint: false, idempotentHint: true, destructiveHint: false } }
] as const;

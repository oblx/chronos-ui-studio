import {
	COMPONENT_CATALOG, CORNER_ANIMATIONS, CORNER_EMBELLISHMENTS, CORNER_MODES,
	HUD_ZONES, UI_FRAME_SHAPES,
	type CornerAnimation, type CornerEmbellishment, type CornerKind, type CornerTuple,
	type HudZoneId, type UiComponentKind, type UiFrameShape, type UiNode,
	type UiNodeLifecycle, type UiNodeTree, type UiProjectBuildConfig, type UiProjectDefinition
} from '@chronos-ui/svelte';

const VALID_ZONES = new Set<string>(HUD_ZONES);
const VALID_TYPES = new Set<string>(COMPONENT_CATALOG.map((c) => c.type));
const VALID_LIFECYCLE = new Set<string>(['STAGING', 'BUILDING', 'COMMITTED']);
const VALID_CORNERS = new Set<string>(CORNER_MODES);
const VALID_SHAPES = new Set<string>(UI_FRAME_SHAPES);
const VALID_EMBELLISHMENTS = new Set<string>(CORNER_EMBELLISHMENTS);
const VALID_ANIMATIONS = new Set<string>(CORNER_ANIMATIONS);

export const DEFAULT_BUILD_CONFIG: UiProjectBuildConfig = {
	protocol: 'https',
	basePath: '/',
	apiEndpoint: '',
	secretRefs: [],
	inlineBundle: false
};

export type NodeValidationResult = { ok: true; node: UiNode } | { ok: false; error: string };
export type ProjectValidationResult = { ok: true; project: UiProjectDefinition } | { ok: false; error: string };

function parseCornerTuple(raw: unknown): CornerTuple | undefined {
	if (!Array.isArray(raw) || raw.length !== 4) return undefined;
	if (!raw.every((c) => typeof c === 'string' && VALID_CORNERS.has(c))) return undefined;
	return raw as unknown as CornerTuple;
}

function parseNodeVisualMeta(o: Record<string, unknown>) {
	const corners = parseCornerTuple(o.corners);
	const shape = typeof o.shape === 'string' && VALID_SHAPES.has(o.shape) ? (o.shape as UiFrameShape) : undefined;
	const cornerEmbellishment = typeof o.cornerEmbellishment === 'string' && VALID_EMBELLISHMENTS.has(o.cornerEmbellishment) ? (o.cornerEmbellishment as CornerEmbellishment) : undefined;
	const cornerAnimation = typeof o.cornerAnimation === 'string' && VALID_ANIMATIONS.has(o.cornerAnimation) ? (o.cornerAnimation as CornerAnimation) : undefined;
	const emb = o.embellishmentConfig as Record<string, unknown> | undefined;
	const embellishmentConfig = emb && typeof emb.offsetRem === 'number' && typeof emb.amplitudeRem === 'number' && typeof emb.periodMs === 'number'
		? { offsetRem: emb.offsetRem, amplitudeRem: emb.amplitudeRem, periodMs: emb.periodMs } : undefined;
	return { corners, shape, cornerEmbellishment, cornerAnimation, embellishmentConfig };
}

export function validateUiNode(raw: unknown): NodeValidationResult {
	if (!raw || typeof raw !== 'object') return { ok: false, error: 'Node payload must be an object.' };
	const o = raw as Record<string, unknown>;
	if (typeof o.id !== 'string' || !o.id.trim()) return { ok: false, error: 'Node requires non-empty id.' };
	if (typeof o.type !== 'string' || !VALID_TYPES.has(o.type)) return { ok: false, error: `Unknown component type: ${String(o.type)}` };
	if (typeof o.zone !== 'string' || !VALID_ZONES.has(o.zone)) return { ok: false, error: `Invalid zone: ${String(o.zone)}` };
	const lifecycle = (typeof o.lifecycle === 'string' && VALID_LIFECYCLE.has(o.lifecycle) ? o.lifecycle : 'STAGING') as UiNodeLifecycle;
	const props = (o.props && typeof o.props === 'object' && !Array.isArray(o.props)) ? (o.props as Record<string, unknown>) : {};
	const visual = parseNodeVisualMeta(o);
	const children: UiNode[] = [];
	if (Array.isArray(o.children)) {
		for (const child of o.children) {
			const res = validateUiNode(child);
			if (!res.ok) return res;
			children.push(res.node);
		}
	}
	const label = typeof o.label === 'string' && o.label.trim() ? o.label.trim() : o.type;
	const intent = typeof o.intentBinding === 'string' ? { intentBinding: o.intentBinding } : {};
	return { ok: true, node: { id: o.id.trim(), type: o.type as UiComponentKind, zone: o.zone as HudZoneId, label, lifecycle, props, ...visual, ...intent, ...(children.length > 0 ? { children } : {}) } };
}

export function validateUiNodeTree(raw: unknown): { ok: true; nodes: UiNodeTree } | { ok: false; error: string } {
	if (!Array.isArray(raw)) return { ok: false, error: 'Node tree must be an array.' };
	const nodes: UiNode[] = [];
	for (const item of raw) {
		const res = validateUiNode(item);
		if (!res.ok) return res;
		nodes.push(res.node);
	}
	return { ok: true, nodes };
}

export function validateProjectDefinition(raw: unknown): ProjectValidationResult {
	if (!raw || typeof raw !== 'object') return { ok: false, error: 'Project must be an object.' };
	const o = raw as Record<string, unknown>;
	if (typeof o.name !== 'string' || !o.name.trim()) return { ok: false, error: 'Project name is required.' };
	const treeCheck = validateUiNodeTree(o.nodes ?? []);
	if (!treeCheck.ok) return treeCheck;
	const slug = typeof o.slug === 'string' && o.slug.trim()
		? o.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-')
		: o.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
	const cornerMode = (typeof o.cornerMode === 'string' && VALID_CORNERS.has(o.cornerMode) ? o.cornerMode : 'CHAMFER') as CornerKind;
	return {
		ok: true,
		project: {
			id: typeof o.id === 'string' && o.id.trim() ? o.id.trim() : `proj-${slug}-${Date.now().toString(36)}`,
			slug,
			name: o.name.trim(),
			description: typeof o.description === 'string' ? o.description : '',
			themeId: typeof o.themeId === 'string' ? o.themeId : 'obsidian-brass',
			cornerMode,
			...(typeof o.activeCursorPackId === 'string' && o.activeCursorPackId ? { activeCursorPackId: o.activeCursorPackId } : {}),
			activeRevisionId: typeof o.activeRevisionId === 'string' ? o.activeRevisionId : 'rev-0',
			nodes: treeCheck.nodes,
			buildConfig: (o.buildConfig && typeof o.buildConfig === 'object')
				? { ...DEFAULT_BUILD_CONFIG, ...(o.buildConfig as Partial<UiProjectBuildConfig>) }
				: DEFAULT_BUILD_CONFIG,
			updatedAt: typeof o.updatedAt === 'number' ? o.updatedAt : Date.now()
		}
	};
}

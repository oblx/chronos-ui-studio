import { HUD_ZONES, shortUuid, type CornerKind, type HudZoneId, type UiFrameShape, type UiNode, type UiNodeTree, type UiProjectDefinition } from '@chronos-ui/svelte';
import { CAPABILITY_BITS } from '../../config';
import type { StudioToolDescriptor } from './tool.registry';

export interface UiEntityRecord {
	readonly uuid: string;
	readonly projectUuid: string;
	readonly parentUuid: string | null;
	readonly zoneId: HudZoneId;
	readonly kind: UiNode['type'];
	readonly label: string;
	readonly shape: UiFrameShape;
	readonly lifecycle: string;
	readonly hlcTimestamp: string;
	readonly propsJson: string;
	readonly updatedAt: number;
}

export interface WireframeSkeletonNode {
	readonly uuid: string;
	readonly shortId: string;
	readonly parentUuid: string | null;
	readonly zoneId: HudZoneId;
	readonly kind: UiNode['type'];
	readonly label: string;
	readonly shape: UiFrameShape;
	readonly cornerMode: CornerKind;
	readonly lifecycle: string;
	readonly childUuids: readonly string[];
	readonly intentBinding?: string;
}

const RO = { readOnlyHint: true, idempotentHint: true, destructiveHint: false } as const;
const IDEM = { readOnlyHint: false, idempotentHint: true, destructiveHint: false } as const;

export const ENTITY_TOOL_DESCRIPTORS: readonly StudioToolDescriptor[] = [
	{
		name: 'ui_list_entities', description: 'List normalized RFC 9562 UUID v7 entities for a project or zone.',
		humanTitle: 'List UUID Entities', plainDescription: 'Inspect every rendered component UUID and lifecycle state.',
		category: 'BUILD', icon: 'layers', intentKind: 'UI_SELECT_NODE', requiredCapabilityBit: CAPABILITY_BITS.READ_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, zoneId: { type: 'string' } } },
		outputSchema: { type: 'object', properties: { entities: { type: 'array' } } }, annotations: RO
	},
	{
		name: 'ui_inspect_entity', description: 'Inspect detailed metadata, hierarchy, and wire bindings for a UUID entity.',
		humanTitle: 'Inspect Entity', plainDescription: 'Read full tree hierarchy, shape, corners, and telemetry state by UUID.',
		category: 'CUSTOMIZE', icon: 'wire', intentKind: 'UI_SELECT_NODE', requiredCapabilityBit: CAPABILITY_BITS.READ_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { uuid: { type: 'string' }, projectId: { type: 'string' } }, required: ['uuid'] },
		outputSchema: { type: 'object', properties: { entity: { type: 'object' } } }, annotations: RO
	},
	{
		name: 'ui_patch_entity', description: 'Atomically patch an entity by UUID (supports nested child entities).',
		humanTitle: 'Patch Entity UUID', plainDescription: 'Update shape, corners, label, zone, or props on any UUID entity.',
		category: 'CUSTOMIZE', icon: 'settings', intentKind: 'UI_PATCH_NODE', requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { uuid: { type: 'string' }, projectId: { type: 'string' }, label: { type: 'string' }, shape: { type: 'string' }, zone: { type: 'string' }, corners: { type: 'array' }, props: { type: 'object' } }, required: ['uuid'] },
		outputSchema: { type: 'object', properties: { project: { type: 'object' } } }, annotations: IDEM
	},
	{
		name: 'ui_get_wireframe_skeleton', description: 'Return spatial 11-zone wireframe skeleton and nested UUID hierarchy.',
		humanTitle: 'Get Wireframe Skeleton', plainDescription: 'Fetch the complete 11-zone spatial wireframe skeleton and edges.',
		category: 'BUILD', icon: 'layers', intentKind: 'UI_OPEN_MODAL', requiredCapabilityBit: CAPABILITY_BITS.READ_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { projectId: { type: 'string' } } },
		outputSchema: { type: 'object', properties: { zones: { type: 'array' }, nodes: { type: 'array' } } }, annotations: RO
	}
];

export function flattenNodesToEntityRecords(
	projectUuid: string,
	nodes: UiNodeTree,
	hlcTimestamp: string,
	now = Date.now()
): UiEntityRecord[] {
	const out: UiEntityRecord[] = [];
	const visit = (node: UiNode, parentUuid: string | null): void => {
		out.push({
			uuid: node.id,
			projectUuid,
			parentUuid,
			zoneId: node.zone,
			kind: node.type,
			label: node.label,
			shape: node.shape ?? 'BOX',
			lifecycle: node.lifecycle,
			hlcTimestamp,
			propsJson: JSON.stringify(node.props ?? {}),
			updatedAt: now
		});
		for (const child of node.children ?? []) visit(child, node.id);
	};
	for (const root of nodes) visit(root, null);
	return out;
}

export function patchNodeInTreeByUuid(
	nodes: UiNodeTree,
	uuid: string,
	patch: Partial<UiNode>
): { nodes: UiNodeTree; matched: boolean } {
	let matched = false;
	const mapNode = (node: UiNode): UiNode => {
		let next = node;
		if (node.id === uuid) {
			matched = true;
			next = { ...node, ...patch, props: { ...node.props, ...(patch.props ?? {}) } };
		}
		if (next.children && next.children.length > 0) {
			const children = next.children.map(mapNode);
			if (matched) next = { ...next, children };
		}
		return next;
	};
	return { nodes: nodes.map(mapNode), matched };
}

export function buildWireframeSkeleton(project: UiProjectDefinition): {
	readonly projectUuid: string;
	readonly zones: readonly HudZoneId[];
	readonly nodes: readonly WireframeSkeletonNode[];
} {
	const flat: WireframeSkeletonNode[] = [];
	const visit = (node: UiNode, parentUuid: string | null): void => {
		const cornerMode: CornerKind = node.corners?.includes('ROUND')
			? 'ROUND'
			: node.corners?.includes('STRAIGHT')
				? 'STRAIGHT'
				: project.cornerMode;
		flat.push({
			uuid: node.id,
			shortId: shortUuid(node.id),
			parentUuid,
			zoneId: node.zone,
			kind: node.type,
			label: node.label,
			shape: node.shape ?? 'BOX',
			cornerMode,
			lifecycle: node.lifecycle,
			childUuids: (node.children ?? []).map((c) => c.id),
			...(node.intentBinding ? { intentBinding: node.intentBinding } : {})
		});
		for (const child of node.children ?? []) visit(child, node.id);
	};
	for (const root of project.nodes) visit(root, null);
	return { projectUuid: project.id, zones: HUD_ZONES, nodes: flat };
}

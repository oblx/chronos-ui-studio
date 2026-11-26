import {
	generateUuidV7, type HudZoneId, type UiComponentKind, type UiNode, type UiNodeLifecycle, type UiNodeTree
} from '@chronos-ui/svelte';

export interface UiDocumentNode extends Omit<UiNode, 'children'> {
	readonly parentId: string | null;
	readonly childIds: readonly string[];
	readonly prototypeId?: string;
}

export interface UiComponentPrototype {
	readonly id: string;
	readonly name: string;
	readonly baseType: UiComponentKind;
	readonly basePrototypeId?: string;
	readonly defaultZone: HudZoneId;
	readonly defaultProps: Readonly<Record<string, unknown>>;
	readonly intentBinding?: string;
	readonly createdAt: number;
}

export interface UiDocumentGraph {
	readonly rootZoneIds: Readonly<Partial<Record<HudZoneId, readonly string[]>>>;
	readonly nodes: Readonly<Record<string, UiDocumentNode>>;
	readonly prototypes: Readonly<Record<string, UiComponentPrototype>>;
}

export type PatchTargetKind = 'PROTOTYPE' | 'INSTANCE';

const NODE_META_KEYS = [
	'shape', 'corners', 'cornerRadiusRem', 'cornerEmbellishment', 'cornerAnimation',
	'embellishmentConfig', 'controlConfig', 'locked', 'visible', 'intentBinding'
] as const;

function pickNodeMeta(n: Partial<UiNode>): Partial<UiNode> {
	const out: Record<string, unknown> = {};
	for (const k of NODE_META_KEYS) if (n[k] !== undefined) out[k] = n[k];
	return out;
}

export function nodeTreeToDocumentGraph(tree: UiNodeTree, prototypes: readonly UiComponentPrototype[] = []): UiDocumentGraph {
	const nodes: Record<string, UiDocumentNode> = {};
	const rootZoneIds: Partial<Record<HudZoneId, string[]>> = {};
	const protoMap: Record<string, UiComponentPrototype> = Object.fromEntries(prototypes.map((p) => [p.id, p]));
	const visit = (node: UiNode, parentId: string | null): void => {
		nodes[node.id] = {
			id: node.id, type: node.type, zone: node.zone, label: node.label, lifecycle: node.lifecycle,
			parentId, childIds: (node.children ?? []).map((c) => c.id), props: { ...node.props },
			...pickNodeMeta(node),
			...(typeof node.props.prototypeId === 'string' ? { prototypeId: node.props.prototypeId } : {})
		};
		if (!parentId) (rootZoneIds[node.zone] ??= []).push(node.id);
		for (const child of node.children ?? []) visit(child, node.id);
	};
	for (const root of tree) visit(root, null);
	return { rootZoneIds, nodes, prototypes: protoMap };
}

export function documentGraphToNodeTree(graph: UiDocumentGraph): UiNodeTree {
	const seen = new Set<string>();
	const build = (id: string): UiNode | null => {
		if (seen.has(id)) return null;
		const entry = graph.nodes[id];
		if (!entry) return null;
		seen.add(id);
		const children = entry.childIds.map(build).filter((c): c is UiNode => Boolean(c));
		return {
			id: entry.id, type: entry.type, zone: entry.zone, label: entry.label, lifecycle: entry.lifecycle,
			props: resolveEffectiveNodeProps(graph, id), ...pickNodeMeta(entry),
			...(children.length > 0 ? { children } : {})
		};
	};
	const roots: UiNode[] = [];
	for (const ids of Object.values(graph.rootZoneIds)) {
		for (const id of ids ?? []) { const built = build(id); if (built) roots.push(built); }
	}
	return roots;
}

export function resolveEffectiveNodeProps(graph: UiDocumentGraph, nodeId: string): Record<string, unknown> {
	const node = graph.nodes[nodeId];
	if (!node) return {};
	const chain: UiComponentPrototype[] = [];
	const visited = new Set<string>();
	let curId = node.prototypeId;
	while (curId) {
		if (visited.has(curId)) throw new Error(`Prototype inheritance cycle detected at ${curId}`);
		visited.add(curId);
		const proto = graph.prototypes[curId];
		if (!proto) break;
		chain.unshift(proto);
		curId = proto.basePrototypeId;
	}
	const merged: Record<string, unknown> = {};
	for (const proto of chain) Object.assign(merged, proto.defaultProps);
	return { ...merged, ...node.props, ...(node.prototypeId ? { prototypeId: node.prototypeId } : {}) };
}

export function computeSparseOverrides(baseProps: Readonly<Record<string, unknown>>, nextProps: Readonly<Record<string, unknown>>): Record<string, unknown> {
	const delta: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(nextProps)) {
		if (JSON.stringify(baseProps[k]) !== JSON.stringify(v)) delta[k] = v;
	}
	return delta;
}

export function patchWithTargetTag(graph: UiDocumentGraph, nodeId: string, patchProps: Readonly<Record<string, unknown>>, targetKind: PatchTargetKind = 'INSTANCE'): UiDocumentGraph {
	const node = graph.nodes[nodeId];
	if (!node) return graph;
	if (targetKind === 'PROTOTYPE' && node.prototypeId && graph.prototypes[node.prototypeId]) {
		const proto = graph.prototypes[node.prototypeId];
		return { ...graph, prototypes: { ...graph.prototypes, [proto.id]: { ...proto, defaultProps: { ...proto.defaultProps, ...patchProps } } } };
	}
	const base = resolveEffectiveNodeProps({ ...graph, nodes: { ...graph.nodes, [nodeId]: { ...node, props: {} } } }, nodeId);
	const merged = { ...node.props, ...patchProps };
	const sparse = node.prototypeId ? computeSparseOverrides(base, merged) : merged;
	return { ...graph, nodes: { ...graph.nodes, [nodeId]: { ...node, props: sparse } } };
}

export function derivePrototypeFromNode(node: UiNode, name: string, basePrototypeId?: string): UiComponentPrototype {
	return {
		id: generateUuidV7(), name: name.trim() || `${node.label} Blueprint`,
		baseType: node.type, ...(basePrototypeId ? { basePrototypeId } : {}),
		defaultZone: node.zone, defaultProps: { ...node.props },
		...(node.intentBinding ? { intentBinding: node.intentBinding } : {}), createdAt: Date.now()
	};
}

export function instantiateFromPrototype(proto: UiComponentPrototype, overrides: Partial<{ id: string; zone: HudZoneId; label: string; props: Record<string, unknown>; lifecycle: UiNodeLifecycle }> = {}): UiNode {
	const sparseProps = computeSparseOverrides(proto.defaultProps, overrides.props ?? {});
	return {
		id: overrides.id ?? generateUuidV7(), type: proto.baseType, zone: overrides.zone ?? proto.defaultZone,
		label: overrides.label ?? proto.name, lifecycle: overrides.lifecycle ?? 'COMMITTED',
		props: { ...sparseProps, prototypeId: proto.id }, ...(proto.intentBinding ? { intentBinding: proto.intentBinding } : {})
	};
}

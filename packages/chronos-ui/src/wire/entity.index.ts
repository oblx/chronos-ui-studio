import type { UiComponentKind, UiNode, UiNodeLifecycle, UiNodeTree } from '../canvas';
import type { CornerAnimation, CornerEmbellishment, CornerTuple, HudZoneId, UiFrameShape } from '../tokens';
import { DEFAULT_CHAMFER_TUPLE } from '../tokens';
import { isUuidV7, shortUuid } from './uuid';

export interface EntityMeasuredRect {
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly height: number;
}

export interface RegisteredUiEntity {
	readonly uuid: string;
	readonly shortId: string;
	readonly projectUuid: string;
	readonly parentUuid: string | null;
	readonly childUuids: readonly string[];
	readonly zoneId: HudZoneId;
	readonly kind: UiComponentKind;
	readonly label: string;
	readonly shape: UiFrameShape;
	readonly corners: CornerTuple;
	readonly embellishment: CornerEmbellishment;
	readonly cornerAnimation: CornerAnimation;
	readonly lifecycle: UiNodeLifecycle | 'ERROR';
	readonly locked: boolean;
	readonly visible: boolean;
	readonly intentBinding?: string;
	readonly activeEventPulseAt: number;
	readonly lastEventHlc: string;
	readonly measuredRect: EntityMeasuredRect | null;
}

export interface UiEntityIndexSet {
	readonly byUuid: ReadonlyMap<string, RegisteredUiEntity>;
	readonly byZone: ReadonlyMap<HudZoneId, readonly string[]>;
	readonly byParent: ReadonlyMap<string | null, readonly string[]>;
	readonly byKind: ReadonlyMap<UiComponentKind, readonly string[]>;
}

export const EMPTY_ENTITY_INDEX: UiEntityIndexSet = {
	byUuid: new Map(), byZone: new Map(), byParent: new Map(), byKind: new Map()
};

export function toRegisteredEntity(
	projectUuid: string,
	node: UiNode,
	parentUuid: string | null,
	hlc: string,
	prev?: RegisteredUiEntity
): RegisteredUiEntity {
	return {
		uuid: node.id,
		shortId: shortUuid(node.id),
		projectUuid,
		parentUuid,
		childUuids: (node.children ?? []).map((c) => c.id),
		zoneId: node.zone,
		kind: node.type,
		label: node.label,
		shape: node.shape ?? 'BOX',
		corners: node.corners ?? DEFAULT_CHAMFER_TUPLE,
		embellishment: node.cornerEmbellishment ?? 'CARET',
		cornerAnimation: node.cornerAnimation ?? 'NONE',
		lifecycle: node.lifecycle,
		locked: node.locked ?? false,
		visible: node.visible ?? true,
		...(node.intentBinding ? { intentBinding: node.intentBinding } : {}),
		activeEventPulseAt: prev?.activeEventPulseAt ?? 0,
		lastEventHlc: prev?.lastEventHlc ?? hlc,
		measuredRect: prev?.measuredRect ?? null
	};
}

function pushIdx<K>(map: Map<K, string[]>, key: K, id: string): void {
	const arr = map.get(key);
	if (arr) arr.push(id);
	else map.set(key, [id]);
}

export function buildEntityIndexSet(
	prevMap: ReadonlyMap<string, RegisteredUiEntity>,
	projectUuid: string,
	nodes: UiNodeTree,
	hlc: string
): UiEntityIndexSet {
	const byUuid = new Map<string, RegisteredUiEntity>();
	const byZone = new Map<HudZoneId, string[]>();
	const byParent = new Map<string | null, string[]>();
	const byKind = new Map<UiComponentKind, string[]>();
	const visit = (node: UiNode, parentUuid: string | null): void => {
		if (!isUuidV7(node.id) && node.id.length === 0) return;
		const ent = toRegisteredEntity(projectUuid, node, parentUuid, hlc, prevMap.get(node.id));
		byUuid.set(ent.uuid, ent);
		pushIdx(byZone, ent.zoneId, ent.uuid);
		pushIdx(byParent, parentUuid, ent.uuid);
		pushIdx(byKind, ent.kind, ent.uuid);
		for (const child of node.children ?? []) visit(child, ent.uuid);
	};
	for (const root of nodes) visit(root, null);
	return { byUuid, byZone, byParent, byKind };
}

export function rebuildIndexesFromMap(byUuid: ReadonlyMap<string, RegisteredUiEntity>): UiEntityIndexSet {
	const byZone = new Map<HudZoneId, string[]>();
	const byParent = new Map<string | null, string[]>();
	const byKind = new Map<UiComponentKind, string[]>();
	for (const ent of byUuid.values()) {
		pushIdx(byZone, ent.zoneId, ent.uuid);
		pushIdx(byParent, ent.parentUuid, ent.uuid);
		pushIdx(byKind, ent.kind, ent.uuid);
	}
	return { byUuid, byZone, byParent, byKind };
}

export function sameMeasuredRect(a: EntityMeasuredRect | null, b: EntityMeasuredRect): boolean {
	return Boolean(a && Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1 && Math.abs(a.width - b.width) < 1 && Math.abs(a.height - b.height) < 1);
}

export function createHeadlessEntityRegistry() {
	let idx: UiEntityIndexSet = EMPTY_ENTITY_INDEX;
	const patchOne = (uuid: string, fn: (cur: RegisteredUiEntity) => RegisteredUiEntity): void => {
		const cur = idx.byUuid.get(uuid); if (!cur) return;
		const next = new Map(idx.byUuid); next.set(uuid, fn(cur)); idx = { ...idx, byUuid: next };
	};
	return {
		get size() { return idx.byUuid.size; },
		get map() { return idx.byUuid; }, get byUuid() { return idx.byUuid; },
		get byZone() { return idx.byZone; }, get byParent() { return idx.byParent; }, get byKind() { return idx.byKind; },
		list: (): readonly RegisteredUiEntity[] => [...idx.byUuid.values()],
		get: (uuid: string) => idx.byUuid.get(uuid),
		getByZone: (zoneId: HudZoneId): readonly RegisteredUiEntity[] => (idx.byZone.get(zoneId) ?? []).map((id) => idx.byUuid.get(id)!).filter(Boolean),
		getByParent: (parentUuid: string | null): readonly RegisteredUiEntity[] => (idx.byParent.get(parentUuid) ?? []).map((id) => idx.byUuid.get(id)!).filter(Boolean),
		getByKind: (kind: UiComponentKind): readonly RegisteredUiEntity[] => (idx.byKind.get(kind) ?? []).map((id) => idx.byUuid.get(id)!).filter(Boolean),
		syncProjectNodes: (projectUuid: string, nodes: UiNodeTree, hlc: string) => { idx = buildEntityIndexSet(idx.byUuid, projectUuid, nodes, hlc); },
		registerNode: (projectUuid: string, node: UiNode, parentUuid: string | null, hlc: string) => {
			const next = new Map(idx.byUuid); next.set(node.id, toRegisteredEntity(projectUuid, node, parentUuid, hlc, next.get(node.id))); idx = rebuildIndexesFromMap(next);
		},
		updateMeasuredRect: (uuid: string, rect: EntityMeasuredRect) => { const cur = idx.byUuid.get(uuid); if (cur && !sameMeasuredRect(cur.measuredRect, rect)) patchOne(uuid, (e) => ({ ...e, measuredRect: rect })); },
		pulseEntity: (uuid: string, hlc: string, atMs = Date.now()) => patchOne(uuid, (e) => ({ ...e, activeEventPulseAt: atMs, lastEventHlc: hlc })),
		markError: (uuid: string) => patchOne(uuid, (e) => ({ ...e, lifecycle: 'ERROR' })),
		clear: () => { idx = EMPTY_ENTITY_INDEX; }
	};
}


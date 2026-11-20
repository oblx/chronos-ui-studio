import type { UiNode, UiNodeLifecycle, UiNodeTree } from '../canvas';
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
	readonly kind: UiNode['type'];
	readonly label: string;
	readonly shape: UiFrameShape;
	readonly corners: CornerTuple;
	readonly embellishment: CornerEmbellishment;
	readonly cornerAnimation: CornerAnimation;
	readonly lifecycle: UiNodeLifecycle | 'ERROR';
	readonly intentBinding?: string;
	readonly activeEventPulseAt: number;
	readonly lastEventHlc: string;
	readonly measuredRect: EntityMeasuredRect | null;
}

export interface UiEntityRegistry {
	readonly map: ReadonlyMap<string, RegisteredUiEntity>;
	readonly list: () => readonly RegisteredUiEntity[];
	readonly get: (uuid: string) => RegisteredUiEntity | undefined;
	readonly getByZone: (zoneId: HudZoneId) => readonly RegisteredUiEntity[];
	readonly syncProjectNodes: (projectUuid: string, nodes: UiNodeTree, hlc: string) => void;
	readonly registerNode: (projectUuid: string, node: UiNode, parentUuid: string | null, hlc: string) => void;
	readonly updateMeasuredRect: (uuid: string, rect: EntityMeasuredRect) => void;
	readonly pulseEntity: (uuid: string, hlc: string, atMs?: number) => void;
	readonly markError: (uuid: string) => void;
	readonly clear: () => void;
}

function toRegisteredEntity(
	projectUuid: string,
	node: UiNode,
	parentUuid: string | null,
	hlc: string,
	prev?: RegisteredUiEntity
): RegisteredUiEntity {
	const uuid = node.id;
	return {
		uuid,
		shortId: shortUuid(uuid),
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
		...(node.intentBinding ? { intentBinding: node.intentBinding } : {}),
		activeEventPulseAt: prev?.activeEventPulseAt ?? 0,
		lastEventHlc: prev?.lastEventHlc ?? hlc,
		measuredRect: prev?.measuredRect ?? null
	};
}

function syncEntityMap(prevMap: ReadonlyMap<string, RegisteredUiEntity>, projectUuid: string, nodes: UiNodeTree, hlc: string): Map<string, RegisteredUiEntity> {
	const next = new Map<string, RegisteredUiEntity>();
	const visit = (node: UiNode, parentUuid: string | null): void => {
		if (!isUuidV7(node.id) && node.id.length === 0) return;
		next.set(node.id, toRegisteredEntity(projectUuid, node, parentUuid, hlc, prevMap.get(node.id)));
		for (const child of node.children ?? []) visit(child, node.id);
	};
	for (const root of nodes) visit(root, null);
	return next;
}

function sameRect(a: EntityMeasuredRect | null, b: EntityMeasuredRect): boolean {
	return Boolean(a && Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1 && Math.abs(a.width - b.width) < 1 && Math.abs(a.height - b.height) < 1);
}

export function createUiEntityRegistry(): UiEntityRegistry {
	let entries = $state.raw<ReadonlyMap<string, RegisteredUiEntity>>(new Map());
	const list = (): readonly RegisteredUiEntity[] => [...entries.values()];
	const patchOne = (uuid: string, fn: (cur: RegisteredUiEntity) => RegisteredUiEntity): void => {
		const cur = entries.get(uuid);
		if (!cur) return;
		const next = new Map(entries);
		next.set(uuid, fn(cur));
		entries = next;
	};
	return {
		get map() { return entries; },
		list,
		get: (uuid) => entries.get(uuid),
		getByZone: (zoneId) => list().filter((e) => e.zoneId === zoneId),
		syncProjectNodes: (projectUuid, nodes, hlc) => { entries = syncEntityMap(entries, projectUuid, nodes, hlc); },
		registerNode: (projectUuid, node, parentUuid, hlc) => {
			const next = new Map(entries);
			next.set(node.id, toRegisteredEntity(projectUuid, node, parentUuid, hlc, next.get(node.id)));
			entries = next;
		},
		updateMeasuredRect: (uuid, rect) => {
			const cur = entries.get(uuid);
			if (cur && !sameRect(cur.measuredRect, rect)) patchOne(uuid, (e) => ({ ...e, measuredRect: rect }));
		},
		pulseEntity: (uuid, hlc, atMs = Date.now()) => patchOne(uuid, (e) => ({ ...e, activeEventPulseAt: atMs, lastEventHlc: hlc })),
		markError: (uuid) => patchOne(uuid, (e) => ({ ...e, lifecycle: 'ERROR' })),
		clear: () => { entries = new Map(); }
	};
}

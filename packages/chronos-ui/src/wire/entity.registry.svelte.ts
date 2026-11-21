import type { UiComponentKind, UiNode, UiNodeTree } from '../canvas';
import type { HudZoneId } from '../tokens';
import {
	buildEntityIndexSet, EMPTY_ENTITY_INDEX, rebuildIndexesFromMap, sameMeasuredRect, toRegisteredEntity,
	type EntityMeasuredRect, type RegisteredUiEntity, type UiEntityIndexSet
} from './entity.index';

export type { EntityMeasuredRect, RegisteredUiEntity, UiEntityIndexSet } from './entity.index';

export interface UiEntityRegistry {
	readonly map: ReadonlyMap<string, RegisteredUiEntity>;
	readonly byUuid: ReadonlyMap<string, RegisteredUiEntity>;
	readonly byZone: ReadonlyMap<HudZoneId, readonly string[]>;
	readonly byParent: ReadonlyMap<string | null, readonly string[]>;
	readonly byKind: ReadonlyMap<UiComponentKind, readonly string[]>;
	readonly list: () => readonly RegisteredUiEntity[];
	readonly get: (uuid: string) => RegisteredUiEntity | undefined;
	readonly getByZone: (zoneId: HudZoneId) => readonly RegisteredUiEntity[];
	readonly getByParent: (parentUuid: string | null) => readonly RegisteredUiEntity[];
	readonly getByKind: (kind: UiComponentKind) => readonly RegisteredUiEntity[];
	readonly syncProjectNodes: (projectUuid: string, nodes: UiNodeTree, hlc: string) => void;
	readonly registerNode: (projectUuid: string, node: UiNode, parentUuid: string | null, hlc: string) => void;
	readonly updateMeasuredRect: (uuid: string, rect: EntityMeasuredRect) => void;
	readonly pulseEntity: (uuid: string, hlc: string, atMs?: number) => void;
	readonly markError: (uuid: string) => void;
	readonly clear: () => void;
}

function resolveEntityIds(byUuid: ReadonlyMap<string, RegisteredUiEntity>, ids: readonly string[] | undefined): readonly RegisteredUiEntity[] {
	if (!ids || ids.length === 0) return [];
	const out: RegisteredUiEntity[] = [];
	for (const id of ids) { const ent = byUuid.get(id); if (ent) out.push(ent); }
	return out;
}

export function createUiEntityRegistry(): UiEntityRegistry {
	let idx = $state.raw<UiEntityIndexSet>(EMPTY_ENTITY_INDEX);
	const patchOne = (uuid: string, fn: (cur: RegisteredUiEntity) => RegisteredUiEntity): void => {
		const cur = idx.byUuid.get(uuid); if (!cur) return;
		const next = new Map(idx.byUuid); next.set(uuid, fn(cur)); idx = { ...idx, byUuid: next };
	};
	return {
		get map() { return idx.byUuid; }, get byUuid() { return idx.byUuid; },
		get byZone() { return idx.byZone; }, get byParent() { return idx.byParent; }, get byKind() { return idx.byKind; },
		list: () => [...idx.byUuid.values()],
		get: (uuid) => idx.byUuid.get(uuid),
		getByZone: (zoneId) => resolveEntityIds(idx.byUuid, idx.byZone.get(zoneId)),
		getByParent: (parentUuid) => resolveEntityIds(idx.byUuid, idx.byParent.get(parentUuid)),
		getByKind: (kind) => resolveEntityIds(idx.byUuid, idx.byKind.get(kind)),
		syncProjectNodes: (projectUuid, nodes, hlc) => { idx = buildEntityIndexSet(idx.byUuid, projectUuid, nodes, hlc); },
		registerNode: (projectUuid, node, parentUuid, hlc) => {
			const next = new Map(idx.byUuid); next.set(node.id, toRegisteredEntity(projectUuid, node, parentUuid, hlc, next.get(node.id))); idx = rebuildIndexesFromMap(next);
		},
		updateMeasuredRect: (uuid, rect) => { const cur = idx.byUuid.get(uuid); if (cur && !sameMeasuredRect(cur.measuredRect, rect)) patchOne(uuid, (e) => ({ ...e, measuredRect: rect })); },
		pulseEntity: (uuid, hlc, atMs = Date.now()) => patchOne(uuid, (e) => ({ ...e, activeEventPulseAt: atMs, lastEventHlc: hlc })),
		markError: (uuid) => patchOne(uuid, (e) => ({ ...e, lifecycle: 'ERROR' })),
		clear: () => { idx = EMPTY_ENTITY_INDEX; }
	};
}


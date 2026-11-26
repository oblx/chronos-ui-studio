import { DEFAULT_DARK_THEME_ID, HUD_ZONES, type CornerKind, type CornerTuple } from '@chronos-ui/svelte';
import type { UiBlueprint, ZoneBlueprintConfig } from '../config';

const VALID_CORNERS = new Set<CornerKind>(['CHAMFER', 'STRAIGHT', 'ROUND']);

function isCornerTuple(val: unknown): val is CornerTuple {
	return Array.isArray(val) && val.length === 4 && val.every((c) => VALID_CORNERS.has(c as CornerKind));
}

function normalizeZoneConfig(z: Partial<ZoneBlueprintConfig>): { ok: true; zone: ZoneBlueprintConfig } | { ok: false; error: string } {
	if (!z || typeof z !== 'object' || !HUD_ZONES.includes(z.id!)) {
		return { ok: false, error: `Invalid HUD zone identifier: ${String(z?.id)}.` };
	}
	if (!isCornerTuple(z.corners)) {
		return { ok: false, error: `Invalid CornerTuple on zone ${z.id}.` };
	}
	return {
		ok: true,
		zone: {
			id: z.id!, label: typeof z.label === 'string' && z.label.trim() ? z.label.trim() : z.id!,
			visible: Boolean(z.visible), corners: z.corners,
			...(z.disposition ? { disposition: z.disposition } : {}),
			...(z.density ? { density: z.density } : {}),
			...(typeof z.cornerRadiusRem === 'number' ? { cornerRadiusRem: z.cornerRadiusRem } : {}),
			...(z.shape ? { shape: z.shape } : {}),
			...(z.cornerEmbellishment ? { cornerEmbellishment: z.cornerEmbellishment } : {}),
			...(z.cornerAnimation ? { cornerAnimation: z.cornerAnimation } : {})
		}
	};
}

export function validateBlueprint(input: unknown): { ok: true; blueprint: UiBlueprint } | { ok: false; error: string } {
	if (!input || typeof input !== 'object') return { ok: false, error: 'Blueprint payload must be an object.' };
	const raw = input as Partial<UiBlueprint>;
	if (typeof raw.name !== 'string' || raw.name.trim().length < 2) return { ok: false, error: 'Blueprint name must be at least 2 characters.' };
	if (!Array.isArray(raw.zones) || raw.zones.length === 0) return { ok: false, error: 'Blueprint must define at least one perimeter zone.' };
	const zones: ZoneBlueprintConfig[] = [];
	for (const z of raw.zones) {
		const res = normalizeZoneConfig(z);
		if (!res.ok) return res;
		zones.push(res.zone);
	}
	const cornerMode: CornerKind = VALID_CORNERS.has(raw.cornerMode as CornerKind) ? (raw.cornerMode as CornerKind) : 'CHAMFER';
	return {
		ok: true,
		blueprint: {
			id: typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : `bp-${Date.now().toString(36)}`,
			name: raw.name.trim(), description: typeof raw.description === 'string' ? raw.description.trim() : '',
			themeId: typeof raw.themeId === 'string' ? raw.themeId : DEFAULT_DARK_THEME_ID, cornerMode,
			starred: Boolean(raw.starred), version: typeof raw.version === 'number' && raw.version > 0 ? Math.floor(raw.version) : 1, zones
		}
	};
}

export function computeBlueprintGrade(bp: UiBlueprint): 'A' | 'B' | 'C' | 'D' | 'F' {
	const visible = bp.zones.filter((z) => z.visible).length;
	const hasCanvas = bp.zones.some((z) => z.id === 'WORLD_CANVAS' && z.visible);
	if (!hasCanvas) return 'F';
	if (visible >= 10) return 'A';
	if (visible >= 8) return 'B';
	if (visible >= 5) return 'C';
	return 'D';
}

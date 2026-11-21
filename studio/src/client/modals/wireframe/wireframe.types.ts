import type { HudZoneId, UiIconName } from '@chronos-ui/svelte';

export type WireframeToolId = 'SELECT' | 'MOVE' | 'SPAWN' | 'WIRE' | 'PAN' | 'ZOOM';
export type WireframeFilterId = 'ALL' | 'STAGED' | 'COMMITTED' | 'LOCKED';
export type WireframeRightTabId = 'LAYERS' | 'PROPERTIES' | 'HISTORY';

export interface WireframeToolDef {
	readonly id: WireframeToolId;
	readonly key: string;
	readonly label: string;
	readonly icon: UiIconName;
}

export const WIREFRAME_TOOLS: readonly WireframeToolDef[] = [
	{ id: 'SELECT', key: 'V', label: 'Select Entity', icon: 'cursor' },
	{ id: 'MOVE', key: 'M', label: 'Move / Re-Zone', icon: 'dock' },
	{ id: 'SPAWN', key: 'N', label: 'Spawn Node', icon: 'plus' },
	{ id: 'WIRE', key: 'W', label: 'Wire Event Link', icon: 'wire' },
	{ id: 'PAN', key: 'H', label: 'Pan Artboard', icon: 'radar' },
	{ id: 'ZOOM', key: 'Z', label: 'Zoom Artboard', icon: 'spotlight' }
] as const;

export const WIREFRAME_FILTERS: readonly { readonly id: WireframeFilterId; readonly label: string }[] = [
	{ id: 'ALL', label: 'All' },
	{ id: 'STAGED', label: 'Staged' },
	{ id: 'COMMITTED', label: 'Committed' },
	{ id: 'LOCKED', label: 'Locked' }
] as const;

export const WIREFRAME_ZOOMS = [0.5, 0.75, 1] as const;

export interface ArtboardZoneBox {
	readonly id: HudZoneId;
	readonly label: string;
	readonly x: number;
	readonly y: number;
	readonly w: number;
	readonly h: number;
}

export const ARTBOARD_ZONES: readonly ArtboardZoneBox[] = [
	{ id: 'TOP_LEFT', label: 'TOP_LEFT', x: 16, y: 16, w: 220, h: 78 },
	{ id: 'TOP_CENTER', label: 'TOP_CENTER', x: 248, y: 16, w: 504, h: 42 },
	{ id: 'PROJECT_TAB_DECK', label: 'PROJECT_TAB_DECK', x: 248, y: 64, w: 504, h: 30 },
	{ id: 'TOP_RIGHT', label: 'TOP_RIGHT', x: 764, y: 16, w: 220, h: 78 },
	{ id: 'LEFT_EDGE', label: 'LEFT_EDGE', x: 16, y: 106, w: 148, h: 368 },
	{ id: 'WORLD_CANVAS', label: 'WORLD_CANVAS', x: 176, y: 106, w: 648, h: 368 },
	{ id: 'RIGHT_EDGE', label: 'RIGHT_EDGE', x: 836, y: 106, w: 148, h: 368 },
	{ id: 'BOTTOM_LEFT', label: 'BOTTOM_LEFT', x: 16, y: 486, w: 244, h: 88 },
	{ id: 'BOTTOM_CENTER', label: 'BOTTOM_CENTER', x: 272, y: 486, w: 456, h: 88 },
	{ id: 'BOTTOM_RIGHT', label: 'BOTTOM_RIGHT', x: 740, y: 486, w: 244, h: 88 }
] as const;

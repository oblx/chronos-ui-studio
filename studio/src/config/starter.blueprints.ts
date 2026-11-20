import {
	HUD_ZONES, STRAIGHT_TUPLE, ZONE_CORNER_PRESETS,
	type CornerAnimation, type CornerEmbellishment, type CornerKind,
	type CornerTuple, type HudZoneId, type UiFrameShape
} from '@chronos-ui/svelte';

export type ZoneDispositionMode = 'DOCKED' | 'FLOATING' | 'COLLAPSED';
export type ZoneDensityMode = 'COMPACT' | 'STANDARD' | 'SPACIOUS';

export interface ZoneBlueprintConfig {
	readonly id: HudZoneId;
	readonly label: string;
	readonly visible: boolean;
	readonly corners: CornerTuple;
	readonly disposition?: ZoneDispositionMode;
	readonly density?: ZoneDensityMode;
	readonly cornerRadiusRem?: number;
	readonly shape?: UiFrameShape;
	readonly cornerEmbellishment?: CornerEmbellishment;
	readonly cornerAnimation?: CornerAnimation;
}

export interface UiBlueprint {
	readonly id: string;
	readonly name: string;
	readonly description: string;
	readonly themeId: string;
	readonly cornerMode: CornerKind;
	readonly starred: boolean;
	readonly version: number;
	readonly zones: readonly ZoneBlueprintConfig[];
}

function buildZones(
	labels: Record<HudZoneId, string>,
	mode: CornerKind,
	hidden: readonly HudZoneId[] = []
): readonly ZoneBlueprintConfig[] {
	return HUD_ZONES.map((id) => ({
		id,
		label: labels[id],
		visible: !hidden.includes(id),
		corners: mode === 'STRAIGHT' ? STRAIGHT_TUPLE : ZONE_CORNER_PRESETS[id]
	}));
}

export const STARTER_BLUEPRINTS: readonly UiBlueprint[] = [
	{
		id: 'bp-telemetry-command',
		name: 'Telemetry Command HUD',
		description: 'Full 11-zone perimeter telemetry deck with bilateral 45-degree chamfers.',
		themeId: 'obsidian-brass',
		cornerMode: 'CHAMFER',
		starred: true,
		version: 1,
		zones: buildZones({
			WORLD_CANVAS: 'Primary Stage', TOP_LEFT: 'System Crest', TOP_CENTER: 'Projection Crown',
			PROJECT_TAB_DECK: 'Blueprint Deck', TOP_RIGHT: 'Utility Cluster', RIGHT_EDGE: 'Inspector Rail',
			BOTTOM_RIGHT: 'Bento Radar', MODAL_OVERLAY_STACK: 'Modal Chassis', BOTTOM_CENTER: 'Command Console',
			BOTTOM_LEFT: 'Wire Stream', LEFT_EDGE: 'Composer Rail'
		}, 'CHAMFER')
	},
	{
		id: 'bp-spatial-workbench',
		name: 'Spatial Graph Workbench',
		description: 'High-contrast daylight blueprint workspace tuned for structural node inspection.',
		themeId: 'daylight-blueprint',
		cornerMode: 'CHAMFER',
		starred: false,
		version: 1,
		zones: buildZones({
			WORLD_CANVAS: 'Graph Canvas', TOP_LEFT: 'Node Telemetry', TOP_CENTER: 'View Switcher',
			PROJECT_TAB_DECK: 'Canvas Tabs', TOP_RIGHT: 'Session & Help', RIGHT_EDGE: 'Theme Tuner',
			BOTTOM_RIGHT: 'Tactical Radar', MODAL_OVERLAY_STACK: 'Modal Stack', BOTTOM_CENTER: 'Action Hotbar',
			BOTTOM_LEFT: 'DAG Stream', LEFT_EDGE: 'Zone Composer'
		}, 'CHAMFER')
	},
	{
		id: 'bp-minimal-editorial',
		name: 'Minimal Editorial Viewport',
		description: 'Orthogonal straight-corner frame focusing maximum viewport area on the stage.',
		themeId: 'alabaster-lab',
		cornerMode: 'STRAIGHT',
		starred: false,
		version: 1,
		zones: buildZones({
			WORLD_CANVAS: 'Editorial Stage', TOP_LEFT: 'Project Badge', TOP_CENTER: 'Navigation Bar',
			PROJECT_TAB_DECK: 'Document Tabs', TOP_RIGHT: 'Utilities', RIGHT_EDGE: 'Token Rail',
			BOTTOM_RIGHT: 'Minimap Radar', MODAL_OVERLAY_STACK: 'Dialog Stack', BOTTOM_CENTER: 'Command Bar',
			BOTTOM_LEFT: 'Audit Log', LEFT_EDGE: 'Palette Rail'
		}, 'STRAIGHT', ['BOTTOM_CENTER', 'BOTTOM_LEFT'])
	}
] as const;

import {
	BUILTIN_CURSOR_PACKS, CORNER_RADIUS_LIMITS, DEFAULT_ACCESSIBILITY_PREFS, DEFAULT_EMBELLISHMENT_CONFIG,
	DEFAULT_MOTION_CONFIG, DEFAULT_STUDIO_DEFAULTS, THEME_PACKS, type UiProjectDefinition
} from '@chronos-ui/svelte';
import { STARTER_BLUEPRINTS, STUDIO_CONFIG } from '@studio/config';
import { DEFAULT_BUILD_CONFIG } from '@studio/core/project.schema';
import type { StationLayerConfig, StudioState } from '../studio.types';

export const STUDIO_INITIAL_LAYOUT = { leftFloatX: 84, rightFloatX: 720, floatY: 132, peerOriginX: 360, peerOriginY: 260 } as const;

export const DEFAULT_STATION_LAYER: StationLayerConfig = {
	showGrid: true,
	showReticle: true,
	topBandRem: 6.5,
	bottomDockRem: 9.0,
	edgeRailRem: 2.75,
	bilateralMirror: true,
	cornerMorphEnabled: true
};

export const GENESIS_FALLBACK: UiProjectDefinition = {
	id: STUDIO_CONFIG.defaultProjectId, slug: 'genesis', name: 'Genesis Canvas',
	description: 'Calm empty-stage canvas ready for live AI composition.',
	themeId: THEME_PACKS[0].id, cornerMode: 'CHAMFER',
	cornerRadiusRem: CORNER_RADIUS_LIMITS.defaultRem,
	studioDefaults: DEFAULT_STUDIO_DEFAULTS,
	activeCursorPackId: BUILTIN_CURSOR_PACKS[0].uuid,
	activeRevisionId: 'rev-genesis-0',
	nodes: [], buildConfig: DEFAULT_BUILD_CONFIG, updatedAt: Date.now()
};

export function createInitialStudioState(): StudioState {
	return {
		studioChromeVisible: false, layoutDensity: 'CALM', motionConfig: DEFAULT_MOTION_CONFIG,
		envCapabilities: null, activeAdapterBadge: 'LOCAL AGENT', lowMemoryMode: false, toolPaletteOpen: false,
		activeView: 'WORKBENCH', previewTier: 'DESKTOP', activeThemeId: THEME_PACKS[0].id, themes: THEME_PACKS,
		blueprints: STARTER_BLUEPRINTS, activeBlueprintId: STARTER_BLUEPRINTS[0].id, projects: [GENESIS_FALLBACK],
		activeProjectId: GENESIS_FALLBACK.id,
		projectPersistence: { isDirty: false, lastSavedAt: null, autoSave: false, status: 'SAVED' },
		cursorPacks: BUILTIN_CURSOR_PACKS, activeCursorPackId: BUILTIN_CURSOR_PACKS[0].uuid,
		globalEmbellishmentConfig: DEFAULT_EMBELLISHMENT_CONFIG,
		studioDefaults: DEFAULT_STUDIO_DEFAULTS,
		stationLayer: DEFAULT_STATION_LAYER,
		selectedZoneId: 'TOP_RIGHT',
		prototypes: [], selectedNodeId: null, undoStack: [], redoStack: [], chatMessages: [],
		aiProfiles: [{ id: 'ai-local-default', label: 'Local Heuristic Engine', providerKind: 'local', baseUrl: '', modelId: 'LOCAL AGENT', hasSecret: false, secretMask: '', temperature: 0.2, maxTokens: 2048, persona: 'architect', isDefault: true }],
		assistantBusy: false, assistantOcular: 'IDLE', assistantDock: { mode: 'DOCKED', expanded: false, xRem: 0, yRem: 0 },
		inputModality: 'KEYBOARD', voiceMode: 'PUSH_TO_TALK', gamepadOverride: null, lastMcpActivity: null,
		accessibility: DEFAULT_ACCESSIBILITY_PREFS,
		leftDrawer: { open: false, floating: false, activeTab: 'build', railOffsetY: 0, floatX: STUDIO_INITIAL_LAYOUT.leftFloatX, floatY: STUDIO_INITIAL_LAYOUT.floatY },
		rightDrawer: { open: false, floating: false, activeTab: 'inspector', railOffsetY: 0, floatX: STUDIO_INITIAL_LAYOUT.rightFloatX, floatY: STUDIO_INITIAL_LAYOUT.floatY },
		panX: 0, panY: 0, zoom: 1, helpTopic: 'composer', helpGlitterCount: 0,
		user: null, peers: [], toasts: [],
		revealedZones: ['WORLD_CANVAS'], hudBootRunning: false, mcpManifestSyncedAt: null, mcpToolCount: 0,
		lastCommandOutput: 'Calm canvas ready. Describe a UI below or press F1.'
	};
}

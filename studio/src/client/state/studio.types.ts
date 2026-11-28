import type {
	AccessibilityPrefs, AssistantDockState, AssistantMessage, AssistantOcularState,
	CornerAnimation, CornerEmbellishment, CornerKind, CornerTuple, CursorPackDefinition,
	EmbellishmentConfig, EnvironmentCapabilityReport, GamepadProfileId, HudZoneId,
	InputModality, LayoutDensity, MotionConfig, StudioDefaultsConfig, ThemePack, ToastItem,
	UiFrameShape, UiNodeTree, UiProjectDefinition, ViewportTier, VirtualCursorPeer, VoiceCaptureMode
} from '@chronos-ui/svelte';
import type { UiBlueprint, ZoneDensityMode, ZoneDispositionMode } from '@studio/config';
import type { AiProviderKind, UiComponentPrototype } from '@studio/core';

export type StudioViewId = 'WORKBENCH' | 'THEMES' | 'BLUEPRINTS' | 'MCP_TWIN';
export type LeftTabId = 'build' | 'zones' | 'blueprints' | 'tour' | 'spotlight';
export type RightTabId = 'inspector' | 'themes' | 'export' | 'tokens';
export type StudioModalId = 'tome' | 'settings' | 'wire' | 'auth' | 'export' | 'radar-skeleton' | 'cursors' | 'station-builder' | 'zone-edition' | 'global-search';

export interface StationLayerConfig {
	readonly showGrid: boolean;
	readonly showReticle: boolean;
	readonly topBandRem: number;
	readonly bottomDockRem: number;
	readonly edgeRailRem: number;
	readonly bilateralMirror: boolean;
	readonly cornerMorphEnabled: boolean;
}

export interface ProjectPersistenceState {
	readonly isDirty: boolean;
	readonly lastSavedAt: number | null;
	readonly autoSave: boolean;
	readonly status: 'SAVED' | 'DIRTY' | 'SAVING';
}

export interface StudioUser {
	readonly userId: string;
	readonly email: string;
	readonly displayName: string;
	readonly role: string;
	readonly capabilityMask: number;
}

export interface AiProfileSummary {
	readonly id: string;
	readonly label: string;
	readonly providerKind: AiProviderKind;
	readonly baseUrl: string;
	readonly modelId: string;
	readonly hasSecret: boolean;
	readonly secretMask: string;
	readonly temperature: number;
	readonly maxTokens: number;
	readonly persona: string;
	readonly isDefault: boolean;
}

export interface StudioDrawerState {
	readonly open: boolean;
	readonly floating: boolean;
	readonly activeTab: string;
	readonly railOffsetY: number;
	readonly floatX: number;
	readonly floatY: number;
}

export interface StudioState {
	readonly studioChromeVisible: boolean;
	readonly layoutDensity: LayoutDensity;
	readonly motionConfig: MotionConfig;
	readonly envCapabilities: EnvironmentCapabilityReport | null;
	readonly activeAdapterBadge: string;
	readonly lowMemoryMode: boolean;
	readonly toolPaletteOpen: boolean;
	readonly activeView: StudioViewId;
	readonly previewTier: ViewportTier;
	readonly activeThemeId: string;
	readonly themes: readonly (ThemePack & { readonly starred?: boolean })[];
	readonly blueprints: readonly UiBlueprint[];
	readonly activeBlueprintId: string;
	readonly projects: readonly UiProjectDefinition[];
	readonly activeProjectId: string;
	readonly projectPersistence: ProjectPersistenceState;
	readonly cursorPacks: readonly CursorPackDefinition[];
	readonly activeCursorPackId: string | null;
	readonly globalEmbellishmentConfig: EmbellishmentConfig;
	readonly studioDefaults: StudioDefaultsConfig;
	readonly stationLayer: StationLayerConfig;
	readonly selectedZoneId: HudZoneId;
	readonly prototypes: readonly UiComponentPrototype[];
	readonly selectedNodeId: string | null;
	readonly undoStack: readonly UiNodeTree[];
	readonly redoStack: readonly UiNodeTree[];
	readonly chatMessages: readonly AssistantMessage[];
	readonly aiProfiles: readonly AiProfileSummary[];
	readonly assistantBusy: boolean;
	readonly assistantOcular: AssistantOcularState;
	readonly assistantDock: AssistantDockState;
	readonly inputModality: InputModality;
	readonly voiceMode: VoiceCaptureMode;
	readonly gamepadOverride: GamepadProfileId | null;
	readonly lastMcpActivity: string | null;
	readonly accessibility: AccessibilityPrefs;
	readonly leftDrawer: StudioDrawerState;
	readonly rightDrawer: StudioDrawerState;
	readonly panX: number;
	readonly panY: number;
	readonly zoom: number;
	readonly helpTopic: string;
	readonly helpGlitterCount: number;
	readonly user: StudioUser | null;
	readonly peers: readonly VirtualCursorPeer[];
	readonly toasts: readonly ToastItem[];
	readonly revealedZones: readonly HudZoneId[];
	readonly hudBootRunning: boolean;
	readonly mcpManifestSyncedAt: number | null;
	readonly mcpToolCount: number;
	readonly lastCommandOutput: string;
}

export interface ZoneCornerPayload {
	readonly zoneId: HudZoneId;
	readonly index: 0 | 1 | 2 | 3;
	readonly kind: CornerKind;
}

export interface ZoneTogglePayload {
	readonly zoneId: HudZoneId;
	readonly corners?: CornerTuple;
}

export interface ZoneEditPayload {
	readonly zoneId: HudZoneId;
	readonly visible?: boolean;
	readonly disposition?: ZoneDispositionMode;
	readonly density?: ZoneDensityMode;
	readonly corners?: CornerTuple;
	readonly cornerRadiusRem?: number;
	readonly shape?: UiFrameShape;
	readonly cornerEmbellishment?: CornerEmbellishment;
	readonly cornerAnimation?: CornerAnimation;
	readonly mirrorOpposite?: boolean;
}

export interface MoveEntityToZonePayload {
	readonly nodeId: string;
	readonly targetZone: HudZoneId;
	readonly direction?: 'UP' | 'DOWN';
}

<script lang="ts">
	import type {
		AccessibilityPrefs, CornerKind, CssCursorState, CursorPackDefinition, EnvironmentCapabilityReport,
		GamepadProfileId, HudZoneId, LayoutDensity, MotionConfig, RegisteredUiEntity, ThemePack,
		UiProjectDefinition, VoiceCaptureMode, WireTraceRecord
	} from '@chronos-ui/svelte';
	import type { UiBlueprint } from '../../config';
	import type { UiComponentPrototype } from '../../core/engine';
	import type { AiProfileSummary, StationLayerConfig, StudioUser, ZoneEditPayload } from '../state';
	import AuthMcpModal from './AuthMcpModal.svelte';
	import { CursorStudioModal } from './cursor';
	import ExportModal from './ExportModal.svelte';
	import FieldTomeModal from './FieldTomeModal.svelte';
	import RadarWireframeModal from './RadarWireframeModal.svelte';
	import SettingsModal from './SettingsModal.svelte';
	import { StationBuilderModal, ZoneEditionModal } from './station';
	import WireTapModal from './WireTapModal.svelte';

	interface Props {
		activeModalId: string | null;
		helpTopic: string;
		cornerMode: CornerKind;
		isLocked: boolean;
		remainingSeconds: number;
		progressRatio: number;
		accessibility: AccessibilityPrefs;
		motionConfig: MotionConfig;
		envCapabilities: EnvironmentCapabilityReport | null;
		activeAdapterBadge: string;
		stationLayer: StationLayerConfig;
		studioChromeVisible: boolean;
		layoutDensity: LayoutDensity;
		blueprint: UiBlueprint;
		selectedZoneId: HudZoneId;
		prototypes: readonly UiComponentPrototype[];
		themes: readonly ThemePack[];
		activeThemeId: string;
		aiProfiles: readonly AiProfileSummary[];
		project: UiProjectDefinition;
		entities: readonly RegisteredUiEntity[];
		selectedNodeId: string | null;
		lowMemoryMode: boolean;
		voiceMode: VoiceCaptureMode;
		gamepadOverride: GamepadProfileId | null;
		cursorPacks: readonly CursorPackDefinition[];
		activeCursorPackId: string | null;
		traces: readonly WireTraceRecord[];
		user: StudioUser | null;
		onCloseModal: () => void;
		onOpenTimedDemo: () => void;
		onOpenCursors: () => void;
		onOpenZoneEdition: (zoneId?: HudZoneId) => void;
		onOpenExport: () => void;
		onUpdatePrefs: (patch: Partial<AccessibilityPrefs>) => void;
		onSetCornerStyle: (cornerMode: CornerKind) => void;
		onSetCornerRadius: (cornerRadiusRem: number) => void;
		onSetMotionConfig: (patch: Partial<MotionConfig>) => void;
		onConfigureStationLayer: (patch: Partial<StationLayerConfig>) => void;
		onToggleStudioChrome: () => void;
		onCommitStaged: () => void;
		onSetDensity: (density: LayoutDensity) => void;
		onSelectZone: (zoneId: HudZoneId) => void;
		onEditZone: (payload: ZoneEditPayload) => void;
		onMoveEntityToZone: (nodeId: string, targetZone: HudZoneId, direction?: 'UP' | 'DOWN') => void;
		onRemoveEntity: (nodeId: string) => void;
		onSpawnPrototype: (proto: UiComponentPrototype) => void;
		onSelectTheme: (themeId: string) => void;
		onSaveAiProfile: (payload: Record<string, unknown>) => Promise<void>;
		onToggleLowMemory: (next: boolean) => void;
		onSetVoiceMode: (mode: VoiceCaptureMode) => void;
		onSetGamepadOverride: (id: GamepadProfileId | null) => void;
		onApplyCursorPack: (packId: string) => void;
		onResetCursorPack: () => void;
		onCreateCursorPack: (payload: { name: string; sourcePngDataUrl?: string; forkFromUuid?: string }) => Promise<CursorPackDefinition | null>;
		onDeriveCursorStates: (uuid: string, accentColor?: string) => Promise<CursorPackDefinition | null>;
		onUpdateCursorHotspot: (uuid: string, cssState: CssCursorState, x: number, y: number) => Promise<void>;
		onInspectEntity: (uuid: string) => void;
		onMorphEntityCorner: (uuid: string, corner: CornerKind) => void;
		onCloneDerivedEntity: (uuid: string, name: string) => void;
		onCopiedUuid: (uuid: string) => void;
		onDevLogin: () => Promise<void>;
		onRefreshTraces: () => void;
		onLogin: (email: string, pw: string) => Promise<string | null>;
		onRegister: (email: string, pw: string, name: string) => Promise<string | null>;
		onLogout: () => Promise<void>;
		onMintPat: (label: string) => Promise<string | null>;
		onCopiedExport: () => void;
	}

	let p: Props = $props();
</script>

<FieldTomeModal open={p.activeModalId === 'tome'} topic={p.helpTopic} cornerMode={p.cornerMode} isLocked={p.isLocked} remainingSeconds={p.remainingSeconds} progressRatio={p.progressRatio} onClose={p.onCloseModal} onOpenTimedDemo={p.onOpenTimedDemo} />
<SettingsModal open={p.activeModalId === 'settings'} prefs={p.accessibility} motionConfig={p.motionConfig} envCapabilities={p.envCapabilities} activeAdapterBadge={p.activeAdapterBadge} themes={p.themes} activeThemeId={p.activeThemeId} aiProfiles={p.aiProfiles} projectNodeCount={p.project.nodes.length} traceCount={p.traces.length} lowMemoryMode={p.lowMemoryMode} cornerMorphEnabled={p.stationLayer.cornerMorphEnabled} voiceMode={p.voiceMode} gamepadOverride={p.gamepadOverride} onUpdate={p.onUpdatePrefs} onSetCornerStyle={p.onSetCornerStyle} onSetCornerRadius={p.onSetCornerRadius} onSetMotionConfig={p.onSetMotionConfig} onToggleCornerMorph={(cornerMorphEnabled) => p.onConfigureStationLayer({ cornerMorphEnabled })} onSelectTheme={p.onSelectTheme} onSaveAiProfile={p.onSaveAiProfile} onToggleLowMemory={p.onToggleLowMemory} onSetVoiceMode={p.onSetVoiceMode} onSetGamepadOverride={p.onSetGamepadOverride} onOpenCursors={p.onOpenCursors} onClose={p.onCloseModal} />
<StationBuilderModal open={p.activeModalId === 'station-builder'} prefs={p.accessibility} motionConfig={p.motionConfig} stationLayer={p.stationLayer} studioChromeVisible={p.studioChromeVisible} layoutDensity={p.layoutDensity} activeAdapterBadge={p.activeAdapterBadge} traceCount={p.traces.length} themes={p.themes} activeThemeId={p.activeThemeId} cursorPacks={p.cursorPacks} activeCursorPackId={p.activeCursorPackId} project={p.project} prototypes={p.prototypes} onConfigureLayer={p.onConfigureStationLayer} onToggleStudioChrome={p.onToggleStudioChrome} onSetCornerStyle={p.onSetCornerStyle} onSetCornerRadius={p.onSetCornerRadius} onSetMotionConfig={p.onSetMotionConfig} onSetDensity={p.onSetDensity} onSelectTheme={p.onSelectTheme} onApplyCursorPack={p.onApplyCursorPack} onSpawnPrototype={p.onSpawnPrototype} onPromoteNode={p.onCloneDerivedEntity} onCommitStaged={p.onCommitStaged} onInspectNode={p.onInspectEntity} onOpenZoneEdition={p.onOpenZoneEdition} onOpenExport={p.onOpenExport} onClose={p.onCloseModal} />
<ZoneEditionModal open={p.activeModalId === 'zone-edition'} cornerMode={p.cornerMode} blueprint={p.blueprint} selectedZoneId={p.selectedZoneId} nodes={p.project.nodes} bilateralMirror={p.stationLayer.bilateralMirror} onSelectZone={p.onSelectZone} onEditZone={p.onEditZone} onMoveEntity={p.onMoveEntityToZone} onInspectEntity={p.onInspectEntity} onRemoveEntity={p.onRemoveEntity} onClose={p.onCloseModal} />
<CursorStudioModal open={p.activeModalId === 'cursors'} cornerMode={p.cornerMode} packs={p.cursorPacks} activePackId={p.activeCursorPackId} onApplyPack={p.onApplyCursorPack} onResetPack={p.onResetCursorPack} onCreatePack={p.onCreateCursorPack} onDeriveStates={p.onDeriveCursorStates} onUpdateHotspot={p.onUpdateCursorHotspot} onClose={p.onCloseModal} />
<RadarWireframeModal open={p.activeModalId === 'radar-skeleton'} cornerMode={p.cornerMode} projectName={p.project.name} entities={p.entities} selectedUuid={p.selectedNodeId} onSelectEntity={p.onInspectEntity} onInspectOnCanvas={p.onInspectEntity} onMorphEntityCorner={p.onMorphEntityCorner} onCloneDerived={p.onCloneDerivedEntity} onCopiedUuid={p.onCopiedUuid} onEditZone={p.onOpenZoneEdition} onClose={p.onCloseModal} />
<WireTapModal open={p.activeModalId === 'wire'} traces={p.traces} user={p.user} cornerMode={p.cornerMode} onDevArchitectLogin={() => void p.onDevLogin()} onRefresh={p.onRefreshTraces} onClose={p.onCloseModal} />
<AuthMcpModal open={p.activeModalId === 'auth'} user={p.user} cornerMode={p.cornerMode} onLogin={p.onLogin} onRegister={p.onRegister} onDevArchitect={p.onDevLogin} onLogout={p.onLogout} onMintPat={p.onMintPat} onClose={p.onCloseModal} />
<ExportModal open={p.activeModalId === 'export'} project={p.project} cornerMode={p.cornerMode} onCopied={p.onCopiedExport} onClose={p.onCloseModal} />

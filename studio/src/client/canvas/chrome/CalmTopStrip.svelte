<script lang="ts">
	import {
		HISTORY_LIMIT_BOUNDS, mirrorCornerTuple, UiChamferButton, UiChamferFrame, UiUtilityIconButton,
		Z_LAYERS, ZONE_CORNER_PRESETS,
		type CornerKind, type InputModality, type ThemePolarity, type UiProjectDefinition
	} from '@chronos-ui/svelte';
	import { STUDIO_UI_COPY } from '@studio/config';
	import ProjectLifecyclePod from './ProjectLifecyclePod.svelte';

	interface Props {
		projects: readonly UiProjectDefinition[];
		activeProjectId: string;
		cornerMode: CornerKind;
		polarity: ThemePolarity;
		chromeVisible: boolean;
		inputModality: InputModality;
		isDirty: boolean;
		saveStatus: 'SAVED' | 'DIRTY' | 'SAVING';
		canUndo: boolean;
		canRedo: boolean;
		undoCount: number;
		redoCount: number;
		historyLimit?: number;
		onUndo: () => void;
		onRedo: () => void;
		onSelectProject: (id: string) => void;
		onCreateProject: (name: string) => void;
		onSaveWorkspace: () => void;
		onResetDefaultView: () => void;
		onCleanWorkspace: () => void;
		onToggleChrome: () => void;
		onTogglePolarity: () => void;
		onOpenWireframe: () => void;
		onOpenSettings: () => void;
		onOpenHelp: () => void;
	}

	let {
		projects, activeProjectId, cornerMode, polarity, chromeVisible, inputModality,
		isDirty, saveStatus, canUndo, canRedo, undoCount, redoCount, historyLimit = HISTORY_LIMIT_BOUNDS.defaultLimit,
		onUndo, onRedo, onSelectProject, onCreateProject, onSaveWorkspace, onResetDefaultView, onCleanWorkspace,
		onToggleChrome, onTogglePolarity, onOpenWireframe, onOpenSettings, onOpenHelp
	}: Props = $props();

	const LEFT_CORNERS = ZONE_CORNER_PRESETS.TOP_LEFT;
	const RIGHT_CORNERS = mirrorCornerTuple(ZONE_CORNER_PRESETS.TOP_LEFT);
</script>

<div class="pointer-events-none fixed inset-x-2 top-2 flex flex-col items-stretch justify-between gap-1.5 md:inset-x-3 md:top-3 md:grid md:items-center md:gap-3"
	style="z-index: {Z_LAYERS.studioChrome}; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);" data-testid="calm-top-strip" data-modality={inputModality}>
	<div class="pointer-events-auto relative flex min-w-0 items-center gap-1.5 md:h-[3.125rem]" data-testid="calm-top-left" data-corners={LEFT_CORNERS.join(',')}>
		<UiChamferFrame corners={LEFT_CORNERS} {cornerMode} cutTier="station" outerClass="h-full w-auto max-w-full" className="flex h-full flex-nowrap items-center gap-1.5 px-2.5 py-1">
			<ProjectLifecyclePod
				{cornerMode}
				{isDirty}
				{saveStatus}
				compact={false}
				{projects}
				{activeProjectId}
				{canUndo}
				{canRedo}
				{undoCount}
				{redoCount}
				{historyLimit}
				{onUndo}
				{onRedo}
				{onSelectProject}
				{onCreateProject}
				{onSaveWorkspace}
				{onResetDefaultView}
				{onCleanWorkspace}
			/>
		</UiChamferFrame>
	</div>

	<div class="pointer-events-auto flex items-center justify-center md:h-[3.125rem]" data-testid="calm-hud-anchor">
		<UiChamferFrame corners={ZONE_CORNER_PRESETS.TOP_CENTER} {cornerMode} cutTier="station" outerClass="w-auto" className="flex h-full items-center gap-1.5 px-4 py-1">
			<UiChamferButton {cornerMode} icon="layers" label={chromeVisible ? STUDIO_UI_COPY.shellCalmLabel : STUDIO_UI_COPY.shellHudLabel} tip="Toggle 11-Zone Studio HUD (Ctrl+K)" tipLevel={25} active={chromeVisible}
				variant={chromeVisible ? 'primary' : 'surface'} testId="studio-hud-toggle-btn" onclick={onToggleChrome} className="h-8 min-w-[6.75rem] justify-center py-0.5 text-xs" />
		</UiChamferFrame>
	</div>

	<div class="pointer-events-auto flex items-center justify-end md:h-[3.125rem]" data-testid="calm-top-right" data-corners={RIGHT_CORNERS.join(',')}>
		<UiChamferFrame corners={RIGHT_CORNERS} {cornerMode} cutTier="station" outerClass="w-auto" className="flex h-full items-center justify-end gap-1.5 px-2.5 py-1">
			<UiUtilityIconButton {cornerMode} icon="radar" label="Wireframe Skeleton Workbench" tipLevel={55} testId="calm-open-wireframe" onclick={onOpenWireframe} />
			<UiUtilityIconButton {cornerMode} icon={polarity === 'dark' ? 'sun' : 'moon'} label="Toggle Polarity" tipLevel={45} testId="calm-toggle-polarity" onclick={onTogglePolarity} />
			<UiUtilityIconButton {cornerMode} icon="settings" label="Settings & Input" tipLevel={25} testId="calm-open-settings" onclick={onOpenSettings} />
			<UiUtilityIconButton {cornerMode} icon="help" label="Field Tome (F1)" tipLevel={85} testId="open-tome-btn" onclick={onOpenHelp} />
		</UiChamferFrame>
	</div>
</div>

<script lang="ts">
	import {
		LAYOUT_DENSITIES, mirrorCornerTuple, UiChamferButton, UiChamferFrame, UiIcon, UiInput, UiPopover,
		UiUtilityIconButton, VERSION, Z_LAYERS, ZONE_CORNER_PRESETS,
		type CornerKind, type InputModality, type LayoutDensity, type ThemePolarity, type UiIconName, type UiProjectDefinition
	} from '@chronos-ui/svelte';

	interface Props {
		projects: readonly UiProjectDefinition[];
		activeProjectId: string;
		cornerMode: CornerKind;
		polarity: ThemePolarity;
		chromeVisible: boolean;
		layoutDensity: LayoutDensity;
		toolPaletteOpen: boolean;
		inputModality: InputModality;
		isDirty: boolean;
		saveStatus: 'SAVED' | 'DIRTY' | 'SAVING';
		onSelectProject: (id: string) => void;
		onCreateProject: (name: string) => void;
		onSaveWorkspace: () => void;
		onResetDefaultView: () => void;
		onCleanWorkspace: () => void;
		onTogglePalette: () => void;
		onToggleChrome: () => void;
		onSetDensity: (density: LayoutDensity) => void;
		onTogglePolarity: () => void;
		onOpenCursors: () => void;
		onOpenStationBuilder: () => void;
		onOpenZoneEdition: () => void;
		onOpenExport: () => void;
		onOpenSettings: () => void;
		onOpenHelp: () => void;
	}

	let {
		projects, activeProjectId, cornerMode, polarity, chromeVisible, layoutDensity, toolPaletteOpen, inputModality,
		isDirty, saveStatus, onSelectProject, onCreateProject, onSaveWorkspace, onResetDefaultView, onCleanWorkspace,
		onTogglePalette, onToggleChrome, onSetDensity, onTogglePolarity, onOpenCursors, onOpenStationBuilder, onOpenZoneEdition, onOpenExport, onOpenSettings, onOpenHelp
	}: Props = $props();

	let creating = $state(false);
	let resetOpen = $state(false);
	let newName = $state('');
	const LEFT_CORNERS = ZONE_CORNER_PRESETS.TOP_LEFT;
	const RIGHT_CORNERS = mirrorCornerTuple(ZONE_CORNER_PRESETS.TOP_LEFT);
	const MODALITY_ICON: Record<InputModality, UiIconName> = { KEYBOARD: 'keyboard', XBOX: 'gamepad', DUALSENSE: 'gamepad', VOICE: 'mic' };
	let activeProject = $derived(projects.find((p) => p.id === activeProjectId) ?? projects[0]);

	function cycleDensity(): void {
		const idx = LAYOUT_DENSITIES.indexOf(layoutDensity);
		onSetDensity(LAYOUT_DENSITIES[(idx + 1) % LAYOUT_DENSITIES.length]);
	}

	function submitCreate(e: SubmitEvent): void {
		e.preventDefault();
		const clean = newName.trim();
		if (!clean) return;
		onCreateProject(clean);
		newName = '';
		creating = false;
	}
</script>

<div class="pointer-events-none fixed inset-x-0 top-0 flex flex-col items-stretch justify-between gap-1.5 p-2 sm:flex-row sm:items-start sm:gap-3 sm:p-3" style="z-index: {Z_LAYERS.studioChrome};" data-testid="calm-top-strip">
	<div class="pointer-events-auto relative flex items-center gap-1.5" data-testid="calm-top-left" data-corners={LEFT_CORNERS.join(',')}>
		<UiChamferFrame corners={LEFT_CORNERS} {cornerMode} className="flex flex-wrap items-center gap-1.5 px-2.5 py-1">
			<span class="ui-font-display pr-1 text-xs font-semibold tracking-wide" style="color: var(--ui-primary);">
				{activeProject?.name ?? 'Genesis Canvas'}
			</span>
			<span class="ui-font-mono border px-1.5 py-0.5 text-[0.65rem]" style="border-color: var(--ui-border-subtle); color: var(--ui-muted-content);">
				v{VERSION}
			</span>
			{#if projects.length > 1}
				{#each projects.filter((p) => p.id !== activeProjectId) as proj (proj.id)}
					<UiChamferButton {cornerMode} label={proj.name} variant="ghost" onclick={() => onSelectProject(proj.id)} className="py-0.5 text-xs" />
				{/each}
			{/if}
			<UiUtilityIconButton icon="plus" label="New Empty Canvas" onclick={() => { resetOpen = false; creating = !creating; }} />
			<UiChamferButton {cornerMode} icon="save" variant={isDirty ? 'secondary' : 'ghost'} tip="Save Workspace (Ctrl+S)"
				onclick={onSaveWorkspace} testId="workspace-save-btn" className="py-0.5 text-xs">
				<span>{saveStatus === 'SAVING' ? 'Saving' : 'Save'}</span>
				<span class="inline-flex h-2 w-2 shrink-0 items-center justify-center">
					{#if isDirty}
						<span class="inline-block h-1.5 w-1.5 rounded-full" style="background-color: var(--ui-accent-vivid, var(--ui-primary));" data-testid="dirty-indicator"></span>
					{/if}
				</span>
			</UiChamferButton>
			<UiChamferButton {cornerMode} icon="reset" label="Reset" tip="Workspace Reset Options" variant={resetOpen ? 'primary' : 'ghost'}
				onclick={() => { creating = false; resetOpen = !resetOpen; }} testId="workspace-reset-btn" className="py-0.5 text-xs" />
		</UiChamferFrame>

		<UiPopover open={creating} {cornerMode} label="New empty canvas dialog" onClose={() => { creating = false; }}>
			<form onsubmit={submitCreate} class="flex flex-col gap-2" data-testid="new-canvas-popover">
				<span class="ui-font-mono text-[0.68rem] font-semibold" style="color: var(--ui-muted-content);">Create Workspace</span>
				<UiInput bind:value={newName} {cornerMode} placeholder="Canvas name" label="Canvas name" className="ui-font-mono" />
				<div class="flex justify-end gap-1.5">
					<UiChamferButton {cornerMode} label="Cancel" variant="ghost" onclick={() => { creating = false; }} className="py-0.5 text-xs" />
					<UiChamferButton {cornerMode} type="submit" label="Create" variant="primary" className="py-0.5 text-xs" />
				</div>
			</form>
		</UiPopover>

		<UiPopover open={resetOpen} {cornerMode} label="Reset workspace options" onClose={() => { resetOpen = false; }}>
			<div class="flex flex-col gap-1.5" data-testid="workspace-reset-popover">
				<span class="ui-font-mono text-[0.68rem] font-semibold" style="color: var(--ui-muted-content);">Workspace Recovery</span>
				<UiChamferButton {cornerMode} icon="radar" label="Default View" variant="surface" testId="reset-default-view-btn"
					onclick={() => { resetOpen = false; onResetDefaultView(); }} className="w-full justify-start py-1 text-xs" />
				<UiChamferButton {cornerMode} icon="trash" label="Clean Workspace" variant="danger" testId="reset-clean-workspace-btn"
					onclick={() => { resetOpen = false; onCleanWorkspace(); }} className="w-full justify-start py-1 text-xs" />
			</div>
		</UiPopover>
	</div>

	<div class="pointer-events-auto flex items-center gap-1.5" data-testid="calm-top-right" data-corners={RIGHT_CORNERS.join(',')}>
		<UiChamferFrame corners={RIGHT_CORNERS} {cornerMode} outerClass="w-full sm:w-auto" className="flex flex-wrap items-center gap-1 px-2.5 py-1.5">
			<UiChamferButton {cornerMode} icon="wrench" label="+ Build" active={toolPaletteOpen} variant={toolPaletteOpen ? 'primary' : 'secondary'}
				onclick={onTogglePalette} className="py-0.5 text-xs" />
			<UiChamferButton {cornerMode} label={layoutDensity} tip="Cycle layout density (Calm / Balanced / Tactical)" variant="ghost"
				onclick={cycleDensity} className="py-0.5 text-[0.68rem]" />
			<UiChamferButton {cornerMode} icon="layers" label={chromeVisible ? 'Calm View' : 'Studio HUD'} active={chromeVisible}
				variant={chromeVisible ? 'primary' : 'ghost'} onclick={onToggleChrome} className="py-0.5 text-xs" />
			<span class="ui-font-mono inline-flex h-8 w-8 items-center justify-center" style="color: var(--ui-muted-content);" title={`Active input: ${inputModality}`} data-testid="modality-badge">
				<UiIcon name={MODALITY_ICON[inputModality]} sizeRem={0.95} />
			</span>
			<UiUtilityIconButton icon="sliders" label="Station Builder" onclick={onOpenStationBuilder} />
			<UiUtilityIconButton icon="grid" label="Zone Edition" onclick={onOpenZoneEdition} />
			<UiUtilityIconButton icon="cursor" label="Cursor Studio" onclick={onOpenCursors} />
			<UiUtilityIconButton icon="export" label="Export & Static Build" onclick={onOpenExport} />
			<UiUtilityIconButton icon={polarity === 'dark' ? 'sun' : 'moon'} label="Toggle Polarity" onclick={onTogglePolarity} />
			<UiUtilityIconButton icon="settings" label="Settings & Input" onclick={onOpenSettings} />
			<UiUtilityIconButton icon="help" label="Field Tome (F1)" onclick={onOpenHelp} />
		</UiChamferFrame>
	</div>
</div>

<script lang="ts">
	import {
		mirrorCornerTuple, UiChamferButton, UiChamferFrame, UiInput, UiPopover,
		UiUtilityIconButton, VERSION, Z_LAYERS, ZONE_CORNER_PRESETS,
		type CornerKind, type InputModality, type ThemePolarity, type UiProjectDefinition
	} from '@chronos-ui/svelte';
	import { STUDIO_UI_COPY } from '@studio/config';

	interface Props {
		projects: readonly UiProjectDefinition[];
		activeProjectId: string;
		cornerMode: CornerKind;
		polarity: ThemePolarity;
		chromeVisible: boolean;
		inputModality: InputModality;
		isDirty: boolean;
		saveStatus: 'SAVED' | 'DIRTY' | 'SAVING';
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
		isDirty, saveStatus, onSelectProject, onCreateProject, onSaveWorkspace, onResetDefaultView, onCleanWorkspace,
		onToggleChrome, onTogglePolarity, onOpenWireframe, onOpenSettings, onOpenHelp
	}: Props = $props();

	let creating = $state(false);
	let resetOpen = $state(false);
	let newName = $state('');
	const LEFT_CORNERS = ZONE_CORNER_PRESETS.TOP_LEFT;
	const RIGHT_CORNERS = mirrorCornerTuple(ZONE_CORNER_PRESETS.TOP_LEFT);
	let activeProject = $derived(projects.find((p) => p.id === activeProjectId) ?? projects[0]);

	function submitCreate(e: SubmitEvent): void {
		e.preventDefault();
		const clean = newName.trim();
		if (!clean) return;
		onCreateProject(clean);
		newName = '';
		creating = false;
	}
</script>

<div class="pointer-events-none fixed inset-x-2 top-2 flex flex-col items-stretch justify-between gap-1.5 md:inset-x-3 md:top-3 md:grid md:items-center md:gap-3"
	style="z-index: {Z_LAYERS.studioChrome}; grid-template-columns: var(--ui-side-track-w) minmax(0, 1fr) var(--ui-side-track-w);" data-testid="calm-top-strip" data-modality={inputModality}>
	<div class="pointer-events-auto relative flex items-center gap-1.5 md:h-[3.125rem]" data-testid="calm-top-left" data-corners={LEFT_CORNERS.join(',')}>
		<UiChamferFrame corners={LEFT_CORNERS} {cornerMode} cutTier="station" className="flex flex-wrap items-center gap-1.5 px-2.5 py-1">
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
			<UiUtilityIconButton {cornerMode} icon="plus" label="New Empty Canvas" onclick={() => { resetOpen = false; creating = !creating; }} />
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

	<div class="pointer-events-auto flex items-center justify-center md:h-[3.125rem]" data-testid="calm-hud-anchor">
		<UiChamferFrame corners={ZONE_CORNER_PRESETS.TOP_CENTER} {cornerMode} cutTier="station" outerClass="w-auto" className="flex h-full items-center gap-1.5 px-4 py-1">
			<UiChamferButton {cornerMode} icon="layers" label={chromeVisible ? STUDIO_UI_COPY.shellCalmLabel : STUDIO_UI_COPY.shellHudLabel} active={chromeVisible}
				variant={chromeVisible ? 'primary' : 'surface'} testId="studio-hud-toggle-btn" onclick={onToggleChrome} className="h-8 min-w-[6.75rem] justify-center py-0.5 text-xs" />
		</UiChamferFrame>
	</div>

	<div class="pointer-events-auto flex items-center justify-end md:h-[3.125rem]" data-testid="calm-top-right" data-corners={RIGHT_CORNERS.join(',')}>
		<UiChamferFrame corners={RIGHT_CORNERS} {cornerMode} cutTier="station" outerClass="w-auto" className="flex h-full items-center justify-end gap-1.5 px-2.5 py-1">
			<UiUtilityIconButton {cornerMode} icon="radar" label="Wireframe Skeleton Workbench" testId="calm-open-wireframe" onclick={onOpenWireframe} />
			<UiUtilityIconButton {cornerMode} icon={polarity === 'dark' ? 'sun' : 'moon'} label="Toggle Polarity" testId="calm-toggle-polarity" onclick={onTogglePolarity} />
			<UiUtilityIconButton {cornerMode} icon="settings" label="Settings & Input" testId="calm-open-settings" onclick={onOpenSettings} />
			<UiUtilityIconButton {cornerMode} icon="help" label="Field Tome (F1)" testId="open-tome-btn" onclick={onOpenHelp} />
		</UiChamferFrame>
	</div>
</div>

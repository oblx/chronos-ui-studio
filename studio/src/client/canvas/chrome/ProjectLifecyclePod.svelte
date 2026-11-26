<script lang="ts">
	import {
		HISTORY_LIMIT_BOUNDS, UiChamferButton, UiInput, UiPopover, UiUtilityIconButton, VERSION,
		type CornerKind, type UiProjectDefinition
	} from '@chronos-ui/svelte';
	import { STUDIO_UI_COPY } from '@studio/config';

	interface Props {
		cornerMode: CornerKind;
		isDirty: boolean;
		saveStatus?: 'SAVED' | 'DIRTY' | 'SAVING';
		compact?: boolean;
		projects?: readonly UiProjectDefinition[];
		activeProjectId?: string;
		canUndo?: boolean;
		canRedo?: boolean;
		undoCount?: number;
		redoCount?: number;
		historyLimit?: number;
		onUndo?: () => void;
		onRedo?: () => void;
		onSelectProject?: (id: string) => void;
		onCreateProject?: (name: string) => void;
		onSaveWorkspace: () => void;
		onResetDefaultView: () => void;
		onCleanWorkspace: () => void;
	}

	let {
		cornerMode, isDirty, saveStatus = 'SAVED', compact = false,
		projects = [], activeProjectId = '',
		canUndo = false, canRedo = false, undoCount = 0, redoCount = 0, historyLimit = HISTORY_LIMIT_BOUNDS.defaultLimit,
		onUndo, onRedo, onSelectProject, onCreateProject, onSaveWorkspace, onResetDefaultView, onCleanWorkspace
	}: Props = $props();

	let creating = $state(false);
	let resetOpen = $state(false);
	let newName = $state('');
	let activeProject = $derived(projects.find((p) => p.id === activeProjectId) ?? projects[0]);
	let undoTip = $derived(canUndo ? `Undo last change (${undoCount}/${historyLimit}) [Ctrl+Z]` : 'Nothing to undo');
	let redoTip = $derived(canRedo ? `Redo change (${redoCount}/${historyLimit}) [Ctrl+Shift+Z]` : 'Nothing to redo');

	function submitCreate(e: SubmitEvent): void {
		e.preventDefault();
		const clean = newName.trim();
		if (!clean || !onCreateProject) return;
		onCreateProject(clean);
		newName = '';
		creating = false;
	}
</script>

<div class="relative flex flex-nowrap items-center gap-1" data-testid="project-lifecycle-pod" data-pod-compact={compact ? 'true' : 'false'}>
	{#if !compact}
		<span class="ui-font-display shrink-0 whitespace-nowrap pr-1 text-xs font-semibold tracking-wide" style="color: var(--ui-primary);">
			{activeProject?.name ?? STUDIO_UI_COPY.defaultCanvasName}
		</span>
		<span class="ui-font-mono shrink-0 whitespace-nowrap border px-1.5 py-0.5 text-[0.65rem]" style="border-color: var(--ui-border-subtle); color: var(--ui-muted-content);">
			v{VERSION}
		</span>
		{#if projects.length > 1 && onSelectProject}
			{#each projects.filter((p) => p.id !== activeProjectId) as proj (proj.id)}
				<UiChamferButton {cornerMode} label={proj.name} tip={`Switch workspace to ${proj.name}`} tipLevel={50} variant="ghost" onclick={() => onSelectProject(proj.id)} className="shrink-0 py-0.5 text-xs" />
			{/each}
		{/if}
		{#if onCreateProject}
			<UiUtilityIconButton {cornerMode} icon="plus" label="New Empty Canvas" tipLevel={30} onclick={() => { resetOpen = false; creating = !creating; }} />
		{/if}
	{/if}

	<UiChamferButton
		{cornerMode}
		icon="undo"
		label={compact ? '' : 'Undo'}
		variant="ghost"
		disabled={!canUndo}
		tip={undoTip}
		tipLevel={canUndo ? 35 : 15}
		onclick={onUndo}
		testId="workspace-undo-btn"
		className={compact ? 'px-1 py-0.5 text-[0.62rem]' : 'shrink-0 px-1.5 py-0.5 text-xs'}
	/>

	<UiChamferButton
		{cornerMode}
		icon="redo"
		label={compact ? '' : 'Redo'}
		variant="ghost"
		disabled={!canRedo}
		tip={redoTip}
		tipLevel={canRedo ? 35 : 15}
		onclick={onRedo}
		testId="workspace-redo-btn"
		className={compact ? 'px-1 py-0.5 text-[0.62rem]' : 'shrink-0 px-1.5 py-0.5 text-xs'}
	/>

	<UiChamferButton
		{cornerMode}
		icon="save"
		variant={isDirty ? 'secondary' : 'ghost'}
		tip="Save Workspace (Ctrl+S)"
		tipLevel={20}
		onclick={onSaveWorkspace}
		testId="workspace-save-btn"
		className={compact ? 'px-1.5 py-0.5 text-[0.62rem]' : 'shrink-0 py-0.5 text-xs'}
	>
		<span>{saveStatus === 'SAVING' ? STUDIO_UI_COPY.savingLabel : STUDIO_UI_COPY.saveLabel}</span>
		<span class="inline-flex h-2 w-2 shrink-0 items-center justify-center">
			{#if isDirty}
				<span class="inline-block h-1.5 w-1.5 rounded-full" style="background-color: var(--ui-accent-vivid, var(--ui-primary));" data-testid="dirty-indicator"></span>
			{/if}
		</span>
	</UiChamferButton>

	<UiChamferButton
		{cornerMode}
		icon="reset"
		label={STUDIO_UI_COPY.resetLabel}
		tip="Workspace Reset Options"
		tipLevel={20}
		variant={resetOpen ? 'primary' : 'ghost'}
		onclick={() => { creating = false; resetOpen = !resetOpen; }}
		testId="workspace-reset-btn"
		className={compact ? 'px-1.5 py-0.5 text-[0.62rem]' : 'shrink-0 py-0.5 text-xs'}
	/>

	{#if !compact && onCreateProject}
		<UiPopover open={creating} {cornerMode} label="New empty canvas dialog" onClose={() => { creating = false; }}>
			<form onsubmit={submitCreate} class="flex flex-col gap-2" data-testid="new-canvas-popover">
				<span class="ui-font-mono text-[0.68rem] font-semibold" style="color: var(--ui-muted-content);">{STUDIO_UI_COPY.newWorkspaceTitle}</span>
				<UiInput bind:value={newName} {cornerMode} placeholder={STUDIO_UI_COPY.newWorkspacePlaceholder} label={STUDIO_UI_COPY.newWorkspacePlaceholder} className="ui-font-mono" />
				<div class="flex justify-end gap-1.5">
					<UiChamferButton {cornerMode} label="Cancel" variant="ghost" onclick={() => { creating = false; }} className="py-0.5 text-xs" />
					<UiChamferButton {cornerMode} type="submit" label="Create" variant="primary" className="py-0.5 text-xs" />
				</div>
			</form>
		</UiPopover>
	{/if}

	<UiPopover open={resetOpen} {cornerMode} label="Reset workspace options" onClose={() => { resetOpen = false; }}>
		<div class="flex flex-col gap-1.5" data-testid="workspace-reset-popover">
			<span class="ui-font-mono text-[0.68rem] font-semibold" style="color: var(--ui-muted-content);">{STUDIO_UI_COPY.recoveryTitle}</span>
			<UiChamferButton {cornerMode} icon="radar" label={STUDIO_UI_COPY.defaultViewAction} tip="Recenter stage camera & panels" tipLevel={40} variant="surface" testId="reset-default-view-btn"
				onclick={() => { resetOpen = false; onResetDefaultView(); }} className="w-full justify-start py-1 text-xs" />
			<UiChamferButton {cornerMode} icon="trash" label={STUDIO_UI_COPY.cleanWorkspaceAction} tip="Clear canvas to Calm Empty Stage (undoable)" tipLevel={20} variant="danger" testId="reset-clean-workspace-btn"
				onclick={() => { resetOpen = false; onCleanWorkspace(); }} className="w-full justify-start py-1 text-xs" />
		</div>
	</UiPopover>
</div>

<script lang="ts">
	import {
		UiChamferButton, UiInput, UiPopover, UiUtilityIconButton, VERSION,
		type CornerKind, type UiProjectDefinition
	} from '@chronos-ui/svelte';

	interface Props {
		cornerMode: CornerKind;
		isDirty: boolean;
		saveStatus?: 'SAVED' | 'DIRTY' | 'SAVING';
		compact?: boolean;
		projects?: readonly UiProjectDefinition[];
		activeProjectId?: string;
		onSelectProject?: (id: string) => void;
		onCreateProject?: (name: string) => void;
		onSaveWorkspace: () => void;
		onResetDefaultView: () => void;
		onCleanWorkspace: () => void;
	}

	let {
		cornerMode, isDirty, saveStatus = 'SAVED', compact = false,
		projects = [], activeProjectId = '',
		onSelectProject, onCreateProject, onSaveWorkspace, onResetDefaultView, onCleanWorkspace
	}: Props = $props();

	let creating = $state(false);
	let resetOpen = $state(false);
	let newName = $state('');
	let activeProject = $derived(projects.find((p) => p.id === activeProjectId) ?? projects[0]);

	function submitCreate(e: SubmitEvent): void {
		e.preventDefault();
		const clean = newName.trim();
		if (!clean || !onCreateProject) return;
		onCreateProject(clean);
		newName = '';
		creating = false;
	}
</script>

<div class="relative flex flex-nowrap items-center gap-1.5" data-testid="project-lifecycle-pod" data-pod-compact={compact ? 'true' : 'false'}>
	{#if !compact}
		<span class="ui-font-display shrink-0 whitespace-nowrap pr-1 text-xs font-semibold tracking-wide" style="color: var(--ui-primary);">
			{activeProject?.name ?? 'Genesis Canvas'}
		</span>
		<span class="ui-font-mono shrink-0 whitespace-nowrap border px-1.5 py-0.5 text-[0.65rem]" style="border-color: var(--ui-border-subtle); color: var(--ui-muted-content);">
			v{VERSION}
		</span>
		{#if projects.length > 1 && onSelectProject}
			{#each projects.filter((p) => p.id !== activeProjectId) as proj (proj.id)}
				<UiChamferButton {cornerMode} label={proj.name} variant="ghost" onclick={() => onSelectProject(proj.id)} className="shrink-0 py-0.5 text-xs" />
			{/each}
		{/if}
		{#if onCreateProject}
			<UiUtilityIconButton {cornerMode} icon="plus" label="New Empty Canvas" onclick={() => { resetOpen = false; creating = !creating; }} />
		{/if}
	{/if}

	<UiChamferButton
		{cornerMode}
		icon="save"
		variant={isDirty ? 'secondary' : 'ghost'}
		tip="Save Workspace (Ctrl+S)"
		onclick={onSaveWorkspace}
		testId="workspace-save-btn"
		className={compact ? 'px-1.5 py-0.5 text-[0.62rem]' : 'shrink-0 py-0.5 text-xs'}
	>
		<span>{saveStatus === 'SAVING' ? 'Saving' : 'Save'}</span>
		<span class="inline-flex h-2 w-2 shrink-0 items-center justify-center">
			{#if isDirty}
				<span class="inline-block h-1.5 w-1.5 rounded-full" style="background-color: var(--ui-accent-vivid, var(--ui-primary));" data-testid="dirty-indicator"></span>
			{/if}
		</span>
	</UiChamferButton>

	<UiChamferButton
		{cornerMode}
		icon="reset"
		label="Reset"
		tip="Workspace Reset Options"
		variant={resetOpen ? 'primary' : 'ghost'}
		onclick={() => { creating = false; resetOpen = !resetOpen; }}
		testId="workspace-reset-btn"
		className={compact ? 'px-1.5 py-0.5 text-[0.62rem]' : 'shrink-0 py-0.5 text-xs'}
	/>

	{#if !compact && onCreateProject}
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
	{/if}

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

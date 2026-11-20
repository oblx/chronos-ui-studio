<script lang="ts">
	import { UiBadge, UiChamferButton, type CornerKind } from '@chronos-ui/svelte';
	import { STUDIO_SPOTLIGHT_STEPS } from '../../config';

	interface Props {
		cornerMode: CornerKind;
		onStartTour: () => void;
		onOpenTome: () => void;
	}

	let { cornerMode, onStartTour, onOpenTome }: Props = $props();
</script>

<div class="flex flex-col gap-2.5">
	<div class="flex items-center justify-between">
		<span class="text-xs font-semibold" style="color: var(--ui-muted-content);">Spotlight Tour Steps</span>
		<UiBadge text={`${STUDIO_SPOTLIGHT_STEPS.length} Steps`} tone="info" />
	</div>
	{#each STUDIO_SPOTLIGHT_STEPS as step, i (step.id)}
		<div class="p-2" style="background-color: var(--ui-base-100); border: var(--ui-hairline) solid var(--ui-border-subtle);">
			<div class="flex items-center justify-between gap-2">
				<span class="text-xs font-semibold" style="color: var(--ui-base-content);">{i + 1}. {step.title}</span>
				<span class="ui-font-mono text-[0.65rem]" style="color: var(--ui-accent);">{step.targetIds.join(', ')}</span>
			</div>
			<p class="mt-1 text-xs" style="color: var(--ui-muted-content);">{step.body}</p>
		</div>
	{/each}
	<div class="flex items-center gap-2">
		<UiChamferButton {cornerMode} icon="spotlight" label="Launch Spotlight" variant="primary" onclick={onStartTour} />
		<UiChamferButton {cornerMode} icon="book" label="Open Tome" onclick={onOpenTome} />
	</div>
</div>

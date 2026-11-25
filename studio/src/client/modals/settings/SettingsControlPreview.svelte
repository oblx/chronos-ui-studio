<script lang="ts">
	import { UiChamferButton, UiInput, UiSelect, UiSlider, type CornerKind } from '@chronos-ui/svelte';

	interface Props {
		cornerMode: CornerKind;
		showValidationInline: boolean;
	}

	let { cornerMode, showValidationInline }: Props = $props();
	let sampleText = $state('Chronos Token');
	let sampleOpt = $state('tactical');
	let sampleRange = $state(64);
	const OPTS = [
		{ value: 'tactical', label: 'Tactical Surface' },
		{ value: 'blueprint', label: 'Blueprint Grid' }
	];
</script>

<div class="flex flex-col gap-1.5 border p-2 text-xs" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-200);" data-testid="settings-control-sandbox">
	<div class="flex items-center justify-between gap-2">
		<span class="ui-font-mono text-[0.6rem] uppercase" style="color: var(--ui-muted-content);">Live Control Sandbox</span>
		<UiChamferButton {cornerMode} icon="star" label="Preview CTA" tip="Reacts live to variant, density, hover & icon side" tipLevel={50} variant="surface" className="text-[0.64rem]" />
	</div>
	<div class="grid grid-cols-2 gap-1.5">
		<UiInput {cornerMode} bind:value={sampleText} label="Sample text input" placeholder="Type sample..." />
		<UiSelect {cornerMode} bind:value={sampleOpt} options={OPTS} label="Sample select" />
	</div>
	<UiSlider bind:value={sampleRange} min={0} max={100} label="Slider Track Preview" valueLabel={`${sampleRange}%`} />
	{#if showValidationInline}
		<div class="ui-font-mono text-[0.6rem]" style="color: {sampleText.trim().length > 0 ? 'var(--ui-success)' : 'var(--ui-warning)'};">
			{sampleText.trim().length > 0 ? 'INLINE VALIDATION · OK' : 'INLINE VALIDATION · Required'}
		</div>
	{/if}
</div>

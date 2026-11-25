<script lang="ts">
	import {
		BUTTON_VARIANT_MODES, DEFAULT_CONTROL_CONFIG, FORM_SURFACE_STYLES, UiChamferButton,
		type ButtonVariantMode, type CornerKind, type FormSurfaceStyle, type UiNode
	} from '@chronos-ui/svelte';

	interface Props {
		node: UiNode;
		cornerMode: CornerKind;
		onPatch: (nodeId: string, patch: Partial<UiNode>) => void;
	}

	let { node, cornerMode, onPatch }: Props = $props();
	let btnVariant = $derived(node.controlConfig?.buttonConfig?.variant ?? DEFAULT_CONTROL_CONFIG.buttonConfig.variant);
	let formSurface = $derived(node.controlConfig?.formConfig?.surfaceStyle ?? DEFAULT_CONTROL_CONFIG.formConfig.surfaceStyle);

	function setBtnVariant(variant: ButtonVariantMode): void {
		const base = node.controlConfig ?? DEFAULT_CONTROL_CONFIG;
		onPatch(node.id, { controlConfig: { ...base, buttonConfig: { ...(base.buttonConfig ?? DEFAULT_CONTROL_CONFIG.buttonConfig), variant } } });
	}

	function setFormSurface(surfaceStyle: FormSurfaceStyle): void {
		const base = node.controlConfig ?? DEFAULT_CONTROL_CONFIG;
		onPatch(node.id, { controlConfig: { ...base, formConfig: { ...(base.formConfig ?? DEFAULT_CONTROL_CONFIG.formConfig), surfaceStyle } } });
	}
</script>

<div class="flex flex-col gap-1.5 border p-2" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-100);" data-testid="node-control-overrides">
	<span class="ui-font-mono text-[0.6rem] uppercase" style="color: var(--ui-muted-content);">Node Control Overrides</span>
	<div class="grid grid-cols-4 gap-1">
		{#each BUTTON_VARIANT_MODES as v (v)}
			<UiChamferButton {cornerMode} label={v} active={btnVariant === v} variant={btnVariant === v ? 'primary' : 'ghost'} onclick={() => setBtnVariant(v)} className="px-1 py-0.5 text-[0.58rem]" />
		{/each}
	</div>
	<div class="grid grid-cols-3 gap-1">
		{#each FORM_SURFACE_STYLES as fs (fs)}
			<UiChamferButton {cornerMode} label={fs} active={formSurface === fs} variant={formSurface === fs ? 'secondary' : 'ghost'} onclick={() => setFormSurface(fs)} className="px-1 py-0.5 text-[0.58rem]" />
		{/each}
	</div>
</div>

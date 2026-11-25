<script lang="ts">
	import { UiVectorBorder } from '../atoms';
	import { createControlCornerRef } from '../motion';
	import {
		clampControlCutRem, CONTROL_MAX_CUT_RATIO, DEFAULT_CHAMFER_TUPLE, resolveControlSurface,
		type CornerKind, type CornerTuple
	} from '../tokens';

	interface Props {
		value?: string;
		placeholder?: string;
		type?: 'text' | 'password' | 'search' | 'url';
		label?: string;
		disabled?: boolean;
		corners?: CornerTuple;
		cornerMode?: CornerKind;
		className?: string;
		oninput?: (value: string) => void;
		onkeydown?: (e: KeyboardEvent) => void;
	}

	let {
		value = $bindable(''),
		placeholder = '',
		type = 'text',
		label = '',
		disabled = false,
		corners = DEFAULT_CHAMFER_TUPLE,
		cornerMode = 'CHAMFER',
		className = '',
		oninput,
		onkeydown
	}: Props = $props();

	const cornerRef = createControlCornerRef();
	let surface = $derived(resolveControlSurface(cornerMode, corners, clampControlCutRem(cornerRef.cutRem)));
</script>

<span class="ui-field-wrap relative inline-flex w-full" data-corner-mode={cornerMode}>
	<span
		aria-hidden="true"
		class="ui-field-bg pointer-events-none absolute inset-0"
		style="background-color: var(--ui-base-100); {surface.surfaceStyle}"
	></span>
	<UiVectorBorder {corners} {cornerMode} cutPx={surface.cutPx} maxCutRatio={CONTROL_MAX_CUT_RATIO} strokeVar="var(--ui-border-subtle)" strokeWidth={1.15} />
	<input
		{type}
		{value}
		{placeholder}
		{disabled}
		aria-label={label || placeholder || undefined}
		data-ui-interactive="true"
		data-ui-cursor={disabled ? 'not-allowed' : 'text'}
		oninput={(e) => {
			const next = (e.currentTarget as HTMLInputElement).value;
			value = next;
			oninput?.(next);
		}}
		{onkeydown}
		class="ui-ctl ui-field-input relative z-10 w-full bg-transparent text-xs outline-none transition-colors disabled:opacity-50 {className}"
		style="color: var(--ui-base-content);"
	/>
</span>

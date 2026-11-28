<script lang="ts">
	import type { Snippet } from 'svelte';
	import { UiIcon, UiVectorBorder } from '../atoms';
	import { createControlCornerRef } from '../motion';
	import {
		clampControlCutRem, CONTROL_MAX_CUT_RATIO, DEFAULT_CHAMFER_TUPLE, resolveControlSurface,
		type CornerKind, type CornerTuple
	} from '../tokens';

	interface Props {
		title: string;
		subtitle?: string;
		open?: boolean;
		corners?: CornerTuple;
		cornerMode?: CornerKind;
		children?: Snippet;
	}

	let {
		title,
		subtitle,
		open = $bindable(false),
		corners = DEFAULT_CHAMFER_TUPLE,
		cornerMode = 'CHAMFER',
		children
	}: Props = $props();

	const cornerRef = createControlCornerRef();
	let surface = $derived(resolveControlSurface(cornerMode, corners, clampControlCutRem(cornerRef.cutRem)));
</script>

<section class="relative overflow-hidden" data-corner-mode={cornerMode}>
	<span
		aria-hidden="true"
		class="pointer-events-none absolute inset-0 z-0"
		style="background-color: var(--ui-base-200); {surface.surfaceStyle}"
	></span>
	<UiVectorBorder {corners} {cornerMode} cutPx={surface.cutPx} maxCutRatio={CONTROL_MAX_CUT_RATIO} strokeVar="var(--ui-border-subtle)" />
	<button
		type="button"
		aria-expanded={open}
		data-ui-interactive="true"
		data-ui-cursor="pointer"
		data-ui-tip={open ? `Collapse ${title}` : `Expand ${title}`}
		data-ui-tip-level={55}
		onclick={() => (open = !open)}
		class="ui-ctl ui-detent relative z-10 flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors"
		style="color: var(--ui-base-content);"
	>
		<div class="min-w-0">
			<div class="truncate text-xs font-semibold">{title}</div>
			{#if subtitle}
				<div class="truncate text-xs" style="color: var(--ui-muted-content);">{subtitle}</div>
			{/if}
		</div>
		<UiIcon name={open ? 'chevron-up' : 'chevron-down'} sizeRem={0.95} />
	</button>
	{#if open}
		<div class="relative z-10 h-px w-full" style="background-color: var(--ui-border-subtle);" aria-hidden="true"></div>
		<div class="relative z-10 px-3 py-2.5">
			{@render children?.()}
		</div>
	{/if}
</section>

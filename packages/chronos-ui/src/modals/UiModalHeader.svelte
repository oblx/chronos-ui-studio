<script lang="ts">
	import { getActiveStudioDefaults, subscribeMotionState } from '../motion';
	import {
		buildClipPathPolygon, clampControlCutRem, CONTROL_MAX_CUT_RATIO, DEFAULT_CHAMFER_TUPLE, remToPx,
		resolveCornerTuple, type CornerKind, type UiIconName
	} from '../tokens';
	import { UiIcon, UiVectorBorder } from '../atoms';

	interface Props {
		title: string;
		subtitle?: string;
		icon?: UiIconName;
		cornerMode?: CornerKind;
		isLocked?: boolean;
		isExpanded?: boolean;
		expandable?: boolean;
		remainingSeconds?: number;
		progressRatio?: number;
		onToggleExpand?: () => void;
		onClose: () => void;
	}

	let {
		title, subtitle, icon = 'layers', cornerMode = 'CHAMFER', isLocked = false,
		isExpanded = false, expandable = true, remainingSeconds = 0, progressRatio = 0,
		onToggleExpand, onClose
	}: Props = $props();

	let controlCutRem = $state(getActiveStudioDefaults().controlCornerCutRem);
	$effect(() => subscribeMotionState(() => { controlCutRem = getActiveStudioDefaults().controlCornerCutRem; }));
	let resolvedCorners = $derived(resolveCornerTuple(DEFAULT_CHAMFER_TUPLE, cornerMode));
	let cutRem = $derived(cornerMode === 'STRAIGHT' ? 0 : clampControlCutRem(controlCutRem));
	let cutPx = $derived(remToPx(cutRem));
	let clipStyle = $derived(
		cornerMode === 'CHAMFER'
			? `clip-path: ${buildClipPathPolygon(cutRem, resolvedCorners)};`
			: cornerMode === 'ROUND'
				? `border-radius: ${cutRem}rem;`
				: ''
	);
	let expandTip = $derived(isExpanded ? 'Restore Previous Size [Alt+M]' : 'Expand to Full Viewport [Alt+M]');
</script>

<header
	role="presentation"
	ondblclick={() => { if (expandable && onToggleExpand) onToggleExpand(); }}
	class="flex shrink-0 items-center justify-between gap-3 px-4 py-3 select-none"
	style="border-bottom: var(--ui-hairline) solid var(--ui-border-subtle); background-color: var(--ui-base-300);"
>
	<div class="flex min-w-0 items-center gap-2.5">
		<span style="color: var(--ui-primary);"><UiIcon name={icon} sizeRem={1.15} /></span>
		<div class="min-w-0">
			<h2 class="ui-font-display truncate text-sm font-bold tracking-tight" style="color: var(--ui-base-content);">
				{title}
			</h2>
			{#if subtitle}
				<p class="truncate text-xs" style="color: var(--ui-muted-content);">{subtitle}</p>
			{/if}
		</div>
	</div>

	<div class="flex shrink-0 items-center gap-2">
		{#if expandable && onToggleExpand}
			<button
				type="button"
				aria-label={expandTip}
				aria-pressed={isExpanded}
				data-ui-tip={expandTip}
				data-testid="modal-expand-btn"
				data-corner-mode={cornerMode}
				data-ui-cursor="pointer"
				onclick={onToggleExpand}
				class="ui-dur-micro ui-detent relative inline-flex shrink-0 items-center justify-center transition-colors"
				style="width: 2.25rem; height: 2.25rem; contain: size layout; color: {isExpanded ? 'var(--ui-primary)' : 'var(--ui-base-content)'};"
			>
				<span aria-hidden="true" class="pointer-events-none absolute inset-0" style="background-color: var(--ui-base-200); {clipStyle}"></span>
				<UiVectorBorder corners={DEFAULT_CHAMFER_TUPLE} {cornerMode} {cutPx} maxCutRatio={CONTROL_MAX_CUT_RATIO} strokeVar={isExpanded ? 'var(--ui-primary)' : 'var(--ui-border-subtle)'} strokeWidth={1.35} />
				<span class="relative z-10 inline-flex items-center justify-center">
					<UiIcon name={isExpanded ? 'minimize' : 'expand'} sizeRem={0.95} />
				</span>
			</button>
		{/if}

		<button
			type="button"
			aria-label={isLocked ? `Close locked for ${remainingSeconds} seconds` : 'Close modal'}
			disabled={isLocked}
			onclick={onClose}
			data-testid="modal-close-btn"
			data-corner-mode={cornerMode}
			data-ui-cursor={isLocked ? 'not-allowed' : 'pointer'}
			class="ui-dur-micro ui-detent relative inline-flex shrink-0 items-center justify-center transition-colors"
			style="width: 2.25rem; height: 2.25rem; contain: size layout; color: {isLocked ? 'var(--ui-muted-content)' : 'var(--ui-base-content)'};"
		>
			<span aria-hidden="true" class="pointer-events-none absolute inset-0" style="background-color: var(--ui-base-200); {clipStyle}"></span>
			<UiVectorBorder corners={DEFAULT_CHAMFER_TUPLE} {cornerMode} {cutPx} maxCutRatio={CONTROL_MAX_CUT_RATIO} strokeVar="var(--ui-border-subtle)" strokeWidth={1.35} progressRatio={isLocked ? progressRatio : 0} progressStrokeVar="var(--ui-accent)" />
			<span class="relative z-10 inline-flex items-center justify-center">
				{#if isLocked}
					<span class="ui-font-mono text-xs font-bold">{remainingSeconds}</span>
				{:else}
					<UiIcon name="close" sizeRem={0.95} />
				{/if}
			</span>
		</button>
	</div>
</header>

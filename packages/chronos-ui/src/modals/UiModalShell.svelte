<script lang="ts">
	import type { Snippet } from 'svelte';
	import { UiChamferFrame } from '../atoms';
	import { uiTransition } from '../motion';
	import { DEFAULT_CHAMFER_TUPLE, type CornerKind, type CornerTuple, type UiIconName } from '../tokens';
	import type { UiModalSizeTier } from './index';
	import UiModalHeader from './UiModalHeader.svelte';

	const SIZE_TIER_WIDTH: Readonly<Record<UiModalSizeTier, string>> = {
		COMPACT: 'min(92vw, 36rem)',
		STANDARD: 'min(94vw, 56rem)',
		WIDE: 'min(96vw, 68rem)',
		FULL_STAGE: 'min(96vw, 76rem)'
	};

	interface Props {
		open: boolean;
		title: string;
		subtitle?: string;
		icon?: UiIconName;
		corners?: CornerTuple;
		cornerMode?: CornerKind;
		cornerRadiusRem?: number;
		sizeTier?: UiModalSizeTier;
		maxWidthRem?: number;
		isLocked?: boolean;
		remainingSeconds?: number;
		progressRatio?: number;
		onClose: () => void;
		footer?: Snippet;
		children?: Snippet;
	}

	let {
		open,
		title,
		subtitle,
		icon = 'layers',
		corners = DEFAULT_CHAMFER_TUPLE,
		cornerMode = 'CHAMFER',
		cornerRadiusRem,
		sizeTier,
		maxWidthRem = 56,
		isLocked = false,
		remainingSeconds = 0,
		progressRatio = 0,
		onClose,
		footer,
		children
	}: Props = $props();

	let resolvedWidth = $derived(sizeTier ? SIZE_TIER_WIDTH[sizeTier] : `min(94vw, ${maxWidthRem}rem)`);

	function handleKey(e: KeyboardEvent): void {
		if (open && e.key === 'Escape' && !isLocked) {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKey} />

{#if open}
	<div
		role="dialog"
		aria-modal="true"
		aria-label={title}
		data-ui-interactive="true"
		data-modal-size-tier={sizeTier ?? 'CUSTOM'}
		class="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
		style="background: var(--ui-backdrop-radial);"
	>
		<button
			type="button"
			aria-label="Dismiss modal backdrop"
			data-ui-modal-backdrop="true"
			data-ui-cursor="default"
			class="absolute inset-0"
			onclick={() => { if (!isLocked) onClose(); }}
		></button>
		<div
			data-testid="modal-shell-box"
			in:uiTransition={{ offsetPx: 14 }}
			out:uiTransition={{ offsetPx: 14 }}
			class="relative z-10 w-full"
			style="width: {resolvedWidth}; max-width: {resolvedWidth};"
		>
			<UiChamferFrame {corners} {cornerMode} {cornerRadiusRem} bezel={true} carets={true} outerClass="w-full">
				<div class="flex max-h-[min(86vh,48rem)] flex-col">
					<UiModalHeader
						{title}
						{subtitle}
						{icon}
						{cornerMode}
						{isLocked}
						{remainingSeconds}
						{progressRatio}
						{onClose}
					/>
					<div class="ui-scroll-deck min-h-0 flex-1 overflow-y-auto p-4">
						{@render children?.()}
					</div>
					{#if footer}
						{@render footer()}
					{/if}
				</div>
			</UiChamferFrame>
		</div>
	</div>
{/if}

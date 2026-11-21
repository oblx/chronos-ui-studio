<script lang="ts">
	import type { Snippet } from 'svelte';
	import { UiChamferFrame } from '../atoms';
	import type { ModalGeometrySnapshot } from '../machines';
	import { uiTransition } from '../motion';
	import {
		DEFAULT_CHAMFER_TUPLE, type CornerAnimation, type CornerEmbellishment, type CornerKind,
		type CornerTuple, type EmbellishmentConfig, type UiIconName
	} from '../tokens';
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
		cornerEmbellishment?: CornerEmbellishment;
		cornerAnimation?: CornerAnimation;
		embellishmentConfig?: EmbellishmentConfig;
		sizeTier?: UiModalSizeTier;
		maxWidthRem?: number;
		expandable?: boolean;
		expanded?: boolean;
		isLocked?: boolean;
		remainingSeconds?: number;
		progressRatio?: number;
		onToggleExpand?: (expanded: boolean, snapshot: ModalGeometrySnapshot | null) => void;
		onClose: () => void;
		footer?: Snippet;
		children?: Snippet;
	}

	let {
		open, title, subtitle, icon = 'layers', corners = DEFAULT_CHAMFER_TUPLE, cornerMode = 'CHAMFER',
		cornerRadiusRem, cornerEmbellishment, cornerAnimation, embellishmentConfig,
		sizeTier, maxWidthRem = 56, expandable = true, expanded, isLocked = false,
		remainingSeconds = 0, progressRatio = 0, onToggleExpand, onClose, footer, children
	}: Props = $props();

	let internalExpanded = $state(false);
	let restoreSnapshot = $state<ModalGeometrySnapshot | null>(null);
	let shellEl = $state<HTMLElement | null>(null);

	let isExpanded = $derived(expanded ?? internalExpanded);
	let baseWidth = $derived(sizeTier ? SIZE_TIER_WIDTH[sizeTier] : `min(94vw, ${maxWidthRem}rem)`);
	let boxStyle = $derived(
		isExpanded
			? 'width: calc(100vw - 1.5rem); max-width: calc(100vw - 1.5rem); height: calc(100vh - 1.5rem);'
			: restoreSnapshot
				? `width: ${restoreSnapshot.widthPx}px; max-width: min(96vw, ${restoreSnapshot.widthPx}px);`
				: `width: ${baseWidth}; max-width: ${baseWidth};`
	);

	$effect(() => {
		if (!open) { internalExpanded = false; restoreSnapshot = null; }
	});

	function toggleExpand(): void {
		if (!expandable) return;
		if (!isExpanded && shellEl) {
			const r = shellEl.getBoundingClientRect();
			restoreSnapshot = { widthPx: Math.round(r.width), heightPx: Math.round(r.height), leftPx: Math.round(r.left), topPx: Math.round(r.top) };
		}
		const next = !isExpanded;
		if (expanded === undefined) internalExpanded = next;
		onToggleExpand?.(next, restoreSnapshot);
	}

	function handleKey(e: KeyboardEvent): void {
		if (!open) return;
		if (e.key === 'Escape' && !isLocked) onClose();
		if (e.altKey && e.key.toLowerCase() === 'm' && expandable) { e.preventDefault(); toggleExpand(); }
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
		data-modal-expanded={isExpanded ? 'true' : 'false'}
		class="fixed inset-0 z-[70] flex items-center justify-center {isExpanded ? 'p-3' : 'p-4 sm:p-6'}"
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
			bind:this={shellEl}
			data-testid="modal-shell-box"
			data-expanded={isExpanded ? 'true' : 'false'}
			in:uiTransition={{ offsetPx: 14 }}
			out:uiTransition={{ offsetPx: 14 }}
			class="ui-modal-morph relative z-10 flex w-full flex-col"
			style={boxStyle}
		>
			<UiChamferFrame {corners} {cornerMode} {cornerRadiusRem} {cornerEmbellishment} {cornerAnimation} {embellishmentConfig} cutTier="station" bezel={true} carets={true} outerClass="w-full {isExpanded ? 'h-full' : ''}" className={isExpanded ? 'h-full' : ''}>
				<div class="flex flex-col {isExpanded ? 'h-[calc(100vh-1.5rem)]' : 'max-h-[min(86vh,48rem)]'}">
					<UiModalHeader {title} {subtitle} {icon} {cornerMode} {isLocked} {isExpanded} {expandable} {remainingSeconds} {progressRatio} onToggleExpand={toggleExpand} {onClose} />
					<div class="ui-scroll-deck flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
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

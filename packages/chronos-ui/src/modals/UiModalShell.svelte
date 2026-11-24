<script lang="ts">
	import { getContext, tick, type Snippet } from 'svelte';
	import { UiChamferFrame } from '../atoms';
	import type { ModalGeometrySnapshot } from '../machines';
	import { getActiveMotionSensory, MOTION_PROFILE_SPECS, resolveDurationMs, uiTransition } from '../motion';
	import {
		DEFAULT_CHAMFER_TUPLE, type CornerAnimation, type CornerEmbellishment, type CornerKind,
		type CornerTuple, type EmbellishmentConfig, type UiIconName
	} from '../tokens';
	import { MODAL_EXPANSION_CTX_KEY, type ModalExpansionBridge, type UiModalSizeTier } from './index';
	import UiModalHeader from './UiModalHeader.svelte';

	const SIZE_TIER_WIDTH: Readonly<Record<UiModalSizeTier, string>> = {
		COMPACT: 'min(92vw, 36rem)', STANDARD: 'min(94vw, 56rem)', WIDE: 'min(96vw, 68rem)', FULL_STAGE: 'min(96vw, 76rem)'
	};

	interface Props {
		open: boolean; title: string; subtitle?: string; icon?: UiIconName;
		corners?: CornerTuple; cornerMode?: CornerKind; cornerRadiusRem?: number;
		cornerEmbellishment?: CornerEmbellishment; cornerAnimation?: CornerAnimation; embellishmentConfig?: EmbellishmentConfig;
		sizeTier?: UiModalSizeTier; maxWidthRem?: number; expandable?: boolean; expanded?: boolean;
		isLocked?: boolean; remainingSeconds?: number; progressRatio?: number;
		onToggleExpand?: (expanded: boolean, snapshot: ModalGeometrySnapshot | null) => void;
		onClose: () => void; footer?: Snippet; children?: Snippet;
	}

	let {
		open, title, subtitle, icon = 'layers', corners = DEFAULT_CHAMFER_TUPLE, cornerMode = 'CHAMFER',
		cornerRadiusRem, cornerEmbellishment, cornerAnimation, embellishmentConfig,
		sizeTier, maxWidthRem = 56, expandable = true, expanded, isLocked = false,
		remainingSeconds = 0, progressRatio = 0, onToggleExpand, onClose, footer, children
	}: Props = $props();

	const expansionBridge = getContext<ModalExpansionBridge | undefined>(MODAL_EXPANSION_CTX_KEY);
	let internalExpanded = $state(false);
	let restoreSnapshot = $state<ModalGeometrySnapshot | null>(null);
	let shellEl = $state<HTMLElement | null>(null);
	let isExpanded = $derived(expanded ?? (expansionBridge ? expansionBridge.isExpanded : internalExpanded));
	let baseWidth = $derived(sizeTier ? SIZE_TIER_WIDTH[sizeTier] : `min(94vw, ${maxWidthRem}rem)`);
	let activeSnapshot = $derived(restoreSnapshot ?? expansionBridge?.restoreSnapshot ?? null);
	let boxWidth = $derived(isExpanded ? 'calc(100vw - 1.5rem)' : activeSnapshot ? `${activeSnapshot.widthPx}px` : baseWidth);
	let boxHeight = $derived(isExpanded ? 'calc(100vh - 1.5rem)' : undefined);

	$effect(() => {
		if (!open) { internalExpanded = false; restoreSnapshot = null; }
	});

	function captureSnapshot(): ModalGeometrySnapshot | null {
		if (!shellEl) return restoreSnapshot;
		const r = shellEl.getBoundingClientRect();
		return { widthPx: Math.round(r.width), heightPx: Math.round(r.height), leftPx: Math.round(r.left), topPx: Math.round(r.top) };
	}

	function runFlipMorph(prev: DOMRect | null, clickedAt: CSSNumberish | null): void {
		const duration = resolveDurationMs('morph');
		if (!prev || duration <= 0) return;
		const easing = MOTION_PROFILE_SPECS[getActiveMotionSensory().profile].easing;
		void tick().then(() => {
			if (!shellEl || typeof shellEl.animate !== 'function') return;
			const next = shellEl.getBoundingClientRect();
			if (next.width <= 0 || next.height <= 0) return;
			const sx = prev.width / next.width, sy = prev.height / next.height;
			if (Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) return;
			const dx = prev.left + prev.width / 2 - (next.left + next.width / 2), dy = prev.top + prev.height / 2 - (next.top + next.height / 2);
			const anim = shellEl.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` }, { transform: 'translate(0px, 0px) scale(1, 1)' }], { duration, easing });
			if (typeof clickedAt === 'number') anim.startTime = clickedAt;
		});
	}

	function toggleExpand(): void {
		if (!expandable) return;
		const prevRect = shellEl?.getBoundingClientRect() ?? null;
		const clickedAt = typeof document !== 'undefined' && document.timeline ? document.timeline.currentTime : null;
		if (!isExpanded) restoreSnapshot = captureSnapshot();
		const next = !isExpanded;
		if (expanded === undefined) {
			if (expansionBridge) expansionBridge.setExpanded(next, restoreSnapshot);
			else internalExpanded = next;
		}
		onToggleExpand?.(next, restoreSnapshot);
		runFlipMorph(prevRect, clickedAt);
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
			class="ui-modal-morph relative z-10 flex min-w-0 flex-col"
			style:width={boxWidth}
			style:max-width={boxWidth}
			style:height={boxHeight}
		>
			<UiChamferFrame {corners} {cornerMode} {cornerRadiusRem} {cornerEmbellishment} {cornerAnimation} {embellishmentConfig} cutTier="station" bezel={true} carets={true} outerClass="w-full min-w-0 {isExpanded ? 'h-full' : ''}" className="min-w-0 {isExpanded ? 'h-full' : ''}">
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

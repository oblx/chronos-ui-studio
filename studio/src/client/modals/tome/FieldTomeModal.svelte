<script lang="ts">
	import { UiChamferButton, UiChamferFrame, UiMathFormula, UiModalFooter, UiModalShell, uiSwipeDeck, type CornerKind } from '@chronos-ui/svelte';
	import { STUDIO_UI_COPY, TOME_SSG_CHAPTERS } from '@studio/config';
	import FieldTomeFolio from './FieldTomeFolio.svelte';

	interface Props {
		open: boolean;
		topic: string;
		cornerMode: CornerKind;
		isLocked: boolean;
		remainingSeconds: number;
		progressRatio: number;
		onClose: () => void;
	}

	let { open, topic, cornerMode, isLocked, remainingSeconds, progressRatio, onClose }: Props = $props();

	let chapterIdx = $state(0);
	let pageIdx = $state(0);

	$effect(() => {
		const idx = TOME_SSG_CHAPTERS.findIndex((c) => c.contextTopic === topic);
		if (idx >= 0) { chapterIdx = idx; pageIdx = 0; }
	});

	let activeChapter = $derived(TOME_SSG_CHAPTERS[chapterIdx] ?? TOME_SSG_CHAPTERS[0]);
	let activePage = $derived(activeChapter?.pages[pageIdx] ?? activeChapter?.pages[0]);
	let totalPages = $derived(activeChapter?.pages.length ?? 1);

	function selectChapter(idx: number): void {
		chapterIdx = Math.max(0, Math.min(TOME_SSG_CHAPTERS.length - 1, idx));
		pageIdx = 0;
	}

	function stepFolio(delta: -1 | 1): void {
		if (!activeChapter) return;
		const nextPage = pageIdx + delta;
		if (nextPage >= 0 && nextPage < totalPages) { pageIdx = nextPage; return; }
		if (delta > 0 && chapterIdx + 1 < TOME_SSG_CHAPTERS.length) { chapterIdx += 1; pageIdx = 0; }
		else if (delta < 0 && chapterIdx > 0) { chapterIdx -= 1; pageIdx = Math.max(0, TOME_SSG_CHAPTERS[chapterIdx].pages.length - 1); }
	}

	function handleBookKey(e: KeyboardEvent): void {
		if (!open) return;
		if (e.key === 'ArrowRight') { e.preventDefault(); stepFolio(1); }
		else if (e.key === 'ArrowLeft') { e.preventDefault(); stepFolio(-1); }
	}
</script>

<svelte:window onkeydown={handleBookKey} />

<UiModalShell
	{open}
	sizeTier="WIDE"
	title={STUDIO_UI_COPY.tomeTitle}
	subtitle={activeChapter ? `Chapter ${activeChapter.number} of ${TOME_SSG_CHAPTERS.length} · ${activeChapter.title}` : ''}
	icon="book"
	{cornerMode}
	{isLocked}
	{remainingSeconds}
	{progressRatio}
	{onClose}
>
	<div class="grid min-h-[26rem] grid-cols-1 gap-0 border lg:grid-cols-[18rem_1fr]" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-100);" data-testid="tome-dual-book" use:uiSwipeDeck={{ onStep: stepFolio }}>
		<aside class="flex flex-col justify-between gap-3 border-b p-4 lg:border-r lg:border-b-0" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-200); box-shadow: inset -12px 0 18px -14px rgba(0,0,0,0.45);">
			<div class="flex flex-col gap-2">
				<div class="ui-font-mono flex items-center justify-between text-[0.65rem] uppercase tracking-wider" style="color: var(--ui-muted-content);">
					<span>Table of Contents</span>
					<span>Ch {chapterIdx + 1}/{TOME_SSG_CHAPTERS.length}</span>
				</div>
				<nav class="flex flex-col gap-1" aria-label="Field Tome Chapters">
					{#each TOME_SSG_CHAPTERS as ch, idx (ch.id)}
						<UiChamferButton
							{cornerMode}
							label={`${idx + 1}. ${ch.title.replace(/^Chapter\s+\d+:\s*/i, '')}`}
							active={idx === chapterIdx}
							variant={idx === chapterIdx ? 'primary' : 'ghost'}
							onclick={() => selectChapter(idx)}
							className="w-full justify-start py-1 text-left text-[0.7rem]"
						/>
					{/each}
				</nav>
			</div>

			{#if activeChapter}
				<UiChamferFrame {cornerMode} carets={false} className="flex flex-col gap-2 p-3">
					<span class="ui-font-mono text-[0.62rem] uppercase tracking-wider" style="color: var(--ui-primary);">{activeChapter.keyFormula.label}</span>
					<UiMathFormula lhs={activeChapter.keyFormula.lhs} operator={activeChapter.keyFormula.operator} rhs={activeChapter.keyFormula.rhs} />
					<p class="text-[0.7rem] leading-relaxed" style="color: var(--ui-muted-content);">{activeChapter.summary}</p>
				</UiChamferFrame>
			{/if}
		</aside>

		<article class="flex flex-col justify-between gap-4 p-5" style="box-shadow: inset 12px 0 18px -14px rgba(0,0,0,0.35);">
			{#if activeChapter && activePage}
				<div class="flex flex-col gap-3">
					<div class="flex items-baseline justify-between gap-2 border-b pb-2" style="border-color: var(--ui-border-subtle);">
						<h2 class="ui-font-display text-base font-bold tracking-wide" style="color: var(--ui-base-content);">{activeChapter.title}</h2>
						<span class="ui-font-mono shrink-0 text-[0.65rem]" style="color: var(--ui-muted-content);">Folio {pageIdx + 1} / {totalPages}</span>
					</div>
					<FieldTomeFolio blocks={activePage.blocks} />
				</div>

				<div class="flex items-center justify-between gap-2 border-t pt-3" style="border-color: var(--ui-border-subtle);">
					<UiChamferButton {cornerMode} icon="chevron-left" label={STUDIO_UI_COPY.tomePrevLabel} variant="surface" disabled={chapterIdx === 0 && pageIdx === 0} onclick={() => stepFolio(-1)} testId="tome-prev-btn" className="py-1 text-xs" />
					<span class="ui-font-mono text-[0.68rem]" style="color: var(--ui-muted-content);" data-testid="tome-folio-counter">
						Folio {pageIdx + 1} / {totalPages} · Chapter {activeChapter.number}
					</span>
					<UiChamferButton {cornerMode} icon="chevron-right" label={STUDIO_UI_COPY.tomeNextLabel} variant="secondary" disabled={chapterIdx === TOME_SSG_CHAPTERS.length - 1 && pageIdx === totalPages - 1} onclick={() => stepFolio(1)} testId="tome-next-btn" className="py-1 text-xs" />
				</div>
			{/if}
		</article>
	</div>
	{#snippet footer()}
		<UiModalFooter>
			<UiChamferButton {cornerMode} label={STUDIO_UI_COPY.tomeCloseLabel} variant="primary" disabled={isLocked} onclick={onClose} />
		</UiModalFooter>
	{/snippet}
</UiModalShell>

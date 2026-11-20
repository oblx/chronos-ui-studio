<script lang="ts">
	import { UiAccordionSection, UiChamferButton, UiModalFooter, UiModalShell, UiSubTabBar, type CornerKind, type SubTabItem } from '@chronos-ui/svelte';
	import { TOME_SSG_CHAPTERS } from '../../config';

	interface Props {
		open: boolean;
		topic: string;
		cornerMode: CornerKind;
		isLocked: boolean;
		remainingSeconds: number;
		progressRatio: number;
		onClose: () => void;
		onOpenTimedDemo: () => void;
	}

	let {
		open,
		topic,
		cornerMode,
		isLocked,
		remainingSeconds,
		progressRatio,
		onClose,
		onOpenTimedDemo
	}: Props = $props();

	let selectedId = $state(TOME_SSG_CHAPTERS[0]?.id ?? '01_architecture');

	$effect(() => {
		const match = TOME_SSG_CHAPTERS.find((c) => c.contextTopic === topic);
		if (match) selectedId = match.id;
	});

	let tabs = $derived<readonly SubTabItem[]>(
		TOME_SSG_CHAPTERS.map((c, idx) => ({ id: c.id, label: `Ch ${idx + 1}`, tip: c.title }))
	);
	let activeChapter = $derived(TOME_SSG_CHAPTERS.find((c) => c.id === selectedId) ?? TOME_SSG_CHAPTERS[0]);
</script>

<UiModalShell
	{open}
	sizeTier="STANDARD"
	title="Field Tome — Static SSG Handbook"
	subtitle={activeChapter?.title}
	icon="book"
	{cornerMode}
	{isLocked}
	{remainingSeconds}
	{progressRatio}
	{onClose}
>
	<div class="flex flex-col gap-3">
		<UiSubTabBar items={tabs} activeId={selectedId} {cornerMode} onSelect={(id) => (selectedId = id)} />
		{#if activeChapter}
			<p class="text-xs leading-relaxed" style="color: var(--ui-muted-content);">{activeChapter.summary}</p>
			{#each activeChapter.sections as sec, idx (sec.heading)}
				<UiAccordionSection title={sec.heading} open={idx === 0}>
					<div class="flex flex-col gap-2">
						{#each sec.paragraphs as p, pi (pi)}
							<p class="text-xs leading-relaxed" style="color: var(--ui-base-content);">{p}</p>
						{/each}
					</div>
				</UiAccordionSection>
			{/each}
		{/if}
	</div>
	{#snippet footer()}
		<UiModalFooter>
			<UiChamferButton {cornerMode} label="Test 3s Zero-CLS Lock" onclick={onOpenTimedDemo} />
			<UiChamferButton {cornerMode} label="Close" variant="primary" disabled={isLocked} onclick={onClose} />
		</UiModalFooter>
	{/snippet}
</UiModalShell>

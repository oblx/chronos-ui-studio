<script lang="ts">
	import {
		UiBadge, UiChamferButton, UiChamferFrame, UiInput, UiModalFooter, UiModalShell,
		type CornerKind, type CursorPackDefinition, type IntentKind,
		type RegisteredUiEntity, type ThemePack, type UiProjectDefinition
	} from '@chronos-ui/svelte';
	import type { StudioModalId } from '@studio/client/state';
	import { buildGlobalSearchItems, SEARCH_CATEGORIES, type SearchCategory, type SearchItem } from './search.catalog';

	interface Props {
		open: boolean;
		cornerMode: CornerKind;
		entities: readonly RegisteredUiEntity[];
		projects: readonly UiProjectDefinition[];
		activeProjectId: string;
		themes: readonly ThemePack[];
		cursorPacks: readonly CursorPackDefinition[];
		shortcutOverrides?: Readonly<Record<string, string>>;
		onOpenModal: (id: StudioModalId) => void;
		onInspectEntity: (uuid: string) => void;
		onSelectProject: (id: string) => void;
		onLoadSample: (sampleId: string) => void;
		onSelectTheme: (themeId: string) => void;
		onApplyCursorPack: (packId: string) => void;
		onOpenTomeTopic: (topic: string) => void;
		onDispatchIntent: (kind: IntentKind, payload: Record<string, unknown>) => void;
		onStartSpotlight: () => void;
		onReplayHudSequence: () => void;
		onSaveWorkspace: () => void;
		onClose: () => void;
	}

	let p: Props = $props();

	let query = $state('');
	let category = $state<SearchCategory>('ALL');
	let activeIndex = $state(0);
	let rootEl = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (!p.open) return;
		const timer = requestAnimationFrame(() => {
			rootEl?.querySelector<HTMLInputElement>('input')?.focus();
		});
		return () => cancelAnimationFrame(timer);
	});

	let allItems = $derived(buildGlobalSearchItems(p));

	let filteredItems = $derived.by<readonly SearchItem[]>(() => {
		const q = query.trim().toLowerCase();
		return allItems.filter((item) => {
			if (category !== 'ALL' && item.category !== category) return false;
			if (!q) return true;
			return item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q) || item.badge.toLowerCase().includes(q);
		}).slice(0, 24);
	});

	function handleKeyDown(e: KeyboardEvent): void {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIndex = filteredItems.length > 0 ? (activeIndex + 1) % filteredItems.length : 0;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIndex = filteredItems.length > 0 ? (activeIndex - 1 + filteredItems.length) % filteredItems.length : 0;
		} else if (e.key === 'Enter' && filteredItems[activeIndex]) {
			e.preventDefault();
			filteredItems[activeIndex].run();
		}
	}
</script>

<UiModalShell open={p.open} sizeTier="WIDE" title="Global Search & Command Palette" subtitle="Instant search across painted entities, Studio actions, MCP tools, samples, Field Tome chapters, themes, and shortcuts" icon="search" cornerMode={p.cornerMode} onClose={p.onClose}>
	<div bind:this={rootEl} role="presentation" onkeydown={handleKeyDown} class="flex flex-col gap-3" data-testid="global-search-modal">
		<div data-testid="global-search-input-wrap">
			<UiInput
				bind:value={query}
				cornerMode={p.cornerMode}
				type="search"
				label="Global Search Query"
				placeholder="Search painted entities, Studio actions, MCP tools, samples, Tome chapters, themes, or shortcuts..."
				oninput={() => { activeIndex = 0; }}
			/>
		</div>
		<div class="flex flex-wrap items-center gap-1" data-testid="global-search-categories">
			{#each SEARCH_CATEGORIES as cat (cat.id)}
				<UiChamferButton
					cornerMode={p.cornerMode}
					label={cat.label}
					active={category === cat.id}
					variant={category === cat.id ? 'primary' : 'surface'}
					testId={`global-search-cat-${cat.id}`}
					onclick={() => { category = cat.id; activeIndex = 0; }}
					className="px-2 py-0.5 text-xs"
				/>
			{/each}
		</div>
		<div class="ui-scroll-thin flex max-h-80 flex-col gap-1.5 overflow-y-auto pr-1" role="listbox" aria-label="Search Results" data-testid="global-search-results">
			{#each filteredItems as item, idx (item.id)}
				{@const isSelected = idx === activeIndex}
				<UiChamferFrame cornerMode={p.cornerMode} className="px-2.5 py-1.5">
					<button
						type="button"
						role="option"
						aria-selected={isSelected}
						data-selected={isSelected ? 'true' : 'false'}
						data-testid={`global-search-item-${item.id}`}
						onclick={() => item.run()}
						onmouseenter={() => { activeIndex = idx; }}
						class="ui-ctl flex w-full items-center justify-between gap-3 text-left text-xs"
						style="color: var(--ui-base-content);"
					>
						<div class="min-w-0 flex-1">
							<div class="truncate font-semibold" style="color: {isSelected ? 'var(--ui-accent-vivid, var(--ui-primary))' : 'var(--ui-base-content)'};">{item.title}</div>
							<div class="truncate text-[0.68rem]" style="color: var(--ui-muted-content);">{item.subtitle}</div>
						</div>
						<div class="flex shrink-0 items-center gap-1.5">
							<UiBadge cornerMode={p.cornerMode} text={item.badge} tone={isSelected ? 'primary' : 'neutral'} />
						</div>
					</button>
				</UiChamferFrame>
			{:else}
				<div class="py-6 text-center text-xs" style="color: var(--ui-muted-content);" data-testid="global-search-empty">
					No matching entities, commands, chapters, or themes found for "{query}".
				</div>
			{/each}
		</div>
	</div>
	{#snippet footer()}
		<UiModalFooter>
			<div class="flex w-full items-center justify-between gap-2 text-xs" style="color: var(--ui-muted-content);">
				<span class="ui-font-mono">Up/Down: Navigate · Enter: Execute · Esc: Dismiss</span>
				<UiChamferButton cornerMode={p.cornerMode} label="Close" variant="ghost" onclick={p.onClose} />
			</div>
		</UiModalFooter>
	{/snippet}
</UiModalShell>

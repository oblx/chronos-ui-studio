<script lang="ts">
	import {
		UiBadge,
		UiChamferButton,
		validateThemePackContrast,
		type CornerKind,
		type ThemePack
	} from '@chronos-ui/svelte';

	interface Props {
		themes: readonly (ThemePack & { readonly starred?: boolean })[];
		activeThemeId: string;
		cornerMode: CornerKind;
		onSelectTheme: (id: string) => void;
		onToggleStar: (id: string) => void;
		onPublishTheme: (pack: ThemePack) => void;
	}

	let {
		themes,
		activeThemeId,
		cornerMode,
		onSelectTheme,
		onToggleStar,
		onPublishTheme
	}: Props = $props();

	let filter = $state<'all' | 'dark' | 'light' | 'starred'>('all');
	let customName = $state('');

	let activePack = $derived(themes.find((t) => t.id === activeThemeId) ?? themes[0]);
	let wcagChecks = $derived(activePack ? validateThemePackContrast(activePack) : []);
	let filtered = $derived(
		themes.filter((t) => {
			if (filter === 'dark') return t.polarity === 'dark';
			if (filter === 'light') return t.polarity === 'light';
			if (filter === 'starred') return Boolean(t.starred);
			return true;
		})
	);

	function cloneActiveAsCustom(): void {
		const name = customName.trim();
		if (!name || !activePack) return;
		onPublishTheme({
			id: `theme-${Date.now().toString(36)}`,
			name,
			polarity: activePack.polarity,
			tokens: { ...activePack.tokens }
		});
		customName = '';
	}
</script>

<div class="flex flex-col gap-3">
	<div class="flex flex-wrap gap-1">
		<UiChamferButton {cornerMode} label="All" active={filter === 'all'} onclick={() => (filter = 'all')} />
		<UiChamferButton {cornerMode} label="Dark" active={filter === 'dark'} onclick={() => (filter = 'dark')} />
		<UiChamferButton {cornerMode} label="Light" active={filter === 'light'} onclick={() => (filter = 'light')} />
		<UiChamferButton {cornerMode} label="Starred" active={filter === 'starred'} onclick={() => (filter = 'starred')} />
	</div>

	<div class="flex flex-col gap-1.5">
		{#each filtered as pack (pack.id)}
			<div
				class="flex items-center justify-between gap-2 p-2"
				style="
					background-color: var(--ui-base-100);
					border: var(--ui-hairline) solid {pack.id === activeThemeId ? 'var(--ui-primary)' : 'var(--ui-border-subtle)'};
				"
			>
				<button type="button" onclick={() => onSelectTheme(pack.id)} class="flex min-w-0 flex-1 items-center gap-2 text-left">
					<span class="h-3.5 w-3.5 shrink-0" style="background-color: {pack.tokens['--ui-primary']}; border: var(--ui-hairline) solid var(--ui-border-subtle);"></span>
					<span class="truncate text-xs font-semibold" style="color: var(--ui-base-content);">{pack.name}</span>
				</button>
				<UiBadge text={pack.polarity.toUpperCase()} tone={pack.polarity === 'dark' ? 'info' : 'warning'} />
				<UiChamferButton
					{cornerMode}
					icon="star"
					tip="Toggle favorite theme"
					active={Boolean(pack.starred)}
					onclick={() => onToggleStar(pack.id)}
					className="px-2"
				/>
			</div>
		{/each}
	</div>

	<div class="flex flex-col gap-1.5 p-2" style="background-color: var(--ui-base-100); border: var(--ui-hairline) solid var(--ui-border-subtle);">
		<span class="text-xs font-semibold" style="color: var(--ui-muted-content);">WCAG Contrast Audit</span>
		{#each wcagChecks as chk (chk.pair)}
			<div class="flex items-center justify-between gap-2 text-xs">
				<span class="truncate" style="color: var(--ui-base-content);">{chk.pair}</span>
				<UiBadge text={`${chk.ratio}:1 ${chk.grade}`} tone={chk.passAa ? 'success' : 'error'} />
			</div>
		{/each}
	</div>

	<div class="flex items-center gap-1.5">
		<input
			type="text"
			bind:value={customName}
			placeholder="New theme variant name..."
			aria-label="New theme variant name"
			class="min-w-0 flex-1 px-2 py-1 text-xs"
			style="background-color: var(--ui-base-100); color: var(--ui-base-content); border: var(--ui-hairline) solid var(--ui-border-subtle);"
		/>
		<UiChamferButton {cornerMode} icon="plus" label="Save" variant="primary" onclick={cloneActiveAsCustom} />
	</div>
</div>

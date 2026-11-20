<script lang="ts">
	import {
		CSS_CURSOR_STATES, CURSOR_LIMITS, THEME_PACKS, UiChamferButton, UiHorizontalDeck, UiInput, UiModalFooter, UiModalShell,
		type CornerKind, type CssCursorState, type CursorPackDefinition
	} from '@chronos-ui/svelte';
	import { readPngFileAsDataUrl } from '@studio/client/state';
	import CursorHotspotPad from './CursorHotspotPad.svelte';

	interface Props {
		open: boolean;
		cornerMode: CornerKind;
		packs: readonly CursorPackDefinition[];
		activePackId: string | null;
		onApplyPack: (packId: string) => void;
		onResetPack: () => void;
		onCreatePack: (payload: { name: string; sourcePngDataUrl?: string; forkFromUuid?: string }) => Promise<CursorPackDefinition | null>;
		onDeriveStates: (uuid: string, accentColor?: string) => Promise<CursorPackDefinition | null>;
		onUpdateHotspot: (uuid: string, cssState: CssCursorState, hotspotX: number, hotspotY: number) => Promise<void>;
		onClose: () => void;
	}

	let {
		open, cornerMode, packs, activePackId, onApplyPack, onResetPack,
		onCreatePack, onDeriveStates, onUpdateHotspot, onClose
	}: Props = $props();

	let customName = $state('Neon Pointer');
	let accentColor = $state<string>(THEME_PACKS[0].tokens['--ui-accent-vivid']);
	let uploadError = $state('');
	let busy = $state(false);
	let selectedState = $state<CssCursorState>('default');
	let inspectedPack = $derived(packs.find((p) => p.uuid === activePackId || p.slug === activePackId) ?? packs[0]);
	let activeAsset = $derived(inspectedPack?.states[selectedState]);

	async function handlePngUpload(e: Event): Promise<void> {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		uploadError = '';
		if (file.size > CURSOR_LIMITS.maxBytes) { uploadError = `PNG exceeds ${CURSOR_LIMITS.maxKb} KB limit.`; return; }
		busy = true;
		try {
			const dataUrl = await readPngFileAsDataUrl(file);
			await onCreatePack({ name: customName.trim() || file.name.replace(/\.png$/i, ''), sourcePngDataUrl: dataUrl });
		} catch (err) {
			uploadError = err instanceof Error ? err.message : 'Upload failed';
		} finally {
			busy = false;
			input.value = '';
		}
	}

	async function handleDeriveAll(): Promise<void> {
		if (!inspectedPack) return;
		busy = true;
		try {
			const targetId = inspectedPack.isBuiltin
				? (await onCreatePack({ name: `${inspectedPack.name} Derived`, forkFromUuid: inspectedPack.uuid }))?.uuid
				: inspectedPack.uuid;
			if (targetId) await onDeriveStates(targetId, accentColor);
		} finally {
			busy = false;
		}
	}
</script>

<UiModalShell {open} sizeTier="WIDE" title={`Cursor Studio — ${CSS_CURSOR_STATES.length}-State AI Pointer Synthesizer`} subtitle={inspectedPack ? `Inspecting ${inspectedPack.name}` : 'OS Default'} icon="cursor" {cornerMode} {onClose}>
	<div class="flex flex-col gap-3 text-xs" data-testid="cursor-studio-modal">
		<UiHorizontalDeck {cornerMode} label="Cursor packs deck">
			<UiChamferButton {cornerMode} label="OS Default" active={activePackId === null} variant={activePackId === null ? 'primary' : 'surface'} onclick={onResetPack} testId="cursor-reset-os-btn" />
			{#each packs as pack (pack.uuid)}
				<UiChamferButton {cornerMode} label={pack.name} active={activePackId === pack.uuid || activePackId === pack.slug}
					variant={activePackId === pack.uuid || activePackId === pack.slug ? 'primary' : 'surface'}
					onclick={() => onApplyPack(pack.uuid)} testId={`cursor-pack-${pack.slug}`} />
			{/each}
		</UiHorizontalDeck>

		<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
			<div class="flex flex-col gap-2 border p-2.5" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-100);">
				<span class="font-semibold" style="color: var(--ui-muted-content);">Upload Base Pointer PNG (&lt;= {CURSOR_LIMITS.maxKb} KB)</span>
				<UiInput {cornerMode} bind:value={customName} label="Custom pack name" placeholder="Custom cursor pack name" />
				<label class="flex cursor-pointer items-center justify-between gap-2 border px-2 py-1.5" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-200);">
					<span>Choose PNG sprite</span>
					<input type="file" accept="image/png" disabled={busy} onchange={handlePngUpload} data-testid="cursor-png-upload" class="max-w-44 text-[0.65rem]" />
				</label>
				{#if uploadError}<span class="text-[0.68rem]" style="color: var(--ui-error);">{uploadError}</span>{/if}
				{#if inspectedPack && activeAsset}
					<CursorHotspotPad cssState={selectedState} assetUrl={activeAsset.assetDataUrl} hotspotX={activeAsset.hotspotX} hotspotY={activeAsset.hotspotY} {cornerMode}
						onSetHotspot={(x, y) => { if (!inspectedPack.isBuiltin) void onUpdateHotspot(inspectedPack.uuid, selectedState, x, y); }} />
				{/if}
			</div>

			<div class="flex flex-col gap-2 border p-2.5" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-100);">
				<div class="flex items-center justify-between gap-2">
					<span class="font-semibold" style="color: var(--ui-muted-content);">{CSS_CURSOR_STATES.length}-State Live Hover Sandbox</span>
					<UiChamferButton {cornerMode} icon="cursor" label={busy ? 'Deriving...' : `Derive All ${CSS_CURSOR_STATES.length - 1} States`} variant="secondary" disabled={busy || !inspectedPack}
						onclick={handleDeriveAll} testId="derive-cursor-states-btn" className="py-0.5 text-[0.68rem]" />
				</div>
				<div class="grid grid-cols-3 gap-1.5 sm:grid-cols-4" data-testid="cursor-hover-sandbox">
					{#each CSS_CURSOR_STATES as st (st)}
						<button type="button" data-ui-cursor={st} data-testid={`cursor-state-${st}`} onclick={() => { selectedState = st; }}
							class="ui-font-mono flex items-center gap-1 border px-1.5 py-1 text-left text-[0.62rem]"
							style={`border-color: ${selectedState === st ? 'var(--ui-accent-vivid, var(--ui-primary))' : 'var(--ui-border-subtle)'}; background-color: var(--ui-base-200);`}>
							{#if inspectedPack?.states[st]?.assetDataUrl}
								<img src={inspectedPack.states[st].assetDataUrl} alt="" class="h-3.5 w-3.5 shrink-0" />
							{/if}
							<span class="truncate">{st}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
	{#snippet footer()}
		<UiModalFooter><UiChamferButton {cornerMode} label="Done" variant="primary" onclick={onClose} /></UiModalFooter>
	{/snippet}
</UiModalShell>

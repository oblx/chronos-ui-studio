<script lang="ts">
	import {
		UiChamferButton, UiHorizontalDeck, UiModalFooter, UiModalShell,
		type CornerKind, type UiProjectDefinition
	} from '@chronos-ui/svelte';
	import { emitProjectCssTokens } from '@studio/plugins/adapters/css.adapter';
	import { emitProjectJsonBundle } from '@studio/plugins/adapters/json.adapter';
	import { emitProjectSvelteScaffold } from '@studio/plugins/adapters/svelte.adapter';
	import { apiRunPipelineExport } from '../state';

	interface Props {
		open: boolean;
		project: UiProjectDefinition;
		cornerMode: CornerKind;
		onCopied: () => void;
		onClose: () => void;
	}

	let { open, project, cornerMode, onCopied, onClose }: Props = $props();
	type AdapterTab = 'svelte-scaffold' | 'css-tokens' | 'json-blueprint' | 'static-site-build' | 'zip-bundle';
	let adapter = $state<AdapterTab>('svelte-scaffold');
	let building = $state(false);
	let buildStatus = $state('');
	let buildFiles = $state<readonly string[]>([]);

	let preview = $derived.by(() => {
		if (adapter === 'css-tokens') return emitProjectCssTokens(project);
		if (adapter === 'json-blueprint') return emitProjectJsonBundle(project);
		return emitProjectSvelteScaffold(project);
	});

	async function copyPreview(): Promise<void> {
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			await navigator.clipboard.writeText(preview.content);
			onCopied();
		}
	}

	async function runServerExport(target: 'static-site-build' | 'zip-bundle'): Promise<void> {
		building = true;
		buildStatus = target === 'static-site-build' ? 'Compiling standalone Vite static bundle...' : 'Packing PKZIP scaffold...';
		buildFiles = [];
		try {
			const res = await apiRunPipelineExport(project.id, target);
			if (res.error) { buildStatus = `Failed: ${res.error}`; return; }
			if (res.build) {
				buildStatus = `Verified static build ready (${res.build.files.length} files | SHA-256 ${res.build.checksum.slice(0, 12)})`;
				buildFiles = res.build.files;
			} else if (res.entries) {
				buildStatus = `Packed ${res.filename ?? 'bundle.zip'} (${res.byteLength ?? 0} bytes)`;
				buildFiles = res.entries;
			}
		} finally {
			building = false;
		}
	}
</script>

<UiModalShell {open} sizeTier="WIDE" title="Export & Verified Static Build" subtitle={project.name} icon="export" {cornerMode} {onClose}>
	<div class="flex flex-col gap-3">
		<UiHorizontalDeck {cornerMode}>
			<UiChamferButton {cornerMode} label="Svelte 5" active={adapter === 'svelte-scaffold'} variant={adapter === 'svelte-scaffold' ? 'primary' : 'surface'} onclick={() => { adapter = 'svelte-scaffold'; }} />
			<UiChamferButton {cornerMode} label="CSS Tokens" active={adapter === 'css-tokens'} variant={adapter === 'css-tokens' ? 'primary' : 'surface'} onclick={() => { adapter = 'css-tokens'; }} />
			<UiChamferButton {cornerMode} label="JSON Project" active={adapter === 'json-blueprint'} variant={adapter === 'json-blueprint' ? 'primary' : 'surface'} onclick={() => { adapter = 'json-blueprint'; }} />
			<UiChamferButton {cornerMode} label="Static Vite Build" active={adapter === 'static-site-build'} variant={adapter === 'static-site-build' ? 'primary' : 'surface'} onclick={() => { adapter = 'static-site-build'; }} />
			<UiChamferButton {cornerMode} label="ZIP Bundle" active={adapter === 'zip-bundle'} variant={adapter === 'zip-bundle' ? 'primary' : 'surface'} onclick={() => { adapter = 'zip-bundle'; }} />
		</UiHorizontalDeck>

		{#if adapter === 'static-site-build' || adapter === 'zip-bundle'}
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
				<div class="flex flex-col gap-2 p-3 text-xs" style="background-color: var(--ui-base-100); border: var(--ui-hairline) solid var(--ui-border-subtle);">
					<span class="font-semibold">{adapter === 'static-site-build' ? 'Standalone Vite Production Bundle' : 'Zero-Dep PKZIP Project Archive'}</span>
					<p style="color: var(--ui-muted-content);">
						Emits tree-shaken assets, runtime.config.schema.json, and .env.example with zero leaked vault secrets.
					</p>
					<UiChamferButton {cornerMode} label={building ? 'Building...' : 'Run Pipeline Build'} variant="primary" disabled={building} onclick={() => void runServerExport(adapter === 'static-site-build' ? 'static-site-build' : 'zip-bundle')} />
					{#if buildStatus}<span class="ui-font-mono text-[0.7rem]" style="color: var(--ui-primary);">{buildStatus}</span>{/if}
				</div>
				<div class="ui-scroll-deck ui-font-mono max-h-44 overflow-auto p-3 text-[0.7rem]" style="background-color: var(--ui-base-100); border: var(--ui-hairline) solid var(--ui-border-subtle);">
					{#if buildFiles.length === 0}
						<span style="color: var(--ui-muted-content);">Trigger a pipeline run to inspect emitted artifacts.</span>
					{:else}
						{#each buildFiles as f (f)}<div>{f}</div>{/each}
					{/if}
				</div>
			</div>
		{:else}
			<pre class="ui-scroll-deck ui-font-mono max-h-60 overflow-auto p-3 text-xs leading-relaxed"
				style="background-color: var(--ui-base-100); color: var(--ui-base-content); border: var(--ui-hairline) solid var(--ui-border-subtle);">{preview.content}</pre>
		{/if}
	</div>
	{#snippet footer()}
		<UiModalFooter>
			{#if adapter !== 'static-site-build' && adapter !== 'zip-bundle'}
				<UiChamferButton {cornerMode} icon="copy" label="Copy Output" variant="primary" onclick={copyPreview} />
			{/if}
			<UiChamferButton {cornerMode} label="Close" onclick={onClose} />
		</UiModalFooter>
	{/snippet}
</UiModalShell>

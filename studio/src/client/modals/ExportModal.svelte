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
	type AdapterTab = 'svelte-scaffold' | 'css-tokens' | 'json-blueprint' | 'static-site-build' | 'fullstack-bundle' | 'zip-bundle';
	let adapter = $state<AdapterTab>('svelte-scaffold');
	let building = $state(false);
	let buildStatus = $state('');
	let buildFiles = $state<readonly string[]>([]);

	let preview = $derived.by(() => {
		if (adapter === 'css-tokens') return emitProjectCssTokens(project);
		if (adapter === 'json-blueprint') return emitProjectJsonBundle(project);
		return emitProjectSvelteScaffold(project);
	});
	let isPipelineTab = $derived(adapter === 'static-site-build' || adapter === 'fullstack-bundle' || adapter === 'zip-bundle');

	async function copyPreview(): Promise<void> {
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			await navigator.clipboard.writeText(preview.content);
			onCopied();
		}
	}

	async function runServerExport(target: 'static-site-build' | 'fullstack-bundle' | 'zip-bundle'): Promise<void> {
		building = true;
		buildStatus = target === 'fullstack-bundle' ? 'Compiling vendored SQLite + Drizzle backend + client...' : target === 'static-site-build' ? 'Compiling standalone W3C/WebMCP static bundle...' : 'Packing PKZIP scaffold...';
		buildFiles = [];
		try {
			const res = await apiRunPipelineExport(project.id, target);
			if (res.error) { buildStatus = `Failed: ${res.error}`; return; }
			if (res.bundle) {
				buildStatus = `Full-Stack Bundle ready (${res.bundle.files.length} files · ${res.bundle.migrationCount} SQL migration · SHA-256 ${res.bundle.checksum.slice(0, 12)})`;
				buildFiles = res.bundle.files;
			} else if (res.build) {
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

<UiModalShell {open} sizeTier="WIDE" title="Export, Static WebMCP & Full-Stack Bundle" subtitle={project.name} icon="export" {cornerMode} {onClose}>
	<div class="flex flex-col gap-3">
		<UiHorizontalDeck {cornerMode}>
			<UiChamferButton {cornerMode} label="Svelte 5" active={adapter === 'svelte-scaffold'} variant={adapter === 'svelte-scaffold' ? 'primary' : 'surface'} onclick={() => { adapter = 'svelte-scaffold'; }} />
			<UiChamferButton {cornerMode} label="CSS Tokens" active={adapter === 'css-tokens'} variant={adapter === 'css-tokens' ? 'primary' : 'surface'} onclick={() => { adapter = 'css-tokens'; }} />
			<UiChamferButton {cornerMode} label="JSON Project" active={adapter === 'json-blueprint'} variant={adapter === 'json-blueprint' ? 'primary' : 'surface'} onclick={() => { adapter = 'json-blueprint'; }} />
			<UiChamferButton {cornerMode} label="Static WebMCP" active={adapter === 'static-site-build'} variant={adapter === 'static-site-build' ? 'primary' : 'surface'} onclick={() => { adapter = 'static-site-build'; }} />
			<UiChamferButton {cornerMode} label="Full-Stack Bundle" testId="export-tab-fullstack" active={adapter === 'fullstack-bundle'} variant={adapter === 'fullstack-bundle' ? 'primary' : 'surface'} onclick={() => { adapter = 'fullstack-bundle'; }} />
			<UiChamferButton {cornerMode} label="ZIP Bundle" active={adapter === 'zip-bundle'} variant={adapter === 'zip-bundle' ? 'primary' : 'surface'} onclick={() => { adapter = 'zip-bundle'; }} />
		</UiHorizontalDeck>

		{#if isPipelineTab}
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
				<div class="flex flex-col gap-2 p-3 text-xs" style="background-color: var(--ui-base-100); border: var(--ui-hairline) solid var(--ui-border-subtle);">
					<span class="font-semibold">
						{adapter === 'fullstack-bundle' ? 'Minimal Vendored Backend (SQLite + Drizzle + Client)' : adapter === 'static-site-build' ? 'W3C / Lighthouse / WebMCP Static Build' : 'Zero-Dep PKZIP Project Archive'}
					</span>
					<p style="color: var(--ui-muted-content);">
						{adapter === 'fullstack-bundle'
							? 'Emits standalone package.json, drizzle/0000_init.sql, server/{db,schema,migrate,router,index}.ts, and client/ static assets with zero Studio imports.'
							: 'Emits tree-shaken assets, llms.txt, .well-known/webmcp.json, robots.txt, manifest.webmanifest, and .env.example with zero leaked secrets.'}
					</p>
					<UiChamferButton {cornerMode} label={building ? 'Building...' : 'Run Pipeline Build'} testId="run-pipeline-build-btn" variant="primary" disabled={building} onclick={() => void runServerExport(adapter as 'static-site-build' | 'fullstack-bundle' | 'zip-bundle')} />
					{#if buildStatus}<span class="ui-font-mono text-[0.7rem]" style="color: var(--ui-primary);" data-testid="export-build-status">{buildStatus}</span>{/if}
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
			{#if !isPipelineTab}
				<UiChamferButton {cornerMode} icon="copy" label="Copy Output" variant="primary" onclick={copyPreview} />
			{/if}
			<UiChamferButton {cornerMode} label="Close" onclick={onClose} />
		</UiModalFooter>
	{/snippet}
</UiModalShell>


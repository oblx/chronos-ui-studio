import type { UiProjectDefinition } from '@chronos-ui/svelte';
import { registerOutputAdapter } from '../registry';
import { packZipFiles } from '../zip.codec';
import { emitProjectCssTokens } from './css.adapter';
import { buildRuntimeConfigSchema, emitProjectJsonBundle } from './json.adapter';
import { emitProjectSvelteScaffold } from './svelte.adapter';

export interface ProjectBinaryArtifact {
	readonly adapterId: 'zip-bundle';
	readonly filename: string;
	readonly mimeType: string;
	readonly bytes: Uint8Array;
	readonly entries: readonly string[];
}

export function emitProjectZipBundle(project: UiProjectDefinition): ProjectBinaryArtifact {
	const enc = new TextEncoder();
	const svelte = emitProjectSvelteScaffold(project);
	const css = emitProjectCssTokens(project);
	const json = emitProjectJsonBundle(project);
	const runtime = buildRuntimeConfigSchema(project);
	const files = [
		{ path: 'project.json', content: enc.encode(json.content) },
		{ path: `src/${svelte.filename}`, content: enc.encode(svelte.content) },
		{ path: `src/${css.filename}`, content: enc.encode(css.content) },
		{ path: 'runtime.config.schema.json', content: enc.encode(runtime.schema) },
		{ path: '.env.example', content: enc.encode(runtime.envExample) }
	];
	return {
		adapterId: 'zip-bundle',
		filename: `${project.slug}.chronos-bundle.zip`,
		mimeType: 'application/zip',
		bytes: packZipFiles(files),
		entries: files.map((f) => f.path)
	};
}

registerOutputAdapter<UiProjectDefinition, ProjectBinaryArtifact>({
	id: 'zip-bundle',
	label: 'Downloadable PKZIP Project & Scaffold Bundle',
	mimeType: 'application/zip',
	emit: emitProjectZipBundle
});

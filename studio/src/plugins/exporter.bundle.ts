import { VERSION } from '@chronos-ui/svelte';
import type { UiBlueprint } from '../config';
import { generateCssTokenSheet, generateSvelteScaffold } from '../core';
import { registerOutputAdapter, runOutputAdapter } from './registry';

export type ExportFormat = 'json' | 'svelte' | 'css';

export interface ExportArtifact {
	readonly format: ExportFormat;
	readonly filename: string;
	readonly mimeType: string;
	readonly content: string;
}

function slugifyBlueprint(name: string): string {
	return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'blueprint';
}

registerOutputAdapter<UiBlueprint, ExportArtifact>({
	id: 'svelte',
	label: 'Svelte 5 Runes Scaffold',
	mimeType: 'text/plain; charset=utf-8',
	emit: (bp) => ({ format: 'svelte', filename: `${slugifyBlueprint(bp.name)}.chronos.svelte`, mimeType: 'text/plain; charset=utf-8', content: generateSvelteScaffold(bp) })
});

registerOutputAdapter<UiBlueprint, ExportArtifact>({
	id: 'css',
	label: 'Semantic CSS Token Sheet',
	mimeType: 'text/css; charset=utf-8',
	emit: (bp) => ({ format: 'css', filename: `${bp.themeId}.tokens.css`, mimeType: 'text/css; charset=utf-8', content: generateCssTokenSheet(bp.themeId) })
});

registerOutputAdapter<UiBlueprint, ExportArtifact>({
	id: 'json',
	label: 'Chronos Blueprint JSON',
	mimeType: 'application/json; charset=utf-8',
	emit: (bp) => ({
		format: 'json',
		filename: `${slugifyBlueprint(bp.name)}.blueprint.json`,
		mimeType: 'application/json; charset=utf-8',
		content: JSON.stringify({ package: '@chronos-ui/svelte', version: VERSION, blueprint: bp }, null, '\t')
	})
});

export function exportBlueprintArtifact(bp: UiBlueprint, format: ExportFormat): ExportArtifact {
	return runOutputAdapter<UiBlueprint, ExportArtifact>(format, bp);
}

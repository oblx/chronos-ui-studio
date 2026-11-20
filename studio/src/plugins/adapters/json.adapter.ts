import { VERSION, type UiProjectDefinition } from '@chronos-ui/svelte';
import { registerOutputAdapter } from '../registry';
import type { ProjectTextArtifact } from './svelte.adapter';

export function emitProjectJsonBundle(project: UiProjectDefinition): ProjectTextArtifact {
	return {
		adapterId: 'json-blueprint',
		filename: `${project.slug}.project.json`,
		mimeType: 'application/json; charset=utf-8',
		content: JSON.stringify({ package: '@chronos-ui/svelte', version: VERSION, project }, null, '\t')
	};
}

export function buildRuntimeConfigSchema(project: UiProjectDefinition): { schema: string; envExample: string } {
	const schema = JSON.stringify({
		$schema: 'https://json-schema.org/draft/2020-12/schema',
		title: `${project.name} Runtime Configuration`,
		type: 'object',
		properties: {
			protocol: { type: 'string', enum: ['https', 'http'], default: project.buildConfig.protocol },
			basePath: { type: 'string', default: project.buildConfig.basePath },
			apiEndpoint: { type: 'string', format: 'uri', default: project.buildConfig.apiEndpoint },
			secretRefs: { type: 'array', items: { type: 'string' }, default: project.buildConfig.secretRefs }
		}
	}, null, '\t');
	const envLines = [
		`# Runtime deployment config for ${project.name} (zero raw secrets baked into static JS)`,
		`APP_PROTOCOL=${project.buildConfig.protocol}`,
		`APP_BASE_PATH=${project.buildConfig.basePath}`,
		`APP_API_ENDPOINT=${project.buildConfig.apiEndpoint}`,
		...project.buildConfig.secretRefs.map((ref) => `${ref.toUpperCase().replace(/[^A-Z0-9_]/g, '_')}=`)
	];
	return { schema, envExample: `${envLines.join('\n')}\n` };
}

registerOutputAdapter<UiProjectDefinition, ProjectTextArtifact>({
	id: 'json-blueprint',
	label: 'Canonical Portable Project JSON',
	mimeType: 'application/json; charset=utf-8',
	emit: emitProjectJsonBundle
});

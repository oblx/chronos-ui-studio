import { registerInputConnector } from '../registry';
import { unpackZipFiles } from '../zip.codec';
import { parseJsonProjectInput, type ProjectImportResult } from './json.connector';

export function ingestZipArchive(bytes: Uint8Array): ProjectImportResult {
	try {
		const entries = unpackZipFiles(bytes);
		const projEntry = entries.find((e) => e.path.endsWith('project.json') || e.path.endsWith('blueprint.json'));
		if (!projEntry) return { ok: false, error: 'ZIP archive missing project.json.' };
		const rawJson = new TextDecoder().decode(projEntry.content);
		return parseJsonProjectInput(rawJson);
	} catch (err) {
		return { ok: false, error: err instanceof Error ? err.message : 'Failed to unpack ZIP archive.' };
	}
}

registerInputConnector<Uint8Array, ProjectImportResult>({
	id: 'zip-archive',
	label: 'PKZIP Project Archive Connector',
	accept: 'application/zip',
	ingest: ingestZipArchive
});

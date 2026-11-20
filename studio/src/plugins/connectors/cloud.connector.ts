import { assertSafeWebhookUrl } from '../../core';
import { registerInputConnector } from '../registry';
import { parseJsonProjectInput, type ProjectImportResult } from './json.connector';
import { ingestZipArchive } from './zip.connector';

export interface CloudRemoteInput {
	readonly url: string;
	readonly mockPayload?: string | Uint8Array;
}

export async function ingestCloudRemote(input: CloudRemoteInput): Promise<ProjectImportResult> {
	try {
		const parsed = assertSafeWebhookUrl(input.url.trim());
		if (input.mockPayload !== undefined) {
			return input.mockPayload instanceof Uint8Array
				? ingestZipArchive(input.mockPayload)
				: parseJsonProjectInput(input.mockPayload);
		}
		const res = await fetch(parsed.toString(), { signal: AbortSignal.timeout(6000) });
		if (!res.ok) return { ok: false, error: `Cloud remote responded HTTP ${res.status}.` };
		const ctype = res.headers.get('content-type') ?? '';
		if (ctype.includes('zip') || parsed.pathname.endsWith('.zip')) {
			return ingestZipArchive(new Uint8Array(await res.arrayBuffer()));
		}
		return parseJsonProjectInput(await res.text());
	} catch (err) {
		return { ok: false, error: err instanceof Error ? err.message : 'Cloud remote ingestion failed.' };
	}
}

registerInputConnector<CloudRemoteInput, Promise<ProjectImportResult>>({
	id: 'cloud-remote',
	label: 'S3 / Signed HTTPS / WebDAV Cloud Connector',
	accept: 'application/x-chronos-cloud-url',
	ingest: ingestCloudRemote
});

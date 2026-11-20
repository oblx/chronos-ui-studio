import type { UiProjectDefinition } from '@chronos-ui/svelte';
import { validateProjectDefinition } from '../../core';
import { registerInputConnector } from '../registry';

export type ProjectImportResult = { ok: true; project: UiProjectDefinition } | { ok: false; error: string };

export function parseJsonProjectInput(raw: string | Record<string, unknown>): ProjectImportResult {
	try {
		const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
		const candidate = (parsed && typeof parsed === 'object' && 'project' in parsed)
			? (parsed as { project: unknown }).project
			: parsed;
		return validateProjectDefinition(candidate);
	} catch {
		return { ok: false, error: 'Malformed JSON project payload.' };
	}
}

registerInputConnector<string | Record<string, unknown>, ProjectImportResult>({
	id: 'json-project',
	label: 'JSON UiProjectDefinition Connector',
	accept: 'application/json',
	ingest: parseJsonProjectInput
});

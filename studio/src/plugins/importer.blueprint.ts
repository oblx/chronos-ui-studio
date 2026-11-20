import type { UiBlueprint } from '../config';
import { validateBlueprint } from '../core';
import { registerInputConnector, runInputConnector } from './registry';

export type BlueprintImportResult = { ok: true; blueprint: UiBlueprint } | { ok: false; error: string };

registerInputConnector<unknown, BlueprintImportResult>({
	id: 'object-blueprint',
	label: 'Structured Blueprint Object Connector',
	accept: 'application/x-chronos-blueprint',
	ingest: (raw) => {
		const candidate = (raw && typeof raw === 'object' && 'blueprint' in raw)
			? (raw as { blueprint: unknown }).blueprint
			: raw;
		return validateBlueprint(candidate);
	}
});

registerInputConnector<string, BlueprintImportResult>({
	id: 'json-blueprint',
	label: 'JSON Blueprint Input Connector',
	accept: 'application/json',
	ingest: (rawJson) => {
		try {
			return runInputConnector<unknown, BlueprintImportResult>('object-blueprint', JSON.parse(rawJson));
		} catch {
			return { ok: false, error: 'Invalid JSON syntax.' };
		}
	}
});

export function importBlueprintJson(rawJson: string): BlueprintImportResult {
	return runInputConnector<string, BlueprintImportResult>('json-blueprint', rawJson);
}

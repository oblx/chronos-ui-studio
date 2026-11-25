import { describe, expect, test } from 'bun:test';
import { STARTER_BLUEPRINTS } from '../config';
import { executeStudioCommand, listStudioCommands } from '../client/state/studio.commands';
import { handleBuilderMcpRpc, handleTwinMcpRpc } from '../mcp';
import {
	exportBlueprintArtifact,
	importBlueprintJson,
	listInputConnectors,
	listOutputAdapters,
	registerInputConnector,
	registerOutputAdapter,
	runInputConnector,
	runOutputAdapter
} from '../plugins';
import { runStaticAudit } from '../workers/qa_audit';

describe('Blueprints, Connectors/Adapters, Dual-Spine MCP, and Static Audit', () => {
	test('blueprint export and re-import round-trips cleanly', () => {
		const bp = STARTER_BLUEPRINTS[0];
		const jsonArt = exportBlueprintArtifact(bp, 'json');
		const svelteArt = exportBlueprintArtifact(bp, 'svelte');
		const cssArt = exportBlueprintArtifact(bp, 'css');
		expect(svelteArt.content).toContain("from '@chronos-ui/svelte/");
		expect(cssArt.content).toContain('--ui-primary');
		const imported = importBlueprintJson(jsonArt.content);
		expect(imported.ok).toBe(true);
		if (imported.ok) expect(imported.blueprint.id).toBe(bp.id);
	});

	test('Input Connectors and Output Adapters support runtime registration for agent workflows', () => {
		expect(listInputConnectors().some((c) => c.id === 'json-blueprint')).toBe(true);
		expect(listOutputAdapters().some((a) => a.id === 'svelte')).toBe(true);
		registerInputConnector<string, string>({ id: 'test-upper', label: 'Upper', accept: 'text/plain', ingest: (s) => s.toUpperCase() });
		registerOutputAdapter<string, string>({ id: 'test-wrap', label: 'Wrap', mimeType: 'text/plain', emit: (s) => `[${s}]` });
		expect(runInputConnector<string, string>('test-upper', 'chronos')).toBe('CHRONOS');
		expect(runOutputAdapter<string, string>('test-wrap', 'ok')).toBe('[ok]');
	});

	test('declarative Studio command registry dispatches intents without if/else chains', () => {
		const dispatched: string[] = [];
		expect(listStudioCommands()).toContain('polarity');
		const out = executeStudioCommand('/polarity', {
			getState: () => ({ accessibility: { cornerMode: 'CHAMFER' }, helpTopic: 'composer' } as never),
			dispatch: (kind) => { dispatched.push(kind); return true; },
			openModal: () => {},
			startSpotlight: () => {},
			pushToast: () => {}
		});
		expect(out).toBe('Ran /polarity');
		expect(dispatched).toEqual(['UI_TOGGLE_POLARITY']);
	});

	test('Builder and Twin MCP JSON-RPC 2.0 handlers execute tools cleanly', async () => {
		const listRes = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
		expect('result' in listRes).toBe(true);
		const primRes = await handleBuilderMcpRpc({
			jsonrpc: '2.0',
			id: 2,
			method: 'tools/call',
			params: { name: 'ui_list_primitives', arguments: {} }
		});
		expect('result' in primRes).toBe(true);
		const twinRes = await handleTwinMcpRpc({
			jsonrpc: '2.0',
			id: 3,
			method: 'tools/call',
			params: { name: 'ui_twin_list_sessions', arguments: {} }
		}, null);
		expect('result' in twinRes).toBe(true);
	});

	test('Stage 1 static invariant audit reports 0 violations (including <= 42 LoC functions)', () => {
		const violations = runStaticAudit(process.cwd());
		expect(violations).toEqual([]);
	});
});

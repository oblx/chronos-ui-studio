import { describe, expect, test } from 'bun:test';
import {
	applyRadialDeadzone, createGamepadPollerState, createVoiceInputAdapter, detectGamepadProfile,
	processGamepadSnapshot, type SemanticInputAction, type SpeechRecognitionLike
} from '@chronos-ui/svelte';
import { existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CAPABILITY_BITS, findStarterSample, STARTER_SAMPLE_PROJECTS } from '../config';
import {
	applyJsonPatchWithInverse, DEFAULT_BUILD_CONFIG, derivePrototypeFromNode, documentGraphToNodeTree,
	evaluateGovernanceGate, instantiateFromPrototype, nodeTreeToDocumentGraph,
	planLocalAssistantPrompt, STUDIO_ROLE_MASKS, STUDIO_TOOL_REGISTRY
} from '../core';
import { handleBuilderMcpRpc } from '../mcp';
import { compileStaticClientBuild } from '../plugins';

describe('v0.0.3 RFC 6902 patcher, normalized graph & governance gate', () => {
	test('RFC 6902 forward and inverse patches roundtrip identically across all 6 ops', () => {
		const initial = { title: 'Deck', tags: ['a', 'b'], meta: { active: true } };
		const { doc, inverse } = applyJsonPatchWithInverse(initial, [
			{ op: 'test', path: '/title', value: 'Deck' },
			{ op: 'replace', path: '/title', value: 'Ops Deck' },
			{ op: 'add', path: '/tags/-', value: 'c' },
			{ op: 'copy', from: '/title', path: '/meta/copyTitle' },
			{ op: 'move', from: '/meta/active', path: '/meta/enabled' },
			{ op: 'remove', path: '/tags/0' }
		]);
		expect(doc.title).toBe('Ops Deck');
		expect(doc.tags).toEqual(['b', 'c']);
		const reverted = applyJsonPatchWithInverse(doc, inverse).doc;
		expect(reverted).toEqual(initial);
	});

	test('infinite prototype derivation, inheritance resolution & cycle/RBAC/XSS rejection', () => {
		const sample = findStarterSample('sample-neon-ops')!;
		const protoA = derivePrototypeFromNode(sample.nodes[1], 'Telemetry KPI');
		const protoB = derivePrototypeFromNode(instantiateFromPrototype(protoA, { props: { delta: '+99%' } }), 'Alert KPI', protoA.id);
		const instance = instantiateFromPrototype(protoB, { id: 'kpi-alert-1', props: { value: '99.9%' } });
		const graph = nodeTreeToDocumentGraph([...sample.nodes, instance], [protoA, protoB]);
		const tree = documentGraphToNodeTree(graph);
		const hydrated = tree.find((n) => n.id === 'kpi-alert-1')!;
		expect(hydrated.props.value).toBe('99.9%');
		expect(hydrated.props.delta).toBe('+99%');
		expect(evaluateGovernanceGate({ graph, actorCapabilityMask: STUDIO_ROLE_MASKS.BUILDER, requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS }).ok).toBe(true);
		expect(evaluateGovernanceGate({ graph, actorCapabilityMask: STUDIO_ROLE_MASKS.VIEWER, requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS }).ok).toBe(false);
		const cyclicGraph = { ...graph, prototypes: { a: { ...protoA, id: 'a', basePrototypeId: 'b' }, b: { ...protoB, id: 'b', basePrototypeId: 'a' } } };
		expect(evaluateGovernanceGate({ graph: cyclicGraph, actorCapabilityMask: STUDIO_ROLE_MASKS.ADMIN, requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS })).toEqual({ ok: false, code: 'PROTOTYPE_CYCLE', reason: 'Prototype inheritance cycle detected at a' });
		const xssGraph = { ...graph, nodes: { ...graph.nodes, bad: { ...graph.nodes['kpi-alert-1'], id: 'bad', label: '<script>alert(1)</script>' } } };
		expect(evaluateGovernanceGate({ graph: xssGraph, actorCapabilityMask: STUDIO_ROLE_MASKS.ADMIN, requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS }).ok).toBe(false);
	});
});

describe('v0.0.3 Tool Parity, Multimodal Voice & Xbox/DualSense Input, and Static Sample Export', () => {
	test('MCP tools/list matches STUDIO_TOOL_REGISTRY 1:1 with schemas and annotations', async () => {
		const rpc = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
		const tools = (rpc.result as unknown as { tools: readonly { name: string; inputSchema: unknown; annotations: unknown }[] }).tools;
		expect(tools.map((t) => t.name)).toEqual(STUDIO_TOOL_REGISTRY.map((t) => t.name));
		for (const t of tools) {
			expect(t.inputSchema).toBeDefined();
			expect(t.annotations).toBeDefined();
		}
		expect(STARTER_SAMPLE_PROJECTS.length).toBe(5);
	});

	test('mocked Web Speech VOICE_FINAL routes to Local Heuristic Engine and Xbox/DualSense snapshots map actions', () => {
		const captured: SemanticInputAction[] = [];
		let fakeRec: SpeechRecognitionLike | null = null;
		const voice = createVoiceInputAdapter({
			factory: () => {
				fakeRec = { continuous: false, interimResults: true, lang: 'en-US', onresult: null, onerror: null, onend: null, start: () => {}, stop: () => {} };
				return fakeRec;
			},
			onAction: (a) => captured.push(a)
		});
		expect(voice.start()).toBe(true);
		fakeRec!.onresult?.({ results: [{ isFinal: true, 0: { transcript: 'add a metric card' } }] });
		expect(captured[0]?.type).toBe('VOICE_FINAL');
		const turn = planLocalAssistantPrompt(captured[0].transcript ?? '');
		expect(turn.actions.some((t) => t.tool === 'ui_spawn_node')).toBe(true);

		expect(detectGamepadProfile('Xbox 360 Controller (Vendor: 045e Product: 028e)').id).toBe('xbox');
		expect(detectGamepadProfile('Sony DualSense Wireless Controller (054c:0ce6)').id).toBe('dualsense');
		expect(applyRadialDeadzone(0.1, 0.1)).toEqual({ x: 0, y: 0 });
		const state = createGamepadPollerState();
		const mkButtons = (downIdx: number) => Array.from({ length: 16 }, (_, i) => ({ pressed: i === downIdx, value: i === downIdx ? 1 : 0 }));
		const xboxFrame = processGamepadSnapshot({ index: 0, id: 'Xbox Wireless Controller 045e', buttons: mkButtons(4), axes: [0, 0, 0.8, 0] }, state, 100);
		expect(xboxFrame.profile.modality).toBe('XBOX');
		expect(xboxFrame.actions.some((a) => a.type === 'TAB_PREV')).toBe(true);
		expect(xboxFrame.actions.some((a) => a.type === 'PAN_DELTA')).toBe(true);
		const dsState = createGamepadPollerState();
		const dsFrame = processGamepadSnapshot({ index: 1, id: 'DualSense Wireless 054c:0ce6', buttons: mkButtons(0), axes: [0.9, 0, 0, 0] }, dsState, 200);
		expect(dsFrame.profile.modality).toBe('DUALSENSE');
		expect(dsFrame.actions.some((a) => a.type === 'CONFIRM')).toBe(true);
		expect(dsFrame.actions.some((a) => a.type === 'NAV_RIGHT')).toBe(true);
	});

	test('real Vite static-site-build compiles Neon Ops Command Deck with derived reusable blueprint', async () => {
		const sample = findStarterSample('sample-neon-ops')!;
		const derived = derivePrototypeFromNode(sample.nodes[2], 'Derived Ops Metric');
		const extraNode = instantiateFromPrototype(derived, { id: 'ops-derived-kpi', props: { value: '100%' } });
		const workDir = join(tmpdir(), `chronos-v003-export-${Date.now().toString(36)}`);
		const res = await compileStaticClientBuild({
			project: {
				id: 'proj-sample-ops', slug: 'neon-ops', name: sample.title, description: sample.tagline,
				themeId: sample.themeId, cornerMode: sample.cornerMode, activeRevisionId: 'rev-v003',
				nodes: [...sample.nodes, extraNode], buildConfig: DEFAULT_BUILD_CONFIG, updatedAt: Date.now()
			},
			workDir
		});
		expect(res.files.some((f) => f.endsWith('index.html'))).toBe(true);
		expect(existsSync(join(res.outDir, 'index.html'))).toBe(true);
		rmSync(workDir, { recursive: true, force: true });
	}, 30000);
});

import { describe, expect, test } from 'bun:test';
import {
	buildMorphableCornerPath, computeInscribedContentBox, computeSafeCorridorFromRects,
	generateUuidV7, isUuidV7, parseHardwareVidPid, shortUuid, THEME_PACKS, UI_FRAME_SHAPES, VERSION
} from '@chronos-ui/svelte';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findStarterSample } from '@studio/config';
import {
	DEFAULT_BUILD_CONFIG, derivePrototypeFromNode, documentGraphToNodeTree, instantiateFromPrototype,
	nodeTreeToDocumentGraph, patchWithTargetTag, planLocalAssistantPrompt, scoreToolsForPrompt, STUDIO_TOOL_REGISTRY
} from '@studio/core';
import { handleBuilderMcpRpc } from '@studio/mcp';
import { compileStaticClientBuild } from '@studio/plugins';
import { createStudioProject, handleProjectRoutes } from '@studio/server/routes';

describe('v0.0.5 UUID v7 registry, DB/REST/MCP parity, and sparse overrides', () => {
	test('RFC 9562 UUID v7 generator is strictly monotonic and formats 8-char short prefixes', () => {
		expect(VERSION).toBe('0.1.2');
		const ids = Array.from({ length: 16 }, () => generateUuidV7());
		for (let i = 0; i < ids.length; i += 1) {
			expect(isUuidV7(ids[i])).toBe(true);
			expect(shortUuid(ids[i]).length).toBe(8);
			if (i > 0) expect(ids[i] > ids[i - 1]).toBe(true);
		}
		expect(new Set(ids.map(shortUuid)).size).toBe(ids.length);
	});

	test('Drizzle ui_entities syncs on create/patch and REST + MCP expose full entity graph', async () => {
		const sample = findStarterSample('sample-shape-matrix')!;
		const freshNodes = sample.nodes.map((n) => ({ ...n, id: generateUuidV7(), ...(n.children ? { children: n.children.map((c) => ({ ...c, id: generateUuidV7() })) } : {}) }));
		const created = await createStudioProject({ name: 'v005 Entity Spec', themeId: sample.themeId, nodes: freshNodes });
		expect(isUuidV7(created.id)).toBe(true);
		const listRes = await handleProjectRoutes(new Request(`http://localhost/api/projects/${created.id}/entities`), `/api/projects/${created.id}/entities`);
		const listed = (await listRes!.json()) as { entities: { uuid: string; shape: string }[] };
		expect(listed.entities.length).toBeGreaterThanOrEqual(sample.nodes.length + 2);
		const targetUuid = listed.entities[0].uuid;
		const patchRes = await handleProjectRoutes(new Request(`http://localhost/api/entities/${targetUuid}`, {
			method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ label: 'Patched Matrix Root' })
		}), `/api/entities/${targetUuid}`);
		expect(patchRes!.status).toBe(200);
		const rpcTools = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 501, method: 'tools/list' });
		const tools = (rpcTools.result as unknown as { tools: { name: string }[] }).tools;
		expect(tools.length).toBeGreaterThanOrEqual(21);
		expect(STUDIO_TOOL_REGISTRY.length).toBeGreaterThanOrEqual(21);
		expect(tools.some((t) => t.name === 'ui_get_wireframe_skeleton')).toBe(true);
		const skel = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 502, method: 'tools/call', params: { name: 'ui_get_wireframe_skeleton', arguments: { projectId: created.id } } });
		expect(skel.error).toBeUndefined();
	});

	test('sparse instance overrides inherit prototype defaults and isolate deltas', () => {
		const sample = findStarterSample('sample-shape-matrix')!;
		const proto = derivePrototypeFromNode(sample.nodes[1], 'Matrix Metric Proto');
		const inst = instantiateFromPrototype(proto, { props: { value: '999 ms' } });
		expect(Object.keys(inst.props)).toEqual(['value', 'prototypeId']);
		const g0 = nodeTreeToDocumentGraph([inst], [proto]);
		const g1 = patchWithTargetTag(g0, inst.id, { subtitle: 'Live Override' }, 'INSTANCE');
		const tree = documentGraphToNodeTree(g1);
		expect(tree[0].props.subtitle).toBe('Live Override');
		expect(g1.prototypes[proto.id].defaultProps.subtitle).not.toBe('Live Override');
	});
});

describe('v0.0.5 morphable corners, safe corridors, tool scorer, hardware VID:PID, zero-timer & Vite export', () => {
	test('fixed-topology buildMorphableCornerPath preserves M + 4*L + 4*C + Z across all 3 modes', () => {
		for (const mode of ['CHAMFER', 'ROUND', 'STRAIGHT'] as const) {
			const p = buildMorphableCornerPath(260, 120, 10, [mode, mode, mode, mode]);
			expect(p.startsWith('M ')).toBe(true);
			expect(p.endsWith(' Z')).toBe(true);
			expect(p.match(/\bL /g)?.length).toBe(4);
			expect(p.match(/\bC /g)?.length).toBe(4);
		}
		for (const shape of UI_FRAME_SHAPES) {
			const box = computeInscribedContentBox(shape, 240, 120, 10);
			expect(box.topPx).toBeGreaterThan(0);
			expect(box.rightPx).toBeGreaterThan(0);
		}
	});

	test('2D safe corridor solver scales safely across 390px-2560px and 85%-130% root font sizes', () => {
		for (const [vw, vh] of [[390, 844], [820, 1180], [1440, 900], [2560, 1440]] as const) {
			for (const fontPx of [13.6, 16, 20.8]) {
				const c = computeSafeCorridorFromRects(vw, vh, true, [
					{ slot: 'TOP_CENTER', left: 10, top: 8, right: vw - 10, bottom: 56 },
					{ slot: 'BOTTOM_CENTER', left: 10, top: vh - 96, right: vw - 10, bottom: vh - 8 }
				], fontPx);
				expect(c.topPx).toBeGreaterThanOrEqual(64);
				expect(c.bottomPx).toBeGreaterThanOrEqual(104);
				expect(c.usableWidthPx).toBeGreaterThan(0);
			}
		}
	});

	test('schema-driven assistant scorer, hardware VID:PID parser, zero setInterval tooltip & Vite static build cleanup', async () => {
		const scored = scoreToolsForPrompt('add a telemetry metric card in center with chamfered corners');
		expect(scored[0].tool.name).toBe('ui_spawn_node');
		const plan = planLocalAssistantPrompt('switch theme to alabaster with round corners');
		expect(plan.actions.some((a) => a.tool === 'ui_switch_theme' || a.tool === 'ui_apply_theme')).toBe(true);
		expect(parseHardwareVidPid('Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)')).toEqual({ vendorId: '054c', productId: '0ce6' });
		expect(readFileSync(join(process.cwd(), 'packages/chronos-ui/src/machines/overlays/tooltip.machine.svelte.ts'), 'utf8')).not.toContain('setInterval');
		const sample = findStarterSample('sample-shape-matrix')!;
		const workDir = join(tmpdir(), `chronos-v005-export-${Date.now().toString(36)}`);
		try {
			const res = await compileStaticClientBuild({
				project: { id: generateUuidV7(), slug: 'shape-matrix', name: sample.title, description: sample.tagline, themeId: sample.themeId || THEME_PACKS[0].id, cornerMode: sample.cornerMode, activeRevisionId: generateUuidV7(), nodes: sample.nodes, buildConfig: DEFAULT_BUILD_CONFIG, updatedAt: Date.now() },
				workDir
			});
			expect(res.files.includes('index.html')).toBe(true);
			expect(existsSync(join(workDir, 'src-workspace'))).toBe(false);
		} finally {
			rmSync(workDir, { recursive: true, force: true });
		}
	}, 30000);
});

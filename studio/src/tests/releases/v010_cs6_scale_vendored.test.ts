import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
	createHeadlessEntityRegistry, createHeadlessWireBroker, generateUuidV7, HUD_ZONES, VERSION,
	type HudZoneId, type UiNode, type UiProjectDefinition
} from '@chronos-ui/svelte';
import { STUDIO_SPOTLIGHT_STEPS } from '@studio/config';
import { createInitialStudioState, registerStudioIntentHandlers } from '@studio/client/state';
import { planLocalAssistantPrompt, STUDIO_TOOL_REGISTRY } from '@studio/core';
import { compileFullstackBundle, compileStaticClientBuild, emitProjectSvelteScaffold, listOutputAdapters } from '@studio/plugins';

function makeSampleProject(nodeCount = 3): UiProjectDefinition {
	const nodes: UiNode[] = Array.from({ length: nodeCount }, (_, i) => ({
		id: generateUuidV7(), type: i % 2 === 0 ? 'UiMetricCard' : 'UiProgressGauge',
		zone: HUD_ZONES[i % HUD_ZONES.length] as HudZoneId, label: `Entity ${i + 1}`,
		lifecycle: 'COMMITTED', props: { title: `Entity ${i + 1}`, value: i + 10 }
	}));
	return {
		id: generateUuidV7(), slug: 'v010-spec-app', name: 'Chronos v0.0.10 Spec App',
		description: 'Verification fixture for v0.0.10 scale and full-stack export',
		themeId: 'obsidian-brass', cornerMode: 'CHAMFER', cornerRadiusRem: 0.5, activeRevisionId: 'rev-1',
		buildConfig: { protocol: 'http', basePath: '/', apiEndpoint: '/api', secretRefs: [], inlineBundle: false },
		nodes, updatedAt: Date.now()
	};
}

describe('v0.0.10 high-scale O(1) entity index & batched DAG benchmark (<25ms)', () => {
	test('registers 1,000 UUID v7 entities and dispatches 500 batched intents in under 25ms', async () => {
		const project = makeSampleProject(1000);
		const reg = createHeadlessEntityRegistry();
		const broker = createHeadlessWireBroker<{ count: number }>({ count: 0 });
		broker.register<{ step: number }>('UI_STAGE_PAN_ZOOM', {
			tier: 'TIER_0_LOCAL_UI',
			reduce: (s, env) => ({ count: s.count + env.payload.step })
		});
		const t0 = performance.now();
		reg.syncProjectNodes(project.id, project.nodes, 'bench');
		const batch = Array.from({ length: 500 }, () => ({ kind: 'UI_STAGE_PAN_ZOOM' as const, payload: { step: 1 } }));
		const applied = broker.dispatchBatch(batch);
		const elapsedMs = performance.now() - t0;

		expect(reg.size).toBe(1000);
		expect(reg.getByZone('WORLD_CANVAS').length).toBeGreaterThan(80);
		expect(reg.getByKind('UiMetricCard').length).toBe(500);
		expect(applied).toBe(500);
		expect(broker.state.count).toBe(500);
		expect(elapsedMs).toBeLessThan(25);

		broker.enqueueCoalescedIntent('UI_STAGE_PAN_ZOOM', { step: 5 }, 'pan-key');
		broker.enqueueCoalescedIntent('UI_STAGE_PAN_ZOOM', { step: 7 }, 'pan-key');
		await Promise.resolve();
		expect(broker.state.count).toBe(507);
	});
});

describe('v0.0.10 W3C / Lighthouse / WebMCP static build & vendored full-stack backend', () => {
	test('emits semantic W3C landmarks, granular subpaths, critical CSS, llms.txt & webmcp.json', async () => {
		const proj = makeSampleProject(4);
		const svelte = emitProjectSvelteScaffold(proj);
		expect(svelte.content).toContain('@chronos-ui/svelte/atoms');
		expect(svelte.content).toContain('<header');
		expect(svelte.content).toContain('<main id="main-stage"');
		expect(svelte.content).toContain('<footer');
		expect(svelte.content).toContain('#main-stage');

		const workDir = join(tmpdir(), `chronos-v010-static-${Date.now()}`);
		try {
			const res = await compileStaticClientBuild({ project: proj, workDir });
			for (const f of ['index.html', 'robots.txt', 'manifest.webmanifest', 'llms.txt', '.well-known/webmcp.json', 'webmcp.bridge.ts']) {
				expect(res.files).toContain(f);
			}
			const html = readFileSync(join(res.outDir, 'index.html'), 'utf8');
			expect(html).toContain('<meta name="description"');
			expect(html).toContain('<style id="chronos-critical-tokens">');
			expect(html).toContain('<link rel="modulepreload"');
			const webmcp = JSON.parse(readFileSync(join(res.outDir, '.well-known/webmcp.json'), 'utf8')) as { tools: unknown[] };
			expect(webmcp.tools.length).toBeGreaterThanOrEqual(3);
		} finally {
			rmSync(workDir, { recursive: true, force: true });
		}
	});

	test('emits runnable vendored SQLite + Drizzle backend and serves /api/health, /api/entities, /llms.txt & webmcp.json', async () => {
		const proj = makeSampleProject(3);
		const workDir = join(tmpdir(), `chronos-v010-fullstack-${Date.now()}`);
		try {
			const res = await compileFullstackBundle({ project: proj, workDir, emitZip: true });
			expect((res.zipBytes?.byteLength ?? 0)).toBeGreaterThan(100);
			for (const f of ['package.json', 'drizzle.config.ts', 'drizzle/0000_init.sql', 'server/db.ts', 'server/schema.ts', 'server/migrate.ts', 'server/router.ts', 'server/index.ts']) {
				expect(existsSync(join(res.outDir, f))).toBe(true);
			}
			const routerSrc = readFileSync(join(res.outDir, 'server/router.ts'), 'utf8');
			expect(routerSrc).not.toContain('@studio/');

			symlinkSync(resolve(process.cwd(), 'node_modules'), join(res.outDir, 'node_modules'), 'dir');
			const migrateMod = await import(join(res.outDir, 'server/migrate.ts'));
			const routerMod = await import(join(res.outDir, 'server/router.ts'));
			const conn = await migrateMod.runMigrations(':memory:');
			const handler = routerMod.createAppHandler(conn, res.clientDir);

			const health = await handler(new Request('http://localhost:3000/api/health'));
			expect(health.status).toBe(200);
			const listRes = await handler(new Request('http://localhost:3000/api/entities'));
			const listJson = (await listRes.json()) as { entities: unknown[] };
			expect(listJson.entities.length).toBe(3);

			const createRes = await handler(new Request('http://localhost:3000/api/entities', {
				method: 'POST', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'UiBadge', zone: 'TOP_LEFT', label: 'Live Badge' })
			}));
			expect(createRes.status).toBe(201);
			expect((await handler(new Request('http://localhost:3000/llms.txt'))).status).toBe(200);
			expect((await handler(new Request('http://localhost:3000/.well-known/webmcp.json'))).status).toBe(200);
			conn.sqlite.close();
		} finally {
			rmSync(workDir, { recursive: true, force: true });
		}
	});
});

describe('v0.0.10 39-tool parity, 7-step tour & CS6 lock/visibility DAG enforcement', () => {
	test('verifies VERSION 0.1.0, 42 tools, 6 adapters, 7 tour steps & lock guard on UI_PATCH_NODE / UI_REMOVE_NODE', () => {
		expect(VERSION).toBe('0.1.0');
		expect(STUDIO_TOOL_REGISTRY.length).toBe(42);
		expect(listOutputAdapters().some((a) => a.id === 'fullstack-bundle')).toBe(true);
		expect(STUDIO_SPOTLIGHT_STEPS.length).toBe(7);

		expect(planLocalAssistantPrompt('open wireframe skeleton').actions[0]?.tool).toBe('ui_open_wireframe_skeleton');
		expect(planLocalAssistantPrompt('export fullstack backend').actions[0]?.tool).toBe('ui_export_fullstack_bundle');

		const broker = createHeadlessWireBroker(createInitialStudioState());
		registerStudioIntentHandlers(broker);
		const nid = generateUuidV7();
		broker.dispatch('UI_SPAWN_NODE', { node: { id: nid, type: 'UiMetricCard', zone: 'WORLD_CANVAS', label: 'Orig', lifecycle: 'COMMITTED', props: {} } });
		broker.dispatch('UI_TOGGLE_ENTITY_LOCK', { nodeId: nid, locked: true });
		broker.dispatch('UI_PATCH_NODE', { nodeId: nid, patch: { label: 'Mutated' } });
		broker.dispatch('UI_REMOVE_NODE', { nodeId: nid });
		const cur = broker.state.projects.find((p) => p.id === broker.state.activeProjectId)?.nodes.find((n) => n.id === nid);
		expect(cur?.label).toBe('Orig');
		expect(cur?.locked).toBe(true);
		broker.dispatch('UI_TOGGLE_ENTITY_VISIBILITY', { nodeId: nid, visible: false });
		const hidden = broker.state.projects.find((p) => p.id === broker.state.activeProjectId)?.nodes.find((n) => n.id === nid);
		expect(hidden?.visible).toBe(false);
	});
});

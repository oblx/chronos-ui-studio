import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import { planLocalAssistantPrompt } from '@studio/core';
import { decryptSecret, encryptSecret, getStudioDb, uiProjectRevisions, uiProjects } from '@studio/lib';
import { getLiveMcpManifest, handleBuilderMcpRpc } from '@studio/mcp';
import {
	compileStaticClientBuild, emitProjectCssTokens, emitProjectJsonBundle, emitProjectSvelteScaffold,
	emitProjectZipBundle, ingestCloudRemote, ingestGitRemote, ingestSshRemote, ingestZipArchive,
	listInputConnectors, listOutputAdapters, packZipFiles, parseMermaidWireframe
} from '@studio/plugins';
import { createStudioProject, loadProjectWithNodes } from '@studio/server/routes/routes.projects';

async function callMcpTool(name: string, args: Record<string, unknown>) {
	const res = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } });
	if (!('result' in res)) throw new Error(res.error.message);
	const payload = res.result as { content?: { text: string }[] };
	return JSON.parse(payload.content?.[0]?.text ?? '{}');
}

describe('v0.0.2 Calm Genesis, Local Agent, Multi-Project Sync, Connectors & Static Vite Build', () => {
	test('zero-config Local Heuristic Engine plans live MCP tools without API keys', () => {
		const plan = planLocalAssistantPrompt('build a minimal telemetry dashboard');
		expect(plan.actions.length).toBeGreaterThanOrEqual(3);
		expect(plan.actions[0].tool).toBe('ui_spawn_node');
		const commitPlan = planLocalAssistantPrompt('/commit');
		expect(commitPlan.actions[0].tool).toBe('ui_commit_node');
	});

	test('AEAD vault encrypts and decrypts AI provider secrets without plaintext leaks', async () => {
		const raw = 'sk-test-chronos-ephemeral-token-002';
		const sealed = await encryptSecret(raw);
		expect(sealed).not.toContain(raw);
		expect(await decryptSecret(sealed)).toBe(raw);
	});

	test('all 6 input connectors and 5 output adapters register and enforce security guards', async () => {
		const cIds = listInputConnectors().map((c) => c.id);
		const aIds = listOutputAdapters().map((a) => a.id);
		for (const id of ['json-project', 'mermaid-wireframe', 'zip-archive', 'git-remote', 'ssh-remote', 'cloud-remote']) {
			expect(cIds).toContain(id);
		}
		for (const id of ['static-site-build', 'svelte-scaffold', 'css-tokens', 'json-blueprint', 'zip-bundle']) {
			expect(aIds).toContain(id);
		}
		const manifest = getLiveMcpManifest();
		expect(manifest.connectors.length).toBeGreaterThanOrEqual(6);
		expect(manifest.adapters.length).toBeGreaterThanOrEqual(5);

		const mermaid = parseMermaidWireframe('graph TD\nA[Telemetry Header] --> B[Latency Gauge]\nB --> C[Event Radar]', 'Mermaid Ops');
		expect(mermaid.ok).toBe(true);
		if (mermaid.ok) expect(mermaid.project.nodes.length).toBe(3);

		const sshBad = ingestSshRemote({ host: '127.0.0.1;rm -rf /', repoPath: '/opt/ui', keyProfileId: 'k-1' });
		expect(sshBad.ok).toBe(false);
		const sshGood = ingestSshRemote({ host: 'build.chronos.local', repoPath: '/srv/app/ui.git', keyProfileId: 'k-1', dryRun: true });
		expect(sshGood.ok).toBe(true);

		const cloudBlocked = await ingestCloudRemote({ url: 'http://169.254.169.254/latest/meta-data' });
		expect(cloudBlocked.ok).toBe(false);
		const gitDry = await ingestGitRemote({ repoUrl: 'https://github.com/chronos-ui/demo', dryRun: true });
		expect(gitDry.ok).toBe(true);
	});

	test('multi-project MCP pipeline + ZIP roundtrip + real verified Vite static-site-build', async () => {
		const created = await createStudioProject({ name: 'Stage 3 Export Proof', description: '3-zone verified client app' });
		await callMcpTool('ui_spawn_node', { projectId: created.id, type: 'UiHeaderBar', zone: 'TOP_CENTER', label: 'Proof Header', props: { title: 'Verified Static App', tabs: 'Home,Telemetry' } });
		await callMcpTool('ui_spawn_node', { projectId: created.id, type: 'UiMetricCard', zone: 'WORLD_CANVAS', label: 'Throughput', props: { title: 'Throughput', value: '60 FPS', delta: 'Nominal' } });
		await callMcpTool('ui_spawn_node', { projectId: created.id, type: 'UiProgressGauge', zone: 'BOTTOM_LEFT', label: 'Budget', props: { label: 'RAM Budget', value: 64, max: 100 } });
		await callMcpTool('ui_commit_node', { projectId: created.id });

		const hydrated = await loadProjectWithNodes(created.id);
		expect(hydrated).not.toBeNull();
		expect(hydrated!.nodes.length).toBe(3);
		expect(hydrated!.nodes.every((n) => n.lifecycle === 'COMMITTED')).toBe(true);

		expect(emitProjectSvelteScaffold(hydrated!).content).toContain("from '@chronos-ui/svelte/");
		expect(emitProjectCssTokens(hydrated!).content).toContain('--ui-primary');
		const jsonBundle = emitProjectJsonBundle(hydrated!);
		expect(jsonBundle.content).toContain(created.id);

		const zipOut = emitProjectZipBundle(hydrated!);
		expect(zipOut.bytes.byteLength).toBeGreaterThan(200);
		const roundTripZip = ingestZipArchive(packZipFiles([{ path: 'project.json', content: new TextEncoder().encode(jsonBundle.content) }]));
		expect(roundTripZip.ok).toBe(true);

		const workDir = join(tmpdir(), `chronos-stage3-test-${Date.now().toString(36)}`);
		try {
			const build = await compileStaticClientBuild({ project: hydrated!, workDir });
			expect(build.files).toContain('index.html');
			expect(build.files).toContain('runtime.config.schema.json');
			expect(build.files).toContain('.env.example');
			expect(build.files.some((f) => f.endsWith('.js'))).toBe(true);
			expect(build.files.some((f) => f.endsWith('.css'))).toBe(true);
			expect(existsSync(build.runtimeSchemaPath)).toBe(true);
			const html = readFileSync(join(build.outDir, 'index.html'), 'utf8');
			expect(html).toContain('Stage 3 Export Proof');
			const envExample = readFileSync(build.envExamplePath, 'utf8');
			expect(envExample).not.toContain('sk-test-');
			expect(envExample).not.toContain('chr_live_');
		} finally {
			rmSync(workDir, { recursive: true, force: true });
			const db = await getStudioDb();
			await db.delete(uiProjectRevisions).where(eq(uiProjectRevisions.projectId, created.id));
			await db.delete(uiProjects).where(eq(uiProjects.id, created.id));
		}
	}, 30000);
});

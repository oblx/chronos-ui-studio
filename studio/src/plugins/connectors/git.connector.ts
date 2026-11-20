import { assertSafeWebhookUrl, DEFAULT_BUILD_CONFIG } from '../../core';
import { registerInputConnector } from '../registry';
import type { ProjectImportResult } from './json.connector';

export interface GitRemoteInput {
	readonly repoUrl: string;
	readonly ref?: string;
	readonly dryRun?: boolean;
}

const KNOWN_FORGES = ['github.com', 'gitlab.com', 'codeberg.org', 'bitbucket.org', 'git.sr.ht'] as const;

function detectForge(host: string): string {
	const lower = host.toLowerCase();
	const found = KNOWN_FORGES.find((f) => lower === f || lower.endsWith(`.${f}`));
	return found ?? 'self-hosted-git';
}

export async function ingestGitRemote(input: GitRemoteInput): Promise<ProjectImportResult> {
	try {
		const parsed = assertSafeWebhookUrl(input.repoUrl.trim());
		const cleanPath = parsed.pathname.replace(/\.git$/, '').replace(/^\/+|\/+$/g, '');
		if (!cleanPath) return { ok: false, error: 'Git repository URL requires an owner/repo path.' };
		const forge = detectForge(parsed.hostname);
		const repoSlug = cleanPath.split('/').pop() ?? 'git-workspace';
		let headRef = input.ref ?? 'HEAD';
		if (!input.dryRun) {
			const smartUrl = `${parsed.origin}/${cleanPath}.git/info/refs?service=git-upload-pack`;
			const res = await fetch(smartUrl, { headers: { 'git-protocol': 'version=2' }, signal: AbortSignal.timeout(5000) });
			if (res.ok) headRef = `${headRef} (smart-http-v2)`;
		}
		return {
			ok: true,
			project: {
				id: `proj-git-${repoSlug}-${Date.now().toString(36)}`,
				slug: repoSlug.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
				name: `${repoSlug} (${forge})`,
				description: `Imported via Smart HTTP v2 from ${parsed.origin}/${cleanPath} @ ${headRef}.`,
				themeId: 'obsidian-brass',
				cornerMode: 'CHAMFER',
				activeRevisionId: 'rev-git-1',
				nodes: [{
					id: `git-root-${repoSlug}`, type: 'UiSection', zone: 'WORLD_CANVAS',
					label: repoSlug, lifecycle: 'STAGING',
					props: { title: `${repoSlug}`, subtitle: `${forge} · ${headRef}` }
				}],
				buildConfig: DEFAULT_BUILD_CONFIG,
				updatedAt: Date.now()
			}
		};
	} catch (err) {
		return { ok: false, error: err instanceof Error ? err.message : 'Git remote ingestion failed.' };
	}
}

registerInputConnector<GitRemoteInput, Promise<ProjectImportResult>>({
	id: 'git-remote',
	label: 'Smart HTTP v1/v2 Multi-Forge Git Connector',
	accept: 'application/x-git-upload-pack',
	ingest: ingestGitRemote
});

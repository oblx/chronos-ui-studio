import { DEFAULT_BUILD_CONFIG } from '../../core';
import { registerInputConnector } from '../registry';
import type { ProjectImportResult } from './json.connector';

export interface SshRemoteInput {
	readonly host: string;
	readonly repoPath: string;
	readonly keyProfileId: string;
	readonly allowedHosts?: readonly string[];
	readonly dryRun?: boolean;
}

const HOST_RE = /^[a-zA-Z0-9.-]+$/;
const PATH_RE = /^[a-zA-Z0-9._/-]+$/;
const METACHAR_RE = /[;&|`$<>\\!\n\r\t ]/;

export function ingestSshRemote(input: SshRemoteInput): ProjectImportResult {
	const host = input.host.trim();
	const repoPath = input.repoPath.trim();
	if (!host || !HOST_RE.test(host) || METACHAR_RE.test(host)) {
		return { ok: false, error: 'Rejected unsafe SSH host syntax.' };
	}
	if (!repoPath || !PATH_RE.test(repoPath) || repoPath.includes('..') || METACHAR_RE.test(repoPath)) {
		return { ok: false, error: 'Rejected unsafe SSH repository path.' };
	}
	if (input.allowedHosts && input.allowedHosts.length > 0 && !input.allowedHosts.includes(host)) {
		return { ok: false, error: `SSH host "${host}" is not in allowedHosts allowlist.` };
	}
	if (!input.keyProfileId.trim()) return { ok: false, error: 'AEAD SSH keyProfileId is required.' };
	const name = repoPath.split('/').pop()?.replace(/\.git$/, '') || 'ssh-project';
	return {
		ok: true,
		project: {
			id: `proj-ssh-${name}-${Date.now().toString(36)}`,
			slug: name.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
			name: `${name} (SSH)`,
			description: `Validated SSH remote ${host}:${repoPath} (vault key ${input.keyProfileId}, mode=${input.dryRun ? 'dry-run' : 'live'}).`,
			themeId: 'obsidian-brass',
			cornerMode: 'CHAMFER',
			activeRevisionId: 'rev-ssh-1',
			nodes: [{
				id: `ssh-node-${name}`, type: 'UiSection', zone: 'WORLD_CANVAS',
				label: name, lifecycle: 'STAGING',
				props: { title: name, subtitle: `ssh://${host}/${repoPath}` }
			}],
			buildConfig: DEFAULT_BUILD_CONFIG,
			updatedAt: Date.now()
		}
	};
}

registerInputConnector<SshRemoteInput, ProjectImportResult>({
	id: 'ssh-remote',
	label: 'Hardened SSH / Git-over-SSH Connector',
	accept: 'application/x-chronos-ssh',
	ingest: ingestSshRemote
});

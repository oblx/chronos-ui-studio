import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exportJobs, getStudioDb } from '../../lib';
import {
	compileStaticClientBuild, emitProjectCssTokens, emitProjectJsonBundle, emitProjectSvelteScaffold,
	emitProjectZipBundle, listInputConnectors, listOutputAdapters, runInputConnector, type ProjectImportResult
} from '../../plugins';
import { pushServerTrace } from '../server.telemetry';
import { HTTP_STATUS, jsonErr, jsonOk, readJsonBody } from './http.helpers';
import { createStudioProject, loadProjectWithNodes } from './routes.projects';

async function handlePipelineExport(req: Request): Promise<Response> {
	const body = await readJsonBody<{ projectId: string; adapterId: string }>(req);
	const project = await loadProjectWithNodes(body.projectId || 'proj-genesis');
	if (!project) return jsonErr('Project not found', HTTP_STATUS.NOT_FOUND);
	const db = await getStudioDb();
	if (body.adapterId === 'static-site-build') {
		const workDir = join(tmpdir(), `chronos-static-${project.slug}-${Date.now().toString(36)}`);
		const build = await compileStaticClientBuild({ project, workDir });
		await db.insert(exportJobs).values({
			id: `exp-${Date.now().toString(36)}`, projectId: project.id, adapterId: build.adapterId,
			checksum: build.checksum, artifactMetaJson: JSON.stringify({ files: build.files, outDir: build.outDir }), createdAt: Date.now()
		});
		return jsonOk({ build });
	}
	if (body.adapterId === 'zip-bundle') {
		const zip = emitProjectZipBundle(project);
		return jsonOk({ adapterId: zip.adapterId, filename: zip.filename, entries: zip.entries, byteLength: zip.bytes.length, base64: Buffer.from(zip.bytes).toString('base64') });
	}
	const artifact = body.adapterId === 'css-tokens' ? emitProjectCssTokens(project)
		: body.adapterId === 'json-blueprint' ? emitProjectJsonBundle(project)
		: emitProjectSvelteScaffold(project);
	return jsonOk({ artifact });
}

export async function handlePipelineRoutes(req: Request, path: string): Promise<Response | null> {
	if (path === '/api/pipelines/catalog' && req.method === 'GET') {
		return jsonOk({ connectors: listInputConnectors(), adapters: listOutputAdapters() });
	}
	if (path === '/api/pipelines/import' && req.method === 'POST') {
		const body = await readJsonBody<{ connectorId: string; payload: unknown }>(req);
		try {
			const res = await runInputConnector<unknown, ProjectImportResult | Promise<ProjectImportResult>>(body.connectorId, body.payload);
			if (!res.ok) return jsonErr(res.error, HTTP_STATUS.BAD_REQUEST);
			const saved = await createStudioProject({
				name: res.project.name, description: res.project.description,
				themeId: res.project.themeId, nodes: res.project.nodes
			});
			pushServerTrace('STUDIO_COMMAND_EXEC', `Imported via ${body.connectorId} -> ${saved.slug}`, 1.1, true, 'USER');
			return jsonOk({ project: saved }, HTTP_STATUS.CREATED);
		} catch (err) {
			return jsonErr(err instanceof Error ? err.message : 'Connector failed', HTTP_STATUS.BAD_REQUEST);
		}
	}
	if (path === '/api/pipelines/export' && req.method === 'POST') return handlePipelineExport(req);
	return null;
}

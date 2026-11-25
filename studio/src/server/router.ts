import { CAPABILITY_BITS } from '../config';
import { getLiveMcpManifest, handleBuilderMcpRpc, handleTwinMcpRpc, MCP_MANIFEST, type JsonRpcRequest } from '../mcp';
import { requireCapability, resolvePrincipal } from './auth.middleware';
import {
	handleAiRoutes, handleCursorRoutes, handleLifecycleRoutes, handlePipelineRoutes,
	handleProjectRoutes, HTTP_STATUS, jsonErr, jsonOk, readJsonBody
} from './routes';
import { handleAuthRoutes } from './routes.auth';
import { handleBlueprintRoutes, handleThemeRoutes } from './catalog';
import { handleWebhookRoutes } from './routes.webhooks';
import { getServerTraces } from './server.telemetry';
import { handleCollabHttp } from './ws.collab';

async function handleMcpAndWireRoutes(req: Request, path: string): Promise<Response | null> {
	if (path === '/api/mcp/manifest' && req.method === 'GET') return jsonOk(getLiveMcpManifest());
	if (path === '/api/mcp' && req.method === 'POST') {
		return jsonOk(await handleBuilderMcpRpc(await readJsonBody<JsonRpcRequest>(req)));
	}
	if (path === '/api/mcp/twin' && req.method === 'POST') {
		const principal = await resolvePrincipal(req);
		return jsonOk(await handleTwinMcpRpc(await readJsonBody<JsonRpcRequest>(req), principal));
	}
	if (path === '/api/wire/traces' && req.method === 'GET') {
		const principal = await resolvePrincipal(req);
		const guard = requireCapability(principal, CAPABILITY_BITS.ADMIN_WIRE_OBSERVE);
		return guard ?? jsonOk({ traces: getServerTraces() });
	}
	return null;
}

export async function dispatchApiRequest(req: Request): Promise<Response | null> {
	const path = new URL(req.url).pathname;
	if (!path.startsWith('/api/')) return null;
	if (path === '/api/health') return jsonOk({ ok: true, runtime: 'bun', version: MCP_MANIFEST.version });
	const handlers = [
		handleAuthRoutes, handleLifecycleRoutes, handleProjectRoutes, handleCursorRoutes,
		handleAiRoutes, handlePipelineRoutes, handleThemeRoutes, handleBlueprintRoutes,
		handleWebhookRoutes, handleCollabHttp, handleMcpAndWireRoutes
	];
	for (const handler of handlers) {
		const res = await handler(req, path);
		if (res) return res;
	}
	return jsonErr(`Unknown API route: ${path}`, HTTP_STATUS.NOT_FOUND);
}

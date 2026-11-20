import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createServer, type ViteDevServer } from 'vite';
import { STUDIO_CONFIG } from '../config';
import { getStudioDb } from '../lib';
import { dispatchApiRequest } from './router';
import { pushServerTrace } from './server.telemetry';
import { collabWebsocketHandlers } from './ws.collab';

const DIST_DIR = join(process.cwd(), 'dist');

async function proxyToVite(req: Request, vitePort: number): Promise<Response> {
	const url = new URL(req.url);
	const target = `http://127.0.0.1:${vitePort}${url.pathname}${url.search}`;
	try {
		return await fetch(target, { method: req.method, headers: req.headers, body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req.body });
	} catch {
		return new Response('Vite dev upstream starting...', { status: 503 });
	}
}

async function serveStaticDist(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const rel = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/, '');
	const candidate = join(DIST_DIR, rel);
	if (existsSync(candidate) && Bun.file(candidate).size > 0) {
		return new Response(Bun.file(candidate));
	}
	return new Response(Bun.file(join(DIST_DIR, 'index.html')));
}

export async function startStudioServer() {
	await getStudioDb();
	const isDev = process.env.DEVMODE === 'true' || !existsSync(join(DIST_DIR, 'index.html'));
	let viteServer: ViteDevServer | null = null;
	if (isDev) {
		viteServer = await createServer({ server: { port: STUDIO_CONFIG.viteDevPort, host: '127.0.0.1', strictPort: false, hmr: false } });
		await viteServer.listen();
	}
	const port = Number(process.env.PORT ?? STUDIO_CONFIG.defaultPort);
	const vitePort = viteServer?.config.server.port ?? STUDIO_CONFIG.viteDevPort;
	const server = Bun.serve<{ sessionId: string }>({
		port,
		hostname: '0.0.0.0',
		async fetch(req, srv) {
			const url = new URL(req.url);
			if (url.pathname === '/api/ws/collab' && req.headers.get('upgrade')?.toLowerCase() === 'websocket') {
				const sessionId = url.searchParams.get('sessionId') ?? `ws-${Date.now().toString(36)}`;
				if (srv.upgrade(req, { data: { sessionId } })) return undefined;
			}
			const apiRes = await dispatchApiRequest(req);
			if (apiRes) return apiRes;
			return isDev ? proxyToVite(req, vitePort) : serveStaticDist(req);
		},
		websocket: collabWebsocketHandlers
	});
	pushServerTrace('STUDIO_COMMAND_EXEC', `Studio server listening on :${port}`, 0.1);
	return { server, viteServer };
}

if (import.meta.main) {
	void startStudioServer();
}
